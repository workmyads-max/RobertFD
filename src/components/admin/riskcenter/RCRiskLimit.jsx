import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * RCRiskLimit — Admin panel for the 1% risk-per-trade warning system.
 * Lists every account with risk_violations_count > 0, sorted by severity.
 * Per-violation trade details (symbol, lots, loss %, MT5 login) are expandable.
 * Audit-only: no auto-enforcement here — admins terminate contracts manually.
 */
export default function RCRiskLimit({ accounts = [] }) {
  const [expanded, setExpanded] = useState({});

  const flagged = accounts
    .filter(a => (a.risk_violations_count || 0) > 0)
    .sort((a, b) => (b.risk_violations_count || 0) - (a.risk_violations_count || 0));

  const criticalCount = flagged.filter(a => (a.risk_violations_count || 0) >= 7).length;
  const warningCount = flagged.length - criticalCount;

  if (flagged.length === 0) {
    return (
      <div className="rounded-xl px-6 py-16 text-center"
        style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <ShieldAlert className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
        <div className="text-sm font-semibold text-foreground mb-1">No Risk-Limit Violations</div>
        <div className="text-xs text-muted-foreground">
          All accounts are within the 1% max risk-per-trade limit.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-red-300/70">Red Flag (7+)</div>
          <div className="text-xl font-bold text-red-400 tabular mt-0.5">{criticalCount}</div>
        </div>
        <div className="flex-1 rounded-xl px-4 py-3"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-yellow-300/70">Warnings</div>
          <div className="text-xl font-bold text-yellow-400 tabular mt-0.5">{warningCount}</div>
        </div>
        <div className="flex-1 rounded-xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Total Flagged</div>
          <div className="text-xl font-bold text-white tabular mt-0.5">{flagged.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(14,14,18,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="grid grid-cols-12 px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-white/40 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="col-span-3">Trader / Account</div>
          <div className="col-span-2">MT5 Login</div>
          <div className="col-span-2">Type / Size</div>
          <div className="col-span-2 text-center">Violations</div>
          <div className="col-span-3 text-right">Last Violation</div>
        </div>

        {flagged.map((a) => {
          const c = a.risk_violations_count || 0;
          const isCrit = c >= 7;
          const open = expanded[a.id];
          const accent = isCrit ? '#ef4444' : '#f59e0b';
          const violations = Array.isArray(a.risk_violations) ? a.risk_violations : [];
          return (
            <div key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                onClick={() => setExpanded(s => ({ ...s, [a.id]: !s[a.id] }))}
                className="w-full grid grid-cols-12 px-4 py-3 items-center text-xs hover:bg-white/[0.02] transition-colors">
                <div className="col-span-3 text-left">
                  <div className="text-white font-medium truncate">{a.user_email}</div>
                  <div className="text-[10px] text-white/40 font-mono">{a.account_id}</div>
                </div>
                <div className="col-span-2 text-white/60 font-mono text-[11px]">{a.mt_login || '—'}</div>
                <div className="col-span-2 text-white/60 text-[11px]">
                  {a.challenge_type} · ${(a.account_size || 0).toLocaleString()}
                </div>
                <div className="col-span-2 text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold tabular"
                    style={{ background: accent + '22', color: accent, border: `1px solid ${accent}55` }}>
                    {isCrit ? <ShieldAlert className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {c} / 7
                  </span>
                </div>
                <div className="col-span-3 text-right text-white/50 text-[11px] flex items-center justify-end gap-1.5">
                  {a.last_risk_violation_at
                    ? new Date(a.last_risk_violation_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                  {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </button>

              {open && violations.length > 0 && (
                <div className="px-4 pb-3">
                  <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="grid grid-cols-12 px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-white/30 border-b"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="col-span-2">Symbol</div>
                      <div className="col-span-2">Side</div>
                      <div className="col-span-2 text-right">Lots</div>
                      <div className="col-span-2 text-right">Entry</div>
                      <div className="col-span-2 text-right">Close</div>
                      <div className="col-span-2 text-right">Loss ($ / %)</div>
                    </div>
                    {violations.slice().reverse().map((v, i) => (
                      <div key={i} className="grid grid-cols-12 px-3 py-2 text-[11px] tabular text-white/70"
                        style={{ borderBottom: i < violations.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <div className="col-span-2 font-semibold text-white">{v.symbol}</div>
                        <div className="col-span-2">{v.type}</div>
                        <div className="col-span-2 text-right">{Number(v.lots).toFixed(2)}</div>
                        <div className="col-span-2 text-right">{Number(v.entry).toFixed(2)}</div>
                        <div className="col-span-2 text-right">{Number(v.close).toFixed(2)}</div>
                        <div className="col-span-2 text-right text-red-400">
                          -${Math.abs(v.pnl).toFixed(2)} <span className="text-white/40">({v.loss_pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {isCrit && (
                    <div className="mt-3 px-3 py-2 rounded-lg text-[11px] text-red-300 flex items-center gap-2"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                      This account has reached the 7-violation red-flag threshold. Review the trader's risk
                      behavior and terminate the funded contract manually if appropriate.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-white/40 leading-relaxed">
        Audit-only monitor. The 1% risk-per-trade rule issues warnings — it never auto-breaches accounts.
        Admin action (manual contract termination) is required to close a flagged funded account.
      </p>
    </div>
  );
}