import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function sendViaResend(to, subject, html) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'XFunded Trader <noreply@xfundedtrader.com>',
      reply_to: 'support@xfundedtrader.com',
      to: [to],
      subject,
      html,
    }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || JSON.stringify(result));
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, type, phone, name } = await req.json();

    if (!email && !phone) {
      return Response.json({ error: 'Email or phone required' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP in database
    const otpRecord = await base44.asServiceRole.entities.OTP.create({
      email: email || null,
      phone: phone || null,
      type: type || 'registration',
      code: otp,
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
    });

    // Send email OTP via Resend
    if (email) {
      const BRAND = {
        bg: '#0f1016', panel: '#15161d', border: '#2a2b33',
        orange: '#FF5C00', muted: '#9a9ba3',
        font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      };

      const purposeLabels = {
        registration: 'Email Verification',
        withdrawal: 'Withdrawal Verification',
        security: 'Security Verification',
        phone_verification: 'Phone Verification',
      };
      const purposeLabel = purposeLabels[type] || 'Verification';

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
</head>
<body style="margin:0;padding:0;background:#0a0b10;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0b10;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:18px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:44px 40px 30px;border-bottom:1px solid ${BRAND.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:6px;">
                <tr>
                  <td style="padding:10px 18px 8px;background:#111318;border:1px solid #2a2b33;border-radius:10px;">
                    <div style="font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:900;letter-spacing:-1px;line-height:1;">
                      <span style="color:${BRAND.orange};">X</span><span style="color:#ffffff;">Funded</span>
                    </div>
                    <div style="font-family:${BRAND.font};font-size:11px;font-weight:600;color:${BRAND.muted};letter-spacing:4px;text-transform:uppercase;margin-top:2px;text-align:center;">TRADER</div>
                  </td>
                </tr>
              </table>
              <div style="height:1px;background:linear-gradient(90deg,transparent,${BRAND.orange},transparent);margin:18px 0 14px;"></div>
              <div style="font-family:${BRAND.font};font-size:22px;font-weight:800;color:${BRAND.orange};letter-spacing:-0.5px;">${purposeLabel}</div>
              <div style="font-family:${BRAND.font};font-size:13px;color:${BRAND.muted};margin-top:6px;">Your one-time verification code</div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;font-family:${BRAND.font};">
              <p style="color:#d4d5db;font-size:15px;line-height:1.7;margin:0 0 20px;">
                Hello${name ? ` <strong style="color:${BRAND.orange};">${name}</strong>` : ''}, your verification code is below:
              </p>
              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
                <tr>
                  <td align="center" style="background:#1a120c;border:2px solid rgba(255,92,0,0.35);border-radius:18px;padding:34px 24px;">
                    <div style="color:${BRAND.muted};font-size:11px;text-transform:uppercase;letter-spacing:3px;margin-bottom:14px;">One-Time Password</div>
                    <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:${BRAND.orange};font-family:'JetBrains Mono','Courier New',monospace;">${otp}</div>
                    <div style="color:${BRAND.muted};font-size:12px;margin-top:14px;">Valid for 10 minutes only</div>
                  </td>
                </tr>
              </table>
              <!-- Security Notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
                <tr>
                  <td style="background:#101117;border:1px solid ${BRAND.border};border-radius:12px;padding:20px 22px;color:${BRAND.muted};font-size:13px;line-height:1.8;">
                    🔒 <strong style="color:#d4d5db;">Security tips:</strong><br>
                    • Never share this code with anyone, including XFunded staff<br>
                    • It expires after a single use or 10 minutes<br>
                    • Didn't request this? Contact <a href="mailto:support@xfundedtrader.com" style="color:${BRAND.orange};">support@xfundedtrader.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="background:#0a0b10;padding:32px 40px;border-top:1px solid ${BRAND.border};font-family:${BRAND.font};">
              <div style="color:${BRAND.muted};font-size:12px;line-height:1.8;">
                © 2026 XFunded Trader. All rights reserved.<br>
                Dubai International Financial Centre, UAE<br>
                <a href="mailto:support@xfundedtrader.com" style="color:${BRAND.muted};text-decoration:none;">support@xfundedtrader.com</a>
              </div>
              <div style="color:#54555c;font-size:11px;margin-top:14px;">This is an automated message. Please do not reply.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await sendViaResend(email, `Your ${purposeLabel} Code — XFunded Trader`, html);
    }

    return Response.json({
      success: true,
      otp_id: otpRecord.id,
      expires_at: expiresAt,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});