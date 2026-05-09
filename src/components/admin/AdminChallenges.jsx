import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Edit2, Trash2, Plus, Save, X, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CHALLENGE_DEFAULTS = [
  { id: 'two-step-std-100k', name: 'Two-Step Standard $100K', type: 'two-step', accountType: 'standard', size: 100000, price: 299, leverage: '1:100', phase1Target: 10, phase2Target: 5, dailyDD: 5, maxDD: 10, newsTrading: false, overnightHolding: false, weekendHolding: false, hedging: false, maxLots: 20, profitSplit: 80 },
  { id: 'two-step-swing-50k', name: 'Two-Step Swing $50K', type: 'two-step', accountType: 'swing', size: 50000, price: 199, leverage: '1:100', phase1Target: 10, phase2Target: 5, dailyDD: 5, maxDD: 10, newsTrading: true, overnightHolding: true, weekendHolding: true, hedging: true, maxLots: 5, profitSplit: 80 },
  { id: 'instant-std-100k', name: 'Instant Standard $100K', type: 'instant', accountType: 'standard', size: 100000, price: 149, leverage: '1:100', phase1Target: 8, phase2Target: 0, dailyDD: 3, maxDD: 8, newsTrading: false, overnightHolding: false, weekendHolding: false, hedging: false, maxLots: 20, profitSplit: 80 },
  { id: 'instant-swing-50k', name: 'Instant Swing $50K', type: 'instant', accountType: 'swing', size: 50000, price: 99, leverage: '1:100', phase1Target: 8, phase2Target: 0, dailyDD: 3, maxDD: 8, newsTrading: true, overnightHolding: true, weekendHolding: true, hedging: true, maxLots: 5, profitSplit: 80 },
  { id: 'two-step-std-250k', name: 'Two-Step Standard $250K', type: 'two-step', accountType: 'standard', size: 250000, price: 599, leverage: '1:100', phase1Target: 10, phase2Target: 5, dailyDD: 5, maxDD: 10, newsTrading: false, overnightHolding: false, weekendHolding: false, hedging: false, maxLots: 20, profitSplit: 80 },
  { id: 'instant-std-50k', name: 'Instant Standard $50K', type: 'instant', accountType: 'standard', size: 50000, price: 79, leverage: '1:100', phase1Target: 8, phase2Target: 0, dailyDD: 3, maxDD: 8, newsTrading: false, overnightHolding: false, weekendHolding: false, hedging: false, maxLots: 20, profitSplit: 80 },
];

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState(CHALLENGE_DEFAULTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAccountType, setFilterAccountType] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({});

  const filteredChallenges = challenges.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase()) || ch.id.includes(searchQuery);
    const matchesType = filterType === 'all' || ch.type === filterType;
    const matchesAccountType = filterAccountType === 'all' || ch.accountType === filterAccountType;
    return matchesSearch && matchesType && matchesAccountType;
  });

  const handleEdit = (challenge) => {
    setEditingId(challenge.id);
    setFormData(challenge);
    setShowAddForm(false);
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({
      id: `custom-${Date.now()}`,
      name: '',
      type: 'two-step',
      accountType: 'standard',
      size: 100000,
      price: 0,
      leverage: '1:100',
      phase1Target: 10,
      phase2Target: 5,
      dailyDD: 5,
      maxDD: 10,
      newsTrading: false,
      overnightHolding: false,
      weekendHolding: false,
      hedging: false,
      maxLots: 20,
      profitSplit: 80,
    });
  };

  const handleSave = () => {
    if (editingId) {
      setChallenges(c => c.map(ch => ch.id === editingId ? formData : ch));
      setEditingId(null);
    } else if (showAddForm) {
      setChallenges(c => [...c, formData]);
      setShowAddForm(false);
    }
    setFormData({});
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this challenge?')) {
      setChallenges(c => c.filter(ch => ch.id !== id));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-primary" /> Manage Challenges
        </h1>
        <p className="text-base text-muted-foreground font-mono">Configure pricing, rules, and settings for all trading challenges</p>
      </div>

      {/* Add New Challenge Button */}
      <div className="mb-6">
        <button onClick={handleAddNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
          <Plus className="w-4 h-4" /> Create Challenge Plan
        </button>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-foreground outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">Challenge Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs text-foreground outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <option value="all">All Types</option>
              <option value="two-step">Two-Step</option>
              <option value="instant">Instant</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">Account Type</label>
            <select value={filterAccountType} onChange={e => setFilterAccountType(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs text-foreground outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <option value="all">All Accounts</option>
              <option value="standard">Standard</option>
              <option value="swing">Swing</option>
            </select>
          </div>

          <div className="text-xs font-mono text-muted-foreground pt-6">
            {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="rounded-xl p-6 mb-6 border"
            style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <h3 className="text-lg font-bold text-foreground mb-4">Create New Challenge Plan</h3>
            <ChallengeForm formData={formData} setFormData={setFormData} onSave={handleSave} onCancel={() => setShowAddForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenges List */}
      <div className="space-y-3">
        {filteredChallenges.length === 0 ? (
          <div className="rounded-lg p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p className="text-sm text-muted-foreground">No challenges match your filters.</p>
          </div>
        ) : (
          filteredChallenges.map((challenge, idx) => (
            <motion.div key={challenge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl p-5 border"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

              {editingId === challenge.id ? (
                <ChallengeForm formData={formData} setFormData={setFormData} onSave={handleSave} onCancel={() => setEditingId(null)} />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-foreground">{challenge.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-primary"
                          style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.2)' }}>
                          ${challenge.price}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono"
                          style={{ background: 'rgba(204,255,0,0.12)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.2)' }}>
                          ID: {challenge.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground/70">
                        <div>Account Size: <span className="text-foreground font-mono">${challenge.size.toLocaleString()}</span></div>
                        <div>Type: <span className="text-foreground font-mono">{challenge.type === 'two-step' ? 'Two-Step' : 'Instant'}</span></div>
                        <div>Account: <span className="text-foreground capitalize font-mono">{challenge.accountType}</span></div>
                        <div>Leverage: <span className="text-foreground font-mono">{challenge.leverage}</span></div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>P1 Target: <span className="text-primary font-bold">{challenge.phase1Target}%</span></div>
                          {challenge.type === 'two-step' && <div>P2 Target: <span className="text-primary font-bold">{challenge.phase2Target}%</span></div>}
                          <div>Daily DD: <span className="text-red-400 font-bold">{challenge.dailyDD}%</span></div>
                          <div>Max DD: <span className="text-red-400 font-bold">{challenge.maxDD}%</span></div>
                          <div>Profit Split: <span className="text-emerald-400 font-bold">{challenge.profitSplit}%</span></div>
                          <div>Max Lots: <span className="text-foreground font-mono">{challenge.maxLots}</span></div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex gap-2 flex-wrap text-[10px]">
                          {challenge.newsTrading && <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono">✓ News Trading</span>}
                          {!challenge.newsTrading && <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 font-mono">✗ No News</span>}
                          {challenge.overnightHolding && <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono">✓ Overnight</span>}
                          {!challenge.overnightHolding && <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 font-mono">✗ No Overnight</span>}
                          {challenge.weekendHolding && <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono">✓ Weekend</span>}
                          {!challenge.weekendHolding && <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 font-mono">✗ No Weekend</span>}
                          {challenge.hedging && <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono">✓ Hedging</span>}
                          {!challenge.hedging && <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 font-mono">✗ No Hedging</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEdit(challenge)}
                        className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(challenge.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function ChallengeForm({ formData, setFormData, onSave, onCancel }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Type</label>
          <select value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="two-step">Two-Step</option>
            <option value="instant">Instant</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Account Type</label>
          <select value={formData.accountType} onChange={e => setFormData(f => ({ ...f, accountType: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="standard">Standard</option>
            <option value="swing">Swing</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Account Size ($)</label>
          <input type="number" value={formData.size} onChange={e => setFormData(f => ({ ...f, size: parseInt(e.target.value) }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Price (USD)</label>
          <input type="number" value={formData.price} onChange={e => setFormData(f => ({ ...f, price: parseInt(e.target.value) }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Leverage</label>
          <input type="text" value={formData.leverage} onChange={e => setFormData(f => ({ ...f, leverage: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">P1 Target (%)</label>
          <input type="number" value={formData.phase1Target} onChange={e => setFormData(f => ({ ...f, phase1Target: parseInt(e.target.value) }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        {formData.type === 'two-step' && (
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">P2 Target (%)</label>
            <input type="number" value={formData.phase2Target} onChange={e => setFormData(f => ({ ...f, phase2Target: parseInt(e.target.value) }))}
              className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        )}
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Daily DD (%)</label>
          <input type="number" value={formData.dailyDD} onChange={e => setFormData(f => ({ ...f, dailyDD: parseInt(e.target.value) }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Max DD (%)</label>
          <input type="number" value={formData.maxDD} onChange={e => setFormData(f => ({ ...f, maxDD: parseInt(e.target.value) }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Max Lots</label>
          <input type="number" value={formData.maxLots} onChange={e => setFormData(f => ({ ...f, maxLots: parseInt(e.target.value) }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Profit Split (%)</label>
          <input type="number" value={formData.profitSplit} onChange={e => setFormData(f => ({ ...f, profitSplit: parseInt(e.target.value) }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
      </div>

      <div>
        <label className="text-xs font-mono text-muted-foreground mb-3 block">Trading Rules</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { key: 'newsTrading', label: 'News Trading' },
            { key: 'overnightHolding', label: 'Overnight Holding' },
            { key: 'weekendHolding', label: 'Weekend Holding' },
            { key: 'hedging', label: 'Hedging' },
          ].map(rule => (
            <label key={rule.key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData[rule.key] || false} onChange={e => setFormData(f => ({ ...f, [rule.key]: e.target.checked }))}
                className="rounded" />
              <span className="text-xs text-foreground">{rule.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
          style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }}>
          <Save className="w-4 h-4" /> Save
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}