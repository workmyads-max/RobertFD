import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { INSTRUMENTS, calcRequiredMargin, getLeverageForInstrument } from './terminalConfig';

function isNewsTime() {
  const now = new Date();
  const utcMin = now.getUTCMinutes();
  const utcDay = now.getUTCDay();
  if (utcDay === 0 || utcDay === 6) return false;
  return utcMin <= 2 || utcMin >= 58;
}
function isWeekend() {
  return [0, 6].includes(new Date().getUTCDay());
}

const ORDER_TYPES = [
  { val: 'market',     label: 'Market Order'  },
  { val: 'buy_limit',  label: 'Buy Limit'     },
  { val: 'sell_limit', label: 'Sell Limit'    },
  { val: 'buy_stop',   label: 'Buy Stop'      },
  { val: 'sell_stop',  label: 'Sell Stop'     },
];

export default function OrderPanel({ symbol, prices, account, rules, equity, usedMargin, onPlaceOrder, accountBlocked, marketOpen = true }) {
  const [side,       setSide]       = useState('BUY');
  const [orderType,  setOrderType]  = useState('market');
  const [lots,       setLots]       = useState('0.10');
  const [sl,         setSl]         = useState('');
  const [tp,         setTp]         = useState('');
  const [pendPrice,  setPendPrice]  = useState('');
  const [flash,      setFlash]      = useState(null);

  const inst       = INSTRUMENTS.find(i => i.symbol === symbol);
  const p          = prices[symbol];
  const accountLev = rules?.leverage || 100;
  const lev        = getLeverageForInstrument(symbol, accountLev);
  const lotsNum    = parseFloat(lots) || 0;
  const entryPrice = orderType === 'market' ? (side === 'BUY' ? p?.ask : p?.bid) : parseFloat(pendPrice) || 0;
  const reqMargin  = calcRequiredMargin(symbol, lotsNum, lev, entryPrice || p?.bid || 0);
  const freeMargin = equity - usedMargin;
  const riskPct    = freeMargin > 0 ? (reqMargin / equity * 100) : 0;

  const newsBlocked    = !rules?.newsTrading && isNewsTime();
  const weekendBlocked = !rules?.weekendHolding && isWeekend();

  const canTrade = !accountBlocked && marketOpen && lotsNum > 0
    && lotsNum <= (rules?.maxLotsPerTrade || 20)
    && reqMargin <= freeMargin
    && !newsBlocked && !weekendBlocked;

  const blockReason = accountBlocked ? 'TRADING DISABLED'
    : !marketOpen ? 'MARKET CLOSED'
    : weekendBlocked ? 'WEEKEND NOT ALLOWED'
    : newsBlocked ? 'NEWS BLACKOUT'
    : reqMargin > freeMargin ? 'INSUFFICIENT MARGIN'
    : lotsNum > (rules?.maxLotsPerTrade || 20) ? `MAX ${rules?.maxLotsPerTrade} LOTS`
    : null;

  const handleSubmit = () => {
    if (!canTrade) return;
    const ep = orderType === 'market' ? entryPrice : parseFloat(pendPrice);
    if (!ep) return;
    onPlaceOrder({ symbol, type: side, orderType: orderType === 'market' ? 'MARKET' : orderType.toUpperCase(), lots: lotsNum, entry: ep, sl: sl ? parseFloat(sl) : null, tp: tp ? parseFloat(tp) : null, margin: reqMargin, time: new Date().toLocaleTimeString() });
    setFlash(side);
    setTimeout(() => setFlash(null), 1500);
    setSl(''); setTp(''); setPendPrice('');
  };

  const maxLots = (() => {
    if (!freeMargin || !entryPrice) return '—';
    const per1 = calcRequiredMargin(symbol, 1, lev, entryPrice);
    if (!per1) return '∞';
    return Math.min(freeMargin / per1, rules?.maxLotsPerTrade || 20).toFixed(2);
  })();

  return (
    <div className="flex flex-col h-full text-xs" style={{ background: '#0a0d18', fontFamily: "'JetBrains Mono', monospace" }}>
      
      {/* Symbol Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0d1117' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] font-black text-white">{symbol}</span>
          <span className="text-[9px] text-slate-500">{inst?.description}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-600 uppercase tracking-widest">Bid</span>
            <span className="text-[12px] font-bold text-red-400">{p?.bid?.toFixed(inst?.digits) || '—'}</span>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-600 uppercase tracking-widest">Ask</span>
            <span className="text-[12px] font-bold text-emerald-400">{p?.ask?.toFixed(inst?.digits) || '—'}</span>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-600 uppercase tracking-widest">Spread</span>
            <span className="text-[12px] font-bold text-orange-400">
              {p?.bid && p?.ask ? ((p.ask - p.bid) / (inst?.digits >= 4 ? 0.0001 : 0.01)).toFixed(1) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Buy / Sell */}
      <div className="grid grid-cols-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['BUY', 'SELL'].map(s => (
          <button key={s} onClick={() => setSide(s)}
            className={`py-3 font-black text-sm transition-all flex items-center justify-center gap-2 ${side === s
              ? s === 'BUY'
                ? 'text-emerald-300'
                : 'text-red-300'
              : 'text-slate-600 hover:text-slate-400'}`}
            style={side === s ? {
              background: s === 'BUY' ? 'linear-gradient(180deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.05) 100%)' : 'linear-gradient(180deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.05) 100%)',
              borderBottom: `2px solid ${s === 'BUY' ? '#10b981' : '#ef4444'}`,
            } : { borderBottom: '2px solid transparent' }}>
            {s === 'BUY' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {s}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

        {/* Order Type */}
        <div>
          <label className="text-[8px] text-slate-500 uppercase tracking-widest block mb-1.5">Order Type</label>
          <select value={orderType} onChange={e => setOrderType(e.target.value)}
            className="w-full rounded-lg px-3 py-2 font-mono text-[11px] text-white outline-none appearance-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {ORDER_TYPES.map(ot => <option key={ot.val} value={ot.val} style={{ background: '#0d1117' }}>{ot.label}</option>)}
          </select>
        </div>

        {/* Pending Price */}
        {orderType !== 'market' && (
          <div>
            <label className="text-[8px] text-slate-500 uppercase tracking-widest block mb-1.5">Order Price</label>
            <input value={pendPrice} onChange={e => setPendPrice(e.target.value)} type="number"
              placeholder={p?.bid?.toFixed(inst?.digits)}
              className="w-full rounded-lg px-3 py-2 font-mono text-[11px] text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        )}

        {/* Volume */}
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-[8px] text-slate-500 uppercase tracking-widest">Volume (Lots)</label>
            <span className="text-[8px] text-slate-600">Max: {rules?.maxLotsPerTrade}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLots(l => Math.max(0.01, parseFloat(l) - 0.01).toFixed(2))}
              className="w-8 h-8 rounded-lg text-white font-bold text-base hover:bg-white/10 transition-colors flex-shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>−</button>
            <input value={lots} onChange={e => setLots(e.target.value)} type="number" step="0.01"
              className="flex-1 rounded-lg px-2 py-2 font-mono text-[12px] text-white text-center outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button onClick={() => setLots(l => (parseFloat(l) + 0.01).toFixed(2))}
              className="w-8 h-8 rounded-lg text-white font-bold text-base hover:bg-white/10 transition-colors flex-shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>+</button>
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1.5">
            {[0.01, 0.1, 0.5, 1].map(v => (
              <button key={v} onClick={() => setLots(v.toFixed(2))}
                className="py-1 rounded-md text-[9px] font-mono text-slate-500 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{v}</button>
            ))}
          </div>
        </div>

        {/* SL / TP */}
        <div className="grid grid-cols-2 gap-2">
          {[{ label: 'Stop Loss', val: sl, set: setSl, accent: '#ef4444' }, { label: 'Take Profit', val: tp, set: setTp, accent: '#10b981' }].map(({ label, val, set, accent }) => (
            <div key={label}>
              <label className="text-[8px] uppercase tracking-widest block mb-1.5" style={{ color: accent }}>{label}</label>
              <input value={val} onChange={e => set(e.target.value)} type="number" placeholder="Optional"
                className="w-full rounded-lg px-2 py-1.5 font-mono text-[10px] text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}25` }} />
            </div>
          ))}
        </div>

        {/* Warnings */}
        {(newsBlocked || weekendBlocked || lotsNum > (rules?.maxLotsPerTrade || 20)) && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
            <span className="text-[9px] text-yellow-400/80 leading-relaxed">
              {weekendBlocked ? 'Standard accounts cannot trade on weekends.' : newsBlocked ? 'News blackout active. Swing accounts exempt.' : `Max ${rules?.maxLotsPerTrade} lots allowed.`}
            </span>
          </div>
        )}

        {/* Margin info */}
        <div className="rounded-xl p-3 space-y-1.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-[8px] text-slate-500 uppercase tracking-widest mb-2">Margin Info</div>
          {[
            { label: 'Required', val: `$${reqMargin.toFixed(2)}`, color: 'text-white' },
            { label: 'Free',     val: `$${freeMargin.toFixed(2)}`, color: freeMargin < reqMargin ? 'text-red-400' : 'text-emerald-400' },
            { label: 'Risk',     val: `${riskPct.toFixed(2)}%`, color: riskPct > 5 ? 'text-red-400' : 'text-emerald-400' },
            { label: 'Leverage', val: `1:${lev}`, color: 'text-orange-400' },
            { label: 'Max Lots', val: maxLots, color: 'text-orange-400 font-black' },
          ].map(item => (
            <div key={item.label} className="flex justify-between text-[10px]">
              <span className="text-slate-500">{item.label}</span>
              <span className={`font-bold ${item.color}`}>{item.val}</span>
            </div>
          ))}
        </div>

        {/* Execute button */}
        <AnimatePresence mode="wait">
          {flash ? (
            <motion.div key="ok" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full py-3.5 rounded-xl text-sm font-black text-white text-center"
              style={{ background: flash === 'BUY' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
              ✓ {flash} Order Executed
            </motion.div>
          ) : (
            <motion.button key="btn" onClick={handleSubmit} disabled={!canTrade}
              whileHover={canTrade ? { scale: 1.01 } : {}} whileTap={canTrade ? { scale: 0.99 } : {}}
              className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: !canTrade ? 'rgba(255,255,255,0.05)'
                  : side === 'BUY'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: canTrade ? `0 4px 24px ${side === 'BUY' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}` : 'none',
              }}>
              {blockReason ? (
                <><AlertTriangle className="w-3.5 h-3.5" />{blockReason}</>
              ) : (
                <><Zap className="w-3.5 h-3.5" />{side === 'BUY' ? '▲ BUY' : '▼ SELL'} {lotsNum.toFixed(2)} {symbol}</>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}