/**
 * riskCenterScan — Read-only risk analysis for the Risk Management Center.
 *
 * HARD RULE: This function NEVER auto-breaches, fails, suspends, or flags
 * accounts for review. It only computes risk metrics, stores them on the
 * ChallengeAccount (risk_score, risk_level, risk_flags, last_risk_scan),
 * and returns the full evidence for admin review.
 *
 * Scans ONLY accounts where risk_monitoring_enabled = true.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Thresholds ────────────────────────────────────────────────────────────
const HFT_MAX_TPS = 3;          // 3+ trades in same second
const HFT_SUBSECOND_LIMIT = 15; // 15+ sub-second trades
const HFT_AVG_HOLD_SEC = 10;    // avg hold < 10s with 10+ trades
const SCALPER_HOLD_SEC = 60;    // held < 60s
const SCALPER_PCT_THRESHOLD = 50;
const MARTINGALE_MULT = 1.8;    // lot increase >= 1.8x after loss
const REVENGE_GAP_SEC = 120;    // new trade < 120s after a loss
const OVERTRADING_DAILY = 30;   // 30+ trades/day
const SWAP_HOUR_UTC = 21;       // swap time ~21:00 UTC
const SWAP_WINDOW_MIN = 30;     // closed within 30 min before swap
const NEWS_WINDOW_SEC = 120;    // ±2 min around high-impact event

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function holdSec(t) {
  const o = parseDate(t.open_time);
  const c = parseDate(t.close_time);
  if (!o || !c) return 0;
  return (c.getTime() - o.getTime()) / 1000;
}

function dayKey(s) {
  const d = parseDate(s);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function hourKey(s) {
  const d = parseDate(s);
  if (!d) return null;
  return d.getUTCHours();
}

// Currency from symbol: EURUSD -> [EUR, USD], XAUUSD -> [XAU, USD]
function symbolCurrencies(sym) {
  if (!sym) return [];
  if (sym.length === 6) return [sym.slice(0, 3), sym.slice(3, 6)];
  if (sym.startsWith('XAU')) return ['XAU', 'USD'];
  if (sym.startsWith('XAG')) return ['XAG', 'USD'];
  return [sym.slice(0, 3)];
}

function computeAccountRisk(acc, trades, deviceLogs, econEvents) {
  const closed = (trades || []).filter(t => t.status === 'closed' && t.close_time);
  const open = (trades || []).filter(t => t.status === 'open');
  const flags = [];
  let score = 0;
  const evidence = {};

  // ── HFT ────────────────────────────────────────────────────────────────
  const sorted = [...closed].sort((a, b) => parseDate(a.open_time) - parseDate(b.open_time));
  const tpsMap = {};
  sorted.forEach(t => {
    const o = parseDate(t.open_time);
    if (!o) return;
    const k = o.toISOString().slice(0, 19);
    tpsMap[k] = (tpsMap[k] || 0) + 1;
  });
  const maxTps = Math.max(0, ...Object.values(tpsMap));
  const subSecond = sorted.filter(t => holdSec(t) > 0 && holdSec(t) < 1);
  const holds = sorted.map(t => holdSec(t)).filter(s => s > 0);
  const avgHold = holds.length ? holds.reduce((a, b) => a + b, 0) / holds.length : 0;

  let hftDetected = false;
  if (maxTps >= HFT_MAX_TPS) { flags.push('high_frequency_trading'); score += 25; hftDetected = true; }
  if (subSecond.length >= HFT_SUBSECOND_LIMIT) { if (!flags.includes('ultra_fast_scalping')) flags.push('ultra_fast_scalping'); score += 20; hftDetected = true; }
  if (avgHold > 0 && avgHold < HFT_AVG_HOLD_SEC && sorted.length >= 10) { if (!flags.includes('high_frequency_trading')) flags.push('high_frequency_trading'); score += 15; hftDetected = true; }

  evidence.hft = {
    max_tps: maxTps,
    avg_hold_sec: Math.round(avgHold),
    sub_second_count: subSecond.length,
    total_trades: sorted.length,
    rapid_trades: sorted
      .filter(t => holdSec(t) < 5)
      .slice(0, 20)
      .map(t => ({
        trade_id: t.trade_id, symbol: t.symbol, type: t.type,
        open_time: t.open_time, close_time: t.close_time,
        hold_sec: Math.round(holdSec(t)), lots: t.lots, pnl: t.pnl,
      })),
  };

  // ── Martingale ─────────────────────────────────────────────────────────
  const martingaleSeqs = [];
  let currentSeq = [];
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    if (t.pnl < 0) {
      currentSeq.push(t);
    } else {
      if (currentSeq.length >= 2 && currentSeq.some((t, idx) => idx > 0 && t.lots >= currentSeq[idx - 1].lots * MARTINGALE_MULT)) {
        martingaleSeqs.push(currentSeq);
      }
      currentSeq = [];
    }
  }
  if (currentSeq.length >= 2 && currentSeq.some((t, idx) => idx > 0 && t.lots >= currentSeq[idx - 1].lots * MARTINGALE_MULT)) {
    martingaleSeqs.push(currentSeq);
  }

  let martingaleDetected = martingaleSeqs.length > 0;
  if (martingaleDetected) { flags.push('martingale_grid'); score += 25; }
  const maxSeqLen = martingaleSeqs.reduce((m, s) => Math.max(m, s.length), 0);
  const recovered = martingaleSeqs.filter(s => {
    const idx = sorted.indexOf(s[s.length - 1]);
    return idx >= 0 && idx + 1 < sorted.length && sorted[idx + 1].pnl > 0;
  }).length;
  evidence.martingale = {
    sequences: martingaleSeqs.length,
    max_trades_in_seq: maxSeqLen,
    multiplier: MARTINGALE_MULT,
    recovered,
    unrecovered: martingaleSeqs.length - recovered,
    evidence: martingaleSeqs.slice(0, 5).map(seq => seq.map(t => ({
      trade_id: t.trade_id, symbol: t.symbol, lots: t.lots, pnl: t.pnl, open_time: t.open_time,
    }))),
  };

  // ── Scalper ─────────────────────────────────────────────────────────────
  const scalperTrades = sorted.filter(t => {
    const h = holdSec(t);
    return h > 0 && h < SCALPER_HOLD_SEC;
  });
  const scalperPct = sorted.length ? (scalperTrades.length / sorted.length) * 100 : 0;
  if (scalperPct >= SCALPER_PCT_THRESHOLD) { flags.push('scalping_pattern'); score += 15; }
  evidence.scalper = {
    count: scalperTrades.length,
    percentage: Math.round(scalperPct),
    evidence: scalperTrades.slice(0, 20).map(t => ({
      trade_id: t.trade_id, symbol: t.symbol, hold_sec: Math.round(holdSec(t)), pnl: t.pnl,
    })),
  };

  // ── Behavioral: revenge + overtrading ──────────────────────────────────
  let revengeCount = 0;
  const revengeEvidence = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.pnl < 0 && curr.pnl !== undefined) {
      const gap = (parseDate(curr.open_time) - parseDate(prev.close_time)) / 1000;
      if (gap >= 0 && gap < REVENGE_GAP_SEC && curr.lots > prev.lots) {
        revengeCount++;
        revengeEvidence.push({ after_loss: prev, revenge_trade: curr, gap_sec: Math.round(gap) });
      }
    }
  }
  if (revengeCount >= 3) { flags.push('revenge_trading'); score += 20; }

  // Overtrading: days with > OVERTRADING_DAILY trades
  const dayCounts = {};
  sorted.forEach(t => { const dk = dayKey(t.open_time); if (dk) dayCounts[dk] = (dayCounts[dk] || 0) + 1; });
  const overtradingDays = Object.values(dayCounts).filter(c => c >= OVERTRADING_DAILY).length;
  if (overtradingDays >= 1) { flags.push('overtrading'); score += 15; }

  // Emotional cost: PnL of revenge trades
  const emotionalCost = revengeEvidence.reduce((sum, r) => sum + (r.revenge_trade.pnl || 0), 0);

  evidence.behavioral = {
    revenge_count: revengeCount,
    overtrading_days: overtradingDays,
    emotional_cost: Math.round(emotionalCost),
    peak_risk_hours: Object.entries(
      sorted.reduce((m, t) => { const h = hourKey(t.open_time); if (h !== null) m[h] = (m[h] || 0) + 1; return m; }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([h, c]) => ({ hour: h, count: c })),
    evidence: revengeEvidence.slice(0, 10).map(r => ({
      loss_trade: { trade_id: r.after_loss.trade_id, pnl: r.after_loss.pnl, close_time: r.after_loss.close_time },
      revenge_trade: { trade_id: r.revenge_trade.trade_id, lots: r.revenge_trade.lots, pnl: r.revenge_trade.pnl, open_time: r.revenge_trade.open_time },
      gap_sec: r.gap_sec,
    })),
  };

  // ── Swap avoidance ──────────────────────────────────────────────────────
  const noSwapTrades = sorted.filter(t => {
    const c = parseDate(t.close_time);
    if (!c) return false;
    const h = c.getUTCHours();
    const m = c.getUTCMinutes();
    // closed within SWAP_WINDOW_MIN before SWAP_HOUR_UTC
    if (h === SWAP_HOUR_UTC - 1 && m >= 60 - SWAP_WINDOW_MIN) return true;
    if (h === SWAP_HOUR_UTC && m === 0) return true;
    return false;
  }).filter(t => holdSec(t) > 300); // held more than 5 min (not just a quick scalp)

  // Actually: swap avoidance = closing positions JUST BEFORE swap time (held overnight otherwise)
  const swapAvoiders = sorted.filter(t => {
    const c = parseDate(t.close_time);
    if (!c) return false;
    const o = parseDate(t.open_time);
    if (!o) return false;
    const heldHours = (c.getTime() - o.getTime()) / 3600000;
    // Held several hours but closed before swap time = avoiding swap
    if (heldHours >= 1 && heldHours < 24) {
      const closeH = c.getUTCHours();
      const closeM = c.getUTCMinutes();
      const closeMin = closeH * 60 + closeM;
      const swapMin = SWAP_HOUR_UTC * 60;
      return closeMin >= swapMin - SWAP_WINDOW_MIN && closeMin < swapMin;
    }
    return false;
  });
  const swapAvoidRate = sorted.length ? (swapAvoiders.length / sorted.length) * 100 : 0;
  if (swapAvoidRate >= 30) { flags.push('swap_avoidance'); score += 10; }
  evidence.swap = {
    no_swap_count: swapAvoiders.length,
    avoidance_rate: Math.round(swapAvoidRate),
    avg_duration_hours: swapAvoiders.length
      ? Math.round(swapAvoiders.reduce((s, t) => s + holdSec(t) / 3600, 0) / swapAvoiders.length * 10) / 10
      : 0,
    evidence: swapAvoiders.slice(0, 15).map(t => ({
      trade_id: t.trade_id, symbol: t.symbol, open_time: t.open_time, close_time: t.close_time,
      hold_hours: Math.round(holdSec(t) / 3600 * 10) / 10, pnl: t.pnl,
    })),
  };

  // ── News trading violations ────────────────────────────────────────────
  const newsViolations = [];
  for (const t of sorted) {
    const o = parseDate(t.open_time);
    const c = parseDate(t.close_time);
    if (!o) continue;
    const tradeCurrencies = symbolCurrencies(t.symbol);
    for (const ev of econEvents || []) {
      const et = parseDate(ev.event_time);
      if (!et) continue;
      if (!tradeCurrencies.includes(ev.currency)) continue;
      const diffOpen = Math.abs(o.getTime() - et.getTime()) / 1000;
      const diffClose = c ? Math.abs(c.getTime() - et.getTime()) / 1000 : Infinity;
      if (diffOpen <= NEWS_WINDOW_SEC || diffClose <= NEWS_WINDOW_SEC) {
        newsViolations.push({
          trade_id: t.trade_id, symbol: t.symbol, type: t.type, pnl: t.pnl,
          open_time: t.open_time, close_time: t.close_time,
          event_title: ev.title, event_currency: ev.currency, event_time: ev.event_time,
          diff_sec: Math.round(Math.min(diffOpen, diffClose)),
        });
        break;
      }
    }
  }
  if (newsViolations.length >= 2) { flags.push('news_trading_violation'); score += 15; }
  evidence.news = { violations: newsViolations.length, evidence: newsViolations.slice(0, 20) };

  // ── Concentration ──────────────────────────────────────────────────────
  const symbolVolume = {};
  sorted.forEach(t => { symbolVolume[t.symbol] = (symbolVolume[t.symbol] || 0) + (t.lots || 0); });
  const totalVol = Object.values(symbolVolume).reduce((a, b) => a + b, 0);
  const topSymbols = Object.entries(symbolVolume)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sym, vol]) => ({ symbol: sym, volume: vol, pct: totalVol ? Math.round(vol / totalVol * 100) : 0 }));
  const topPct = topSymbols.length ? topSymbols[0].pct : 0;
  if (topPct >= 70 && sorted.length >= 10) { flags.push('concentration_risk'); score += 10; }
  evidence.concentration = { top_symbols: topSymbols, concentration_pct: topPct };

  // ── Margin / Leverage ──────────────────────────────────────────────────
  const maxLots = Math.max(0, ...sorted.map(t => t.lots || 0), ...open.map(t => t.lots || 0));
  const lotRatio = acc.account_size ? (maxLots * 100000) / acc.account_size : 0;
  if (lotRatio >= 0.5) { flags.push('excessive_leverage'); score += 15; }
  evidence.margin = { max_lots: maxLots, lot_to_size_ratio: Math.round(lotRatio * 100) / 100 };

  // ── IP / Device risk ────────────────────────────────────────────────────
  const accDevices = (deviceLogs || []).filter(d => d.user_email === acc.user_email);
  const vpnFlags = accDevices.filter(d => d.is_vpn || d.is_proxy || d.is_datacenter);
  if (vpnFlags.length > 0) { flags.push('vpn_proxy_access'); score += 15; }
  evidence.ip = {
    device_count: accDevices.length,
    vpn_proxy_count: vpnFlags.length,
    devices: accDevices.slice(0, 10).map(d => ({
      ip: d.ip_address, browser: d.browser, os: d.os, country: d.country_from_ip,
      is_vpn: d.is_vpn, is_proxy: d.is_proxy, is_datacenter: d.is_datacenter,
      last_login: d.last_login,
    })),
  };

  // ── EA/Bot detection (deterministic patterns) ───────────────────────────
  // Highly regular trade intervals or identical lot sizes
  let botScore = 0;
  if (sorted.length >= 20) {
    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      const gap = (parseDate(sorted[i].open_time) - parseDate(sorted[i - 1].open_time)) / 1000;
      if (gap > 0 && gap < 3600) intervals.push(gap);
    }
    if (intervals.length >= 10) {
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
      if (cv < 0.15) botScore += 40; // very regular intervals
    }
    const lotSet = new Set(sorted.map(t => t.lots));
    if (lotSet.size <= 3 && sorted.length >= 30) botScore += 30; // very few distinct lot sizes
  }
  if (botScore >= 40) { flags.push('ea_bot_detected'); score += 20; }
  evidence.bot = { bot_score: botScore, evidence: 'Interval regularity + lot size uniformity analysis' };

  // ── Consistency score (0-100, higher = more consistent) ─────────────────
  const pnls = sorted.map(t => t.pnl || 0);
  let consistencyScore = 0;
  if (pnls.length >= 5) {
    const wins = pnls.filter(p => p > 0).length;
    const winRate = wins / pnls.length;
    consistencyScore = Math.round(winRate * 60 + Math.min(40, pnls.length));
  }

  // ── Risk level ──────────────────────────────────────────────────────────
  score = Math.min(100, score);
  let level = 'low';
  if (score >= 81) level = 'critical';
  else if (score >= 61) level = 'high';
  else if (score >= 31) level = 'medium';

  // Dedup flags
  const uniqueFlags = [...new Set(flags)];

  return {
    account_id: acc.account_id,
    user_email: acc.user_email,
    mt_login: acc.mt_login,
    challenge_type: acc.challenge_type,
    account_size: acc.account_size,
    status: acc.status,
    balance: acc.balance,
    equity: acc.equity,
    risk_score: score,
    risk_level: level,
    risk_flags: uniqueFlags,
    hft_detected: hftDetected,
    ea_bot_detected: botScore >= 40,
    arbitrage_detected: false,
    account_passing_suspected: false,
    consistency_score: consistencyScore,
    behavioral_fingerprint: {
      revenge_count: revengeCount,
      overtrading_days: overtradingDays,
      emotional_cost: emotionalCost,
      bot_score: botScore,
      ...((acc.behavioral_fingerprint || {})),
    },
    last_risk_scan: new Date().toISOString(),
    total_trades: sorted.length,
    open_positions: open.length,
    open_positions_list: open.slice(0, 20).map(t => ({
      trade_id: t.trade_id, symbol: t.symbol, type: t.type, lots: t.lots,
      entry: t.entry, pnl: t.pnl, open_time: t.open_time,
    })),
    evidence,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const scanOnly = body.scan_only === true; // skip DB writes, just compute

    // Fetch monitored accounts only
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter(
      { risk_monitoring_enabled: true }, '-created_date', 500
    );

    const deviceLogs = await base44.asServiceRole.entities.DeviceLog.list('-created_date', 500);
    const econEvents = await base44.asServiceRole.entities.EconomicEvent.filter(
      { impact: 'High' }, '-event_time', 200
    );

    const analysis = [];
    for (const acc of (accounts || [])) {
      // Fetch trades for this account
      let trades = [];
      try {
        trades = await base44.asServiceRole.entities.TradeRecord.filter(
          { account_id: acc.account_id }, '-open_time', 1000
        );
      } catch (_) { /* no trades */ }

      const result = computeAccountRisk(acc, trades, deviceLogs, econEvents);
      analysis.push(result);

      // Persist risk metrics (NO status/breach change)
      if (!scanOnly) {
        try {
          await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, {
            risk_score: result.risk_score,
            risk_level: result.risk_level,
            risk_flags: result.risk_flags,
            hft_detected: result.hft_detected,
            ea_bot_detected: result.ea_bot_detected,
            arbitrage_detected: result.arbitrage_detected,
            account_passing_suspected: result.account_passing_suspected,
            consistency_score: result.consistency_score,
            behavioral_fingerprint: result.behavioral_fingerprint,
            last_risk_scan: result.last_risk_scan,
          });
        } catch (_) { /* skip write errors */ }
      }
    }

    // ── Aggregate metrics for overview ─────────────────────────────────────
    const totalNetPnL = analysis.reduce((s, a) => s + (a.balance - a.account_size), 0);
    const totalOpenPositions = analysis.reduce((s, a) => s + a.open_positions, 0);
    const profitableAccounts = analysis.filter(a => (a.balance || 0) > a.account_size).length;

    return Response.json({
      success: true,
      scannedAt: new Date().toISOString(),
      summary: {
        total_monitored: analysis.length,
        total_net_pnl: Math.round(totalNetPnL),
        total_open_positions: totalOpenPositions,
        profitable_accounts: profitableAccounts,
        risk_distribution: {
          critical: analysis.filter(a => a.risk_level === 'critical').length,
          high: analysis.filter(a => a.risk_level === 'high').length,
          medium: analysis.filter(a => a.risk_level === 'medium').length,
          low: analysis.filter(a => a.risk_level === 'low').length,
        },
      },
      accounts: analysis,
      device_logs: deviceLogs,
      econ_events: econEvents,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});