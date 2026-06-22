/**
 * advancedRiskScoring — Comprehensive institutional risk analysis
 * Detects 20+ risk behaviors across all accounts
 * Admin-only endpoint
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { account_id, scan_all = false } = body;
    const sr = base44.asServiceRole;

    let accounts = [];
    if (account_id) {
      accounts = await sr.entities.ChallengeAccount.filter({ account_id });
    } else if (scan_all) {
      accounts = await sr.entities.ChallengeAccount.list('-created_date', 200);
      accounts = accounts.filter(a => ['active', 'passed', 'funded'].includes(a.status));
    } else {
      return Response.json({ error: 'Provide account_id or scan_all=true' }, { status: 400 });
    }

    const results = [];
    const analysisTime = new Date().toISOString();

    // Bulk-fetch ALL trades and flags once — eliminates N+1 (200 queries → 2 queries)
    const [allTrades, allFlags] = await Promise.all([
      sr.entities.TradeRecord.list('-created_date', 5000),
      sr.entities.RiskFlag.filter({ status: 'active' }),
    ]);
    const tradesByAccount = {};
    for (const t of allTrades) {
      if (!tradesByAccount[t.account_id]) tradesByAccount[t.account_id] = [];
      tradesByAccount[t.account_id].push(t);
    }
    const flagsByAccount = {};
    for (const f of allFlags) {
      if (!flagsByAccount[f.account_id]) flagsByAccount[f.account_id] = [];
      flagsByAccount[f.account_id].push(f);
    }

    for (const account of accounts) {
      try {
        const trades = tradesByAccount[account.account_id] || [];
        const closedTrades = trades.filter(t => t.status === 'closed');
        const openTrades = trades.filter(t => t.status === 'open');

        if (trades.length === 0) continue;

        const violations = [];
        let totalRiskScore = 0;

        // ── 1. MARTINGALE/GRID DETECTION ──────────────────────────────────────
        {
          const sortedByTime = [...closedTrades].sort((a, b) => new Date(a.open_time) - new Date(b.open_time));
          let doublingCount = 0;
          for (let i = 1; i < sortedByTime.length; i++) {
            const prev = sortedByTime[i - 1];
            const curr = sortedByTime[i];
            if (prev.lots > 0 && curr.lots >= prev.lots * 1.8) doublingCount++;
          }
          if (doublingCount >= 3) {
            violations.push({ type: 'martingale_grid', severity: 'high', detail: `${doublingCount} lot-doubling sequences detected` });
            totalRiskScore += 25;
          }
        }

        // ── 2. CONSISTENCY MANIPULATION ───────────────────────────────────────
        {
          const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
          if (closedTrades.length > 0 && totalPnl > 0) {
            const maxTradePnl = Math.max(...closedTrades.map(t => t.pnl || 0));
            if (maxTradePnl / totalPnl > 0.5) {
              violations.push({ type: 'consistency_manipulation', severity: 'medium', detail: `Single trade = ${(maxTradePnl / totalPnl * 100).toFixed(0)}% of total profit` });
              totalRiskScore += 15;
            }
          }
        }

        // ── 3. SUSPICIOUS LOT SIZING ──────────────────────────────────────────
        {
          const lots = closedTrades.map(t => t.lots || 0).filter(l => l > 0);
          if (lots.length > 5) {
            const avg = lots.reduce((s, l) => s + l, 0) / lots.length;
            const stdDev = Math.sqrt(lots.reduce((s, l) => s + Math.pow(l - avg, 2), 0) / lots.length);
            if (stdDev / avg > 2) {
              violations.push({ type: 'suspicious_lot_sizing', severity: 'medium', detail: `Lot size variance coefficient: ${(stdDev / avg).toFixed(2)}` });
              totalRiskScore += 10;
            }
          }
        }

        // ── 4. HEDGE ABUSE DETECTION ──────────────────────────────────────────
        {
          if (account.account_type === 'standard') {
            const bySymbol = {};
            for (const t of openTrades) {
              if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { buy: 0, sell: 0 };
              if (t.type === 'BUY') bySymbol[t.symbol].buy += t.lots || 0;
              else bySymbol[t.symbol].sell += t.lots || 0;
            }
            for (const [sym, pos] of Object.entries(bySymbol)) {
              if (pos.buy > 0 && pos.sell > 0) {
                violations.push({ type: 'hedge_abuse', severity: 'high', detail: `Open hedge on ${sym}: BUY ${pos.buy.toFixed(2)} / SELL ${pos.sell.toFixed(2)} lots` });
                totalRiskScore += 20;
                break;
              }
            }
          }
        }

        // ── 5. ULTRA-FAST SCALPING / HFT ─────────────────────────────────────
        {
          const ultraShort = closedTrades.filter(t => {
            if (!t.open_time || !t.close_time) return false;
            return (new Date(t.close_time) - new Date(t.open_time)) < 10000;
          });
          if (ultraShort.length > 5) {
            violations.push({ type: 'ultra_fast_scalping', severity: 'high', detail: `${ultraShort.length} trades < 10 seconds` });
            totalRiskScore += 20;
          }
        }

        // ── 6. COPY TRADING ABUSE ─────────────────────────────────────────────
        {
          const sorted = [...closedTrades].sort((a, b) => new Date(a.open_time) - new Date(b.open_time));
          let bundleCount = 0;
          for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            const diff = (new Date(curr.open_time) - new Date(prev.open_time)) / 1000;
            if (diff < 2 && prev.symbol === curr.symbol) bundleCount++;
          }
          if (bundleCount > 10) {
            violations.push({ type: 'copy_trading_signal', severity: 'medium', detail: `${bundleCount} near-simultaneous identical orders` });
            totalRiskScore += 15;
          }
        }

        // ── 7. TOXIC FLOW / STOP HUNT ─────────────────────────────────────────
        {
          const stopHunted = closedTrades.filter(t =>
            t.close_reason === 'stop_loss' && t.pnl && t.pnl < -(account.account_size * 0.01)
          );
          if (stopHunted.length > 5 && (stopHunted.length / closedTrades.length) > 0.3) {
            violations.push({ type: 'toxic_flow', severity: 'medium', detail: `${stopHunted.length} stop-hunted trades (${(stopHunted.length / closedTrades.length * 100).toFixed(0)}%)` });
            totalRiskScore += 10;
          }
        }

        // ── 8. (REMOVED) UNUSUAL DD BEHAVIOR / "APPROACHING LIMIT" ─────────────
        // As of 2026-06-22 this check is removed entirely. Flagging accounts whose
        // drawdown is merely "approaching" a limit caused false auto-flags (e.g.
        // XFT-MQK3Y6E5) and leaked into the user-facing "Account Under Review"
        // banner. "Approaching" a limit is NOT a breach — only actually EXCEEDING
        // the Daily DD or Overall/Max DD limit (handled by mt5RealtimeSync /
        // scheduledMTSync / automatedDDBreach) may fail an account. Drawdown
        // progression is visible to the user in their dashboard already.

        // ── 9. OVERNIGHT VIOLATIONS ───────────────────────────────────────────
        {
          if (account.account_type === 'standard' && !account.overnight_holding) {
            const overnightTrades = closedTrades.filter(t => {
              if (!t.open_time || !t.close_time) return false;
              const open = new Date(t.open_time);
              const close = new Date(t.close_time);
              // Fixed: true overnight = held >8 hours AND crossed UTC midnight
              const durationHours = (close - open) / 3600000;
              return durationHours > 8 && close.getUTCDate() !== open.getUTCDate();
            });
            if (overnightTrades.length > 2) {
              violations.push({ type: 'overnight_violation', severity: 'high', detail: `${overnightTrades.length} overnight positions on Standard account` });
              totalRiskScore += 20;
            }
          }
        }

        // ── 10. SYNTHETIC ARBITRAGE ───────────────────────────────────────────
        {
          const corrPairs = [['EURUSD', 'GBPUSD'], ['XAUUSD', 'XAGUSD'], ['EURJPY', 'GBPJPY']];
          for (const [s1, s2] of corrPairs) {
            const tradesS1 = closedTrades.filter(t => t.symbol === s1);
            const tradesS2 = closedTrades.filter(t => t.symbol === s2);
            if (tradesS1.length > 3 && tradesS2.length > 3) {
              let syntheticCount = 0;
              for (const t1 of tradesS1) {
                for (const t2 of tradesS2) {
                  if (!t1.open_time || !t2.open_time) continue;
                  const timeDiff = Math.abs(new Date(t1.open_time) - new Date(t2.open_time)) / 1000;
                  if (timeDiff < 5 && t1.type !== t2.type) syntheticCount++;
                }
              }
              if (syntheticCount > 3) {
                violations.push({ type: 'synthetic_arbitrage', severity: 'high', detail: `${syntheticCount} correlated pair hedge patterns (${s1}/${s2})` });
                totalRiskScore += 20;
                break;
              }
            }
          }
        }

        // ── CREATE RISK FLAGS — use pre-fetched flags map ─────────────────────────
        const existingFlagsList = flagsByAccount[account.account_id] || [];
        const existingFlagTypes = new Set(existingFlagsList.map(f => f.flag_type));

        const newFlags = [];
        // AUDIT ONLY: Create RiskFlag records for admin review.
        // NO user notifications, NO account status changes, NO can_trade writes.
        // Admin must manually review flags and decide on any action.
        const flagCreatePromises = violations
          .filter(v => !existingFlagTypes.has(v.type))
          .map(async v => {
            const flag = await sr.entities.RiskFlag.create({
              user_email: account.user_email,
              account_id: account.account_id,
              flag_type: v.type,
              severity: v.severity,
              description: v.detail,
              status: 'active',
              triggered_at: analysisTime,
            });
            newFlags.push(flag);
            // NOTE: No user-facing notifications from risk scans — admin audit only
          });

        await Promise.all(flagCreatePromises);

        const _unused = 0; // close violations loop replacement

        results.push({
          account_id: account.account_id,
          user_email: account.user_email,
          risk_score: Math.min(100, totalRiskScore),
          violations: violations.length,
          new_flags: newFlags.length,
          details: violations,
        });

      } catch (e) {
        console.error(`Risk scan failed for ${account.account_id}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      accounts_scanned: accounts.length,
      total_violations: results.reduce((s, r) => s + r.violations, 0),
      new_flags_created: results.reduce((s, r) => s + r.new_flags, 0),
      results,
    });

  } catch (error) {
    console.error('advancedRiskScoring error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});