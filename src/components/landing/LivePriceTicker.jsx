import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Fallback static prices while loading
const FALLBACK = [
  { symbol: 'BTC/USD', price: '67842', change: '+2.34', up: true },
  { symbol: 'ETH/USD', price: '3421', change: '+1.82', up: true },
  { symbol: 'XAU/USD', price: '2342', change: '+0.44', up: true },
  { symbol: 'EUR/USD', price: '1.0847', change: '-0.12', up: false },
  { symbol: 'GBP/USD', price: '1.2634', change: '+0.08', up: true },
  { symbol: 'SPX500', price: '5218', change: '+0.62', up: true },
  { symbol: 'NAS100', price: '18421', change: '+0.91', up: true },
  { symbol: 'US30', price: '39102', change: '+0.38', up: true },
  { symbol: 'AAPL', price: '212.49', change: '+0.73', up: true },
  { symbol: 'NVDA', price: '875.32', change: '+2.15', up: true },
];

export default function LivePriceTicker() {
  const [prices, setPrices] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Return real-time market prices as of today for these instruments: BTC/USD, ETH/USD, XAU/USD (Gold), EUR/USD, GBP/USD, SPX500 (S&P500), NAS100 (Nasdaq100), US30 (Dow Jones), AAPL (Apple stock), NVDA (Nvidia stock).
For each, return the current price and 24h change percentage.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              prices: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    symbol: { type: 'string' },
                    price: { type: 'string' },
                    change: { type: 'string' },
                    up: { type: 'boolean' },
                  },
                },
              },
            },
          },
        });
        if (result?.prices?.length > 0) {
          setPrices(result.prices);
        }
      } catch {
        // Keep fallback
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const allPrices = [...prices, ...prices];

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-border/30 py-3 overflow-hidden bg-background/80 backdrop-blur-sm">
      <div className="ticker-scroll flex items-center gap-10 whitespace-nowrap">
        {allPrices.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-xs font-mono text-muted-foreground flex-shrink-0">
            <span>{item.symbol}</span>
            <span className={item.up ? 'text-emerald-400' : 'text-red-400'}>
              {item.price.toString().startsWith('$') ? item.price : `${item.price}`}
            </span>
            {item.change && (
              <span className={`text-[10px] ${item.up ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                {item.change.toString().startsWith('+') || item.change.toString().startsWith('-')
                  ? `${item.change}%`
                  : item.change}
              </span>
            )}
            <span className="text-border ml-2">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}