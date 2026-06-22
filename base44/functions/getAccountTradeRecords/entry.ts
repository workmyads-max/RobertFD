/**
 * getAccountTradeRecords — CENTRAL trade-data source for Account Overview.
 *
 * Uses service role (bypasses RLS) with case-insensitive email ownership check.
 * Returns TradeRecords for the requested account, filtered by the account's
 * CURRENT mt_login — so each distinct MT5 account shows ONLY its own trades.
 *
 * mt_login filtering (per-MT5-account data isolation):
 *   - If the account has mt_login set, returns records where:
 *       record.mt_login == account.mt_login  (new records, strictly matched)
 *       OR record.mt_login is null/empty      (legacy records pre-mt_login field)
 *   - If the account has NO mt_login, returns all records for that account_id.
 *
 * This ensures:
 *   - Phase 2 account (new account_id + new mt_login): shows ONLY Phase 2 trades
 *   - Trashed Phase 1 account (old account_id + old mt_login): shows its own trades
 *   - Legacy accounts (pre-fix): graceful fallback, no data lost
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

    // ── FETCH ALL TRADE RECORDS for this account_id (service role, no RLS) ────
    const records = await base44.asServiceRole.entities.TradeRecord.filter(
      { account_id },
      '-close_time',
      500
    );

    // ── mt_login FILTER — per-MT5-account data isolation ──────────────────────
    // If the account has mt_login, keep only records matching that mt_login,
    // PLUS legacy records that have no mt_login set (pre-fix data).
    // This prevents Phase 1 trades from leaking into Phase 2's Account Overview
    // when account_ids are distinct (post-fix), while preserving legacy data.
    const accountMtLogin = account.mt_login ? String(account.mt_login) : null;
    let filtered = Array.isArray(records) ? records : [];
    if (accountMtLogin) {
      filtered = filtered.filter(t => {
        const recMtLogin = t.mt_login ? String(t.mt_login) : '';
        return recMtLogin === accountMtLogin || !recMtLogin;
      });
    }

    const trades = filtered.map(t => ({
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
        mt_login: account.mt_login,
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