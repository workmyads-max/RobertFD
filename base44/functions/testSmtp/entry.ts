import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const host = Deno.env.get('SMTP_HOST');
  const port = 587; // Force 587 to test
  const username = Deno.env.get('SMTP_USERNAME');
  const password = Deno.env.get('SMTP_PASSWORD');
  const fromEmail = Deno.env.get('SMTP_FROM_EMAIL');
  const fromName = Deno.env.get('SMTP_FROM_NAME');

  const config = {
    host: host || 'MISSING',
    port,
    username: username || 'MISSING',
    hasPassword: !!password,
    fromEmail: fromEmail || 'MISSING',
    fromName: fromName || 'MISSING',
  };

  if (!host || !username || !password) {
    return Response.json({ error: 'Missing secrets', config });
  }

  try {
    const nodemailer = (await import('npm:nodemailer@6.9.9')).default;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: username, pass: password },
      tls: { rejectUnauthorized: false },
    });

    const { body } = await req.json().catch(() => ({ body: {} }));
    const to = body?.to || username; // send to self if no target

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: 'SMTP Test - XFunded Trader',
      html: '<p>This is a test email. SMTP is working correctly!</p>',
    });

    return Response.json({ success: true, messageId: info.messageId, config });
  } catch (err) {
    return Response.json({
      success: false,
      error: err.message,
      code: err.code,
      command: err.command,
      response: err.response,
      responseCode: err.responseCode,
      config,
    });
  }
});