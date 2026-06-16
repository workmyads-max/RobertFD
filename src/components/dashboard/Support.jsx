import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeadphonesIcon, Plus, CheckCircle, Clock, AlertCircle, ExternalLink, MessageCircle, Mail, Zap, Shield, Users, Globe } from 'lucide-react';
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
  { q: 'What is the profit split?', a: 'XFunded Trader offers an 80/20 profit split — 80% goes to you.' },
  { q: 'Can I trade news events?', a: 'Swing accounts allow news trading. Standard accounts restrict trading during major news events.' },
  { q: 'How do I request a payout?', a: 'Navigate to Withdrawals in your dashboard and click "Request Payout". Payouts are processed within 24 hours.' },
];

export default function Support() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'technical', message: '' });
  const [openFaq, setOpenFaq] = useState(null);
  const qc = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const result = await base44.entities.SupportTicket.list('-created_date', 20);
      return result || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create({ ...data, status: 'open', priority: 'medium' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['support-tickets'] }); setShowForm(false); setForm({ subject: '', category: 'technical', message: '' }); },
  });

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

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

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Open Tickets', value: openTickets, sub: 'Awaiting response', icon: Clock, color: '#f59e0b' },
          { label: 'Resolved', value: resolvedTickets, sub: 'Successfully closed', icon: CheckCircle, color: '#10b981' },
          { label: 'Avg Response', value: '~15m', sub: 'Support team online', icon: Zap, color: ACCENT },
        ].map((s, i) => (
          <div key={s.label} className="rounded-2xl p-5 flex flex-col justify-between"
            style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)', minHeight: '120px' }}>
            <div>
              <div className="text-white/40 text-xs font-semibold mb-1">{s.label}</div>
              <div className="text-3xl font-black text-white">{s.value}</div>
              {s.sub && <div className="text-xs mt-1 text-white/25">{s.sub}</div>}
            </div>
            <div className="mt-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick contact cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Email Support', value: 'support@xfundedtrader.com', icon: Mail, desc: 'Get help via email' },
          { label: 'Live Chat', value: 'Available 24/7', icon: MessageCircle, desc: 'Instant assistance' },
          { label: 'Knowledge Base', value: 'Browse Articles', icon: Globe, desc: 'Self-serve resources' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)' }}>
            <s.icon className="w-6 h-6 mb-3" style={{ color: ACCENT }} />
            <div className="text-xs font-semibold text-white mb-1">{s.label}</div>
            <div className="text-[11px] text-white/30">{s.desc}</div>
            <div className="text-sm font-bold text-white mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-white mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
                <span className="text-sm font-semibold text-white">{faq.q}</span>
                <span className="text-white/30 ml-4 text-lg">{openFaq === i ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
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

      {/* Tickets */}
      <div>
        <h2 className="text-sm font-bold text-white mb-4">My Tickets</h2>
        {tickets.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: '#121212', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <HeadphonesIcon className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No tickets yet. Create one if you need help!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const cfg = STATUS_CFG[t.status] || STATUS_CFG.open;
              const Icon = cfg.icon;
              return (
                <div key={t.id} className="rounded-2xl p-5" style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{t.subject}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-white/40 mb-2">{t.message}</div>
                  {t.admin_reply && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-[10px] font-mono text-white/30 mb-1">Admin Reply:</div>
                      <div className="text-sm text-white/70 leading-relaxed">{t.admin_reply}</div>
                    </div>
                  )}
                  <div className="text-[10px] text-white/20 mt-2 font-mono">
                    Status: {t.status} · {new Date(t.created_date).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form modal */}
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
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white text-xl">×</button>
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
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
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