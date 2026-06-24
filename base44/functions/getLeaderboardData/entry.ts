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

    // Fetch KYC records to use nationality as a country fallback for accounts
    // that don't have the country field populated from the purchase order.
    const kycRecords = await sr.entities.KYCVerification.filter({ status: 'approved' }, '-submitted_at', 500);
    const kycCountryMap = {};
    kycRecords.forEach(k => {
      if (k.user_email && k.nationality) {
        const email = k.user_email.toLowerCase().trim();
        // nationality may be full country name or ISO code — store as-is
        kycCountryMap[email] = k.nationality;
      }
    });

    // Fetch paid orders as a secondary country fallback (from checkout billing address)
    const paidOrders = await sr.entities.Order.filter({ payment_status: 'paid' }, '-created_date', 500);
    const orderCountryMap = {};
    paidOrders.forEach(o => {
      if (o.email && o.country) {
        const email = o.email.toLowerCase().trim();
        orderCountryMap[email] = o.country;
      }
    });

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

    const accounts = [...funded, ...instant, ...instantLight].map(a => {
      // Enrich: if account has no country, try KYC nationality → then order country
      const email = (a.user_email || '').toLowerCase().trim();
      if (!a.country && email) {
        a.country = kycCountryMap[email] || orderCountryMap[email] || '';
      }
      return a;
    });

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