import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, Activity, Globe, FileText,
  Search, Eye, RefreshCw, Zap, Bot, GitBranch, TrendingUp,
  Users, Lock, StickyNote, CheckCircle2, Flag, X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'hft', label: 'HFT Detection', icon: Zap },
  { id: 'bot', label: 'EA/Bot', icon: Bot },
  { id: 'arbitrage', label: 'Arbitrage', icon: GitBranch },
  { id: 'ip', label: 'IP & Device', icon: Globe },
  { id: 'behavior', label: 'Behavioral', icon: TrendingUp },
  { id: 'exposure', label: 'Firm Exposure', icon: Activity },
  { id: 'kyc', label: 'KYC Review', icon: FileText },
];

const RISK_CFG = {
  low: { label: 'Low Risk', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  medium: { label: 'Medium Risk', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  high: { label: 'High Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  critical: { label: 'Critical', color: '#7f1d1d', bg: 'rgba(127,29,29,0.15)' },
};

const FLAG_TAB_MAP = {
  hft_detected: 'hft', high_frequency_trading: 'hft', ultra_fast_scalping: 'hft', ultra_scalping: 'hft',
  bot_detected: 'bot', ea_bot_detected: 'bot',
  arbitrage_detected: 'arbitrage', arbitrage: 'arbitrage', synthetic_arbitrage: 'arbitrage',
  ip_kyc_conflict: 'ip',
  inconsistent_behavior: 'behavior', consistency_manipulation: 'behavior', suspicious_lot_sizing: 'behavior',
  martingale_grid: 'behavior', copy_trading_signal: 'behavior', toxic_flow: 'behavior',
};

export default function AdminRiskCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [detailAcc, setDetailAcc] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');
  const qc = useQueryClient();

  const { data: adminData, isLoading } = useQuery({
    queryKey: ['admin-risk-center'],
    queryFn: async () => {
      const res = await base44.functions.invoke('adminListAllAccounts', { include_summary: true, limit: 500 });
      return res?.data || {};
    },
    refetchInterval: 30000,
    placeholderData: (prev) => prev,
  });

  const accounts = adminData?.accounts || [];
  const kycs = adminData?.kyc_verifications || [];
  const deviceLogs = adminData?.device_logs || [];

  const totalAccounts = accounts.length;
  const critical = accounts.filter(a => (a.risk_score || 0) >= 81).length;
  const highRisk = accounts.filter(a => (a.risk_score || 0) >= 61).length;
  const mediumRisk = accounts.filter(a => (a.risk_score || 0) >= 31 && (a.risk_score || 0) < 61).length;
  const lowRisk = accounts.filter(a => (a.risk_score || 0) < 31).length;

  const handleScan = async () => {
    setScanning(true);
    try {
      await base44.functions.invoke('adminRiskScanAll', {});
      qc.invalidateQueries({ queryKey: ['admin-risk-center'] });
    } catch (e) {
      alert('Scan failed: ' + (e?.message || 'unknown error'));
    } finally {
      setScanning(false);
    }
  };

  const matchesSearch = (a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.user_email?.toLowerCase().includes(q) ||
      a.account_id?.toLowerCase().includes(q) ||
      a.mt_login?.toLowerCase().includes(q);
  };

  const tabAccounts = (() => {
    if (activeTab === 'overview') return accounts.filter(matchesSearch);
    if (activeTab === 'kyc') return [];
    if (activeTab === 'ip' || activeTab === 'exposure') return accounts.filter(matchesSearch);
    const matchingFlagTypes = Object.entries(FLAG_TAB_MAP)
      .filter(([, tab]) => tab === activeTab).map(([ft]) => ft);
    return accounts.filter(a =>
      matchesSearch(a) &&
      (a.risk_flags || []).some(f => matchingFlagTypes.includes(f))
    );
  })();

  const noteMutation = useMutation({
    mutationFn: ({ id, notes, existing }) => base44.entities.ChallengeAccount.update(id, {
      behavioral_fingerprint: { ...(existing || {}), admin_internal_note: notes, noted_at: new Date().toISOString() },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-risk-center'] });
      setNoteModal(null);
      setNoteText('');
    },
  });

  const reviewedMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.ChallengeAccount.update(id, { risk_flags: [] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-risk-center'] }),
  });

  const openNote = (acc) => {
    setNoteModal(acc);
    setNoteText(acc?.behavioral_fingerprint?.admin_internal_note || '');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" /> Risk Management Center
          </h1>
          <p className="text-sm text-white/30 mt-1">
            Audit-only · Admin reviews flagged accounts and contacts traders manually. No automatic enforcement.
          </p>
        </div>
        <button onClick={handleScan} disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)' }}>
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} /> {scanning ? 'Scanning…' : 'Scan All'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Accounts" value={isLoading ? '-' : totalAccounts} icon={Users} color="#3b82f6" />
        <KPICard label="High Risk" value={isLoading ? '-' : highRisk} sub={`${critical} critical`} icon={AlertTriangle} color="#ef4444" />
        <KPICard label="Medium Risk" value={isLoading ? '-' : mediumRisk} icon={AlertTriangle} color="#f59e0b" />
        <KPICard label="Low Risk" value={isLoading ? '-' : lowRisk} icon={Activity} color="#10b981" />
      </div>

      <div className="mb-6 rounded-xl px-4 py-3 text-xs text-white/50 flex items-center gap-2"
        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
        <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        This center is <strong className="text-emerald-300">audit-only</strong>. Scans compute risk scores &amp; flags for admin review.
        No action here automatically breaches, fails, suspends, or puts an account under review. Only a real DD breach auto-fails an account.
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap"
              style={{
                background: active ? 'rgba(255,92,0,0.15)' : 'transparent',
                color: active ? '#FF5C00' : 'rgba(255,255,255,0.4)',
                border: active ? '1px solid rgba(255,92,0,0.3)' : '1px solid transparent',
              }}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, account ID, or MT5 login..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
      </div>

      {activeTab === 'kyc' ? (
        <KycReviewTab kycs={kycs} search={search} />
      ) : activeTab === 'ip' ? (
        <IpDeviceTab accounts={tabAccounts} deviceLogs={deviceLogs} onView={setDetailAcc} onNote={openNote} onReviewed={(a) => reviewedMutation.mutate(a)} />
      ) : (
        <AccountRiskTable
          accounts={tabAccounts}
          loading={isLoading}
          onView={setDetailAcc}
          onNote={openNote}
          onReviewed={(a) => reviewedMutation.mutate(a)}
          emptyHint={activeTab === 'overview' ? 'No accounts' : 'No accounts flagged in this category - run Scan All to refresh'}
        />
      )}

      <AnimatePresence>
        {detailAcc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-base font-black text-white">Account Details</h2>
                <button onClick={() => setDetailAcc(null)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <DetailRow label="Trader Email" value={detailAcc.user_email} />
                <DetailRow label="Account ID" value={detailAcc.account_id} />
                <DetailRow label="MT5 Login" value={detailAcc.mt_login || '-'} />
                <DetailRow label="Status" value={detailAcc.status} />
                <DetailRow label="Challenge" value={`${detailAcc.challenge_type} · $${(detailAcc.account_size || 0).toLocaleString()}`} />
                <DetailRow label="Risk Score" value={detailAcc.risk_score || 0} />
                <DetailRow label="Risk Level" value={detailAcc.risk_level || 'low'} />
                <div>
                  <div className="text-xs font-mono text-white/30 mb-1 uppercase">Flags</div>
                  <div className="flex gap-1 flex-wrap">
                    {(detailAcc.risk_flags || []).length === 0 ? (
                      <span className="text-white/30 text-xs">None</span>
                    ) : detailAcc.risk_flags.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold text-white capitalize" style={{ background: '#ef4444' }}>
                        {f.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono text-white/30 mb-1 uppercase">Internal Admin Note</div>
                  <div className="text-xs text-white/60 whitespace-pre-wrap rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {detailAcc.behavioral_fingerprint?.admin_internal_note || 'No note yet.'}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-white/20 pt-2">
                  Last risk scan: {detailAcc.last_risk_scan ? new Date(detailAcc.last_risk_scan).toLocaleString() : 'never'}
                </div>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button onClick={() => { openNote(detailAcc); setDetailAcc(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>Add / Edit Note</button>
                <button onClick={() => setDetailAcc(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white/60"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {noteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-base font-black text-white">Internal Note</h2>
                <button onClick={() => setNoteModal(null)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-xs text-white/40">{noteModal.account_id} · {noteModal.user_email}</div>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4}
                  placeholder="Internal note for admin review only (not visible to user)..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button onClick={() => setNoteModal(null)} className="flex-1 py-2.5 rounded-xl text-sm text-white/60" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                <button onClick={() => noteMutation.mutate({ id: noteModal.id, notes: noteText, existing: noteModal.behavioral_fingerprint })} disabled={noteMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                  {noteMutation.isPending ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountRiskTable({ accounts, loading, onView, onNote, onReviewed, emptyHint }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-3 px-4 text-xs font-mono text-white/30 uppercase">Trader / MT5</th>
            <th className="text-left py-3 px-4 text-xs font-mono text-white/30 uppercase">Score</th>
            <th className="text-left py-3 px-4 text-xs font-mono text-white/30 uppercase">Level</th>
            <th className="text-left py-3 px-4 text-xs font-mono text-white/30 uppercase">Flags</th>
            <th className="text-left py-3 px-4 text-xs font-mono text-white/30 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : accounts.length === 0 ? (
            <tr><td colSpan={5} className="py-12 text-center text-white/20">{emptyHint}</td></tr>
          ) : accounts.map(acc => (
            <tr key={acc.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
              <td className="py-3 px-4">
                <div className="text-sm font-bold text-white truncate max-w-[180px]">{acc.user_email}</div>
                <div className="text-xs text-white/40 font-mono">{acc.account_id} · MT5 {acc.mt_login || '-'}</div>
              </td>
              <td className="py-3 px-4">
                <span className="text-lg font-black" style={{ color: getScoreColor(acc.risk_score) }}>{acc.risk_score || 0}</span>
              </td>
              <td className="py-3 px-4"><RiskBadge level={acc.risk_level} /></td>
              <td className="py-3 px-4">
                <div className="flex gap-1 flex-wrap max-w-[200px]">
                  {(acc.risk_flags || []).length === 0 ? (
                    <span className="text-white/20 text-[10px]">none</span>
                  ) : acc.risk_flags.slice(0, 3).map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold text-white capitalize" style={{ background: '#ef4444' }}>
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <button onClick={() => onView(acc)} className="p-1.5 rounded-lg hover:bg-white/[0.05]" title="View details">
                    <Eye className="w-4 h-4 text-white/60" />
                  </button>
                  <button onClick={() => onNote(acc)} className="p-1.5 rounded-lg hover:bg-white/[0.05]" title="Add internal note">
                    <StickyNote className="w-4 h-4 text-amber-400" />
                  </button>
                  <button onClick={() => onReviewed(acc)} className="p-1.5 rounded-lg hover:bg-white/[0.05]" title="Mark reviewed (clear flags)">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button onClick={() => onNote(acc)} className="p-1.5 rounded-lg hover:bg-white/[0.05]" title="Flag for manual follow-up">
                    <Flag className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IpDeviceTab({ accounts, deviceLogs, onView, onNote, onReviewed }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-3 border-b border-white/[0.06] text-xs font-mono text-white/40 uppercase">
          Device Logs ({deviceLogs.length}) - VPN / proxy / datacenter / multi-device flags
        </div>
        {deviceLogs.length === 0 ? (
          <div className="py-10 text-center text-white/20 text-sm">No device logs recorded.</div>
        ) : deviceLogs.slice(0, 50).map(d => (
          <div key={d.id} className="px-5 py-3 border-b border-white/[0.04] flex flex-wrap items-center gap-3 text-xs">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{d.user_email}</div>
              <div className="text-white/40 font-mono">IP {d.ip_address} · {d.browser || '-'} · {d.os || '-'}</div>
            </div>
            <div className="flex gap-1">
              {d.is_vpn && <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: '#ef4444' }}>VPN</span>}
              {d.is_proxy && <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: '#f59e0b' }}>PROXY</span>}
              {d.is_datacenter && <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: '#7f1d1d' }}>DATACENTER</span>}
              {d.country_from_ip && <span className="px-2 py-0.5 rounded text-[10px] font-mono text-white/60" style={{ background: 'rgba(255,255,255,0.06)' }}>{d.country_from_ip}</span>}
            </div>
          </div>
        ))}
      </div>
      <AccountRiskTable accounts={accounts} loading={false} onView={onView} onNote={onNote} onReviewed={onReviewed}
        emptyHint="No accounts flagged for IP/device review" />
    </div>
  );
}

function KycReviewTab({ kycs, search }) {
  const q = (search || '').toLowerCase();
  const filtered = kycs.filter(k =>
    !q || k.user_email?.toLowerCase().includes(q) || k.full_name?.toLowerCase().includes(q)
  );
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="px-5 py-3 border-b border-white/[0.06] text-xs font-mono text-white/40 uppercase">
        KYC Submissions ({kycs.length}) - admin reviews manually
      </div>
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-white/20 text-sm">No KYC records.</div>
      ) : filtered.map(k => {
        const sc = k.status === 'approved' ? '#10b981' : k.status === 'rejected' ? '#ef4444' : k.status === 'resubmit_required' ? '#f59e0b' : '#60a5fa';
        return (
          <div key={k.id} className="px-5 py-3.5 border-b border-white/[0.04] flex flex-wrap items-center gap-3 text-xs">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{k.full_name || k.user_email}</div>
              <div className="text-white/40 font-mono">{k.user_email} · {k.id_type || '-'} · {k.nationality || '-'}</div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold capitalize" style={{ color: sc, background: `${sc}15`, border: `1px solid ${sc}30` }}>
              {k.status?.replace(/_/g, ' ')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function KPICard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/30 font-mono uppercase">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {sub && <div className="text-xs text-white/25 mt-1">{sub}</div>}
    </div>
  );
}

function RiskBadge({ level }) {
  const cfg = RISK_CFG[level] || RISK_CFG.low;
  return <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>;
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-white/40 text-xs font-mono uppercase">{label}</span>
      <span className="text-white font-semibold text-right break-all">{value || '-'}</span>
    </div>
  );
}

function getScoreColor(score) {
  if (!score) return '#666';
  if (score < 30) return '#10b981';
  if (score < 60) return '#f59e0b';
  if (score < 80) return '#ef4444';
  return '#7f1d1d';
}