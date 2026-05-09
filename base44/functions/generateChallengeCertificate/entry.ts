import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event } = await req.json();

    // Only process update events for funded/passed accounts
    if (event.type !== 'update') return Response.json({ ok: true });

    const account = event.data;
    if (!['funded', 'passed'].includes(account.status)) {
      return Response.json({ ok: true });
    }

    // Check if certificate already exists for this account
    const existingCerts = await base44.asServiceRole.entities.Certificate.filter({
      account_id: account.account_id,
      type: account.status === 'funded' ? 'funded' : 'phase' + (account.phase?.replace('phase', '') || '1') + '_passed',
    });

    if (existingCerts.length > 0) {
      return Response.json({ ok: true, message: 'Certificate already exists' });
    }

    // Get user details
    const users = await base44.asServiceRole.entities.User.filter({ email: account.user_email });
    const user = users[0];

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate certificate based on account status
    let certType, title;
    if (account.status === 'funded') {
      certType = 'funded';
      title = `Funded Trader Certificate - ${account.account_size.toLocaleString()} Account`;
    } else if (account.phase === 'phase2') {
      certType = 'phase2_passed';
      title = `Phase 2 Completion - ${account.account_size.toLocaleString()} Challenge`;
    } else {
      certType = 'phase1_passed';
      title = `Phase 1 Completion - ${account.account_size.toLocaleString()} Challenge`;
    }

    // Create certificate record
    const cert = await base44.asServiceRole.entities.Certificate.create({
      certificate_id: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      user_email: account.user_email,
      trader_name: user.full_name || 'Trader',
      type: certType,
      title: title,
      account_id: account.account_id,
      account_size: account.account_size,
      challenge_type: account.challenge_type,
      issue_date: new Date().toISOString().split('T')[0],
      is_verified: true,
    });

    return Response.json({
      ok: true,
      certificate_id: cert.id,
      message: `Certificate generated for ${user.full_name}`,
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});