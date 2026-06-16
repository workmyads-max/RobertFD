import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support event payload (entity automation) and direct calls
    let account, withdrawalAmount;
    if (body.event) {
      account = body.event.data;
      withdrawalAmount = body.withdrawal_amount || null;
    } else if (body.account_id) {
      const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ account_id: body.account_id });
      account = accounts[0];
      withdrawalAmount = body.withdrawal_amount || null;
      if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });
    } else {
      return Response.json({ error: 'Provide account_id or event payload' }, { status: 400 });
    }

    if (!account) return Response.json({ error: 'Account data missing' }, { status: 400 });

    // Determine certificate type
    let certType, title;
    if (body.certificate_type === 'withdrawal' || body.certificate_type === 'first_payout') {
      certType = 'first_payout';
      title = `Withdrawal Certificate — ${account.account_size?.toLocaleString() || ''} Account`;
    } else if (account.status === 'funded') {
      certType = 'funded';
      title = `Funded Trader — $${account.account_size?.toLocaleString() || '0'} Account`;
    } else if (account.status === 'passed' && account.phase === 'phase2') {
      certType = 'phase2_passed';
      title = `Phase 2 Completion — $${account.account_size?.toLocaleString() || '0'} Challenge`;
    } else if (account.status === 'passed' && account.phase === 'phase1') {
      certType = 'phase1_passed';
      title = `Phase 1 Completion — $${account.account_size?.toLocaleString() || '0'} Challenge`;
    } else {
      // Not yet eligible
      return Response.json({ ok: true, message: 'Account not yet eligible for certificate' });
    }

    // Check if certificate already exists
    const existing = await base44.asServiceRole.entities.Certificate.filter({
      account_id: account.account_id,
      type: certType,
    });
    if (existing.length > 0) {
      return Response.json({ ok: true, message: 'Certificate already exists', certificate_id: existing[0].id });
    }

    // Get user name
    const users = await base44.asServiceRole.entities.User.filter({ email: account.user_email });
    const user = users[0];
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    // Generate cert ID
    const prefix = certType === 'phase1_passed' ? 'PH1' : certType === 'phase2_passed' ? 'PH2' : certType === 'first_payout' ? 'WD' : 'FD';
    const certId = `XFT-${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const certData = {
      certificate_id: certId,
      user_email: account.user_email,
      trader_name: user.full_name || 'Trader',
      type: certType,
      title,
      account_id: account.account_id,
      account_size: account.account_size,
      challenge_type: account.challenge_type,
      issue_date: new Date().toISOString().split('T')[0],
      is_verified: true,
    };

    if (withdrawalAmount) {
      certData.withdrawal_amount = withdrawalAmount;
    }

    const cert = await base44.asServiceRole.entities.Certificate.create(certData);

    return Response.json({ ok: true, certificate_id: cert.id, certId, message: `Certificate generated for ${user.full_name}` });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});