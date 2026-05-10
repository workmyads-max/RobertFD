// ── Instruments (Full Broker Suite) ─────────────────────────────────────────
export const INSTRUMENTS = [
  // ── Forex Majors ──────────────────────────────────────────────────────────
  { symbol: 'EUR/USD', digits: 5, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.00012, pipValue: 10, description: 'Euro vs US Dollar' },
  { symbol: 'GBP/USD', digits: 5, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.00015, pipValue: 10, description: 'British Pound vs US Dollar' },
  { symbol: 'USD/JPY', digits: 3, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.015, pipValue: 9, description: 'US Dollar vs Japanese Yen' },
  { symbol: 'AUD/USD', digits: 5, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.00018, pipValue: 10, description: 'Australian Dollar vs US Dollar' },
  { symbol: 'USD/CHF', digits: 5, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.00018, pipValue: 9, description: 'US Dollar vs Swiss Franc' },
  { symbol: 'USD/CAD', digits: 5, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.00020, pipValue: 7, description: 'US Dollar vs Canadian Dollar' },
  { symbol: 'NZD/USD', digits: 5, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.00020, pipValue: 10, description: 'New Zealand Dollar vs US Dollar' },
  { symbol: 'EUR/GBP', digits: 5, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.00014, pipValue: 12, description: 'Euro vs British Pound' },
  { symbol: 'EUR/JPY', digits: 3, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.018, pipValue: 9, description: 'Euro vs Japanese Yen' },
  { symbol: 'GBP/JPY', digits: 3, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.022, pipValue: 9, description: 'British Pound vs Japanese Yen' },
  { symbol: 'AUD/JPY', digits: 3, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.020, pipValue: 9, description: 'Australian Dollar vs Japanese Yen' },
  { symbol: 'USD/MXN', digits: 4, contractSize: 100000, type: 'fx', category: 'Forex', spreadPips: 0.0030, pipValue: 5, description: 'US Dollar vs Mexican Peso' },
  // ── Metals ────────────────────────────────────────────────────────────────
  { symbol: 'XAU/USD', digits: 2, contractSize: 100, type: 'metal', category: 'Metals', spreadPips: 0.35, pipValue: 1, description: 'Gold vs US Dollar' },
  { symbol: 'XAG/USD', digits: 3, contractSize: 5000, type: 'metal', category: 'Metals', spreadPips: 0.025, pipValue: 50, description: 'Silver vs US Dollar' },
  { symbol: 'XPT/USD', digits: 2, contractSize: 50, type: 'metal', category: 'Metals', spreadPips: 0.80, pipValue: 0.5, description: 'Platinum vs US Dollar' },
  { symbol: 'XPD/USD', digits: 2, contractSize: 10, type: 'metal', category: 'Metals', spreadPips: 1.50, pipValue: 0.1, description: 'Palladium vs US Dollar' },
  // ── Crypto ────────────────────────────────────────────────────────────────
  { symbol: 'BTC/USD', digits: 2, contractSize: 1, type: 'crypto', category: 'Crypto', spreadPips: 25, pipValue: 1, description: 'Bitcoin vs US Dollar' },
  { symbol: 'ETH/USD', digits: 2, contractSize: 1, type: 'crypto', category: 'Crypto', spreadPips: 1.5, pipValue: 1, description: 'Ethereum vs US Dollar' },
  { symbol: 'BNB/USD', digits: 2, contractSize: 1, type: 'crypto', category: 'Crypto', spreadPips: 0.5, pipValue: 1, description: 'Binance Coin vs US Dollar' },
  { symbol: 'SOL/USD', digits: 3, contractSize: 1, type: 'crypto', category: 'Crypto', spreadPips: 0.08, pipValue: 1, description: 'Solana vs US Dollar' },
  { symbol: 'XRP/USD', digits: 5, contractSize: 1, type: 'crypto', category: 'Crypto', spreadPips: 0.0003, pipValue: 1, description: 'Ripple vs US Dollar' },
  { symbol: 'ADA/USD', digits: 5, contractSize: 1, type: 'crypto', category: 'Crypto', spreadPips: 0.0002, pipValue: 1, description: 'Cardano vs US Dollar' },
  { symbol: 'DOGE/USD', digits: 5, contractSize: 1, type: 'crypto', category: 'Crypto', spreadPips: 0.0001, pipValue: 1, description: 'Dogecoin vs US Dollar' },
  { symbol: 'LTC/USD', digits: 3, contractSize: 1, type: 'crypto', category: 'Crypto', spreadPips: 0.05, pipValue: 1, description: 'Litecoin vs US Dollar' },
  // ── US Indices ────────────────────────────────────────────────────────────
  { symbol: 'NAS100', digits: 2, contractSize: 1, type: 'index', category: 'Indices', spreadPips: 1.2, pipValue: 1, description: 'NASDAQ 100 Index' },
  { symbol: 'US30',   digits: 2, contractSize: 1, type: 'index', category: 'Indices', spreadPips: 2.0, pipValue: 1, description: 'Dow Jones 30 Index' },
  { symbol: 'SPX500', digits: 2, contractSize: 1, type: 'index', category: 'Indices', spreadPips: 0.8, pipValue: 1, description: 'S&P 500 Index' },
  { symbol: 'VIX',    digits: 2, contractSize: 1, type: 'index', category: 'Indices', spreadPips: 0.05, pipValue: 1, description: 'Volatility Index' },
  // ── European Indices ──────────────────────────────────────────────────────
  { symbol: 'GER40',  digits: 2, contractSize: 1, type: 'index', category: 'Indices', spreadPips: 1.5, pipValue: 1, description: 'Germany DAX 40' },
  { symbol: 'UK100',  digits: 2, contractSize: 1, type: 'index', category: 'Indices', spreadPips: 1.0, pipValue: 1, description: 'UK FTSE 100' },
  { symbol: 'FRA40',  digits: 2, contractSize: 1, type: 'index', category: 'Indices', spreadPips: 1.0, pipValue: 1, description: 'France CAC 40' },
  // ── US Stocks ─────────────────────────────────────────────────────────────
  { symbol: 'AAPL',   digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.10, pipValue: 1, description: 'Apple Inc.' },
  { symbol: 'TSLA',   digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.15, pipValue: 1, description: 'Tesla Inc.' },
  { symbol: 'AMZN',   digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.20, pipValue: 1, description: 'Amazon.com Inc.' },
  { symbol: 'MSFT',   digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.12, pipValue: 1, description: 'Microsoft Corp.' },
  { symbol: 'GOOGL',  digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.15, pipValue: 1, description: 'Alphabet Inc. (Google)' },
  { symbol: 'META',   digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.15, pipValue: 1, description: 'Meta Platforms Inc.' },
  { symbol: 'NFLX',   digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.20, pipValue: 1, description: 'Netflix Inc.' },
  { symbol: 'NVDA',   digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.12, pipValue: 1, description: 'NVIDIA Corp.' },
  { symbol: 'AMD',    digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.08, pipValue: 1, description: 'Advanced Micro Devices' },
  { symbol: 'BABA',   digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.10, pipValue: 1, description: 'Alibaba Group' },
  { symbol: 'DIS',    digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.08, pipValue: 1, description: 'Walt Disney Co.' },
  { symbol: 'JPM',    digits: 2, contractSize: 1, type: 'stock', category: 'Stocks', spreadPips: 0.10, pipValue: 1, description: 'JPMorgan Chase' },
  // ── Commodities ───────────────────────────────────────────────────────────
  { symbol: 'OIL',    digits: 2, contractSize: 100, type: 'commodity', category: 'Commodities', spreadPips: 0.04, pipValue: 1, description: 'Crude Oil (WTI)' },
  { symbol: 'BRENT',  digits: 2, contractSize: 100, type: 'commodity', category: 'Commodities', spreadPips: 0.05, pipValue: 1, description: 'Brent Crude Oil' },
  { symbol: 'NGAS',   digits: 3, contractSize: 1000, type: 'commodity', category: 'Commodities', spreadPips: 0.005, pipValue: 1, description: 'Natural Gas' },
  { symbol: 'WHEAT',  digits: 2, contractSize: 5000, type: 'commodity', category: 'Commodities', spreadPips: 0.50, pipValue: 1, description: 'Wheat Futures' },
];

// ── Leverage by category ─────────────────────────────────────────────────────
// Default leverage config — can be overridden by admin settings
export const DEFAULT_LEVERAGE_CONFIG = {
  fx:        { default: 100, options: [10, 20, 30, 50, 100, 200, 500] },
  metal:     { default: 100, options: [10, 20, 50, 100, 200] },
  crypto:    { default: 10,  options: [2, 5, 10, 20, 50] },
  index:     { default: 100, options: [10, 20, 50, 100, 200] },
  stock:     { default: 10,  options: [2, 5, 10, 20] },
  commodity: { default: 50,  options: [5, 10, 20, 50, 100] },
};

// ── Commission config per category ───────────────────────────────────────────
export const DEFAULT_COMMISSION_CONFIG = {
  fx:        { type: 'spread', commissionPerLot: 0 },
  metal:     { type: 'spread', commissionPerLot: 0 },
  crypto:    { type: 'percentage', commissionPerLot: 0.1 },
  index:     { type: 'spread', commissionPerLot: 0 },
  stock:     { type: 'perLot', commissionPerLot: 2.5 },
  commodity: { type: 'spread', commissionPerLot: 0 },
};

export const SEED_PRICES = {
  // Forex
  'EUR/USD': 1.08215, 'GBP/USD': 1.27048, 'USD/JPY': 154.780,
  'AUD/USD': 0.67234, 'USD/CHF': 0.89450, 'USD/CAD': 1.36210,
  'NZD/USD': 0.60115, 'EUR/GBP': 0.85210, 'EUR/JPY': 167.120,
  'GBP/JPY': 197.430, 'AUD/JPY': 104.120, 'USD/MXN': 17.2450,
  // Metals
  'XAU/USD': 2338.15, 'XAG/USD': 27.450, 'XPT/USD': 1010.50, 'XPD/USD': 1050.00,
  // Crypto
  'BTC/USD': 65420.00, 'ETH/USD': 3185.00, 'BNB/USD': 585.00, 'SOL/USD': 145.80,
  'XRP/USD': 0.52100, 'ADA/USD': 0.45200, 'DOGE/USD': 0.15800, 'LTC/USD': 82.50,
  // Indices
  'NAS100': 18254.00, 'US30': 39810.00, 'SPX500': 5210.00, 'VIX': 14.20,
  'GER40': 18580.00, 'UK100': 8320.00, 'FRA40': 8050.00,
  // Stocks
  'AAPL': 182.50, 'TSLA': 245.80, 'AMZN': 195.40, 'MSFT': 425.20,
  'GOOGL': 172.30, 'META': 505.60, 'NFLX': 712.40, 'NVDA': 875.30,
  'AMD': 172.80, 'BABA': 78.50, 'DIS': 112.40, 'JPM': 205.80,
  // Commodities
  'OIL': 78.45, 'BRENT': 82.30, 'NGAS': 2.185, 'WHEAT': 548.00,
};

// ── Account Rules ─────────────────────────────────────────────────────────────
// GMT+4 = UTC+4. Daily DD resets at 3:00 AM GMT+4 = 23:00 UTC previous day
export const DAILY_RESET_HOUR_UTC = 23; // 23:00 UTC = 3:00 AM GMT+4

export function getAccountRules(account, adminSettings = null) {
  const isSwing        = account?.account_type === 'swing';
  const isInstant      = account?.challenge_type === 'instant';
  const isInstantLight = account?.challenge_type === 'instant_light';
  const phase          = account?.phase || 'phase1';

  // Swing = 1:30, Standard = 1:100, override by stored account leverage if set
  const rawLev = account?.leverage;
  let leverage = 100;
  if (rawLev) {
    leverage = parseInt(String(rawLev).replace('1:', '')) || 100;
  } else {
    leverage = isSwing ? 30 : 100;
  }

  // Instant Light uses trailing overall DD
  const trailingDD = isInstantLight;

  return {
    leverage,
    // Daily DD: 5% for all types
    dailyDDLimit:   5,
    // Overall DD: 10% for all types
    maxDDLimit:     10,
    // Profit target
    profitTarget:   (isInstant || isInstantLight) ? 0 : phase === 'phase2' ? 5 : 10,
    // Min trading days: 4 for phase1/phase2, 0 for instant types
    minTradingDays: (isInstant || isInstantLight) ? 0 : 4,
    // Account type rules
    newsTrading:      isSwing,
    overnightHolding: isSwing,
    weekendHolding:   isSwing,
    maxLotsPerTrade:  isSwing ? 5 : 20,
    stopOutLevel:     50,
    marginCallLevel:  100,
    accountType:      isSwing ? 'Swing' : 'Standard',
    // Instant Light: trailing overall DD protection
    trailingDD,
    // Profit split
    profitSplit: 80,
    // Instant accounts: daily withdrawals allowed
    dailyWithdrawals: isInstant || isInstantLight,
    // Challenge type label
    challengeLabel: isInstantLight ? 'Instant Light' : isInstant ? 'Instant Funding' : 'Two-Step Challenge',
  };
}

// ── Daily DD Reset Time Utilities ─────────────────────────────────────────────
// Reset is at 23:00 UTC (= 3:00 AM GMT+4) every day
export function getNextDailyReset() {
  const now = new Date();
  const reset = new Date(now);
  reset.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0);
  // If we're past today's reset, next is tomorrow
  if (now >= reset) reset.setUTCDate(reset.getUTCDate() + 1);
  return reset;
}

export function getDailyResetCountdown() {
  const next = getNextDailyReset();
  const diffMs = next - new Date();
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  const s = Math.floor((diffMs % 60000) / 1000);
  return { h, m, s, label: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` };
}

// ── Trailing DD for Instant Light ─────────────────────────────────────────────
// Protected balance = highest balance ever achieved (only moves up)
// If balance drops to (protectedBalance - 10%), account fails
export function calcTrailingDD(currentBalance, highWaterMark, accountSize) {
  const protected_ = Math.max(highWaterMark, accountSize);
  const floor = protected_ - accountSize * 0.10; // 10% of original account size
  const ddFromProtected = ((protected_ - currentBalance) / accountSize) * 100;
  return { protectedBalance: protected_, floor, ddFromProtected, breached: currentBalance <= floor };
}

// ── Get leverage for specific instrument type ────────────────────────────────
export function getLeverageForInstrument(symbol, accountLeverage = 100, adminLeverageConfig = null) {
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  if (!inst) return accountLeverage;
  
  const config = adminLeverageConfig || DEFAULT_LEVERAGE_CONFIG;
  const catConfig = config[inst.type];
  if (!catConfig) return accountLeverage;
  
  // Use the lesser of account leverage and instrument max leverage
  return Math.min(accountLeverage, catConfig.default);
}

// ── Margin Calculation (MT5-style) ────────────────────────────────────────────
export function calcRequiredMargin(symbol, lots, leverage, currentPrice) {
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  if (!inst || !currentPrice || lots <= 0) return 0;
  const lev = leverage || 100;

  if (inst.type === 'fx') {
    const isUsdBase = symbol.startsWith('USD/');
    const contractVal = isUsdBase
      ? lots * inst.contractSize
      : lots * inst.contractSize * currentPrice;
    return parseFloat((contractVal / lev).toFixed(2));
  }
  if (inst.type === 'metal') {
    return parseFloat(((lots * inst.contractSize * currentPrice) / lev).toFixed(2));
  }
  if (inst.type === 'crypto' || inst.type === 'index' || inst.type === 'stock' || inst.type === 'commodity') {
    return parseFloat(((lots * currentPrice) / lev).toFixed(2));
  }
  return 0;
}

// ── P&L Calculation (Broker-accurate) ─────────────────────────────────────────
export function calcPnl(pos, currentPrice) {
  const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
  if (!inst || !currentPrice) return 0;
  const diff = pos.type === 'BUY' ? currentPrice - pos.entry : pos.entry - currentPrice;
  let pnl = 0;

  if (inst.type === 'fx') {
    // Pip value calculation
    const pipSize = inst.digits >= 4 ? 0.0001 : 0.01;
    const pips = diff / pipSize;
    pnl = pips * inst.pipValue * pos.lots;
  } else if (inst.type === 'metal') {
    pnl = diff * pos.lots * inst.contractSize;
  } else {
    // crypto, index, stock, commodity
    pnl = diff * pos.lots;
  }

  // Add commission
  const commission = calcCommission(pos.symbol, pos.lots, pos.entry);
  pnl = pnl - commission;

  return parseFloat(pnl.toFixed(2));
}

// ── Commission Calculation ───────────────────────────────────────────────────
export function calcCommission(symbol, lots, price = 1) {
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  if (!inst) return 0;
  const config = DEFAULT_COMMISSION_CONFIG[inst.type];
  if (!config || config.commissionPerLot === 0) return 0;
  if (config.type === 'perLot') return lots * config.commissionPerLot * 2; // round-trip
  if (config.type === 'percentage') return (lots * price * config.commissionPerLot) / 100;
  return 0;
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

// ── Market Hours ──────────────────────────────────────────────────────────────
export function isMarketOpen(symbol) {
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  if (!inst) return false;
  if (inst.type === 'crypto') return true;

  const now = new Date();
  const utcDay  = now.getUTCDay();
  const utcHour = now.getUTCHours();
  const utcMin  = now.getUTCMinutes();
  const utcTime = utcHour + utcMin / 60;

  if (inst.type === 'fx' || inst.type === 'metal') {
    if (utcDay === 6 && utcTime >= 22) return false;
    if (utcDay === 0 && utcTime < 22) return false;
    return true;
  }

  if (inst.type === 'index' || inst.type === 'stock' || inst.type === 'commodity') {
    if (utcDay === 0 || utcDay === 6) return false;
    if (['NAS100', 'US30', 'SPX500', 'VIX', 'AAPL', 'TSLA', 'AMZN', 'MSFT', 'GOOGL', 'META', 'NFLX', 'NVDA', 'AMD', 'BABA', 'DIS', 'JPM'].includes(symbol)) {
      return utcTime >= 13.5 && utcTime < 20;
    }
    if (['GER40', 'FRA40'].includes(symbol)) return utcTime >= 7 && utcTime < 15.5;
    if (symbol === 'UK100') return utcTime >= 8 && utcTime < 16.5;
    if (['OIL', 'BRENT', 'NGAS'].includes(symbol)) return utcTime >= 1 && utcTime < 22;
    if (symbol === 'WHEAT') return utcTime >= 13.5 && utcTime < 20;
    return true;
  }

  return true;
}

export function getMarketClosedReason(symbol) {
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  if (!inst) return 'Unknown instrument';
  if (inst.type === 'crypto') return null;

  const now = new Date();
  const utcDay  = now.getUTCDay();
  const utcHour = now.getUTCHours();
  const utcMin  = now.getUTCMinutes();
  const utcTime = utcHour + utcMin / 60;

  if (inst.type === 'fx' || inst.type === 'metal') {
    if (utcDay === 6 && utcTime >= 22) return 'Forex market closed — Weekend';
    if (utcDay === 0 && utcTime < 22) return 'Forex market closed — Sunday (reopens 22:00 UTC)';
  }

  if (utcDay === 0 || utcDay === 6) return `${symbol} closed — Weekend`;

  if (['AAPL','TSLA','AMZN','MSFT','GOOGL','META','NFLX','NVDA','AMD','BABA','DIS','JPM','NAS100','US30','SPX500','VIX'].includes(symbol)) {
    if (utcTime < 13.5) return `${symbol} pre-market — Opens 13:30 UTC`;
    if (utcTime >= 20)  return `${symbol} after-hours — Closed at 20:00 UTC`;
  }

  return null;
}