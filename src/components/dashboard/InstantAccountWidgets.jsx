import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Calendar, CheckCircle2, Lock, Info, Zap, Award } from 'lucide-react';

function fmt(n, d = 2) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

// ── CARD #1: BUFFER ZONE STATUS ──────────────────────────────────────────────
function BufferZoneCard({ account }) {
  const snap = account?.rule_snapshot || {};
  const accountSize = account?.account_size || 0;
  const bufferTargetPct = snap.buffer_zone_target ?? 5;
  const bufferTargetAmt = accountSize * (bufferTargetPct / 100);
  const lockBalance = accountSize + bufferTargetAmt;
  const currentEquity = account?.equity || account?.balance || accountSize;
  const isActivated = account?.buffer_zone_activated || false;
  const lockBal = account?.buffer_zone_lock_balance || lockBalance;
  const ddRef = account?.dd_reference_balance || accountSize;
  const progressPct = Math.min(((currentEquity - accountSize) / bufferTargetAmt) * 100, 100);
  const remaining = Math.max(0, lockBalance - currentEquity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(12,12,18,0.95)', border: `1px solid ${isActivated ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}` }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isActivated ? 'rgba(16,185,129,0.12)' : 'rgba(255,92,0,0.12)' }}>
            {isActivated ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Target className="w-3.5 h-3.5 text-primary" />}
          </div>
          <span className="text-sm font-bold text-foreground">Buffer Zone Status</span>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold"
          style={{ background: isActivated ? 'rgba(16,185,129,0.12)' : 'rgba(255,92,0,0.1)', color: isActivated ? '#10b981' : '#FF5C00', border: `1px solid ${isActivated ? 'rgba(16,185,129,0.25)' : 'rgba(255,92,0,0.2)'}` }}>
          {isActivated ? '🔒 Locked' : 'In Progress'}
        </span>
      </div>

      <div className="p-5">
        {isActivated ? (
          <div className="text-center py-3">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-base font-black text-emerald-400 mb-1">🎉 Buffer Zone Activated</div>
            <div className="text-[11px] text-white/40 font-mono">
              Activated at: {account?.buffer_zone_activated_at ? new Date(account.buffer_zone_activated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="text-white/35 font-medium">Progress to ${fmt(lockBalance, 0)}</span>
              <span className="font-semibold text-primary">{progressPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <motion.div className="h-full rounded-full"
                initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: 'linear-gradient(90deg, #FF5C00, #FF8A3D)' }} />
            </div>
            <div className="text-[10px] text-white/30 mt-1.5 text-center">Need ${fmt(remaining, 0)} more to activate</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wide mb-1">Account Size</div>
            <div className="text-sm font-bold text-foreground">${fmt(accountSize, 0)}</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wide mb-1">Buffer Target</div>
            <div className="text-sm font-bold text-primary">{bufferTargetPct}% (${fmt(bufferTargetAmt, 0)})</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wide mb-1">Current Equity</div>
            <div className="text-sm font-bold text-foreground">${fmt(currentEquity, 0)}</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: isActivated ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)' }}>
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wide mb-1">Locked Balance</div>
            <div className={`text-sm font-bold ${isActivated ? 'text-emerald-400' : 'text-white/40'}`}>${fmt(lockBal, 0)}</div>
          </div>
          <div className="rounded-xl p-3 col-span-2" style={{ background: isActivated ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)' }}>
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wide mb-1">DD Reference Balance</div>
            <div className={`text-sm font-bold ${isActivated ? 'text-emerald-400' : 'text-white/40'}`}>${fmt(ddRef, 0)}</div>
            <div className="text-[9px] text-white/25 mt-1">{isActivated ? 'Drawdown calculated against locked balance' : 'Drawdown calculated against account size'}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── CARD #2: CONSISTENCY TRACKER ─────────────────────────────────────────────
function ConsistencyCard({ account, closedTrades }) {
  const snap = account?.rule_snapshot || {};
  const consistencyPct = snap.consistency_rule_pct ?? 35;
  const accountSize = account?.account_size || 0;
  const isBufferActivated = account?.buffer_zone_activated || false;

  // Compute best day profit from POST-BUFFER trades only.
  // Profit after buffer lock = balance - buffer_zone_lock_balance (NOT balance - account_size).
  const lockBalance = account?.buffer_zone_lock_balance || accountSize;
  const { bestDayProfit, totalProfit } = useMemo(() => {
    if (!closedTrades || closedTrades.length === 0) return { bestDayProfit: 0, totalProfit: 0 };
    // Only trades closed AFTER buffer zone activation
    const bufferDate = account?.buffer_zone_activated_at ? new Date(account.buffer_zone_activated_at) : null;
    const postBufferTrades = bufferDate
      ? closedTrades.filter(t => t.close_time && new Date(t.close_time) >= bufferDate)
      : [];
    const byDay = {};
    postBufferTrades.forEach(t => {
      const day = new Date(t.close_time).toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = 0;
      byDay[day] += (t.pnl || 0);
    });
    const dailyProfits = Object.values(byDay);
    const best = dailyProfits.length > 0 ? Math.max(...dailyProfits) : 0;
    // Profit after buffer lock = current balance - locked balance
    const total = (account?.balance || account?.equity || 0) - lockBalance;
    return { bestDayProfit: best, totalProfit: total };
  }, [closedTrades, account, lockBalance]);

  // Use stored values if available (from scheduledMTSync), otherwise compute live
  const effectiveBestDay = account?.best_day_profit || bestDayProfit;
  const effectiveTotalProfit = totalProfit;
  const requiredProfit = effectiveBestDay > 0 ? effectiveBestDay / (consistencyPct / 100) : 0;
  const remaining = Math.max(0, requiredProfit - effectiveTotalProfit);
  const isPassed = effectiveTotalProfit >= requiredProfit && requiredProfit > 0;
  const currentConsistencyPct = effectiveTotalProfit > 0 ? (effectiveBestDay / effectiveTotalProfit) * 100 : 0;

  if (!isBufferActivated) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden" style={{ background: 'rgba(12,12,18,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <TrendingUp className="w-3.5 h-3.5 text-white/30" />
            </div>
            <span className="text-sm font-bold text-foreground">Consistency Tracker</span>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full font-bold text-white/40" style={{ background: 'rgba(255,255,255,0.05)' }}>Dormant</span>
        </div>
        <div className="p-8 text-center">
          <Lock className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/30">Consistency rule activates after Buffer Zone is locked.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden" style={{ background: 'rgba(12,12,18,0.95)', border: `1px solid ${isPassed ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isPassed ? 'rgba(16,185,129,0.12)' : 'rgba(255,92,0,0.12)' }}>
            <TrendingUp className={`w-3.5 h-3.5 ${isPassed ? 'text-emerald-400' : 'text-primary'}`} />
          </div>
          <span className="text-sm font-bold text-foreground">Consistency Tracker</span>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold"
          style={{ background: isPassed ? 'rgba(16,185,129,0.12)' : 'rgba(255,92,0,0.1)', color: isPassed ? '#10b981' : '#FF5C00', border: `1px solid ${isPassed ? 'rgba(16,185,129,0.25)' : 'rgba(255,92,0,0.2)'}` }}>
          {isPassed ? '✅ Passed' : 'Not Eligible Yet'}
        </span>
      </div>

      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wide mb-1">Best Day Profit</div>
            <div className="text-sm font-bold text-emerald-400">${fmt(effectiveBestDay)}</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wide mb-1">Current Profit</div>
            <div className="text-sm font-bold text-foreground">${fmt(effectiveTotalProfit)}</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,92,0,0.05)' }}>
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wide mb-1">Required Profit</div>
            <div className="text-sm font-bold text-primary">${fmt(requiredProfit)}</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wide mb-1">Consistency %</div>
            <div className={`text-sm font-bold ${currentConsistencyPct <= consistencyPct ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {currentConsistencyPct.toFixed(1)}% / {consistencyPct}%
            </div>
          </div>
        </div>

        {!isPassed && remaining > 0 && (
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
            <div className="text-[11px] text-white/50">Need <span className="font-bold text-primary">${fmt(remaining)}</span> more to pass</div>
          </div>
        )}

        <div className="rounded-xl p-3 text-[11px] leading-relaxed" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)' }}>
          <Info className="w-3 h-3 inline mr-1 text-white/30" />
          Based on your current Best Day Profit of <span className="text-foreground font-semibold">${fmt(effectiveBestDay)}</span>, your total profit must reach <span className="text-primary font-semibold">${fmt(requiredProfit)}</span> to satisfy the {consistencyPct}% Consistency Rule. Your current profit is <span className="text-foreground font-semibold">${fmt(effectiveTotalProfit)}</span>, therefore you need an additional <span className="text-primary font-semibold">${fmt(remaining)}</span> before becoming eligible. These calculations update automatically whenever your Best Day Profit changes.
        </div>
      </div>
    </motion.div>
  );
}

// ── CARD #3: PROFITABLE DAYS TRACKER ─────────────────────────────────────────
function ProfitableDaysCard({ account, closedTrades }) {
  const snap = account?.rule_snapshot || {};
  const minDays = snap.min_profitable_days ?? 7;
  const isBufferActivated = account?.buffer_zone_activated || false;

  // Compute profitable days from POST-BUFFER trades only
  const profitableDays = useMemo(() => {
    if (!closedTrades || closedTrades.length === 0) return [];
    // Only trades closed AFTER buffer zone activation
    const bufferDate = account?.buffer_zone_activated_at ? new Date(account.buffer_zone_activated_at) : null;
    const postBufferTrades = bufferDate
      ? closedTrades.filter(t => t.close_time && new Date(t.close_time) >= bufferDate)
      : [];
    const byDay = {};
    postBufferTrades.forEach(t => {
      const day = new Date(t.close_time).toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = 0;
      byDay[day] += (t.pnl || 0);
    });
    return Object.entries(byDay)
      .filter(([, profit]) => profit > 0)
      .map(([date, profit]) => ({ date, profit }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [closedTrades, account]);

  const count = profitableDays.length;
  const isComplete = count >= minDays;

  if (!isBufferActivated) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden" style={{ background: 'rgba(12,12,18,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Calendar className="w-3.5 h-3.5 text-white/30" />
            </div>
            <span className="text-sm font-bold text-foreground">Profitable Days</span>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full font-bold text-white/40" style={{ background: 'rgba(255,255,255,0.05)' }}>Dormant</span>
        </div>
        <div className="p-8 text-center">
          <Lock className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/30">Profitable day tracking starts after Buffer Zone is locked.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden" style={{ background: 'rgba(12,12,18,0.95)', border: `1px solid ${isComplete ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isComplete ? 'rgba(16,185,129,0.12)' : 'rgba(255,92,0,0.12)' }}>
            <Calendar className={`w-3.5 h-3.5 ${isComplete ? 'text-emerald-400' : 'text-primary'}`} />
          </div>
          <span className="text-sm font-bold text-foreground">Profitable Days Tracker</span>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold"
          style={{ background: isComplete ? 'rgba(16,185,129,0.12)' : 'rgba(255,92,0,0.1)', color: isComplete ? '#10b981' : '#FF5C00', border: `1px solid ${isComplete ? 'rgba(16,185,129,0.25)' : 'rgba(255,92,0,0.2)'}` }}>
          {isComplete ? '✅ Completed' : `${minDays - count} More Required`}
        </span>
      </div>

      <div className="p-5">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-white/35 font-medium">Profitable Days</span>
            <span className="font-semibold" style={{ color: isComplete ? '#10b981' : '#FF5C00' }}>{count} / {minDays}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }} animate={{ width: `${Math.min((count / minDays) * 100, 100)}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: isComplete ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #FF5C00, #FF8A3D)' }} />
          </div>
        </div>

        {/* Day-by-day list */}
        {profitableDays.length > 0 ? (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {profitableDays.map((d, i) => (
              <div key={d.date} className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-mono text-white/50">
                    {new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-400">+${fmt(d.profit)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-white/30">No profitable days yet</div>
        )}
      </div>
    </motion.div>
  );
}

// ── PAYOUT ELIGIBILITY BANNER ─────────────────────────────────────────────────
function PayoutEligibilityBanner({ account, closedTrades }) {
  const snap = account?.rule_snapshot || {};
  const minDays = snap.min_profitable_days ?? 7;
  const consistencyPct = snap.consistency_rule_pct ?? 35;

  const isBufferActivated = account?.buffer_zone_activated || false;
  const isConsistencyPassed = account?.consistency_passed || false;
  const profitableDaysCount = account?.profitable_days_count || 0;
  const isProfitableDaysMet = profitableDaysCount >= minDays;
  const isNoBreach = !account?.dd_breach_detected && account?.status !== 'failed';
  const isActive = account?.status === 'active';

  const allMet = isBufferActivated && isConsistencyPassed && isProfitableDaysMet && isNoBreach && isActive;

  const checks = [
    { label: 'Buffer Zone Activated', met: isBufferActivated },
    { label: `Consistency Rule (${consistencyPct}%)`, met: isConsistencyPassed },
    { label: `${minDays} Profitable Days`, met: isProfitableDaysMet },
    { label: 'No DD Breach', met: isNoBreach },
    { label: 'Account Active', met: isActive },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl px-5 py-4 flex items-center gap-4"
      style={{
        background: allMet ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${allMet ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: allMet ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)' }}>
        {allMet ? <Award className="w-5 h-5 text-emerald-400" /> : <Zap className="w-5 h-5 text-white/30" />}
      </div>
      <div className="flex-1">
        <div className={`text-sm font-bold mb-1 ${allMet ? 'text-emerald-400' : 'text-white/50'}`}>
          {allMet ? '✅ Payout Eligible — You can request a withdrawal' : 'Payout Eligibility'}
        </div>
        <div className="flex flex-wrap gap-2">
          {checks.map((c, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] font-mono"
              style={{ color: c.met ? '#10b981' : 'rgba(255,255,255,0.3)' }}>
              {c.met ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function InstantAccountWidgets({ account, closedTrades = [] }) {
  if (!account || account.challenge_type !== 'instant_account') return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-bold text-foreground">Instant Account Progress</span>
      </div>

      <PayoutEligibilityBanner account={account} closedTrades={closedTrades} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BufferZoneCard account={account} />
        <ConsistencyCard account={account} closedTrades={closedTrades} />
        <ProfitableDaysCard account={account} closedTrades={closedTrades} />
      </div>
    </div>
  );
}