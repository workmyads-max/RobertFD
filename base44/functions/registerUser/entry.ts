/**
 * registerUser — Creates user with password hash for custom auth
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const { email, password, firstName, lastName, country } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUsers = await sr.entities.User.filter({ email });
    if (existingUsers.length > 0) {
      return Response.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    // Create user - try service role first
    console.log('[registerUser] Attempting to create user:', email);
    
    let newUser;
    try {
      newUser = await sr.entities.User.create({
        email,
        full_name: fullName,
        role: 'user',
        password_hash: passwordHash,
        email_verified: false,
        ...(country && { country }),
      });
      console.log('[registerUser] Created via SR:', newUser.id);
    } catch (createErr) {
      console.error('[registerUser] SR create failed:', createErr.message);
      throw createErr;
    }

    console.log('[registerUser] User created successfully:', newUser.id);

    // Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    await sr.entities.OTP.create({
      email,
      type: 'registration',
      code: otp,
      expires_at: otpExpiresAt,
      verified: false,
      attempts: 0,
    });

    // Send OTP email via Resend
    try {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        const emailHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0a0b10;font-family:Inter,sans-serif;"><table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="600" style="background:#0f1016;border:1px solid #2a2b33;border-radius:18px;"><tr><td align="center" style="padding:44px 40px 30px;border-bottom:1px solid #2a2b33;"><div style="font-size:34px;font-weight:900;color:#fff;"><span style="color:#FF5C00;">X</span>Funded</div><div style="font-size:11px;font-weight:600;color:#9a9ba3;letter-spacing:4px;text-transform:uppercase;margin-top:2px;">TRADER</div><div style="height:1px;background:linear-gradient(90deg,transparent,#FF5C00,transparent);margin:18px 0 14px;"></div><div style="font-size:22px;font-weight:800;color:#FF5C00;">Email Verification</div></td></tr><tr><td style="padding:40px;color:#d4d5db;font-size:15px;"><p>Hello <strong style="color:#FF5C00;">${firstName || 'Trader'}</strong>, your verification code is:</p><table role="presentation" width="100%" style="margin:28px 0;"><tr><td align="center" style="background:#1a120c;border:2px solid rgba(255,92,0,0.35);border-radius:18px;padding:34px 24px;"><div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#FF5C00;font-family:monospace;">${otp}</div><div style="color:#9a9ba3;font-size:12px;margin-top:14px;">Valid for 10 minutes</div></td></tr></table><p style="color:#9a9ba3;font-size:13px;">Never share this code with anyone.</p></td></tr><tr><td align="center" style="background:#0a0b10;padding:32px 40px;border-top:1px solid #2a2b33;color:#9a9ba3;font-size:12px;">© 2026 XFunded Trader. All rights reserved.</td></tr></table></td></tr></table></body></html>`;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'XFunded Trader <noreply@xfundedtrader.com>',
            to: [email],
            subject: 'Your Verification Code - XFunded Trader',
            html: emailHtml,
          }),
        });
        console.log('[registerUser] OTP email sent to', email);
      }
    } catch (emailErr) {
      console.error('[registerUser] OTP email failed:', emailErr.message);
    }

    return Response.json({ 
      success: true,
      user_id: newUser.id,
      email: newUser.email,
      requires_otp: true,
      message: 'Account created. Please check your email for verification code.'
    });

  } catch (error) {
    console.error('registerUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});