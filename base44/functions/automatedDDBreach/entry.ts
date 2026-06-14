/**
 * automatedDDBreach — DB consistency safety checker.
 * Runs every 5 minutes via scheduled automation.
 * Does NOT call MT5 API — reads persistent DB fields written by scheduledMTSync.
 *
 * Roles (post-consolidation):
 * 1. Catch accounts where dd_breach_detected=true but status≠'failed'
 *    (mt5RealtimeSync or scheduledMTSync wrote the flag but status update failed)
 * 2. Catch accounts where stored DD values exceed limits but status≠'failed'
 *    (safety net for accounts where no active dashboard session was running)
 *
 * NOT responsible for:
 * - Daily reset (owned exclusively by scheduledMTSync at 23:00 UTC)
 * - Writing balance/equity/DD statistics (owned by scheduledMTSync)
 * - Fetching live MT5 data
 *
 * Scans: active + passed + funded accounts
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function sendEmail(sr, to, type, data) {
  try {
    await sr.functions.invoke('emailService', { action: 'send_notification', to, type, data });
  } catch (e) {
    console.error('Email failed (non-blocking):', e.message);
  }
}

/**
 * Read DD limits from the account's rule_snapshot (written at purchase time).
 * Falls back to legacy hardcoded values only if snapshot is absent (pre-migration accounts).
 */
function getDDLimits(account) {
  const snap = account.rule_snapshot || {};
  const dailyLimit = snap.daily_dd_limit ?? 5;
  const overallLimit = snap.max_dd_limit ?? (account.challenge_type === 'instant_light' ? 6 : 10);
  const isTrailing = snap.trailing_dd ?? (account.challenge_type === 'instant_light');
  return { dailyLimit, overallLimit, isTrailing };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // ── SECURITY: Multi-layer authorization ───────────────────────────────────
    // Layer 1: Check for authenticated admin user (browser session)
    // Layer 2: Check for scheduler secret token (internal automation)
    // Layer 3: Reject ALL anonymous callers
    const schedulerToken = req.headers.get('X-Scheduler-Token');
    const expectedToken = Deno.env.get('SCHEDULER_SECRET_TOKEN');
    
    let authorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') {
        authorized = true; // Admin user session
      }
    } catch {
      // No user session - will check scheduler token below
    }
    
    if (!authorized && schedulerToken && expectedToken && schedulerToken === expectedToken) {
      authorized = true; // Valid scheduler token
    }
    
    if (!authorized) {
      console.log('[automatedDDBreach] BLOCKED: Unauthorized caller - no admin session and no valid scheduler token');
      return Response.json({ 
        error: 'Forbidden: Admin authentication or valid scheduler token required',
        code: 'UNAUTHORIZED_ACCESS'
      }, { status: 403 });
    }

    const now = new Date();

    // Fetch all enforceable accounts in parallel
    const [active, passed, funded] = await Promise.all([
      sr.entities.ChallengeAccount.filter({ status: 'active' }),
      sr.entities.ChallengeAccount.filter({ status: 'passed' }),
      sr.entities.ChallengeAccount.filter({ status: 'funded' }),
    ]);
    const activeAccounts = [...active, ...passed, ...funded];

    const breached = [];
    const errors = [];

    // NOTE: Daily reset (daily_start_balance, daily_drawdown_used=0, daily_reset_at)
    // is handled exclusively by scheduledMTSync at 23:00 UTC.
    // automatedDDBreach no longer performs daily resets to avoid duplicate writes.

    await Promise.all(activeAccounts.map(async (account) => {
      try {

        // ── BREACH DETECTION ────────────────────────────────────────────────────
        const maxDDUsed = account.max_drawdown_used || 0;
        const dailyDDUsed = account.daily_drawdown_used || 0;
        const { dailyLimit, overallLimit } = getDDLimits(account);

        // Path 1: sync already wrote breach flag but status update may have failed
        const alreadyFlaggedBySync = account.dd_breach_detected === true;

        let breachReason = null;
        let breachType = account.dd_breach_type || null;

        if (alreadyFlaggedBySync && account.status !== 'failed') {
          const val = account.dd_breach_value || maxDDUsed;
          breachReason = `DD breach flag detected (${account.dd_breach_type || 'unknown'}): ${typeof val === 'number' ? val.toFixed(2) : val}%`;
        } else if (!alreadyFlaggedBySync) {
          // Path 2: persistent stored values exceeded limits (safety net)
          if (maxDDUsed >= overallLimit) {
            breachReason = `Max drawdown limit: ${maxDDUsed.toFixed(2)}% / ${overallLimit}%`;
            const { isTrailing } = getDDLimits(account);
            breachType = isTrailing ? 'trailing' : 'overall';
          } else if (dailyDDUsed >= dailyLimit) {
            breachReason = `Daily drawdown limit: ${dailyDDUsed.toFixed(2)}% / ${dailyLimit}%`;
            breachType = 'daily';
          }
        }

        if (breachReason) {
          const breachNow = new Date().toISOString();

          // ── BROKER-SIDE DISABLE — non-blocking ──────────────────────────────
          if (account.platform === 'mt5' && account.mt_login) {
            (async () => {
              try {
                // Read credentials directly from entity — avoids getPlatformCredentials auth chain
                const mt5Provs = await sr.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
                const api_key = mt5Provs[0]?.api_key || Deno.env.get('MT5_API_KEY');
                const server_url = mt5Provs[0]?.server_url || Deno.env.get('MT5_API_BASE_URL');
                if (api_key && server_url) {
                  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api_key}`, 'ApiKey': api_key };
                  // Tritech API: POST /api/v1/user/move-disabled
                  const disableRes = await fetch(`${server_url}/api/v1/user/move-disabled`, {
                    method: 'POST', headers,
                    body: JSON.stringify({ Login: parseInt(account.mt_login), apikey: api_key }),
                  });
                  const disableData = await disableRes.json().catch(() => ({}));
                  const disableErrCode = disableData?.data?.errorcode;
                  if (disableErrCode === 3) {
                    console.warn(`[MT5-DISABLE] MT_RET_ERR_PARAMS for ${account.mt_login} — group has no disabled sub-group. Account failed in DB only.`);
                  } else {
                    console.log(`[MT5-DISABLE] move-disabled ${account.mt_login}: code=${disableErrCode} msg=${disableData?.data?.errormsg}`);
                  }
                }
              } catch (e) {
                console.error(`[MT5-DISABLE] Failed for ${account.mt_login}:`, e.message);
              }
            })();
          }

          // Write status + permanent breach flags — never overwrite existing breach data
          await sr.entities.ChallengeAccount.update(account.id, {
            status: 'failed',
            dd_breach_detected: true,
            ...(account.dd_breach_type ? {} : { dd_breach_type: breachType }),
            ...(account.dd_breach_time ? {} : { dd_breach_time: breachNow }),
            ...(account.dd_breach_value ? {} : { dd_breach_value: breachType === 'daily' ? dailyDDUsed : maxDDUsed }),
          });

          // Audit trail
          await sr.entities.RiskFlag.create({
            user_email: account.user_email,
            account_id: account.account_id,
            flag_type: 'unusual_dd_behavior',
            severity: 'critical',
            description: `AUTO-BREACH: ${breachReason}`,
            status: 'active',
            triggered_at: breachNow,
          });

          await sr.entities.Notification.create({
            title: '🚫 Account Breached — Challenge Failed',
            message: `Your account ${account.account_id} has been automatically closed. Reason: ${breachReason}`,
            type: 'market_alert', priority: 'critical',
            display_mode: 'popup', is_active: true, target: 'challenge',
          });

          const emailType = breachType === 'daily' ? 'daily_dd_breach' : 'max_dd_breach';
          await sendEmail(sr, account.user_email, emailType, {
            name: account.user_email, account_id: account.account_id,
            account_size: account.account_size, breach_reason: breachReason,
            daily_dd_used: account.daily_drawdown_used, max_dd_used: account.max_drawdown_used,
          });

          breached.push({
            account_id: account.account_id, user_email: account.user_email,
            breach_reason: breachReason, breach_type: breachType,
            max_dd_used: maxDDUsed, daily_dd_used: dailyDDUsed,
          });
        }

      } catch (err) {
        errors.push({ account_id: account.account_id, error: err.message });
      }
    }));

    return Response.json({
      success: true,
      scanned: activeAccounts.length,
      breached: breached.length,
      errors: errors.length,
      breached_accounts: breached,
      timestamp: now.toISOString(),
      note: 'Daily resets are handled exclusively by scheduledMTSync at 23:00 UTC.',
    });

  } catch (error) {
    console.error('automatedDDBreach error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});