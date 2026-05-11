import { useMemo } from 'react';

/**
 * Derives all real trading statistics from actual account entity data + trade records.
 * Falls back gracefully when data is missing.
 */
export function useAccountStats(account, trades = []) {
  return useMemo(() => {
    if (!account) return null;

    const size = account.account_size || 100000;
    const balance = account.balance || size;
    const equity = account.equity || balance;
    const pnl = account.pnl || 0;
    const dailyPnl = account.daily_pnl || 0;
    const dailyDD = account.daily_drawdown_used || 0;
    const maxDD = account.max_drawdown_used || 0;
    const profitProgress = account.profit_target_progress || 0;
    const winRate = account.win_rate || 0;
    const totalTrades = account.total_trades || 0;
    const tradingDays = account.trading_days || 0;

    // Derive from actual trades if available
    // account_id field in TradeRecord stores account.id (the DB primary key)
    const closedTrades = trades.filter(t => t.status === 'closed' && (t.account_id === account.id || t.account_id === account.account_id));
    const openTrades = trades.filter(t => t.status === 'open' && (t.account_id === account.id || t.account_id === account.account_id));

    let computedWinRate = winRate;
    let wins = 0, losses = 0;
    let totalProfit = 0, totalLoss = 0;
    let floatingPnl = 0;
    let closedPnl = pnl;
    let lots = 0;

    if (closedTrades.length > 0) {
      wins = closedTrades.filter(t => (t.pnl || 0) > 0).length;
      losses = closedTrades.filter(t => (t.pnl || 0) <= 0).length;
      computedWinRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
      totalProfit = closedTrades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
      totalLoss = Math.abs(closedTrades.filter(t => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0));
      closedPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
      lots = closedTrades.reduce((s, t) => s + (t.lots || 0), 0);
    }

    if (openTrades.length > 0) {
      floatingPnl = openTrades.reduce((s, t) => s + (t.pnl || 0), 0);
      lots += openTrades.reduce((s, t) => s + (t.lots || 0), 0);
    }

    // Compute today's real P&L from closed trades (fallback to account.daily_pnl)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrades = closedTrades.filter(t => {
      const d = t.close_time || t.updated_date || '';
      return d.startsWith(todayStr) || d.includes(new Date().toLocaleDateString());
    });
    const realDailyPnl = todayTrades.length > 0
      ? todayTrades.reduce((s, t) => s + (t.pnl || 0), 0)
      : dailyPnl;

    const avgProfit = wins > 0 ? totalProfit / wins : 0;
    const avgLoss = losses > 0 ? totalLoss / losses : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    const expectancy = totalTrades > 0
      ? ((computedWinRate / 100) * avgProfit) - ((1 - computedWinRate / 100) * avgLoss)
      : 0;
    const rrr = avgLoss > 0 ? avgProfit / avgLoss : 0;

    // Drawdown percentage relative to account size
    const dailyDDPct = dailyDD > 0 ? dailyDD : Math.abs(dailyPnl / size) * 100;
    const maxDDPct = maxDD > 0 ? maxDD : Math.abs((size - Math.min(equity, size)) / size) * 100;
    const profitTargetPct = profitProgress > 0 ? profitProgress : (pnl / size) * 100;

    return {
      // Core
      size, balance, equity, pnl, dailyPnl: realDailyPnl, floatingPnl, closedPnl,
      // Risk
      dailyDDPct, maxDDPct, profitTargetPct,
      // Performance
      winRate: computedWinRate, totalTrades: Math.max(totalTrades, closedTrades.length),
      tradingDays, wins, losses, lots,
      // Advanced
      avgProfit, avgLoss, profitFactor, expectancy, rrr,
      openPositions: openTrades.length,
    };
  }, [account, trades]);
}