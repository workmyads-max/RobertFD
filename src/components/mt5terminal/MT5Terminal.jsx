import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, LogOut, LogIn, AlertTriangle, Wifi } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MT5Watchlist from './MT5Watchlist';
import MT5Chart from './MT5Chart';
import MT5OrderPanel from './MT5OrderPanel';
import MT5PositionsBar from './MT5PositionsBar';

const DEFAULT_SYMBOLS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD',
  'XAUUSD', 'XAGUSD', 'BTCUSD', 'US500', 'US30', 'USTEC',
];

export default function MT5Terminal() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [account, setAccount] = useState(null);
  const [mtLogin, setMtLogin] = useState('');
  const [userAccounts, setUserAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');
  const [quotes, setQuotes] = useState({});
  const [positions, setPositions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [volume, setVolume] = useState(0.01);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMsg, setTradeMsg] = useState(null);

  // ── Load user's MT5 accounts on mount ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getUserAccounts', {});
        const accs = (res?.data?.accounts || []).filter(a => a.mt_login && ['active', 'funded', 'passed'].includes(a.status));
        setUserAccounts(accs);
      } catch (_) {}
      setLoadingAccounts(false);
    })();
  }, []);

  // ── Connect to an MT5 login ─────────────────────────────────────────────────
  const handleConnect = useCallback(async (login) => {
    setConnecting(true);
    setConnectError('');
    try {
      const res = await base44.functions.invoke('mt5TerminalConnect', { mt_login: String(login) });
      if (res?.data?.success) {
        setAccount(res.data.account);
        setMtLogin(String(login));
        setConnected(true);
      } else {
        setConnectError(res?.data?.error || 'Connection failed');
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.data?.error || e.message || 'Connection failed';
      setConnectError(msg);
    }
    setConnecting(false);
  }, []);

  const handleDisconnect = () => {
    setConnected(false);
    setAccount(null);
    setMtLogin('');
    setQuotes({});
    setPositions([]);
    setSummary(null);
    setPriceHistory([]);
  };

  // ── Live quotes polling (every 2s) ──────────────────────────────────────────
  useEffect(() => {
    if (!connected) return;
    let active = true;
    const poll = async () => {
      try {
        const res = await base44.functions.invoke('mt5TerminalQuotes', { symbols: DEFAULT_SYMBOLS });
        if (!active || !res?.data?.success) return;
        const qMap = {};
        for (const q of res.data.quotes) qMap[q.symbol] = q;
        setQuotes(prev => ({ ...prev, ...qMap }));
        // Append to price history for selected symbol
        const sq = qMap[selectedSymbol];
        if (sq) {
          setPriceHistory(prev => [...prev.slice(-80), { t: Date.now(), price: (sq.bid + sq.ask) / 2 }]);
        }
      } catch (_) {}
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => { active = false; clearInterval(id); };
  }, [connected, selectedSymbol]);

  // ── Positions + summary polling (every 3s) ─────────────────────────────────
  useEffect(() => {
    if (!connected || !mtLogin) return;
    let active = true;
    const poll = async () => {
      try {
        const res = await base44.functions.invoke('mt5TerminalPositions', { mt_login: mtLogin });
        if (!active || !res?.data?.success) return;
        setPositions(res.data.positions);
        setSummary(res.data.summary);
      } catch (_) {}
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => { active = false; clearInterval(id); };
  }, [connected, mtLogin]);

  // ── Reset price history when symbol changes ────────────────────────────────
  useEffect(() => { setPriceHistory([]); }, [selectedSymbol]);

  // ── Trade execution ────────────────────────────────────────────────────────
  const handleTrade = useCallback(async (action, extra = {}) => {
    setTradeLoading(true);
    setTradeMsg(null);
    try {
      const res = await base44.functions.invoke('mt5TerminalTrade', { mt_login: mtLogin, action, ...extra });
      if (res?.data?.success) {
        setTradeMsg({ type: 'success', text: `${action.toUpperCase()} order executed.` });
      } else {
        setTradeMsg({ type: 'error', text: res?.data?.error || 'Trade failed' });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.data?.error || e.message || 'Trade failed';
      setTradeMsg({ type: 'error', text: msg });
    }
    setTradeLoading(false);
    setTimeout(() => setTradeMsg(null), 5000);
  }, [mtLogin]);

  // ══════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (!connected) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.25)' }}>
              <Wifi className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">MT5 Web Terminal</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect to MetaTrader 5</h2>
            <p className="text-sm text-muted-foreground">Enter your MT5 trading login to access live charts, prices, and order execution.</p>
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            {/* Quick-select existing accounts */}
            {loadingAccounts ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : userAccounts.length > 0 ? (
              <div className="space-y-2 mb-5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Your MT5 Accounts</div>
                {userAccounts.map(acc => (
                  <button key={acc.id} onClick={() => handleConnect(acc.mt_login)} disabled={connecting}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:border-primary/40 disabled:opacity-50 text-left"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid hsl(var(--border))' }}>
                    <div>
                      <div className="text-sm font-bold text-white">Login {acc.mt_login}</div>
                      <div className="text-[10px] text-muted-foreground">{acc.challenge_type} · ${acc.account_size?.toLocaleString()}</div>
                    </div>
                    <LogIn className="w-4 h-4 text-primary" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl px-4 py-3 mb-5 text-center"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p className="text-xs text-muted-foreground">No active MT5 accounts found. Enter your login manually below.</p>
              </div>
            )}

            {/* Manual login input */}
            <div className="border-t pt-5" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Enter MT5 Login Manually</div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={mtLogin}
                  onChange={(e) => setMtLogin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && mtLogin && handleConnect(mtLogin)}
                  placeholder="e.g. 12345678"
                  disabled={connecting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white bg-background border border-border focus:border-primary outline-none tabular"
                  style={{ background: 'hsl(var(--input))' }}
                />
                <button onClick={() => mtLogin && handleConnect(mtLogin)} disabled={connecting || !mtLogin}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  Connect
                </button>
              </div>
            </div>

            {connectError && (
              <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-red-300">{connectError}</span>
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-4">
            Your MT5 login must match a challenge account registered to your email.
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TERMINAL LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  const selQuote = quotes[selectedSymbol] || null;

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ background: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            MT5 · Login {mtLogin}
          </span>
          {account?.group && <span className="text-[10px] text-muted-foreground hidden sm:inline">{account.group}</span>}
        </div>
        <div className="flex items-center gap-4">
          {tradeMsg && (
            <span className={`text-[10px] font-medium ${tradeMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {tradeMsg.text}
            </span>
          )}
          <button onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-400 transition-colors"
            style={{ border: '1px solid hsl(var(--border))' }}>
            <LogOut className="w-3.5 h-3.5" /> Disconnect
          </button>
        </div>
      </div>

      {/* Main grid: watchlist | chart+order | positions */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[200px_1fr_260px] gap-px min-h-0"
        style={{ background: 'hsl(var(--border))' }}>

        {/* Left: Watchlist */}
        <div className="hidden lg:block min-h-0 overflow-hidden" style={{ background: 'hsl(var(--card))' }}>
          <MT5Watchlist
            symbols={DEFAULT_SYMBOLS}
            quotes={quotes}
            selected={selectedSymbol}
            onSelect={setSelectedSymbol}
          />
        </div>

        {/* Center: Chart + Order panel (mobile: stacked) */}
        <div className="flex flex-col min-h-0 gap-px" style={{ background: 'hsl(var(--border))' }}>
          <div className="flex-1 min-h-0" style={{ background: 'hsl(var(--card))' }}>
            <MT5Chart symbol={selectedSymbol} quote={selQuote} history={priceHistory} />
          </div>
          {/* Mobile order panel */}
          <div className="lg:hidden" style={{ background: 'hsl(var(--card))' }}>
            <MT5OrderPanel
              symbol={selectedSymbol}
              quote={selQuote}
              volume={volume}
              onVolume={setVolume}
              onBuy={() => handleTrade('buy', { symbol: selectedSymbol, volume })}
              onSell={() => handleTrade('sell', { symbol: selectedSymbol, volume })}
              loading={tradeLoading}
              leverage={account?.leverage || 100}
            />
          </div>
        </div>

        {/* Right: Order panel (desktop) */}
        <div className="hidden lg:block min-h-0 overflow-y-auto" style={{ background: 'hsl(var(--card))' }}>
          <MT5OrderPanel
            symbol={selectedSymbol}
            quote={selQuote}
            volume={volume}
            onVolume={setVolume}
            onBuy={() => handleTrade('buy', { symbol: selectedSymbol, volume })}
            onSell={() => handleTrade('sell', { symbol: selectedSymbol, volume })}
            loading={tradeLoading}
            leverage={account?.leverage || 100}
          />
        </div>
      </div>

      {/* Bottom: Positions + Footer */}
      <div className="flex-shrink-0 max-h-[40vh] overflow-hidden" style={{ background: 'hsl(var(--card))', borderTop: '1px solid hsl(var(--border))' }}>
        <MT5PositionsBar
          positions={positions}
          summary={summary}
          onClose={(ticket) => handleTrade('close', { position_id: ticket })}
          loading={tradeLoading}
        />
      </div>
    </div>
  );
}