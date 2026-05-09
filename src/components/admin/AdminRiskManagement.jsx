import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertCircle, Save, Edit2 } from 'lucide-react';

const DEFAULT_RISK_RULES = [
  { id: 1, name: 'Max Daily Drawdown', value: 5, unit: '%', riskLevel: 'high' },
  { id: 2, name: 'Max Account Drawdown', value: 10, unit: '%', riskLevel: 'critical' },
  { id: 3, name: 'Max Position Size', value: 10, unit: 'Lots', riskLevel: 'medium' },
  { id: 4, name: 'Max Correlation Risk', value: 80, unit: '%', riskLevel: 'high' },
  { id: 5, name: 'Hedging Limit', value: 50, unit: '%', riskLevel: 'medium' },
  { id: 6, name: 'News Trading Blackout', value: 1, unit: 'Hours', riskLevel: 'medium' },
];

export default function AdminRiskManagement() {
  const [riskRules, setRiskRules] = useState(DEFAULT_RISK_RULES);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const handleEdit = (rule) => {
    setEditingId(rule.id);
    setFormData(rule);
  };

  const handleSave = () => {
    setRiskRules(riskRules.map(r => r.id === editingId ? formData : r));
    setEditingId(null);
    setFormData({});
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" /> Risk Management Rules
        </h1>
        <p className="text-base text-muted-foreground font-mono mt-1">Define global trading risk parameters</p>
      </div>

      <div className="space-y-3">
        {riskRules.map((rule, idx) => {
          const riskColors = {
            low: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)', text: '#10b981' },
            medium: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
            high: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' },
            critical: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.2)', text: '#a855f7' },
          };
          const colors = riskColors[rule.riskLevel];

          return (
            <motion.div key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl p-5 border"
              style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>

              {editingId === rule.id ? (
                <div className="grid grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground/70 mb-1 block uppercase">Rule</label>
                    <input type="text" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      disabled className="w-full rounded-lg px-3 py-2 text-sm text-foreground/50 outline-none"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground/70 mb-1 block uppercase">Value</label>
                    <input type="number" value={formData.value} onChange={e => setFormData(f => ({ ...f, value: parseFloat(e.target.value) }))}
                      className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground/70 mb-1 block uppercase">Unit</label>
                    <select value={formData.unit} onChange={e => setFormData(f => ({ ...f, unit: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <option>%</option>
                      <option>Lots</option>
                      <option>Hours</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave}
                      className="px-4 py-2 rounded-lg text-sm font-bold text-white flex-1"
                      style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }}>Save</button>
                    <button onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-lg text-sm font-bold"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-foreground mb-1">{rule.name}</div>
                    <div className="text-xs text-muted-foreground/70 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      Risk Level: <span style={{ color: colors.text }} className="font-bold">{rule.riskLevel.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-black text-foreground">{rule.value}</div>
                      <div className="text-xs text-muted-foreground/70 font-mono">{rule.unit}</div>
                    </div>
                    <button onClick={() => handleEdit(rule)}
                      className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <button className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
        style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
        <Save className="w-4 h-4" /> Apply Risk Rules to All Accounts
      </button>
    </div>
  );
}