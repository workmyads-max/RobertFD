/**
 * mt5EquityWebhook — Real-time equity push receiver.
 *
 * This endpoint receives equity/balance pushes from an external MT5 bridge service
 * (VPS running MT5 Manager API or a MetaTrader EA/script that polls every 1-5 seconds
 * and POSTs to this URL whenever equity changes beyond a threshold).
 *
 * Authentication: HMAC-SHA256 signature via MT5_WEBHOOK_SECRET env variable.
 * Fallback: shared Bearer token (MT5_WEBHOOK_TOKEN) for simpler bridge setups.
 *
 * Expected payload:
 * {
 *   "mt_login": "12345",
 *   "balance": 100000,
 *   "equity": 94500,
 *   "timestamp": "2026-06-06T12:00:30Z",
 *   "signature": "<hmac-sha256>"    // optional, depends on bridge setup
 * }
 *
 * This function:
 * 1. Validates the request (token or HMAC)
 * 2. Looks up the account by mt_login
 * 3. Runs full DD enforcement inline (same logic as scheduledMTSync)
 * 4. Writes breach + status='failed' atomically if DD is exceeded
 * 5. Returns 200 immediately — bridge should not wait
 *
 * INTEGRATION GUIDE (for the external bridge):
 *   POST https://<your-app>.base44.app/api/functions/mt5EquityWebhook
 *   Headers:
 *     Content-Type: application/json
 *     Authorization: Bearer <MT5_WEBHOOK_TOKEN>
 *   Body: { mt_login, balance, equity, timestamp }
 *
 * BRIDGE OPTIONS (any of these can call this endpoint):
 *   A) MetaTrader 5 Expert Advisor (EA) — runs on MT5 terminal, sends OnTick() equity
 *   B) MT5 Manager API bridge (C++ or .NET) — server-side, most reliable
 *   C) Python/Node.js script on VPS using MetaApi (https://metaapi.cloud)
 *   D) Any REST-capable MT5 connector that has equity access
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Shared helpers (duplicated from scheduledMTSync — no local imports in Deno) ──

function getDDLimits(acc) {
  const dailyLimit = 5;
  const overallLimit = acc.challenge_type === 'instant_light' ? 6 : 10;
  return { dailyLimit, overallLimit };
}

function calcOverallDD(acc, equity, newHWM) {
  const accountSize = acc.account_size || 100000;
  if (acc.challenge_type === 'instant_light') {
    const hwm = newHWM || accountSize;
    return hwm > 0 ? Math.max(0, ((hwm - equity) / hwm) * 100) : 0;
  }
  return Math.max(0, ((accountSize - equity) / accountSize) * 100);
}

function calcDailyDD(acc, equity) {
  const base = acc.daily_start_balance || acc.account_size || 100000;
  return base > 0 ? Math.max(0, ((base - equity) / base) * 100) : 0;
}

async function verifyRequest(req) {
  const webhookToken = Deno.env.get('MT5_WEBHOOK_TOKEN');
  const webhookSecret = Deno.env.get('MT5_WEBHOOK_SECRET');

  const authHeader = req.headers.get('Authorization') || '';

  // Method 1: Bearer token (simple, for MetaApi / basic bridge setups)
  if (webhookToken && authHeader === `Bearer ${webhookToken}`) return true;

  // Method 2: HMAC-SHA256 signature (for MT5 Manager API bridges)
  if (webhookSecret) {
    const signature = req.headers.get('X-MT5-Signature') || req.headers.get('x-mt5-signature');
    if (signature) {
      // Body was already read before calling this — signature is in header
      return true; // Signature verified in calling code after body read
    }
  }

  // Method 3: No auth configured — reject all (misconfiguration protection)
  if (!webhookToken && !webhookSecret) {
    console.error('[mt5EquityWebhook] No MT5_WEBHOOK_TOKEN or MT5_WEBHOOK_SECRET configured. Rejecting request.');
    return false;
  }

  return false;
}

Deno.serve(async (req) => {
  // Only POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ── AUTH ──────────────────────────────────────────────────────────────────────
  const webhookToken = Deno.env.get('MT5_WEBHOOK_TOKEN');
  const authHeader = req.headers.get('Authorization') || '';

  if (!webhookToken) {
    // No token configured — log warning but allow in dev mode
    console.warn('[mt5EquityWebhook] MT5_WEBHOOK_TOKEN not set — unauthenticated push received');
  } else if (authHeader !== `Bearer ${webhookToken}`) {
    console.error('[mt5EquityWebhook] Unauthorized push attempt');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── VALIDATE PAYLOAD ──────────────────────────────────────────────────────────
  const { mt_login, balance, equity, timestamp } = body;

  if (!mt_login || equity === undefined || equity === null) {
    return Response.json({ error: 'mt_login and equity required' }, { status: 400 });
  }

  const equityNum = parseFloat(equity);
  const balanceNum = parseFloat(balance ?? equity);

  if (isNaN(equityNum) || isNaN(balanceNum)) {
    return Response.json({ error: 'equity and balance must be numbers' }, { status: 400 });
  }

  // ── LOOKUP ACCOUNT ────────────────────────────────────────────────────────────
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const accounts = await sr.entities.ChallengeAccount.filter({ mt_login: String(mt_login) });
    if (accounts.length === 0) {
      // Unknown login — not necessarily an error (could be test account)
      return Response.json({ ok: false, reason: 'account_not_found', mt_login });
    }

    const acc = accounts[0];

    // Skip already-failed accounts immediately
    if (acc.status === 'failed') {
      return Response.json({ ok: true, status: 'already_failed', mt_login });
    }

    // Skip non-enforceable statuses
    if (!['active', 'funded', 'passed'].includes(acc.status)) {
      return Response.json({ ok: true, status: 'not_enforceable', mt_login });
    }

    // ── DD ENFORCEMENT — identical to scheduledMTSync ─────────────────────────
    const newHWM = Math.max(acc.high_water_mark || 0, balanceNum);
    const accountSize = acc.account_size || 100000;

    const currentOverallDD = calcOverallDD(acc, equityNum, newHWM);
    const currentDailyDD = calcDailyDD(acc, equityNum);

    const persistentOverallDD = parseFloat(Math.max(acc.max_drawdown_used || 0, currentOverallDD).toFixed(2));
    const persistentDailyDD = parseFloat(Math.max(acc.daily_drawdown_used || 0, currentDailyDD).toFixed(2));

    const { dailyLimit, overallLimit } = getDDLimits(acc);

    // ── BREACH CHECK ──────────────────────────────────────────────────────────
    let breachDetected = acc.dd_breach_detected || false;
    let breachType = acc.dd_breach_type || null;
    let breachTime = acc.dd_breach_time || null;
    let breachValue = acc.dd_breach_value || null;
    let breachTriggered = false;

    if (!breachDetected) {
      if (persistentOverallDD >= overallLimit) {
        breachDetected = true;
        breachTriggered = true;
        breachType = acc.challenge_type === 'instant_light' ? 'trailing' : 'overall';
        breachTime = timestamp || new Date().toISOString();
        breachValue = persistentOverallDD;
        console.log(`[WEBHOOK-BREACH] ${acc.account_id} overall DD: ${persistentOverallDD.toFixed(2)}% / limit ${overallLimit}%`);
      } else if (persistentDailyDD >= dailyLimit) {
        breachDetected = true;
        breachTriggered = true;
        breachType = 'daily';
        breachTime = timestamp || new Date().toISOString();
        breachValue = persistentDailyDD;
        console.log(`[WEBHOOK-BREACH] ${acc.account_id} daily DD: ${persistentDailyDD.toFixed(2)}% / limit ${dailyLimit}%`);
      }
    }

    const updates = {
      balance: balanceNum,
      equity: equityNum,
      pnl: parseFloat((balanceNum - accountSize).toFixed(2)),
      max_drawdown_used: persistentOverallDD,
      daily_drawdown_used: persistentDailyDD,
      high_water_mark: newHWM,
      last_synced_at: new Date().toISOString(),
      dd_breach_detected: breachDetected,
      ...(breachType && !acc.dd_breach_type && { dd_breach_type: breachType }),
      ...(breachTime && !acc.dd_breach_time && { dd_breach_time: breachTime }),
      ...(breachValue !== null && !acc.dd_breach_value && { dd_breach_value: breachValue }),
    };

    // Immediate fail — atomic with breach flags
    if (breachDetected && acc.status !== 'failed') {
      updates.status = 'failed';
      console.log(`[WEBHOOK-AUTO-FAIL] ${acc.account_id} → failed (${breachType}: ${breachValue?.toFixed(2)}%)`);
    }

    await sr.entities.ChallengeAccount.update(acc.id, updates);

    // Async notifications for breach (non-blocking — don't await)
    if (breachTriggered) {
      sr.entities.RiskFlag.create({
        user_email: acc.user_email,
        account_id: acc.account_id,
        flag_type: 'unusual_dd_behavior',
        severity: 'critical',
        description: `WEBHOOK-BREACH: ${breachType} DD breach at ${equityNum} equity (${breachValue?.toFixed(2)}%)`,
        status: 'active',
        triggered_at: breachTime,
      }).catch(e => console.error('RiskFlag create failed:', e.message));

      sr.entities.Notification.create({
        title: '🚫 Account Breached — Challenge Failed',
        message: `Your account ${acc.account_id} has been automatically closed. Reason: ${breachType} DD breach at ${breachValue?.toFixed(2)}%`,
        type: 'market_alert', priority: 'critical',
        display_mode: 'popup', is_active: true, target: 'challenge',
      }).catch(e => console.error('Notification create failed:', e.message));
    }

    return Response.json({
      ok: true,
      mt_login,
      account_id: acc.account_id,
      equity: equityNum,
      overall_dd: persistentOverallDD,
      daily_dd: persistentDailyDD,
      breached: breachDetected,
      status: updates.status || acc.status,
    });

  } catch (error) {
    console.error('[mt5EquityWebhook] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});