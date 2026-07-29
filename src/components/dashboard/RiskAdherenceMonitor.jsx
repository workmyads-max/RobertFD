import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

/**
 * RiskAdherenceMonitor — 1% max risk-per-trade warning card (user-facing).
 *
 * Displays the trader's running count of risk-limit violations (closed trades
 * that lost more than 1% of account size) out of the 7-warning threshold.
 * This is a WARNING system only — it never auto-breaches the account.
 * At 7 violations the card turns red (critical) and surfaces the contract-
 * termination notice. Only admins can terminate a funded contract manually.
 */
export default function RiskAdherenceMonitor({ account }) {
  if (!account) return null;

  const count = account.risk_violations_count || 0;
  const level = account.risk_warning_level || 'none';
  const isCritical = level === 'critical' || count >= 7;
  const isWarning = count > 0 && !isCritical;
  const limit = 7;

  // Color states (flat, solid — no glows)
  const accent = isCritical
    ? { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#f87171', bar: '#ef4444' }
    : isWarning
      ? { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24', bar: '#f59e0b' }
      : { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.18)', text: '#34d399', bar: '#10b981' };

  const Icon = isCritical ? ShieldAlert : isWarning ? AlertTriangle : ShieldCheck;
  const statusLabel = isCritical ? 'CRITICAL — RED FLAG' : isWarning ? 'WARNING' : 'COMPLIANT';
  const pct = Math.min(100, (count / limit) * 100);

  return (
    <div className="rounded-xl p-5" style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Icon className="w-4 h-4" style={{ color: accent.text }} />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">1% Risk-Per-Trade Monitor</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {account.account_id} · MT5 {account.mt_login}
            </div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
          style={{ background: accent.text + '22', color: accent.text, border: `1px solid ${accent.border}` }}>
          {statusLabel}
        </span>
      </div>

      {/* Counter + bar */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <span className="text-xs text-muted-foreground">Risk Violations</span>
          <span className="text-sm font-bold tabular" style={{ color: accent.text }}>
            {count} <span className="text-muted-foreground font-normal">/ {limit}</span>
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accent.bar }} />
        </div>
      </div>

      {/* Last violation */}
      {count > 0 && Array.isArray(account.risk_violations) && account.risk_violations.length > 0 && (
        <div className="rounded-lg px-3 py-2.5 mb-4 text-xs"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Most Recent Violation</div>
          {(() => {
            const v = account.risk_violations[account.risk_violations.length - 1];
            return (
              <div className="flex flex-wrap gap-x-4 gap-y-1 tabular">
                <span className="text-foreground font-semibold">{v.symbol}</span>
                <span className="text-muted-foreground">{v.type} · {Number(v.lots).toFixed(2)} lots</span>
                <span style={{ color: accent.text }}>-${Math.abs(v.pnl).toFixed(2)} ({v.loss_pct}%)</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Professional compliance note */}
      <div className="text-[11px] leading-relaxed text-muted-foreground border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <span className="font-semibold text-foreground">Risk Management Adherence: </span>
        Our platform requires a maximum risk of 1% per individual trade to ensure institutional-grade
        capital preservation. Excessive risk-taking is monitored; exceeding the established threshold
        of 7 violations will lead to a formal review of your Funded Account contract and may result in
        immediate termination.
      </div>
    </div>
  );
}