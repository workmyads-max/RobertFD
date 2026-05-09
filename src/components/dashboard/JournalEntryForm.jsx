import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Brain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const EMOTIONS = ['confident', 'fearful', 'greedy', 'disciplined', 'frustrated', 'calm', 'overexcited', 'patient'];

const emotionColors = {
  confident: '#10b981', disciplined: '#10b981', calm: '#10b981', patient: '#10b981',
  fearful: '#ef4444', greedy: '#ef4444', frustrated: '#ef4444', overexcited: '#f59e0b',
};

export default function JournalEntryForm({ entry, periodType, onClose, onSaved }) {
  const [form, setForm] = useState({
    entry_date: entry?.entry_date || new Date().toISOString().split('T')[0],
    period_type: entry?.period_type || periodType || 'daily',
    notes: entry?.notes || '',
    emotions: entry?.emotions || [],
    mistakes: entry?.mistakes || '',
    strengths: entry?.strengths || '',
    strategy_notes: entry?.strategy_notes || '',
    total_trades: entry?.total_trades || '',
    winning_trades: entry?.winning_trades || '',
    losing_trades: entry?.losing_trades || '',
    pnl: entry?.pnl || '',
    best_trade_pnl: entry?.best_trade_pnl || '',
    worst_trade_pnl: entry?.worst_trade_pnl || '',
    win_rate: entry?.win_rate || '',
    avg_rr: entry?.avg_rr || '',
    most_traded_symbol: entry?.most_traded_symbol || '',
    discipline_score: entry?.discipline_score || '',
    consistency_score: entry?.consistency_score || '',
  });

  const saveMutation = useMutation({
    mutationFn: (data) => entry
      ? base44.entities.TradingJournalEntry.update(entry.id, data)
      : base44.entities.TradingJournalEntry.create(data),
    onSuccess: onSaved,
  });

  const toggleEmotion = (e) => {
    setForm(f => ({
      ...f,
      emotions: f.emotions.includes(e) ? f.emotions.filter(x => x !== e) : [...f.emotions, e],
    }));
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const clean = { ...form };
    ['total_trades','winning_trades','losing_trades','pnl','best_trade_pnl','worst_trade_pnl','win_rate','avg_rr','discipline_score','consistency_score'].forEach(k => {
      if (clean[k] !== '') clean[k] = parseFloat(clean[k]);
      else delete clean[k];
    });
    saveMutation.mutate(clean);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-white/5"
          style={{ background: '#0e0e10', zIndex: 1 }}>
          <div>
            <h2 className="text-lg font-black text-foreground">{entry ? 'Edit Journal Entry' : 'New Journal Entry'}</h2>
            <p className="text-xs text-muted-foreground font-mono">Track your trading session</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Date</label>
              <input type="date" value={form.entry_date} onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} required />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Period</label>
              <select value={form.period_type} onChange={e => setForm(f => ({ ...f, period_type: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Trading stats */}
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-3 block uppercase tracking-wider">Trading Statistics</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'total_trades', label: 'Total Trades', type: 'number' },
                { key: 'winning_trades', label: 'Winning', type: 'number' },
                { key: 'losing_trades', label: 'Losing', type: 'number' },
                { key: 'pnl', label: 'P&L ($)', type: 'number' },
                { key: 'win_rate', label: 'Win Rate (%)', type: 'number' },
                { key: 'avg_rr', label: 'Avg R:R', type: 'number' },
                { key: 'best_trade_pnl', label: 'Best Trade ($)', type: 'number' },
                { key: 'worst_trade_pnl', label: 'Worst Trade ($)', type: 'number' },
                { key: 'most_traded_symbol', label: 'Top Symbol', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-mono text-muted-foreground mb-1 block">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="—"
                    className="w-full rounded-xl px-3 py-2 text-sm text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'discipline_score', label: 'Discipline Score (0-10)' },
              { key: 'consistency_score', label: 'Consistency Score (0-10)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">{label}</label>
                <input type="number" min="0" max="10" step="0.1" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="0-10"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            ))}
          </div>

          {/* Emotions */}
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-3 block uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-3 h-3" /> Emotional State
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((e) => {
                const selected = form.emotions.includes(e);
                return (
                  <button key={e} type="button" onClick={() => toggleEmotion(e)}
                    className="px-3 py-1.5 rounded-full text-xs font-mono capitalize transition-all"
                    style={selected
                      ? { background: `${emotionColors[e]}20`, color: emotionColors[e], border: `1px solid ${emotionColors[e]}50` }
                      : { background: 'rgba(255,255,255,0.04)', color: '#666', border: '1px solid rgba(255,255,255,0.08)' }
                    }>
                    {e}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text areas */}
          {[
            { key: 'notes', label: 'Journal Notes', placeholder: 'What happened today? How did you feel about your trading?' },
            { key: 'mistakes', label: 'Mistakes Made', placeholder: 'What mistakes did you make? How to avoid them?' },
            { key: 'strengths', label: 'Strengths Displayed', placeholder: 'What did you do well? What to replicate?' },
            { key: 'strategy_notes', label: 'Strategy Notes', placeholder: 'Any strategy observations, setups, or ideas...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">{label}</label>
              <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} rows={3}
                className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none resize-none leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saveMutation.isPending}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }}>
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}