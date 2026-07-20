import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { isLaunched } from '../../shared/prelaunchConfig.ts';
import { sendViaResend, emailShell } from '../../shared/prelaunchEmail.ts';

// Scheduled automation — runs periodically. After the launch datetime it emails
// every subscriber who hasn't been notified yet, then marks them notified.
// Idempotent: no-op before launch and once all subscribers are notified.

function liveEmailHtml() {
  return emailShell('We are live', `
    <p style="color:#d4d5db;font-size:16px;line-height:1.7;margin:0 0 18px;"><strong style="color:#FF5C00;">XFunded Trader is live.</strong></p>
    <p style="color:#9a9ba3;font-size:14px;line-height:1.7;margin:0 0 24px;">The platform is now open. Create your account, pick a challenge, and trade on simulated MT5 accounts with real performance metrics and instant payouts.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 0;"><tr><td bgcolor="#FF5C00" style="border-radius:10px;">
      <a href="https://xfundedtrader.com/" target="_blank" style="display:inline-block;padding:14px 36px;font-family:'Inter',sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Visit XFunded Trader</a>
    </td></tr></table>
  `);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth: admin session OR scheduler secret token (mirrors scheduledMTSync).
    const schedulerToken = req.headers.get('X-Scheduler-Token');
    const expectedToken = Deno.env.get('SCHEDULER_SECRET_TOKEN');
    let authorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') authorized = true;
    } catch { /* no session — check token */ }
    if (!authorized && schedulerToken && expectedToken && schedulerToken === expectedToken) {
      authorized = true;
    }
    if (!authorized) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isLaunched()) {
      return Response.json({ launched: false, notified: 0 });
    }

    const all = await base44.asServiceRole.entities.PrelaunchSignup.list('-created_date', 5000);
    const pending = all.filter((s) => !s.live_notified);
    if (pending.length === 0) {
      return Response.json({ launched: true, notified: 0 });
    }

    const subject = 'XFunded Trader is live — your dashboard is ready';
    let notified = 0;
    for (const s of pending) {
      const ok = await sendViaResend(s.email, subject, liveEmailHtml());
      if (ok) {
        await base44.asServiceRole.entities.PrelaunchSignup.update(s.id, {
          live_notified: true,
          notified_at: new Date().toISOString(),
        });
        notified++;
      }
    }
    return Response.json({ launched: true, notified, total: pending.length });
  } catch (error) {
    console.error('[prelaunchLiveNotify] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});