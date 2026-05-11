import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Copy, CheckCircle2, AlertTriangle, Play, Square, Settings, ArrowRight, RefreshCw, Wifi, WifiOff, Signal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calcRequiredMargin, INSTRUMENTS } from '../terminal/terminalConfig';

const RISK_MODES = [
  { id: 'balance_multiplier', label: 'Balance Multiplier', desc: 'Scale lots based on account balance ratio' },
  { id: 'fixed_lot',          label: 'Fixed Lot',          desc: 'Use a fixed lot size for all copied trades' },
  { id: 'lot_multiplier',     label: 'Lot Multiplier',     desc: 'Multiply master lot by a fixed factor' },
  { id: 'same_ratio',         label: 'Same Ratio (1:1)',   desc: 'Copy exact lot size from master account' },
];

const STATUS_LABELS = {
  idle:     { label: 'Idle', color: 'text-muted-foreground',  dot: 'bg-muted-foreground/40' },
  waiting:  { label: 'Waiting for Signal', color: 'text-blue-400', dot: 'bg-blue-400' },
  copied:   { label: 'Trade Copied!', color: 'text-accent',   dot: 'bg-accent' },
  syncing:  { label: 'Syncing…', color: 'text-yellow-400',    dot: 'bg-yellow-400' },
  error:    { label: 'Connection Lost', color: 'text-red-400', dot: 'bg-red-400' },
};

const COPIER_KEY = 'xcopier_state_v2';
function loadState() { try { return JSON.parse(localStorage.getItem(COPIER_KEY) || '{}'); } catch { return {}; } }
function saveState(s) { try { localStorage.setItem(COPIER_KEY, JSON.stringify(s)); } catch {} }

function AccountCard({ label, account, onSelect, isSelected, disabled }) {
  return (
    <div>
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">{label}</div>
      {account ? (
        <div className="rounded-xl p-4 border"
          style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold font-mono text-primary">{account.account_id}</span>
            <button onClick={() => onSelect(null)} className="text-[10px] text-muted-foreground/50 hover:text-red-400">✕ Clear</button>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            ${(account.account_size || 0).toLocaleString()} · {account.leverage} · {account.phase?.replace('phase', 'Phase ')}
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400">{account.status}</span>
          </div>
        </div>
      ) : (
        <div className="text-[10px] font-mono text-muted-foreground/40 italic">No account selected</div>
      )}
    </div>
  );
}

export default function XCopier() {
  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    refetchInterval: 15000,
  });

  const activeAccounts = accounts.filter(a => ['active', 'funded', 'passed'].includes(a.status));

  const saved = loadState();
  const [masterId,   setMasterId]   = useState(saved.masterId   || null);
  const [slaveId,    setSlaveId]    = useState(saved.slaveId    || null);
  const [riskMode,   setRiskMode]   = useState(saved.riskMode   || 'same_ratio');
  const [multiplier, setMultiplier] = useState(saved.multiplier || '1.0');
  const [fixedLot,   setFixedLot]   = useState(saved.fixedLot   || '0.10');
  const [isRunning,  setIsRunning]  = useState(saved.isRunning  || false);
  const [log,        setLog]        = useState(saved.log?.slice(0, 50) || []);
  const [copyCount,  setCopyCount]  = useState(0);
  const [selectingFor, setSelectingFor] = useState(null); // 'master' | 'slave'
  const [copySL, setCopySL]           = useState(saved.copySL !== undefined ? saved.copySL : true);
  const [copyTP, setCopyTP]           = useState(saved.copyTP !== undefined ? saved.copyTP : true);
  const [copyPending, setCopyPending] = useState(saved.copyPending !== undefined ? saved.copyPending : false);
  const [liveStatus, setLiveStatus]   = useState('idle');

  const master = activeAccounts.find(a => a.id === masterId) || null;
  const slave  = activeAccounts.find(a => a.id === slaveId)  || null;

  // Track which trade IDs we've already copied to avoid duplicates
  const copiedTradeIds = useRef(new Set(saved.copiedIds || []));
  const subscriptionRef = useRef(null);
  const masterToSlaveMapRef = useRef({});

  const addLog = useCallback((msg, ok = true) => {
    setLog(prev => {
      const updated = [{ msg, time: new Date().toLocaleTimeString(), ok }, ...prev.slice(0, 49)];
      return updated;
    });
  }, []);

  // Persist state
  useEffect(() => {
    saveState({
      masterId, slaveId, riskMode, multiplier, fixedLot, isRunning, copySL, copyTP, copyPending,
      log: log.slice(0, 50),
      copiedIds: [...copiedTradeIds.current].slice(0, 500),
    });
  }, [masterId, slaveId, riskMode, multiplier, fixedLot, isRunning, copySL, copyTP, copyPending, log]);

  // Calculate effective lots
  const calcEffectiveLots = (masterLots) => {
    if (riskMode === 'fixed_lot') return parseFloat(fixedLot) || 0.1;
    if (riskMode === 'lot_multiplier') return parseFloat((masterLots * parseFloat(multiplier || 1)).toFixed(2));
    if (riskMode === 'balance_multiplier') {
      const masterBal = master?.balance || master?.account_size || 1;
      const slaveBal  = slave?.balance  || slave?.account_size  || 1;
      const ratio = slaveBal / masterBal;
      return parseFloat((masterLots * ratio).toFixed(2));
    }
    return masterLots; // same_ratio
  };

  // ── Real-time trade subscription ─────────────────────────────────────────
  useEffect(() => {
    if (!isRunning || !master || !slave) {
      subscriptionRef.current?.();
      subscriptionRef.current = null;
      return;
    }

    addLog(`X-Copier active: ${master.account_id} → ${slave.account_id}`);

    const unsubscribe = base44.entities.TradeRecord.subscribe(async (event) => {
      if (!event.data) return;
      const trade = event.data;
      const isMasterAccount = trade.account_id === master.id || trade.account_id === master.account_id;

      // ── CLOSE mirroring: when master trade is closed, close the slave copy ──
      if (event.type === 'update' && isMasterAccount && trade.status === 'closed') {
        const slaveCopyId = masterToSlaveMapRef.current[trade.id];
        if (slaveCopyId) {
          try {
            await base44.entities.TradeRecord.update(slaveCopyId, {
              status: 'closed',
              close: trade.close,
              pnl: trade.pnl || 0,
              close_reason: trade.close_reason || 'Master Closed',
              close_time: new Date().toLocaleTimeString(),
            });
            addLog(`⟵ CLOSED slave copy for ${trade.symbol} (reason: ${trade.close_reason || 'Master Closed'})`, true);
            delete masterToSlaveMapRef.current[trade.id];
          } catch (err) {
            addLog(`✗ Close-mirror failed: ${err.message}`, false);
          }
        }
        return;
      }

      // ── OPEN mirroring: new trade on master ──────────────────────────────
      if (event.type !== 'create') return;
      if (!isMasterAccount) return;
      if (trade.status !== 'open' && trade.status !== 'pending') return;
      if (trade.status === 'pending' && !copyPending) return;
      if (copiedTradeIds.current.has(trade.id)) return;
      setLiveStatus('syncing');

      copiedTradeIds.current.add(trade.id);

      const effectiveLots = calcEffectiveLots(trade.lots || 0.1);
      const lev = parseInt((slave.leverage || '1:100').replace('1:', '')) || 100;
      const margin = calcRequiredMargin(trade.symbol, effectiveLots, lev, trade.entry || 1);

      try {
        const user = await base44.auth.me().catch(() => null);
        const created = await base44.entities.TradeRecord.create({
          account_id: slave.id || slave.account_id,
          user_email: user?.email || '',
          trade_id: `COPY-${Date.now()}`,
          symbol: trade.symbol,
          type: trade.type,
          order_type: trade.status === 'pending' ? (trade.order_type || 'MARKET') : 'MARKET',
          lots: effectiveLots,
          entry: trade.entry,
          sl: copySL ? (trade.sl || null) : null,
          tp: copyTP ? (trade.tp || null) : null,
          margin,
          status: trade.status === 'pending' ? 'pending' : 'open',
          open_time: new Date().toLocaleTimeString(),
        });

        // Map master trade ID → slave record ID for close mirroring
        if (created?.id) masterToSlaveMapRef.current[trade.id] = created.id;

        setCopyCount(c => c + 1);
        setLiveStatus('copied');
        setTimeout(() => setLiveStatus(isRunning ? 'waiting' : 'idle'), 3000);
        addLog(`✓ COPIED: ${trade.type} ${effectiveLots}L ${trade.symbol} → ${slave.account_id}${copySL && trade.sl ? ` SL:${trade.sl}` : ''}${copyTP && trade.tp ? ` TP:${trade.tp}` : ''}`, true);
      } catch (err) {
        setLiveStatus('error');
        setTimeout(() => setLiveStatus('waiting'), 5000);
        addLog(`✗ Copy failed for ${trade.symbol}: ${err.message}`, false);
      }
    });

    subscriptionRef.current = unsubscribe;
    return () => { unsubscribe?.(); };
  }, [isRunning, master?.id, slave?.id, riskMode, multiplier, fixedLot]);

  const canStart = master && slave && master.id !== slave.id;

  const handleToggle = () => {
    if (!canStart) return;
    if (isRunning) {
      setIsRunning(false);
      setLiveStatus('idle');
      subscriptionRef.current?.();
      subscriptionRef.current = null;
      addLog(`X-Copier stopped`, true);
    } else {
      setIsRunning(true);
      setLiveStatus('waiting');
      addLog(`Starting X-Copier: ${master.account_id} → ${slave.account_id} | Mode: ${riskMode} | SL:${copySL} TP:${copyTP} Pending:${copyPending}`, true);
    }
  };

  const statusInfo = STATUS_LABELS[liveStatus] || STATUS_LABELS.idle;

  const exampleLot = calcEffectiveLots(0.10);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Copy className="w-6 h-6 text-accent" /> X-Copier
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
              style={{ background: 'rgba(204,255,0,0.1)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.25)' }}>
              LIVE
            </span>
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Real-time trade mirroring between XTrading accounts via DB subscription
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isRunning && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-accent px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {copyCount} trades copied
            </div>
          )}
          <button onClick={handleToggle} disabled={!canStart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
            style={isRunning
              ? { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }
              : { background: canStart ? 'linear-gradient(90deg,#CCFF00,#aadd00)' : 'rgba(255,255,255,0.06)', color: canStart ? '#0a0a0a' : 'hsl(var(--muted-foreground))' }}>
            {isRunning ? <><Square className="w-4 h-4" /> Stop Copier</> : <><Play className="w-4 h-4" /> Start Copier</>}
          </button>
        </div>
      </div>

      {/* Live Status Bar */}
      <AnimatePresence>
        {isRunning && master && slave && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl mb-6 flex-wrap"
            style={{ background: 'rgba(204,255,0,0.05)', border: '1px solid rgba(204,255,0,0.18)' }}>
            <div className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse flex-shrink-0`} />
            <span className={`text-xs font-mono font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
            <span className="text-xs font-mono text-muted-foreground">
              {master.account_id} <ArrowRight className="w-3 h-3 inline" /> {slave.account_id}
            </span>
            <div className="ml-auto flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
              {copySL && <span className="text-emerald-400/60">SL✓</span>}
              {copyTP && <span className="text-emerald-400/60">TP✓</span>}
              {copyPending && <span className="text-blue-400/60">Pending✓</span>}
              <span>{RISK_MODES.find(r => r.id === riskMode)?.label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeAccounts.length < 2 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <AlertTriangle className="w-10 h-10 text-yellow-400/60 mx-auto mb-4" />
          <div className="text-base font-black text-foreground mb-2">Need 2+ Active Accounts</div>
          <div className="text-sm text-muted-foreground">X-Copier requires at least two active XTrading accounts.</div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Account Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <AccountCard label="Master (Source)" account={master} isSelected={!!master}
                  onSelect={() => setMasterId(null)} />
                {!master && (
                  <div className="mt-3 space-y-1.5">
                    {activeAccounts.filter(a => a.id !== slaveId).map(a => (
                      <button key={a.id} onClick={() => setMasterId(a.id)}
                        className="w-full text-left p-2.5 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground transition"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span className="font-bold text-foreground">{a.account_id}</span> · ${(a.account_size || 0).toLocaleString()} · {a.phase?.replace('phase', 'Ph ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <AccountCard label="Slave (Copy Target)" account={slave} isSelected={!!slave}
                  onSelect={() => setSlaveId(null)} />
                {!slave && (
                  <div className="mt-3 space-y-1.5">
                    {activeAccounts.filter(a => a.id !== masterId).map(a => (
                      <button key={a.id} onClick={() => setSlaveId(a.id)}
                        className="w-full text-left p-2.5 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground transition"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span className="font-bold text-foreground">{a.account_id}</span> · ${(a.account_size || 0).toLocaleString()} · {a.phase?.replace('phase', 'Ph ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Flow Arrow */}
            {master && slave && (
              <div className="flex items-center justify-center gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(204,255,0,0.04)', border: '1px solid rgba(204,255,0,0.15)' }}>
                <div className="text-center">
                  <div className="text-xs font-mono font-bold text-accent">{master.account_id}</div>
                  <div className="text-[9px] text-muted-foreground">MASTER · ${(master.account_size||0).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/60"
                      animate={{ opacity: isRunning ? [0.3, 1, 0.3] : 0.2 }}
                      transition={{ delay: i * 0.2, repeat: Infinity, duration: 1.2 }} />
                  ))}
                  <ArrowRight className="w-4 h-4 text-accent mx-1" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono font-bold text-foreground">{slave.account_id}</div>
                  <div className="text-[9px] text-muted-foreground">SLAVE · ${(slave.account_size||0).toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Activity Log */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Activity Log</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground/40">{log.length} events</span>
                  <button onClick={() => setLog([])} className="text-[9px] font-mono text-muted-foreground/40 hover:text-muted-foreground">Clear</button>
                </div>
              </div>
              <div className="overflow-y-auto" style={{ height: '200px', background: 'rgba(4,4,6,0.8)' }}>
                {log.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[11px] font-mono text-muted-foreground/30">
                    Start copier to see live activity
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

          {/* Risk Panel */}
          <div className="rounded-2xl p-5 h-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" /> Risk Management
            </div>
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

            <AnimatePresence mode="wait">
              {(riskMode === 'balance_multiplier' || riskMode === 'lot_multiplier') && (
                <motion.div key="mult" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                  <div className="text-[10px] font-mono text-muted-foreground mb-1.5">
                    {riskMode === 'lot_multiplier' ? 'Lot Multiplier (×master lot)' : 'Balance Scale Factor'}
                  </div>
                  <input value={multiplier} onChange={e => setMultiplier(e.target.value)} type="number" step="0.1" min="0.1"
                    className="w-full rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div className="text-[10px] font-mono text-muted-foreground/50 mt-1">
                    {riskMode === 'lot_multiplier' ? `e.g. 2.0 = double the master lots` : `e.g. 0.5 = 50% of balance ratio`}
                  </div>
                </motion.div>
              )}
              {riskMode === 'fixed_lot' && (
                <motion.div key="fixed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                  <div className="text-[10px] font-mono text-muted-foreground mb-1.5">Fixed Lot Size</div>
                  <input value={fixedLot} onChange={e => setFixedLot(e.target.value)} type="number" step="0.01" min="0.01"
                    className="w-full rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Copy Options */}
            <div className="mb-4 space-y-2">
              <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-2">Copy Settings</div>
              {[
                { key: 'copySL', label: 'Copy Stop Loss', value: copySL, set: setCopySL },
                { key: 'copyTP', label: 'Copy Take Profit', value: copyTP, set: setCopyTP },
                { key: 'copyPending', label: 'Copy Pending Orders', value: copyPending, set: setCopyPending },
              ].map(({ key, label, value, set }) => (
                <div key={key} className="flex items-center justify-between p-2.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <button onClick={() => set(!value)}
                    className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${value ? 'bg-accent/70' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-4.5' : 'left-0.5'}`} style={{ left: value ? '17px' : '2px' }} />
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-2">Summary</div>
              {[
                { label: 'Master', value: master?.account_id || '—' },
                { label: 'Slave', value: slave?.account_id || '—' },
                { label: 'Mode', value: RISK_MODES.find(r => r.id === riskMode)?.label || '—' },
                { label: 'Example (0.1 lot)', value: `${exampleLot} lots` },
                { label: 'Trades Copied', value: copyCount.toString() },
                { label: 'Status', value: isRunning ? '● Live' : '○ Stopped' },
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
                  X-Copier uses real-time DB subscription. Trades are copied instantly when detected on master account. Both accounts must stay within challenge rules.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}