import React from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronRight, Zap } from 'lucide-react';

function TraderNode({ email, level, commissions = [], isRoot = false }) {
  const color = level === 0 ? '#FF5C00' : level === 1 ? '#60a5fa' : '#a78bfa';
  const earned = commissions.filter(c => c.referred_email === email && c.level === level + 1)
    .reduce((s, c) => s + (c.commission_amount || 0), 0);

  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-xl px-3 py-2 flex items-center gap-2 ${isRoot ? 'text-sm' : 'text-xs'}`}
        style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black"
          style={{ background: `${color}25`, color }}>
          {isRoot ? 'YOU' : `L${level}`}
        </div>
        <span className="font-mono text-foreground truncate max-w-[120px]">{email}</span>
        {earned > 0 && <span className="text-emerald-400 font-bold text-[10px]">+${earned.toFixed(0)}</span>}
      </div>
    </div>
  );
}

export default function ReferralTree({ commissions = [], userEmail }) {
  // Build tree structure from commissions
  const l1Emails = [...new Set(commissions.filter(c => c.level === 1).map(c => c.referred_email))];
  const l2Emails = [...new Set(commissions.filter(c => c.level === 2).map(c => c.referred_email))];
  const l3Emails = [...new Set(commissions.filter(c => c.level === 3).map(c => c.referred_email))];

  if (l1Emails.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
          <Users className="w-8 h-8 text-primary" />
        </div>
        <div className="text-sm font-bold text-foreground mb-2">No Referrals Yet</div>
        <div className="text-xs text-muted-foreground">Share your referral link to build your network</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="text-xs font-bold text-foreground mb-5 uppercase tracking-widest flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" /> Referral Network Tree
      </div>

      <div className="overflow-x-auto">
        <div className="flex items-start gap-6 min-w-max pb-4">
          {/* Root node */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="rounded-xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'rgba(255,92,0,0.15)', border: '2px solid rgba(255,92,0,0.5)', boxShadow: '0 0 20px rgba(255,92,0,0.2)' }}>
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-black text-primary">YOU</span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px] text-center">{userEmail}</div>
          </div>

          <div className="flex items-center self-center">
            <ChevronRight className="w-5 h-5 text-primary/40" />
          </div>

          {/* L1 */}
          <div className="flex flex-col gap-3">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Level 1 (8%)</div>
            {l1Emails.slice(0, 8).map(email => (
              <motion.div key={email} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <TraderNode email={email} level={1} commissions={commissions} />
              </motion.div>
            ))}
            {l1Emails.length > 8 && (
              <div className="text-[10px] font-mono text-muted-foreground">+{l1Emails.length - 8} more</div>
            )}
          </div>

          {l2Emails.length > 0 && (
            <>
              <div className="flex items-center self-center">
                <ChevronRight className="w-5 h-5 text-blue-400/40" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Level 2 (2%)</div>
                {l2Emails.slice(0, 8).map(email => (
                  <motion.div key={email} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <TraderNode email={email} level={2} commissions={commissions} />
                  </motion.div>
                ))}
                {l2Emails.length > 8 && (
                  <div className="text-[10px] font-mono text-muted-foreground">+{l2Emails.length - 8} more</div>
                )}
              </div>
            </>
          )}

          {l3Emails.length > 0 && (
            <>
              <div className="flex items-center self-center">
                <ChevronRight className="w-5 h-5 text-purple-400/40" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Level 3 (1%)</div>
                {l3Emails.slice(0, 6).map(email => (
                  <motion.div key={email} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <TraderNode email={email} level={3} commissions={commissions} />
                  </motion.div>
                ))}
                {l3Emails.length > 6 && (
                  <div className="text-[10px] font-mono text-muted-foreground">+{l3Emails.length - 6} more</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
        {[
          { label: 'L1 Traders', count: l1Emails.length, color: '#FF5C00' },
          { label: 'L2 Traders', count: l2Emails.length, color: '#60a5fa' },
          { label: 'L3 Traders', count: l3Emails.length, color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.count}</div>
            <div className="text-[10px] font-mono text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}