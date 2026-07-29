import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

/**
 * RiskAdherenceMonitor — 1% max risk-per-trade warning card (user-facing).
 *
 * Displayed ONLY for funded live accounts on the Account Overview page.
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
  const pct = Math.min(100, (count / limit) * 100);

  const Icon = isCritical ? ShieldAlert : isWarning ? AlertTriangle : ShieldCheck;
  const statusLabel = isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'COMPLIANT';

  // Solid rectangular status pill (flat, no translucency)
  const status = isCritical
    ? { bg: '#7f1d1d', text: '#fecaca', border: '#991b1b', bar: '#ef4444' }
    : isWarning
      ? { bg: '#78350f', text: '#fde68a', border: '#92400e', bar: '#f59e0b' }
      : { bg: '#064e3b', text: '#a7f3d0', border: '#065f46', bar: '#10b981' };

  return (
    <div className="rounded-xl bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary">
            <Icon className="w-4 h-4 text-foreground/70" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">1% Risk-Per-Trade Monitor</div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
              {account.account_id} · MT5 {account.mt_login}
            </div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
          style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}>
          {statusLabel}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {/* Counter + bar */}
        <div className="flex items-end justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Risk Violations</span>
          <span className="text-lg font-bold tabular text-foreground">
            {count}<span className="text-muted-foreground font-normal"> / {limit}</span>
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-secondary">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: status.bar }} />
        </div>

        {/* Most recent violation */}
        {count > 0 && Array.isArray(account.risk_violations) && account.risk_violations.length > 0 && (
          <div className="mt-4 rounded-lg border border-border bg-muted px-3.5 py-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Most Recent Violation</div>
            {(() => {
              const v = account.risk_violations[account.risk_violations.length - 1];
              return (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular">
                  <span className="font-semibold text-foreground">{v.symbol}</span>
                  <span className="text-muted-foreground">{v.type} · {Number(v.lots).toFixed(2)} lots</span>
                  <span style={{ color: status.bar }}>-${Math.abs(v.pnl).toFixed(2)} ({v.loss_pct}%)</span>
                </div>
              );
            })()}
          </div>
        )}

        {/* Compliance note */}
        <div className="mt-4 pt-3.5 border-t border-border">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Risk Management Adherence: </span>
            Our platform requires a maximum risk of 1% per individual trade to ensure institutional-grade
            capital preservation. Excessive risk-taking is monitored; exceeding the established threshold
            of 7 violations will lead to a formal review of your Funded Account contract and may result in
            immediate termination.
          </p>
        </div>
      </div>
    </div>
  );
}