import React, { useState } from 'react';
import { Users, Search, Shield, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdminUsers() {
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" /> Users
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">{users.length} registered users</p>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5 w-full max-w-sm"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Search className="w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-4 gap-2 px-5 py-3 text-[10px] font-mono text-muted-foreground uppercase border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="col-span-2">User</span>
          <span>Role</span>
          <span>Joined</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No users found.</div>
        ) : filtered.map((u) => (
          <div key={u.id} className="grid grid-cols-4 gap-2 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] items-center transition-colors">
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
            <span className={`flex items-center gap-1.5 text-xs font-mono font-semibold w-fit px-2 py-0.5 rounded-full ${
              u.role === 'admin' ? 'text-primary' : 'text-muted-foreground'
            }`} style={{ background: u.role === 'admin' ? 'rgba(255,92,0,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${u.role === 'admin' ? 'rgba(255,92,0,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
              {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />} {u.role}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {u.created_date ? new Date(u.created_date).toLocaleDateString() : '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}