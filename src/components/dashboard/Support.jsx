import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeadphonesIcon, Plus, MessageCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const STATUS_CFG = {
  open: { label: 'Open', color: '#f59e0b', icon: Clock },
  in_progress: { label: 'In Progress', color: '#60a5fa', icon: AlertCircle },
  resolved: { label: 'Resolved', color: '#10b981', icon: CheckCircle },
  closed: { label: 'Closed', color: '#666', icon: CheckCircle },
};

const CATEGORIES = ['billing', 'technical', 'account', 'withdrawal', 'other'];

const FAQS = [
  { q: 'How long does account delivery take?', a: 'Funded account credentials are delivered within 1-24 hours after payment confirmation.' },
  { q: 'What platforms does Robert Funds support?', a: 'Currently RF XTrading (our native platform). MT5 and TradeLocker are coming soon.' },
  { q: 'What is the profit split?', a: 'Robert Funds offers an 80/20 profit split — 80% goes to you.' },
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
    queryFn: () => base44.entities.SupportTicket.list('-created_date', 20),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create({ ...data, status: 'open', priority: 'medium' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['support-tickets'] }); setShowForm(false); setForm({ subject: '', category: 'technical', message: '' }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <HeadphonesIcon className="w-6 h-6 text-primary" /> Support Center
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Get help from the Robert Funds team</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Quick contact */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Email Support', value: 'support@robertfunds.com', icon: '✉️' },
          { label: 'Live Chat', value: 'Available 24/7', icon: '💬' },
          { label: 'Response Time', value: 'Avg ~15 minutes', icon: '⚡' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-xs font-mono text-muted-foreground">{s.label}</div>
            <div className="text-sm font-semibold text-foreground mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mb-8">
        <h2 className="text-base font-bold text-foreground mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
                <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                <span className="text-muted-foreground ml-4">{openFaq === i ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-4 text-sm text-muted-foreground border-t border-white/5">
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
        <h2 className="text-base font-bold text-foreground mb-4">My Tickets</h2>
        {tickets.length === 0 ? (
          <div className="text-center py-10 rounded-2xl text-sm text-muted-foreground" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
            No tickets yet. Create one if you need help!
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t, i) => {
              const cfg = STATUS_CFG[t.status] || STATUS_CFG.open;
              const Icon = cfg.icon;
              return (
                <div key={t.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">{t.subject}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">{t.message}</div>
                  {t.admin_reply && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-[10px] font-mono text-muted-foreground mb-1">Admin Reply:</div>
                      <div className="text-sm text-foreground/80 leading-relaxed">{t.admin_reply}</div>
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground/50 mt-2 font-mono">
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
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-black">New Support Ticket</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Subject *</label>
                  <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief description of your issue"
                    className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Message *</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4}
                    placeholder="Describe your issue in detail..."
                    className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={() => createMutation.mutate(form)} disabled={!form.subject || !form.message || createMutation.isPending}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
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