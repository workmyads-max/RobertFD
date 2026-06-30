import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

// Shows the account type + rule status banner at the top of the terminal
// Green = allowed, Red = restricted
export default function AccountStatusBanner({ account, rules }) {
  if (!account || !rules) return null;

  const isSwing    = rules.accountType === 'Swing';
  const challengeLabel = rules.challengeLabel || 'Two-Step Challenge';
  const accountSize = account.account_size || 0;
  const phase = (account.phase || 'phase1').replace('phase', 'Phase ');

  const ruleItems = [
    {
      label: 'News Trading',
      allowed: rules.newsTrading,
      restrictedMsg: 'Standard - News restricted',
    },
    {
      label: 'Overnight Hold',
      allowed: rules.overnightHolding,
      restrictedMsg: 'Standard - No overnight',
    },
    {
      label: 'Weekend Hold',
      allowed: rules.weekendHolding,
      restrictedMsg: 'Standard - No weekend',
    },
    {
      label: `1:${rules.leverage} Leverage`,
      allowed: true,
      alwaysGreen: true,
    },
    {
      label: `${rules.profitSplit}% Split`,
      allowed: true,
      alwaysGreen: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-0 border-b overflow-x-auto flex-shrink-0"
      style={{
        background: isSwing
          ? 'linear-gradient(90deg, rgba(16,185,129,0.06), rgba(8,12,24,0.99))'
          : 'linear-gradient(90deg, rgba(255,92,0,0.05), rgba(8,12,24,0.99))',
        borderColor: 'rgba(255,255,255,0.05)',
        scrollbarWidth: 'none',
      }}
    >
      {/* Account type pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/[0.05] flex-shrink-0">
        <div
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: isSwing ? 'rgba(16,185,129,0.15)' : 'rgba(255,92,0,0.15)' }}
        >
          {isSwing ? (
            <Shield className="w-3 h-3 text-emerald-400" />
          ) : (
            <Zap className="w-3 h-3 text-primary" />
          )}
        </div>
        <div>
          <div className="text-[9px] font-mono font-black uppercase tracking-widest"
            style={{ color: isSwing ? '#10b981' : '#FF5C00' }}>
            {isSwing ? 'Swing Account' : 'Standard Account'}
          </div>
          <div className="text-[8px] text-slate-600 font-mono">
            {challengeLabel} · {phase} · ${accountSize.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Rule chips */}
      <div className="flex items-center px-2 gap-1.5 py-1.5 flex-shrink-0">
        {ruleItems.map((r) => {
          const isOk = r.alwaysGreen || r.allowed;
          return (
            <div
              key={r.label}
              className="flex items-center gap-1 px-2 py-1 rounded-md flex-shrink-0"
              style={{
                background: isOk ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${isOk ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              {isOk ? (
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-2.5 h-2.5 text-red-400/70 flex-shrink-0" />
              )}
              <span
                className="text-[9px] font-mono whitespace-nowrap"
                style={{ color: isOk ? '#10b981' : '#ef4444aa' }}
              >
                {r.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Profit target progress */}
      {rules.profitTarget > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-l border-white/[0.05] ml-auto flex-shrink-0">
          <span className="text-[9px] font-mono text-slate-500">Target</span>
          <span className="text-[9px] font-mono font-black text-primary">{rules.profitTarget}%</span>
          <span className="text-[9px] font-mono text-slate-600">profit</span>
        </div>
      )}

      {/* Max lots */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-l border-white/[0.05] flex-shrink-0">
        <AlertTriangle className="w-2.5 h-2.5 text-slate-600" />
        <span className="text-[9px] font-mono text-slate-500">Max</span>
        <span className="text-[9px] font-mono font-black text-slate-300">{rules.maxLotsPerTrade} lots</span>
      </div>
    </motion.div>
  );
}