import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Supabase admin client for backend
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://wpzgwvimupbbuflsbkvc.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * Email templates for XFunded Trader - Premium Design
 */
function getEmailTemplate(type, data) {
  const baseStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(180deg, #0a0b10 0%, #1a1b2e 100%); color: #ffffff; line-height: 1.6; -webkit-font-smoothing: antialiased; }
    .container { max-width: 640px; margin: 0 auto; padding: 0; background: #0f1016; }
    .header { background: linear-gradient(135deg, rgba(255,92,0,0.08) 0%, rgba(204,255,0,0.04) 100%); padding: 48px 40px 32px; text-align: center; border-bottom: 1px solid rgba(255,92,0,0.2); position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,92,0,0.05) 0%, transparent 70%); animation: pulse 8s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
    .logo { width: 64px; height: 64px; background: linear-gradient(135deg, #FF5C00, #cc4900); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: white; margin-bottom: 20px; font-family: Georgia, serif; position: relative; z-index: 1; box-shadow: 0 8px 32px rgba(255,92,0,0.3); }
    h1 { font-size: 32px; font-weight: 900; background: linear-gradient(135deg, #FF5C00, #FF8A3D, #CCFF00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 12px; position: relative; z-index: 1; letter-spacing: -0.5px; }
    .subtitle { color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500; position: relative; z-index: 1; }
    .content { padding: 48px 40px; }
    .card { background: linear-gradient(135deg, rgba(255,92,0,0.06) 0%, rgba(139,92,246,0.04) 100%); border: 1px solid rgba(255,92,0,0.15); border-radius: 20px; padding: 32px; margin: 32px 0; position: relative; overflow: hidden; }
    .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(255,92,0,0.4), transparent); }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0; }
    .stat-box { background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; text-align: center; transition: all 0.3s ease; }
    .stat-value { font-size: 28px; font-weight: 900; color: #FF5C00; margin-bottom: 6px; letter-spacing: -0.5px; }
    .stat-label { color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
    .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FF5C00, #FF7A2F); color: white; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; margin-top: 24px; box-shadow: 0 8px 24px rgba(255,92,0,0.3); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px; }
    .button:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,92,0,0.4); }
    .info-box { background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; margin: 24px 0; }
    .info-box p { color: rgba(255,255,255,0.6); font-size: 13px; margin: 10px 0; line-height: 1.7; }
    .divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent); margin: 32px 0; }
    .footer { background: #0a0b10; text-align: center; padding: 40px; border-top: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.3); font-size: 12px; }
    .footer a { color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.2s ease; }
    .footer a:hover { color: #FF5C00; }
    .success { color: #10b981; text-shadow: 0 0 20px rgba(16,185,129,0.3); }
    .warning { color: #f59e0b; text-shadow: 0 0 20px rgba(245,158,11,0.3); }
    .error { color: #ef4444; text-shadow: 0 0 20px rgba(239,68,68,0.3); }
    .code-display { background: linear-gradient(135deg, rgba(255,92,0,0.12), rgba(139,92,246,0.08)); border: 2px solid rgba(255,92,0,0.3); border-radius: 24px; padding: 40px 32px; text-align: center; margin: 32px 0; position: relative; overflow: hidden; }
    .code-display::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,92,0,0.08) 0%, transparent 70%); animation: rotate 12s linear infinite; }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .code-value { font-size: 48px; font-weight: 900; letter-spacing: 16px; color: #FF5C00; text-shadow: 0 0 40px rgba(255,92,0,0.5); margin: 20px 0; font-family: 'JetBrains Mono', 'Courier New', monospace; position: relative; z-index: 1; }
  `;

  const templates = {
    otp: `
      <h1>Verification Code</h1>
      <p class="subtitle">Secure your account with two-factor authentication</p>
      <div class="content">
        <p style="color: rgba(255,255,255,0.85); font-size: 16px; margin-bottom: 32px;">
          Hello <strong style="color: #FF5C00;">${data.name || 'Trader'}</strong>,<br>
          Your one-time verification code is displayed below:
        </p>
        
        <div class="code-display">
          <div style="color: rgba(255,255,255,0.6); font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 12px; position: relative; z-index: 1;">One-Time Password</div>
          <div class="code-value">${data.code}</div>
          <div style="color: rgba(255,255,255,0.5); font-size: 13px; position: relative; z-index: 1;">⏱️ Valid for 10 minutes only</div>
        </div>
        
        <div class="info-box">
          <p style="margin-bottom: 12px;">🔒 <strong>Important Security Tips:</strong></p>
          <p>• Never share this code with anyone, including XFunded staff</p>
          <p>• This code expires after single use or 10 minutes</p>
          <p>• If you didn't request this, your account may be at risk</p>
          <p style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);">
            📧 <strong>Didn't request this?</strong> Contact support immediately at <a href="mailto:support@xfundedtrader.com" style="color: #FF5C00;">support@xfundedtrader.com</a>
          </p>
        </div>
      </div>
    `,
    
    registration: `
      <h1>Welcome to XFunded</h1>
      <p class="subtitle">Your professional trading journey begins now</p>
      <div class="content">
        <p style="color: rgba(255,255,255,0.85); font-size: 16px; margin-bottom: 32px; line-height: 1.8;">
          Welcome <strong style="color: #FF5C00;">${data.name || 'Trader'}</strong>!<br>
          Your XFunded Trader account has been successfully created. You're now part of an elite community of professional traders.
        </p>
        
        <div class="card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <div style="width: 40px; height: 40px; background: rgba(16,185,129,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 20px;">✓</span>
            </div>
            <div>
              <div style="color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 700;">Account Activated</div>
              <div style="color: rgba(255,255,255,0.5); font-size: 12px;">Ready to start trading</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <div style="color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Email</div>
              <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">${data.email}</div>
            </div>
            <div>
              <div style="color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Account Type</div>
              <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">${data.role || 'Trader'}</div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://xfundedtrader.com/dashboard" class="button">Access Your Dashboard</a>
        </div>
        
        <div class="info-box" style="margin-top: 32px;">
          <p>🎯 <strong>Next Steps:</strong></p>
          <p>• Complete your profile in the dashboard</p>
          <p>• Explore available challenge programs</p>
          <p>• Start your journey to funded trading</p>
        </div>
      </div>
    `,

    login_alert: `
      <h1>Security Alert</h1>
      <p class="subtitle">New account access detected</p>
      <div class="content">
        <div class="card" style="border-color: rgba(245,158,11,0.25); background: linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(245,158,11,0.03) 100%);">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
            <div style="width: 44px; height: 44px; background: rgba(245,158,11,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px;">🔔</div>
            <div>
              <div style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 700;">Login Successful</div>
              <div style="color: rgba(255,255,255,0.5); font-size: 13px;">Your account was accessed</div>
            </div>
          </div>
          
          <p style="color: rgba(255,255,255,0.85); margin-bottom: 24px; font-size: 15px;">
            Hello <strong>${data.name || 'Trader'}</strong>, we detected a new login to your account.
          </p>
          
          <div class="info-box">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <div style="color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Time</div>
                <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">${data.time || new Date().toLocaleString()}</div>
              </div>
              <div>
                <div style="color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">IP Address</div>
                <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">${data.ip || 'Unknown'}</div>
              </div>
            </div>
            <div>
              <div style="color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Device</div>
              <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; word-break: break-all;">${data.device || 'Unknown'}</div>
            </div>
          </div>
          
          <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06);">
            ⚠️ <strong>Not you?</strong> If you don't recognize this activity, change your password immediately and contact our security team.
          </p>
        </div>
      </div>
    `,

    challenge_purchase: `
      <h1>Order Confirmed</h1>
      <p class="subtitle">Your challenge is ready to begin</p>
      <div class="content">
        <p style="color: rgba(255,255,255,0.85); font-size: 16px; margin-bottom: 32px; line-height: 1.8;">
          Congratulations <strong style="color: #FF5C00;">${data.name || 'Trader'}</strong>!<br>
          Your trading challenge has been successfully purchased and is now active.
        </p>
        
        <div class="card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
            <div style="width: 44px; height: 44px; background: rgba(16,185,129,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px;">✅</div>
            <div>
              <div style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 700;">Payment Confirmed</div>
              <div style="color: rgba(255,255,255,0.5); font-size: 13px;">Challenge activated</div>
            </div>
          </div>
          
          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-value" style="font-size: 20px;">${(data.challenge_type || 'Two-Step').replace('-', ' ')}</div>
              <div class="stat-label">Program</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">$${(data.account_size || 100000).toLocaleString()}</div>
              <div class="stat-label">Capital</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="font-size: 18px;">${data.platform || 'xTrading'}</div>
              <div class="stat-label">Platform</div>
            </div>
            <div class="stat-box">
              <div class="stat-value success" style="font-size: 18px;">Active</div>
              <div class="stat-label">Status</div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://xfundedtrader.com/dashboard/accounts" class="button">View Account Details</a>
        </div>
        
        <div class="info-box" style="margin-top: 32px;">
          <p>📋 <strong>What's Next?</strong></p>
          <p>• Access your account credentials in the dashboard</p>
          <p>• Review trading rules and objectives</p>
          <p>• Start trading and reach your profit target</p>
        </div>
      </div>
    `,

    payout_approved: `
      <h1>Payout Approved</h1>
      <p class="subtitle">Your profit is being processed</p>
      <div class="content">
        <div class="card" style="border-color: rgba(16,185,129,0.25); background: linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.04) 100%);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 80px; height: 80px; background: rgba(16,185,129,0.15); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 40px; margin: 0 auto 20px; box-shadow: 0 8px 32px rgba(16,185,129,0.2);">💰</div>
            <div style="color: rgba(255,255,255,0.9); font-size: 18px; font-weight: 800; margin-bottom: 8px;">Profit Split Approved</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 13px;">Ready for transfer</div>
          </div>
          
          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-value" style="color: #10b981;">$${(data.amount || 0).toLocaleString()}</div>
              <div class="stat-label">Total Payout</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">$${(data.trader_share || 0).toLocaleString()}</div>
              <div class="stat-label">Your Share (80%)</div>
            </div>
          </div>
        </div>
        
        <div class="info-box">
          <p style="margin-bottom: 12px;">📊 <strong>Payment Details:</strong></p>
          <p>⏱️ <strong>Processing Time:</strong> 24-48 hours</p>
          <p>📬 <strong>Destination:</strong> ${data.wallet || 'Your registered wallet'}</p>
          <p>🔔 <strong>Notification:</strong> You'll receive confirmation once transferred</p>
        </div>
        
        <p style="color: rgba(255,255,255,0.6); font-size: 14px; text-align: center; margin-top: 32px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.06);">
          🎯 Keep trading! Your next payout request is available in 14 days.
        </p>
      </div>
    `,

    phase_passed: `
      <h1>Achievement Unlocked!</h1>
      <p class="subtitle">Outstanding performance</p>
      <div class="content">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 100px; height: 100px; background: linear-gradient(135deg, rgba(255,92,0,0.15), rgba(204,255,0,0.1)); border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 56px; margin: 0 auto 24px; box-shadow: 0 12px 48px rgba(255,92,0,0.25);">🏆</div>
          <h2 style="color: #FF5C00; font-size: 28px; font-weight: 900; margin-bottom: 12px; letter-spacing: -0.5px;">${data.phase || 'Phase'} Completed</h2>
          <p style="color: rgba(255,255,255,0.6); font-size: 16px;">
            Capital: <strong style="color: #FF5C00;">$${(data.account_size || 0).toLocaleString()}</strong>
          </p>
        </div>
        
        <div class="card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <div style="width: 40px; height: 40px; background: rgba(255,92,0,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">✓</div>
            <div>
              <div style="color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 700;">Phase Requirements Met</div>
              <div style="color: rgba(255,255,255,0.5); font-size: 12px;">Ready for next stage</div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://xfundedtrader.com/dashboard/certificates" class="button">Download Certificate</a>
        </div>
      </div>
    `,

    funded_approval: `
      <h1>You're Funded!</h1>
      <p class="subtitle">Welcome to the professional league</p>
      <div class="content">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 100px; height: 100px; background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08)); border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 56px; margin: 0 auto 24px; box-shadow: 0 12px 48px rgba(16,185,129,0.25);">💼</div>
          <h2 style="color: #10b981; font-size: 28px; font-weight: 900; margin-bottom: 12px; letter-spacing: -0.5px;">Funded Account Activated</h2>
          <p style="color: rgba(255,255,255,0.7); font-size: 16px; line-height: 1.8;">
            Congratulations! You now manage<br>
            <strong style="color: #FF5C00; font-size: 20px;">$${(data.account_size || 100000).toLocaleString()}</strong> in institutional capital
          </p>
        </div>
        
        <div class="card">
          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-value">80%</div>
              <div class="stat-label">Profit Split</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">5%</div>
              <div class="stat-label">Daily DD</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">10%</div>
              <div class="stat-label">Max DD</div>
            </div>
            <div class="stat-box">
              <div class="stat-value success">Active</div>
              <div class="stat-label">Status</div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://xfundedtrader.com/dashboard/terminal" class="button">Start Trading Now</a>
        </div>
        
        <div class="info-box" style="margin-top: 32px;">
          <p>🎯 <strong>Your Journey Continues:</strong></p>
          <p>• Access your funded account credentials</p>
          <p>• Trade with up to 80% profit split</p>
          <p>• Request payouts every 14 days</p>
          <p>• Scale your capital with consistent performance</p>
        </div>
      </div>
    `,
  };

  const template = templates[type] || templates.registration;
  
  const titles = {
    otp: 'Verification Code',
    registration: 'Welcome to XFunded',
    login_alert: 'Security Alert',
    challenge_purchase: 'Order Confirmed',
    payout_approved: 'Payout Approved',
    phase_passed: 'Achievement Unlocked',
    funded_approval: 'You\'re Funded!',
  };

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
      <h1>${titles[type] || 'XFunded Notification'}</h1>
      <p class="subtitle">Elite Proprietary Trading Platform</p>
    </div>
    ${template}
    <div class="footer">
      <p style="margin-bottom: 12px;">© 2026 XFunded Trader. All rights reserved.</p>
      <p style="margin-bottom: 8px;">Dubai International Financial Centre, UAE</p>
      <p style="margin-top: 12px;">
        <a href="mailto:support@xfundedtrader.com" style="color: rgba(255,255,255,0.5); text-decoration: none; border-bottom: 1px solid rgba(255,92,0,0.3);">support@xfundedtrader.com</a>
      </p>
      <p style="margin-top: 16px; font-size: 11px; color: rgba(255,255,255,0.25);">
        This is an automated message. Please do not reply.
      </p>
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
 * Send email via real SMTP (Namecheap / any SMTP provider)
 */
async function sendEmailViaSMTP(to, subject, body) {
  try {
    const host = Deno.env.get('SMTP_HOST');
    const port = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const username = Deno.env.get('SMTP_USERNAME');
    const password = Deno.env.get('SMTP_PASSWORD');
    const fromEmail = Deno.env.get('SMTP_FROM_EMAIL') || 'noreply@xfundedtrader.com';
    const fromName = Deno.env.get('SMTP_FROM_NAME') || 'XFunded Trader';

    if (!host || !username || !password) {
      console.error('SMTP not configured — missing SMTP_HOST, SMTP_USERNAME, or SMTP_PASSWORD');
      return false;
    }

    const nodemailer = (await import('npm:nodemailer@6.9.9')).default;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: username, pass: password },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html: body,
    });

    console.log(`Email sent via SMTP to ${to}`);
    return true;
  } catch (error) {
    console.error('SMTP send failed:', error.message);
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