import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Shield, User, Eye, Edit2, Ban, CheckCircle,
  AlertTriangle, X, Save, RefreshCw, Lock, Unlock, Server,
  TrendingUp, TrendingDown, Clock, DollarSign, Activity
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STATUS_COLOR = {
  active:  { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  passed:  { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
  funded:  { bg: 'rgba(255,92,0,0.12)',   color: '#FF5C00', border: 'rgba(255,92,0,0.3)' },
  failed:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
};

function Badge({ status }) {
  const cfg = STATUS_COLOR[status] || STATUS_COLOR.pending;
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {status}
    </span>
  );
}

function UserDetailModal({ user, onClose, qc }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: user.full_name || '', role: user.role || 'user' });
  const [saving, setSaving] = useState(false);

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['user-accounts-admin', user.email],
    queryFn: () => base44.entities.ChallengeAccount.filter({ user_email: user.email }, '-created_date', 100),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders-admin', user.email],
    queryFn: () => base44.entities.Order.filter({ email: user.email }, '-created_date', 50),
  });

  const { data: userAccount = [] } = useQuery({
    queryKey: ['user-account-record', user.email],
    queryFn: () => base44.entities.UserAccount.filter({ email: user.email }),
  });

  const { data: flags = [] } = useQuery({
    queryKey: ['risk-flags-user', user.email],
    queryFn: () => base44.entities.RiskFlag.filter({ user_email: user.email, status: 'active' }),
  });

  const { data: featureSettings = [] } = useQuery({
    queryKey: ['feature-settings-user', user.email],
    queryFn: () => base44.entities.UserFeatureSettings.filter({ user_email: user.email }),
  });
  const settings = featureSettings[0] || {};

  const updateFeature = async (key, val) => {
    if (featureSettings.length > 0) {
      await base44.entities.UserFeatureSettings.update(featureSettings[0].id, { [key]: val });
    } else {
      await base44.entities.UserFeatureSettings.create({ user_email: user.email, [key]: val });
    }
    qc.invalidateQueries({ queryKey: ['feature-settings-user', user.email] });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    await base44.entities.User.update(user.id, editData);
    qc.invalidateQueries({ queryKey: ['admin-users'] });
    setSaving(false);
    setEditing(false);
  };

  const handleBan = async () => {
    if (!confirm(`Ban ${user.email}? This will disable all feature access.`)) return;
    if (featureSettings.length > 0) {
      await base44.entities.UserFeatureSettings.update(featureSettings[0].id, {
        can_trade: false, can_withdraw: false, can_access_terminal: false, can_purchase_challenge: false, is_banned: true,
      });
    } else {
      await base44.entities.UserFeatureSettings.create({
        user_email: user.email, can_trade: false, can_withdraw: false,
        can_access_terminal: false, can_purchase_challenge: false, is_banned: true,
      });
    }
    qc.invalidateQueries({ queryKey: ['feature-settings-user', user.email] });
  };

  const handleUnban = async () => {
    if (featureSettings.length > 0) {
      await base44.entities.UserFeatureSettings.update(featureSettings[0].id, {
        can_trade: true, can_withdraw: true, can_access_terminal: true, can_purchase_challenge: true, is_banned: false,
      });
    }
    qc.invalidateQueries({ queryKey: ['feature-settings-user', user.email] });
  };

  const isBanned = settings.is_banned === true;
  const totalPaid = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (o.price || 0), 0);

  const featureToggles = [
    { key: 'can_trade', label: 'Trading' },
    { key: 'can_withdraw', label: 'Withdrawals' },
    { key: 'can_access_terminal', label: 'Terminal Access' },
    { key: 'can_purchase_challenge', label: 'Purchase Challenges' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="w-full max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: '#0d0f18', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0d0f18' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(255,92,0,0.15)', color: '#FF5C00' }}>
              {user.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <div className="text-sm font-black text-white">{user.full_name || 'Unknown'}</div>
              <div className="text-[11px] font-mono text-white/40">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isBanned ? (
              <button onClick={handleUnban}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle className="w-3.5 h-3.5" /> Unban
              </button>
            ) : (
              <button onClick={handleBan}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                <Ban className="w-3.5 h-3.5" /> Ban User
              </button>
            )}
            <button onClick={() => setEditing(e => !e)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
              style={{ background: 'rgba(255,92,0,0.15)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.3)' }}>
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Status banner if banned */}
          {isBanned && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <Ban className="w-4 h-4 text-red-400" />
              <span className="text-sm font-bold text-red-400">This account is BANNED - all features disabled</span>
            </div>
          )}

          {/* Edit form */}
          <AnimatePresence>
            {editing && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-xl p-4 space-y-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,92,0,0.2)' }}>
                <div className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Edit User Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-white/40 uppercase mb-1 block">Full Name</label>
                    <input value={editData.full_name} onChange={e => setEditData(d => ({ ...d, full_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-white/40 uppercase mb-1 block">Role</label>
                    <select value={editData.role} onChange={e => setEditData(d => ({ ...d, role: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs rounded-lg text-white/50 hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleSaveEdit} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                    style={{ background: '#FF5C00' }}>
                    {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Accounts', value: accounts.length, icon: Server, color: '#60a5fa' },
              { label: 'Active Accounts', value: accounts.filter(a => a.status === 'active').length, icon: Activity, color: '#10b981' },
              { label: 'Total Orders', value: orders.length, icon: DollarSign, color: '#FF5C00' },
              { label: 'Total Paid', value: `$${totalPaid.toLocaleString()}`, icon: TrendingUp, color: '#CCFF00' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.color }} />
                  <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] text-white/35 font-mono">{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* MT5 / Challenge Accounts */}
          <div>
            <div className="text-xs font-bold text-white/40 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Server className="w-3.5 h-3.5" /> MT5 Accounts ({accounts.length})
            </div>
            {loadingAccounts ? (
              <div className="py-6 text-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : accounts.length === 0 ? (
              <div className="py-6 text-center text-sm text-white/30 rounded-xl"
                style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>No accounts found</div>
            ) : (
              <div className="space-y-2">
                {accounts.map(acc => (
                  <div key={acc.id} className="rounded-xl p-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-sm font-bold text-white">{acc.mt_login || acc.account_id}</div>
                        <Badge status={acc.status} />
                        <span className="text-[10px] text-white/40 font-mono capitalize">{acc.challenge_type} · {acc.phase?.replace('phase','Ph ')}</span>
                      </div>
                      <div className="text-sm font-bold text-white">${(acc.account_size || 0).toLocaleString()}</div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                      {[
                        { label: 'MT5 Login', value: acc.mt_login || '-' },
                        { label: 'Server', value: acc.mt_server || acc.server || '-' },
                        { label: 'Balance', value: `$${(acc.balance || 0).toLocaleString()}` },
                        { label: 'P&L', value: `${(acc.pnl || 0) >= 0 ? '+' : ''}$${(acc.pnl || 0).toLocaleString()}`, color: (acc.pnl || 0) >= 0 ? '#10b981' : '#ef4444' },
                        { label: 'Daily DD', value: `${acc.daily_drawdown_used || 0}%` },
                        { label: 'Max DD', value: `${acc.max_drawdown_used || 0}%` },
                        { label: 'Win Rate', value: `${acc.win_rate || 0}%` },
                        { label: 'Trades', value: acc.total_trades || 0 },
                      ].map(s => (
                        <div key={s.label}>
                          <div className="text-white/30 mb-0.5">{s.label}</div>
                          <div className="font-mono font-bold" style={{ color: s.color || 'rgba(255,255,255,0.8)' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {acc.dd_breach_detected && (
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-red-400 px-2 py-1.5 rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        DD Breach: {acc.dd_breach_type?.toUpperCase()} - {new Date(acc.dd_breach_time || '').toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feature Access Toggles */}
          <div>
            <div className="text-xs font-bold text-white/40 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> Feature Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              {featureToggles.map(f => {
                const val = settings[f.key] ?? true;
                return (
                  <div key={f.key} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-xs text-white/60">{f.label}</span>
                    <button onClick={() => updateFeature(f.key, !val)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                      style={{
                        background: val ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: val ? '#10b981' : '#ef4444',
                        border: `1px solid ${val ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>
                      {val ? <><Unlock className="w-3 h-3" /> ON</> : <><Lock className="w-3 h-3" /> OFF</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Orders */}
          {orders.length > 0 && (
            <div>
              <div className="text-xs font-bold text-white/40 uppercase tracking-wide mb-3 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" /> Orders ({orders.length})
              </div>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                {orders.slice(0, 5).map((o, i) => (
                  <div key={o.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0 text-xs"
                    style={{ borderColor: 'rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                    <div>
                      <div className="font-mono font-bold text-white">{o.order_id || o.id?.slice(0,8)}</div>
                      <div className="text-white/35 mt-0.5 font-mono">{o.challenge_type} · ${(o.account_size||0).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">${(o.price || 0).toLocaleString()}</div>
                      <Badge status={o.payment_status === 'paid' ? 'active' : o.payment_status === 'failed' ? 'failed' : 'pending'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Flags */}
          {flags.length > 0 && (
            <div>
              <div className="text-xs font-bold text-white/40 uppercase tracking-wide mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Active Risk Flags ({flags.length})
              </div>
              <div className="space-y-2">
                {flags.map(f => (
                  <div key={f.id} className="p-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs font-bold text-red-400 capitalize">{f.flag_type?.replace(/_/g,' ')}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>{f.severity}</span>
                    </div>
                    <div className="text-[11px] text-white/40">{f.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account info */}
          <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="grid grid-cols-3 gap-4 text-[11px]">
              <div>
                <div className="text-white/30 mb-1">User ID</div>
                <div className="font-mono text-white/60 truncate">{user.id}</div>
              </div>
              <div>
                <div className="text-white/30 mb-1">Role</div>
                <div className="font-mono text-white/60">{user.role || 'user'}</div>
              </div>
              <div>
                <div className="text-white/30 mb-1">Joined</div>
                <div className="font-mono text-white/60">{user.created_date ? new Date(user.created_date).toLocaleDateString() : '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminUserManagement() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  const { data: allAccounts = [] } = useQuery({
    queryKey: ['all-challenge-accounts-admin'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 500),
  });

  const { data: flags = [] } = useQuery({
    queryKey: ['all-risk-flags'],
    queryFn: () => base44.entities.RiskFlag.filter({ status: 'active' }),
  });

  const filtered = users.filter(u =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getAccountCount = (email) => allAccounts.filter(a => a.user_email === email).length;
  const getActiveAccount = (email) => allAccounts.find(a => a.user_email === email && (a.status === 'active' || a.status === 'funded'));
  const getFlagCount = (email) => flags.filter(f => f.user_email === email).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" /> User Management
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">{users.length} registered users</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5 max-w-sm"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Search className="w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-6 gap-2 px-5 py-3 text-[10px] font-mono text-muted-foreground uppercase border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="col-span-2">User</span>
          <span>Role</span>
          <span>Accounts</span>
          <span>Flags</span>
          <span>Action</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No users found.</div>
        ) : filtered.map(u => {
          const acctCount = getAccountCount(u.email);
          const activeAcct = getActiveAccount(u.email);
          const flagCount = getFlagCount(u.email);
          return (
            <div key={u.id} className="grid grid-cols-6 gap-2 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] items-center transition-colors">
              <div className="col-span-2 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: u.role === 'admin' ? 'rgba(255,92,0,0.2)' : 'rgba(255,255,255,0.08)', color: u.role === 'admin' ? '#FF5C00' : '#888' }}>
                  {u.full_name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{u.full_name || '-'}</div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">{u.email}</div>
                </div>
              </div>

              <span className="text-xs px-2 py-0.5 rounded-full w-fit flex items-center gap-1"
                style={{ background: u.role === 'admin' ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.06)', color: u.role === 'admin' ? '#FF5C00' : '#888' }}>
                {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />} {u.role}
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold" style={{ color: acctCount > 0 ? '#60a5fa' : '#666' }}>{acctCount}</span>
                {activeAcct && <Badge status={activeAcct.status} />}
              </div>

              <div>
                {flagCount > 0 ? (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <AlertTriangle className="w-3 h-3" /> {flagCount}
                  </span>
                ) : <span className="text-white/20 text-xs">-</span>}
              </div>

              <button onClick={() => setSelected(u)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 w-fit"
                style={{ background: 'rgba(255,92,0,0.15)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.3)' }}>
                <Eye className="w-3.5 h-3.5" /> View
              </button>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <UserDetailModal user={selected} onClose={() => setSelected(null)} qc={qc} />
        )}
      </AnimatePresence>
    </div>
  );
}