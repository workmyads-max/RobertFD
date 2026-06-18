/**
 * phaseProgressionEngine — Institutional phase transition handler
 * Handles: Phase1→Phase2 provisioning, Phase2→ManualReview queue, Funded approval
 *
 * MT5 credentials sourced exclusively from getPlatformCredentials('mt5')
 * → reads TradingPlatformProvider entity (Admin > Platforms API)
 * → falls back to env vars only if no DB record exists
 *
 * On DD breach: disables account at broker level via PUT /accounts/{login}/disable
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function genPassword() {
  // MT5 password policy: must contain uppercase, lowercase, digit, special char
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%';
  const all = upper + lower + digits + special;
  // Guarantee at least one of each required type
  let p = '';
  p += upper[Math.floor(Math.random() * upper.length)];
  p += lower[Math.floor(Math.random() * lower.length)];
  p += digits[Math.floor(Math.random() * digits.length)];
  p += special[Math.floor(Math.random() * special.length)];
  // Fill remaining 8 chars from all
  for (let i = 0; i < 8; i++) p += all[Math.floor(Math.random() * all.length)];
  // Shuffle
  return p.split('').sort(() => Math.random() - 0.5).join('');
}

async function sendEmail(sr, to, type, data) {
  try {
    await sr.functions.invoke('emailService', { action: 'send_notification', to, type, data });
  } catch (e) {
    console.error('Email failed (non-blocking):', e.message);
  }
}

/**
 * Load MT5 credentials from getPlatformCredentials — single source of truth.
 * Returns { apiKey, apiBase, serverName } or null if not configured.
 */
async function loadMT5Creds(sr) {
  // Read directly from entity — avoids getPlatformCredentials auth chain issues
  const providers = await sr.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
  if (providers.length > 0) {
    const p = providers[0];
    return {
      apiKey: p.api_key,
      apiBase: p.server_url || Deno.env.get('MT5_API_BASE_URL'),
      serverName: p.server_name || Deno.env.get('MT5_SERVER_NAME') || 'XyloMarkets-Server',
    };
  }
  // Fallback to env vars
  const apiKey = Deno.env.get('MT5_API_KEY');
  const apiBase = Deno.env.get('MT5_API_BASE_URL');
  if (!apiKey || !apiBase) {
    console.error('[phaseProgressionEngine] MT5 credentials not configured in DB or env vars');
    return null;
  }
  return { apiKey, apiBase, serverName: Deno.env.get('MT5_SERVER_NAME') || 'XyloMarkets-Server' };
}

/**
 * Standard MT5 API headers — consistent with provisionMatchTraderAccount and scheduledMTSync.
 */
function mt5Headers(apiKey) {
  return {
    'Content-Type': 'application/json',
    'api-key': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'ApiKey': apiKey,
  };
}

/**
 * Provision a new MT5 account via broker REST API.
 * Returns { mt_login, mt_password, mt_server, mt_group } or null on failure.
 */
async function provisionMT5Account(apiBase, apiKey, serverName, userEmail, groupName, leverage, balance, accountName) {
  const masterPassword = genPassword();
  const investorPassword = genPassword();
  try {
    // Tritech API: POST /api/v1/user/useradd
    const createRes = await fetch(`${apiBase}/api/v1/user/useradd`, {
      method: 'POST',
      headers: mt5Headers(apiKey),
      body: JSON.stringify({
        Login: 0,            // 0 = auto-assign
        MasterPassword: masterPassword,
        InvestorPassword: investorPassword,
        Name: accountName || userEmail.split('@')[0],
        Email: userEmail,
        Group: groupName,
        Leverage: leverage,
        Country: 'AE',
        Comment: `XFunded ${groupName}`,
        Status: 0,
        apikey: apiKey,      // Tritech requires apikey in body
      }),
    });

    const responseText = await createRes.text();
    console.log(`[Tritech/useradd] Status ${createRes.status}: ${responseText.slice(0, 200)}`);

    if (!createRes.ok) {
      console.error('[Tritech/useradd] Account creation failed:', responseText);
      return null;
    }

    const result = JSON.parse(responseText);
    // Tritech response: { data: { login: 12345, ... }, resultCode: "200" }
    const mtLogin = result?.data?.login || result?.User?.Login || result?.Login || result?.login;

    if (!mtLogin || parseInt(mtLogin) === 0) {
      console.error('[Tritech/useradd] No Login in response:', result);
      return null;
    }

    // Set initial balance
    if (balance > 0) {
      const depRes = await fetch(`${apiBase}/api/v1/user/depositwithbal`, {
        method: 'POST',
        headers: mt5Headers(apiKey),
        body: JSON.stringify({ Login: parseInt(mtLogin), Balance: balance, Comment: 'Initial challenge deposit', apikey: apiKey }),
      });
      const depText = await depRes.text();
      console.log(`[Tritech/depositwithbal] Login ${mtLogin}: ${depRes.status} — ${depText.slice(0, 100)}`);
    }

    return {
      mt_login: String(mtLogin),
      mt_password: masterPassword,
      mt_server: serverName,
      mt_group: groupName,
    };
  } catch (e) {
    console.error('[Tritech/useradd] error:', e.message);
    return null;
  }
}

/**
 * Disable an MT5 account at the broker level after DD breach.
 * Tries PUT /accounts/{login}/disable first, falls back to PUT /accounts/{login} with enabled:false.
 * Non-blocking — failure is logged but does not stop DB updates.
 */
async function disableMT5AccountAtBroker(apiBase, apiKey, mtLogin, reason) {
  if (!apiBase || !apiKey || !mtLogin) {
    console.warn('[MT5-DISABLE] Missing credentials or login — skipping');
    return;
  }
  try {
    // Tritech API: POST /api/v1/user/move-disabled
    const disableRes = await fetch(`${apiBase}/api/v1/user/move-disabled`, {
      method: 'POST',
      headers: mt5Headers(apiKey),
      body: JSON.stringify({ Login: parseInt(mtLogin), apikey: apiKey }),
    });
    const disableText = await disableRes.text();
    if (disableRes.ok) {
      console.log(`[MT5-DISABLE] ✅ Account ${mtLogin} disabled via Tritech move-disabled: ${disableText.slice(0, 100)}`);
    } else {
      console.error(`[MT5-DISABLE] ❌ move-disabled failed for ${mtLogin}: ${disableRes.status} — ${disableText}`);
    }
  } catch (e) {
    console.error(`[MT5-DISABLE] ❌ Exception disabling ${mtLogin}:`, e.message);
  }
}

async function computeRiskScore(sr, account) {
  const trades = await sr.entities.TradeRecord.filter({ account_id: account.account_id });
  const flags = await sr.entities.RiskFlag.filter({ account_id: account.account_id, status: 'active' });

  let riskScore = 0;
  riskScore += flags.filter(f => f.severity === 'critical').length * 30;
  riskScore += flags.filter(f => f.severity === 'high').length * 20;
  riskScore += flags.filter(f => f.severity === 'medium').length * 10;
  riskScore += flags.filter(f => f.severity === 'low').length * 3;

  const ddUsed = account.max_drawdown_used || 0;
  if (ddUsed > 8) riskScore += 25;
  else if (ddUsed > 6) riskScore += 15;
  else if (ddUsed > 4) riskScore += 5;

  const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl);
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  if (closedTrades.length > 0) {
    const maxSinglePnl = Math.max(...closedTrades.map(t => t.pnl || 0));
    if (totalPnl > 0 && maxSinglePnl / totalPnl > 0.5) riskScore += 20;
  }

  const ultraShort = closedTrades.filter(t => {
    if (!t.open_time || !t.close_time) return false;
    return (new Date(t.close_time) - new Date(t.open_time)) < 10000;
  });
  if (ultraShort.length > 5) riskScore += 20;

  const tradingDays = account.trading_days || 0;
  let consistencyScore = 100;
  if (closedTrades.length > 0) {
    const avgLots = closedTrades.reduce((s, t) => s + (t.lots || 0), 0) / closedTrades.length;
    const lotVariance = closedTrades.reduce((s, t) => s + Math.abs((t.lots || 0) - avgLots), 0) / closedTrades.length;
    if (lotVariance / avgLots > 2) consistencyScore -= 30;
    if (lotVariance / avgLots > 3) consistencyScore -= 20;
  }
  if (tradingDays < 5) consistencyScore -= 20;

  return {
    risk_score: Math.min(100, Math.max(0, riskScore)),
    consistency_score: Math.max(0, consistencyScore),
    red_flags_count: flags.length,
    total_trades: closedTrades.length,
    win_rate: account.win_rate || 0,
    max_dd_used: ddUsed,
    trading_days: tradingDays,
    gross_pnl: totalPnl,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, account_id } = body;
    const sr = base44.asServiceRole;

    // ── APPROVE PHASE 1 REVIEW → PROVISION PHASE 2 MT5 ACCOUNT ──────────────
    // Called by admin after auto-detection sets phase_review_status=pending_review.
    // Also handles legacy manual action (mark_phase1_passed) for backward compat.
    if (action === 'approve_phase1' || action === 'mark_phase1_passed') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });

      // Prevent double-approval ONLY if Phase 2 was actually provisioned (has new credentials + active status)
      if (account.phase_review_status === 'approved' && account.status === 'active' && account.phase === 'phase2' && account.mt_login) {
        return Response.json({ error: 'Phase 1 already approved — Phase 2 account has been provisioned.' }, { status: 409 });
      }

      // Mark review approved + advance to phase2 (reset progress for new phase)
      // Only update status/phase if not already in phase2 (idempotent retry support)
      if (account.phase !== 'phase2') {
        await sr.entities.ChallengeAccount.update(account.id, {
          status: 'passed',
          phase: 'phase2',
          phase_review_status: 'approved',
          phase_passed_at: account.phase_passed_at || new Date().toISOString(),
          profit_target_progress: 0,
        });
      }

      const platform = account.platform || 'xtrading';
      const isMT5 = platform === 'mt5';
      let phase2Credentials = null;

      if (isMT5) {
        // ── CREDENTIALS FROM ADMIN > PLATFORMS API (single source of truth) ────
        const creds = await loadMT5Creds(sr);
        if (creds && creds.apiKey && creds.apiBase) {
          // Use env var MT5_PHASE2_GROUP directly — do NOT construct group names
          const groupName = Deno.env.get('MT5_PHASE2_GROUP') || '';
          if (!groupName) {
            console.error('[approve_phase1] MT5_PHASE2_GROUP env var not set — cannot provision Phase 2 account');
          }
          const leverage = parseInt((account.rule_snapshot?.leverage || account.leverage || '1:100').split(':')[1]) || 100;

          // Build Phase 2 account name: "100K Phase 2 XFunded Trader 2-Step"
          const sizeLabel = account.account_size >= 1000000 ? `${account.account_size / 1000000}M` : `${account.account_size / 1000}K`;
          const phase2Name = `${sizeLabel} Phase 2 XFunded Trader 2-Step`;

          phase2Credentials = await provisionMT5Account(
            creds.apiBase, creds.apiKey, creds.serverName,
            account.user_email, groupName, leverage, account.account_size,
            phase2Name
          );

          if (phase2Credentials) {
            // Phase 2 MT5 account provisioned — activate, advance phase, clear Phase 1 review flags
            await sr.entities.ChallengeAccount.update(account.id, {
              status: 'active',
              phase: 'phase2',
              phase_review_status: 'approved',
              funded_review_status: 'none', // reset funded review for the new phase
              mt_login: phase2Credentials.mt_login,
              mt_password: phase2Credentials.mt_password,
              mt_server: phase2Credentials.mt_server,
              mt_group: phase2Credentials.mt_group,
              login_credentials: `Login: ${phase2Credentials.mt_login} | Password: ${phase2Credentials.mt_password} | Server: ${phase2Credentials.mt_server}`,
              server: phase2Credentials.mt_server,
              provisioned_at: new Date().toISOString(),
              balance: 0, pnl: 0, daily_pnl: 0,
              daily_drawdown_used: 0, max_drawdown_used: 0,
              high_water_mark: account.account_size,
            });
          } else {
            console.error('[approve_phase1] MT5 Phase 2 provisioning returned null — account stays passed, admin must retry');
          }
        } else {
          console.error('[Phase1Passed] MT5 credentials not configured in Admin > Platforms API');
        }
      } else {
        // Non-MT5 platform — just activate
        await sr.entities.ChallengeAccount.update(account.id, { status: 'active' });
      }

      await sr.entities.Notification.create({
        user_email: account.user_email,
        title: '🎉 Phase 1 Passed! Phase 2 Activated',
        message: `Congratulations! Your Phase 1 challenge is complete. Your Phase 2 account is now active.`,
        type: 'payout', priority: 'high', display_mode: 'popup', is_active: true, target: 'challenge',
      });

      await sendEmail(sr, account.user_email, 'phase1_passed', {
        name: account.user_email,
        account_size: account.account_size,
        phase2_credentials: phase2Credentials,
      });

      return Response.json({ success: true, phase: 'phase2', credentials: phase2Credentials });
    }

    // ── MANUALLY MARK PHASE 2 PASSED → PENDING FUNDED REVIEW (admin/legacy) ──
    // Auto-detection in scheduledMTSync now handles the normal path.
    // This action is kept for admin override / edge cases.
    // approve_funded is the action that triggers actual MT5 funded provisioning.
    if (action === 'mark_phase2_passed') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });

      // Prevent overwriting an already-submitted funded review
      if (account.funded_review_status === 'pending_review' || account.funded_review_status === 'approved') {
        return Response.json({ error: 'Funded review already in progress or approved.' }, { status: 409 });
      }

      const riskData = await computeRiskScore(sr, account);

      await sr.entities.ChallengeAccount.update(account.id, {
        status: 'passed',
        phase: 'funded',
        funded_review_status: 'pending_review',
        phase_passed_at: new Date().toISOString(),
      });

      const existingReviews = await sr.entities.FundedAccountReview.filter({ account_id });
      if (existingReviews.length === 0) {
        await sr.entities.FundedAccountReview.create({
          account_id: account.account_id,
          user_email: account.user_email,
          trader_name: account.user_email,
          phase_passed: 'phase2',
          status: 'pending_review',
          account_size: account.account_size,
          challenge_type: account.challenge_type,
          ...riskData,
        });
      }

      await sr.entities.Notification.create({
        user_email: account.user_email,
        title: '⏳ Phase 2 Complete — Under Risk Review',
        message: `Your Phase 2 challenge is complete. Your account is now under review by our risk management team. Please allow 48–96 hours.`,
        type: 'system', priority: 'high', display_mode: 'popup', is_active: true, target: 'challenge',
      });

      await sendEmail(sr, account.user_email, 'phase2_passed', {
        name: account.user_email,
        account_size: account.account_size,
        review_message: 'Your account is under review. Please allow 48–96 hours.',
      });

      return Response.json({ success: true, status: 'pending_manual_review', risk_score: riskData.risk_score });
    }

    // ── APPROVE FUNDED ACCOUNT ─────────────────────────────────────────────────
    if (action === 'approve_funded') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      const { review_id } = body;
      const reviews = await sr.entities.FundedAccountReview.filter({ id: review_id });
      const review = reviews[0];
      if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id: review.account_id });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });

      const platform = account.platform || 'xtrading';
      const isMT5 = platform === 'mt5';
      let fundedCredentials = null;

      if (isMT5) {
        // ── CREDENTIALS FROM ADMIN > PLATFORMS API (single source of truth) ────
        const creds = await loadMT5Creds(sr);
        if (creds && creds.apiKey && creds.apiBase) {
          // Use env var MT5_FUNDED_GROUP directly — do NOT construct group names
          const groupName = Deno.env.get('MT5_FUNDED_GROUP') || '';
          if (!groupName) {
            console.error('[approve_funded] MT5_FUNDED_GROUP env var not set — cannot provision funded account');
          }
          // Use leverage from rule_snapshot (set at purchase). Fallback to account.leverage then 100.
          const fundedLeverage = parseInt(
            ((account.rule_snapshot?.leverage || account.leverage || '1:100').split(':')[1])
          ) || 100;
          fundedCredentials = await provisionMT5Account(
            creds.apiBase, creds.apiKey, creds.serverName,
            account.user_email, groupName, fundedLeverage, account.account_size
          );
        } else {
          console.error('[ApproveFunded] MT5 credentials not configured in Admin > Platforms API');
        }
      }

      // Guard: prevent double-funded provisioning
      if (account.status === 'funded') {
        return Response.json({ error: 'Account is already funded — cannot approve again.' }, { status: 409 });
      }

      const fundedId = `FUNDED-${Date.now()}`;

      // funded_review_status=approved marks the funded provisioning as complete
      // IMPORTANT: account_id is NOT overwritten — it must stay stable so all
      // MT5 sync, trade records, and queries continue to match correctly.
      // funded_account_id is a separate reference field for bookkeeping only.
      await sr.entities.ChallengeAccount.update(account.id, {
        status: 'funded',
        funded_review_status: 'approved',
        funded_account_id: fundedId,   // ← separate field, does NOT replace account_id
        ...(fundedCredentials || {}),
        login_credentials: fundedCredentials
          ? `Login: ${fundedCredentials.mt_login} | Password: ${fundedCredentials.mt_password} | Server: ${fundedCredentials.mt_server}`
          : account.login_credentials,
        provisioned_at: new Date().toISOString(),
        balance: account.account_size,
        equity: account.account_size,
        high_water_mark: account.account_size,
        pnl: 0, daily_pnl: 0,
      });

      await sr.entities.FundedAccountReview.update(review.id, {
        status: 'approved',
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
        funded_account_id: fundedId,
        ...(fundedCredentials ? {
          funded_mt5_login: fundedCredentials.mt_login,
          funded_mt5_password: fundedCredentials.mt_password,
          funded_mt5_server: fundedCredentials.mt_server,
          funded_provisioned_at: new Date().toISOString(),
        } : {}),
      });

      await sr.entities.Notification.create({
        user_email: account.user_email,
        title: '🏆 Funded Account Approved!',
        message: `Congratulations! You have been approved as a Funded Trader. Your live funded account credentials are now available in your dashboard.`,
        type: 'payout', priority: 'critical', display_mode: 'popup', is_active: true, target: 'funded',
      });

      // ── Payout Reward Commissions (for referrers) + active_funded_traders ────
      try {
        const buyerProfiles = await sr.entities.AffiliateProfile.filter({ user_email: account.user_email });
        const buyerProfile = buyerProfiles[0];
        
        if (buyerProfile?.referred_by_email) {
          // Read payout tier rates from settings
          const settingsList = await sr.entities.AffiliateSettings.filter({ setting_key: 'global_config' });
          const settings = settingsList[0];
          
          // Count active funded traders to determine tier
          const allFunded = await sr.entities.ChallengeAccount.filter({ status: 'funded' });
          
          // Build referral chain (up to 3 levels)
          const chain = [];
          
          // L1
          const l1Affs = await sr.entities.AffiliateProfile.filter({ user_email: buyerProfile.referred_by_email });
          if (l1Affs[0]) {
            const l1Count = allFunded.filter(a => {
              // Count funded traders under this L1 affiliate
              return true; // simplified — count all funded; real filtering would need full tree
            }).length;
            
            let l1Rate = settings?.payout_reward_rate ?? 9;
            if (l1Affs[0].custom_payout_rate) l1Rate = l1Affs[0].custom_payout_rate;
            chain.push({ level: 1, email: l1Affs[0].user_email, rate: l1Rate, profile: l1Affs[0] });
            
            // L2
            if (l1Affs[0].referred_by_email) {
              const l2Affs = await sr.entities.AffiliateProfile.filter({ user_email: l1Affs[0].referred_by_email });
              if (l2Affs[0]) {
                let l2Rate = 2; // default L2 rate
                chain.push({ level: 2, email: l2Affs[0].user_email, rate: l2Rate, profile: l2Affs[0] });
                
                // L3
                if (l2Affs[0].referred_by_email) {
                  const l3Affs = await sr.entities.AffiliateProfile.filter({ user_email: l2Affs[0].referred_by_email });
                  if (l3Affs[0]) {
                    let l3Rate = 1; // default L3 rate
                    chain.push({ level: 3, email: l3Affs[0].user_email, rate: l3Rate, profile: l3Affs[0] });
                  }
                }
              }
            }
          }
          
          // Create payout_reward commissions and update active_funded_traders
          for (const { level, email, rate, profile } of chain) {
            const commissionAmount = parseFloat(((account.account_size * rate) / 100).toFixed(2));
            if (commissionAmount <= 0) continue;
            
            await sr.entities.AffiliateCommission.create({
              affiliate_email: email,
              referred_email: account.user_email,
              commission_type: 'payout_reward',
              level,
              source_amount: account.account_size,
              commission_rate: rate,
              commission_amount: commissionAmount,
              account_id: account.account_id,
              status: 'pending',
              notes: `Payout reward L${level}: ${rate}% of $${account.account_size.toLocaleString()} funded account`,
            });
            
            // Update affiliate profile
            await sr.entities.AffiliateProfile.update(profile.id, {
              total_earned: parseFloat(((profile.total_earned || 0) + commissionAmount).toFixed(2)),
              total_pending: parseFloat(((profile.total_pending || 0) + commissionAmount).toFixed(2)),
              total_payout_commissions: parseFloat(((profile.total_payout_commissions || 0) + commissionAmount).toFixed(2)),
              active_funded_traders: (profile.active_funded_traders || 0) + 1,
            });
            
            console.log(`[phaseProgressionEngine] Payout reward L${level} created for ${email}: $${commissionAmount}`);
          }
        }
      } catch (e) {
        console.error('[phaseProgressionEngine] Payout reward creation failed (non-blocking):', e.message);
      }

      await sendEmail(sr, account.user_email, 'funded_approved', {
        name: account.user_email,
        account_size: account.account_size,
        credentials: fundedCredentials,
      });

      return Response.json({ success: true, funded_account_id: fundedId, credentials: fundedCredentials });
    }

    // ── REJECT FUNDED ──────────────────────────────────────────────────────────
    if (action === 'reject_funded') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
      const { review_id, reason } = body;
      const reviews = await sr.entities.FundedAccountReview.filter({ id: review_id });
      const review = reviews[0];
      if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });

      await sr.entities.FundedAccountReview.update(review.id, {
        status: 'rejected', rejection_reason: reason,
        reviewed_by: user.email, reviewed_at: new Date().toISOString(),
      });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id: review.account_id });
      if (accounts[0]) {
        await sr.entities.ChallengeAccount.update(accounts[0].id, { status: 'failed' });
        // Disable at broker if MT5
        if (accounts[0].platform === 'mt5' && accounts[0].mt_login) {
          const creds = await loadMT5Creds(sr);
          if (creds) {
            disableMT5AccountAtBroker(creds.apiBase, creds.apiKey, accounts[0].mt_login, 'Funded application rejected').catch(() => {});
          }
        }
      }

      await sendEmail(sr, review.user_email, 'funded_rejected', {
        name: review.user_email,
        reason: reason || 'Risk management review decision',
      });

      return Response.json({ success: true });
    }

    // ── SUSPEND ACCOUNT ────────────────────────────────────────────────────────
    if (action === 'suspend_account') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
      const { review_id, reason } = body;
      const reviews = await sr.entities.FundedAccountReview.filter({ id: review_id });
      const review = reviews[0];
      if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });

      await sr.entities.FundedAccountReview.update(review.id, {
        status: 'suspended', admin_notes: reason,
        reviewed_by: user.email, reviewed_at: new Date().toISOString(),
      });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id: review.account_id });
      if (accounts[0]) {
        await sr.entities.ChallengeAccount.update(accounts[0].id, { status: 'failed' });
        if (accounts[0].platform === 'mt5' && accounts[0].mt_login) {
          const creds = await loadMT5Creds(sr);
          if (creds) {
            disableMT5AccountAtBroker(creds.apiBase, creds.apiKey, accounts[0].mt_login, reason || 'Account suspended').catch(() => {});
          }
        }
      }

      return Response.json({ success: true });
    }

    // ── COMPUTE RISK SCORE (standalone) ───────────────────────────────────────
    if (action === 'compute_risk_score') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
      const accounts = await sr.entities.ChallengeAccount.filter({ account_id });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });
      const riskData = await computeRiskScore(sr, account);
      return Response.json({ success: true, ...riskData });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('phaseProgressionEngine error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});