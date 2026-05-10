// ── Instruments ──────────────────────────────────────────────────────────────
export const INSTRUMENTS = [
  // Forex Majors
  { symbol: 'EUR/USD', digits: 5, contractSize: 100000, type: 'fx',     category: 'Forex',   spreadPips: 0.00012, pipValue: 10 },
  { symbol: 'GBP/USD', digits: 5, contractSize: 100000, type: 'fx',     category: 'Forex',   spreadPips: 0.00015, pipValue: 10 },
  { symbol: 'USD/JPY', digits: 3, contractSize: 100000, type: 'fx',     category: 'Forex',   spreadPips: 0.015,   pipValue: 9  },
  { symbol: 'AUD/USD', digits: 5, contractSize: 100000, type: 'fx',     category: 'Forex',   spreadPips: 0.00020, pipValue: 10 },
  { symbol: 'USD/CHF', digits: 5, contractSize: 100000, type: 'fx',     category: 'Forex',   spreadPips: 0.00018, pipValue: 9  },
  { symbol: 'USD/CAD', digits: 5, contractSize: 100000, type: 'fx',     category: 'Forex',   spreadPips: 0.00022, pipValue: 7  },
  // Metals
  { symbol: 'XAU/USD', digits: 2, contractSize: 100,    type: 'metal',  category: 'Metals',  spreadPips: 0.35,    pipValue: 1  },
  { symbol: 'XAG/USD', digits: 3, contractSize: 5000,   type: 'metal',  category: 'Metals',  spreadPips: 0.025,   pipValue: 50 },
  // Crypto
  { symbol: 'BTC/USD', digits: 2, contractSize: 1,      type: 'crypto', category: 'Crypto',  spreadPips: 25,      pipValue: 1  },
  { symbol: 'ETH/USD', digits: 2, contractSize: 1,      type: 'crypto', category: 'Crypto',  spreadPips: 1.5,     pipValue: 1  },
  // Indices
  { symbol: 'NAS100',  digits: 2, contractSize: 1,      type: 'index',  category: 'Indices', spreadPips: 1.2,     pipValue: 1  },
  { symbol: 'US30',    digits: 2, contractSize: 1,      type: 'index',  category: 'Indices', spreadPips: 2.0,     pipValue: 1  },
  { symbol: 'SPX500',  digits: 2, contractSize: 1,      type: 'index',  category: 'Indices', spreadPips: 0.8,     pipValue: 1  },
];

export const SEED_PRICES = {
  'EUR/USD': 1.08215,
  'GBP/USD': 1.27048,
  'USD/JPY': 154.780,
  'AUD/USD': 0.67234,
  'USD/CHF': 0.89450,
  'USD/CAD': 1.36210,
  'XAU/USD': 2338.15,
  'XAG/USD': 27.450,
  'BTC/USD': 65420.00,
  'ETH/USD': 3185.00,
  'NAS100':  18254.00,
  'US30':    39810.00,
  'SPX500':  5210.00,
};

// ── Account Rules ─────────────────────────────────────────────────────────────
export function getAccountRules(account) {
  const isSwing   = account?.account_type === 'swing';
  const isInstant = account?.challenge_type === 'instant';
  const phase     = account?.phase || 'phase1';
  const leverage  = isSwing ? 30 : 100;

  return {
    leverage,
    dailyDDLimit:      isInstant ? 3 : 5,
    maxDDLimit:        isInstant ? 8 : 10,
    profitTarget:      isInstant ? 8 : phase === 'phase2' ? 5 : 10,
    minTradingDays:    isInstant ? 0 : phase === 'phase2' ? 5 : 4,
    newsTrading:       isSwing,
    overnightHolding:  isSwing,
    weekendHolding:    isSwing,
    maxLotsPerTrade:   isSwing ? 5 : 20,
    stopOutLevel:      50,    // % margin level → stop out
    marginCallLevel:   100,   // % margin level → margin call
    accountType:       isSwing ? 'Swing' : 'Standard',
  };
}

// ── Margin Calculation (MT5-style) ────────────────────────────────────────────
export function calcRequiredMargin(symbol, lots, leverage, currentPrice) {
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  if (!inst || !currentPrice) return 0;
  const lev = leverage || 100;

  if (inst.type === 'fx' || inst.type === 'metal') {
    // Margin = (Lots × ContractSize × Price) / Leverage — normalised to USD
    const isUsdBase    = symbol.startsWith('USD/');
    const contractVal  = isUsdBase ? lots * inst.contractSize : lots * inst.contractSize * currentPrice;
    return parseFloat((contractVal / lev).toFixed(2));
  }
  if (inst.type === 'crypto' || inst.type === 'index') {
    return parseFloat(((lots * currentPrice) / lev).toFixed(2));
  }
  return 0;
}

// ── P&L Calculation ───────────────────────────────────────────────────────────
export function calcPnl(pos, currentPrice) {
  const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
  if (!inst || !currentPrice) return 0;
  const diff = pos.type === 'BUY' ? currentPrice - pos.entry : pos.entry - currentPrice;
  let pnl = 0;
  if (inst.type === 'fx') {
    pnl = diff * pos.lots * inst.contractSize;
  } else if (inst.type === 'metal') {
    pnl = diff * pos.lots * inst.contractSize;
  } else {
    pnl = diff * pos.lots;
  }
  return parseFloat(pnl.toFixed(2));
}

// ── Sessions ──────────────────────────────────────────────────────────────────
export const SESSIONS = [
  { name: 'Sydney',   open: 21, close: 6,  color: '#60a5fa', utcOffset: 10 },
  { name: 'Tokyo',    open: 0,  close: 9,  color: '#f59e0b', utcOffset: 9  },
  { name: 'London',   open: 7,  close: 16, color: '#10b981', utcOffset: 0  },
  { name: 'New York', open: 12, close: 21, color: '#FF5C00', utcOffset: -5 },
];

export function getActiveSession() {
  const utcHour = new Date().getUTCHours();
  return SESSIONS.find(s => {
    if (s.open < s.close) return utcHour >= s.open && utcHour < s.close;
    return utcHour >= s.open || utcHour < s.close;
  }) || null;
}