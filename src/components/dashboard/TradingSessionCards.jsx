import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, AlertCircle, Zap } from 'lucide-react';

export default function TradingSessionCards({ account, positions, pendingOrders }) {
  const [bulkAction, setBulkAction] = useState(null);

  const profitTrades = positions.filter(p => {
    const entry = p.entry || 0;
    const current = p.current || entry;
    return (p.type === 'BUY' && current > entry) || (p.type === 'SELL' && current < entry);
  }).length;

  const lossTrades = positions.filter(p => {
    const entry = p.entry || 0;
    const current = p.current || entry;
    return (p.type === 'BUY' && current < entry) || (p.type === 'SELL' && current > entry);
  }).length;

  const handleBulkClose = (type) => {
    if (type === 'profit') {
      alert(`Closing ${profitTrades} profit trades`);
    } else if (type === 'loss') {
      alert(`Closing ${lossTrades} loss trades`);
    }
    setBulkAction(null);
  };

  const handleHalfCut = () => {
    alert('Half-cutting all positions (50% close)');
    setBulkAction(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Current Session */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
        className="rounded-xl p-5 border"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="text-xs font-mono text-emerald-400/70 mb-3 uppercase">Current Session</div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Trades</span>
            <span className="text-lg font-black text-foreground">{positions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Pending</span>
            <span className="text-lg font-black text-primary">{pendingOrders.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400/70">Profit</span>
            <span className="text-emerald-400 font-bold">{profitTrades}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-red-400/70">Loss</span>
            <span className="text-red-400 font-bold">{lossTrades}</span>
          </div>
        </div>
      </motion.div>

      {/* Next Session */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-xl p-5 border"
        style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(96,165,250,0.02))', border: '1px solid rgba(96,165,250,0.2)' }}>
        <div className="text-xs font-mono text-blue-400/70 mb-3 uppercase">Next Session</div>
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-muted-foreground/70 mb-1">Starts In</div>
            <div className="text-lg font-black text-blue-400">04:32:15</div>
          </div>
          <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
            <Clock className="w-3 h-3" /> GMT+4
          </div>
        </div>
      </motion.div>

      {/* Pending Orders */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl p-5 border"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="text-xs font-mono text-yellow-400/70 mb-3 uppercase">Pending Orders</div>
        <div className="space-y-2">
          {pendingOrders.slice(0, 3).map((order, idx) => (
            <div key={idx} className="text-[10px] py-1 px-2 rounded bg-white/5 flex justify-between">
              <span className="text-muted-foreground/70">{order.type}</span>
              <span className="text-foreground font-mono">{order.symbol}</span>
            </div>
          ))}
          {pendingOrders.length === 0 && (
            <div className="text-[10px] text-muted-foreground/50 py-2">No pending orders</div>
          )}
        </div>
      </motion.div>

      {/* Bulk Operations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-xl p-5 border"
        style={{ background: 'linear-gradient(135deg, rgba(255,92,0,0.08), rgba(255,92,0,0.02))', border: '1px solid rgba(255,92,0,0.2)' }}>
        <div className="text-xs font-mono text-primary/70 mb-3 uppercase">Bulk Operations</div>
        <div className="space-y-2">
          <button onClick={() => handleBulkClose('profit')} disabled={profitTrades === 0}
            className="w-full text-[10px] py-2 px-2 rounded font-mono font-bold transition-all disabled:opacity-40 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
            Close Profit ({profitTrades})
          </button>
          <button onClick={() => handleBulkClose('loss')} disabled={lossTrades === 0}
            className="w-full text-[10px] py-2 px-2 rounded font-mono font-bold transition-all disabled:opacity-40 bg-red-500/20 text-red-400 hover:bg-red-500/30">
            Close Loss ({lossTrades})
          </button>
          <button onClick={handleHalfCut} disabled={positions.length === 0}
            className="w-full text-[10px] py-2 px-2 rounded font-mono font-bold transition-all disabled:opacity-40 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
            Half Cut All
          </button>
        </div>
      </motion.div>

      {/* Risk Monitor */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-xl p-5 border"
        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(168,85,247,0.02))', border: '1px solid rgba(168,85,247,0.2)' }}>
        <div className="text-xs font-mono text-purple-400/70 mb-3 uppercase">Risk Monitor</div>
        <div className="space-y-2 text-[10px]">
          <div className="flex items-center gap-2 p-1.5 rounded bg-white/5">
            <span className="text-muted-foreground/60">🔗 Copy Trades</span>
            <span className="text-purple-400 font-bold ml-auto">0</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded bg-white/5">
            <span className="text-muted-foreground/60">📍 IP Issues</span>
            <span className="text-orange-400 font-bold ml-auto">None</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded bg-white/5">
            <span className="text-muted-foreground/60">🛡️ Hedging</span>
            <span className="text-emerald-400 font-bold ml-auto">Off</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}