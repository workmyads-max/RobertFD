import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { sendViaResend, emailShell } from '../../shared/prelaunchEmail.ts';

// Public endpoint (no auth) — called from the Coming Soon "Notify Me" form.
// Stores the email and sends a confirmation email from support@xfundedtrader.com.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function confirmationEmailHtml() {
  return emailShell("You're on the list", `
    <p style="color:#d4d5db;font-size:15px;line-height:1.7;margin:0 0 18px;">Thanks for subscribing to <strong style="color:#FF5C00;">XFunded Trader</strong> launch updates.</p>
    <p style="color:#9a9ba3;font-size:14px;line-height:1.7;margin:0 0 18px;">We'll email you the moment the platform goes live — challenge accounts, live MT5 metrics, instant payouts, and a real performance leaderboard.</p>
    <p style="color:#9a9ba3;font-size:14px;line-height:1.7;margin:0;">Launch is scheduled for <strong style="color:#ffffff;">August 3, 2026</strong>. Talk soon.</p>
  `);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Dedupe (case-insensitive) — fetch existing and match in code.
    const existing = await base44.asServiceRole.entities.PrelaunchSignup.list('-created_date', 5000);
    const dup = existing.find((s) => String(s.email || '').toLowerCase() === email);

    if (dup && dup.confirmation_sent) {
      // Already subscribed and confirmed — idempotent, do NOT re-send (anti-spam).
      return Response.json({ success: true, already_subscribed: true });
    }

    let recordId = dup?.id || null;
    if (!dup) {
      const created = await base44.asServiceRole.entities.PrelaunchSignup.create({
        email,
        confirmation_sent: false,
        live_notified: false,
        source: 'coming_soon_page',
      });
      recordId = created.id;
    }

    // Send confirmation email
    const subject = "You're on the list — XFunded Trader launches soon";
    const sent = await sendViaResend(email, subject, confirmationEmailHtml());

    if (sent && recordId) {
      await base44.asServiceRole.entities.PrelaunchSignup.update(recordId, {
        confirmation_sent: true,
      });
    }

    return Response.json({ success: true, already_subscribed: !!dup, email_sent: sent });
  } catch (error) {
    console.error('[prelaunchSignup] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});