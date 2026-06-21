import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Supabase admin client for backend
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://wpzgwvimupbbuflsbkvc.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * Email templates for XFunded Trader — Email-client-safe (Gmail/Outlook/Apple Mail)
 * Uses table layout + inline styles only (no flex/grid/animations/gradient-text).
 */
const BRAND = {
  bg: '#0f1016',
  panel: '#15161d',
  border: '#2a2b33',
  orange: '#FF5C00',
  text: '#ffffff',
  muted: '#9a9ba3',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
};

// Reusable, email-safe building blocks (all inline styles + tables)
const ui = {
  paragraph: (html, extra = '') =>
    `<p style="color:#d4d5db;font-size:15px;line-height:1.7;margin:0 0 20px;${extra}">${html}</p>`,

  button: (text, url) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto 0;"><tr><td align="center" bgcolor="${BRAND.orange}" style="border-radius:12px;">
       <a href="${url}" target="_blank" style="display:inline-block;padding:15px 38px;font-family:${BRAND.font};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;letter-spacing:0.4px;text-transform:uppercase;">${text}</a>
     </td></tr></table>`,

  card: (innerHtml, accent = BRAND.orange) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr>
       <td style="background:${BRAND.panel};border:1px solid ${BRAND.border};border-top:3px solid ${accent};border-radius:14px;padding:28px;">${innerHtml}</td>
     </tr></table>`,

  infoBox: (innerHtml) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr>
       <td style="background:#101117;border:1px solid ${BRAND.border};border-radius:12px;padding:20px 22px;color:${BRAND.muted};font-size:13px;line-height:1.8;">${innerHtml}</td>
     </tr></table>`,

  // Stat grid as a 2-column table (renders everywhere)
  stats: (items) => {
    const cell = (it) =>
      `<td width="50%" style="padding:8px;">
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background:#101117;border:1px solid ${BRAND.border};border-radius:12px;padding:18px 12px;">
           <div style="font-size:22px;font-weight:800;color:${it.color || BRAND.orange};line-height:1.2;">${it.value}</div>
           <div style="color:${BRAND.muted};font-size:10px;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;margin-top:6px;">${it.label}</div>
         </td></tr></table>
       </td>`;
    let rows = '';
    for (let i = 0; i < items.length; i += 2) {
      rows += `<tr>${cell(items[i])}${items[i + 1] ? cell(items[i + 1]) : '<td width="50%"></td>'}</tr>`;
    }
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">${rows}</table>`;
  },

  codeBox: (label, code) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr>
       <td align="center" style="background:#1a120c;border:2px solid rgba(255,92,0,0.35);border-radius:18px;padding:34px 24px;">
         <div style="color:${BRAND.muted};font-size:11px;text-transform:uppercase;letter-spacing:3px;margin-bottom:14px;">${label}</div>
         <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:${BRAND.orange};font-family:'JetBrains Mono','Courier New',monospace;">${code}</div>
         <div style="color:${BRAND.muted};font-size:12px;margin-top:14px;">Valid for 10 minutes only</div>
       </td>
     </tr></table>`,
};

function getEmailTemplate(type, data) {
  const baseStyles = `
    body { margin:0; padding:0; background:#0a0b10; -webkit-font-smoothing:antialiased; }
    a { color:${BRAND.orange}; }
    @media only screen and (max-width:620px){ .xf-content{ padding:28px 22px !important; } .xf-header{ padding:34px 22px 24px !important; } }
  `;

  const name = data.name || 'Trader';
  const subtitles = {
    otp: 'Secure your account with two-factor authentication',
    registration: 'Your professional trading journey begins now',
    login_alert: 'New account access detected',
    challenge_purchase: 'Your challenge is ready to begin',
    payout_approved: 'Your profit is being processed',
    phase_passed: 'Outstanding performance',
    funded_approval: 'Welcome to the professional league',
    daily_dd_breach: 'Daily drawdown limit reached',
    max_dd_breach: 'Maximum drawdown limit reached — account closed',
    account_breached: 'Your account has been automatically closed',
    withdrawal_otp: 'Verify your withdrawal request',
    withdrawal_submitted: 'Your request is pending review',
    withdrawal_approved: 'Your payout has been approved',
    withdrawal_rejected: 'Your withdrawal request was not approved',
  };

  const templates = {
    otp:
      ui.paragraph(`Hello <strong style="color:${BRAND.orange};">${name}</strong>, your one-time verification code is below:`) +
      ui.codeBox('One-Time Password', data.code) +
      ui.infoBox(`🔒 <strong style="color:#d4d5db;">Security tips:</strong><br>• Never share this code with anyone, including XFunded staff<br>• It expires after a single use or 10 minutes<br>• Didn't request this? Contact <a href="mailto:support@xfundedtrader.com">support@xfundedtrader.com</a>`),

    registration:
      ui.paragraph(`Welcome <strong style="color:${BRAND.orange};">${name}</strong>! Your XFunded Trader account has been successfully created. You're now part of an elite community of professional traders.`) +
      ui.card(
        `<div style="color:${BRAND.green};font-size:15px;font-weight:700;margin-bottom:14px;">✓ Account Activated</div>` +
        ui.stats([
          { value: data.email || '—', label: 'Email', color: '#ffffff' },
          { value: data.role || 'Trader', label: 'Account Type', color: '#ffffff' },
        ])
      ) +
      ui.button('Access Your Dashboard', 'https://xfundedtrader.com/dashboard') +
      ui.infoBox(`🎯 <strong style="color:#d4d5db;">Next steps:</strong><br>• Complete your profile in the dashboard<br>• Explore available challenge programs<br>• Start your journey to funded trading`),

    login_alert:
      ui.paragraph(`Hello <strong>${name}</strong>, we detected a new login to your account.`) +
      ui.card(
        ui.stats([
          { value: data.time || new Date().toLocaleString(), label: 'Time', color: '#ffffff' },
          { value: data.ip || 'Unknown', label: 'IP Address', color: '#ffffff' },
          { value: data.device || 'Unknown', label: 'Device', color: '#ffffff' },
        ]),
        BRAND.amber
      ) +
      ui.infoBox(`⚠️ <strong style="color:#d4d5db;">Not you?</strong> If you don't recognize this activity, change your password immediately and contact our security team.`),

    challenge_purchase:
      ui.paragraph(`Congratulations <strong style="color:${BRAND.orange};">${name}</strong>! Your trading challenge has been successfully purchased and is now active.`) +
      ui.card(
        `<div style="color:${BRAND.green};font-size:15px;font-weight:700;margin-bottom:14px;">✅ Payment Confirmed</div>` +
        ui.stats([
          { value: (data.challenge_type || 'Two-Step').replace('-', ' '), label: 'Program' },
          { value: `$${(data.account_size || 100000).toLocaleString()}`, label: 'Capital' },
          { value: data.platform || 'MT5', label: 'Platform' },
          { value: 'Active', label: 'Status', color: BRAND.green },
        ]),
        BRAND.green
      ) +
      ui.button('View Account Details', 'https://xfundedtrader.com/dashboard/accounts') +
      ui.infoBox(`📋 <strong style="color:#d4d5db;">What's next?</strong><br>• Access your account credentials in the dashboard<br>• Review trading rules and objectives<br>• Start trading and reach your profit target`),

    payout_approved:
      ui.paragraph(`<strong style="color:${BRAND.green};font-size:18px;">💰 Profit Split Approved</strong>`, 'text-align:center;') +
      ui.card(
        ui.stats([
          { value: `$${(data.amount || 0).toLocaleString()}`, label: 'Total Payout', color: BRAND.green },
          { value: `$${(data.trader_share || 0).toLocaleString()}`, label: 'Your Share (80%)' },
        ]),
        BRAND.green
      ) +
      ui.infoBox(`📊 <strong style="color:#d4d5db;">Payment details:</strong><br>⏱️ Processing time: 24–48 hours<br>📬 Destination: ${data.wallet || 'Your registered wallet'}<br>🔔 You'll receive confirmation once transferred`),

    phase_passed:
      ui.paragraph(`🏆 <strong style="color:${BRAND.orange};font-size:22px;">${data.phase || 'Phase'} Completed</strong>`, 'text-align:center;') +
      ui.paragraph(`Capital: <strong style="color:${BRAND.orange};">$${(data.account_size || 0).toLocaleString()}</strong>`, 'text-align:center;') +
      ui.card(`<div style="color:#d4d5db;font-size:15px;font-weight:700;">✓ Phase Requirements Met</div><div style="color:${BRAND.muted};font-size:12px;margin-top:4px;">Ready for next stage</div>`) +
      ui.button('Download Certificate', 'https://xfundedtrader.com/dashboard/certificates'),

    funded_approval:
      ui.paragraph(`💼 <strong style="color:${BRAND.green};font-size:22px;">Funded Account Activated</strong>`, 'text-align:center;') +
      ui.paragraph(`Congratulations! You now manage <strong style="color:${BRAND.orange};">$${(data.account_size || 100000).toLocaleString()}</strong> in institutional capital.`, 'text-align:center;') +
      ui.card(
        ui.stats([
          { value: '80%', label: 'Profit Split' },
          { value: '5%', label: 'Daily DD' },
          { value: '10%', label: 'Max DD' },
          { value: 'Active', label: 'Status', color: BRAND.green },
        ]),
        BRAND.green
      ) +
      (data.mt_login
        ? ui.card(
            `<div style="color:${BRAND.muted};font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Account Credentials</div>` +
            ui.stats([
              { value: data.mt_login, label: 'Login ID' },
              { value: data.mt_password || '—', label: 'Password' },
              { value: data.mt_server || '—', label: 'Server' },
            ])
          )
        : '') +
      ui.button('Access Your Dashboard', 'https://xfundedtrader.com/dashboard'),

    daily_dd_breach:
      ui.paragraph(`🚨 <strong style="color:${BRAND.red};font-size:20px;">Daily Drawdown Breached</strong>`, 'text-align:center;') +
      ui.paragraph(`Account: <strong style="color:${BRAND.orange};">${data.account_id || 'N/A'}</strong>`, 'text-align:center;') +
      ui.card(
        ui.stats([
          { value: `${data.daily_dd_used || '0'}%`, label: 'DD Used', color: BRAND.red },
          { value: '5%', label: 'Daily Limit' },
        ]),
        BRAND.red
      ) +
      ui.infoBox(`Reason: ${data.breach_reason || 'Daily drawdown limit exceeded'}`) +
      ui.button('View Dashboard', 'https://xfundedtrader.com/dashboard'),

    max_dd_breach:
      ui.paragraph(`💔 <strong style="color:${BRAND.red};font-size:20px;">Challenge Failed</strong>`, 'text-align:center;') +
      ui.paragraph(`Account <strong style="color:${BRAND.orange};">${data.account_id || 'N/A'}</strong> has been automatically closed.`, 'text-align:center;') +
      ui.card(
        ui.stats([
          { value: `${data.max_dd_used || '0'}%`, label: 'Max DD Used', color: BRAND.red },
          { value: '10%', label: 'Max Limit' },
          { value: `$${(data.account_size || 0).toLocaleString()}`, label: 'Account Size' },
          { value: 'Closed', label: 'Status', color: BRAND.red },
        ]),
        BRAND.red
      ) +
      ui.infoBox(`🔄 <strong style="color:#d4d5db;">What's next?</strong><br>• Review your trading strategy<br>• Purchase a new challenge to try again<br>• Contact support if you believe this was an error`) +
      ui.button('Start New Challenge', 'https://xfundedtrader.com/challenges'),

    account_breached:
      ui.paragraph(`🚫 <strong style="color:${BRAND.red};font-size:20px;">Challenge Failed</strong>`, 'text-align:center;') +
      ui.paragraph(`Account <strong style="color:${BRAND.orange};">${data.account_id || ''}</strong> has been closed.<br>Reason: ${data.breach_reason || 'Drawdown limit exceeded'}`, 'text-align:center;') +
      ui.button('Start New Challenge', 'https://xfundedtrader.com/challenges'),

    withdrawal_otp:
      ui.paragraph(`Hello <strong style="color:${BRAND.orange};">${name}</strong>, you requested a withdrawal of <strong style="color:${BRAND.orange};">$${(data.amount || 0).toLocaleString()}</strong>. Enter the code below to confirm.`) +
      ui.codeBox('Withdrawal OTP', data.code) +
      ui.infoBox(`⚠️ <strong style="color:#d4d5db;">Security notice:</strong><br>• Never share this code with anyone<br>• XFunded staff will never ask for this code<br>• If you didn't request this withdrawal, contact support immediately`),

    withdrawal_submitted:
      ui.paragraph(`⏳ <strong style="color:${BRAND.amber};">Withdrawal Pending Review</strong> — usually processed within 24–48 hours.`) +
      ui.card(
        ui.stats([
          { value: `$${(data.amount || 0).toLocaleString()}`, label: 'Amount' },
          { value: 'Pending', label: 'Status', color: BRAND.amber },
        ]),
        BRAND.amber
      ) +
      (data.wallet_address ? ui.infoBox(`Destination: <strong style="color:#d4d5db;">${data.wallet_address}</strong>`) : '') +
      ui.button('View Dashboard', 'https://xfundedtrader.com/dashboard'),

    withdrawal_approved:
      ui.paragraph(`✅ <strong style="color:${BRAND.green};font-size:20px;">Withdrawal Approved</strong>`, 'text-align:center;') +
      ui.card(
        ui.stats([
          { value: `$${(data.amount || 0).toLocaleString()}`, label: 'Amount', color: BRAND.green },
          { value: 'Approved', label: 'Status', color: BRAND.green },
        ]),
        BRAND.green
      ) +
      (data.transaction_id ? ui.infoBox(`Transaction ID: <strong style="color:#d4d5db;">${data.transaction_id}</strong>`) : '') +
      ui.button('View Dashboard', 'https://xfundedtrader.com/dashboard'),

    withdrawal_rejected:
      ui.paragraph(`❌ <strong style="color:${BRAND.red};font-size:20px;">Withdrawal Rejected</strong>`, 'text-align:center;') +
      ui.infoBox(`Reason: <strong style="color:#d4d5db;">${data.reason || 'Please contact support for details.'}</strong>`) +
      ui.button('Contact Support', 'https://xfundedtrader.com/dashboard'),
  };

  const template = templates[type] || templates.registration;

  const titles = {
    otp: 'Verification Code',
    registration: 'Welcome to XFunded',
    login_alert: 'Security Alert',
    challenge_purchase: 'Order Confirmed',
    payout_approved: 'Payout Approved',
    phase_passed: 'Achievement Unlocked',
    funded_approval: "You're Funded!",
    daily_dd_breach: 'Daily DD Breach',
    max_dd_breach: 'Account Breached',
    account_breached: 'Challenge Failed',
    withdrawal_otp: 'Withdrawal OTP',
    withdrawal_submitted: 'Withdrawal Submitted',
    withdrawal_approved: 'Withdrawal Approved',
    withdrawal_rejected: 'Withdrawal Rejected',
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <style>${baseStyles}</style>
</head>
<body style="margin:0;padding:0;background:#0a0b10;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0b10;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:18px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td class="xf-header" align="center" style="padding:44px 40px 30px;border-bottom:1px solid ${BRAND.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" width="60" height="60" style="width:60px;height:60px;background:${BRAND.orange};border-radius:14px;font-family:Georgia,serif;font-size:22px;font-weight:900;color:#ffffff;">XF</td></tr></table>
              <div style="font-family:${BRAND.font};font-size:26px;font-weight:800;color:${BRAND.orange};margin-top:18px;letter-spacing:-0.5px;">${titles[type] || 'XFunded Notification'}</div>
              <div style="font-family:${BRAND.font};font-size:13px;color:${BRAND.muted};margin-top:6px;">${subtitles[type] || 'Elite Proprietary Trading Platform'}</div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="xf-content" style="padding:40px;font-family:${BRAND.font};">
              ${template}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="background:#0a0b10;padding:32px 40px;border-top:1px solid ${BRAND.border};font-family:${BRAND.font};">
              <div style="color:${BRAND.muted};font-size:12px;line-height:1.8;">
                © 2026 XFunded Trader. All rights reserved.<br>
                Dubai International Financial Centre, UAE<br>
                <a href="mailto:support@xfundedtrader.com" style="color:${BRAND.muted};text-decoration:none;border-bottom:1px solid rgba(255,92,0,0.4);">support@xfundedtrader.com</a>
              </div>
              <div style="color:#54555c;font-size:11px;margin-top:14px;">This is an automated message. Please do not reply.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
 * Send email via Resend API
 */
async function sendEmailViaSMTP(to, subject, body, sr) {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY not set');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'XFunded Trader <noreply@xfundedtrader.com>',
        reply_to: 'support@xfundedtrader.com',
        to: [to],
        subject,
        html: body,
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || JSON.stringify(result));
    console.log('[EMAIL] Sent via Resend to', to, '— id:', result.id);
    return true;
  } catch (error) {
    console.error('[EMAIL] Resend failed:', error.message);
    return false;
  }
}


Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
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

      const sent = await sendEmailViaSMTP(to, '🔐 Your Verification Code - XFunded Trader', emailBody, sr);
      
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
        daily_dd_breach: '⚠️ Daily Drawdown Limit Reached',
        max_dd_breach: '🚨 Account Breached — Challenge Failed',
        account_breached: '🚫 Account Closed — Drawdown Breach',
        withdrawal_otp: '🔐 Withdrawal Verification Code',
        withdrawal_submitted: '⏳ Withdrawal Request Submitted',
        withdrawal_approved: '✅ Withdrawal Approved',
        withdrawal_rejected: '❌ Withdrawal Rejected',
      };

      const subject = subjectMap[type] || 'XFunded Trader Notification';
      const sent = await sendEmailViaSMTP(to, subject, emailBody, sr);
      
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