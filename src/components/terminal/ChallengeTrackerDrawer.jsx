import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Target, Shield, TrendingUp, Calendar, Zap, Clock } from 'lucide-react';
import { getDailyResetCountdown } from './terminalConfig';

function Countdown() {
  const [cd, setCd] = useState(getDailyResetCountdown());
  useEffect(() => {
    const t = setInterval(() => setCd(getDailyResetCountdown()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono font-black text-primary text-[13px]" style={{ letterSpacing: '0.05em' }}>
      {cd.label}
    </span>
  );
}

function Bar({ value, max, color, warn }) {
  const pct = Math.min((value / max) * 100, 100);
  const c = warn ? '#ef4444' : color;
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg,${c}90,${c})`, boxShadow: `0 0 8px ${c}50` }}
      />
    </div>
  );
}

export default function ChallengeTrackerDrawer({ account, rules, balance, equity, dailyOpenBalance }) {
  const [open, setOpen] = useState(false);

  const accountSize  = account?.account_size || 100000;
  const pnl          = balance - accountSize;
  const profitPct    = Math.max(0, (pnl / accountSize) * 100);
  const dayStart     = dailyOpenBalance || balance;
  const dailyDD      = Math.max(0, ((dayStart - equity) / accountSize) * 100);
  const maxDD        = Math.max(0, ((accountSize - equity) / accountSize) * 100);
  const tradingDays  = account?.trading_days || 0;
  const minDays      = rules?.minTradingDays || 4;
  const phase        = account?.phase || 'phase1';
  const status       = account?.status || 'active';

  const profitTarget  = rules?.profitTarget || 10;
  const dailyDDLimit  = rules?.dailyDDLimit || 5;
  const maxDDLimit    = rules?.maxDDLimit || 10;

  const statusMeta = {
    active:  { label: 'ACTIVE',  color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  },
    passed:  { label: 'PASSED',  color: '#FF5C00', bg: 'rgba(255,92,0,0.12)',    border: 'rgba(255,92,0,0.3)'    },
    failed:  { label: 'FAILED',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
    funded:  { label: 'FUNDED',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)'  },
    pending: { label: 'PENDING', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)'  },
  };
  const sm = statusMeta[status] || statusMeta.active;

  const challengeLabel =
    account?.challenge_type === 'instant_light' ? 'Instant Light'
    : account?.challenge_type === 'instant' ? 'Instant Funding'
    : 'Two-Step Challenge';

  const metrics = [
    { label: 'Profit Target', value: profitPct, max: profitTarget,  color: '#FF5C00',  unit: '%', warn: false,                icon: Target   },
    { label: 'Daily DD Used', value: dailyDD,   max: dailyDDLimit,  color: '#10b981',  unit: '%', warn: dailyDD >= dailyDDLimit * 0.8,  icon: Shield   },
    { label: 'Max DD Used',   value: maxDD,     max: maxDDLimit,    color: '#8b5cf6',  unit: '%', warn: maxDD   >= maxDDLimit   * 0.8,  icon: TrendingUp },
  ];

  const rules_list = [
    { label: 'News Trading',      val: rules?.newsTrading,      on: '✓', off: '✗' },
    { label: 'Overnight Holding', val: rules?.overnightHolding, on: '✓', off: '✗' },
    { label: 'Weekend Holding',   val: rules?.weekendHolding,   on: '✓', off: '✗' },
    { label: 'EA Allowed',        val: true,                    on: '✓', off: '✗' },
  ];

  return (
    <div className="border-t border-white/[0.08] flex-shrink-0" style={{ background: 'rgba(8,12,22,0.99)' }}>

      {/* ── Compact always-visible strip ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/[0.03] transition-all group"
      >
        {/* Challenge label */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 whitespace-nowrap">{challengeLabel}</span>
          <span className="text-[11px] font-black text-slate-200 whitespace-nowrap">{phase.replace('phase', 'Phase ')} — ${accountSize.toLocaleString()}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black whitespace-nowrap"
            style={{ background: sm.bg, border: `1px solid ${sm.border}`, color: sm.color }}>
            {sm.label}
          </span>
        </div>

        {/* Quick metrics strip */}
        <div className="hidden lg:flex items-center gap-4">
          {metrics.map(m => (
            <div key={m.label} className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 whitespace-nowrap">{m.label}:</span>
              <span className="text-[11px] font-black whitespace-nowrap"
                style={{ color: m.warn ? '#ef4444' : m.color }}>
                {m.value.toFixed(2)}% / {m.max}%
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-blue-400" />
            <span className="text-[11px] font-black text-blue-400">{tradingDays}/{minDays}d</span>
          </div>
        </div>

        {/* Reset countdown + toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden md:flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] text-slate-500">Reset in</span>
            <Countdown />
          </div>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </motion.div>
        </div>
      </button>

      {/* ── Expanded panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="tracker-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>

              {/* Objectives */}
              <div className="space-y-3">
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">Objectives</div>
                {metrics.map(m => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3 h-3" style={{ color: m.warn ? '#ef4444' : m.color }} />
                          <span className="text-[10px] text-slate-400">{m.label}</span>
                        </div>
                        <span className="text-[10px] font-mono font-black"
                          style={{ color: m.warn ? '#ef4444' : m.color }}>
                          {m.value.toFixed(2)}% / {m.max}%
                        </span>
                      </div>
                      <Bar value={m.value} max={m.max} color={m.color} warn={m.warn} />
                    </div>
                  );
                })}
              </div>

              {/* Trading Days */}
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">Trading Days</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: minDays }).map((_, i) => {
                    const done = i < tradingDays;
                    return (
                      <motion.div key={i}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: i * 0.07 }}
                        className="h-9 rounded-lg flex flex-col items-center justify-center text-[9px] font-black"
                        style={{
                          background: done ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${done ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          color: done ? '#10b981' : '#334155',
                          boxShadow: done ? '0 0 8px rgba(16,185,129,0.2)' : 'none',
                        }}>
                        {done ? '✓' : `D${i + 1}`}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-2 text-[10px] font-mono text-slate-500">
                  {tradingDays >= minDays
                    ? <span className="text-emerald-400 font-bold">✓ Requirement met</span>
                    : `${minDays - tradingDays} more day${minDays - tradingDays !== 1 ? 's' : ''} needed`
                  }
                </div>
              </div>

              {/* Account Rules */}
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">Account Rules</div>
                <div className="space-y-2">
                  {rules_list.map(r => (
                    <div key={r.label} className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-[10px] text-slate-400 font-mono">{r.label}</span>
                      <span className={`text-[10px] font-black ${r.val ? 'text-emerald-400' : 'text-red-400/60'}`}>
                        {r.val ? `${r.on} ON` : `${r.off} OFF`}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-slate-400 font-mono">Leverage</span>
                    </div>
                    <span className="text-[11px] font-black text-primary">1:{rules?.leverage || 100}</span>
                  </div>
                </div>
              </div>

              {/* Daily Reset */}
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">Daily DD Reset</div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
                  <div className="text-[9px] text-slate-500 mb-1">Next reset in</div>
                  <Countdown />
                  <div className="text-[9px] text-slate-500 mt-1">Daily 3:00 AM GMT+4</div>
                  <div className="mt-2 pt-2 border-t border-white/[0.06]">
                    <div className="text-[9px] text-slate-500">Daily DD Used</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] font-black"
                        style={{ color: dailyDD >= dailyDDLimit * 0.8 ? '#ef4444' : '#10b981' }}>
                        {dailyDD.toFixed(2)}%
                      </span>
                      <span className="text-[9px] text-slate-600">/ {dailyDDLimit}%</span>
                    </div>
                    <Bar value={dailyDD} max={dailyDDLimit} color="#10b981" warn={dailyDD >= dailyDDLimit * 0.8} />
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}