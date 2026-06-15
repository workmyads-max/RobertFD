import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

function AccountCard({ account, isSelected, onSelect, i, onNavigate }) {
  const pnl = account.pnl || 0;
  const isProfit = pnl >= 0;
  const size = account.account_size || 0;
  const progress = Math.min(100, Math.max(0, account.profit_target_progress || (pnl / size * 100)));
  const challengeType = account.challenge_type === 'instant' ? 'INSTANT'
    : account.challenge_type === 'instant_light' ? 'INST. LIGHT' : '2-STEP';
  const phaseLabel = (account.phase || 'phase1').replace('phase', 'PH ');
  const statusLabel = account.status === 'active' ? 'Active'
    : account.status === 'passed' ? 'Passed'
    : account.status === 'funded' ? 'Funded' : account.status;
  const statusColor = account.status === 'active' ? '#10b981'
    : account.status === 'funded' ? '#FF5C00'
    : account.status === 'passed' ? '#60a5fa' : '#94a3b8';

  const handleDetails = (e) => {
    e.stopPropagation();
    sessionStorage.setItem('selectedAccountId', account.account_id || account.id);
    onNavigate?.('account-overview');
  };

  return (
    <motion.div
      onClick={() => onSelect(account)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      className="flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden"
      style={{
        minWidth: '220px',
        maxWidth: '240px',
        background: 'rgba(10,10,16,0.97)',
        border: `1px solid ${isSelected ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: isSelected ? '0 0 28px rgba(255,92,0,0.1)' : 'none',
      }}
    >
      {/* Top accent line when selected */}
      {isSelected && (
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #FF5C00, transparent)' }} />
      )}

      {/* Header strip: type · phase + status */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-widest" style={{ color: '#FF5C00' }}>{challengeType}</span>
          <span className="text-white/20 text-[10px]">·</span>
          <span className="text-[10px] font-bold tracking-widest text-white/40">{phaseLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
          <span className="text-[10px] font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {/* Account ID */}
        <div className="text-[10px] font-mono font-bold text-white/35 tracking-widest mb-3">
          {account.account_id || account.id?.slice(0, 12)}
        </div>

        {/* Size */}
        <div className="mb-1">
          <div className="text-3xl font-black text-white tracking-tight leading-none">
            ${size.toLocaleString()}
          </div>
        </div>

        {/* P&L */}
        <div className={`flex items-center gap-1 text-sm font-bold mb-4 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
          {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isProfit ? '+' : ''}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* Profit Target progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
            <span className="text-white/30">Profit Target</span>
            <span style={{ color: '#FF5C00' }}>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #FF5C00, #FF8A3D)' }} />
          </div>
        </div>

        {/* Details button */}
        <button
          onClick={handleDetails}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', color: '#fff' }}
        >
          Details <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom info strip */}
      <div className="grid grid-cols-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
        {[
          { label: 'MODEL', value: account.account_type === 'swing' ? 'Swing' : 'Standard', highlight: true },
          { label: 'LEVERAGE', value: account.leverage || '1:100' },
          { label: 'PLATFORM', value: (account.platform || 'MT5').toUpperCase() },
        ].map((item, idx) => (
          <div key={item.label} className="px-3 py-2 text-center" style={{ borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div className="text-[8px] font-bold tracking-widest text-white/20 mb-0.5">{item.label}</div>
            <div className={`text-[10px] font-bold ${item.highlight ? 'text-primary' : 'text-white/55'}`}>{item.value}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function AccountSwitcher({ accounts, selectedId, onSelect, onNavigate }) {
  if (!accounts?.length) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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