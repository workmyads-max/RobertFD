import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, type, phone } = await req.json();

    if (!email && !phone) {
      return Response.json({ error: 'Email or phone required' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store OTP in database
    const otpRecord = await base44.entities.OTP.create({
      email: email || null,
      phone: phone || null,
      type: type || 'registration',
      code: otp,
      expires_at: expiresAt,
      verified: false
    });

    // Send email OTP
    if (email) {
      const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0b10; color: #ffffff; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid rgba(255,92,0,0.3); }
    .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #FF5C00, #cc4900); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: white; margin-bottom: 16px; font-family: Georgia, serif; }
    h1 { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #FF5C00, #FF8A3D); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
    .subtitle { color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500; }
    .content { padding: 40px 0; }
    .otp-box { background: linear-gradient(135deg, rgba(255,92,0,0.1), rgba(139,92,246,0.08)); border: 2px solid rgba(255,92,0,0.3); border-radius: 20px; padding: 32px; text-align: center; margin: 30px 0; }
    .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #FF5C00; text-shadow: 0 0 30px rgba(255,92,0,0.4); margin: 16px 0; font-family: 'JetBrains Mono', monospace; }
    .otp-label { color: rgba(255,255,255,0.5); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; }
    .info-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .info-box p { color: rgba(255,255,255,0.6); font-size: 13px; margin: 8px 0; }
    .footer { text-align: center; padding: 30px 0; border-top: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); font-size: 12px; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FF5C00, #FF7A2F); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">XF</div>
      <h1>Verification Code</h1>
      <p class="subtitle">XFunded Trader - Elite Proprietary Trading</p>
    </div>
    
    <div class="content">
      <p style="color: rgba(255,255,255,0.8); font-size: 15px; margin-bottom: 24px;">
        Your one-time verification code is:
      </p>
      
      <div class="otp-box">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 12px;">
          Valid for 10 minutes
        </div>
      </div>

      <div class="info-box">
        <p>⚠️ <strong>Security Notice:</strong> Never share this code with anyone.</p>
        <p>🔒 This code can only be used once and will expire in 10 minutes.</p>
        <p>📧 If you didn't request this code, please ignore this email.</p>
      </div>
    </div>

    <div class="footer">
      <p>© 2026 XFunded Trader. All rights reserved.</p>
      <p>Dubai International Financial Centre, UAE</p>
    </div>
  </div>
</body>
</html>
      `;

      await base44.integrations.Core.SendEmail({
        to: email,
        subject: '🔐 Your Verification Code - XFunded Trader',
        body: emailTemplate
      });
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