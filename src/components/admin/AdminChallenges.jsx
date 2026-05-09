import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CHALLENGE_DEFAULTS = [
  { id: 'two-step-std-100k', name: 'Two-Step Standard $100K', type: 'two-step', accountType: 'standard', size: 100000, price: 299, phase1Target: 10, phase2Target: 5, dailyDD: 5, maxDD: 10 },
  { id: 'two-step-swing-50k', name: 'Two-Step Swing $50K', type: 'two-step', accountType: 'swing', size: 50000, price: 199, phase1Target: 10, phase2Target: 5, dailyDD: 5, maxDD: 10 },
  { id: 'instant-std-100k', name: 'Instant Standard $100K', type: 'instant', accountType: 'standard', size: 100000, price: 149, phase1Target: 8, phase2Target: 0, dailyDD: 3, maxDD: 8 },
  { id: 'instant-swing-50k', name: 'Instant Swing $50K', type: 'instant', accountType: 'swing', size: 50000, price: 99, phase1Target: 8, phase2Target: 0, dailyDD: 3, maxDD: 8 },
];

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState(CHALLENGE_DEFAULTS);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const qc = useQueryClient();

  const handleEdit = (challenge) => {
    setEditingId(challenge.id);
    setFormData(challenge);
  };

  const handleSave = () => {
    if (editingId) {
      setChallenges(c => c.map(ch => ch.id === editingId ? formData : ch));
      setEditingId(null);
      setFormData({});
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this challenge?')) {
      setChallenges(c => c.filter(ch => ch.id !== id));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <Zap className="w-6 h-6 text-primary" /> Manage Challenges
        </h1>
        <p className="text-base text-muted-foreground font-mono mt-1">Edit challenge pricing and rules</p>
      </div>

      <div className="space-y-4">
        {challenges.map((challenge, idx) => (
          <motion.div key={challenge.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-xl p-5 border"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            
            {editingId === challenge.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-1 block">Price (USD)</label>
                    <input type="number" value={formData.price} onChange={e => setFormData(f => ({ ...f, price: parseFloat(e.target.value) }))}
                      className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-1 block">Phase 1 Target (%)</label>
                    <input type="number" value={formData.phase1Target} onChange={e => setFormData(f => ({ ...f, phase1Target: parseInt(e.target.value) }))}
                      className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  {formData.type === 'two-step' && (
                    <div>
                      <label className="text-xs font-mono text-muted-foreground mb-1 block">Phase 2 Target (%)</label>
                      <input type="number" value={formData.phase2Target} onChange={e => setFormData(f => ({ ...f, phase2Target: parseInt(e.target.value) }))}
                        className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-1 block">Daily DD Limit (%)</label>
                    <input type="number" value={formData.dailyDD} onChange={e => setFormData(f => ({ ...f, dailyDD: parseInt(e.target.value) }))}
                      className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-1 block">Max DD Limit (%)</label>
                    <input type="number" value={formData.maxDD} onChange={e => setFormData(f => ({ ...f, maxDD: parseInt(e.target.value) }))}
                      className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }}>
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button onClick={() => { setEditingId(null); setFormData({}); }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-foreground">{challenge.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-primary"
                      style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.2)' }}>
                      ${challenge.price}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground/70 flex gap-4">
                    <span>${challenge.size.toLocaleString()} • {challenge.type === 'two-step' ? 'Two-Step' : 'Instant'}</span>
                    <span>P1: {challenge.phase1Target}%{challenge.phase2Target ? ` / P2: ${challenge.phase2Target}%` : ''}</span>
                    <span>DD: {challenge.dailyDD}% / {challenge.maxDD}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
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
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}