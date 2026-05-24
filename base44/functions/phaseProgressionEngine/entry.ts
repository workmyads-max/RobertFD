/**
 * phaseProgressionEngine — Institutional phase transition handler
 * Handles: Phase1→Phase2 provisioning, Phase2→ManualReview queue
 * Called by: admin when manually triggering progression, or by scheduled automation
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let p = '';
  for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

async function sendEmail(sr, to, type, data) {
  try {
    await sr.functions.invoke('emailService', { action: 'send_notification', to, type, data });
  } catch (e) {
    console.error('Email failed (non-blocking):', e.message);
  }
}

async function computeRiskScore(sr, account) {
  const trades = await sr.entities.TradeRecord.filter({ account_id: account.account_id });
  const flags = await sr.entities.RiskFlag.filter({ account_id: account.account_id, status: 'active' });

  let riskScore = 0;

  // Factor 1: Active risk flags
  riskScore += flags.filter(f => f.severity === 'critical').length * 30;
  riskScore += flags.filter(f => f.severity === 'high').length * 20;
  riskScore += flags.filter(f => f.severity === 'medium').length * 10;
  riskScore += flags.filter(f => f.severity === 'low').length * 3;

  // Factor 2: Max DD used (normalized)
  const ddUsed = account.max_drawdown_used || 0;
  if (ddUsed > 8) riskScore += 25;
  else if (ddUsed > 6) riskScore += 15;
  else if (ddUsed > 4) riskScore += 5;

  // Factor 3: Consistency (large single-trade profits)
  const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl);
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  if (closedTrades.length > 0) {
    const maxSinglePnl = Math.max(...closedTrades.map(t => t.pnl || 0));
    if (totalPnl > 0 && maxSinglePnl / totalPnl > 0.5) riskScore += 20; // 1 trade > 50% of profit
  }

  // Factor 4: Very short trade durations (HFT signal)
  const ultraShort = closedTrades.filter(t => {
    if (!t.open_time || !t.close_time) return false;
    return (new Date(t.close_time) - new Date(t.open_time)) < 10000;
  });
  if (ultraShort.length > 5) riskScore += 20;

  // Consistency score (inverse of risk for relevant metrics)
  const tradingDays = account.trading_days || 0;
  let consistencyScore = 100;
  if (closedTrades.length > 0) {
    const avgLots = closedTrades.reduce((s, t) => s + (t.lots || 0), 0) / closedTrades.length;
    const lotVariance = closedTrades.reduce((s, t) => s + Math.abs((t.lots || 0) - avgLots), 0) / closedTrades.length;
    if (lotVariance / avgLots > 2) consistencyScore -= 30;
    if (lotVariance / avgLots > 3) consistencyScore -= 20;
  }
  if (tradingDays < 5) consistencyScore -= 20;

  return {
    risk_score: Math.min(100, Math.max(0, riskScore)),
    consistency_score: Math.max(0, consistencyScore),
    red_flags_count: flags.length,
    total_trades: closedTrades.length,
    win_rate: account.win_rate || 0,
    max_dd_used: ddUsed,
    trading_days: tradingDays,
    gross_pnl: totalPnl,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, account_id } = body;

    const sr = base44.asServiceRole;

    // ── MARK PHASE 1 PASSED ────────────────────────────────────────────────────
    if (action === 'mark_phase1_passed') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });

      await sr.entities.ChallengeAccount.update(account.id, {
        status: 'passed',
        phase: 'phase2',
        phase_passed_at: new Date().toISOString(),
        profit_target_progress: 0,
      });

      // Provision Phase 2 MT5 account immediately
      const MT_BASE = Deno.env.get('MATCH_TRADER_BASE_URL') || 'https://broker-api-demo.match-trader.com';
      const MT_API_KEY = Deno.env.get('MATCH_TRADER_API_KEY');
      const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
      const MT5_API_KEY = Deno.env.get('MT5_API_KEY');

      const platform = account.platform || 'xtrading';
      const isMT5 = platform === 'mt5';
      const isMatchTrader = platform === 'match_trader';
      const apiBase = isMT5 ? MT5_BASE : MT_BASE;
      const apiKey = isMT5 ? MT5_API_KEY : MT_API_KEY;

      let phase2Credentials = null;

      if ((isMatchTrader || isMT5) && apiKey) {
        try {
          const password = genPassword();
          const sizeK = account.account_size / 1000;
          const model = account.account_type === 'swing' ? 'SWING' : 'STD';
          const groupName = `FF_2STEP_${sizeK}K_${model}_P2`;

          const createRes = await fetch(`${apiBase}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
            body: JSON.stringify({
              login: account.user_email,
              password,
              email: account.user_email,
              group: groupName,
              leverage: parseInt((account.leverage || '1:100').split(':')[1]) || 100,
              balance: account.account_size,
              currency: 'USD',
              sendEmail: false,
            }),
          });

          if (createRes.ok) {
            const mtAccount = await createRes.json();
            const mtLogin = mtAccount?.login || mtAccount?.accountId || mtAccount?.id;
            if (mtLogin) {
              const server = isMT5 ? (Deno.env.get('MT5_SERVER_NAME') || 'mt5.server.com') : MT_BASE;
              phase2Credentials = { mt_login: String(mtLogin), mt_password: password, mt_server: server, mt_group: groupName };

              await sr.entities.ChallengeAccount.update(account.id, {
                status: 'active',
                mt_login: String(mtLogin),
                mt_password: password,
                mt_server: server,
                mt_group: groupName,
                login_credentials: `Login: ${mtLogin} | Password: ${password} | Server: ${server}`,
                server,
                provisioned_at: new Date().toISOString(),
                balance: 0,
                pnl: 0,
                daily_pnl: 0,
                daily_drawdown_used: 0,
                max_drawdown_used: 0,
                high_water_mark: account.account_size,
              });
            }
          }
        } catch (e) {
          console.error('Phase 2 MT provisioning failed:', e.message);
        }
      } else {
        // Non-MT platform — just activate phase 2 with same credentials
        await sr.entities.ChallengeAccount.update(account.id, { status: 'active' });
      }

      // Notification
      await sr.entities.Notification.create({
        title: '🎉 Phase 1 Passed! Phase 2 Activated',
        message: `Congratulations! Your Phase 1 challenge is complete. Your Phase 2 account is now active. Complete Phase 2 to proceed to funded evaluation.`,
        type: 'payout',
        priority: 'high',
        display_mode: 'popup',
        is_active: true,
        target: 'challenge',
      });

      await sendEmail(sr, account.user_email, 'phase1_passed', {
        name: account.user_email,
        account_size: account.account_size,
        phase2_credentials: phase2Credentials,
      });

      return Response.json({ success: true, phase: 'phase2', credentials: phase2Credentials });
    }

    // ── MARK PHASE 2 PASSED → PENDING MANUAL REVIEW ────────────────────────────
    if (action === 'mark_phase2_passed') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });

      // Compute risk score for review
      const riskData = await computeRiskScore(sr, account);

      await sr.entities.ChallengeAccount.update(account.id, {
        status: 'passed',
        phase: 'funded',
        phase_passed_at: new Date().toISOString(),
      });

      // Create funded review record
      const existingReviews = await sr.entities.FundedAccountReview.filter({ account_id });
      if (existingReviews.length === 0) {
        await sr.entities.FundedAccountReview.create({
          account_id: account.account_id,
          user_email: account.user_email,
          trader_name: account.user_email,
          phase_passed: 'phase2',
          status: 'pending_review',
          account_size: account.account_size,
          challenge_type: account.challenge_type,
          ...riskData,
        });
      }

      // Notify user
      await sr.entities.Notification.create({
        title: '⏳ Phase 2 Complete — Under Risk Review',
        message: `Excellent work! Your Phase 2 challenge is complete. Your account is now under review by our risk management team. Please allow 48–96 hours.`,
        type: 'system',
        priority: 'high',
        display_mode: 'popup',
        is_active: true,
        target: 'challenge',
      });

      await sendEmail(sr, account.user_email, 'phase2_passed', {
        name: account.user_email,
        account_size: account.account_size,
        review_message: 'Your account is under review. Please allow 48–96 hours.',
      });

      return Response.json({ success: true, status: 'pending_manual_review', risk_score: riskData.risk_score });
    }

    // ── APPROVE FUNDED ACCOUNT ─────────────────────────────────────────────────
    if (action === 'approve_funded') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      const { review_id } = body;
      const reviews = await sr.entities.FundedAccountReview.filter({ id: review_id });
      const review = reviews[0];
      if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id: review.account_id });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });

      // Provision funded live MT5 account
      const MT_BASE = Deno.env.get('MATCH_TRADER_BASE_URL') || 'https://broker-api-demo.match-trader.com';
      const MT_API_KEY = Deno.env.get('MATCH_TRADER_API_KEY');
      const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
      const MT5_API_KEY = Deno.env.get('MT5_API_KEY');

      const platform = account.platform || 'xtrading';
      const isMT5 = platform === 'mt5';
      const apiBase = isMT5 ? MT5_BASE : MT_BASE;
      const apiKey = isMT5 ? MT5_API_KEY : MT_API_KEY;

      let fundedCredentials = null;

      if (apiKey) {
        try {
          const password = genPassword();
          const sizeK = account.account_size / 1000;
          const model = account.account_type === 'swing' ? 'SWING' : 'STD';
          const groupName = `FF_FUNDED_${sizeK}K_${model}_LIVE`;

          const createRes = await fetch(`${apiBase}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
            body: JSON.stringify({
              login: account.user_email,
              password,
              email: account.user_email,
              group: groupName,
              leverage: 100,
              balance: account.account_size,
              currency: 'USD',
              sendEmail: false,
            }),
          });

          if (createRes.ok) {
            const mtAccount = await createRes.json();
            const mtLogin = mtAccount?.login || mtAccount?.accountId || mtAccount?.id;
            if (mtLogin) {
              const server = isMT5 ? (Deno.env.get('MT5_SERVER_NAME') || 'mt5.server.com') : MT_BASE;
              fundedCredentials = { mt_login: String(mtLogin), mt_password: password, mt_server: server };
            }
          }
        } catch (e) {
          console.error('Funded provisioning failed:', e.message);
        }
      }

      const fundedId = `FUNDED-${Date.now()}`;

      // Update account to funded
      await sr.entities.ChallengeAccount.update(account.id, {
        status: 'funded',
        account_id: fundedId,
        ...(fundedCredentials || {}),
        login_credentials: fundedCredentials
          ? `Login: ${fundedCredentials.mt_login} | Password: ${fundedCredentials.mt_password} | Server: ${fundedCredentials.mt_server}`
          : account.login_credentials,
        provisioned_at: new Date().toISOString(),
        balance: account.account_size,
        equity: account.account_size,
        high_water_mark: account.account_size,
        pnl: 0,
        daily_pnl: 0,
      });

      // Update review record
      await sr.entities.FundedAccountReview.update(review.id, {
        status: 'approved',
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
        funded_account_id: fundedId,
        ...(fundedCredentials ? {
          funded_mt5_login: fundedCredentials.mt_login,
          funded_mt5_password: fundedCredentials.mt_password,
          funded_mt5_server: fundedCredentials.mt_server,
          funded_provisioned_at: new Date().toISOString(),
        } : {}),
      });

      // Notification
      await sr.entities.Notification.create({
        title: '🏆 Funded Account Approved!',
        message: `Congratulations! You have been approved as a Funded Trader. Your live funded account credentials are now available in your dashboard.`,
        type: 'payout',
        priority: 'critical',
        display_mode: 'popup',
        is_active: true,
        target: 'funded',
      });

      await sendEmail(sr, account.user_email, 'funded_approved', {
        name: account.user_email,
        account_size: account.account_size,
        credentials: fundedCredentials,
      });

      return Response.json({ success: true, funded_account_id: fundedId, credentials: fundedCredentials });
    }

    // ── REJECT FUNDED ──────────────────────────────────────────────────────────
    if (action === 'reject_funded') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
      const { review_id, reason } = body;
      const reviews = await sr.entities.FundedAccountReview.filter({ id: review_id });
      const review = reviews[0];
      if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });

      await sr.entities.FundedAccountReview.update(review.id, {
        status: 'rejected',
        rejection_reason: reason,
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
      });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id: review.account_id });
      if (accounts[0]) {
        await sr.entities.ChallengeAccount.update(accounts[0].id, { status: 'failed' });
      }

      await sendEmail(sr, review.user_email, 'funded_rejected', {
        name: review.user_email,
        reason: reason || 'Risk management review decision',
      });

      return Response.json({ success: true });
    }

    // ── SUSPEND ACCOUNT ────────────────────────────────────────────────────────
    if (action === 'suspend_account') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
      const { review_id, reason } = body;
      const reviews = await sr.entities.FundedAccountReview.filter({ id: review_id });
      const review = reviews[0];
      if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });

      await sr.entities.FundedAccountReview.update(review.id, {
        status: 'suspended',
        admin_notes: reason,
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
      });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id: review.account_id });
      if (accounts[0]) {
        await sr.entities.ChallengeAccount.update(accounts[0].id, { status: 'failed' });
      }

      return Response.json({ success: true });
    }

    // ── COMPUTE RISK SCORE (standalone) ───────────────────────────────────────
    if (action === 'compute_risk_score') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
      const accounts = await sr.entities.ChallengeAccount.filter({ account_id });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });
      const riskData = await computeRiskScore(sr, account);
      return Response.json({ success: true, ...riskData });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('phaseProgressionEngine error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});