import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit2, Trash2, ShieldOff, ShieldCheck, Key, X, Loader2, Search, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const ROLE_COLORS = {
  owner: '#FF5C00', super_admin: '#ef4444', admin: '#f97316',
  risk_manager: '#8b5cf6', finance_team: '#10b981', support_team: '#3b82f6',
  kyc_team: '#06b6d4', affiliate_manager: '#f59e0b', custom: '#a78bfa',
};

const ROLE_LABELS = {
  owner: 'Owner', super_admin: 'Super Admin', admin: 'Admin',
  risk_manager: 'Risk Manager', finance_team: 'Finance Team', support_team: 'Support Team',
  kyc_team: 'KYC Team', affiliate_manager: 'Affiliate Manager', custom: 'Custom',
};

const invoke = (action, data = {}) => base44.functions.invoke('staffManagement', { action, ...data });

function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] || '#8b5cf6';
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: color + '20', color, border: `1px solid ${color}40` }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function InviteModal({ roles, onClose, onSuccess }) {
  const [form, setForm] = useState({ email: '', full_name: '', role_name: 'support_team', permissions: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email || !form.full_name) return setError('Email and name required');
    setLoading(true); setError('');
    const res = await invoke('invite_staff', form);
    setLoading(false);
    if (res.data?.success) { setResult(res.data); onSuccess(); }
    else setError(res.data?.error || 'Failed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#13141a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">Invite Staff Member</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              ✓ Staff member invited successfully!
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs font-mono">
              <div className="text-yellow-400 font-bold mb-1">Temporary Password (share securely):</div>
              <div className="text-yellow-300">{result.temp_password}</div>
            </div>
            <button onClick={onClose} className="w-full py-2 rounded-lg text-sm font-bold text-white"
              style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>Close</button>
          </div>
        ) : (
          <div className="space-y-3">
            {[['Full Name', 'full_name', 'text'], ['Email Address', 'email', 'email']].map(([label, key, type]) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <select value={form.role_name} onChange={e => set('role_name', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                {roles?.filter(r => !r.is_system_role).map(r => (
                  <option key={r.id} value="custom">{r.role_name} (Custom)</option>
                ))}
              </select>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {loading ? 'Inviting...' : 'Send Invite'}
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function PasswordModal({ member, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleReset = async () => {
    setLoading(true);
    const res = await invoke('reset_staff_password', { auth_user_id: member.auth_user_id, target_email: member.user_email });
    setLoading(false);
    if (res.data?.success) setResult(res.data.new_password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#13141a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Reset Password</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Reset password for <span className="text-white">{member.user_email}</span>?</p>
        {result ? (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs font-mono mb-4">
            <div className="text-yellow-400 font-bold mb-1">New Password:</div>
            <div className="text-yellow-300">{result}</div>
          </div>
        ) : (
          <button onClick={handleReset} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-white mb-3 disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg,#8b5cf6,#7c3aed)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Generate New Password
          </button>
        )}
        <button onClick={onClose} className="w-full py-2 rounded-lg text-sm"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Close
        </button>
      </motion.div>
    </div>
  );
}

export default function AdminStaffManagement() {
  const qc = useQueryClient();
  const { user } = useCustomAuth();
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const { data: staffData, isLoading, refetch } = useQuery({
    queryKey: ['staff-members'],
    queryFn: () => invoke('get_staff').then(r => r.data.staff || []),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['staff-roles'],
    queryFn: () => invoke('get_roles').then(r => r.data.roles || []),
  });

  const staff = staffData || [];

  const filtered = staff.filter(s =>
    s.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.role_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSuspend = async (member) => {
    if (!window.confirm(`Suspend ${member.user_email}?`)) return;
    setActionLoading(member.id);
    await invoke('suspend_staff', { member_id: member.id, reason: 'Admin action', target_email: member.user_email });
    refetch();
    setActionLoading(null);
  };

  const handleReactivate = async (member) => {
    setActionLoading(member.id);
    await invoke('reactivate_staff', { member_id: member.id, target_email: member.user_email });
    refetch();
    setActionLoading(null);
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Permanently remove ${member.user_email}? This cannot be undone.`)) return;
    setActionLoading(member.id);
    await invoke('delete_staff', { member_id: member.id, target_email: member.user_email, auth_user_id: member.auth_user_id });
    refetch();
    setActionLoading(null);
  };

  const stats = [
    { label: 'Total Staff', value: staff.length },
    { label: 'Active', value: staff.filter(s => s.is_active && !s.is_suspended).length, color: '#10b981' },
    { label: 'Suspended', value: staff.filter(s => s.is_suspended).length, color: '#ef4444' },
    { label: 'Roles', value: (rolesData || []).length },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3 mb-1">
            <Users className="w-6 h-6 text-primary" /> Staff Management
          </h1>
          <p className="text-sm text-muted-foreground font-mono">RBAC — Institutional Access Control</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
            <Plus className="w-4 h-4" /> Invite Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-2xl font-black" style={{ color: s.color || 'white' }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..."
          className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-foreground outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Staff Member', 'Role', 'Status', 'Invited By', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No staff members found.</td></tr>
              ) : filtered.map((member, i) => (
                <motion.tr key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-t transition-colors hover:bg-white/[0.02]"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{member.full_name || '—'}</div>
                    <div className="text-xs text-muted-foreground font-mono">{member.user_email}</div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={member.role_name} /></td>
                  <td className="px-4 py-3">
                    {member.is_suspended ? (
                      <span className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle className="w-3 h-3" /> Suspended</span>
                    ) : member.is_active ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" /> Active</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{member.invited_by || '—'}</td>
                  <td className="px-4 py-3">
                    {member.last_login_at ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(member.last_login_at).toLocaleDateString()}
                      </div>
                    ) : <span className="text-xs text-muted-foreground">Never</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {actionLoading === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <button onClick={() => setPasswordModal(member)} title="Reset Password"
                            className="p-1.5 rounded-lg hover:bg-purple-500/20 text-purple-400 transition-colors">
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          {member.is_suspended ? (
                            <button onClick={() => handleReactivate(member)} title="Reactivate"
                              className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button onClick={() => handleSuspend(member)} title="Suspend"
                              className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition-colors">
                              <ShieldOff className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {member.user_email !== user?.email && (
                            <button onClick={() => handleDelete(member)} title="Remove"
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showInvite && <InviteModal roles={rolesData} onClose={() => setShowInvite(false)} onSuccess={() => { refetch(); }} />}
      {passwordModal && <PasswordModal member={passwordModal} onClose={() => setPasswordModal(null)} />}
    </div>
  );
}