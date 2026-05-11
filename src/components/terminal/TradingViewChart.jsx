import React, { useEffect, useRef, useState } from 'react';

const TV_SYMBOLS = {
  'EUR/USD': 'OANDA:EURUSD', 'GBP/USD': 'OANDA:GBPUSD', 'USD/JPY': 'OANDA:USDJPY',
  'AUD/USD': 'OANDA:AUDUSD', 'USD/CHF': 'OANDA:USDCHF', 'USD/CAD': 'OANDA:USDCAD',
  'NZD/USD': 'OANDA:NZDUSD', 'EUR/GBP': 'OANDA:EURGBP', 'EUR/JPY': 'OANDA:EURJPY',
  'GBP/JPY': 'OANDA:GBPJPY', 'AUD/JPY': 'OANDA:AUDJPY', 'USD/MXN': 'OANDA:USDMXN',
  'XAU/USD': 'OANDA:XAUUSD', 'XAG/USD': 'OANDA:XAGUSD',
  'XPT/USD': 'NYMEX:PL1!', 'XPD/USD': 'NYMEX:PA1!',
  'BTC/USD': 'BITSTAMP:BTCUSD', 'ETH/USD': 'BITSTAMP:ETHUSD',
  'BNB/USD': 'BINANCE:BNBUSDT', 'SOL/USD': 'BINANCE:SOLUSDT',
  'XRP/USD': 'BITSTAMP:XRPUSD', 'ADA/USD': 'COINBASE:ADAUSD',
  'DOGE/USD': 'BINANCE:DOGEUSDT', 'LTC/USD': 'BITSTAMP:LTCUSD',
  'NAS100': 'NASDAQ:NDX', 'US30': 'DJ:DJI', 'SPX500': 'SP:SPX', 'VIX': 'CBOE:VIX',
  'GER40': 'XETR:DAX', 'UK100': 'LSE:UKX', 'FRA40': 'EURONEXT:PX1',
  'AAPL': 'NASDAQ:AAPL', 'TSLA': 'NASDAQ:TSLA', 'AMZN': 'NASDAQ:AMZN',
  'MSFT': 'NASDAQ:MSFT', 'GOOGL': 'NASDAQ:GOOGL', 'META': 'NASDAQ:META',
  'NFLX': 'NASDAQ:NFLX', 'NVDA': 'NASDAQ:NVDA', 'AMD': 'NASDAQ:AMD',
  'BABA': 'NYSE:BABA', 'DIS': 'NYSE:DIS', 'JPM': 'NYSE:JPM',
  'OIL': 'NYMEX:CL1!', 'BRENT': 'ICEEUR:B1!', 'NGAS': 'NYMEX:NG1!', 'WHEAT': 'CBOT:ZW1!',
};

const TF_MAP = {
  '1': '1', '5': '5', '15': '15', '30': '30',
  '60': '60', '240': '240', 'D': 'D', 'W': 'W',
};

export default function TradingViewChart({ symbol, timeframe }) {
  const [key, setKey] = useState(0);
  const tvSymbol = TV_SYMBOLS[symbol] || `OANDA:${symbol?.replace('/', '')}`;
  const interval = TF_MAP[timeframe] || '60';

  // Force remount when symbol/timeframe changes
  useEffect(() => {
    setKey(k => k + 1);
  }, [tvSymbol, interval]);

  const src = `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${encodeURIComponent(tvSymbol)}&interval=${interval}&theme=dark&style=1&locale=en&toolbar_bg=%23070b14&enable_publishing=0&hide_top_toolbar=0&hide_legend=0&save_image=0&calendar=0&studies=RSI%40tv-basicstudies%7CMACD%40tv-basicstudies&hide_side_toolbar=0&allow_symbol_change=0&withdateranges=1&backgroundColor=%23070b14&gridColor=rgba(255%2C255%2C255%2C0.04)`;

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', background: '#070b14' }}>
      <iframe
        key={key}
        src={src}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        allowFullScreen
        allow="fullscreen"
        title={`Chart ${tvSymbol}`}
      />
    </div>
  );
}