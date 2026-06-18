/**
 * CopyTradingPanel — Intra-user MT5 Copy Trading UI
 *
 * REMOVAL: To remove this feature, delete this file and remove
 * the 'copy-trading' case from Dashboard.jsx renderPage() and
 * the sidebar entry. Nothing else is affected.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Plus, Trash2, Play, Pause, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Zap, ChevronDown, Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function AccountSelector({ accounts, value, onChange, exclude, label }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5 block">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none appearance-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <option value="">Select account...</option>
        {accounts.filter(a => a.account_id !== exclude && a.mt_login).map(a => (
          <option key={a.id} value={a.account_id}>
            {a.account_id} · {a.challenge_type === 'two-step' ? '2-Step' : 'Instant'} · ${(a.account_size || 0).toLocaleString()} [{a.status}]
          </option>
        ))}
      </select>
    </div>
  );
}

function RuleCard({ rule, accounts, onToggle, onDelete, isProcessing }) {
  const masterAcc = accounts.find(a => a.account_id === rule.master_account_id);
  const slaveAcc  = accounts.find(a => a.account_id === rule.slave_account_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: '#0f1117',
        border: `1px solid ${rule.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}`,
        borderLeft: `3px solid ${rule.is_active ? '#10b981' : '#6b7280'}`,
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: rule.is_active ? '#10b981' : '#6b7280' }} />
            <span className="text-sm font-bold text-white">Copy Rule</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                background: rule.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                color: rule.is_active ? '#10b981' : '#9ca3af',
                border: `1px solid ${rule.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(107,114,128,0.2)'}`,
              }}>
              {rule.is_active ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggle(rule.id)}
              disabled={isProcessing}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              title={rule.is_active ? 'Pause' : 'Resume'}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                : rule.is_active ? <Pause className="w-4 h-4 text-yellow-400" />
                : <Play className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={() => onDelete(rule.id)}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
              title="Delete rule"
            >
              <Trash2 className="w-4 h-4 text-red-400/50 hover:text-red-400" />
            </button>
          </div>
        </div>

        {/* Master → Slave flow */}
        <div className="flex items-center gap-2 text-xs mb-3">
          <div className="flex-1 rounded-lg px-3 py-2"
            style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}>
            <div className="text-[9px] text-white/30 uppercase tracking-wide mb-0.5">MASTER</div>
            <div className="font-bold text-white font-mono text-[11px]">{rule.master_account_id}</div>
            <div className="text-white/40 text-[10px]">{masterAcc ? `$${(masterAcc.account_size||0).toLocaleString()}` : '—'}</div>
          </div>
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <span className="text-white/20 text-sm">→</span>
            <span className="text-[9px] font-bold text-primary">{rule.lot_multiplier}×</span>
          </div>
          <div className="flex-1 rounded-lg px-3 py-2"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div className="text-[9px] text-white/30 uppercase tracking-wide mb-0.5">SLAVE</div>
            <div className="font-bold text-white font-mono text-[11px]">{rule.slave_account_id}</div>
            <div className="text-white/40 text-[10px]">{slaveAcc ? `$${(slaveAcc.account_size||0).toLocaleString()}` : '—'}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[10px] text-white/30">
          <span>SL/TP: <span className="text-white/50">{rule.copy_sl_tp ? 'Copied' : 'Skipped'}</span></span>
          <span>Trades copied: <span className="text-white/50">{rule.total_trades_copied || 0}</span></span>
          {rule.last_synced_at && (
            <span>Last sync: <span className="text-white/50">{new Date(rule.last_synced_at).toLocaleTimeString()}</span></span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CopyTradingPanel({ user }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [masterAccountId, setMasterAccountId] = useState('');
  const [slaveAccountId, setSlaveAccountId]   = useState('');
  const [lotMultiplier, setLotMultiplier]      = useState('1.0');
  const [copySLTP, setCopySLTP]               = useState(true);
  const [syncLog, setSyncLog]                 = useState([]);
  const [isSyncing, setIsSyncing]             = useState(false);
  const [brokerError, setBrokerError]         = useState(null);
  const syncIntervalRef = useRef(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts', user?.email],
    queryFn: () => base44.entities.ChallengeAccount.filter({ user_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['copy-trading-rules', user?.email],
    queryFn: () => base44.entities.CopyTradingRule.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  const activeAccounts = accounts.filter(a => ['active', 'funded', 'passed'].includes(a.status) && a.mt_login);

  // Auto-sync active rules every 5s
  useEffect(() => {
    const hasActiveRules = rules.some(r => r.is_active);
    if (!hasActiveRules) { clearInterval(syncIntervalRef.current); return; }

    const runSync = async () => {
      if (isSyncing) return;
      setIsSyncing(true);
      try {
        const res = await base44.functions.invoke('mt5CopySync', { action: 'sync' });
        const data = res?.data;
        // Broker doesn't support execution — stop polling immediately
        if (data?.execution_supported === false) {
          setBrokerError(data.message);
          clearInterval(syncIntervalRef.current);
          setIsSyncing(false);
          return;
        }
        if (data?.actions_taken?.length > 0) {
          setSyncLog(prev => [...data.actions_taken.map(a => ({
            ...a,
            timestamp: new Date().toLocaleTimeString(),
          })), ...prev].slice(0, 50));
          qc.invalidateQueries({ queryKey: ['copy-trading-rules', user?.email] });
        }
      } catch (e) {
        console.warn('[CopySync] Error:', e.message);
      } finally {
        setIsSyncing(false);
      }
    };

    runSync();
    syncIntervalRef.current = setInterval(runSync, 5000);
    return () => clearInterval(syncIntervalRef.current);
  }, [rules.map(r => `${r.id}:${r.is_active}`).join(',')]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!masterAccountId || !slaveAccountId) throw new Error('Select both accounts');
      if (masterAccountId === slaveAccountId) throw new Error('Master and slave must be different accounts');
      const masterAcc = accounts.find(a => a.account_id === masterAccountId);
      const slaveAcc  = accounts.find(a => a.account_id === slaveAccountId);
      if (!masterAcc?.mt_login || !slaveAcc?.mt_login) throw new Error('Selected accounts have no MT5 login');
      return base44.entities.CopyTradingRule.create({
        user_email: user.email,
        master_account_id: masterAccountId,
        master_mt_login: masterAcc.mt_login,
        slave_account_id: slaveAccountId,
        slave_mt_login: slaveAcc.mt_login,
        lot_multiplier: parseFloat(lotMultiplier) || 1.0,
        copy_sl_tp: copySLTP,
        is_active: true,
        total_trades_copied: 0,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['copy-trading-rules', user?.email] });
      setShowCreate(false);
      setMasterAccountId(''); setSlaveAccountId('');
      toast.success('Copy rule created — syncing every 5s');
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (ruleId) => base44.functions.invoke('mt5CopySync', { action: 'toggle_rule', rule_id: ruleId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copy-trading-rules', user?.email] }),
    onError: (e) => toast.error('Toggle failed: ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId) => base44.entities.CopyTradingRule.delete(ruleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['copy-trading-rules', user?.email] }); toast.success('Rule deleted'); },
    onError: (e) => toast.error('Delete failed: ' + e.message),
  });

  const handleTestRun = async () => {
    setIsSyncing(true);
    try {
      const res = await base44.functions.invoke('mt5CopySync', { action: 'test' });
      const data = res?.data;
      toast.success(`Test run complete — ${data?.actions_taken?.length || 0} actions would be taken`);
      if (data?.actions_taken?.length > 0) {
        setSyncLog(prev => [...data.actions_taken.map(a => ({
          ...a,
          dry_run: true,
          timestamp: new Date().toLocaleTimeString(),
        })), ...prev].slice(0, 50));
      }
    } catch (e) {
      toast.error('Test failed: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <Copy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Copy Trading</h1>
            <p className="text-xs text-white/35 font-mono">Mirror trades between your MT5 accounts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rules.some(r => r.is_active) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isSyncing ? 'Syncing...' : 'Live'}
            </div>
          )}
          <button onClick={handleTestRun} disabled={isSyncing || rules.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Test Run
          </button>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
            <Plus className="w-3.5 h-3.5" /> New Rule
          </button>
        </div>
      </div>

      {/* Broker capability error */}
      {brokerError && (
        <div className="rounded-xl px-4 py-4 flex items-start gap-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-red-400 mb-1">Broker API Does Not Support Trade Execution</div>
            <p className="text-xs text-white/50 leading-relaxed">
              The Tritech API bridge connected to this platform does not expose trade execution endpoints (<code className="text-red-300/70">/api/v1/deal/open</code> returns 404). Copy trading requires the <strong className="text-white/70">Manager API</strong> order placement to be enabled by your broker.
            </p>
            <p className="text-xs text-white/40 mt-2">
              ✉️ Contact <strong className="text-white/60">Tritech support</strong> and request enabling deal/order execution on your Manager API bridge. Once enabled, copy trading will work automatically.
            </p>
          </div>
        </div>
      )}

      {/* Warning banner */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-white/50 leading-relaxed">
          Copy trading mirrors your master account trades to slave accounts in real-time. Both accounts must follow their own challenge rules. Copying trades that breach slave account rules will still count as violations.
        </p>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl p-5 space-y-4"
            style={{ background: '#0f1117', border: '1px solid rgba(255,92,0,0.2)' }}>
            <div className="text-sm font-bold text-white mb-1">Create Copy Rule</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AccountSelector accounts={activeAccounts} value={masterAccountId} onChange={setMasterAccountId}
                exclude={slaveAccountId} label="Master Account (Source)" />
              <AccountSelector accounts={activeAccounts} value={slaveAccountId} onChange={setSlaveAccountId}
                exclude={masterAccountId} label="Slave Account (Target)" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5 block">
                  Lot Multiplier (e.g. 1.0 = same, 0.5 = half)
                </label>
                <input type="number" step="0.1" min="0.01" max="10" value={lotMultiplier}
                  onChange={e => setLotMultiplier(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={copySLTP} onChange={e => setCopySLTP(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary" />
                  <span className="text-xs text-white/60">Copy SL/TP</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                style={{ background: '#FF5C00' }}>
                {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Rule
              </button>
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white/40 hover:text-white/60 transition-colors">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules List */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
      ) : rules.length === 0 ? (
        <div className="py-12 text-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <Copy className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <div className="text-sm font-semibold text-white/30 mb-1">No Copy Rules Yet</div>
          <div className="text-xs text-white/20">Create a rule to start mirroring trades between your accounts</div>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <RuleCard key={rule.id} rule={rule} accounts={accounts}
              onToggle={id => toggleMutation.mutate(id)}
              onDelete={id => { if (window.confirm('Delete this copy rule?')) deleteMutation.mutate(id); }}
              isProcessing={toggleMutation.isPending || deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Sync Activity Log */}
      {syncLog.length > 0 && (
        <div className="rounded-xl overflow-hidden"
          style={{ background: '#0a0c12', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-xs font-bold text-white/50 uppercase tracking-wide">Sync Activity Log</span>
            <button onClick={() => setSyncLog([])} className="text-[10px] text-white/20 hover:text-white/40">Clear</button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {syncLog.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2 border-b text-xs"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {entry.ok === false
                  ? <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  : entry.dry_run
                  ? <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                  : <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                <span className="font-mono text-white/25 flex-shrink-0">{entry.timestamp}</span>
                <span className={`font-bold flex-shrink-0 ${entry.action === 'OPEN' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {entry.dry_run ? '[DRY] ' : ''}{entry.action}
                </span>
                <span className="text-white/50">{entry.symbol} {entry.type}</span>
                <span className="text-white/30 ml-auto font-mono">{entry.slave_lots || entry.master_lots} lots</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}