/**
 * adminRiskScanAll — Admin/staff-only AUDIT function.
 *
 * Runs a read-only risk analysis across ALL challenge accounts and stores
 * risk_score / risk_level / risk_flags / detection booleans back onto each
 * account for ADMIN visibility in the Risk Management Center.
 *
 * STRICTLY AUDIT-ONLY (as of 2026-06-22 policy):
 *   - Computes HFT, EA/bot, arbitrage, behavioral/consistency signals
 *   - Writes ONLY: risk_score, risk_level, risk_flags, last_risk_scan,
 *     hft_detected, arbitrage_detected, ea_bot_detected, ea_bot_score,
 *     ea_bot_evidence, behavioral_fingerprint, consistency_score
 *   - NEVER writes: status, can_trade, dd_breach_*, phase_review_status,
 *     funded_review_status, or any enforcement field
 *   - NEVER creates user-facing Notifications
 *   - Creates RiskFlag records (admin-read-only) for the audit trail — these
 *     do NOT affect user accounts and are NOT shown to users
 *
 * Only a REAL Daily DD or Overall/Max DD breach (owned by mt5RealtimeSync /
 * scheduledMTSync / automatedDDBreach) may automatically fail an account.
 *
 * AUTHORIZATION: classic admin (role=admin) OR staff with admin-level role.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_LEVEL_STAFF_ROLES = new Set(['owner', 'super_admin', 'admin']);

function detectHFT(closedTrades) {
  if (closedTrades.length < 5) return { detected: false };
  const durations = closedTrades
    .filter(t => t.open_time && t.close_time)
    .map(t => (new Date(t.close_time) - new Date(t.open_time)) / 1000);
  if (durations.length === 0) return { detected: false };
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const under60 = durations.filter(d => d < 60).length;
  const pctUnder60 = (under60 / durations.length) * 100;
  const fastest = Math.min(...durations);
  const detected = avg < 120 || pctUnder60 > 25 || fastest < 10;
  return { detected, avg_duration_seconds: Math.round(avg), pct_under_60s: Math.round(pctUnder60), fastest_trade_seconds: Math.round(fastest) };
}

function detectBot(closedTrades) {
  if (closedTrades.length < 10) return { detected: false, confidence: 0, evidence: {} };
  const lots = closedTrades.map(t => t.lots || 0);
  const uniqueLots = [...new Set(lots)];
  const lotScore = uniqueLots.length <= 3 ? 20 : 0;
  const slDist = closedTrades.filter(t => t.sl).map(t => Math.abs(t.entry - t.sl));
  const uniqueSL = [...new Set(slDist.map(d => d.toFixed(2)))];
  const slScore = uniqueSL.length <= 3 && slDist.length > 5 ? 20 : 0;
  const seconds = closedTrades.map(t => new Date(t.open_time).getSeconds());
  const exactMin = seconds.filter(s => s === 0 || s === 15 || s === 30 || s === 45).length;
  const timingScore = seconds.length > 0 && (exactMin / seconds.length) > 0.7 ? 20 : 0;
  const confidence = lotScore + slScore + timingScore;
  return { detected: confidence >= 60, confidence, evidence: { lot_pattern: lotScore > 0, sl_tp_pattern: slScore > 0, timing_pattern: timingScore > 0 } };
}

function detectArbitrage(closedTrades) {
  if (closedTrades.length < 2) return { detected: false };
  const sorted = [...closedTrades].sort((a, b) => new Date(a.open_time) - new Date(b.open_time));
  for (let i = 0; i < sorted.length - 1; i++) {
    const t1 = sorted[i], t2 = sorted[i + 1];
    const diff = Math.abs(new Date(t2.open_time) - new Date(t1.open_time)) / 1000;
    if (diff < 5 && t1.symbol === t2.symbol && t1.type !== t2.type) {
      return { detected: true, evidence: { trade1: t1.trade_id, trade2: t2.trade_id, time_diff_seconds: Math.round(diff), symbol: t1.symbol } };
    }
  }
  return { detected: false };
}

function checkConsistency(closedTrades) {
  if (closedTrades.length < 5) return { suspicious: false, score: 0 };
  const wins = closedTrades.filter(t => t.pnl > 0).length;
  const winRate = wins / closedTrades.length;
  return { suspicious: winRate > 0.85, score: winRate > 0.85 ? Math.round(winRate * 100) : 50, win_rate: Math.round(winRate * 100) };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let authorized = user.role === 'admin';
    if (!authorized) {
      try {
        const r = await base44.asServiceRole.functions.invoke('staffManagement', { action: 'get_my_permissions' });
        const role = r?.data?.role || r?.role;
        if (role && ADMIN_LEVEL_STAFF_ROLES.has(role)) authorized = true;
      } catch {}
    }
    if (!authorized) return Response.json({ error: 'Forbidden: Admin or staff access required' }, { status: 403 });

    const sr = base44.asServiceRole;
    const accounts = await sr.entities.ChallengeAccount.list('-created_date', 500);
    // Bulk-fetch all closed trades once (service role bypasses RLS)
    const allTrades = await sr.entities.TradeRecord.list('-created_date', 5000);
    const byAcct = {};
    for (const t of allTrades) {
      if (!byAcct[t.account_id]) byAcct[t.account_id] = [];
      byAcct[t.account_id].push(t);
    }
    const existingFlags = await sr.entities.RiskFlag.filter({ status: 'active' });
    const flagsByAcct = {};
    for (const f of existingFlags) {
      if (!flagsByAcct[f.account_id]) flagsByAcct[f.account_id] = new Set();
      flagsByAcct[f.account_id].add(f.flag_type);
    }

    const scanTime = new Date().toISOString();
    const results = [];
    let high = 0, medium = 0, low = 0, critical = 0;

    for (const acc of accounts) {
      const trades = (byAcct[acc.account_id] || []).filter(t => t.status === 'closed');
      const flags = [];
      let score = 0;
      const evidence = {};

      const hft = detectHFT(trades);
      if (hft.detected) { flags.push('hft_detected'); score += 25; evidence.hft = hft; }
      const bot = detectBot(trades);
      if (bot.detected) { flags.push('bot_detected'); score += 25; evidence.bot = bot; }
      const arb = detectArbitrage(trades);
      if (arb.detected) { flags.push('arbitrage_detected'); score += 35; evidence.arbitrage = arb; }
      const cons = checkConsistency(trades);
      if (cons.suspicious) { flags.push('inconsistent_behavior'); score += 15; evidence.consistency = cons; }

      score = Math.min(100, score);
      let level = 'low';
      if (score >= 81) level = 'critical';
      else if (score >= 61) level = 'high';
      else if (score >= 31) level = 'medium';
      if (level === 'critical') critical++;
      else if (level === 'high') high++;
      else if (level === 'medium') medium++;
      else low++;

      // AUDIT-ONLY write — never touches status/can_trade/breach fields
      await sr.entities.ChallengeAccount.update(acc.id, {
        risk_score: score,
        risk_level: level,
        risk_flags: flags,
        last_risk_scan: scanTime,
        hft_detected: flags.includes('hft_detected'),
        arbitrage_detected: flags.includes('arbitrage_detected'),
        ea_bot_detected: flags.includes('bot_detected'),
        ea_bot_score: bot.confidence || 0,
        ea_bot_evidence: bot.evidence || null,
        behavioral_fingerprint: evidence,
        consistency_score: cons.score || 0,
      }).catch(() => {});

      // Create RiskFlag records for admin audit trail (admin-read-only entity)
      const existing = flagsByAcct[acc.account_id] || new Set();
      for (const ft of flags) {
        if (!existing.has(ft)) {
          await sr.entities.RiskFlag.create({
            user_email: acc.user_email,
            account_id: acc.account_id,
            flag_type: ft,
            severity: level,
            description: `Risk scan detected: ${ft.replace(/_/g, ' ')}`,
            status: 'active',
            triggered_at: scanTime,
          }).catch(() => {});
        }
      }

      results.push({
        account_id: acc.account_id,
        mt_login: acc.mt_login,
        user_email: acc.user_email,
        status: acc.status,
        risk_score: score,
        risk_level: level,
        risk_flags: flags,
        total_trades: trades.length,
      });
    }

    return Response.json({
      success: true,
      scanned: accounts.length,
      summary: { total: accounts.length, critical, high, medium, low },
      results,
      note: 'Audit-only. No account status, can_trade, or enforcement fields were modified.',
    });
  } catch (error) {
    console.error('adminRiskScanAll error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});