import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, XCircle, AlertTriangle, RefreshCw, TrendingDown, BarChart3, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function TrashAccounts({ onStartChallenge }) {
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['trash-accounts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // CRITICAL: Always filter by the logged-in user's email — never expose other users' failed accounts
      return base44.entities.ChallengeAccount.filter({ user_email: user.email, status: 'failed' });
    },
    enabled: !!user?.email,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ChallengeAccount.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trash-accounts'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Trash2 className="w-6 h-6 text-red-400" /> Trash Accounts
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Accounts that breached challenge rules — permanently suspended
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl text-xs font-mono"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
          {accounts.length} failed account{accounts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Warning notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl mb-6"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-red-400 mb-1">Challenge Rules Breached</div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            These accounts violated challenge rules (Daily DD, Max DD, or other violations). They are permanently removed from your active terminal, analytics, and journal. You can review their stats or permanently delete them. To trade again, purchase a new challenge.
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div className="text-5xl mb-4">🎯</div>
          <div className="text-lg font-black text-foreground mb-2">No Breached Accounts</div>
          <div className="text-sm text-muted-foreground">All your accounts are in good standing. Keep following the rules!</div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {accounts.map((acc, i) => (
            <motion.div key={acc.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <div className="h-1 w-full" style={{ background: '#ef4444', opacity: 0.5 }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base font-black text-foreground font-mono">{acc.account_id}</span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <XCircle className="w-3 h-3" /> FAILED
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-muted-foreground"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        {acc.phase?.replace('phase', 'Phase ')}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {acc.challenge_type === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding'} · ${(acc.account_size || 0).toLocaleString()} · {acc.account_type} · {acc.leverage}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-red-400">
                      {acc.pnl >= 0 ? '+' : ''}${(acc.pnl || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">Final P&L</div>
                  </div>
                </div>

                {/* Breach stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Daily DD Reached', value: `${(acc.daily_drawdown_used || 0).toFixed(2)}%`, icon: TrendingDown, danger: true },
                    { label: 'Max DD Reached', value: `${(acc.max_drawdown_used || 0).toFixed(2)}%`, icon: BarChart3, danger: true },
                    { label: 'Total Trades', value: acc.total_trades || 0, icon: RefreshCw, danger: false },
                    { label: 'Trading Days', value: acc.trading_days || 0, icon: Calendar, danger: false },
                  ].map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="rounded-xl p-3 text-center"
                        style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Icon className={`w-3 h-3 ${s.danger ? 'text-red-400' : 'text-muted-foreground'}`} />
                          <div className="text-[9px] font-mono text-muted-foreground uppercase">{s.label}</div>
                        </div>
                        <div className={`text-sm font-bold ${s.danger ? 'text-red-400' : 'text-foreground'}`}>{s.value}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <div className="flex-1 text-xs font-mono text-muted-foreground/50">
                    Failed on {acc.updated_date ? new Date(acc.updated_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown date'}
                  </div>
                  <button onClick={onStartChallenge}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 12px rgba(255,92,0,0.25)' }}>
                    <RefreshCw className="w-3.5 h-3.5" /> New Challenge
                  </button>
                  <button onClick={() => deleteMutation.mutate(acc.id)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-red-500/10 disabled:opacity-50"
                    style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}