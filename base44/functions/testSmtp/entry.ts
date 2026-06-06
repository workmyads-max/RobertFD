import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const host = Deno.env.get('SMTP_HOST') || 'mail.privateemail.com';
  const username = Deno.env.get('SMTP_USERNAME');
  const password = Deno.env.get('SMTP_PASSWORD');
  const fromEmail = Deno.env.get('SMTP_FROM_EMAIL');
  const fromName = Deno.env.get('SMTP_FROM_NAME') || 'XFunded Trader';

  const results = {};

  // Test all known Namecheap SMTP ports
  const configs = [
    { port: 465, secure: true,  label: '465-SSL'  },
    { port: 587, secure: false, label: '587-STARTTLS' },
    { port: 25,  secure: false, label: '25-plain' },
  ];

  const nodemailer = (await import('npm:nodemailer@6.9.9')).default;

  for (const cfg of configs) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: username, pass: password },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
      });

      await transporter.verify();
      results[cfg.label] = 'CONNECTED ✅';

      // If connected, try sending a real test email
      try {
        const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
        const to = body.to || username;
        const info = await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to,
          subject: `SMTP Test via port ${cfg.port} - XFunded`,
          html: `<p>SMTP is working on port <b>${cfg.port}</b> (${cfg.label}). ✅</p>`,
        });
        results[cfg.label + '_send'] = 'SENT ✅ messageId=' + info.messageId;
      } catch (sendErr) {
        results[cfg.label + '_send'] = 'SEND FAILED: ' + sendErr.message;
      }

    } catch (err) {
      results[cfg.label] = `FAILED ❌ ${err.code || ''} — ${err.message}`;
    }
  }

  return Response.json({
    host,
    username,
    fromEmail,
    results,
  });
});