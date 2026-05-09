import { base44 } from '@/api/base44Client';

/**
 * Auto-generate a certificate for a user milestone if one doesn't already exist.
 * Called when account status changes to phase2 passed, funded, etc.
 */
export async function maybeIssueCertificate({ userEmail, traderName, type, accountId, accountSize, challengeType }) {
  const existing = await base44.entities.Certificate.filter({ user_email: userEmail, type });
  if (existing.length > 0) return null; // Already issued

  const TITLE_MAP = {
    phase1_passed: 'Phase 1 Challenge Passed',
    phase2_passed: 'Phase 2 Challenge Passed',
    funded: 'Funded Trader Certificate',
    first_payout: 'First Profit Payout',
    consistency: 'Consistency Achievement',
    special: 'Special Achievement',
  };

  const certId = `RF-${type.replace(/_/g, '').toUpperCase().slice(0,4)}-${Date.now().toString(36).toUpperCase()}`;

  return base44.entities.Certificate.create({
    certificate_id: certId,
    user_email: userEmail,
    trader_name: traderName || userEmail,
    type,
    title: TITLE_MAP[type] || 'Achievement Certificate',
    account_id: accountId,
    account_size: accountSize,
    challenge_type: challengeType,
    issue_date: new Date().toISOString().split('T')[0],
    is_verified: true,
  });
}

/**
 * Ensure affiliate profile exists for user, auto-creating if missing.
 * Accepts an optional referral code from URL (?ref=CODE) to set referrer.
 */
export async function ensureAffiliateProfile(userEmail, refCode) {
  const profiles = await base44.entities.AffiliateProfile.filter({ user_email: userEmail });
  if (profiles.length > 0) return profiles[0];

  const myCode = 'RF' + Math.random().toString(36).slice(2, 8).toUpperCase();
  let referredByEmail = null;

  if (refCode) {
    const sponsors = await base44.entities.AffiliateProfile.filter({ referral_code: refCode });
    if (sponsors.length > 0) referredByEmail = sponsors[0].user_email;
  }

  return base44.entities.AffiliateProfile.create({
    user_email: userEmail,
    referral_code: myCode,
    referred_by_code: refCode || null,
    referred_by_email: referredByEmail,
    total_earned: 0, total_pending: 0, total_paid: 0,
    referral_clicks: 0, total_referrals: 0, conversions: 0,
  });
}

/**
 * Distribute affiliate commissions for a challenge purchase.
 * Level 1: 9%, Level 2: 4%, Level 3: 1%
 */
export async function distributeAffiliateCommissions({ buyerEmail, orderId, challengePrice }) {
  const RATES = { 1: 9, 2: 4, 3: 1 };
  let currentEmail = buyerEmail;

  for (let level = 1; level <= 3; level++) {
    const profiles = await base44.entities.AffiliateProfile.filter({ user_email: currentEmail });
    const profile = profiles[0];
    if (!profile?.referred_by_email) break;

    const sponsorEmail = profile.referred_by_email;
    const rate = RATES[level];
    const amount = (challengePrice * rate) / 100;

    await base44.entities.AffiliateCommission.create({
      affiliate_email: sponsorEmail,
      referred_email: buyerEmail,
      commission_type: 'challenge_purchase',
      level,
      source_amount: challengePrice,
      commission_rate: rate,
      commission_amount: amount,
      order_id: orderId,
      status: 'pending',
      notes: `L${level} commission from ${buyerEmail} challenge purchase`,
    });

    currentEmail = sponsorEmail;
  }
}