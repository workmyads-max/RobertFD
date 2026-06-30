import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Edit2, Trash2, Save, X, Loader2, Check, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const ALL_PERMISSIONS = [
  { key: 'manage_users', label: 'Manage Users', category: 'Users' },
  { key: 'manage_challenges', label: 'Manage Challenges', category: 'Trading' },
  { key: 'manage_payouts', label: 'Manage Payouts', category: 'Finance' },
  { key: 'manage_payments', label: 'Manage Payments', category: 'Finance' },
  { key: 'manage_coupons', label: 'Manage Coupons', category: 'Finance' },
  { key: 'manage_kyc', label: 'Manage KYC', category: 'Compliance' },
  { key: 'manage_risk', label: 'Manage Risk', category: 'Compliance' },
  { key: 'manage_affiliates', label: 'Manage Affiliates', category: 'Marketing' },
  { key: 'manage_support', label: 'Manage Support', category: 'Support' },
  { key: 'manage_notifications', label: 'Manage Notifications', category: 'System' },
  { key: 'manage_settings', label: 'Manage Settings', category: 'System' },
  { key: 'manage_staff', label: 'Manage Staff', category: 'Security' },
  { key: 'manage_audit_logs', label: 'View Audit Logs', category: 'Security' },
];

const CATEGORY_COLORS = {
  Users: '#3b82f6', Trading: '#8b5cf6', Finance: '#10b981', Compliance: '#ef4444',
  Marketing: '#f59e0b', Support: '#06b6d4', System: '#6b7280', Security: '#FF5C00',
};

const invoke = (action, data = {}) => base44.functions.invoke('staffManagement', { action, ...data });

function PermissionToggle({ perm, checked, onChange, disabled }) {
  const color = CATEGORY_COLORS[perm.category] || '#8b5cf6';
  return (
    <button onClick={() => !disabled && onChange(perm.key)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
      style={{
        background: checked ? color + '20' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${checked ? color + '50' : 'rgba(255,255,255,0.08)'}`,
        color: checked ? color : 'rgba(255,255,255,0.4)',
      }}>
      <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: checked ? color : 'rgba(255,255,255,0.08)', border: `1px solid ${checked ? color : 'rgba(255,255,255,0.15)'}` }}>
        {checked && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      {perm.label}
    </button>
  );
}

function RoleEditor({ role, onSave, onCancel }) {
  const [form, setForm] = useState({
    role_name: role?.role_name || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
    color: role?.color || '#8b5cf6',
  });
  const [loading, setLoading] = useState(false);

  const togglePerm = (key) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const categories = [...new Set(ALL_PERMISSIONS.map(p => p.category))];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Role Name</label>
          <input value={form.role_name} onChange={e => setForm(f => ({ ...f, role_name: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Badge Color</label>
          <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            className="w-full h-9 rounded-lg px-1 py-1 outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-2 block">
          Permissions ({form.permissions.length}/{ALL_PERMISSIONS.length})
        </label>
        {categories.map(cat => (
          <div key={cat} className="mb-3">
            <div className="text-[10px] font-mono mb-1.5 px-1" style={{ color: CATEGORY_COLORS[cat] }}>
              {cat.toUpperCase()}
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_PERMISSIONS.filter(p => p.category === cat).map(perm => (
                <PermissionToggle key={perm.key} perm={perm}
                  checked={form.permissions.includes(perm.key)}
                  onChange={togglePerm} disabled={false} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Saving...' : 'Save Role'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminRolesPermissions() {
  const [editingId, setEditingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: roles = [], isLoading, refetch } = useQuery({
    queryKey: ['staff-roles'],
    queryFn: () => invoke('get_roles').then(r => r.data.roles || []),
  });

  const handleCreate = async (form) => {
    const role_key = form.role_name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    await invoke('create_role', { role_key, ...form });
    refetch(); setShowCreate(false);
  };

  const handleUpdate = async (roleId, form) => {
    await invoke('update_role', { role_id: roleId, updates: form });
    refetch(); setEditingId(null);
  };

  const handleDelete = async (role) => {
    if (role.is_system_role) return alert('System roles cannot be deleted.');
    if (!window.confirm(`Delete role "${role.role_name}"?`)) return;
    await invoke('delete_role', { role_id: role.id });
    refetch();
  };

  const systemRoles = roles.filter(r => r.is_system_role);
  const customRoles = roles.filter(r => !r.is_system_role);
  const categories = [...new Set(ALL_PERMISSIONS.map(p => p.category))];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-primary" />
            <span>Roles &amp; Permissions</span>
          </h1>
          <p className="text-sm text-muted-foreground font-mono">Granular RBAC - {roles.length} roles configured</p>
        </div>
        <button onClick={() => { setShowCreate(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
          style={{ background: 'linear-gradient(90deg,#8b5cf6,#7c3aed)' }}>
          <Plus className="w-4 h-4" /> Create Custom Role
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="rounded-xl p-5 mb-6"
            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">New Custom Role</h3>
              <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <RoleEditor onSave={handleCreate} onCancel={() => setShowCreate(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Category Legend */}
      <div className="flex flex-wrap gap-2 mb-5">
        {categories.map(cat => (
          <span key={cat} className="px-2 py-0.5 rounded-full text-[10px] font-mono"
            style={{ background: CATEGORY_COLORS[cat] + '15', color: CATEGORY_COLORS[cat], border: `1px solid ${CATEGORY_COLORS[cat]}30` }}>
            {cat}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-mono text-muted-foreground px-1 mb-2 flex items-center gap-2">
            <Lock className="w-3 h-3" /> SYSTEM ROLES (read-only)
          </div>

          {systemRoles.map((role, i) => (
            <motion.div key={role.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{role.role_name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                      style={{ background: (role.color || '#8b5cf6') + '20', color: role.color || '#8b5cf6', border: `1px solid ${(role.color || '#8b5cf6')}40` }}>
                      {role.role_key}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/5 text-muted-foreground flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> System
                    </span>
                  </div>
                  {role.description && <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>}
                </div>
                <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{role.permissions?.length || 0} perms</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_PERMISSIONS.map(perm => (
                  <PermissionToggle key={perm.key} perm={perm}
                    checked={role.permissions?.includes(perm.key)}
                    onChange={() => {}} disabled={true} />
                ))}
              </div>
            </motion.div>
          ))}

          {customRoles.length > 0 && (
            <>
              <div className="text-xs font-mono text-muted-foreground px-1 mt-4 mb-2">CUSTOM ROLES</div>
              {customRoles.map((role) => (
                <motion.div key={role.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-5"
                  style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  {editingId === role.id ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold">Editing: {role.role_name}</h3>
                        <button onClick={() => setEditingId(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                      <RoleEditor role={role} onSave={(form) => handleUpdate(role.id, form)} onCancel={() => setEditingId(null)} />
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{role.role_name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                              style={{ background: (role.color || '#8b5cf6') + '20', color: role.color || '#8b5cf6', border: `1px solid ${(role.color || '#8b5cf6')}40` }}>
                              custom
                            </span>
                          </div>
                          {role.description && <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>}
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => setEditingId(role.id)} className="p-1.5 rounded-lg hover:bg-primary/20 text-primary transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(role)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_PERMISSIONS.map(perm => (
                          <PermissionToggle key={perm.key} perm={perm}
                            checked={role.permissions?.includes(perm.key)}
                            onChange={() => {}} disabled={true} />
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}