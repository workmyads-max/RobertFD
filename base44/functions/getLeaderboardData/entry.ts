import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * getLeaderboardData — Service-role query for the public leaderboard.
 *
 * ChallengeAccount and WithdrawalRequest both have RLS that restricts reads
 * to the current user's own records. A regular user therefore cannot see
 * other traders' accounts or payouts, making the leaderboard show only
 * themselves. This function uses the service role to fetch ALL eligible
 * accounts and ALL paid withdrawals, then returns a merged dataset.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sr = base44.asServiceRole;

    // Fetch ALL funded + active accounts (service role bypasses RLS)
    const [funded, instant, instantLight] = await Promise.all([
      sr.entities.ChallengeAccount.filter({ status: 'funded', is_trashed: false }, '-pnl', 200),
      sr.entities.ChallengeAccount.filter({ status: 'active', challenge_type: 'instant', is_trashed: false }, '-pnl', 100),
      sr.entities.ChallengeAccount.filter({ status: 'active', challenge_type: 'instant_light', is_trashed: false }, '-pnl', 100),
    ]);

    // Fetch ALL paid trader withdrawals (exclude affiliate payouts)
    const payouts = await sr.entities.WithdrawalRequest.filter({ status: 'paid' }, '-created_date', 500);

    // Build payout map: account_id → total actually paid out to trader
    const payoutMap = {};
    let totalPaidOut = 0;
    payouts.forEach(p => {
      if (p.account_id && p.account_id !== 'affiliate') {
        const amt = p.final_amount || p.trader_share || p.amount || 0;
        payoutMap[p.account_id] = (payoutMap[p.account_id] || 0) + amt;
        totalPaidOut += amt;
      }
    });

    const accounts = [...funded, ...instant, ...instantLight];

    return Response.json({
      accounts,
      payoutMap,
      totalPaidOut,
    });
  } catch (error) {
    console.error('getLeaderboardData error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});