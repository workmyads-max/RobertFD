import React from 'react';
import { getCurrencyFlag } from '@/lib/newsTradingConfig';

/**
 * CurrencyFlag - shows the flag emoji + currency code for an event's instrument.
 */
export default function CurrencyFlag({ currency, size = 'sm' }) {
  const flag = getCurrencyFlag(currency);
  const fs = size === 'lg' ? 'text-xl' : 'text-base';

  return (
    <div className="flex items-center gap-2">
      <span className={fs} style={{ lineHeight: 1 }}>{flag}</span>
      <span className="text-xs font-bold font-mono text-white/70">{currency}</span>
    </div>
  );
}