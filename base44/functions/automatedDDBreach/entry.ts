/**
 * automatedDDBreach — Institutional-grade automated drawdown breach detection
 * Scans ALL active accounts and automatically fails accounts that exceeded DD limits
 * Also handles daily DD reset at 23:00 UTC (3:00 AM GMT+4)
 * Called by scheduled automation every 5 minutes
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function sendEmail(sr, to, type, data) {
  try {
    await sr.functions.invoke('emailService', { action: 'send_notification', to, type, data });
  } catch (e) {
    console.error('Email failed (non-blocking):', e.message);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();

    // Fetch only active/passed/funded accounts directly — avoids loading full 500-record list
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
        // ── DAILY DRAWDOWN RESET ────────────────────────────────────────────────
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

        // ── MAX DD BREACH DETECTION ────────────────────────────────────────────
        const maxAllowedDD = account.challenge_type === 'instant_light'
          ? 6  // Instant Light trailing DD = 6%
          : 10; // Standard max DD = 10%

        const maxDDUsed = account.max_drawdown_used || 0;
        const dailyDDUsed = account.daily_drawdown_used || 0;
        const dailyDDLimit = 5; // 5% daily DD limit

        let breachReason = null;
        if (maxDDUsed >= maxAllowedDD) {
          breachReason = `Max drawdown limit reached: ${maxDDUsed.toFixed(2)}% / ${maxAllowedDD}%`;
        } else if (dailyDDUsed >= dailyDDLimit) {
          breachReason = `Daily drawdown limit reached: ${dailyDDUsed.toFixed(2)}% / ${dailyDDLimit}%`;
        }

        if (breachReason) {
          // Auto-fail the account
          await sr.entities.ChallengeAccount.update(account.id, { status: 'failed' });

          // Create risk flag
          await sr.entities.RiskFlag.create({
            user_email: account.user_email,
            account_id: account.account_id,
            flag_type: 'unusual_dd_behavior',
            severity: 'critical',
            description: `AUTO-BREACH: ${breachReason}`,
            status: 'active',
            triggered_at: now.toISOString(),
          });

          // Notify user
          await sr.entities.Notification.create({
            title: '🚫 Account Breached — Challenge Failed',
            message: `Your account ${account.account_id} has been automatically closed. Reason: ${breachReason}. Please review your account in the dashboard.`,
            type: 'market_alert',
            priority: 'critical',
            display_mode: 'popup',
            is_active: true,
            target: 'challenge',
          });

          // Send email notification
          await sendEmail(sr, account.user_email, 'account_breached', {
            name: account.user_email,
            account_id: account.account_id,
            account_size: account.account_size,
            breach_reason: breachReason,
          });

          breached.push({
            account_id: account.account_id,
            user_email: account.user_email,
            breach_reason: breachReason,
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