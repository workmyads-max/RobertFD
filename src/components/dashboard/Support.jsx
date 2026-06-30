import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeadphonesIcon, Plus, CheckCircle, Clock, AlertCircle, MessageCircle,
  Mail, Zap, Globe, Send, X, ChevronDown, ExternalLink,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ACCENT = '#CCFF00';

const STATUS_CFG = {
  open: { label: 'Open', color: '#f59e0b', icon: Clock },
  in_progress: { label: 'In Progress', color: '#60a5fa', icon: AlertCircle },
  resolved: { label: 'Resolved', color: '#10b981', icon: CheckCircle },
  closed: { label: 'Closed', color: '#666', icon: CheckCircle },
};

const CATEGORIES = ['billing', 'technical', 'account', 'withdrawal', 'other'];

const FAQS = [
  { q: 'How long does account delivery take?', a: 'Funded account credentials are delivered within 1-24 hours after payment confirmation.' },
  { q: 'What platforms does XFunded Trader support?', a: 'Currently XFunded Trader (our native platform). MT5 and TradeLocker are coming soon.' },
  { q: 'What is the profit split?', a: 'XFunded Trader offers an 80/20 profit split - 80% goes to you.' },
  { q: 'Can I trade news events?', a: 'Swing accounts allow news trading. Standard accounts restrict trading during major news events.' },
  { q: 'How do I request a payout?', a: 'Navigate to Withdrawals in your dashboard and click "Request Payout". Payouts are processed within 24 hours.' },
];

const KB_LINKS = [
  { label: 'Challenge Rules', href: '#rules' },
  { label: 'Withdrawals Guide', href: '#withdrawals' },
  { label: 'Account Overview', href: '#account-overview' },
  { label: 'Pricing & Plans', href: '#pricing' },
];

export default function Support() {
  const [tab, setTab] = useState('tickets'); // tickets | chat | faq
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'technical', message: '' });
  const [openFaq, setOpenFaq] = useState(null);
  const qc = useQueryClient();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const userEmail = me?.email;

  // Scoped to current user via RLS - but we also pass user_email filter for safety
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const result = await base44.entities.SupportTicket.filter({ user_email: userEmail });
      return Array.isArray(result) ? result.sort((a, b) =>
        new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()) : [];
    },
    enabled: !!userEmail,
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create({
      ...data, user_email: userEmail, status: 'open', priority: 'medium',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets', userEmail] });
      setShowForm(false);
      setForm({ subject: '', category: 'technical', message: '' });
    },
  });

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  // Average response time from resolved/in-progress tickets that have an admin_reply
  const avgResponse = (() => {
    const withReply = tickets.filter(t => t.admin_reply && t.created_date);
    if (withReply.length === 0) return null;
    const ms = withReply.reduce((s, t) => {
      const created = new Date(t.created_date).getTime();
      const replied = new Date(t.updated_date || t.created_date).getTime();
      return s + Math.max(0, replied - created);
    }, 0) / withReply.length;
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.round(mins / 60)}h`;
  })();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Support Center</h1>
          <p className="text-xs text-white/30">Get help from the XFunded Trader team</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
          style={{ background: ACCENT }}>
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Quick stats - computed from real data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Open Tickets', value: ticketsLoading ? '-' : openTickets, sub: 'Awaiting response', icon: Clock, color: '#f59e0b' },
          { label: 'Resolved', value: ticketsLoading ? '-' : resolvedTickets, sub: 'Successfully closed', icon: CheckCircle, color: '#10b981' },
          { label: 'Avg Response', value: avgResponse || '-', sub: 'Across your tickets', icon: Zap, color: ACCENT },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5 flex flex-col justify-between"
            style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)', minHeight: '120px' }}>
            <div>
              <div className="text-white/40 text-xs font-semibold mb-1">{s.label}</div>
              <div className="text-3xl font-black text-white">{s.value}</div>
              {s.sub && <div className="text-xs mt-1 text-white/25">{s.sub}</div>}
            </div>
            <div className="mt-2"><s.icon className="w-4 h-4" style={{ color: s.color }} /></div>
          </div>
        ))}
      </div>

      {/* Quick contact cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-5" style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Mail className="w-6 h-6 mb-3" style={{ color: ACCENT }} />
          <div className="text-xs font-semibold text-white mb-1">Email Support</div>
          <div className="text-[11px] text-white/30">Get help via email</div>
          <div className="text-sm font-bold text-white mt-0.5">support@xfundedtrader.com</div>
        </div>
        <button onClick={() => setTab('chat')}
          className="text-left rounded-2xl p-5 transition-all hover:bg-white/[0.02]"
          style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)' }}>
          <MessageCircle className="w-6 h-6 mb-3" style={{ color: ACCENT }} />
          <div className="text-xs font-semibold text-white mb-1">Live Chat</div>
          <div className="text-[11px] text-white/30">Instant assistance</div>
          <div className="text-sm font-bold text-white mt-0.5">Open chat →</div>
        </button>
        <button onClick={() => setTab('faq')}
          className="text-left rounded-2xl p-5 transition-all hover:bg-white/[0.02]"
          style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Globe className="w-6 h-6 mb-3" style={{ color: ACCENT }} />
          <div className="text-xs font-semibold text-white mb-1">Knowledge Base</div>
          <div className="text-[11px] text-white/30">Self-serve resources</div>
          <div className="text-sm font-bold text-white mt-0.5">Browse Articles</div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'tickets', label: 'My Tickets' },
          { id: 'chat', label: 'Live Chat' },
          { id: 'faq', label: 'FAQ & Knowledge Base' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === t.id ? 'text-black' : 'text-white/40 hover:text-white/70'}`}
            style={tab === t.id ? { background: ACCENT } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'tickets' && (
        <TicketList tickets={tickets} loading={ticketsLoading} onCreate={() => setShowForm(true)} />
      )}
      {tab === 'chat' && <LiveChat userEmail={userEmail} userName={me?.full_name} />}
      {tab === 'faq' && <FaqKb openFaq={openFaq} setOpenFaq={setOpenFaq} />}

      {/* New ticket modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl"
              style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-black text-white">New Support Ticket</h2>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-mono text-white/40 mb-1.5 block uppercase">Subject *</label>
                  <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief description of your issue"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className="text-xs font-mono text-white/40 mb-1.5 block uppercase">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none capitalize"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#121212] capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-white/40 mb-1.5 block uppercase">Message *</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4}
                    placeholder="Describe your issue in detail..."
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm text-white/40 hover:text-white/70" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={() => createMutation.mutate(form)} disabled={!form.subject || !form.message || createMutation.isPending}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-black disabled:opacity-40"
                    style={{ background: ACCENT }}>
                    {createMutation.isPending ? 'Sending...' : 'Submit Ticket'}
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

// ── Ticket list ──────────────────────────────────────────────────────────────
function TicketList({ tickets, loading, onCreate }) {
  if (loading) {
    return <div className="py-16 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }
  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl" style={{ background: '#121212', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <HeadphonesIcon className="w-8 h-8 text-white/10 mx-auto mb-3" />
        <p className="text-sm text-white/30 mb-4">No tickets yet. Create one if you need help!</p>
        <button onClick={onCreate} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: ACCENT }}>New Ticket</button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {tickets.map((t) => {
        const cfg = STATUS_CFG[t.status] || STATUS_CFG.open;
        const Icon = cfg.icon;
        return (
          <div key={t.id} className="rounded-2xl p-5" style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-2 gap-3">
              <span className="text-sm font-semibold text-white truncate">{t.subject}</span>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
                <Icon className="w-3 h-3" />{cfg.label}
              </span>
            </div>
            <div className="text-xs text-white/40 mb-2 whitespace-pre-wrap">{t.message}</div>
            {t.admin_reply && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-[10px] font-mono text-white/30 mb-1 flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> Admin Reply:
                </div>
                <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{t.admin_reply}</div>
              </div>
            )}
            <div className="text-[10px] text-white/20 mt-2 font-mono">
              #{t.id?.slice(0, 8)} · {t.category} · {t.created_date ? new Date(t.created_date).toLocaleDateString() : '-'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Live chat ────────────────────────────────────────────────────────────────
function LiveChat({ userEmail, userName }) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  // Scoped to current user via RLS (sender_email = {{user.email}})
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['live-chat', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const result = await base44.entities.LiveChatMessage.filter({ sender_email: userEmail });
      return Array.isArray(result) ? result.sort((a, b) =>
        new Date(a.created_at || a.created_date || 0).getTime() - new Date(b.created_at || b.created_date || 0).getTime()) : [];
    },
    enabled: !!userEmail,
    refetchInterval: 4000,
    placeholderData: (prev) => prev,
  });

  const sendMutation = useMutation({
    mutationFn: (message) => base44.entities.LiveChatMessage.create({
      message, sender_email: userEmail, sender_name: userName || userEmail,
      status: 'pending', created_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['live-chat', userEmail] });
      setText('');
    },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (!userEmail) {
    return <div className="py-16 text-center text-sm text-white/30">Loading chat…</div>;
  }

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)', height: '70vh' }}>
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
        <MessageCircle className="w-4 h-4" style={{ color: ACCENT }} />
        <span className="text-sm font-bold text-white">Live Chat</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-white/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">Start the conversation - send a message below.</p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id}>
              {/* User message (right) */}
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm text-black"
                  style={{ background: ACCENT }}>
                  <div className="whitespace-pre-wrap">{m.message}</div>
                  <div className="text-[9px] mt-1 opacity-50 font-mono">
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
              {/* Admin reply (left) */}
              {m.admin_response && (
                <div className="flex justify-start mt-2">
                  <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm text-white"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="text-[9px] font-mono text-white/40 mb-0.5">XFunded Support</div>
                    <div className="whitespace-pre-wrap">{m.admin_response}</div>
                    <div className="text-[9px] mt-1 text-white/30 font-mono">
                      {m.responded_at ? new Date(m.responded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-white/5 flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && text.trim() && !sendMutation.isPending) sendMutation.mutate(text.trim()); }}
          placeholder="Type your message…"
          className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        <button onClick={() => text.trim() && sendMutation.mutate(text.trim())} disabled={!text.trim() || sendMutation.isPending}
          className="px-4 rounded-xl text-black disabled:opacity-40"
          style={{ background: ACCENT }}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── FAQ + Knowledge Base ─────────────────────────────────────────────────────
function FaqKb({ openFaq, setOpenFaq }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-bold text-white mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
                <span className="text-sm font-semibold text-white pr-3">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-white/30 transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-4 text-sm text-white/40 border-t border-white/5">
                    <div className="pt-3">{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-white mb-4">Knowledge Base</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {KB_LINKS.map(l => (
            <a key={l.href} href={l.href}
              className="flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-white/[0.02] transition-colors"
              style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm font-semibold text-white">{l.label}</span>
              <ExternalLink className="w-4 h-4 text-white/30" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}