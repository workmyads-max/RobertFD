/**
 * adminApproveWithdrawal — Backend-secured admin withdrawal processing
 *
 * Handles both APPROVE and REJECT actions.
 *
 * APPROVE:
 *   1. Admin role check
 *   2. Withdrawal not already approved/paid (duplicate protection)
 *   3. Recalculate with overrides (split %, fee)
 *   4. final_amount = trader_share - fee (NO affiliate deduction — the affiliate
 *      reward is a company-side expense handled by processPayoutRewardCommission)
 *   5. Send user notification (scoped to user_email, never null)
 *   6. First payout certificate (idempotent)
 *   7. Audit trail via StaffActivityLog
 *   8. Affiliate commission is delegated to the processPayoutRewardCommission
 *      entity automation (fires on status → "approved")
 *
 * REJECT:
 *   1. Set status to rejected
 *   2. Send user notification
 *   3. Audit trail
 *   4. NO affiliate commission
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { withdrawal_id, action, override_split_pct, override_fee, admin_notes, rejection_reason } = body;

    if (!withdrawal_id) return Response.json({ error: 'withdrawal_id required' }, { status: 400 });

    const sr = base44.asServiceRole;

    // Fetch the withdrawal by internal entity id
    let w;
    try {
      w = await sr.entities.WithdrawalRequest.get(withdrawal_id);
    } catch {
      return Response.json({ error: 'Withdrawal not found' }, { status: 404 });
    }
    if (!w) return Response.json({ error: 'Withdrawal not found' }, { status: 404 });

    // Duplicate protection — cannot approve already approved/paid
    if (w.status === 'approved' || w.status === 'paid') {
      return Response.json({
        error: `Cannot process: withdrawal is already ${w.status}`,
      }, { status: 409 });
    }

    // ── REJECT ACTION ───────────────────────────────────────────────────────
    if (action === 'reject') {
      await sr.entities.WithdrawalRequest.update(w.id, {
        status: 'rejected',
        admin_notes: admin_notes || rejection_reason || w.admin_notes || '',
      });

      // Unlock the account so the trader can resume trading (payout declined).
      // Affiliate payouts (account_id='affiliate') have no account to unlock.
      if (w.account_id && w.account_id !== 'affiliate') {
        try {
          const accs = await sr.entities.ChallengeAccount.filter({ account_id: w.account_id });
          const acc = accs[0];
          if (acc && !acc.is_trashed) {
            await sr.entities.ChallengeAccount.update(acc.id, { can_trade: true });

            // Re-enable at MT5 broker level — move account back to its original group
            if (acc.mt_login && acc.mt_group) {
              try {
                const providers = await sr.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
                const mt5 = providers[0];
                const mt5Base = mt5?.server_url || Deno.env.get('MT5_API_BASE_URL');
                const mt5Key  = mt5?.api_key     || Deno.env.get('MT5_API_KEY');
                const mgrLogin = mt5?.manager_login || '';
                const mgrPass  = mt5?.manager_password || '';
                if (mt5Base && mt5Key && mgrLogin && mgrPass) {
                  const mt5Headers = {
                    'Content-Type': 'application/json',
                    'ApiKey': mt5Key,
                    'ManagerLogin': mgrLogin,
                    'ManagerPassword': mgrPass,
                  };
                  // Tritech: move account back to its original group to re-enable trading
                  const reEnableRes = await fetch(`${mt5Base}/api/v1/user/move-group`, {
                    method: 'POST', headers: mt5Headers,
                    body: JSON.stringify({ Login: parseInt(acc.mt_login), Group: acc.mt_group, apikey: mt5Key }),
                  });
                  const reEnableData = await reEnableRes.json().catch(() => ({}));
                  const rErrCode = reEnableData?.data?.errorcode;
                  if (rErrCode != null && rErrCode !== 0 && rErrCode !== 10009) {
                    console.warn(`[adminApproveWithdrawal] MT5 move-group returned errorcode=${rErrCode} for ${acc.mt_login} — admin may need to re-enable manually on MT5 Manager`);
                  } else {
                    console.log(`[adminApproveWithdrawal] ✅ MT5 account ${acc.mt_login} re-enabled (moved back to group ${acc.mt_group})`);
                  }
                }
              } catch (e) {
                console.warn(`[adminApproveWithdrawal] MT5 re-enable failed (non-blocking) for ${acc.mt_login}:`, e.message);
              }
            }
          }
        } catch (e) { console.error('adminApproveWithdrawal: unlock failed (non-blocking):', e.message); }
      }

      // Notify the user — scoped to their email, never null
      if (w.user_email) {
        await sr.entities.Notification.create({
          user_email: w.user_email,
          title: 'Withdrawal Request Update',
          message: `Your withdrawal request of $${(w.amount || 0).toLocaleString()} has been reviewed and was not approved. ${admin_notes || rejection_reason ? 'Reason: ' + (admin_notes || rejection_reason) : 'Please contact support if you have questions.'}`,
          type: 'system',
          priority: 'high',
          display_mode: 'popup',
          is_active: true,
          target: 'all',
        });
      }

      // Audit trail
      await sr.entities.StaffActivityLog.create({
        staff_email: user.email,
        staff_name: user.full_name || user.email,
        role_name: user.role,
        action: 'reject_withdrawal',
        action_category: 'payouts',
        target_entity: 'WithdrawalRequest',
        target_id: w.id,
        target_user_email: w.user_email,
        details: { withdrawal_id: w.id, amount: w.amount, reason: admin_notes || rejection_reason || '' },
        status: 'success',
      });

      return Response.json({ success: true, withdrawal_id: w.id, status: 'rejected' });
    }

    // ── APPROVE ACTION (default) ────────────────────────────────────────────

    // Recalculate with overrides or stored values.
    // Affiliate withdrawals (Track B) have NO profit split — the affiliate keeps
    // 100% of their commission minus the flat 5% processing fee set at request time.
    const gross = w.amount || 0;
    const isAffiliate = w.account_id === 'affiliate';
    const splitPct = isAffiliate ? 100 : (override_split_pct ?? w.profit_split_pct ?? 80);
    const fee = isAffiliate
      ? (w.withdrawal_fee ?? parseFloat((gross * 0.05).toFixed(2)))
      : (override_fee ?? w.withdrawal_fee ?? 25);
    const traderShare = parseFloat((gross * (splitPct / 100)).toFixed(2));
    const companyShare = parseFloat((gross - traderShare).toFixed(2));
    // NO affiliate deduction from trader's payout — affiliate reward is a
    // company-side expense handled by processPayoutRewardCommission.
    const finalAmount = parseFloat(Math.max(0, traderShare - fee).toFixed(2));

    // Update withdrawal to approved
    await sr.entities.WithdrawalRequest.update(w.id, {
      status: 'approved',
      profit_split_pct: splitPct,
      trader_share: traderShare,
      company_share: companyShare,
      affiliate_reward: 0, // Set by processPayoutRewardCommission, not here
      withdrawal_fee: fee,
      final_amount: finalAmount,
      admin_notes: admin_notes || w.admin_notes || '',
    });

    // NOTE: The payout-reward affiliate commission is intentionally NOT handled
    // here. It is owned exclusively by the `processPayoutRewardCommission`
    // function, triggered by an entity automation whenever a WithdrawalRequest's
    // status becomes "approved". That keeps the payout-reward logic in a single,
    // idempotent place. Do not re-add commission creation here.

    // Notify the user — scoped to their email, never null
    if (w.user_email) {
      await sr.entities.Notification.create({
        user_email: w.user_email,
        title: '✅ Withdrawal Approved',
        message: `Your withdrawal request of $${(w.amount || 0).toLocaleString()} has been approved. You will receive $${finalAmount.toFixed(2)} via ${w.method?.replace('_', ' ').toUpperCase()}. Processing time: 1-3 business days.`,
        type: 'payout',
        priority: 'high',
        display_mode: 'popup',
        is_active: true,
        target: 'funded',
      });
    }

    // ── AFFILIATE WITHDRAWAL SETTLEMENT (Track B — affiliate payouts only) ──
    // Mark the covered approved commissions as paid so the same balance can't be
    // withdrawn twice, and update the affiliate profile's paid total.
    if (isAffiliate && w.user_email) {
      try {
        const comms = await sr.entities.AffiliateCommission.filter({ affiliate_email: w.user_email, status: 'approved' });
        let remaining = gross;
        for (const c of comms) {
          if (remaining <= 0) break;
          await sr.entities.AffiliateCommission.update(c.id, { status: 'paid' });
          remaining -= (c.commission_amount || 0);
        }
        const affProfiles = await sr.entities.AffiliateProfile.filter({ user_email: w.user_email });
        const affProfile = affProfiles[0];
        if (affProfile) {
          await sr.entities.AffiliateProfile.update(affProfile.id, {
            total_paid: parseFloat(((affProfile.total_paid || 0) + gross).toFixed(2)),
            total_pending: Math.max(0, parseFloat(((affProfile.total_pending || 0) - gross).toFixed(2))),
          });
        }
      } catch (e) {
        console.error('[adminApproveWithdrawal] affiliate settlement failed (non-blocking):', e.message);
      }
    }

    // ── NEW ACCOUNT PER PAYOUT (Track A — challenge accounts only) ──────────
    // Retire the funded account this payout came from and issue a fresh funded
    // account of the same size/leverage. Affiliate payouts never reach this —
    // they only move money (handled by the affiliate commission flow).
    // Uses the user-scoped client so the admin's identity is forwarded.
    let renewal = null;
    if (w.account_id && w.account_id !== 'affiliate') {
      try {
        const renewRes = await base44.functions.invoke('phaseProgressionEngine', {
          action: 'renew_funded_account',
          account_id: w.account_id,
        });
        renewal = renewRes?.data || null;
        if (renewal?.error && !renewal?.already_done) {
          console.error('[adminApproveWithdrawal] account renewal failed:', renewal.error);
        }
      } catch (e) {
        console.error('[adminApproveWithdrawal] renewal invoke error (non-blocking):', e.message);
      }
    }

    // First payout certificate — IDEMPOTENT (one per user_email + type)
    if (w.account_id !== 'affiliate' && w.user_email) {
      const existing = await sr.entities.Certificate.filter({ user_email: w.user_email, type: 'first_payout' });
      if (existing.length === 0) {
        // Fetch trader full name + challenge_type from the account
        let traderName = w.user_email;
        let challengeType = '';
        let accountSize = 0;
        try {
          const accs = await sr.entities.ChallengeAccount.filter({ account_id: w.account_id });
          if (accs[0]) {
            challengeType = accs[0].challenge_type || '';
            accountSize = accs[0].account_size || 0;
          }
        } catch { /* keep defaults */ }
        try {
          const users = await sr.entities.User.filter({ email: w.user_email });
          if (users[0]?.full_name) traderName = users[0].full_name;
        } catch { /* keep email fallback */ }
        await sr.entities.Certificate.create({
          certificate_id: `XFT-CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          user_email: w.user_email,
          trader_name: traderName,
          type: 'first_payout',
          title: 'First Withdrawal',
          account_id: w.account_id,
          account_size: accountSize || w.amount,
          withdrawal_amount: finalAmount,
          challenge_type: challengeType,
          issue_date: new Date().toISOString().split('T')[0],
          is_verified: true,
        });
      }
    }

    // Audit trail
    await sr.entities.StaffActivityLog.create({
      staff_email: user.email,
      staff_name: user.full_name || user.email,
      role_name: user.role,
      action: 'approve_withdrawal',
      action_category: 'payouts',
      target_entity: 'WithdrawalRequest',
      target_id: w.id,
      target_user_email: w.user_email,
      details: { withdrawal_id: w.id, gross, final_amount: finalAmount, split_pct: splitPct, fee },
      status: 'success',
    });

    return Response.json({
      success: true,
      withdrawal_id: w.id,
      status: 'approved',
      final_amount: finalAmount,
      breakdown: { gross, traderShare, companyShare, fee, finalAmount },
      renewal,
    });
  } catch (error) {
    console.error('adminApproveWithdrawal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});