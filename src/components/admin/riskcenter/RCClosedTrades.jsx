import React from 'react';
import { Layers, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { KPICard, Panel, RiskBadge, fmtMoney } from './rcShared';

export default function RCClosedTrades({ accounts, onView }) {
  // Aggregate all closed trade data from evidence
  const symbolStats = {};
  let totalProfit = 0, totalLoss = 0;
  const allTrades = [];

  accounts.forEach(a => {
    // We don't have closed trades directly, but we have behavioral/martingale evidence
    // Use the HFT rapid trades and martingale sequences as trade sources
    const rapidTrades = a.evidence?.hft?.rapid_trades || [];
    const martingaleSeqs = a.evidence?.martingale?.evidence || [];
    const scalpTrades = a.evidence?.scalper?.evidence || [];

    [...rapidTrades, ...scalpTrades].forEach(t => {
      allTrades.push({ ...t, user_email: a.user_email });
      if (!symbolStats[t.symbol]) symbolStats[t.symbol] = { trades: 0, profit: 0, loss: 0, totalPnl: 0 };
      symbolStats[t.symbol].trades++;
      const pnl = t.pnl || 0;
      if (pnl > 0) { symbolStats[t.symbol].profit++; symbolStats[t.symbol].totalPnl += pnl; totalProfit += pnl; }
      else if (pnl < 0) { symbolStats[t.symbol].loss++; symbolStats[t.symbol].totalPnl += pnl; totalLoss += Math.abs(pnl); }
    });
  });

  const symbols = Object.entries(symbolStats).map(([sym, s]) => ({ symbol: sym, ...s })).sort((a, b) => b.trades - a.trades);
  const mostTraded = symbols.slice(0, 10);
  const mostProfitable = symbols.filter(s => s.totalPnl > 0).sort((a, b) => b.totalPnl - a.totalPnl).slice(0, 5);
  const biggestLosers = symbols.filter(s => s.totalPnl < 0).sort((a, b) => a.totalPnl - b.totalPnl).slice(0, 5);

  // Top performers
  const topPerformers = [...accounts].sort((a, b) => (b.balance - b.account_size) - (a.balance - a.account_size)).slice(0, 5);

  // Risk distribution by PnL
  const pnlBuckets = { high_gain: 0, small_gain: 0, flat: 0, small_loss: 0, high_loss: 0 };
  accounts.forEach(a => {
    const pnl = (a.balance || 0) - a.account_size;
    const pct = a.account_size ? (pnl / a.account_size) * 100 : 0;
    if (pct >= 5) pnlBuckets.high_gain++;
    else if (pct > 0) pnlBuckets.small_gain++;
    else if (pct === 0) pnlBuckets.flat++;
    else if (pct > -5) pnlBuckets.small_loss++;
    else pnlBuckets.high_loss++;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Profit" value={fmtMoney(totalProfit)} icon={TrendingUp} color="#10b981" />
        <KPICard label="Total Loss" value={fmtMoney(totalLoss)} icon={TrendingDown} color="#ef4444" />
        <KPICard label="Net P&L" value={fmtMoney(totalProfit - totalLoss)} icon={Layers} color={totalProfit - totalLoss >= 0 ? '#10b981' : '#ef4444'} />
        <KPICard label="Active Symbols" value={symbols.length} icon={Layers} color="#60a5fa" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Most Traded Symbols" icon={Layers}>
          {mostTraded.length === 0 ? (
            <p className="text-xs text-white/30 py-4 text-center">No closed trade data available.</p>
          ) : (
            <div className="space-y-2">
              {mostTraded.map(s => (
                <div key={s.symbol} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/70 w-20">{s.symbol}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(s.trades / mostTraded[0].trades) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-white/40 tabular w-8 text-right">{s.trades}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Risk Distribution by PnL" icon={Layers}>
          <div className="space-y-2">
            {[
              { key: 'high_gain', label: 'High Gain (+5%+)', color: '#10b981' },
              { key: 'small_gain', label: 'Small Gain (0-5%)', color: '#60a5fa' },
              { key: 'flat', label: 'Flat', color: '#666' },
              { key: 'small_loss', label: 'Small Loss (-5%)', color: '#f59e0b' },
              { key: 'high_loss', label: 'High Loss (-5%+)', color: '#ef4444' },
            ].map(b => (
              <div key={b.key} className="flex items-center gap-3">
                <span className="text-xs text-white/60 w-32">{b.label}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{ width: `${accounts.length ? (pnlBuckets[b.key] / accounts.length) * 100 : 0}%`, background: b.color }} />
                </div>
                <span className="text-[10px] text-white/40 tabular w-8 text-right">{pnlBuckets[b.key]}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top Performers" icon={TrendingUp}>
          <div className="space-y-1.5">
            {topPerformers.map((a, i) => (
              <button key={a.account_id} onClick={() => onView(a)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/20 w-4">{i + 1}</span>
                  <span className="text-xs text-white/70 truncate max-w-[140px]">{a.user_email}</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 tabular">+{fmtMoney(a.balance - a.account_size)}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Biggest Losers" icon={TrendingDown}>
          <div className="space-y-1.5">
            {[...accounts].sort((a, b) => (a.balance - a.account_size) - (b.balance - b.account_size)).slice(0, 5).map((a, i) => (
              <button key={a.account_id} onClick={() => onView(a)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/20 w-4">{i + 1}</span>
                  <span className="text-xs text-white/70 truncate max-w-[140px]">{a.user_email}</span>
                </div>
                <span className="text-xs font-bold text-red-400 tabular">{fmtMoney(a.balance - a.account_size)}</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}