import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { INSTRUMENTS, calcRequiredMargin, getLeverageForInstrument } from './terminalConfig';

// Check if current time is within a high-impact news window (±2 min around major releases)
// Simplified: block during the first 2 minutes of each hour on weekdays (common news times)
function isNewsTime() {
  const now = new Date();
  const utcMin = now.getUTCMinutes();
  const utcDay = now.getUTCDay();
  if (utcDay === 0 || utcDay === 6) return false;
  // Block :58–:02 windows (common major news release times)
  return utcMin <= 2 || utcMin >= 58;
}

function isWeekend() {
  const utcDay = new Date().getUTCDay();
  return utcDay === 0 || utcDay === 6;
}

function isAfterHours() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMin = now.getUTCMinutes();
  const utcTime = utcHour + utcMin / 60;
  // After NY session close (20:00 UTC) and before Asian open (22:00 UTC) — overnight window
  return utcTime >= 20 || utcTime < 22;
}

const ORDER_TYPES = [
  { val: 'market',     label: 'Market'     },
  { val: 'buy_limit',  label: 'Buy Limit'  },
  { val: 'sell_limit', label: 'Sell Limit' },
  { val: 'buy_stop',   label: 'Buy Stop'   },
  { val: 'sell_stop',  label: 'Sell Stop'  },
];

export default function OrderPanel({ symbol, prices, account, rules, equity, usedMargin, onPlaceOrder, accountBlocked, marketOpen = true }) {
  const [side,        setSide]        = useState('BUY');
  const [orderType,   setOrderType]   = useState('market');
  const [lots,        setLots]        = useState('0.10');
  const [sl,          setSl]          = useState('');
  const [tp,          setTp]          = useState('');
  const [pendPrice,   setPendPrice]   = useState('');
  const [flash,       setFlash]       = useState(null);

  const inst        = INSTRUMENTS.find(i => i.symbol === symbol);
  const p           = prices[symbol];
  // Apply per-instrument leverage cap (e.g. crypto max 10x regardless of account leverage)
  const accountLev  = rules?.leverage || 100;
  const lev         = getLeverageForInstrument(symbol, accountLev);
  const lotsNum     = parseFloat(lots) || 0;
  const currentBid  = p?.bid || 0;
  const entryPrice  = orderType === 'market' ? (side === 'BUY' ? p?.ask : p?.bid) : parseFloat(pendPrice) || 0;
  const reqMargin   = calcRequiredMargin(symbol, lotsNum, lev, entryPrice || currentBid);
  const freeMargin  = equity - usedMargin;
  const riskPercent = freeMargin > 0 ? (reqMargin / equity * 100).toFixed(2) : '0';

  // ── Challenge rule enforcement ───────────────────────────────────────────────
  const newsBlocked     = !rules?.newsTrading && isNewsTime();
  const weekendBlocked  = !rules?.weekendHolding && isWeekend();
  const overnightBlock  = false; // overnight holding only affects closing time, not opening

  const canTrade = !accountBlocked && marketOpen && lotsNum > 0
    && lotsNum <= (rules?.maxLotsPerTrade || 20)
    && reqMargin <= freeMargin
    && !newsBlocked
    && !weekendBlocked;

  const blockReason = accountBlocked ? '🔒 TRADING DISABLED'
    : !marketOpen ? '🔒 MARKET CLOSED'
    : weekendBlocked ? '🔒 WEEKEND TRADING NOT ALLOWED'
    : newsBlocked ? '⏸ NEWS BLACKOUT ACTIVE'
    : reqMargin > freeMargin ? '⚠ INSUFFICIENT MARGIN'
    : lotsNum > (rules?.maxLotsPerTrade || 20) ? `⚠ MAX ${rules?.maxLotsPerTrade} LOTS`
    : null;

  const handleSubmit = () => {
    if (!canTrade) return;
    const ep = orderType === 'market' ? entryPrice : parseFloat(pendPrice);
    if (!ep) return;

    onPlaceOrder({
      symbol, type: side,
      orderType: orderType === 'market' ? 'MARKET' : orderType.toUpperCase().replace('_', '_'),
      lots: lotsNum,
      entry: ep,
      sl: sl ? parseFloat(sl) : null,
      tp: tp ? parseFloat(tp) : null,
      margin: reqMargin,
      time: new Date().toLocaleTimeString(),
    });

    setFlash(side);
    setTimeout(() => setFlash(null), 1500);
    setSl(''); setTp(''); setPendPrice('');
  };

  return (
    <div className="flex flex-col h-full text-xs" style={{ background: '#07070b' }}>
      {/* Symbol Header */}
      <div className="px-3 py-2 border-b border-white/[0.06]">
        <div className="font-bold text-sm text-foreground">{symbol}</div>
        <div className="font-mono text-[10px] text-muted-foreground">
          Bid: <span className="text-red-400">{p?.bid?.toFixed(inst?.digits)}</span>
          {' '} Ask: <span className="text-emerald-400">{p?.ask?.toFixed(inst?.digits)}</span>
          {' '} Spread: <span className="text-primary">{p?.bid && p?.ask ? ((p.ask - p.bid) / (inst?.digits >= 4 ? 0.0001 : 0.01)).toFixed(1) : '—'}</span>
        </div>
      </div>

      {/* Buy / Sell Tabs */}
      <div className="grid grid-cols-2 border-b border-white/[0.06]">
        {['BUY', 'SELL'].map(s => (
          <button key={s} onClick={() => setSide(s)}
            className={`py-2.5 font-black text-sm transition-all ${side === s
              ? s === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-500'
                            : 'bg-red-500/20 text-red-400 border-b-2 border-red-500'
              : 'text-muted-foreground hover:bg-white/5'}`}>
            {s === 'BUY' ? '▲' : '▼'} {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Order Type */}
        <div>
          <label className="text-[9px] text-muted-foreground uppercase tracking-widest block mb-1">Order Type</label>
          <select value={orderType} onChange={e => setOrderType(e.target.value)}
            className="w-full rounded px-2 py-1.5 font-mono text-[11px] text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {ORDER_TYPES.map(ot => <option key={ot.val} value={ot.val} style={{ background: '#07070b' }}>{ot.label}</option>)}
          </select>
        </div>

        {/* Pending Price */}
        {orderType !== 'market' && (
          <div>
            <label className="text-[9px] text-muted-foreground uppercase tracking-widest block mb-1">Order Price</label>
            <input value={pendPrice} onChange={e => setPendPrice(e.target.value)} type="number"
              placeholder={p?.bid?.toFixed(inst?.digits)}
              className="w-full rounded px-2 py-1.5 font-mono text-[11px] text-foreground outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        )}

        {/* Lots */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[9px] text-muted-foreground uppercase tracking-widest">Volume (Lots)</label>
            <span className="text-[9px] text-muted-foreground/50">Max {rules?.maxLotsPerTrade}</span>
          </div>
          <div className="flex gap-1 items-center">
            <button onClick={() => setLots(l => Math.max(0.01, parseFloat(l) - 0.01).toFixed(2))}
              className="w-7 h-7 rounded text-foreground font-bold hover:bg-white/10 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>−</button>
            <input value={lots} onChange={e => setLots(e.target.value)} type="number" step="0.01"
              className="flex-1 rounded px-2 py-1.5 font-mono text-[11px] text-foreground text-center outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button onClick={() => setLots(l => (parseFloat(l) + 0.01).toFixed(2))}
              className="w-7 h-7 rounded text-foreground font-bold hover:bg-white/10 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>+</button>
          </div>
          <div className="flex gap-1 mt-1">
            {[0.01, 0.1, 0.5, 1].map(v => (
              <button key={v} onClick={() => setLots(v.toFixed(2))}
                className="flex-1 py-0.5 rounded text-[8px] font-mono text-muted-foreground hover:text-foreground transition"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{v}</button>
            ))}
          </div>
        </div>

        {/* SL / TP */}
        <div className="grid grid-cols-2 gap-2">
          {[{ label: 'Stop Loss', val: sl, set: setSl, color: 'text-red-400' }, { label: 'Take Profit', val: tp, set: setTp, color: 'text-emerald-400' }].map(({ label, val, set, color }) => (
            <div key={label}>
              <label className={`text-[9px] uppercase tracking-widest block mb-1 ${color}`}>{label}</label>
              <input value={val} onChange={e => set(e.target.value)} type="number" placeholder="Optional"
                className="w-full rounded px-2 py-1.5 font-mono text-[10px] text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          ))}
        </div>

        {/* Rule violations */}
        {(newsBlocked || weekendBlocked) && (
          <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
            <span className="text-[9px] text-yellow-400 leading-relaxed">
              {weekendBlocked ? 'Standard accounts cannot open trades on weekends.' : 'Trading blocked during high-impact news window (±2 min). Swing accounts exempt.'}
            </span>
          </div>
        )}

        {/* Max lots warning */}
        {lotsNum > (rules?.maxLotsPerTrade || 20) && (
          <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-[9px] text-red-400">Max {rules?.maxLotsPerTrade} lots per trade for {rules?.accountType} account.</span>
          </div>
        )}

        {/* Margin Info */}
        <div className="rounded-lg p-2.5 space-y-1.5" style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.18)' }}>
          {[
            { label: 'Required Margin', val: `$${reqMargin.toFixed(2)}` },
            { label: 'Free Margin',     val: `$${freeMargin.toFixed(2)}`, color: freeMargin < reqMargin ? 'text-red-400' : 'text-emerald-400' },
            { label: 'Risk %',          val: `${riskPercent}%`,           color: parseFloat(riskPercent) > 5 ? 'text-red-400' : 'text-emerald-400' },
            { label: 'Leverage',        val: `1:${lev}${lev !== accountLev ? ` (acct: 1:${accountLev})` : ''}` },
          ].map(item => (
            <div key={item.label} className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">{item.label}</span>
              <span className={item.color || 'text-foreground font-bold'}>{item.val}</span>
            </div>
          ))}
          {/* Max tradable lots */}
          {freeMargin > 0 && entryPrice > 0 && (
            <div className="flex justify-between text-[10px] font-mono pt-1 border-t border-white/[0.06]">
              <span className="text-muted-foreground">Max Lots</span>
              <span className="text-primary font-black">
                {(() => {
                  const marginPer1Lot = calcRequiredMargin(symbol, 1, lev, entryPrice);
                  if (!marginPer1Lot) return '∞';
                  const maxL = Math.min(freeMargin / marginPer1Lot, rules?.maxLotsPerTrade || 20);
                  return Math.max(0, maxL).toFixed(2);
                })()}
              </span>
            </div>
          )}
        </div>

        {/* Execute */}
        <AnimatePresence mode="wait">
          {flash ? (
            <motion.div key="ok" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full py-3 rounded-lg text-sm font-black text-white text-center"
              style={{ background: flash === 'BUY' ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.8)' }}>
              ✓ {flash === 'BUY' ? 'BUY' : 'SELL'} Order Executed
            </motion.div>
          ) : (
            <motion.button key="btn" onClick={handleSubmit} disabled={!canTrade}
              whileHover={canTrade ? { scale: 1.02 } : {}}
              className="w-full py-3 rounded-lg text-sm font-black text-white transition-all disabled:opacity-40"
              style={{
                background: !canTrade ? '#222' : side === 'BUY'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: canTrade ? `0 4px 20px ${side === 'BUY' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` : 'none',
              }}>
              {blockReason || `${side === 'BUY' ? '▲ BUY' : '▼ SELL'} ${lotsNum.toFixed(2)} ${symbol}`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}