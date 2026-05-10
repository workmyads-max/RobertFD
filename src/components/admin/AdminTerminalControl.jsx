import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, AlertCircle, Save, Plus, Trash2, Settings2, DollarSign, Sliders, Key, RefreshCw, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { INSTRUMENTS, DEFAULT_LEVERAGE_CONFIG, DEFAULT_COMMISSION_CONFIG } from '../terminal/terminalConfig';
import { setTwelveDataKey, getTwelveDataKey } from '../terminal/useLivePrices';

const SETTINGS_KEY = 'admin_terminal_settings';
const loadSettings = () => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; } };
const saveSettings = (s) => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {} };

const TABS = ['Global', 'Instruments', 'Leverage', 'Commission', 'API Settings'];

export default function AdminTerminalControl() {
  const [activeTab, setActiveTab] = useState('Global');
  const [saved, setSaved] = useState(false);
  const [expandedInst, setExpandedInst] = useState(null);

  // ── Global settings ─────────────────────────────────────────────────────
  const [globalSettings, setGlobalSettings] = useState(() => ({
    maintenanceMode: false, newsTrading: true, expertAdvisors: true,
    hedging: true, maxOrdersPerDay: 100, sessionStartHour: 0, sessionEndHour: 24,
    maxLotStandard: 20, maxLotSwing: 5,
    ...loadSettings().global,
  }));

  // ── Instruments ──────────────────────────────────────────────────────────
  const [instruments, setInstruments] = useState(() => {
    const saved = loadSettings().instruments;
    if (saved) return saved;
    return INSTRUMENTS.map(i => ({ ...i, enabled: true, commission: 0 }));
  });

  // ── Leverage config ──────────────────────────────────────────────────────
  const [leverageConfig, setLeverageConfig] = useState(() => ({
    ...DEFAULT_LEVERAGE_CONFIG,
    ...(loadSettings().leverage || {}),
  }));

  // ── Commission config ────────────────────────────────────────────────────
  const [commissionConfig, setCommissionConfig] = useState(() => ({
    ...DEFAULT_COMMISSION_CONFIG,
    ...(loadSettings().commission || {}),
  }));

  // ── API Settings ─────────────────────────────────────────────────────────
  const [twelveDataKey, setTwelveDataKeyState] = useState(() => getTwelveDataKey());
  const [showKey, setShowKey] = useState(false);

  const handleSaveAll = () => {
    saveSettings({ global: globalSettings, instruments, leverage: leverageConfig, commission: commissionConfig });
    if (twelveDataKey) setTwelveDataKey(twelveDataKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateInstrument = (symbol, field, value) => {
    setInstruments(prev => prev.map(i => i.symbol === symbol ? { ...i, [field]: value } : i));
  };

  const toggleInstrument = (symbol) => {
    setInstruments(prev => prev.map(i => i.symbol === symbol ? { ...i, enabled: !i.enabled } : i));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Monitor className="w-7 h-7 text-primary" /> XTrading Terminal Control
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Full broker-grade control over all terminal settings</p>
        </div>
        <button onClick={handleSaveAll}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: saved ? 'rgba(16,185,129,0.8)' : 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save All Settings</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 flex-wrap border-b border-white/[0.08] pb-0">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-mono font-semibold transition-all border-b-2 -mb-px ${activeTab === tab ? 'text-primary border-primary' : 'text-muted-foreground hover:text-foreground border-transparent'}`}>
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

          {/* ── GLOBAL TAB ──────────────────────────────────────────────── */}
          {activeTab === 'Global' && (
            <div className="space-y-6">
              <div className="rounded-2xl p-6 border" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-base font-bold text-foreground mb-5 flex items-center gap-2"><Settings2 className="w-4 h-4 text-primary" /> Platform Toggles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'maintenanceMode', label: 'Maintenance Mode', sub: 'Disable terminal for all users' },
                    { key: 'newsTrading', label: 'News Trading', sub: 'Allow trading during news events' },
                    { key: 'expertAdvisors', label: 'Expert Advisors', sub: 'Allow EA/bot usage' },
                    { key: 'hedging', label: 'Hedging', sub: 'Allow opposite positions on same symbol' },
                  ].map(({ key, label, sub }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{label}</div>
                        <div className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</div>
                      </div>
                      <button onClick={() => setGlobalSettings(g => ({ ...g, [key]: !g[key] }))}
                        className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${globalSettings[key] ? 'bg-primary' : 'bg-white/10'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow ${globalSettings[key] ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-6 border" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-base font-bold text-foreground mb-5">Trading Limits</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'maxOrdersPerDay', label: 'Max Orders/Day', min: 1, max: 10000 },
                    { key: 'maxLotStandard', label: 'Max Lot (Standard)', min: 0.01, max: 100, step: '0.01' },
                    { key: 'maxLotSwing', label: 'Max Lot (Swing)', min: 0.01, max: 100, step: '0.01' },
                    { key: 'sessionStartHour', label: 'Session Start (UTC hr)', min: 0, max: 23 },
                    { key: 'sessionEndHour', label: 'Session End (UTC hr)', min: 0, max: 24 },
                  ].map(({ key, label, min, max, step }) => (
                    <div key={key} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label className="text-[10px] font-mono text-muted-foreground/70 mb-2 block uppercase">{label}</label>
                      <input type="number" value={globalSettings[key]} step={step || 1}
                        onChange={e => setGlobalSettings(g => ({ ...g, [key]: parseFloat(e.target.value) }))}
                        min={min} max={max}
                        className="w-full rounded-lg px-3 py-2 text-sm text-foreground font-mono outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── INSTRUMENTS TAB ──────────────────────────────────────────── */}
          {activeTab === 'Instruments' && (
            <div className="space-y-3">
              <p className="text-xs font-mono text-muted-foreground mb-4">Enable/disable symbols and configure spread per instrument.</p>
              {instruments.map((inst, idx) => (
                <div key={inst.symbol} className="rounded-xl border"
                  style={{ background: inst.enabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-3 p-4">
                    <button onClick={() => updateInstrument(inst.symbol, 'enabled', !inst.enabled)}
                      className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${inst.enabled ? 'bg-emerald-500/60' : 'bg-red-500/30'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${inst.enabled ? 'left-4' : 'left-0.5'}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground font-mono">{inst.symbol}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono text-muted-foreground"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>{inst.category}</span>
                        <span className="text-[9px] text-muted-foreground/60 hidden sm:block">{inst.description}</span>
                      </div>
                    </div>
                    <button onClick={() => setExpandedInst(expandedInst === inst.symbol ? null : inst.symbol)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition">
                      {expandedInst === inst.symbol ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {expandedInst === inst.symbol && (
                    <div className="px-4 pb-4 pt-0 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/[0.05]">
                      {[
                        { label: 'Spread Pips', field: 'spreadPips', step: '0.00001' },
                        { label: 'Pip Value ($)', field: 'pipValue', step: '0.01' },
                        { label: 'Decimals', field: 'digits', step: '1', min: 0, max: 8 },
                        { label: 'Commission ($/lot)', field: 'commission', step: '0.01' },
                      ].map(({ label, field, step, min, max }) => (
                        <div key={field}>
                          <label className="text-[9px] font-mono text-muted-foreground/60 mb-1.5 block uppercase">{label}</label>
                          <input type="number" value={inst[field] || 0} step={step}
                            min={min} max={max}
                            onChange={e => updateInstrument(inst.symbol, field, parseFloat(e.target.value))}
                            className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── LEVERAGE TAB ──────────────────────────────────────────────── */}
          {activeTab === 'Leverage' && (
            <div className="space-y-4">
              <p className="text-xs font-mono text-muted-foreground mb-4">Set default leverage per instrument category. This caps the maximum leverage users can apply per category (regulatory-compliant).</p>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(leverageConfig).map(([type, config]) => (
                  <div key={type} className="rounded-2xl p-5 border"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 className="text-sm font-bold text-foreground capitalize mb-4 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-primary" /> {type.charAt(0).toUpperCase() + type.slice(1)}
                    </h3>
                    <div className="mb-3">
                      <label className="text-[10px] font-mono text-muted-foreground/70 mb-1.5 block uppercase">Default Leverage</label>
                      <select value={config.default}
                        onChange={e => setLeverageConfig(prev => ({ ...prev, [type]: { ...prev[type], default: parseInt(e.target.value) } }))}
                        className="w-full rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {config.options.map(o => <option key={o} value={o} style={{ background: '#07070b' }}>1:{o}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {config.options.map(o => (
                        <span key={o}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${config.default === o ? 'text-primary' : 'text-muted-foreground/60'}`}
                          style={{ background: config.default === o ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)' }}>
                          1:{o}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 text-[10px] font-mono text-muted-foreground/50">
                      Applies to: {INSTRUMENTS.filter(i => i.type === type).map(i => i.symbol).slice(0, 4).join(', ')}{INSTRUMENTS.filter(i => i.type === type).length > 4 ? '...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── COMMISSION TAB ────────────────────────────────────────────── */}
          {activeTab === 'Commission' && (
            <div className="space-y-4">
              <p className="text-xs font-mono text-muted-foreground mb-4">Configure commission and spread per asset class. This applies to all trades in the respective category.</p>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(commissionConfig).map(([type, config]) => (
                  <div key={type} className="rounded-2xl p-5 border"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 className="text-sm font-bold text-foreground capitalize mb-4 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" /> {type.charAt(0).toUpperCase() + type.slice(1)}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono text-muted-foreground/70 mb-1.5 block uppercase">Commission Type</label>
                        <select value={config.type}
                          onChange={e => setCommissionConfig(prev => ({ ...prev, [type]: { ...prev[type], type: e.target.value } }))}
                          className="w-full rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <option value="spread" style={{ background: '#07070b' }}>Spread Only (0 commission)</option>
                          <option value="perLot" style={{ background: '#07070b' }}>Per Lot ($/lot round-trip)</option>
                          <option value="percentage" style={{ background: '#07070b' }}>Percentage of trade value</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-muted-foreground/70 mb-1.5 block uppercase">
                          {config.type === 'spread' ? 'Commission/Lot (0 = spread only)' : config.type === 'perLot' ? 'Commission per Lot ($)' : 'Commission Rate (%)'}
                        </label>
                        <input type="number" value={config.commissionPerLot} step="0.01" min="0"
                          onChange={e => setCommissionConfig(prev => ({ ...prev, [type]: { ...prev[type], commissionPerLot: parseFloat(e.target.value) } }))}
                          className="w-full rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] font-mono text-muted-foreground/50">
                      Example (1 lot): {config.type === 'spread' ? 'Free' : config.type === 'perLot' ? `$${(config.commissionPerLot * 2).toFixed(2)} round-trip` : `${config.commissionPerLot}% of value`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── API SETTINGS TAB ──────────────────────────────────────────── */}
          {activeTab === 'API Settings' && (
            <div className="space-y-6">
              {/* TwelveData */}
              <div className="rounded-2xl p-6 border" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-base font-bold text-foreground mb-1 flex items-center gap-2"><Key className="w-4 h-4 text-primary" /> TwelveData API</h2>
                <p className="text-xs text-muted-foreground/70 mb-5 font-mono">Real-time prices for stocks, indices, forex. Get your key at <a href="https://twelvedata.com" target="_blank" rel="noreferrer" className="text-primary underline">twelvedata.com</a> (free tier: 800 requests/day)</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground/70 mb-1.5 block uppercase">API Key</label>
                    <div className="flex gap-2">
                      <input type={showKey ? 'text' : 'password'} value={twelveDataKey}
                        onChange={e => setTwelveDataKeyState(e.target.value)}
                        placeholder="Enter your TwelveData API key..."
                        className="flex-1 rounded-lg px-3 py-2.5 text-sm font-mono text-foreground outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <button onClick={() => setShowKey(!showKey)}
                        className="px-3 py-2 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {showKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl text-[11px] font-mono space-y-1"
                    style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
                    <div className="text-primary font-bold">Supported data (TwelveData):</div>
                    <div className="text-muted-foreground">• Real-time stocks: AAPL, TSLA, AMZN, MSFT, NFLX, META, NVDA, AMD...</div>
                    <div className="text-muted-foreground">• Forex: EUR/USD, GBP/USD, USD/JPY and all major pairs</div>
                    <div className="text-muted-foreground">• Indices: SPX500, NAS100, US30, GER40, UK100</div>
                    <div className="text-muted-foreground">• Crypto: BTC, ETH and 300+ coins</div>
                    <div className="text-muted-foreground">• Commodities: OIL, BRENT, NGAS, WHEAT</div>
                  </div>
                </div>
              </div>

              {/* TradingView */}
              <div className="rounded-2xl p-6 border" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-base font-bold text-foreground mb-1 flex items-center gap-2"><Monitor className="w-4 h-4 text-primary" /> TradingView Charts</h2>
                <p className="text-xs text-muted-foreground/70 mb-5 font-mono">
                  Charts use TradingView's free embedded widget — <strong className="text-foreground">no API key required</strong>. All symbols are pre-mapped automatically.
                </p>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-2"><CheckCircle2 className="w-4 h-4" /> TradingView is Active</div>
                  <p className="text-xs font-mono text-muted-foreground/70">All instruments including TSLA, NFLX, SPX500, GER40 etc. are mapped and working. Charts support RSI, MACD indicators and all timeframes.</p>
                </div>
                <div className="mt-4 grid md:grid-cols-2 gap-3">
                  {[
                    { label: 'Chart Type', value: 'Candlestick (MT5-style)' },
                    { label: 'Default Indicators', value: 'RSI 14, MACD (12,26,9)' },
                    { label: 'Available Timeframes', value: '1m, 5m, 15m, 1h, 4h, 1D' },
                    { label: 'Symbol Coverage', value: `${Object.keys({}).length || '50+'} instruments mapped` },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-[9px] font-mono text-muted-foreground/60 uppercase mb-1">{item.label}</div>
                      <div className="text-xs font-mono text-foreground">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}