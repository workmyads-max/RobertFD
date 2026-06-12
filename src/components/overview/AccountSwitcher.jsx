import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, TrendingUp, TrendingDown, Zap, ArrowRight } from 'lucide-react';

function AccountCard({ account, isSelected, onSelect, i, onNavigate }) {
  const pnl = account.pnl || 0;
  const isProfit = pnl >= 0;
  const size = account.account_size || 0;
  const progress = account.profit_target_progress || (pnl / size * 100);

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    // Save account ID for navigation
    sessionStorage.setItem('selectedAccountId', account.account_id || account.id);
    onNavigate?.('account-overview');
  };

  return (
    <motion.button
      onClick={() => onSelect(account)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="flex-shrink-0 p-5 rounded-2xl text-left transition-all relative overflow-hidden"
      style={{
        minWidth: '220px',
        background: isSelected
          ? 'linear-gradient(145deg, rgba(25,12,4,0.98), rgba(30,14,4,0.95))'
          : 'linear-gradient(145deg, rgba(8,14,28,0.95), rgba(10,18,38,0.9))',
        border: `1px solid ${isSelected ? 'rgba(255,92,0,0.35)' : 'rgba(255,255,255,0.05)'}`,
        boxShadow: isSelected ? '0 0 30px rgba(255,92,0,0.08)' : 'none',
      }}
    >
      {/* Top glow edge when selected */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,92,0,0.7), transparent)' }} />
      )}

      {/* Details button */}
      <button
        onClick={handleDetailsClick}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
        style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}
      >
        <ArrowRight className="w-3.5 h-3.5 text-[#FF5C00] group-hover:text-[#FF5C00] transition-colors" />
      </button>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-[0.15em] mb-1.5">
            {account.challenge_type === 'instant' ? 'Instant' : '2-Step'} · {(account.phase || 'phase1').replace('phase', 'Ph ')}
          </div>
          <div className="text-[11px] font-mono font-semibold text-white/60">{account.account_id || account.id?.slice(0, 12)}</div>
        </div>
        {isSelected
          ? <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          : <Zap className="w-4 h-4 text-white/10 flex-shrink-0 mt-0.5" />}
      </div>

      <div className="mb-4">
        <div className="text-xl font-bold text-white tracking-tight">${size.toLocaleString()}</div>
        <div className="text-[10px] text-white/25 font-mono capitalize mt-0.5">{account.status}</div>
      </div>

      {/* Mini progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[9px] font-mono text-white/25 mb-1">
          <span>Profit Target</span>
          <span>{Math.max(0, progress).toFixed(1)}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              background: 'linear-gradient(90deg, #FF5C0060, #FF5C00)',
            }} />
        </div>
      </div>

      <div className={`flex items-center gap-1 text-xs font-semibold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
        {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {isProfit ? '+' : ''}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      {/* Details Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(account);
          const accountId = account.account_id || account.id;
          window.location.href = `/dashboard?tab=account-overview&account=${accountId}`;
        }}
        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: 'rgba(255,92,0,0.1)',
          border: '1px solid rgba(255,92,0,0.25)',
          color: '#FF5C00',
        }}
      >
        Details <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </motion.button>
  );
}

export default function AccountSwitcher({ accounts, selectedId, onSelect, onNavigate }) {
  if (!accounts?.length) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {accounts.map((account, i) => (
        <AccountCard
          key={account.id}
          account={account}
          isSelected={account.id === selectedId}
          onSelect={onSelect}
          onNavigate={onNavigate}
          i={i}
        />
      ))}
    </div>
  );
}