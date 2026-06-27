import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Two-Step fee-refund note. Display-only — shown on the Two-Step
 * buy-challenge / checkout areas so users see the refund policy before buying.
 */
export default function FeeRefundNote({ className = '' }) {
  return (
    <div className={`rounded-xl px-4 py-3.5 flex items-start gap-3 ${className}`}
      style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(16,185,129,0.12)' }}>
        <RefreshCw className="w-4 h-4 text-emerald-400" />
      </div>
      <div>
        <div className="text-sm font-bold text-emerald-400 mb-0.5">Fee Refund</div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your Two-Step challenge fee is refunded — once you pass Phase 1 and Phase 2, receive your live
          Simulation Funded Account, and take your first reward payout, your original challenge fee is
          returned with that first payout.
        </p>
      </div>
    </div>
  );
}