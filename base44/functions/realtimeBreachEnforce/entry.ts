/**
 * realtimeBreachEnforce — Backend breach enforcement for realtime DD violations.
 *
 * Called by LiveDDGuard (frontend) when live MT5 equity crosses a DD limit.
 * This is the authoritative backend write for breach enforcement.
 *
 * STRICT SCOPE — this function ONLY writes:
 *   - ChallengeAccount: status=failed, dd_breach_detected, dd_breach_type,
 *                       dd_breach_value, dd_breach_time
 *   - RiskFlag entity (audit trail)
 *   - Notification entity (user alert)
 *   - MT5 broker-side account disable (move-disabled)
 *
 * MUST NOT:
 *   - Create or update TradeRecords
 *   - Modify account statistics (win_rate, total_trades, balance, equity, pnl, etc.)
 *   - Modify trade history
 *
 * Idempotent: if account is already failed/breached, returns success without re-writing.
 * Ownership-verified: user must own the account.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { account_id, breach_type, breach_value, equity, balance } = body;

    if (!account_id || !breach_type || breach_value == null) {
      return Response.json({ error: 'account_id, breach_type, breach_value are required' }, { status: 400 });
    }
    if (!['daily', 'overall', 'trailing'].includes(breach_type)) {
      return Response.json({ error: 'Invalid breach_type' }, { status: 400 });
    }

    // ── FETCH ACCOUNT ─────────────────────────────────────────────────────────
    const accounts = await sr.entities.ChallengeAccount.filter({ account_id });
    if (!accounts.length) return Response.json({ error: 'Account not found' }, { status: 404 });
    const acc = accounts[0];

    // ── OWNERSHIP VERIFICATION ─────────────────────────────────────────────────
    if (acc.user_email !== user.email) {
      return Response.json({ error: 'Forbidden: account does not belong to this user' }, { status: 403 });
    }

    // ── IDEMPOTENCY — already breached/failed, nothing to do ──────────────────
    if (acc.dd_breach_detected || acc.status === 'failed') {
      return Response.json({
        success: true,
        already_breached: true,
        message: 'Account already marked as breached. No changes made.',
      });
    }

    const breachTime = new Date().toISOString();

    // ── 1. UPDATE CHALLENGEACCOUNT — breach fields + status only ─────────────
    await sr.entities.ChallengeAccount.update(acc.id, {
      status: 'failed',
      dd_breach_detected: true,
      dd_breach_type: breach_type,
      dd_breach_value: parseFloat(breach_value.toFixed(2)),
      dd_breach_time: breachTime,
    });
    console.log(`[realtimeBreachEnforce] ${account_id} → failed (${breach_type}: ${breach_value.toFixed(2)}%)`);

    // ── 2. DISABLE MT5 ACCOUNT — broker-side, non-blocking ────────────────────
    if (acc.platform === 'mt5' && acc.mt_login) {
      (async () => {
        try {
          const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
          const MT5_KEY  = Deno.env.get('MT5_API_KEY');
          if (!MT5_BASE || !MT5_KEY) return;

          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MT5_KEY}`,
            'ApiKey': MT5_KEY,
          };
          const disableRes = await fetch(`${MT5_BASE}/api/v1/user/move-disabled`, {
            method: 'POST', headers,
            body: JSON.stringify({ Login: parseInt(acc.mt_login), apikey: MT5_KEY }),
          });
          const disableData = await disableRes.json().catch(() => ({}));
          const errCode = disableData?.data?.errorcode;
          if (errCode === 3) {
            console.warn(`[MT5-DISABLE] MT_RET_ERR_PARAMS for ${acc.mt_login} — no disabled sub-group configured. DB-only disable applied.`);
          } else {
            console.log(`[MT5-DISABLE] move-disabled ${acc.mt_login}: code=${errCode} msg=${disableData?.data?.errormsg}`);
          }
        } catch (e) {
          console.error(`[MT5-DISABLE] Failed for ${acc.mt_login}:`, e.message);
        }
      })();
    }

    // ── 3. CREATE RISKFLAG — audit trail ──────────────────────────────────────
    const breachLabels = {
      daily: 'Daily drawdown limit exceeded',
      overall: 'Maximum drawdown limit exceeded',
      trailing: 'Trailing drawdown limit exceeded',
    };
    await sr.entities.RiskFlag.create({
      user_email: acc.user_email,
      account_id: account_id,
      flag_type: 'unusual_dd_behavior',
      severity: 'critical',
      description: `REALTIME BREACH: ${breachLabels[breach_type]} — ${breach_value.toFixed(2)}% (equity: $${equity?.toFixed(2) ?? 'N/A'})`,
      status: 'active',
      triggered_at: breachTime,
    });

    // ── 4. CREATE NOTIFICATION — user alert ───────────────────────────────────
    await sr.entities.Notification.create({
      title: '🚫 Challenge Account Failed',
      message: `Account ${account_id} breached: ${breachLabels[breach_type]}. DD reached ${breach_value.toFixed(2)}%. Account has been automatically closed.`,
      type: 'market_alert',
      priority: 'critical',
      display_mode: 'popup',
      is_active: true,
      target: 'challenge',
    });

    return Response.json({
      success: true,
      account_id,
      breach_type,
      breach_value: parseFloat(breach_value.toFixed(2)),
      breach_time: breachTime,
      mt5_disable_initiated: !!(acc.mt_login && acc.platform === 'mt5'),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});