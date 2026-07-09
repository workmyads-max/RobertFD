import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Two-Step fee-refund note. Display-only — shown on the Two-Step
 * buy-challenge / checkout areas so users see the refund policy before buying.
 */
export default function FeeRefundNote({ className = '' }) {
  return (
    <div className={`rounded-lg px-5 py-4 flex items-start gap-4 ${className}`}
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <RefreshCw className="w-4 h-4 text-white/50" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white/80">Fee Refund</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
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