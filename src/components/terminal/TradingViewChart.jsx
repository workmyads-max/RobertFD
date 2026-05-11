import React, { useEffect, useRef } from 'react';

// Full TradingView symbol map for all instruments
const TV_SYMBOLS = {
  // Forex
  'EUR/USD': 'OANDA:EURUSD', 'GBP/USD': 'OANDA:GBPUSD', 'USD/JPY': 'OANDA:USDJPY',
  'AUD/USD': 'OANDA:AUDUSD', 'USD/CHF': 'OANDA:USDCHF', 'USD/CAD': 'OANDA:USDCAD',
  'NZD/USD': 'OANDA:NZDUSD', 'EUR/GBP': 'OANDA:EURGBP', 'EUR/JPY': 'OANDA:EURJPY',
  'GBP/JPY': 'OANDA:GBPJPY', 'AUD/JPY': 'OANDA:AUDJPY', 'USD/MXN': 'OANDA:USDMXN',
  // Metals
  'XAU/USD': 'OANDA:XAUUSD', 'XAG/USD': 'OANDA:XAGUSD',
  'XPT/USD': 'NYMEX:PL1!', 'XPD/USD': 'NYMEX:PA1!',
  // Crypto
  'BTC/USD': 'BITSTAMP:BTCUSD', 'ETH/USD': 'BITSTAMP:ETHUSD',
  'BNB/USD': 'BINANCE:BNBUSDT', 'SOL/USD': 'BINANCE:SOLUSDT',
  'XRP/USD': 'BITSTAMP:XRPUSD', 'ADA/USD': 'COINBASE:ADAUSD',
  'DOGE/USD': 'BINANCE:DOGEUSDT', 'LTC/USD': 'BITSTAMP:LTCUSD',
  // Indices
  'NAS100': 'NASDAQ:NDX', 'US30': 'DJ:DJI', 'SPX500': 'SP:SPX', 'VIX': 'CBOE:VIX',
  'GER40': 'XETR:DAX', 'UK100': 'LSE:UKX', 'FRA40': 'EURONEXT:PX1',
  // Stocks
  'AAPL': 'NASDAQ:AAPL', 'TSLA': 'NASDAQ:TSLA', 'AMZN': 'NASDAQ:AMZN',
  'MSFT': 'NASDAQ:MSFT', 'GOOGL': 'NASDAQ:GOOGL', 'META': 'NASDAQ:META',
  'NFLX': 'NASDAQ:NFLX', 'NVDA': 'NASDAQ:NVDA', 'AMD': 'NASDAQ:AMD',
  'BABA': 'NYSE:BABA', 'DIS': 'NYSE:DIS', 'JPM': 'NYSE:JPM',
  // Commodities
  'OIL': 'NYMEX:CL1!', 'BRENT': 'ICEEUR:B1!', 'NGAS': 'NYMEX:NG1!', 'WHEAT': 'CBOT:ZW1!',
};

export default function TradingViewChart({ symbol, timeframe }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const tvSymbol = TV_SYMBOLS[symbol] || `OANDA:${symbol?.replace('/', '')}`;

  useEffect(() => {
    if (!outerRef.current) return;

    // Create a fresh inner div so TradingView owns its own subtree
    // and can't crash when the parent is unmounted
    const inner = document.createElement('div');
    inner.style.height = '100%';
    inner.style.width = '100%';
    innerRef.current = inner;
    outerRef.current.appendChild(inner);

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.height = '100%';
    widget.style.width = '100%';
    inner.appendChild(widget);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: timeframe || '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#07070b',
      gridColor: 'rgba(255,255,255,0.04)',
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      withdateranges: true,
      studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
      toolbar_bg: '#07070b',
      enable_publishing: false,
      show_popup_button: false,
    });
    inner.appendChild(script);

    return () => {
      // Detach the inner subtree safely — TV script owns it so don't clear innerHTML
      try {
        if (outerRef.current && inner.parentNode === outerRef.current) {
          outerRef.current.removeChild(inner);
        }
      } catch {}
    };
  }, [tvSymbol, timeframe]);

  return (
    <div
      ref={outerRef}
      className="tradingview-widget-container"
      style={{ height: '100%', width: '100%', overflow: 'hidden' }}
    />
  );
}