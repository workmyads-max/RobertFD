/**
 * processPayoutRewardCommission — Authoritative, idempotent payout-reward engine.
 *
 * REAL MONEY. This is the single source of truth for the payout-reward affiliate
 * commission. It runs ONLY when a WithdrawalRequest is in "approved" status and
 * credits the referrer (User A) for an approved profit withdrawal made by the
 * referred trader (User B).
 *
 * Triggered by:
 *   1. An entity automation on WithdrawalRequest update (status -> "approved"),
 *      which catches EVERY approval path (admin "Approve" button AND the status
 *      dropdown in the admin UI).
 *   2. Optional direct admin/scheduler invocation with { withdrawal_id }.
 *
 * Guarantees:
 *   - Fires only when status === "approved" (re-fetched from DB, never trusts payload).
 *   - Idempotent: never creates more than one payout_reward commission per withdrawal_id.
 *   - Does NOT touch the trader's final_amount / payout. Only the affiliate side.
 *   - Does NOT alter the challenge-purchase commission flow (L1/L2/L3).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function round2(n) {
  return parseFloat((Number(n) || 0).toFixed(2));
}

// Resolve the payout tier rate (%) for a referrer based on their active funded
// traders, honoring a per-affiliate custom override when present.
function resolvePayoutRate(referrerProfile, settings) {
  const custom = referrerProfile?.custom_payout_rate;
  if (custom !== undefined && custom !== null && custom !== '' && !isNaN(Number(custom)) && Number(custom) > 0) {
    return Number(custom);
  }
  const n = Number(referrerProfile?.active_funded_traders) || 0;
  if (n >= 50) return Number(settings?.payout_tier_50_rate ?? 25);
  if (n >= 25) return Number(settings?.payout_tier_25_rate ?? 17);
  if (n >= 10) return Number(settings?.payout_tier_10_rate ?? 11);
  return Number(settings?.payout_tier_0_rate ?? 7);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try { body = await req.json(); } catch { /* automation/no-body is fine */ }

    // ── Authorization ──────────────────────────────────────────────────────
    // Allow: admin user OR scheduler token OR automation context (event payload).
    // Regardless of caller, the function only ever acts on genuinely-approved
    // withdrawals and only creates the single legitimate commission, so the
    // business rules themselves bound what any caller can do.
    let user = null;
    try { user = await base44.auth.me(); } catch { /* automation has no user */ }
    const schedulerToken = body?.scheduler_token || req.headers.get('x-scheduler-token');
    const isAutomation = !!body?.event?.entity_id || !!body?.event_type;
    const isAuthorized =
      user?.role === 'admin' ||
      (schedulerToken && schedulerToken === Deno.env.get('SCHEDULER_SECRET_TOKEN')) ||
      isAutomation;

    if (!isAuthorized) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Resolve the withdrawal id from direct call or automation payload ─────
    const withdrawalId = body?.withdrawal_id || body?.event?.entity_id || null;
    if (!withdrawalId) {
      return Response.json({ error: 'withdrawal_id required' }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Always re-fetch fresh — never trust the trigger payload for money decisions.
    let w;
    try {
      w = await sr.entities.WithdrawalRequest.get(withdrawalId);
    } catch {
      return Response.json({ error: 'Withdrawal not found' }, { status: 404 });
    }
    if (!w) return Response.json({ error: 'Withdrawal not found' }, { status: 404 });

    // ── Trigger guard: ONLY when approved ────────────────────────────────────
    if (w.status !== 'approved') {
      return Response.json({ success: true, skipped: true, reason: `Withdrawal status is "${w.status}", not "approved"` });
    }

    // Skip affiliate self-withdrawals and rows without an owner.
    if (w.account_id === 'affiliate' || !w.user_email) {
      return Response.json({ success: true, skipped: true, reason: 'Not a trader profit withdrawal' });
    }

    // ── Idempotency: never create a second payout_reward for this withdrawal ─
    const existing = await sr.entities.AffiliateCommission.filter({
      withdrawal_id: w.id,
      commission_type: 'payout_reward',
    });
    if (existing.length > 0) {
      return Response.json({ success: true, skipped: true, reason: 'Payout reward already exists for this withdrawal' });
    }

    // ── Find the referrer (User A) for the referred trader (User B) ──────────
    const traderProfiles = await sr.entities.AffiliateProfile.filter({ user_email: w.user_email });
    const traderProfile = traderProfiles[0];
    const refEmail = traderProfile?.referred_by_email;
    const refCode = traderProfile?.referred_by_code;
    if (!traderProfile || (!refEmail && !refCode)) {
      return Response.json({ success: true, skipped: true, reason: 'Trader was not referred by anyone' });
    }

    let referrerProfiles = [];
    if (refEmail) referrerProfiles = await sr.entities.AffiliateProfile.filter({ user_email: refEmail });
    if (referrerProfiles.length === 0 && refCode) referrerProfiles = await sr.entities.AffiliateProfile.filter({ referral_code: refCode });
    const referrer = referrerProfiles[0];
    if (!referrer) {
      return Response.json({ success: true, skipped: true, reason: 'Referrer profile not found' });
    }

    // ── Commission base = trader_share (the trader's net share after split) ──
    const splitPct = (w.profit_split_pct === 0 || w.profit_split_pct) ? Number(w.profit_split_pct) : 80;
    const traderShare = (w.trader_share && Number(w.trader_share) > 0)
      ? round2(w.trader_share)
      : round2((Number(w.amount) || 0) * (splitPct / 100));

    if (traderShare <= 0) {
      return Response.json({ success: true, skipped: true, reason: 'Trader share is zero' });
    }

    // ── Tier rate + amount ───────────────────────────────────────────────────
    const settingsList = await sr.entities.AffiliateSettings.list();
    const settings = settingsList[0] || {};
    const rate = resolvePayoutRate(referrer, settings);
    const commissionAmount = round2(traderShare * (rate / 100));

    if (commissionAmount <= 0) {
      return Response.json({ success: true, skipped: true, reason: 'Computed commission is zero' });
    }

    // ── Create the confirmed commission record ───────────────────────────────
    const commission = await sr.entities.AffiliateCommission.create({
      affiliate_email: referrer.user_email,
      referred_email: w.user_email,
      commission_type: 'payout_reward',
      level: 1,
      source_amount: traderShare,
      commission_rate: rate,
      commission_amount: commissionAmount,
      withdrawal_id: w.id,
      account_id: w.account_id,
      status: 'approved',
      approved_by: user?.email || 'system',
      notes: `Payout reward: ${rate}% of $${traderShare} trader share from approved withdrawal by ${w.user_email}`,
    });

    // ── Record on the withdrawal for bookkeeping ─────────────────────────────
    await sr.entities.WithdrawalRequest.update(w.id, { affiliate_reward: commissionAmount });

    // ── Credit User A's withdrawable balance ─────────────────────────────────
    await sr.entities.AffiliateProfile.update(referrer.id, {
      total_earned: round2((Number(referrer.total_earned) || 0) + commissionAmount),
      total_pending: round2((Number(referrer.total_pending) || 0) + commissionAmount),
      total_payout_commissions: round2((Number(referrer.total_payout_commissions) || 0) + commissionAmount),
    });

    return Response.json({
      success: true,
      created: true,
      commission_id: commission.id,
      affiliate_email: referrer.user_email,
      referred_email: w.user_email,
      trader_share: traderShare,
      rate,
      commission_amount: commissionAmount,
      withdrawal_id: w.id,
    });
  } catch (error) {
    console.error('[processPayoutRewardCommission] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});