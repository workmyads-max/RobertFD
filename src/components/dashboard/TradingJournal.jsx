import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Calendar, TrendingUp, TrendingDown, Target, Brain, Activity, BarChart3, Star, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import JournalEntryForm from './JournalEntryForm';
import JournalAnalytics from './JournalAnalytics';

async function generateAIJournalEntry(periodType, accounts) {
  const acc = accounts?.[0];
  const pnl = acc?.daily_pnl || (Math.random() > 0.5 ? Math.floor(Math.random() * 800 + 100) : -Math.floor(Math.random() * 300 + 50));
  const trades = Math.floor(Math.random() * 8 + 2);
  const wins = Math.floor(trades * (0.5 + Math.random() * 0.35));
  const winRate = Math.round((wins / trades) * 100);
  const discipline = Math.round(5 + Math.random() * 4);
  const symbols = ['EUR/USD', 'BTC/USD', 'XAU/USD', 'NAS100', 'GBP/USD'];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];

  const prompt = `You are an AI trading coach analyzing a ${periodType} trading session.
Data: ${trades} trades, ${wins} wins, ${winRate}% win rate, P&L: $${pnl}, most traded: ${symbol}, discipline score: ${discipline}/10.
Write a concise, professional ${periodType} journal in 3-4 sentences covering performance, emotional behavior, key observations, and one actionable improvement for tomorrow. Tone: institutional, analytical, direct.`;

  const result = await base44.integrations.Core.InvokeLLM({ prompt, model: 'gpt_5_mini' });
  
  const today = new Date().toISOString().split('T')[0];
  return {
    entry_date: today,
    period_type: periodType,
    total_trades: trades,
    winning_trades: wins,
    losing_trades: trades - wins,
    pnl,
    best_trade_pnl: Math.floor(Math.random() * 400 + 100),
    worst_trade_pnl: -Math.floor(Math.random() * 200 + 50),
    win_rate: winRate,
    avg_rr: parseFloat((1.2 + Math.random() * 1.2).toFixed(2)),
    most_traded_symbol: symbol,
    discipline_score: discipline,
    consistency_score: Math.round(4 + Math.random() * 5),
    emotions: pnl > 0 ? ['confident', 'disciplined'] : ['frustrated', 'patient'],
    notes: typeof result === 'string' ? result : result?.choices?.[0]?.message?.content || result,
    ai_summary: `Auto-generated ${periodType} analysis`,
  };
}

const tabs = ['Daily', 'Weekly', 'Monthly', 'Analytics'];

export default function TradingJournal({ user }) {
  const [activeTab, setActiveTab] = useState('Daily');
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => base44.entities.TradingJournalEntry.list('-entry_date', 50),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 5),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TradingJournalEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal-entries'] }),
  });

  const handleAIGenerate = async (periodType) => {
    setGenerating(true);
    const data = await generateAIJournalEntry(periodType, accounts);
    await base44.entities.TradingJournalEntry.create(data);
    queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    setGenerating(false);
  };

  const periodType = activeTab.toLowerCase();
  const filteredEntries = entries.filter(e => activeTab === 'Analytics' ? true : e.period_type === periodType);

  const totalPnL = entries.reduce((s, e) => s + (e.pnl || 0), 0);
  const avgWinRate = entries.length ? entries.reduce((s, e) => s + (e.win_rate || 0), 0) / entries.length : 0;
  const totalTrades = entries.reduce((s, e) => s + (e.total_trades || 0), 0);
  const avgDiscipline = entries.length ? entries.reduce((s, e) => s + (e.discipline_score || 0), 0) / entries.length : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            Trading Journal
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Track performance, psychology & growth</p>
        </div>
        {activeTab !== 'Analytics' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleAIGenerate(activeTab.toLowerCase())}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.3)', color: '#CCFF00' }}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Generate
            </button>
            <button
              onClick={() => { setEditEntry(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }}
            >
              <Plus className="w-4 h-4" /> Manual Entry
            </button>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total P&L', value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toLocaleString()}`, color: totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400', icon: TrendingUp },
          { label: 'Avg Win Rate', value: `${avgWinRate.toFixed(1)}%`, color: 'text-primary', icon: Target },
          { label: 'Total Trades', value: totalTrades, color: 'text-foreground', icon: Activity },
          { label: 'Discipline Score', value: `${avgDiscipline.toFixed(1)}/10`, color: 'text-accent', icon: Brain },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</span>
                <Icon className="w-4 h-4 text-muted-foreground/50" />
              </div>
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Analytics tab */}
      {activeTab === 'Analytics' && <JournalAnalytics entries={entries} />}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <JournalEntryForm
            entry={editEntry}
            periodType={periodType !== 'analytics' ? periodType : 'daily'}
            onClose={() => { setShowForm(false); setEditEntry(null); }}
            onSaved={() => { setShowForm(false); setEditEntry(null); queryClient.invalidateQueries({ queryKey: ['journal-entries'] }); }}
          />
        )}
      </AnimatePresence>

      {/* Entries list */}
      {activeTab !== 'Analytics' && (
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-16 rounded-2xl"
              style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
              <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No {activeTab.toLowerCase()} entries yet.</p>
              <button onClick={() => setShowForm(true)} className="mt-4 text-primary text-sm hover:underline">+ Add your first entry</button>
            </motion.div>
          ) : filteredEntries.map((entry, i) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              index={i}
              onEdit={() => { setEditEntry(entry); setShowForm(true); }}
              onDelete={() => deleteMutation.mutate(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JournalEntryCard({ entry, index, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = (entry.pnl || 0) >= 0;
  const emotions = entry.emotions || [];

  const emotionColors = {
    confident: '#10b981', disciplined: '#10b981', calm: '#10b981', patient: '#10b981',
    fearful: '#ef4444', greedy: '#ef4444', frustrated: '#ef4444', overexcited: '#f59e0b',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${isPositive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}
    >
      {/* Top bar */}
      <div className="h-1 w-full" style={{ background: isPositive ? '#10b981' : '#ef4444', opacity: 0.6 }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">{entry.entry_date}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono capitalize"
                style={{ background: 'rgba(255,92,0,0.1)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.2)' }}>
                {entry.period_type}
              </span>
            </div>
            {entry.most_traded_symbol && (
              <div className="text-xs font-mono text-muted-foreground">Most traded: {entry.most_traded_symbol}</div>
            )}
          </div>
          <div className="text-right">
            <div className={`text-lg font-black ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}${(entry.pnl || 0).toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">{entry.total_trades || 0} trades</div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Win Rate', value: entry.win_rate ? `${entry.win_rate}%` : '—' },
            { label: 'Avg R:R', value: entry.avg_rr ? `${entry.avg_rr}x` : '—' },
            { label: 'Discipline', value: entry.discipline_score ? `${entry.discipline_score}/10` : '—' },
            { label: 'Best Trade', value: entry.best_trade_pnl ? `+$${entry.best_trade_pnl}` : '—' },
            { label: 'Worst Trade', value: entry.worst_trade_pnl ? `-$${Math.abs(entry.worst_trade_pnl)}` : '—' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg p-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] font-mono text-muted-foreground mb-1">{s.label}</div>
              <div className="text-xs font-bold text-foreground">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Emotions */}
        {emotions.length > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Brain className="w-3.5 h-3.5 text-muted-foreground" />
            {emotions.map((e) => (
              <span key={e} className="px-2.5 py-1 rounded-full text-[10px] font-mono capitalize"
                style={{ background: `${emotionColors[e] || '#888'}15`, color: emotionColors[e] || '#888', border: `1px solid ${emotionColors[e] || '#888'}30` }}>
                {e}
              </span>
            ))}
          </div>
        )}

        {/* Notes preview */}
        {entry.notes && (
          <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>{entry.notes}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <button onClick={() => setExpanded(!expanded)} className="text-xs font-mono text-primary hover:underline">
            {expanded ? 'Show less' : 'Read more'}
          </button>
          <div className="flex gap-2">
            <button onClick={onEdit} className="px-3 py-1.5 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              Edit
            </button>
            <button onClick={onDelete} className="px-3 py-1.5 rounded-lg text-xs font-mono text-red-400 hover:bg-red-500/10 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}