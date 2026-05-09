import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Lock, Unlock, Shield, AlertTriangle, Eye, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdminUserManagement() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['user-feature-settings'],
    queryFn: () => base44.entities.UserFeatureSettings.list(),
  });

  const { data: flags = [] } = useQuery({
    queryKey: ['risk-flags'],
    queryFn: () => base44.entities.RiskFlag.filter({ status: 'active' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ email, data }) => base44.entities.UserFeatureSettings.update(email, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-feature-settings'] });
    },
  });

  const filtered = users.filter(u =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getUserSettings = (email) => settings.find(s => s.user_email === email);
  const getUserFlags = (email) => flags.filter(f => f.user_email === email);

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

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-5 flex-1 max-w-sm"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Search className="w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50" />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-5 gap-2 px-5 py-3 text-[10px] font-mono text-muted-foreground uppercase border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="col-span-2">User / Email</span>
          <span>Role</span>
          <span>Risk Flags</span>
          <span>Actions</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No users found.</div>
        ) : filtered.map(u => {
          const userSettings = getUserSettings(u.email);
          const userFlags = getUserFlags(u.email);
          return (
            <div key={u.email} className="grid grid-cols-5 gap-2 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] items-center transition-colors">
              <div className="col-span-2 min-w-0">
                <div className="text-xs font-mono font-bold text-foreground">{u.full_name || 'Unknown'}</div>
                <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full"
                style={{
                  background: u.role === 'admin' ? 'rgba(255,92,0,0.15)' : 'rgba(96,165,250,0.15)',
                  color: u.role === 'admin' ? '#FF5C00' : '#60a5fa',
                }}>
                {u.role}
              </span>
              <div className="flex items-center gap-1">
                {userFlags.length > 0 ? (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-400">
                    <AlertTriangle className="w-3 h-3" /> {userFlags.length}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </div>
              <button onClick={() => setSelected(u)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Eye className="w-3.5 h-3.5" /> View
              </button>
            </div>
          );
        })}
      </div>

      {/* User detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-base font-black">{selected.full_name}</h2>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Email</div>
                  <div className="text-sm text-foreground font-mono">{selected.email}</div>
                </div>
                <div>
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Role</div>
                  <div className="text-sm text-foreground capitalize">{selected.role}</div>
                </div>

                {/* Feature toggles */}
                <div className="pt-3 border-t border-white/5">
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-3">Feature Access</div>
                  <div className="space-y-2">
                    {[
                      { key: 'can_trade', label: 'Trading' },
                      { key: 'can_withdraw', label: 'Withdrawals' },
                      { key: 'can_access_terminal', label: 'Terminal' },
                      { key: 'can_purchase_challenge', label: 'Purchase Challenges' },
                    ].map(f => {
                      const settings = getUserSettings(selected.email);
                      const val = settings?.[f.key] ?? true;
                      return (
                        <div key={f.key} className="flex items-center justify-between p-2 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <span className="text-xs text-muted-foreground">{f.label}</span>
                          <button
                            onClick={() => updateMutation.mutate({ email: selected.email, data: { [f.key]: !val } })}
                            className="p-1.5 rounded-lg transition-all"
                            style={{
                              background: val ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: val ? '#10b981' : '#ef4444',
                            }}>
                            {val ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Risk flags */}
                {getUserFlags(selected.email).length > 0 && (
                  <div className="pt-3 border-t border-white/5">
                    <div className="text-xs font-mono text-muted-foreground uppercase mb-3">Active Risk Flags</div>
                    <div className="space-y-2">
                      {getUserFlags(selected.email).map(f => (
                        <div key={f.id} className="p-2 rounded-lg"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            <span className="text-xs font-bold text-red-400 capitalize">{f.flag_type.replace('_', ' ')}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{
                                background: f.severity === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(255,152,0,0.25)',
                                color: f.severity === 'critical' ? '#ef4444' : '#ffa500',
                              }}>
                              {f.severity}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">{f.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}