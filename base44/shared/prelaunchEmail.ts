// Shared email sending for pre-launch functions (Resend API direct — reaches
// any email address, not just registered app users). Used by both
// prelaunchSignup (confirmation) and prelaunchLiveNotify (launch day).

const BRAND = {
  bg: '#0f1016',
  panel: '#15161d',
  border: '#2a2b33',
  orange: '#FF5C00',
  text: '#ffffff',
  muted: '#9a9ba3',
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
};

// Email-client-safe shell (table layout + inline styles only).
export function emailShell(title, innerHtml) {
  return `
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0b10;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0b10;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
        <tr><td align="center" style="padding:42px 40px 28px;border-bottom:1px solid ${BRAND.border};">
          <div style="font-family:${BRAND.font};font-size:30px;font-weight:900;letter-spacing:-1px;line-height:1;">
            <span style="color:${BRAND.orange};">X</span><span style="color:#ffffff;">Funded</span>
          </div>
          <div style="font-family:${BRAND.font};font-size:10px;font-weight:600;color:${BRAND.muted};letter-spacing:4px;text-transform:uppercase;margin-top:4px;">TRADER</div>
          <div style="height:1px;background:linear-gradient(90deg,transparent,${BRAND.orange},transparent);margin:20px 0 12px;"></div>
          <div style="font-family:${BRAND.font};font-size:20px;font-weight:800;color:${BRAND.orange};letter-spacing:-0.3px;">${title}</div>
        </td></tr>
        <tr><td style="padding:36px 40px;font-family:${BRAND.font};">${innerHtml}</td></tr>
        <tr><td align="center" style="background:#0a0b10;padding:26px 40px;border-top:1px solid ${BRAND.border};">
          <div style="color:${BRAND.muted};font-size:11px;line-height:1.8;">
            © 2026 XFunded Trader<br>
            <a href="mailto:support@xfundedtrader.com" style="color:${BRAND.muted};text-decoration:none;border-bottom:1px solid rgba(255,92,0,0.4);">support@xfundedtrader.com</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendViaResend(to, subject, html) {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY not set');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'XFunded Trader <support@xfundedtrader.com>',
        reply_to: 'support@xfundedtrader.com',
        to: [to],
        subject,
        html,
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.message || `Resend HTTP ${res.status}`);
    console.log('[prelaunchEmail] Sent to', to, '— id:', result.id);
    return true;
  } catch (e) {
    console.error('[prelaunchEmail] Resend failed:', e.message);
    return false;
  }
}