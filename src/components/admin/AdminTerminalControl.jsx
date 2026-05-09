import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, AlertCircle, Save, Plus, Trash2 } from 'lucide-react';

const DEFAULT_INSTRUMENTS = [
  { symbol: 'BTC/USD', digits: 2, pipValue: 0.01, enabled: true, spreadPips: 0.01 },
  { symbol: 'ETH/USD', digits: 2, pipValue: 0.01, enabled: true, spreadPips: 0.01 },
  { symbol: 'XAU/USD', digits: 2, pipValue: 0.01, enabled: true, spreadPips: 0.35 },
  { symbol: 'EUR/USD', digits: 5, pipValue: 10, enabled: true, spreadPips: 0.00012 },
  { symbol: 'GBP/USD', digits: 5, pipValue: 10, enabled: true, spreadPips: 0.00015 },
  { symbol: 'USD/JPY', digits: 3, pipValue: 9, enabled: true, spreadPips: 0.015 },
  { symbol: 'NAS100', digits: 2, pipValue: 1, enabled: true, spreadPips: 1.2 },
];

export default function AdminTerminalControl() {
  const [instruments, setInstruments] = useState(DEFAULT_INSTRUMENTS);
  const [globalSettings, setGlobalSettings] = useState({
    maintenanceMode: false,
    newsTrading: true,
    expertAdvisors: true,
    hedging: true,
    maxOrdersPerDay: 100,
    sessionStartHour: 0,
    sessionEndHour: 24,
  });
  const [editingIdx, setEditingIdx] = useState(null);
  const [formData, setFormData] = useState({});

  const handleEditInstrument = (idx) => {
    setEditingIdx(idx);
    setFormData(instruments[idx]);
  };

  const handleSaveInstrument = () => {
    const updated = [...instruments];
    updated[editingIdx] = formData;
    setInstruments(updated);
    setEditingIdx(null);
    setFormData({});
  };

  const handleToggleInstrument = (idx) => {
    const updated = [...instruments];
    updated[idx].enabled = !updated[idx].enabled;
    setInstruments(updated);
  };

  const handleDeleteInstrument = (idx) => {
    setInstruments(instruments.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <Monitor className="w-6 h-6 text-primary" /> XTrading Terminal Control
        </h1>
        <p className="text-base text-muted-foreground font-mono mt-1">Manage instruments, settings, and global controls</p>
      </div>

      {/* Global Settings */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 mb-8 border"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" /> Global Settings
        </h2>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Toggle settings */}
          {[
            { key: 'maintenanceMode', label: 'Maintenance Mode', sub: 'Disable terminal for all users' },
            { key: 'newsTrading', label: 'News Trading', sub: 'Allow trading during news events' },
            { key: 'expertAdvisors', label: 'Expert Advisors', sub: 'Allow EA usage' },
            { key: 'hedging', label: 'Hedging', sub: 'Allow hedging positions' },
          ].map(({ key, label, sub }) => (
            <div key={key} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-foreground">{label}</div>
                  <div className="text-xs text-muted-foreground/70">{sub}</div>
                </div>
                <button onClick={() => setGlobalSettings(g => ({ ...g, [key]: !g[key] }))}
                  className={`w-10 h-6 rounded-full transition-all relative ${globalSettings[key] ? 'bg-primary' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${globalSettings[key] ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
            </div>
          ))}

          {/* Number settings */}
          {[
            { key: 'maxOrdersPerDay', label: 'Max Orders/Day', min: 1, max: 1000 },
            { key: 'sessionStartHour', label: 'Session Start Hour', min: 0, max: 23 },
            { key: 'sessionEndHour', label: 'Session End Hour', min: 0, max: 24 },
          ].map(({ key, label, min, max }) => (
            <div key={key} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <label className="text-xs font-mono text-muted-foreground/70 mb-2 block uppercase">{label}</label>
              <input type="number" value={globalSettings[key]} onChange={e => setGlobalSettings(g => ({ ...g, [key]: parseInt(e.target.value) }))}
                min={min} max={max}
                className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          ))}
        </div>

        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
          <Save className="w-4 h-4" /> Save Global Settings
        </button>
      </motion.div>

      {/* Instruments */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 border"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 className="text-lg font-bold text-foreground mb-6">Tradeable Instruments</h2>

        <div className="space-y-3">
          {instruments.map((inst, idx) => (
            <motion.div key={inst.symbol}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-lg p-4 border"
              style={{ background: inst.enabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
              
              {editingIdx === idx ? (
                <div className="grid grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="text-[9px] font-mono text-muted-foreground/70 mb-1 block uppercase">Symbol</label>
                    <input type="text" value={formData.symbol} onChange={e => setFormData(f => ({ ...f, symbol: e.target.value }))}
                      disabled className="w-full rounded-lg px-3 py-2 text-sm text-foreground/50 outline-none"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-muted-foreground/70 mb-1 block uppercase">Spread Pips</label>
                    <input type="number" value={formData.spreadPips} onChange={e => setFormData(f => ({ ...f, spreadPips: parseFloat(e.target.value) }))} step="0.001"
                      className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-muted-foreground/70 mb-1 block uppercase">Decimals</label>
                    <input type="number" value={formData.digits} onChange={e => setFormData(f => ({ ...f, digits: parseInt(e.target.value) }))} min="1" max="8"
                      className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveInstrument}
                      className="px-3 py-2 rounded-lg text-xs font-bold text-white flex-1"
                      style={{ background: 'rgba(16,185,129,0.8)' }}>Save</button>
                    <button onClick={() => setEditingIdx(null)}
                      className="px-3 py-2 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-foreground flex items-center gap-3">
                      {inst.symbol}
                      <span className="text-xs text-muted-foreground/70 font-mono">Spread: {inst.spreadPips} pips • Decimals: {inst.digits}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleToggleInstrument(idx)}
                      className={`w-10 h-6 rounded-full transition-all relative ${inst.enabled ? 'bg-emerald-500/40' : 'bg-red-500/40'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${inst.enabled ? 'left-5' : 'left-1'}`} />
                    </button>
                    <button onClick={() => handleEditInstrument(idx)}
                      className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors">
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteInstrument(idx)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <button className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'rgba(255,92,0,0.2)', border: '1px solid rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> Add Instrument
        </button>
      </motion.div>
    </div>
  );
}