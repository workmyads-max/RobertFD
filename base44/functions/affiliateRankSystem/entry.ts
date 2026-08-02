/**
 * affiliateRankSystem — Level-1 Rank & Tier Bonus System (ADDITIVE)
 *
 * Sales base = sum of source_amount from L1 challenge_purchase AffiliateCommission
 * records (status !== 'rejected'). This mirrors exactly the existing L1 8% commission
 * base — free promo accounts (Buy-2-Get-1-Free) are already excluded from commissions,
 * so they do NOT count toward rank sales. Existing commissions/payouts are untouched.
 *
 * Ranks (cumulative thresholds from last claim):
 *   Bronze   $5,000   → $450 bonus
 *   Silver   $12,500  → $1,350 bonus
 *   Gold     $25,000  → $3,000 bonus
 *   Platinum $50,000  → $7,500 bonus
 *
 * Claim   → bonus granted as an approved AffiliateCommission (withdrawable),
 *           sales counter resets to 0 for the next rank (next rank needs its
 *           FULL fresh target).
 * Forfeit → bonus skipped, sales CARRY OVER (counter unchanged), progress
 *           toward the next rank's cumulative threshold.
 *
 * Actions: get_status | claim | forfeit
 * Auth: the authenticated user acts on their own email. Admins may pass
 *       target_email to view any affiliate (get_status only).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const RANKS = [
  { key: 'bronze',   name: 'Bronze Partner',   target: 5000,   bonus: 450 },
  { key: 'silver',   name: 'Silver Partner',   target: 12500,  bonus: 1350 },
  { key: 'gold',     name: 'Gold Partner',     target: 25000,  bonus: 3000 },
  { key: 'platinum', name: 'Platinum Partner', target: 50000,  bonus: 7500 },
];

function round2(n) { return parseFloat((n || 0).toFixed(2)); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, target_email } = body || {};

    // Resolve target email — self, or admin override (view-only for others)
    let email = user.email;
    if (target_email) {
      if (user.role === 'admin') {
        email = target_email;
      } else if (String(target_email).toLowerCase() !== String(user.email).toLowerCase()) {
        return Response.json({ error: 'Forbidden: can only view your own rank' }, { status: 403 });
      } else {
        email = target_email;
      }
    }

    // ── Sales base: L1 direct challenge-purchase commissions ──────────────────
    // Free promo (B2G1) accounts never create commissions, so they are excluded.
    const commissions = await sr.entities.AffiliateCommission.filter({ affiliate_email: email });
    const totalL1Sales = commissions
      .filter(c => c.level === 1 && c.commission_type === 'challenge_purchase' && c.status !== 'rejected')
      .reduce((s, c) => s + (c.source_amount || 0), 0);

    // ── Rank bonus history (ordered) ──────────────────────────────────────────
    const bonusRecords = await sr.entities.AffiliateRankBonus.filter({ user_email: email });
    const sortedBonuses = [...bonusRecords].sort(
      (a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0)
    );
    const resolvedCount = sortedBonuses.length;
    const nextRank = RANKS[resolvedCount] || null;
    const lastClaim = [...sortedBonuses].reverse().find(b => b.status === 'claimed');
    const salesAtLastClaim = lastClaim?.sales_at_action || 0;
    const effectiveSales = Math.max(0, totalL1Sales - salesAtLastClaim);
    const claimable = !!nextRank && effectiveSales >= nextRank.target;
    const currentRank = resolvedCount > 0 ? RANKS[resolvedCount - 1] : null;

    const statusPayload = {
      total_l1_sales: round2(totalL1Sales),
      effective_sales: round2(effectiveSales),
      sales_at_last_claim: round2(salesAtLastClaim),
      current_rank: currentRank,
      next_rank: nextRank,
      claimable,
      resolved_bonuses: sortedBonuses,
      all_ranks: RANKS,
      resolved_count: resolvedCount,
    };

    if (action === 'get_status') {
      return Response.json({ success: true, ...statusPayload });
    }

    if (action !== 'claim' && action !== 'forfeit') {
      return Response.json({ error: 'Unknown action. Use get_status | claim | forfeit' }, { status: 400 });
    }

    // ── claim / forfeit — act on own account only ──────────────────────────────
    if (target_email && String(target_email).toLowerCase() !== String(user.email).toLowerCase()) {
      return Response.json({ error: 'Admins can view other affiliates but cannot claim/forfeit on their behalf' }, { status: 403 });
    }

    if (!nextRank) {
      return Response.json({ error: 'All ranks already completed' }, { status: 400 });
    }
    if (!claimable) {
      return Response.json({
        error: `${nextRank.name} target not yet reached. Need $${(nextRank.target - effectiveSales).toFixed(2)} more in fresh L1 sales.`,
      }, { status: 400 });
    }

    // Idempotency: this rank must not already be resolved
    const alreadyResolved = sortedBonuses.find(b => b.rank_key === nextRank.key);
    if (alreadyResolved) {
      return Response.json({ error: `${nextRank.name} already ${alreadyResolved.status}` }, { status: 409 });
    }

    const nowIso = new Date().toISOString();

    if (action === 'claim') {
      // Create an APPROVED commission so the bonus is immediately withdrawable
      // and flows into the existing affiliate payout system (additive, no changes
      // to withdrawal logic — it sums approved AffiliateCommission amounts).
      const comm = await sr.entities.AffiliateCommission.create({
        affiliate_email: email,
        referred_email: email,
        commission_type: 'account_upgrade',
        level: 1,
        source_amount: round2(totalL1Sales),
        commission_rate: 0,
        commission_amount: nextRank.bonus,
        order_id: `RANK-${nextRank.key.toUpperCase()}-${Date.now()}`,
        status: 'approved',
        notes: `Rank Bonus Claimed: ${nextRank.name} — $${nextRank.bonus}. L1 direct sales: $${round2(totalL1Sales)}. Effective since last claim: $${round2(effectiveSales)}. Counter reset for next rank.`,
      });

      await sr.entities.AffiliateRankBonus.create({
        user_email: email,
        rank_key: nextRank.key,
        rank_name: nextRank.name,
        bonus_amount: nextRank.bonus,
        status: 'claimed',
        sales_at_action: round2(totalL1Sales),
        effective_sales_at_action: round2(effectiveSales),
        commission_id: comm.id,
        claimed_at: nowIso,
      });

      // Mirror createAffiliateCommissions: bump profile totals so the bonus
      // appears in the affiliate dashboard earned balance.
      const profiles = await sr.entities.AffiliateProfile.filter({ user_email: email });
      if (profiles[0]) {
        const p = profiles[0];
        await sr.entities.AffiliateProfile.update(p.id, {
          total_earned: round2((p.total_earned || 0) + nextRank.bonus),
          total_purchase_commissions: round2((p.total_purchase_commissions || 0) + nextRank.bonus),
        });
      }

      return Response.json({
        success: true,
        action: 'claim',
        rank: nextRank,
        bonus: nextRank.bonus,
        commission_id: comm.id,
      });
    }

    // action === 'forfeit'
    await sr.entities.AffiliateRankBonus.create({
      user_email: email,
      rank_key: nextRank.key,
      rank_name: nextRank.name,
      bonus_amount: nextRank.bonus,
      status: 'forfeited',
      sales_at_action: round2(totalL1Sales),
      effective_sales_at_action: round2(effectiveSales),
      claimed_at: nowIso,
    });

    return Response.json({
      success: true,
      action: 'forfeit',
      rank: nextRank,
    });
  } catch (error) {
    console.error('affiliateRankSystem error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});