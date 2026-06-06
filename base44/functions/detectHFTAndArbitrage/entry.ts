import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Detects HFT (High-Frequency Trading) and arbitrage patterns
 * Analyzes trade frequency, duration, and price manipulation
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { account_id, email, timeWindowHours = 24 } = body;

    // Get accounts to analyze
    let accounts = [];
    if (account_id) {
      const accs = await base44.asServiceRole.entities.ChallengeAccount.filter({ account_id });
      accounts = accs;
    } else if (email) {
      const accs = await base44.asServiceRole.entities.ChallengeAccount.filter({ user_email: email });
      accounts = accs;
    } else {
      // Analyze all active accounts
      accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ 
        status: ['active', 'passed', 'funded']
      });
    }

    const analysisTime = new Date();
    const timeThreshold = new Date(analysisTime.getTime() - (timeWindowHours * 60 * 60 * 1000));

    const violations = [];

    // Bulk-fetch all trades once — eliminates N+1 (200 queries → 1 query)
    const allTradesBulk = await base44.asServiceRole.entities.TradeRecord.list('-created_date', 5000);
    const tradesByAcct = {};
    for (const t of allTradesBulk) {
      if (!tradesByAcct[t.account_id]) tradesByAcct[t.account_id] = [];
      tradesByAcct[t.account_id].push(t);
    }

    for (const account of accounts) {
      try {
        const allTrades = tradesByAcct[account.account_id] || [];
        const recentTrades = allTrades.filter(t => {
          const tradeTime = new Date(t.open_time);
          return tradeTime >= timeThreshold;
        });

        if (recentTrades.length < 10) {
          continue; // Not enough data for analysis
        }

        // === HFT DETECTION ===
        // 1. Trade Frequency Analysis
        const tradesPerHour = recentTrades.length / timeWindowHours;
        const isHighFrequency = tradesPerHour > 20; // More than 20 trades/hour

        // 2. Ultra-Short Duration Trades (scalping < 10 seconds)
        const ultraShortTrades = recentTrades.filter(t => {
          if (!t.close_time || !t.open_time) return false;
          const open = new Date(t.open_time);
          const close = new Date(t.close_time);
          const duration = (close - open) / 1000; // seconds
          return duration < 10; // Less than 10 seconds
        });
        const ultraShortRatio = ultraShortTrades.length / recentTrades.length;
        const isUltraScalping = ultraShortRatio > 0.3; // More than 30% are <10s

        // 3. Repetitive Pattern Detection (same symbol, same direction, rapid succession)
        const sortedTrades = recentTrades.sort((a, b) => 
          new Date(a.open_time).getTime() - new Date(b.open_time).getTime()
        );
        
        let repetitiveCount = 0;
        for (let i = 1; i < sortedTrades.length; i++) {
          const prev = sortedTrades[i-1];
          const curr = sortedTrades[i];
          
          if (!prev.open_time || !curr.open_time) continue;
          
          const timeDiff = (new Date(curr.open_time) - new Date(prev.open_time)) / 1000; // seconds
          const sameSymbol = prev.symbol === curr.symbol;
          const sameType = prev.type === curr.type;
          const rapid = timeDiff < 30; // Within 30 seconds
          
          if (sameSymbol && sameType && rapid) {
            repetitiveCount++;
          }
        }
        const repetitiveRatio = repetitiveCount / (recentTrades.length - 1);
        const isRepetitive = repetitiveRatio > 0.5; // More than 50% are repetitive

        // === ARBITRAGE DETECTION — O(n) sliding window instead of O(n²) ===
        // Group by symbol, then check consecutive opposite trades within 60s
        let arbitrageCount = 0;
        const bySymbol = {};
        for (const t of sortedTrades) {
          if (!t.open_time || !t.symbol) continue;
          if (!bySymbol[t.symbol]) bySymbol[t.symbol] = [];
          bySymbol[t.symbol].push(t);
        }
        for (const symTrades of Object.values(bySymbol)) {
          for (let i = 1; i < symTrades.length; i++) {
            const prev = symTrades[i - 1];
            const curr = symTrades[i];
            const timeDiff = (new Date(curr.open_time) - new Date(prev.open_time)) / 1000;
            if (timeDiff < 60 && prev.type !== curr.type) arbitrageCount++;
          }
        }
        const isArbitrage = arbitrageCount > 5; // More than 5 arbitrage-like pairs

        // 2. Risk-free profit pattern (quick close with minimal price movement)
        const riskFreeProfits = recentTrades.filter(t => {
          if (!t.close || !t.entry) return false;
          const priceChange = Math.abs((t.close - t.entry) / t.entry);
          const pnl = t.pnl || 0;
          // Tiny price movement but positive PnL (possible arbitrage)
          return priceChange < 0.0001 && pnl > 0;
        });
        const isRiskFreeArbitrage = riskFreeProfits.length > 3;

        // === COMPILE VIOLATIONS ===
        const violationTypes = [];
        let severity = 'low';
        let shouldFlag = false;

        if (isHighFrequency) {
          violationTypes.push('high_frequency_trading');
          severity = 'medium';
          shouldFlag = true;
        }

        if (isUltraScalping) {
          violationTypes.push('ultra_scalping');
          severity = 'medium';
          shouldFlag = true;
        }

        if (isRepetitive) {
          violationTypes.push('repetitive_pattern');
          severity = 'medium';
          shouldFlag = true;
        }

        if (isArbitrage || isRiskFreeArbitrage) {
          violationTypes.push('arbitrage');
          severity = 'high';
          shouldFlag = true;
        }

        // === CREATE RISK FLAG IF VIOLATIONS FOUND ===
        if (shouldFlag) {
          const flag = await base44.asServiceRole.entities.RiskFlag.create({
            user_email: account.user_email,
            account_id: account.account_id,
            flag_type: 'hft_detection',
            severity,
            description: `HFT/Arbitrage patterns detected: ${violationTypes.join(', ')}`,
            status: 'active',
            triggered_at: analysisTime.toISOString(),
            admin_notes: JSON.stringify({
              trades_analyzed: recentTrades.length,
              trades_per_hour: parseFloat(tradesPerHour.toFixed(2)),
              ultra_short_ratio: parseFloat(ultraShortRatio.toFixed(2)),
              repetitive_ratio: parseFloat(repetitiveRatio.toFixed(2)),
              arbitrage_count: arbitrageCount,
              violation_types: violationTypes,
              time_window_hours: timeWindowHours
            })
          });

          violations.push({
            account_id: account.account_id,
            user_email: account.user_email,
            severity,
            violation_types: violationTypes,
            metrics: {
              trades_per_hour: parseFloat(tradesPerHour.toFixed(2)),
              ultra_short_ratio: parseFloat(ultraShortRatio.toFixed(2)),
              repetitive_ratio: parseFloat(repetitiveRatio.toFixed(2)),
              arbitrage_count: arbitrageCount
            },
            risk_flag_id: flag.id
          });
        }

      } catch (accError) {
        console.error(`Error analyzing account ${account.account_id}:`, accError.message);
      }
    }

    return Response.json({
      success: true,
      analysis_time: analysisTime.toISOString(),
      accounts_analyzed: accounts.length,
      violations_found: violations.length,
      violations
    });

  } catch (error) {
    console.error('HFT detection error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});