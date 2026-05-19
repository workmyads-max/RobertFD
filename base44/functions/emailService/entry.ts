import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Supabase admin client for backend
const supabaseUrl = 'https://wpzgwvimupbbuflsbkvc.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * Email templates for XFunded Trader
 */
function getEmailTemplate(type, data) {
  const baseStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0b10; color: #ffffff; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid rgba(255,92,0,0.3); }
    .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #FF5C00, #cc4900); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: white; margin-bottom: 16px; font-family: Georgia, serif; }
    h1 { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #FF5C00, #FF8A3D); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
    .subtitle { color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500; }
    .content { padding: 40px 0; }
    .card { background: linear-gradient(135deg, rgba(255,92,0,0.08), rgba(139,92,246,0.06)); border: 1px solid rgba(255,92,0,0.2); border-radius: 16px; padding: 24px; margin: 24px 0; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0; }
    .stat-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 800; color: #FF5C00; margin-bottom: 4px; }
    .stat-label { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FF5C00, #FF7A2F); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; margin-top: 20px; }
    .info-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .info-box p { color: rgba(255,255,255,0.6); font-size: 13px; margin: 8px 0; }
    .footer { text-align: center; padding: 30px 0; border-top: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); font-size: 12px; }
    .success { color: #10b981; }
    .warning { color: #f59e0b; }
    .error { color: #ef4444; }
  `;

  const templates = {
    otp: `
      <h1>Verification Code</h1>
      <p class="subtitle">Secure your account</p>
      <div class="content">
        <p style="color: rgba(255,255,255,0.8); font-size: 15px; margin-bottom: 24px;">
          Hi <strong>${data.name || 'Trader'}</strong>, your verification code is:
        </p>
        <div style="background: linear-gradient(135deg, rgba(255,92,0,0.1), rgba(139,92,246,0.08)); border: 2px solid rgba(255,92,0,0.3); border-radius: 20px; padding: 32px; text-align: center; margin: 30px 0;">
          <div style="color: rgba(255,255,255,0.5); font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your Verification Code</div>
          <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #FF5C00; text-shadow: 0 0 30px rgba(255,92,0,0.4); margin: 16px 0; font-family: 'JetBrains Mono', monospace;">${data.code}</div>
          <div style="color: rgba(255,255,255,0.4); font-size: 12px;">Valid for 10 minutes</div>
        </div>
        <div class="info-box">
          <p>⚠️ <strong>Security Notice:</strong> Never share this code with anyone.</p>
          <p>🔒 This code can only be used once and will expire in 10 minutes.</p>
          <p>📧 If you didn't request this code, please ignore this email.</p>
        </div>
      </div>
    `,
    
    registration: `
      <h1>Welcome to XFunded Trader</h1>
      <p class="subtitle">Your trading journey starts here</p>
      <div class="content">
        <p style="color: rgba(255,255,255,0.8); font-size: 15px; margin-bottom: 24px;">
          Welcome <strong>${data.name || 'Trader'}</strong>! Your account has been successfully created.
        </p>
        <div class="card">
          <div style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 16px;">
            🎉 <strong>Account Details:</strong>
          </div>
          <div style="color: rgba(255,255,255,0.6); font-size: 13px;">
            Email: ${data.email}<br>
            Role: ${data.role || 'Trader'}<br>
            Registered: ${new Date().toLocaleDateString()}
          </div>
        </div>
        <a href="https://xfundedtrader.com/dashboard" class="button">Access Dashboard</a>
      </div>
    `,

    login_alert: `
      <h1>Security Alert</h1>
      <p class="subtitle">New login detected on your account</p>
      <div class="content">
        <div class="card" style="border-color: rgba(245,158,11,0.3); background: linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04));">
          <p style="color: rgba(255,255,255,0.8); margin-bottom: 16px;">Hi <strong>${data.name || 'Trader'}</strong>, your account was accessed successfully.</p>
          <div class="info-box">
            <p>🕐 <strong>Time:</strong> ${data.time || new Date().toLocaleString()}</p>
            <p>🌐 <strong>IP Address:</strong> ${data.ip || 'Unknown'}</p>
            <p>💻 <strong>Device:</strong> ${data.device || 'Unknown'}</p>
          </div>
          <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin-top: 16px;">If this wasn't you, please change your password immediately and contact support.</p>
        </div>
      </div>
    `,

    challenge_purchase: `
      <h1>Challenge Purchased</h1>
      <p class="subtitle">Order confirmation</p>
      <div class="content">
        <p style="color: rgba(255,255,255,0.8); font-size: 15px; margin-bottom: 24px;">
          Your challenge has been successfully purchased!
        </p>
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-value">${data.challenge_type || 'Two-Step'}</div>
            <div class="stat-label">Challenge Type</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">$${(data.account_size || 100000).toLocaleString()}</div>
            <div class="stat-label">Account Size</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${data.platform || 'xTrading'}</div>
            <div class="stat-label">Platform</div>
          </div>
          <div class="stat-box">
            <div class="stat-value success">Active</div>
            <div class="stat-label">Status</div>
          </div>
        </div>
        <a href="https://xfundedtrader.com/dashboard/accounts" class="button">View Account</a>
      </div>
    `,

    payout_approved: `
      <h1>Payout Approved</h1>
      <p class="subtitle">Your withdrawal is being processed</p>
      <div class="content">
        <div class="card" style="border-color: rgba(16,185,129,0.3); background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.04));">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.6);">Profit Split Approved</div>
          </div>
          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-value" style="color: #10b981;">$${(data.amount || 0).toLocaleString()}</div>
              <div class="stat-label">Total Amount</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">$${(data.trader_share || 0).toLocaleString()}</div>
              <div class="stat-label">Your Share (80%)</div>
            </div>
          </div>
        </div>
        <div class="info-box">
          <p>💰 <strong>Processing Time:</strong> 24-48 hours</p>
          <p>📬 <strong>Wallet:</strong> ${data.wallet || 'Your registered wallet'}</p>
          <p>🔔 You'll receive a notification once the transfer is complete.</p>
        </div>
      </div>
    `,

    phase_passed: `
      <h1>Phase Passed!</h1>
      <p class="subtitle">Congratulations on your achievement</p>
      <div class="content">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="font-size: 64px; margin-bottom: 16px;">🏆</div>
          <h2 style="color: #FF5C00; font-size: 24px; margin-bottom: 8px;">${data.phase || 'Phase'} Completed</h2>
          <p style="color: rgba(255,255,255,0.6);">Account Size: $${(data.account_size || 0).toLocaleString()}</p>
        </div>
        <a href="https://xfundedtrader.com/dashboard/certificates" class="button">Download Certificate</a>
      </div>
    `,

    funded_approval: `
      <h1>You're Funded!</h1>
      <p class="subtitle">Welcome to the funded trader program</p>
      <div class="content">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="font-size: 64px; margin-bottom: 16px;">💼</div>
          <h2 style="color: #10b981; font-size: 24px; margin-bottom: 8px;">Funded Account Activated</h2>
          <p style="color: rgba(255,255,255,0.6); font-size: 15px;">
            Congratulations! You now have access to a <strong style="color: #FF5C00;">$${(data.account_size || 100000).toLocaleString()}</strong> funded account.
          </p>
        </div>
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-value">80%</div>
            <div class="stat-label">Profit Split</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">5%</div>
            <div class="stat-label">Max Daily DD</div>
          </div>
        </div>
        <a href="https://xfundedtrader.com/dashboard/terminal" class="button">Start Trading</a>
      </div>
    `,
  };

  const template = templates[type] || templates.registration;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">XF</div>
      <h1>${type === 'registration' ? 'Welcome' : type === 'payout_approved' ? 'Payout Approved' : type === 'phase_passed' ? 'Achievement Unlocked' : type === 'funded_approval' ? 'You\'re Funded!' : 'Account Notification'}</h1>
      <p class="subtitle">XFunded Trader - Elite Proprietary Trading</p>
    </div>
    ${template}
    <div class="footer">
      <p>© 2026 XFunded Trader. All rights reserved.</p>
      <p>Dubai International Financial Centre, UAE</p>
      <p style="margin-top: 8px;"><a href="mailto:support@xfundedtrader.com" style="color: rgba(255,255,255,0.4);">support@xfundedtrader.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Log email to Supabase for tracking
 */
async function logEmailToSupabase(emailData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_logs')
      .insert([{
        recipient: emailData.to,
        subject: emailData.subject,
        email_type: emailData.type,
        status: emailData.status || 'sent',
        sent_at: new Date().toISOString(),
        metadata: emailData.metadata || {}
      }]);
    
    if (error) {
      console.error('Supabase email log error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Email logging failed:', error);
    return false;
  }
}

/**
 * Send email via SendGrid HTTP API
 */
async function sendEmailViaSMTP(to, subject, body) {
  try {
    const apiKey = Deno.env.get('SMTP_PASSWORD'); // SendGrid API key stored here
    const fromEmail = Deno.env.get('SMTP_FROM_EMAIL') || 'noreply@xfundedtrader.com';
    const fromName = Deno.env.get('SMTP_FROM_NAME') || 'XFunded Trader';

    if (!apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject: subject,
        content: [{ type: 'text/html', value: body }],
      }),
    });

    if (response.status === 202) {
      console.log('Email sent successfully via SendGrid API');
      return true;
    }

    const errorText = await response.text();
    console.error('SendGrid API error:', response.status, errorText);
    return false;
  } catch (error) {
    console.error('Email send failed:', error.message);
    return false;
  }
}


Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, ...payload } = await req.json();

    // ─── SEND OTP EMAIL ───────────────────────────────────────────────
    if (action === 'send_otp') {
      const { to, code, name, purpose, userId } = payload;
      
      if (!to || !code) {
        return Response.json({ error: 'Email and code required' }, { status: 400 });
      }

      const emailBody = getEmailTemplate('otp', {
        name: name || 'Trader',
        code,
        purpose: purpose || 'verification'
      });

      const sent = await sendEmailViaSMTP(to, '🔐 Your Verification Code - XFunded Trader', emailBody);
      
      // Log to Supabase
      await logEmailToSupabase({
        to,
        subject: '🔐 Your Verification Code - XFunded Trader',
        type: 'otp',
        status: sent ? 'sent' : 'failed',
        metadata: { userId, purpose }
      });

      return Response.json({ success: sent, message: sent ? 'OTP sent' : 'Failed to send' });
    }

    // ─── SEND NOTIFICATION EMAIL ──────────────────────────────────────
    if (action === 'send_notification') {
      const { to, type, data, userId } = payload;
      
      if (!to || !type) {
        return Response.json({ error: 'Email and type required' }, { status: 400 });
      }

      const emailBody = getEmailTemplate(type, data || {});
      
      const subjectMap = {
        registration: '🎉 Welcome to XFunded Trader',
        otp: '🔐 Your Verification Code',
        challenge_purchase: '✅ Challenge Purchased Successfully',
        payout_approved: '💰 Payout Approved - Processing',
        phase_passed: '🏆 Phase Passed - Congratulations!',
        funded_approval: '💼 You\'re Funded!',
        login_alert: '🔐 New Login to Your Account',
      };

      const subject = subjectMap[type] || 'XFunded Trader Notification';
      const sent = await sendEmailViaSMTP(to, subject, emailBody);
      
      // Log to Supabase
      await logEmailToSupabase({
        to,
        subject,
        type,
        status: sent ? 'sent' : 'failed',
        metadata: { userId, data }
      });

      return Response.json({ success: sent, message: sent ? 'Email sent' : 'Failed to send' });
    }

    // ─── GET EMAIL LOGS (Admin) ───────────────────────────────────────
    if (action === 'get_email_logs') {
      const { userId, limit = 50 } = payload;
      
      let query = supabaseAdmin
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('recipient', userId);
      }

      const { data, error } = await query;
      
      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ logs: data || [] });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('emailService error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});