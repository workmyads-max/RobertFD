import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeadphonesIcon, Search, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STATUS_COLOR = { open: '#f59e0b', in_progress: '#60a5fa', resolved: '#10b981', closed: '#666' };
const STATUS_OPTS = ['open','in_progress','resolved','closed'];
const PRIORITY_COLOR = { low: '#666', medium: '#f59e0b', high: '#ef4444' };

export default function AdminSupport() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const qc = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tickets'] }); setSelected(null); setReply(''); },
  });

  const filtered = tickets.filter(t =>
    !search || t.subject?.toLowerCase().includes(search.toLowerCase()) || t.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <HeadphonesIcon className="w-6 h-6 text-primary" /> Support Tickets
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">{tickets.filter(t=>t.status==='open').length} open tickets</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5 w-full max-w-sm"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Search className="w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..."
          className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-6 gap-2 px-5 py-3 text-[10px] font-mono text-muted-foreground uppercase border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="col-span-2">Subject</span>
          <span>Category</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Reply</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No tickets found.</div>
        ) : filtered.map((t) => {
          const sc = STATUS_COLOR[t.status] || '#888';
          const pc = PRIORITY_COLOR[t.priority] || '#888';
          return (
            <div key={t.id} className="grid grid-cols-6 gap-2 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] items-center transition-colors">
              <div className="col-span-2 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{t.subject}</div>
                <div className="text-[11px] text-muted-foreground truncate">{t.user_email || '—'}</div>
              </div>
              <span className="text-xs text-muted-foreground capitalize">{t.category}</span>
              <span className="text-[10px] font-mono capitalize" style={{ color: pc }}>{t.priority}</span>
              <select value={t.status} onChange={e => updateMutation.mutate({ id: t.id, data: { status: e.target.value } })}
                className="text-[10px] font-mono px-2 py-1 rounded-lg outline-none capitalize"
                style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}30` }}>
                {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-[#0e0e10] text-foreground capitalize">{s}</option>)}
              </select>
              <button onClick={() => { setSelected(t); setReply(t.admin_reply || ''); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> Reply
              </button>
            </div>
          );
        })}
      </div>

      {/* Reply modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-base font-black">Reply to Ticket</h2>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-1">Subject</div>
                  <div className="text-sm font-semibold text-foreground">{selected.subject}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-xs font-mono text-muted-foreground mb-1">User Message</div>
                  <div className="text-sm text-foreground leading-relaxed">{selected.message}</div>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Admin Reply</label>
                  <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4}
                    placeholder="Type your reply to the user..."
                    className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSelected(null)} className="flex-1 py-3 rounded-xl text-sm text-muted-foreground"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={() => updateMutation.mutate({ id: selected.id, data: { admin_reply: reply, status: 'in_progress' } })}
                    disabled={updateMutation.isPending}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                    {updateMutation.isPending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}