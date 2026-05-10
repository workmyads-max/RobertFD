import React, { useEffect, useRef, useState } from 'react';

const TV_SYMBOLS = {
  'EUR/USD': 'OANDA:EURUSD',
  'GBP/USD': 'OANDA:GBPUSD',
  'USD/JPY': 'OANDA:USDJPY',
  'AUD/USD': 'OANDA:AUDUSD',
  'USD/CHF': 'OANDA:USDCHF',
  'USD/CAD': 'OANDA:USDCAD',
  'XAU/USD': 'OANDA:XAUUSD',
  'XAG/USD': 'OANDA:XAGUSD',
  'BTC/USD': 'BITSTAMP:BTCUSD',
  'ETH/USD': 'BITSTAMP:ETHUSD',
  'NAS100':  'NASDAQ:QQQ',
  'US30':    'DJ:DJI',
  'SPX500':  'SP:SPX',
};

export default function TradingViewChart({ symbol, timeframe }) {
  const containerRef = useRef(null);
  const tvSymbol = TV_SYMBOLS[symbol] || 'OANDA:EURUSD';

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize:          true,
      symbol:            tvSymbol,
      interval:          timeframe || '60',
      timezone:          'Etc/UTC',
      theme:             'dark',
      style:             '1',
      locale:            'en',
      backgroundColor:   '#07070b',
      gridColor:         'rgba(255,255,255,0.04)',
      allow_symbol_change: false,
      hide_top_toolbar:  false,
      hide_legend:       false,
      save_image:        false,
      calendar:          false,
      hide_volume:       false,
      support_host:      'https://www.tradingview.com',
      withdateranges:    true,
      studies:           [],
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [tvSymbol, timeframe]);

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
      <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
    </div>
  );
}