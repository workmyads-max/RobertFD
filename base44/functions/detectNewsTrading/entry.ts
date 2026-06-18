import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Detects news trading violations for Standard accounts
 * Checks if positions were held during high-impact news events (NFP, FOMC, CPI)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Check if risk detection is enabled
    const settings = await base44.asServiceRole.entities.PlatformSettings.filter({ setting_key: 'risk_detection_enabled' });
    if (settings.length > 0 && settings[0].is_enabled === false) {
      return Response.json({ error: 'Risk Detection is disabled. Enable it from Admin > Risk Detection before running scans.' }, { status: 403 });
    }

    const body = await req.json();
    const { account_id, email, checkPastDays = 30 } = body;

    // High-impact news events for 2026 (approximate schedule)
    // In production, integrate with economic calendar API (e.g., ForexFactory, TradingEconomics)
    const highImpactEvents = [
      // NFP (Non-Farm Payrolls) - First Friday of month, 13:30 UTC
      { date: '2026-01-02', time: '13:30', event: 'NFP', impact: 'high' },
      { date: '2026-02-06', time: '13:30', event: 'NFP', impact: 'high' },
      { date: '2026-03-06', time: '13:30', event: 'NFP', impact: 'high' },
      { date: '2026-04-03', time: '13:30', event: 'NFP', impact: 'high' },
      { date: '2026-05-01', time: '13:30', event: 'NFP', impact: 'high' },
      
      // FOMC (Federal Reserve) - 8 times per year, 19:00 UTC
      { date: '2026-01-28', time: '19:00', event: 'FOMC', impact: 'high' },
      { date: '2026-03-18', time: '19:00', event: 'FOMC', impact: 'high' },
      { date: '2026-05-06', time: '19:00', event: 'FOMC', impact: 'high' },
      
      // CPI (Consumer Price Index) - Mid-month, 13:30 UTC
      { date: '2026-01-13', time: '13:30', event: 'CPI', impact: 'high' },
      { date: '2026-02-12', time: '13:30', event: 'CPI', impact: 'high' },
      { date: '2026-03-12', time: '13:30', event: 'CPI', impact: 'high' },
      { date: '2026-04-14', time: '13:30', event: 'CPI', impact: 'high' },
      { date: '2026-05-13', time: '13:30', event: 'CPI', impact: 'high' },
    ];

    // Get accounts to check
    let accounts = [];
    if (account_id) {
      const accs = await base44.asServiceRole.entities.ChallengeAccount.filter({ account_id });
      accounts = accs;
    } else if (email) {
      const accs = await base44.asServiceRole.entities.ChallengeAccount.filter({ user_email: email });
      accounts = accs;
    } else {
      // Fetch all active/passed/funded — filter per rule_snapshot below
      accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ 
        status: ['active', 'passed', 'funded'],
      });
      // Only keep accounts where news trading is NOT allowed per their snapshot
      accounts = accounts.filter(a => {
        const allowed = a.rule_snapshot?.news_trading ?? (a.account_type === 'swing');
        return !allowed;
      });
    }

    const violations = [];
    const timeThreshold = new Date();
    timeThreshold.setDate(timeThreshold.getDate() - checkPastDays);

    for (const account of accounts) {
      try {
        // Get all trades in past 30 days
        const allTrades = await base44.asServiceRole.entities.TradeRecord.filter({
          account_id: account.account_id
        });

        const recentTrades = allTrades.filter(t => {
          const openTime = new Date(t.open_time);
          return openTime >= timeThreshold;
        });

        if (recentTrades.length === 0) continue;

        // Check each trade against news events
        for (const trade of recentTrades) {
          const openTime = new Date(t.open_time);
          const closeTime = t.close_time ? new Date(t.close_time) : new Date();
          
          for (const newsEvent of highImpactEvents) {
            const eventDateTime = new Date(`${newsEvent.date}T${newsEvent.time}:00Z`);
            const eventStart = new Date(eventDateTime.getTime() - (15 * 60 * 1000)); // 15 min before
            const eventEnd = new Date(eventDateTime.getTime() + (45 * 60 * 1000)); // 45 min after
            
            // Check if trade was open during news event
            const isOpenDuringNews = (
              (openTime <= eventStart && closeTime >= eventEnd) || // Held through entire event
              (openTime >= eventStart && openTime <= eventEnd) || // Opened during event
              (closeTime >= eventStart && closeTime <= eventEnd) // Closed during event
            );

            if (isOpenDuringNews) {
              // This is a violation for Standard accounts
              const violation = await base44.asServiceRole.entities.RiskFlag.create({
                user_email: account.user_email,
                account_id: account.account_id,
                flag_type: 'news_trading_violation',
                severity: 'high',
                description: `Position held during high-impact news: ${newsEvent.event}`,
                status: 'active',
                triggered_at: new Date().toISOString(),
                admin_notes: JSON.stringify({
                  news_event: newsEvent.event,
                  event_datetime: newsEvent.date + ' ' + newsEvent.time + ' UTC',
                  trade_symbol: trade.symbol,
                  trade_type: trade.type,
                  trade_lots: trade.lots,
                  open_time: trade.open_time,
                  close_time: trade.close_time || 'open',
                  trade_pnl: trade.pnl || 0,
                  account_type: account.account_type,
                  note: 'Standard accounts prohibited from holding during high-impact news'
                })
              });

              violations.push({
                account_id: account.account_id,
                user_email: account.user_email,
                news_event: newsEvent.event,
                event_datetime: newsEvent.date + ' ' + newsEvent.time + ' UTC',
                trade_symbol: trade.symbol,
                trade_type: trade.type,
                trade_lots: trade.lots,
                risk_flag_id: violation.id
              });
            }
          }
        }

      } catch (accError) {
        console.error(`Error checking account ${account.account_id}:`, accError.message);
      }
    }

    return Response.json({
      success: true,
      analysis_time: new Date().toISOString(),
      accounts_checked: accounts.length,
      violations_found: violations.length,
      violations,
      note: 'Swing accounts are exempt from news trading restrictions'
    });

  } catch (error) {
    console.error('News trading detection error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});