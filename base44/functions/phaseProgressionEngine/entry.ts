/**
 * phaseProgressionEngine — Institutional phase transition handler
 * Handles: Phase1→Phase2 provisioning, Phase2→ManualReview queue, Funded approval
 *
 * MT5 credentials sourced exclusively from getPlatformCredentials('mt5')
 * → reads TradingPlatformProvider entity (Admin > Platforms API)
 * → falls back to env vars only if no DB record exists
 *
 * On DD breach: disables account at broker level via PUT /accounts/{login}/disable
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

/**
 * Load MT5 credentials from getPlatformCredentials — single source of truth.
 * Returns { apiKey, apiBase, serverName } or null if not configured.
 */
async function loadMT5Creds(sr) {
  const credRes = await sr.functions.invoke('getPlatformCredentials', { platform: 'mt5' });
  if (!credRes.data?.success) {
    console.error('[phaseProgressionEngine] MT5 credentials not configured:', credRes.data?.error);
    return null;
  }
  return {
    apiKey: credRes.data.api_key,
    apiBase: credRes.data.server_url,
    serverName: credRes.data.server_name || 'mt5-live.server.com',
  };
}

/**
 * Standard MT5 API headers — consistent with provisionMatchTraderAccount and scheduledMTSync.
 */
function mt5Headers(apiKey) {
  return {
    'Content-Type': 'application/json',
    'api-key': apiKey,
    'Authorization': `Bearer ${apiKey}`,
  };
}

/**
 * Provision a new MT5 account via broker REST API.
 * Returns { mt_login, mt_password, mt_server, mt_group } or null on failure.
 */
async function provisionMT5Account(apiBase, apiKey, serverName, userEmail, groupName, leverage, balance) {
  const password = genPassword();
  try {
    const createRes = await fetch(`${apiBase}/accounts`, {
      method: 'POST',
      headers: mt5Headers(apiKey),
      body: JSON.stringify({
        login: userEmail,
        password,
        email: userEmail,
        group: groupName,
        leverage,
        balance,
        name: userEmail.split('@')[0],
        currency: 'USD',
        sendEmail: false,
      }),
    });

    const responseText = await createRes.text();
    console.log(`[MT5] POST /accounts response (${createRes.status}):`, responseText);

    if (!createRes.ok) {
      console.error('[MT5] Account creation failed:', responseText);
      return null;
    }

    const mtAccount = JSON.parse(responseText);
    const mtLogin = mtAccount?.login || mtAccount?.accountId || mtAccount?.id;
    if (!mtLogin) {
      console.error('[MT5] No login returned from API:', mtAccount);
      return null;
    }

    return {
      mt_login: String(mtLogin),
      mt_password: password,
      mt_server: serverName,
      mt_group: groupName,
    };
  } catch (e) {
    console.error('[MT5] provisionMT5Account error:', e.message);
    return null;
  }
}

/**
 * Disable an MT5 account at the broker level after DD breach.
 * Tries PUT /accounts/{login}/disable first, falls back to PUT /accounts/{login} with enabled:false.
 * Non-blocking — failure is logged but does not stop DB updates.
 */
async function disableMT5AccountAtBroker(apiBase, apiKey, mtLogin, reason) {
  if (!apiBase || !apiKey || !mtLogin) {
    console.warn('[MT5-DISABLE] Missing credentials or login — skipping broker disable');
    return;
  }
  try {
    // Attempt 1: dedicated disable endpoint
    const res1 = await fetch(`${apiBase}/accounts/${mtLogin}/disable`, {
      method: 'PUT',
      headers: mt5Headers(apiKey),
      body: JSON.stringify({ reason }),
    });
    if (res1.ok) {
      console.log(`[MT5-DISABLE] ✅ Account ${mtLogin} disabled at broker via PUT /accounts/${mtLogin}/disable`);
      return;
    }
    console.warn(`[MT5-DISABLE] disable endpoint returned ${res1.status} — trying fallback`);

    // Attempt 2: update account with enabled:false
    const res2 = await fetch(`${apiBase}/accounts/${mtLogin}`, {
      method: 'PUT',
      headers: mt5Headers(apiKey),
      body: JSON.stringify({ enabled: false, readonly: true, reason }),
    });
    if (res2.ok) {
      console.log(`[MT5-DISABLE] ✅ Account ${mtLogin} disabled at broker via PUT /accounts/${mtLogin} enabled:false`);
      return;
    }
    console.error(`[MT5-DISABLE] ❌ Both disable attempts failed for ${mtLogin}. Status: ${res2.status}`);
  } catch (e) {
    console.error(`[MT5-DISABLE] ❌ Exception disabling ${mtLogin}:`, e.message);
  }
}

async function computeRiskScore(sr, account) {
  const trades = await sr.entities.TradeRecord.filter({ account_id: account.account_id });
  const flags = await sr.entities.RiskFlag.filter({ account_id: account.account_id, status: 'active' });

  let riskScore = 0;
  riskScore += flags.filter(f => f.severity === 'critical').length * 30;
  riskScore += flags.filter(f => f.severity === 'high').length * 20;
  riskScore += flags.filter(f => f.severity === 'medium').length * 10;
  riskScore += flags.filter(f => f.severity === 'low').length * 3;

  const ddUsed = account.max_drawdown_used || 0;
  if (ddUsed > 8) riskScore += 25;
  else if (ddUsed > 6) riskScore += 15;
  else if (ddUsed > 4) riskScore += 5;

  const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl);
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  if (closedTrades.length > 0) {
    const maxSinglePnl = Math.max(...closedTrades.map(t => t.pnl || 0));
    if (totalPnl > 0 && maxSinglePnl / totalPnl > 0.5) riskScore += 20;
  }

  const ultraShort = closedTrades.filter(t => {
    if (!t.open_time || !t.close_time) return false;
    return (new Date(t.close_time) - new Date(t.open_time)) < 10000;
  });
  if (ultraShort.length > 5) riskScore += 20;

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

    // ── MARK PHASE 1 PASSED → PROVISION PHASE 2 ───────────────────────────────
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

      const platform = account.platform || 'xtrading';
      const isMT5 = platform === 'mt5';
      let phase2Credentials = null;

      if (isMT5) {
        // ── CREDENTIALS FROM ADMIN > PLATFORMS API (single source of truth) ────
        const creds = await loadMT5Creds(sr);
        if (creds && creds.apiKey && creds.apiBase) {
          const sizeK = account.account_size / 1000;
          const model = account.account_type === 'swing' ? 'SWING' : 'STD';
          const groupName = `FF_2STEP_${sizeK}K_${model}_P2`;
          const leverage = parseInt((account.leverage || '1:100').split(':')[1]) || 100;

          phase2Credentials = await provisionMT5Account(
            creds.apiBase, creds.apiKey, creds.serverName,
            account.user_email, groupName, leverage, account.account_size
          );

          if (phase2Credentials) {
            await sr.entities.ChallengeAccount.update(account.id, {
              status: 'active',
              mt_login: phase2Credentials.mt_login,
              mt_password: phase2Credentials.mt_password,
              mt_server: phase2Credentials.mt_server,
              mt_group: phase2Credentials.mt_group,
              login_credentials: `Login: ${phase2Credentials.mt_login} | Password: ${phase2Credentials.mt_password} | Server: ${phase2Credentials.mt_server}`,
              server: phase2Credentials.mt_server,
              provisioned_at: new Date().toISOString(),
              balance: 0, pnl: 0, daily_pnl: 0,
              daily_drawdown_used: 0, max_drawdown_used: 0,
              high_water_mark: account.account_size,
            });
          } else {
            console.error('[Phase1Passed] MT5 Phase 2 provisioning returned null — account stays passed, admin must retry');
          }
        } else {
          console.error('[Phase1Passed] MT5 credentials not configured in Admin > Platforms API');
        }
      } else {
        // Non-MT5 platform — just activate
        await sr.entities.ChallengeAccount.update(account.id, { status: 'active' });
      }

      await sr.entities.Notification.create({
        title: '🎉 Phase 1 Passed! Phase 2 Activated',
        message: `Congratulations! Your Phase 1 challenge is complete. Your Phase 2 account is now active.`,
        type: 'payout', priority: 'high', display_mode: 'popup', is_active: true, target: 'challenge',
      });

      await sendEmail(sr, account.user_email, 'phase1_passed', {
        name: account.user_email,
        account_size: account.account_size,
        phase2_credentials: phase2Credentials,
      });

      return Response.json({ success: true, phase: 'phase2', credentials: phase2Credentials });
    }

    // ── MARK PHASE 2 PASSED → PENDING MANUAL REVIEW ───────────────────────────
    if (action === 'mark_phase2_passed') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });

      const riskData = await computeRiskScore(sr, account);

      await sr.entities.ChallengeAccount.update(account.id, {
        status: 'passed',
        phase: 'funded',
        phase_passed_at: new Date().toISOString(),
      });

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

      await sr.entities.Notification.create({
        title: '⏳ Phase 2 Complete — Under Risk Review',
        message: `Your Phase 2 challenge is complete. Your account is now under review by our risk management team. Please allow 48–96 hours.`,
        type: 'system', priority: 'high', display_mode: 'popup', is_active: true, target: 'challenge',
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

      const platform = account.platform || 'xtrading';
      const isMT5 = platform === 'mt5';
      let fundedCredentials = null;

      if (isMT5) {
        // ── CREDENTIALS FROM ADMIN > PLATFORMS API (single source of truth) ────
        const creds = await loadMT5Creds(sr);
        if (creds && creds.apiKey && creds.apiBase) {
          const sizeK = account.account_size / 1000;
          const model = account.account_type === 'swing' ? 'SWING' : 'STD';
          const groupName = `FF_FUNDED_${sizeK}K_${model}_LIVE`;

          // Use leverage from rule_snapshot (set at purchase). Fallback to account.leverage then 100.
          const fundedLeverage = parseInt(
            ((account.rule_snapshot?.leverage || account.leverage || '1:100').split(':')[1])
          ) || 100;
          fundedCredentials = await provisionMT5Account(
            creds.apiBase, creds.apiKey, creds.serverName,
            account.user_email, groupName, fundedLeverage, account.account_size
          );
        } else {
          console.error('[ApproveFunded] MT5 credentials not configured in Admin > Platforms API');
        }
      }

      const fundedId = `FUNDED-${Date.now()}`;

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
        pnl: 0, daily_pnl: 0,
      });

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

      await sr.entities.Notification.create({
        title: '🏆 Funded Account Approved!',
        message: `Congratulations! You have been approved as a Funded Trader. Your live funded account credentials are now available in your dashboard.`,
        type: 'payout', priority: 'critical', display_mode: 'popup', is_active: true, target: 'funded',
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
        status: 'rejected', rejection_reason: reason,
        reviewed_by: user.email, reviewed_at: new Date().toISOString(),
      });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id: review.account_id });
      if (accounts[0]) {
        await sr.entities.ChallengeAccount.update(accounts[0].id, { status: 'failed' });
        // Disable at broker if MT5
        if (accounts[0].platform === 'mt5' && accounts[0].mt_login) {
          const creds = await loadMT5Creds(sr);
          if (creds) {
            disableMT5AccountAtBroker(creds.apiBase, creds.apiKey, accounts[0].mt_login, 'Funded application rejected').catch(() => {});
          }
        }
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
        status: 'suspended', admin_notes: reason,
        reviewed_by: user.email, reviewed_at: new Date().toISOString(),
      });

      const accounts = await sr.entities.ChallengeAccount.filter({ account_id: review.account_id });
      if (accounts[0]) {
        await sr.entities.ChallengeAccount.update(accounts[0].id, { status: 'failed' });
        if (accounts[0].platform === 'mt5' && accounts[0].mt_login) {
          const creds = await loadMT5Creds(sr);
          if (creds) {
            disableMT5AccountAtBroker(creds.apiBase, creds.apiKey, accounts[0].mt_login, reason || 'Account suspended').catch(() => {});
          }
        }
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