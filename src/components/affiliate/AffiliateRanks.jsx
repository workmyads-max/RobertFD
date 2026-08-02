import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Check, X, Loader2, TrendingUp, Gift, AlertTriangle, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import TravelIncentiveBanner from './TravelIncentiveBanner';

const RANK_META = {
  bronze:   { color: '#cd7f32', label: 'Bronze' },
  silver:   { color: '#c0c0c0', label: 'Silver' },
  gold:     { color: '#ffd700', label: 'Gold' },
  platinum: { color: '#e5e4e2', label: 'Platinum' },
};

function money(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function money2(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AffiliateRanks({ user, onSupport }) {
  const qc = useQueryClient();
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'claim'|'forfeit', rank }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['affiliate-rank-status', user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke('affiliateRankSystem', { action: 'get_status' });
      return res?.data || res;
    },
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const actionMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await base44.functions.invoke('affiliateRankSystem', payload);
      if (res?.data?.error) throw new Error(res.data.error);
      return res?.data || res;
    },
    onSuccess: () => {
      setConfirmAction(null);
      qc.invalidateQueries({ queryKey: ['affiliate-rank-status', user?.email] });
      qc.invalidateQueries({ queryKey: ['my-commissions', user?.email] });
      qc.invalidateQueries({ queryKey: ['affiliate-profile', user?.email] });
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  const ranks = data?.all_ranks || [];
  const resolved = data?.resolved_bonuses || [];
  const currentRank = data?.current_rank;
  const nextRank = data?.next_rank;
  const effective = data?.effective_sales || 0;
  const totalSales = data?.total_l1_sales || 0;
  const claimable = data?.claimable;
  const resolvedCount = data?.resolved_count || 0;

  const progressPct = nextRank
    ? Math.min((effective / nextRank.target) * 100, 100)
    : 100;
  const remaining = nextRank ? Math.max(nextRank.target - effective, 0) : 0;

  const resolvedMap = {};
  resolved.forEach(b => { resolvedMap[b.rank_key] = b; });

  return (
    <div className="space-y-6">
      {/* Travel incentive banner (display only) */}
      <TravelIncentiveBanner onSupport={onSupport} />

      {/* Current rank + progress */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#15171e', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Ranks & Bonuses</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current rank */}
          <div>
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Current Rank</div>
            {currentRank ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: RANK_META[currentRank.key]?.color }}
                  />
                  <div className="text-2xl font-black text-white">{currentRank.name}</div>
                </div>
                <div className="text-[11px] text-white/40">Bonus {money(currentRank.bonus)} claimed</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-black text-white/50">Unranked</div>
                <div className="text-[11px] text-white/40">Generate L1 sales to reach Bronze</div>
              </>
            )}
          </div>

          {/* Progress to next */}
          <div className="lg:col-span-2">
            {nextRank ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                    Progress to {nextRank.name}
                  </div>
                  <div className="text-[10px] font-mono text-white/40">
                    {money2(effective)} / {money(nextRank.target)}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: claimable ? '#10b981' : '#FF5C00' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[12px] text-white/55">
                    {claimable ? (
                      <span className="text-emerald-400 font-semibold">
                        Target reached — claim your {money(nextRank.bonus)} bonus
                      </span>
                    ) : (
                      <>
                        <span className="text-white font-semibold">{money2(remaining)}</span> more in fresh L1 sales needed
                      </>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-white/30">
                    Total L1 sales: {money2(totalSales)}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-4 h-4" />
                <span className="text-sm font-semibold">Platinum Partner achieved — all ranks completed.</span>
              </div>
            )}
          </div>
        </div>

        {/* Claim / Continue bar */}
        <AnimatePresence>
          {claimable && nextRank && !confirmAction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 border-t"
                style={{ borderColor: 'rgba(255,92,0,0.2)', background: 'rgba(255,92,0,0.05)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-white">
                    You've reached {nextRank.name} — {money(nextRank.bonus)} bonus available
                  </div>
                  <div className="text-[11px] text-white/45 mt-0.5">
                    Claim to receive the bonus (sales counter resets for the next rank). Continue to forfeit this bonus but carry your sales toward the next rank's threshold.
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setConfirmAction({ type: 'claim', rank: nextRank })}
                    className="px-4 py-2.5 rounded-lg text-[12px] font-bold text-white transition-opacity hover:opacity-90 flex items-center gap-1.5"
                    style={{ background: '#FF5C00' }}
                  >
                    <Gift className="w-3.5 h-3.5" /> Claim Bonus
                  </button>
                  <button
                    onClick={() => setConfirmAction({ type: 'forfeit', rank: nextRank })}
                    className="px-4 py-2.5 rounded-lg text-[12px] font-semibold text-white/70 transition-colors hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rank ladder */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#15171e', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="text-xs font-bold text-white">Rank Ladder</div>
          <div className="text-[11px] text-white/40 mt-0.5">
            Based on Level-1 direct referral sales. Free promo accounts don't count.
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {ranks.map((r, i) => {
            const rec = resolvedMap[r.key];
            const isCurrent = currentRank?.key === r.key;
            const isNext = nextRank?.key === r.key;
            const meta = RANK_META[r.key];
            const reached = effective >= r.target && i >= resolvedCount;
            return (
              <div
                key={r.key}
                className="px-5 py-4 flex items-center gap-4"
                style={{ background: isNext ? 'rgba(255,92,0,0.04)' : 'transparent' }}
              >
                {/* Rank dot */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 w-10">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: rec || isCurrent ? `${meta.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${rec || isCurrent ? `${meta.color}60` : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {rec?.status === 'claimed' ? (
                      <Check className="w-3.5 h-3.5" style={{ color: meta.color }} />
                    ) : rec?.status === 'forfeited' ? (
                      <X className="w-3.5 h-3.5 text-white/30" />
                    ) : (
                      <span className="w-2 h-2 rounded-full" style={{ background: isNext ? meta.color : 'rgba(255,255,255,0.15)' }} />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{r.name}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` }}>
                        Current
                      </span>
                    )}
                    {isNext && !rec && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: 'rgba(255,92,0,0.12)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.3)' }}>
                        In Progress
                      </span>
                    )}
                    {rec?.status === 'claimed' && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                        Claimed
                      </span>
                    )}
                    {rec?.status === 'forfeited' && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        Forfeited
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5">
                    {money(r.target)} in L1 sales → {money(r.bonus)} bonus
                  </div>
                </div>

                {/* Status / progress */}
                <div className="hidden sm:block flex-shrink-0 text-right">
                  {rec ? (
                    <div className="text-[11px] text-white/40">
                      {rec.status === 'claimed' ? `+${money2(rec.bonus_amount)}` : 'Forfeited'}
                    </div>
                  ) : isNext ? (
                    <div className="text-[11px] font-mono text-white/50">
                      {money2(effective)} / {money(r.target)}
                    </div>
                  ) : i < resolvedCount ? (
                    <Check className="w-4 h-4 text-white/20 ml-auto" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/10 ml-auto" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footnote */}
        <div className="px-5 py-3 flex items-start gap-2" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <TrendingUp className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />
          <span className="text-[10px] text-white/35 leading-relaxed">
            "Sales" = total paid value of challenges purchased by your Level-1 direct referrals. Claiming a bonus resets the counter (next rank needs its full fresh target). Continuing forfeits that bonus but carries your sales toward the next rank's cumulative threshold. Bonuses are granted on top of your normal 8% L1 commission.
          </span>
        </div>
      </div>

      {/* Claim / Forfeit confirmation modal */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmationModal
            action={confirmAction}
            onClose={() => setConfirmAction(null)}
            onConfirm={() => actionMutation.mutate({ action: confirmAction.type })}
            isPending={actionMutation.isPending}
            error={actionMutation.error?.message}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfirmationModal({ action, onClose, onConfirm, isPending, error }) {
  const isClaim = action.type === 'claim';
  const rank = action.rank;
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/80"
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-auto relative w-full max-w-md"
          style={{ background: '#0d0e12', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="px-5 h-11 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: isClaim ? '#10b981' : '#FF5C00' }}>
              {isClaim ? 'Claim Bonus' : 'Forfeit & Continue'}
            </span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: isClaim ? 'rgba(16,185,129,0.1)' : 'rgba(255,92,0,0.1)', border: `1px solid ${isClaim ? 'rgba(16,185,129,0.25)' : 'rgba(255,92,0,0.25)'}` }}
              >
                {isClaim ? <Gift className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-[#FF5C00]" />}
              </div>
              <div>
                <div className="text-base font-bold text-white">{rank.name}</div>
                <div className="text-[12px] text-white/50">{money(rank.bonus)} bonus</div>
              </div>
            </div>

            {isClaim ? (
              <p className="text-[12px] text-white/60 leading-relaxed mb-5">
                You'll receive <span className="text-emerald-400 font-bold">{money(rank.bonus)}</span> as an approved, withdrawable reward — added on top of your normal commissions. Your Level-1 sales counter will reset to zero, so the next rank (<span className="text-white font-semibold">{RANK_META[rank.key] ? 'next tier' : ''}</span>) will require its full fresh sales target from this point.
              </p>
            ) : (
              <p className="text-[12px] text-white/60 leading-relaxed mb-5">
                You'll <span className="text-[#FF5C00] font-bold">forfeit</span> the {money(rank.bonus)} {rank.name} bonus. Your accumulated Level-1 sales will <span className="text-white font-semibold">carry over</span> — they'll continue counting toward the next rank's cumulative threshold, so you progress directly to the higher bonus.
              </p>
            )}

            {error && (
              <div className="text-[11px] text-red-400 px-3 py-2 rounded-lg mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onConfirm}
                disabled={isPending}
                className="flex-1 h-10 text-[12px] font-bold text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: isClaim ? '#10b981' : '#FF5C00' }}
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isClaim ? <><Gift className="w-3.5 h-3.5" /> Confirm Claim</> : 'Forfeit & Continue')}
              </button>
              <button
                onClick={onClose}
                disabled={isPending}
                className="px-4 h-10 text-[12px] font-semibold text-white/60 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}