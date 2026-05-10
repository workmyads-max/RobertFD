import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

export default function AccountSwitcher({ accounts, selectedId, onSelect }) {
  if (!accounts || accounts.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {accounts.map((account, i) => {
        const isSelected = account.id === selectedId;
        const pnl = account.pnl || 0;
        const isProfit = pnl >= 0;

        return (
          <motion.button
            key={account.id}
            onClick={() => onSelect(account)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex-shrink-0 p-4 rounded-xl text-left transition-all"
            style={{
              minWidth: '200px',
              background: isSelected
                ? 'linear-gradient(135deg, rgba(0,149,255,0.15), rgba(0,245,160,0.05))'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isSelected ? 'rgba(0,149,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
              boxShadow: isSelected ? '0 0 20px rgba(0,149,255,0.1)' : 'none',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">
                  {account.challenge_type === 'instant' ? 'Instant' : '2-Step'} · {(account.phase || 'phase1').replace('phase', 'Phase ')}
                </div>
                <div className="text-xs font-black text-white/80 font-mono">{account.account_id || account.id?.slice(0, 10)}</div>
              </div>
              {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />}
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-lg font-black text-white">${(account.account_size || 0).toLocaleString()}</div>
                <div className="text-[9px] text-white/30 font-mono capitalize">{account.status}</div>
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isProfit ? '+' : ''}${Math.abs(pnl).toFixed(2)}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}