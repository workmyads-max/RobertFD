import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeadphonesIcon, Search, MessageSquare, Send, X, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STATUS_COLOR = { open: '#f59e0b', in_progress: '#60a5fa', resolved: '#10b981', closed: '#666' };
const STATUS_OPTS = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_COLOR = { low: '#666', medium: '#f59e0b', high: '#ef4444' };

export default function AdminSupport() {
  const [tab, setTab] = useState('tickets'); // tickets | chat
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const qc = useQueryClient();

  // Admin sees ALL tickets (admin bypasses RLS)
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
      qc.invalidateQueries({ queryKey: ['support-tickets'] }); // user side
      if (selected) setSelected(null);
      setReply('');
    },
  });

  const filtered = tickets.filter(t =>
    !search || t.subject?.toLowerCase().includes(search.toLowerCase()) || t.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <HeadphonesIcon className="w-6 h-6 text-primary" /> Support Management
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {tickets.filter(t => t.status === 'open').length} open · {tickets.filter(t => t.status === 'in_progress').length} in progress
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-full max-w-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'tickets', label: 'Tickets' },
          { id: 'chat', label: 'Live Chat' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            style={tab === t.id ? { background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tickets' && (
        <>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5 w-full max-w-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets or users..."
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
                    <div className="text-[11px] text-muted-foreground truncate">{t.user_email || '-'}</div>
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
        </>
      )}

      {tab === 'chat' && <AdminLiveChat />}

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
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-1">From</div>
                  <div className="text-sm font-semibold text-foreground">{selected.user_email}</div>
                </div>
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-1">Subject</div>
                  <div className="text-sm font-semibold text-foreground">{selected.subject}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-xs font-mono text-muted-foreground mb-1">User Message</div>
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.message}</div>
                  {selected.admin_reply && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-xs font-mono text-muted-foreground mb-1">Admin Reply</div>
                      <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selected.admin_reply}</div>
                    </div>
                  )}
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
                    disabled={updateMutation.isPending || !reply.trim()}
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

// ── Admin live chat: list all users' chat threads, reply to each ─────────────
function AdminLiveChat() {
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  // Admin sees ALL chat messages (admin bypasses RLS)
  const { data: allMessages = [], isLoading } = useQuery({
    queryKey: ['admin-live-chat'],
    queryFn: async () => {
      const result = await base44.entities.LiveChatMessage.list('-created_date', 500);
      return Array.isArray(result) ? result : [];
    },
    refetchInterval: 4000,
  });

  // Group by sender_email into threads
  const threads = React.useMemo(() => {
    const map = new Map();
    for (const m of allMessages) {
      const key = m.sender_email || 'unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    }
    return Array.from(map.entries()).map(([email, msgs]) => {
      const sorted = msgs.sort((a, b) =>
        new Date(a.created_at || a.created_date || 0).getTime() - new Date(b.created_at || b.created_date || 0).getTime());
      const last = sorted[sorted.length - 1];
      const unanswered = sorted.filter(m => m.status === 'pending' && !m.admin_response).length;
      return { email, messages: sorted, last, unanswered };
    }).sort((a, b) => {
      // unanswered first, then by last message time desc
      if (b.unanswered !== a.unanswered) return b.unanswered - a.unanswered;
      return new Date(b.last?.created_at || 0).getTime() - new Date(a.last?.created_at || 0).getTime();
    });
  }, [allMessages]);

  const currentThread = threads.find(t => t.email === selectedUser);

  const replyMutation = useMutation({
    mutationFn: ({ id, response }) => base44.entities.LiveChatMessage.update(id, {
      admin_response: response,
      admin_email: 'admin',
      status: 'replied',
      responded_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-live-chat'] });
      qc.invalidateQueries({ queryKey: ['live-chat'] }); // user side
      setText('');
    },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [currentThread?.messages]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ height: '70vh' }}>
      {/* Thread list */}
      <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-4 py-3 border-b border-white/5 text-xs font-bold text-foreground">Conversations</div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : threads.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No conversations.</div>
          ) : threads.map(t => (
            <button key={t.email} onClick={() => setSelectedUser(t.email)}
              className={`w-full text-left px-4 py-3 border-b border-white/[0.04] transition-colors ${selectedUser === t.email ? 'bg-primary/10' : 'hover:bg-white/[0.02]'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground truncate">{t.email}</span>
                {t.unanswered > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: '#FF5C00' }}>{t.unanswered}</span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground truncate mt-1">
                {t.last?.message || '-'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active conversation */}
      <div className="md:col-span-2 rounded-2xl overflow-hidden flex flex-col" style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.06)' }}>
        {!currentThread ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-muted-foreground">Select a conversation to reply.</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-white/5">
              <div className="text-sm font-bold text-foreground">{currentThread.email}</div>
              <div className="text-[10px] text-muted-foreground">{currentThread.messages.length} messages</div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentThread.messages.map(m => (
                <div key={m.id}>
                  {/* User message (left) */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm text-foreground"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="whitespace-pre-wrap">{m.message}</div>
                      <div className="text-[9px] mt-1 text-muted-foreground font-mono flex items-center gap-1">
                        {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        {m.status === 'pending' && !m.admin_response && <Clock className="w-2.5 h-2.5 text-amber-400" />}
                      </div>
                    </div>
                  </div>
                  {/* Admin reply (right) */}
                  {m.admin_response && (
                    <div className="flex justify-end mt-2">
                      <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm text-white"
                        style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                        <div className="whitespace-pre-wrap">{m.admin_response}</div>
                        <div className="text-[9px] mt-1 opacity-70 font-mono flex items-center gap-1">
                          {m.responded_at ? new Date(m.responded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          <CheckCircle className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5 flex gap-2">
              <input value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && text.trim()) {
                    const pending = currentThread.messages.find(m => !m.admin_response);
                    if (pending) replyMutation.mutate({ id: pending.id, response: text.trim() });
                  }
                }}
                placeholder="Reply to user…"
                className="flex-1 rounded-xl px-4 py-3 text-sm text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button
                onClick={() => {
                  if (!text.trim()) return;
                  const pending = currentThread.messages.find(m => !m.admin_response);
                  if (pending) replyMutation.mutate({ id: pending.id, response: text.trim() });
                }}
                disabled={!text.trim() || replyMutation.isPending}
                className="px-4 rounded-xl text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}