import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Copy, ChevronRight, CheckCircle2, AlertTriangle, Play, Square, Settings, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const RISK_MODES = [
  { id: 'balance_multiplier', label: 'Balance Multiplier', desc: 'Scale lots based on account balance ratio' },
  { id: 'fixed_lot', label: 'Fixed Lot', desc: 'Use a fixed lot size for all copied trades' },
  { id: 'same_ratio', label: 'Same Ratio (1:1)', desc: 'Copy exact lot size from master account' },
];

function AccountPicker({ label, accounts, value, onChange, exclude }) {
  const opts = accounts.filter(a => a.id !== exclude);
  return (
    <div>
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">{label}</div>
      <div className="space-y-2">
        {opts.length === 0 ? (
          <div className="rounded-xl p-3 text-xs font-mono text-muted-foreground/50 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            No eligible accounts
          </div>
        ) : opts.map(a => (
          <button key={a.id} onClick={() => onChange(a)}
            className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all"
            style={{
              background: value?.id === a.id ? 'rgba(255,92,0,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${value?.id === a.id ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: value?.id === a.id ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.06)' }}>
              <Activity className={`w-3.5 h-3.5 ${value?.id === a.id ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-bold font-mono ${value?.id === a.id ? 'text-primary' : 'text-foreground'}`}>{a.account_id}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                ${(a.account_size || 0).toLocaleString()} · {a.leverage || '1:100'} · {a.account_type} · {a.phase?.replace('phase', 'Phase ')}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: a.status === 'active' ? '#10b981' : '#f59e0b' }} />
                <span className="text-[10px] font-mono capitalize" style={{ color: a.status === 'active' ? '#10b981' : '#f59e0b' }}>{a.status}</span>
                <span className="text-muted-foreground/40 mx-1">·</span>
                <span className="text-[10px] font-mono text-muted-foreground">Balance: ${(a.balance || a.account_size || 0).toLocaleString()}</span>
              </div>
            </div>
            {value?.id === a.id && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-1" />}
          </button>
        ))}
      </div>
    </div>
  );
}

const COPIER_KEY = 'xcopier_state';

function loadCopierState() {
  try { return JSON.parse(localStorage.getItem(COPIER_KEY) || '{}'); } catch { return {}; }
}
function saveCopierState(state) {
  try { localStorage.setItem(COPIER_KEY, JSON.stringify(state)); } catch {}
}

export default function XCopier() {
  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
  });

  const activeAccounts = accounts.filter(a => a.status === 'active' || a.status === 'funded' || a.status === 'passed');

  const saved = loadCopierState();
  const [masterId,   setMasterId]  = useState(saved.masterId  || null);
  const [slaveId,    setSlaveId]   = useState(saved.slaveId   || null);
  const [riskMode,   setRiskMode]  = useState(saved.riskMode  || 'same_ratio');
  const [multiplier, setMultiplier]= useState(saved.multiplier|| '1.0');
  const [fixedLot,   setFixedLot]  = useState(saved.fixedLot  || '0.10');
  const [isRunning,  setIsRunning] = useState(saved.isRunning || false);
  const [log,        setLog]       = useState(saved.log?.slice(0, 30) || []);

  // Resolve accounts from IDs
  const master = activeAccounts.find(a => a.id === masterId) || null;
  const slave  = activeAccounts.find(a => a.id === slaveId)  || null;

  // Persist whenever state changes
  useEffect(() => {
    saveCopierState({ masterId, slaveId, riskMode, multiplier, fixedLot, isRunning, log: log.slice(0, 30) });
  }, [masterId, slaveId, riskMode, multiplier, fixedLot, isRunning, log]);

  const canStart = master && slave && master.id !== slave.id;

  const addLog = (msg, ok = true) => {
    setLog(prev => [{ msg, time: new Date().toLocaleTimeString(), ok }, ...prev.slice(0, 29)]);
  };

  const handleToggle = () => {
    if (!canStart) return;
    if (isRunning) {
      setIsRunning(false);
      addLog(`X-Copier stopped — Master: ${master.account_id} → Slave: ${slave.account_id}`, true);
    } else {
      setIsRunning(true);
      addLog(`X-Copier started — Master: ${master.account_id} → Slave: ${slave.account_id} | Mode: ${riskMode} | ${riskMode === 'balance_multiplier' ? `Multiplier: ${multiplier}x` : riskMode === 'fixed_lot' ? `Fixed: ${fixedLot} lots` : '1:1 Ratio'}`, true);
      addLog(`Monitoring master account for new orders...`, true);
    }
  };

  const handleSetMaster = (a) => setMasterId(a.id);
  const handleSetSlave  = (a) => setSlaveId(a.id);

  // Compute effective lot based on mode
  const exampleLot = riskMode === 'fixed_lot' ? parseFloat(fixedLot) || 0.1
    : riskMode === 'balance_multiplier'
      ? parseFloat((0.1 * parseFloat(multiplier || 1)).toFixed(2))
      : 0.1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Copy className="w-6 h-6 text-accent" />
            X-Copier
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
              style={{ background: 'rgba(204,255,0,0.1)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.25)' }}>
              BETA
            </span>
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Copy trades from one XTrading account to another with risk management</p>
        </div>
        <button onClick={handleToggle} disabled={!canStart}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isRunning ? 'hover:scale-105' : 'hover:scale-105'}`}
          style={isRunning
            ? { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }
            : { background: canStart ? 'linear-gradient(90deg,#CCFF00,#aadd00)' : 'rgba(255,255,255,0.06)', color: canStart ? '#0a0a0a' : 'hsl(var(--muted-foreground))', boxShadow: canStart ? '0 4px 16px rgba(204,255,0,0.25)' : 'none' }}>
          {isRunning ? <><Square className="w-4 h-4" /> Stop Copier</> : <><Play className="w-4 h-4" /> Start Copier</>}
        </button>
      </div>

      {/* Status bar */}
      {isRunning && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl mb-6"
          style={{ background: 'rgba(204,255,0,0.06)', border: '1px solid rgba(204,255,0,0.2)' }}>
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-mono font-bold text-accent">COPIER ACTIVE</span>
          <span className="text-xs font-mono text-muted-foreground">
            {master?.account_id} <ArrowRight className="w-3 h-3 inline" /> {slave?.account_id}
          </span>
          <span className="ml-auto text-xs font-mono text-muted-foreground">Mode: {RISK_MODES.find(r => r.id === riskMode)?.label}</span>
        </motion.div>
      )}

      {activeAccounts.length < 2 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <AlertTriangle className="w-10 h-10 text-yellow-400/60 mx-auto mb-4" />
          <div className="text-base font-black text-foreground mb-2">Need 2+ Active Accounts</div>
          <div className="text-sm text-muted-foreground">X-Copier requires at least two active XTrading accounts to copy between.</div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Account selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <AccountPicker label="Master Account (Source)" accounts={activeAccounts} value={master} onChange={handleSetMaster} exclude={slave?.id} />
              </div>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <AccountPicker label="Slave Account (Copy Target)" accounts={activeAccounts} value={slave} onChange={handleSetSlave} exclude={master?.id} />
              </div>
            </div>

            {/* Flow indicator */}
            {master && slave && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(204,255,0,0.04)', border: '1px solid rgba(204,255,0,0.15)' }}>
                <div className="text-center">
                  <div className="text-xs font-mono font-bold text-accent">{master.account_id}</div>
                  <div className="text-[10px] text-muted-foreground">MASTER</div>
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/60"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ delay: i * 0.2, repeat: Infinity, duration: 1.2 }} />
                  ))}
                  <ArrowRight className="w-4 h-4 text-accent mx-1" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono font-bold text-foreground">{slave.account_id}</div>
                  <div className="text-[10px] text-muted-foreground">SLAVE</div>
                </div>
              </motion.div>
            )}

            {/* Activity Log */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Activity Log</span>
                <span className="text-[10px] font-mono text-muted-foreground/40">{log.length} events</span>
              </div>
              <div className="overflow-y-auto" style={{ height: '160px', background: 'rgba(4,4,6,0.8)' }}>
                {log.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[11px] font-mono text-muted-foreground/30">
                    Configure accounts and start copier to see activity
                  </div>
                ) : log.map((l, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2 border-b border-white/[0.03] text-[10px] font-mono">
                    <span className="text-muted-foreground/40 flex-shrink-0 pt-0.5">{l.time}</span>
                    <span className={`flex-shrink-0 pt-0.5 ${l.ok ? 'text-emerald-400/60' : 'text-red-400/60'}`}>●</span>
                    <span className={l.ok ? 'text-muted-foreground' : 'text-red-400/80'}>{l.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Management Panel */}
          <div className="rounded-2xl p-5 h-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" /> Risk Management
            </div>

            {/* Risk Mode */}
            <div className="space-y-2 mb-5">
              {RISK_MODES.map(mode => (
                <button key={mode.id} onClick={() => setRiskMode(mode.id)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: riskMode === mode.id ? 'rgba(204,255,0,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${riskMode === mode.id ? 'rgba(204,255,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 mt-0.5 ${riskMode === mode.id ? 'border-accent bg-accent' : 'border-muted-foreground/30'}`} />
                  <div>
                    <div className={`text-xs font-bold ${riskMode === mode.id ? 'text-accent' : 'text-foreground'}`}>{mode.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{mode.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Mode-specific config */}
            <AnimatePresence mode="wait">
              {riskMode === 'balance_multiplier' && (
                <motion.div key="mult" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                  <div className="text-[10px] font-mono text-muted-foreground mb-1.5">Balance Multiplier</div>
                  <input value={multiplier} onChange={e => setMultiplier(e.target.value)}
                    placeholder="1.0"
                    className="w-full rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div className="text-[10px] font-mono text-muted-foreground/50 mt-1">
                    e.g. 0.5 = half the master's position size
                  </div>
                </motion.div>
              )}
              {riskMode === 'fixed_lot' && (
                <motion.div key="fixed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                  <div className="text-[10px] font-mono text-muted-foreground mb-1.5">Fixed Lot Size</div>
                  <input value={fixedLot} onChange={e => setFixedLot(e.target.value)}
                    placeholder="0.10"
                    className="w-full rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summary */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-2">Copy Summary</div>
              {[
                { label: 'Master', value: master?.account_id || '—' },
                { label: 'Slave', value: slave?.account_id || '—' },
                { label: 'Mode', value: RISK_MODES.find(r => r.id === riskMode)?.label || '—' },
                { label: 'Example Lot', value: master && slave ? `${exampleLot} lots` : '—' },
                { label: 'Status', value: isRunning ? '● Running' : '○ Stopped' },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-[10px] font-mono">
                  <span className="text-muted-foreground/70">{s.label}</span>
                  <span className={s.label === 'Status' ? (isRunning ? 'text-accent' : 'text-muted-foreground') : 'text-foreground'}>{s.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-400/80 leading-relaxed">
                  X-Copier mirrors trades between your own XTrading accounts. Both accounts must remain within challenge drawdown limits.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}