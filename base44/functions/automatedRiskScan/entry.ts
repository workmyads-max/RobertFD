import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if risk detection is enabled
    const settings = await base44.asServiceRole.entities.PlatformSettings.filter({ setting_key: 'risk_detection_enabled' });
    if (settings.length > 0 && settings[0].is_enabled === false) {
      return Response.json({ error: 'Risk Detection is disabled. Enable it from Admin > Risk Detection before running scans.' }, { status: 403 });
    }

    const { account_id } = await req.json();
    
    if (!account_id) {
      // Scan all accounts
      const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({
        status: ['active', 'passed', 'funded']
      });
      
      const results = await Promise.all(accounts.map(acc => scanAccount(acc, base44)));
      
      return Response.json({
        success: true,
        scanned: accounts.length,
        results,
        high_risk: results.filter(r => r.risk_level === 'high' || r.risk_level === 'critical').length
      });
    }

    // Scan specific account
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ account_id });
    if (accounts.length === 0) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    const result = await scanAccount(accounts[0], base44);
    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function scanAccount(account, base44) {
  const riskFlags = [];
  let riskScore = 0;
  const evidence = {};

  // Fetch trades
  const trades = await base44.asServiceRole.entities.TradeRecord.filter({
    account_id: account.account_id,
    status: 'closed'
  });

  // 1. HFT Detection
  const hft = detectHFT(trades);
  if (hft.detected) {
    riskFlags.push('hft_detected');
    riskScore += 25;
    evidence.hft = hft;
  }

  // 2. Bot Detection
  const bot = detectBot(trades);
  if (bot.detected) {
    riskFlags.push('bot_detected');
    riskScore += 25;
    evidence.bot = bot;
  }

  // 3. Arbitrage Detection
  const arb = detectArbitrage(trades);
  if (arb.detected) {
    riskFlags.push('arbitrage_detected');
    riskScore += 35;
    evidence.arbitrage = arb;
  }

  // 4. Consistency Check
  const consistency = checkConsistency(trades, account);
  if (consistency.suspicious) {
    riskFlags.push('inconsistent_behavior');
    riskScore += 15;
    evidence.consistency = consistency;
  }

  // Risk Level
  let riskLevel = 'low';
  if (riskScore >= 81) riskLevel = 'critical';
  else if (riskScore >= 61) riskLevel = 'high';
  else if (riskScore >= 31) riskLevel = 'medium';

  // AUDIT ONLY: Update non-breach analytics fields for admin visibility.
  // NEVER set can_trade, status, or any breach fields — those are exclusively
  // controlled by mt5RealtimeSync and scheduledMTSync based on challenge rules.
  await base44.asServiceRole.entities.ChallengeAccount.update(account.id, {
    risk_score: riskScore,
    risk_level: riskLevel,
    risk_flags: riskFlags,
    last_risk_scan: new Date().toISOString(),
    hft_detected: riskFlags.includes('hft_detected'),
    arbitrage_detected: riskFlags.includes('arbitrage_detected'),
    ea_bot_detected: riskFlags.includes('bot_detected'),
    ea_bot_score: bot.confidence || 0,
    ea_bot_evidence: bot.evidence || null,
    behavioral_fingerprint: evidence,
    consistency_score: consistency.score || 0,
    // NOTE: can_trade intentionally NOT written here — admin must manually act
  });

  // Create RiskFlag records for admin audit trail (does NOT affect account status)
  if (riskFlags.length > 0) {
    const existingFlags = await base44.asServiceRole.entities.RiskFlag.filter({
      account_id: account.account_id, status: 'active'
    });
    const existingTypes = new Set(existingFlags.map(f => f.flag_type));
    for (const flagType of riskFlags) {
      if (!existingTypes.has(flagType)) {
        await base44.asServiceRole.entities.RiskFlag.create({
          user_email: account.user_email,
          account_id: account.account_id,
          flag_type: flagType,
          severity: riskLevel,
          description: `Risk scan detected: ${flagType.replace(/_/g, ' ')}`,
          status: 'active',
          triggered_at: new Date().toISOString(),
        }).catch(() => {});
      }
    }
  }

  return {
    account_id: account.account_id,
    user_email: account.user_email,
    risk_score: riskScore,
    risk_level: riskLevel,
    risk_flags: riskFlags,
    evidence
  };
}

function detectHFT(trades) {
  if (trades.length < 5) return { detected: false };

  const durations = trades
    .filter(t => t.open_time && t.close_time)
    .map(t => (new Date(t.close_time) - new Date(t.open_time)) / 1000);

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const under60s = durations.filter(d => d < 60).length;
  const pctUnder60s = (under60s / durations.length) * 100;
  const fastest = Math.min(...durations);

  const detected = avgDuration < 120 || pctUnder60s > 25 || fastest < 10;

  return {
    detected,
    avg_duration_seconds: Math.round(avgDuration),
    pct_under_60s: Math.round(pctUnder60s),
    fastest_trade_seconds: Math.round(fastest),
    trades_analyzed: durations.length
  };
}

function detectBot(trades) {
  if (trades.length < 10) return { detected: false };

  // Check lot size patterns
  const lotSizes = trades.map(t => t.lots);
  const uniqueLots = [...new Set(lotSizes)];
  const lotPatternScore = uniqueLots.length <= 3 ? 20 : 0;

  // Check SL/TP patterns
  const slDistances = trades.filter(t => t.sl).map(t => Math.abs(t.entry - t.sl));
  const uniqueSL = [...new Set(slDistances.map(d => d.toFixed(2)))];
  const slPatternScore = uniqueSL.length <= 3 && slDistances.length > 5 ? 20 : 0;

  // Check timing patterns (exact minutes)
  const seconds = trades.map(t => new Date(t.open_time).getSeconds());
  const exactMinutes = seconds.filter(s => s === 0 || s === 15 || s === 30 || s === 45).length;
  const timingScore = (exactMinutes / seconds.length) > 0.7 ? 20 : 0;

  const confidence = lotPatternScore + slPatternScore + timingScore;
  const detected = confidence >= 60;

  return {
    detected,
    confidence,
    evidence: {
      lot_pattern: lotPatternScore > 0,
      sl_tp_pattern: slPatternScore > 0,
      timing_pattern: timingScore > 0
    }
  };
}

function detectArbitrage(trades) {
  // Simple detection: look for opposite trades within seconds
  if (trades.length < 2) return { detected: false };

  const sorted = [...trades].sort((a, b) => new Date(a.open_time) - new Date(b.open_time));
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const t1 = sorted[i];
    const t2 = sorted[i + 1];
    
    const timeDiff = Math.abs(new Date(t2.open_time) - new Date(t1.open_time)) / 1000;
    
    if (timeDiff < 5 && t1.symbol === t2.symbol && t1.type !== t2.type) {
      return {
        detected: true,
        evidence: {
          trade1: t1.trade_id,
          trade2: t2.trade_id,
          time_diff_seconds: Math.round(timeDiff),
          symbol: t1.symbol
        }
      };
    }
  }

  return { detected: false };
}

function checkConsistency(trades, account) {
  if (trades.length < 5) return { suspicious: false, score: 0 };

  const wins = trades.filter(t => t.pnl > 0).length;
  const winRate = wins / trades.length;
  
  // Unrealistic win rate
  const suspicious = winRate > 0.85;
  const score = suspicious ? Math.round(winRate * 100) : 50;

  return {
    suspicious,
    score,
    win_rate: Math.round(winRate * 100),
    total_trades: trades.length
  };
}