/**
 * getAccountTradeRecords — CENTRAL trade-data source for Account Overview.
 *
 * Uses service role (bypasses RLS) with case-insensitive email ownership check.
 * Returns ALL TradeRecords for the requested account — both open and closed.
 *
 * This is the SINGLE source of truth for: closed trades, open trades (DB-backed),
 * daily summary, statistics, and performance metrics.
 *
 * Live/open positions are supplemented by getLivePositions (real-time MT5 API),
 * but closed trades and all derived stats come exclusively from here.
 *
 * Ownership: the account_id must belong to the authenticated user (matched
 * case-insensitively and trimmed on user_email).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { account_id } = body;

    if (!account_id) {
      return Response.json({ success: true, trades: [], message: 'No account_id provided' });
    }

    const normalizedEmail = (user.email || '').toLowerCase().trim();

    // ── OWNERSHIP CHECK (service role, case-insensitive) ──────────────────────
    // RLS exact-match (user_email = {{user.email}}) can hide the user's own
    // accounts when casing/whitespace differs. Service role bypasses RLS; we
    // enforce ownership manually.
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter(
      { account_id },
      '-created_date',
      10
    );
    const account = (accounts || []).find(
      a => (a.user_email || '').toLowerCase().trim() === normalizedEmail
    );

    if (!account) {
      return Response.json({ success: true, trades: [], message: 'Account not found or not owned by user' });
    }

    // ── FETCH ALL TRADE RECORDS (service role, no RLS) ───────────────────────
    const records = await base44.asServiceRole.entities.TradeRecord.filter(
      { account_id },
      '-close_time',
      500
    );

    const trades = (Array.isArray(records) ? records : []).map(t => ({
      ...t,
      // Normalize field names for UI consumption
      entry: t.entry ?? t.open_price ?? 0,
      close: t.close ?? t.close_price ?? 0,
      pnl: t.pnl ?? 0,
      lots: t.lots ?? 0,
      symbol: (t.symbol || '').toUpperCase(),
      status: t.status || 'closed',
    }));

    return Response.json({
      success: true,
      trades,
      account: {
        account_id: account.account_id,
        account_size: account.account_size,
        balance: account.balance,
        equity: account.equity,
        status: account.status,
        phase: account.phase,
      },
    });

  } catch (error) {
    console.error('[getAccountTradeRecords]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});