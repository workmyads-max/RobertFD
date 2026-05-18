import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Server, Wifi, Zap, RefreshCw, CheckCircle2,
  AlertTriangle, Users, BarChart3, Clock, Key, Play, XCircle
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const MT_BASE = 'https://broker-api-demo.match-trader.com';

function StatusDot({ ok }) {
  return (
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ok ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
  );
}

function MetricCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {sub && <div className="text-[10px] font-mono text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminMatchTrader() {
  const [provisionForm, setProvisionForm] = useState({
    order_id: '', account_id: '', user_email: '', challenge_type: 'two-step',
    account_type: 'standard', account_size: 100000, leverage: '1:100', platform: 'match_trader',
  });
  const [provisionResult, setProvisionResult] = useState(null);
  const [syncLogin, setSyncLogin] = useState('');
  const [syncAccountId, setSyncAccountId] = useState('');
  const [syncResult, setSyncResult] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const { data: mtAccounts = [] } = useQuery({
    queryKey: ['mt-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.filter({ platform: 'match_trader' }),
    refetchInterval: 30000,
  });

  const { data: pendingOrders = [] } = useQuery({
    queryKey: ['pending-mt-orders'],
    queryFn: () => base44.entities.Order.filter({ payment_status: 'confirmed' }),
  });

  const checkApiStatus = async () => {
    setChecking(true);
    const t0 = Date.now();
    const result = await base44.functions.invoke('provisionMatchTraderAccount', {
      order_id: 'TEST', account_id: 'TEST', user_email: 'test@test.com',
      challenge_type: 'two-step', account_type: 'standard',
      account_size: 1000, leverage: '1:100', platform: 'other',
    }).catch(e => ({ error: e.message }));
    const latency = Date.now() - t0;
    setApiStatus({ ok: !result?.error || result?.skip, latency, checked: true });
    setChecking(false);
  };

  const provisionMutation = useMutation({
    mutationFn: () => base44.functions.invoke('provisionMatchTraderAccount', provisionForm),
    onSuccess: (res) => setProvisionResult(res.data),
  });

  const syncMutation = useMutation({
    mutationFn: () => base44.functions.invoke('syncMatchTraderAccount', {
      account_id: syncAccountId, mt_login: syncLogin,
    }),
    onSuccess: (res) => setSyncResult(res.data),
  });

  const activeCount = mtAccounts.filter(a => a.status === 'active').length;
  const fundedCount = mtAccounts.filter(a => a.status === 'funded').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            Match Trader Integration
          </h1>
          <p className="text-sm text-white/30 font-mono mt-1">Real-time broker API management and account provisioning</p>
        </div>
        <button
          onClick={checkApiStatus}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          {checking ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
          Check API Status
        </button>
      </div>

      {/* API Status Banner */}
      <AnimatePresence>
        {apiStatus && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: apiStatus.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${apiStatus.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}
          >
            <StatusDot ok={apiStatus.ok} />
            <span className="text-sm font-semibold" style={{ color: apiStatus.ok ? '#10b981' : '#ef4444' }}>
              {apiStatus.ok ? 'Match Trader API is reachable' : 'API connection issue'}
            </span>
            <span className="text-xs font-mono text-white/30 ml-2">Latency: {apiStatus.latency}ms</span>
            <span className="ml-auto text-[10px] font-mono text-white/25">
              Base: {MT_BASE}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="MT Accounts" value={mtAccounts.length} icon={Users} color="#FF5C00" sub="Total provisioned" />
        <MetricCard label="Active" value={activeCount} icon={Activity} color="#10b981" sub="Trading now" />
        <MetricCard label="Funded" value={fundedCount} icon={Zap} color="#CCFF00" sub="Earning payouts" />
        <MetricCard label="Pending Orders" value={pendingOrders.length} icon={Clock} color="#f59e0b" sub="Awaiting provisioning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Provision Account */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <Key className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black text-white">Provision MT Account</h3>
          </div>
          <p className="text-xs text-white/30 font-mono">Manually create a Match Trader account for a confirmed order.</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'order_id', label: 'Order ID', placeholder: 'RF-...' },
              { key: 'account_id', label: 'Account ID', placeholder: 'FF-...' },
              { key: 'user_email', label: 'User Email', placeholder: 'trader@email.com' },
              { key: 'account_size', label: 'Account Size', type: 'number', placeholder: '100000' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-mono text-white/30 mb-1 block uppercase">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  value={provisionForm[f.key]}
                  onChange={e => setProvisionForm(p => ({ ...p, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg px-3 py-2 text-xs text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-mono text-white/30 mb-1 block uppercase">Challenge Type</label>
              <select value={provisionForm.challenge_type} onChange={e => setProvisionForm(p => ({ ...p, challenge_type: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-xs text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="two-step" className="bg-[#0e0e10]">Two-Step</option>
                <option value="instant" className="bg-[#0e0e10]">Instant</option>
                <option value="instant_light" className="bg-[#0e0e10]">Instant Light</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/30 mb-1 block uppercase">Leverage</label>
              <select value={provisionForm.leverage} onChange={e => setProvisionForm(p => ({ ...p, leverage: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-xs text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {['1:30', '1:50', '1:100', '1:200'].map(l => <option key={l} value={l} className="bg-[#0e0e10]">{l}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={() => provisionMutation.mutate()}
            disabled={provisionMutation.isPending || !provisionForm.user_email || !provisionForm.account_id}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)' }}
          >
            {provisionMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {provisionMutation.isPending ? 'Provisioning...' : 'Provision Account'}
          </button>

          {provisionResult && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 space-y-2"
              style={{ background: provisionResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${provisionResult.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
              {provisionResult.success ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Account Provisioned
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50">
                    <div>Login: <span className="text-white">{provisionResult.mt_login}</span></div>
                    <div>Password: <span className="text-white">{provisionResult.mt_password}</span></div>
                    <div>Server: <span className="text-white">{provisionResult.mt_server}</span></div>
                    <div>Group: <span className="text-white">{provisionResult.mt_group}</span></div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <XCircle className="w-4 h-4" /> {provisionResult.error}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Sync Account */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black text-white">Sync MT Account Data</h3>
          </div>
          <p className="text-xs text-white/30 font-mono">Pull live balance, equity, and trades from Match Trader into CRM.</p>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-white/30 mb-1 block uppercase">MT Login ID</label>
              <input value={syncLogin} onChange={e => setSyncLogin(e.target.value)} placeholder="123456"
                className="w-full rounded-lg px-3 py-2 text-xs text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/30 mb-1 block uppercase">CRM Account ID</label>
              <input value={syncAccountId} onChange={e => setSyncAccountId(e.target.value)} placeholder="FF-..."
                className="w-full rounded-lg px-3 py-2 text-xs text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>

          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !syncLogin || !syncAccountId}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'rgba(255,92,0,0.2)', border: '1px solid rgba(255,92,0,0.4)' }}
          >
            {syncMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
          </button>

          {syncResult && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 space-y-2"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-2">
                <CheckCircle2 className="w-4 h-4" /> Sync Complete
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50">
                <div>Balance: <span className="text-white">${syncResult.balance?.toFixed(2)}</span></div>
                <div>Equity: <span className="text-white">${syncResult.equity?.toFixed(2)}</span></div>
                <div>Float P&L: <span className={syncResult.floatPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>${syncResult.floatPnl?.toFixed(2)}</span></div>
                <div>Open Positions: <span className="text-white">{syncResult.openPositions}</span></div>
                <div>Closed Trades: <span className="text-white">{syncResult.closedTrades}</span></div>
                <div>Win Rate: <span className="text-white">{syncResult.winRate}%</span></div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* MT Accounts Table */}
      {mtAccounts.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Match Trader Accounts ({mtAccounts.length})</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {mtAccounts.slice(0, 20).map(a => (
              <div key={a.id} className="grid grid-cols-5 gap-3 px-5 py-3 hover:bg-white/[0.02] items-center transition-colors">
                <div className="col-span-2 min-w-0">
                  <div className="text-xs font-mono font-bold text-white">{a.account_id}</div>
                  <div className="text-[10px] text-white/30 truncate">{a.user_email}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-white/40">Balance</div>
                  <div className="text-xs font-bold text-white">${(a.balance || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-white/40">Credentials</div>
                  <div className="text-[10px] font-mono text-white/60 truncate">{a.mt_login || a.login_credentials?.split('|')[0]?.replace('Login:', '')?.trim() || '—'}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full"
                    style={{ background: a.status === 'active' ? '#10b981' : a.status === 'funded' ? '#FF5C00' : '#ef4444' }} />
                  <span className="text-[10px] font-mono capitalize"
                    style={{ color: a.status === 'active' ? '#10b981' : a.status === 'funded' ? '#FF5C00' : '#9ca3af' }}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}