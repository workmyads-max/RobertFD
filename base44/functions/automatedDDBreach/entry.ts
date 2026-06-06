/**
 * automatedDDBreach — Institutional-grade automated drawdown breach detection
 * Scans ALL active/passed/funded accounts every 5 minutes
 * Also handles daily DD reset at 23:00 UTC (3:00 AM GMT+4)
 *
 * INSTITUTIONAL ENFORCEMENT (FIX #5 + #6):
 * - Reads PERSISTENT max_drawdown_used / daily_drawdown_used (never decreasing fields)
 * - Once dd_breach_detected=true, account fails regardless of current equity
 * - No future sync can undo a breach flag
 * - Handles all challenge types: two-step, instant, instant_light, funded
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function sendEmail(sr, to, type, data) {
  try {
    await sr.functions.invoke('emailService', { action: 'send_notification', to, type, data });
  } catch (e) {
    console.error('Email failed (non-blocking):', e.message);
  }
}

// Returns correct DD limits per challenge type (FIX #7)
function getDDLimits(account) {
  const dailyLimit = 5; // 5% daily for all types
  let overallLimit;
  if (account.challenge_type === 'instant_light') {
    overallLimit = 6; // Trailing 6%
  } else {
    overallLimit = 10; // Standard 10% for two-step, instant, funded
  }
  return { dailyLimit, overallLimit };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();

    const [active, passed, funded] = await Promise.all([
      sr.entities.ChallengeAccount.filter({ status: 'active' }),
      sr.entities.ChallengeAccount.filter({ status: 'passed' }),
      sr.entities.ChallengeAccount.filter({ status: 'funded' }),
    ]);
    const activeAccounts = [...active, ...passed, ...funded];

    const breached = [];
    const dailyResets = [];
    const errors = [];

    // ── DAILY DD RESET at 23:00 UTC ────────────────────────────────────────────
    const isDailyResetWindow = utcHour === 23 && utcMinute < 10;

    await Promise.all(activeAccounts.map(async (account) => {
      try {

        // ── DAILY DD RESET ──────────────────────────────────────────────────────
        // IMPORTANT: only reset daily_drawdown_used, never touch max_drawdown_used
        if (isDailyResetWindow) {
          const lastReset = account.daily_reset_at ? new Date(account.daily_reset_at) : null;
          const resetToday = lastReset && lastReset.getUTCDate() === now.getUTCDate();
          if (!resetToday) {
            await sr.entities.ChallengeAccount.update(account.id, {
              daily_pnl: 0,
              daily_drawdown_used: 0,
              daily_reset_at: now.toISOString(),
            });
            dailyResets.push(account.account_id);
          }
        }

        // ── BREACH DETECTION ───────────────────────────────────────────────────
        // Read PERSISTENT fields — these are already the worst values ever seen
        const maxDDUsed = account.max_drawdown_used || 0;
        const dailyDDUsed = account.daily_drawdown_used || 0;
        const { dailyLimit, overallLimit } = getDDLimits(account);

        // Also re-check if dd_breach_detected was set by a sync but status not yet updated
        const alreadyFlaggedBySync = account.dd_breach_detected === true;

        let breachReason = null;
        let breachType = account.dd_breach_type || null;

        if (alreadyFlaggedBySync && account.status !== 'failed') {
          // Sync detected a breach but status wasn't updated yet — catch it here
          const type = account.dd_breach_type || 'unknown';
          const val = account.dd_breach_value || maxDDUsed;
          breachReason = `DD breach previously detected (${type}): ${val.toFixed ? val.toFixed(2) : val}%`;
        } else if (!alreadyFlaggedBySync) {
          if (maxDDUsed >= overallLimit) {
            breachReason = `Max drawdown limit reached: ${maxDDUsed.toFixed(2)}% / ${overallLimit}%`;
            breachType = account.challenge_type === 'instant_light' ? 'trailing' : 'overall';
          } else if (dailyDDUsed >= dailyLimit) {
            breachReason = `Daily drawdown limit reached: ${dailyDDUsed.toFixed(2)}% / ${dailyLimit}%`;
            breachType = 'daily';
          }
        }

        if (breachReason) {
          const breachNow = new Date().toISOString();

          // FIX #6: Write permanent breach flags (never overwrite if already set from sync)
          await sr.entities.ChallengeAccount.update(account.id, {
            status: 'failed',
            dd_breach_detected: true,
            ...(account.dd_breach_type ? {} : { dd_breach_type: breachType }),
            ...(account.dd_breach_time ? {} : { dd_breach_time: breachNow }),
            ...(account.dd_breach_value ? {} : { dd_breach_value: breachType === 'daily' ? dailyDDUsed : maxDDUsed }),
          });

          // Create risk flag
          await sr.entities.RiskFlag.create({
            user_email: account.user_email,
            account_id: account.account_id,
            flag_type: 'unusual_dd_behavior',
            severity: 'critical',
            description: `AUTO-BREACH: ${breachReason}`,
            status: 'active',
            triggered_at: breachNow,
          });

          // User notification
          await sr.entities.Notification.create({
            title: '🚫 Account Breached — Challenge Failed',
            message: `Your account ${account.account_id} has been automatically closed. Reason: ${breachReason}`,
            type: 'market_alert',
            priority: 'critical',
            display_mode: 'popup',
            is_active: true,
            target: 'challenge',
          });

          // Email notification
          const emailType = (breachType === 'daily') ? 'daily_dd_breach' : 'max_dd_breach';
          await sendEmail(sr, account.user_email, emailType, {
            name: account.user_email,
            account_id: account.account_id,
            account_size: account.account_size,
            breach_reason: breachReason,
            daily_dd_used: account.daily_drawdown_used,
            max_dd_used: account.max_drawdown_used,
          });

          breached.push({
            account_id: account.account_id,
            user_email: account.user_email,
            breach_reason: breachReason,
            breach_type: breachType,
            max_dd_used: maxDDUsed,
            daily_dd_used: dailyDDUsed,
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
      daily_resets: dailyResets.length,
      errors: errors.length,
      breached_accounts: breached,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('automatedDDBreach error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});