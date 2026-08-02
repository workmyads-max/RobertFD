import React from 'react';
import { Gift } from 'lucide-react';

/**
 * Static promotional banner — Buy 2 Challenges, Get 1 Free.
 * No backend logic, no admin toggle. Edit text here directly.
 */
export default function B2G1Banner({ className = '' }) {
  return (
    <div
      className={`rounded-2xl p-5 flex items-center gap-4 flex-wrap ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,92,0,0.08), rgba(255,92,0,0.03))',
        border: '1.5px solid rgba(255,92,0,0.25)',
      }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)' }}>
        <Gift className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-black text-primary uppercase tracking-wide">
          Buy 2 Challenges, Get 1 Free
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Buy two challenges of the same size and receive a third account on us — added to your order at no cost.
        </div>
      </div>
    </div>
  );
}