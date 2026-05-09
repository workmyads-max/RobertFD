import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Settings, Zap, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AccountBreachAlert from './AccountBreachAlert';

const INSTRUMENTS = [
  { symbol: 'BTC/USD', digits: 2, contractSize: 1, wsSymbol: 'btcusdt', type: 'crypto' },
  { symbol: 'ETH/USD', digits: 2, contractSize: 1, wsSymbol: 'ethusdt', type: 'crypto' },
  { symbol: 'EUR/USD', digits: 5, contractSize: 100000, type: 'fx', spreadPips: 0.00012 },
  { symbol: 'GBP/USD', digits: 5, contractSize: 100000, type: 'fx', spreadPips: 0.00015 },
  { symbol: 'XAU/USD', digits: 2, contractSize: 100, type: 'fx', spreadPips: 0.35 },
  { symbol: 'NAS100', digits: 2, contractSize: 1, type: 'index', spreadPips: 1.2 },
];

function useLivePrices() {
  const [prices, setPrices] = useState(() =>
    INSTRUMENTS.reduce((acc, inst) => {
      acc[inst.symbol] = { bid: null, ask: null, pct: 0, prev: null, high: null, low: null, volume: 0 };
      return acc;
    }, {})
  );

  useEffect(() => {
    const cryptoSymbols = INSTRUMENTS.filter(i => i.type === 'crypto').map(i => i.wsSymbol);
    const streams = cryptoSymbols.map(s => `${s}@ticker`).join('/');
    let ws;
    let wsRetryTimer;

    const connectWS = () => {
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        const d = msg.data;
        if (!d || !d.s) return;
        const inst = INSTRUMENTS.find(i => i.wsSymbol === d.s.toLowerCase());
        if (!inst) return;
        const bid = parseFloat(d.b);
        const ask = parseFloat(d.a);
        const pct = parseFloat(d.P);
        setPrices(prev => ({
          ...prev,
          [inst.symbol]: { 
            bid, ask, pct, 
            high: Math.max(prev[inst.symbol]?.high || bid, bid),
            low: Math.min(prev[inst.symbol]?.low || bid, bid),
            volume: parseFloat(d.v),
            prev: prev[inst.symbol]?.bid 
          },
        }));
      };
      ws.onerror = () => {};
      ws.onclose = () => {
        wsRetryTimer = setTimeout(connectWS, 3000);
      };
    };
    connectWS();

    const FX_SEEDS = {
      'XAU/USD': { bid: 2338.15, spreadPips: 0.35 },
      'EUR/USD': { bid: 1.08215, spreadPips: 0.00012 },
      'GBP/USD': { bid: 1.27048, spreadPips: 0.00015 },
      'NAS100': { bid: 18254.00, spreadPips: 1.2 },
    };
    
    setPrices(prev => {
      const next = { ...prev };
      Object.entries(FX_SEEDS).forEach(([sym, cfg]) => {
        const inst = INSTRUMENTS.find(i => i.symbol === sym);
        next[sym] = {
          bid: cfg.bid,
          ask: parseFloat((cfg.bid + cfg.spreadPips).toFixed(inst.digits)),
          pct: (Math.random() - 0.5) * 0.4,
          high: cfg.bid * 1.02,
          low: cfg.bid * 0.98,
          volume: Math.random() * 1000000,
          prev: null,
        };
      });
      return next;
    });

    const fxInterval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        INSTRUMENTS.filter(i => i.type !== 'crypto').forEach(inst => {
          const cur = next[inst.symbol];
          if (!cur || cur.bid === null) return;
          const volatility = inst.type === 'fx' ? cur.bid * 0.000015 : cur.bid * 0.00008;
          const move = (Math.random() - 0.499) * volatility;
          const newBid = parseFloat((cur.bid + move).toFixed(inst.digits));
          const spread = inst.spreadPips || (cur.ask - cur.bid);
          const newAsk = parseFloat((newBid + spread).toFixed(inst.digits));
          const newPct = parseFloat(((cur.pct || 0) + (Math.random() - 0.5) * 0.01).toFixed(2));
          next[inst.symbol] = {
            bid: newBid,
            ask: newAsk,
            pct: newPct,
            high: Math.max(cur.high, newBid),
            low: Math.min(cur.low, newBid),
            volume: cur.volume + Math.random() * 10000,
            prev: cur.bid,
          };
        });
        return next;
      });
    }, 800);

    return () => {
      if (ws) ws.close();
      clearTimeout(wsRetryTimer);
      clearInterval(fxInterval);
    };
  }, []);

  return prices;
}

function OrderBook({ symbol, prices }) {
  const p = prices[symbol];
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  
  if (!p || p.bid === null) return <div className="text-muted-foreground text-center py-4">Loading...</div>;

  const mid = (p.bid + p.ask) / 2;
  const bids = Array.from({ length: 8 }, (_, i) => ({
    price: parseFloat((p.bid - (i + 1) * 0.5).toFixed(inst.digits)),
    amount: (Math.random() * 50 + 10).toFixed(2),
  }));
  const asks = Array.from({ length: 8 }, (_, i) => ({
    price: parseFloat((p.ask + (i + 1) * 0.5).toFixed(inst.digits)),
    amount: (Math.random() * 50 + 10).toFixed(2),
  }));

  return (
    <div className="text-[10px] font-mono">
      <div className="mb-1 flex justify-between px-2 py-1 border-b border-white/10 text-muted-foreground">
        <span>Price</span>
        <span>Amount</span>
      </div>
      {asks.reverse().map((ask, i) => (
        <div key={`ask-${i}`} className="flex justify-between px-2 py-0.5 text-red-400/60">
          <span>{ask.price}</span>
          <span>{ask.amount}</span>
        </div>
      ))}
      <div className="flex justify-between px-2 py-1.5 bg-white/5 font-bold text-foreground border-y border-white/10">
        <span>{p.bid.toFixed(inst.digits)}</span>
        <span className="text-emerald-400">{p.ask.toFixed(inst.digits)}</span>
      </div>
      {bids.map((bid, i) => (
        <div key={`bid-${i}`} className="flex justify-between px-2 py-0.5 text-emerald-400/60">
          <span>{bid.price}</span>
          <span>{bid.amount}</span>
        </div>
      ))}
    </div>
  );
}

function CandleChart({ symbol, prices }) {
  const p = prices[symbol];
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  
  if (!p || p.bid === null) return null;

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <svg viewBox="0 0 600 300" className="w-full h-full">
        {/* Grid */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="50"
            y1={50 + i * 50}
            x2="580"
            y2={50 + i * 50}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        
        {/* Candles */}
        {Array.from({ length: 20 }).map((_, i) => {
          const x = 70 + i * 25;
          const height = Math.sin(i * 0.5) * 50 + 100;
          const open = height;
          const close = height + (Math.random() - 0.5) * 30;
          const high = Math.max(open, close) + Math.random() * 20;
          const low = Math.min(open, close) - Math.random() * 20;
          const isGreen = close >= open;
          
          const y1 = 250 - high + 80;
          const y2 = 250 - low + 80;
          const yOpen = 250 - open + 80;
          const yClose = 250 - close + 80;
          
          return (
            <g key={i}>
              <line x1={x} y1={y1} x2={x} y2={y2} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="1" />
              <rect
                x={x - 6}
                y={Math.min(yOpen, yClose)}
                width="12"
                height={Math.abs(yClose - yOpen) || 2}
                fill={isGreen ? '#10b981' : '#ef4444'}
              />
            </g>
          );
        })}
      </svg>
      
      {/* Price overlay */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-2xl font-mono font-black text-primary">{p.bid.toFixed(inst.digits)}</div>
        <div className={`text-sm font-bold ${(p.pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {(p.pct || 0) >= 0 ? '▲' : '▼'} {Math.abs(p.pct || 0).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

export default function ProTradingTerminal({ account }) {
  const isActive = !!(account && (account.status === 'active' || account.status === 'funded' || account.status === 'passed'));
  const prices = useLivePrices();
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [side, setSide] = useState('buy');
  const [leverage, setLeverage] = useState(50);
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [accountBlocked, setAccountBlocked] = useState(false);

  const currentPrice = prices[selectedSymbol];
  const selected = INSTRUMENTS.find(i => i.symbol === selectedSymbol);
  const accountSize = account?.account_size || 100000;
  const equity = accountSize + positions.reduce((s, p) => s + (p.pnl || 0), 0);

  const handlePlaceOrder = () => {
    if (!price || !amount || !currentPrice) return;
    const orderPrice = parseFloat(price);
    const orderAmount = parseFloat(amount);
    const total = (orderPrice * orderAmount).toFixed(2);
    
    const newOrder = {
      id: Date.now(),
      symbol: selectedSymbol,
      side,
      price: orderPrice,
      amount: orderAmount,
      total,
      time: new Date().toLocaleTimeString(),
      status: 'open',
    };
    
    setOrders(prev => [newOrder, ...prev]);
    setPrice('');
    setAmount('');
  };

  if (!isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ background: '#030305' }}>
        <AlertCircle className="w-16 h-16 text-primary/40 mb-4" />
        <div className="text-xl font-black text-foreground">Terminal Locked</div>
        <div className="text-sm text-muted-foreground">Activate account to trade</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0f' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10" style={{ background: '#050509' }}>
        <div className="flex items-center gap-8">
          <div>
            <div className="text-xs text-muted-foreground mb-1">{selectedSymbol}</div>
            <div className="text-xl font-mono font-black text-primary">{currentPrice?.bid?.toFixed(selected?.digits) || '—'}</div>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <div>
              <div className="text-muted-foreground">24h Change</div>
              <div className={currentPrice?.pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>{currentPrice?.pct?.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">24h High</div>
              <div className="text-foreground">{currentPrice?.high?.toFixed(selected?.digits)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">24h Low</div>
              <div className="text-foreground">{currentPrice?.low?.toFixed(selected?.digits)}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-center">
            <div className="text-muted-foreground">Balance</div>
            <div className="text-lg font-bold text-foreground">${accountSize.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Equity</div>
            <div className="text-lg font-bold text-emerald-400">${equity.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex flex-1 overflow-hidden gap-px">
        {/* Left: Chart + OrderBook */}
        <div className="flex-1 flex flex-col border-r border-white/10">
          {/* Instruments Tabs */}
          <div className="flex gap-px border-b border-white/10 overflow-x-auto flex-shrink-0" style={{ background: '#050509' }}>
            {INSTRUMENTS.map(inst => (
              <button
                key={inst.symbol}
                onClick={() => setSelectedSymbol(inst.symbol)}
                className={`px-4 py-2 text-xs font-bold flex-shrink-0 border-r border-white/10 transition ${
                  selectedSymbol === inst.symbol
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                {inst.symbol}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="flex-1 lg:min-w-0 border-b lg:border-b-0 lg:border-r border-white/10">
              <CandleChart symbol={selectedSymbol} prices={prices} />
            </div>
            
            {/* Order Book */}
            <div className="w-48 flex-shrink-0 overflow-y-auto p-2" style={{ background: '#050509' }}>
              <OrderBook symbol={selectedSymbol} prices={prices} />
            </div>
          </div>
        </div>

        {/* Right: Trading Panel */}
        <div className="w-72 flex-shrink-0 flex flex-col border-white/10" style={{ background: '#050509' }}>
          {/* Leverage */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="text-xs text-muted-foreground mb-2">Leverage: {leverage}x</div>
            <input
              type="range"
              min="1"
              max="100"
              value={leverage}
              onChange={e => setLeverage(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full accent-primary"
            />
          </div>

          {/* Buy/Sell Tabs */}
          <div className="flex border-b border-white/10">
            {['buy', 'sell'].map(s => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`flex-1 py-3 text-sm font-bold transition ${
                  side === s
                    ? s === 'buy'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                    : 'text-muted-foreground'
                }`}>
                {s === 'buy' ? 'Buy/Long' : 'Sell/Short'}
              </button>
            ))}
          </div>

          {/* Order Form */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Price ({selected?.symbol?.split('/')[1]})</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder={currentPrice?.bid?.toFixed(selected?.digits)}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Amount ({selected?.symbol?.split('/')[0]})</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Total</span>
                <span>≈ ${(parseFloat(price || 0) * parseFloat(amount || 0)).toFixed(2)}</span>
              </div>
              <div className="p-2 rounded-lg text-xs font-mono text-foreground" style={{ background: 'rgba(255,255,255,0.03)' }}>
                Margin: ${((parseFloat(price || 0) * parseFloat(amount || 0)) / leverage).toFixed(2)}
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={!price || !amount}
              className={`w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-40 mt-auto ${
                side === 'buy'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}>
              {side === 'buy' ? '▲ Buy/Long' : '▼ Sell/Short'}
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="h-32 border-t border-white/10 overflow-y-auto" style={{ background: '#050509' }}>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-white/10 sticky top-0" style={{ background: '#0a0a0f' }}>
              <th className="px-4 py-2 text-left text-muted-foreground">Symbol</th>
              <th className="px-4 py-2 text-left text-muted-foreground">Side</th>
              <th className="px-4 py-2 text-left text-muted-foreground">Price</th>
              <th className="px-4 py-2 text-left text-muted-foreground">Amount</th>
              <th className="px-4 py-2 text-left text-muted-foreground">Total</th>
              <th className="px-4 py-2 text-left text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-3 text-center text-muted-foreground/40">No orders</td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2 text-foreground font-bold">{order.symbol}</td>
                  <td className={`px-4 py-2 font-bold ${order.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {order.side.toUpperCase()}
                  </td>
                  <td className="px-4 py-2 text-foreground">{order.price}</td>
                  <td className="px-4 py-2 text-foreground">{order.amount}</td>
                  <td className="px-4 py-2 text-foreground">${order.total}</td>
                  <td className="px-4 py-2 text-muted-foreground">{order.time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}