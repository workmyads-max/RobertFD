import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Two-Step fee-refund note. Display-only — shown on the Two-Step
 * buy-challenge / checkout areas so users see the refund policy before buying.
 */
export default function FeeRefundNote({ className = '' }) {
  return (
    <div className={`rounded-2xl px-5 py-4 flex items-start gap-4 ${className}`}
      style={{ background: 'hsl(var(--card))', border: '1px solid rgba(16,185,129,0.22)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <RefreshCw className="w-5 h-5 text-emerald-400" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-emerald-400">Fee Refund</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
            Two-Step
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your challenge fee is refunded with your first reward payout. Pass Phase 1 and Phase 2, receive your
          live Simulation Funded Account, request your first payout, and the original fee is returned to you
          together with that payout.
        </p>
      </div>
    </div>
  );
}