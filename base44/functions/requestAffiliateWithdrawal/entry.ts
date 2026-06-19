/**
 * requestAffiliateWithdrawal — Backend-secured affiliate commission withdrawal
 *
 * Validates:
 * 1. User owns the affiliate profile
 * 2. KYC approved
 * 3. Amount <= approved commissions balance
 * 4. No existing pending affiliate withdrawal
 * 5. Amount > 0 and >= min_withdrawal from settings
 * 6. Prevents negative balance and double withdrawal
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { amount, method, wallet_address } = body;

    if (!amount || !method || !wallet_address?.trim()) {
      return Response.json({ error: 'amount, method, wallet_address required' }, { status: 400 });
    }

    const requestedAmount = parseFloat(amount);
    if (!requestedAmount || requestedAmount <= 0) {
      return Response.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    // 1. Fetch and verify affiliate profile ownership
    const profiles = await base44.asServiceRole.entities.AffiliateProfile.filter({ user_email: user.email });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'No affiliate profile found' }, { status: 404 });
    if (profile.user_email !== user.email) {
      return Response.json({ error: 'Forbidden: You do not own this affiliate profile' }, { status: 403 });
    }
    if (profile.is_frozen) {
      return Response.json({ error: 'Your affiliate commissions are frozen. Contact support.' }, { status: 403 });
    }

    // 2. KYC approved
    const kycList = await base44.asServiceRole.entities.KYCVerification.filter({ user_email: user.email });
    const kyc = kycList[0];
    if (!kyc || kyc.status !== 'approved') {
      return Response.json({ error: 'KYC verification required before affiliate withdrawal' }, { status: 400 });
    }

    // 2b. Verify wallet address saved in user settings
    if (!user.payout_wallet_address && !user.usdt_trc20 && !user.bitcoin) {
      return Response.json({ error: 'Please save your payout wallet address in Settings → Payout Wallets first.' }, { status: 400 });
    }
    const savedWallet = user.payout_wallet_address || user.usdt_trc20 || user.bitcoin;

    // 3. Read min_withdrawal from AffiliateSettings
    const settingsList = await base44.asServiceRole.entities.AffiliateSettings.filter({ setting_key: 'global_config' });
    const settings = settingsList[0];
    const minWithdrawal = settings?.min_withdrawal ?? 50;

    if (requestedAmount < minWithdrawal) {
      return Response.json({ error: `Minimum withdrawal is $${minWithdrawal}` }, { status: 400 });
    }

    // 4. No existing pending affiliate withdrawal
    const existingPending = await base44.asServiceRole.entities.WithdrawalRequest.filter({
      user_email: user.email,
      account_id: 'affiliate',
      status: 'pending',
    });
    if (existingPending.length > 0) {
      return Response.json({ error: 'A pending affiliate withdrawal already exists' }, { status: 409 });
    }

    // 5. Compute approved commissions balance server-side
    const commissions = await base44.asServiceRole.entities.AffiliateCommission.filter({ affiliate_email: user.email });
    const approvedBalance = commissions
      .filter(c => c.status === 'approved')
      .reduce((s, c) => s + (c.commission_amount || 0), 0);

    if (requestedAmount > approvedBalance) {
      return Response.json({
        error: `Requested $${requestedAmount} exceeds approved balance $${approvedBalance.toFixed(2)}`,
      }, { status: 400 });
    }

    // 6. Calculate 5% fee and create withdrawal
    const withdrawalFee = parseFloat((requestedAmount * 0.05).toFixed(2));
    const netAmount = parseFloat((requestedAmount - withdrawalFee).toFixed(2));
    const withdrawalId = `AFF-WD-${Date.now().toString(36).toUpperCase()}`;
    await base44.asServiceRole.entities.WithdrawalRequest.create({
      withdrawal_id: withdrawalId,
      user_email: user.email,
      account_id: 'affiliate',
      amount: requestedAmount,
      withdrawal_fee: withdrawalFee,
      net_payout: netAmount,
      method,
      wallet_address: savedWallet.trim(),
      status: 'pending',
      notes: `Affiliate commission withdrawal. Approved balance: $${approvedBalance.toFixed(2)}. Fee (5%): $${withdrawalFee.toFixed(2)}. Net: $${netAmount.toFixed(2)}.`,
    });

    return Response.json({
      success: true,
      withdrawal_id: withdrawalId,
      amount: requestedAmount,
      approved_balance_at_submission: parseFloat(approvedBalance.toFixed(2)),
    });
  } catch (error) {
    console.error('requestAffiliateWithdrawal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});