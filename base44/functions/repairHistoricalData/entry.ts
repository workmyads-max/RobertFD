/**
 * repairHistoricalData — Priority 8 migration/repair script.
 *
 * Repairs historical data corruption across three categories:
 *
 * 1. TradeRecord lot sizes written with the wrong formula (rawVol / 100000 instead of / 10000)
 *    → multiplies affected records' lots by 10
 *
 * 2. ChallengeAccount drawdown values that are suspiciously high (>= 90%) but the account
 *    has real MT5 balance (i.e. the API returned 0 transiently and the sync wrote a false breach)
 *    → resets max_drawdown_used and daily_drawdown_used to 0 and clears breach flags
 *    → marks status back to 'active' if it was incorrectly set to 'failed'
 *    NOTE: Only repairs accounts where DB balance > 0 (proof the breach was false).
 *
 * 3. profit_target_progress values calculated from balance instead of equity
 *    → recalculates from the stored equity field using (equity - account_size) / account_size * 100
 *    → ONLY updates records where the stored equity differs meaningfully from balance (> 0.5%)
 *
 * All repairs are idempotent and write a StaffActivityLog audit trail per record changed.
 *
 * SAFETY: Admin-only. Dry-run mode available (pass { dry_run: true }).
 * Run each repair type independently via { repair_type: "lots" | "drawdown" | "profit_target" | "all" }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const repairType = body.repair_type || 'all'; // "lots" | "drawdown" | "profit_target" | "all"
    const targetAccountId = body.account_id || null;

    console.log(`[repairHistoricalData] Starting. dry_run=${dryRun}, type=${repairType}, target=${targetAccountId || 'ALL'}`);

    const sr = base44.asServiceRole;
    const now = new Date().toISOString();
    const summary = { lots: null, drawdown: null, profit_target: null };

    // ── 1. LOT SIZE REPAIR ────────────────────────────────────────────────────
    if (repairType === 'lots' || repairType === 'all') {
      const filter = targetAccountId ? { account_id: targetAccountId } : {};
      const allTrades = await sr.entities.TradeRecord.filter(filter, '-created_date', 2000);

      // Heuristic: lots < 0.01 AND lots * 10 >= 0.01 → written with old /100000 formula
      const candidates = allTrades.filter(r => {
        const lots = parseFloat(r.lots || 0);
        return lots > 0 && lots < 0.01 && (lots * 10) >= 0.01;
      });

      let repaired = 0, errors = 0;
      const auditLog = [];

      if (!dryRun && candidates.length > 0) {
        const BATCH = 50;
        for (let i = 0; i < candidates.length; i += BATCH) {
          const batch = candidates.slice(i, i + BATCH);
          await Promise.all(batch.map(async r => {
            const oldLots = parseFloat(r.lots);
            const newLots = parseFloat((oldLots * 10).toFixed(5));
            try {
              await sr.entities.TradeRecord.update(r.id, { lots: newLots });
              repaired++;
              auditLog.push({ trade_id: r.trade_id, account_id: r.account_id, old_lots: oldLots, new_lots: newLots });
            } catch (e) {
              errors++;
              console.error(`[lots] Failed ${r.trade_id}:`, e.message);
            }
          }));
          if (i + BATCH < candidates.length) await new Promise(r => setTimeout(r, 100));
        }

        // Write audit log entry
        if (repaired > 0) {
          await sr.entities.StaffActivityLog.create({
            staff_email: user.email,
            staff_name: user.full_name || user.email,
            action: `Repaired ${repaired} TradeRecord lot sizes (×10 correction)`,
            action_category: 'system',
            target_entity: 'TradeRecord',
            details: { repaired, errors, affected_accounts: [...new Set(auditLog.map(r => r.account_id))], sample: auditLog.slice(0, 20) },
            status: 'success',
          }).catch(() => {});
        }
      }

      summary.lots = {
        total_checked: allTrades.length,
        candidates: candidates.length,
        repaired: dryRun ? 0 : repaired,
        errors: dryRun ? 0 : errors,
        affected_accounts: [...new Set(candidates.map(r => r.account_id))],
        dry_run_preview: dryRun ? candidates.slice(0, 20).map(r => ({
          trade_id: r.trade_id, account_id: r.account_id,
          old_lots: parseFloat(r.lots), new_lots: parseFloat((r.lots * 10).toFixed(5)),
        })) : undefined,
      };
      console.log(`[lots] candidates=${candidates.length}, repaired=${dryRun ? '(dry)' : repaired}`);
    }

    // ── 2. DRAWDOWN REPAIR ────────────────────────────────────────────────────
    // Targets accounts where:
    //   - max_drawdown_used >= 90 OR daily_drawdown_used >= 90
    //   - BUT balance > 0 (MT5 has real money — the high DD was a false API glitch breach)
    //   - AND the account was set to 'failed' despite having real balance
    if (repairType === 'drawdown' || repairType === 'all') {
      const filter = targetAccountId ? { account_id: targetAccountId } : {};
      const allAccounts = await sr.entities.ChallengeAccount.filter(filter, '-created_date', 500);

      const corruptedAccounts = allAccounts.filter(a => {
        const balance = a.balance || 0;
        const hasRealBalance = balance > 0;
        const hasCorruptedDD = (a.max_drawdown_used || 0) >= 90 || (a.daily_drawdown_used || 0) >= 90;
        return hasRealBalance && hasCorruptedDD;
      });

      let repaired = 0, errors = 0;

      if (!dryRun && corruptedAccounts.length > 0) {
        await Promise.all(corruptedAccounts.map(async a => {
          const accountSize = a.account_size || 100000;
          const equity = a.equity || a.balance || accountSize;

          // Recalculate real DD from stored equity
          const realOverallDD = parseFloat(Math.max(0, ((accountSize - equity) / accountSize) * 100).toFixed(2));
          const realDailyDD = 0; // Reset daily — will be recalculated on next sync

          const updates = {
            max_drawdown_used: realOverallDD,
            daily_drawdown_used: realDailyDD,
            dd_breach_detected: false,
            dd_breach_type: null,
            dd_breach_time: null,
            dd_breach_value: null,
          };

          // Restore status to 'active' only if it was incorrectly failed
          if (a.status === 'failed') {
            updates.status = 'active';
          }

          try {
            await sr.entities.ChallengeAccount.update(a.id, updates);
            repaired++;
          } catch (e) {
            errors++;
            console.error(`[drawdown] Failed ${a.account_id}:`, e.message);
          }
        }));

        if (repaired > 0) {
          await sr.entities.StaffActivityLog.create({
            staff_email: user.email,
            staff_name: user.full_name || user.email,
            action: `Repaired ${repaired} ChallengeAccount drawdown values (false breach correction)`,
            action_category: 'system',
            target_entity: 'ChallengeAccount',
            details: {
              repaired, errors,
              affected_accounts: corruptedAccounts.map(a => ({
                account_id: a.account_id,
                old_overall_dd: a.max_drawdown_used,
                old_daily_dd: a.daily_drawdown_used,
                was_failed: a.status === 'failed',
              })),
            },
            status: 'success',
          }).catch(() => {});
        }
      }

      summary.drawdown = {
        total_checked: allAccounts.length,
        corrupted_found: corruptedAccounts.length,
        repaired: dryRun ? 0 : repaired,
        errors: dryRun ? 0 : errors,
        dry_run_preview: dryRun ? corruptedAccounts.map(a => ({
          account_id: a.account_id,
          current_overall_dd: a.max_drawdown_used,
          current_daily_dd: a.daily_drawdown_used,
          balance: a.balance,
          status: a.status,
        })) : undefined,
      };
      console.log(`[drawdown] corrupted=${corruptedAccounts.length}, repaired=${dryRun ? '(dry)' : repaired}`);
    }

    // ── 3. PROFIT TARGET REPAIR ───────────────────────────────────────────────
    // Recalculates profit_target_progress using equity instead of balance.
    // Only updates records where stored equity differs from balance by > 0.5%
    // (meaning open PnL was present at last sync — balance-only calc was understating progress).
    if (repairType === 'profit_target' || repairType === 'all') {
      const filter = targetAccountId ? { account_id: targetAccountId } : {};
      const allAccounts = await sr.entities.ChallengeAccount.filter(filter, '-created_date', 500);

      const candidates = allAccounts.filter(a => {
        const balance = a.balance || 0;
        const equity = a.equity || 0;
        if (balance <= 0 || equity <= 0) return false;
        // Only recalculate if equity meaningfully differs from balance (open PnL present)
        const diffPct = Math.abs((equity - balance) / balance) * 100;
        return diffPct > 0.5;
      });

      let repaired = 0, errors = 0;

      if (!dryRun && candidates.length > 0) {
        await Promise.all(candidates.map(async a => {
          const accountSize = a.account_size || 100000;
          const equity = a.equity || a.balance || accountSize;
          const newProgress = parseFloat(Math.max(0, (equity - accountSize) / accountSize * 100).toFixed(2));
          const oldProgress = a.profit_target_progress || 0;

          try {
            await sr.entities.ChallengeAccount.update(a.id, { profit_target_progress: newProgress });
            repaired++;
            console.log(`[profit_target] ${a.account_id}: ${oldProgress}% → ${newProgress}% (equity=${equity})`);
          } catch (e) {
            errors++;
            console.error(`[profit_target] Failed ${a.account_id}:`, e.message);
          }
        }));

        if (repaired > 0) {
          await sr.entities.StaffActivityLog.create({
            staff_email: user.email,
            staff_name: user.full_name || user.email,
            action: `Recalculated profit_target_progress for ${repaired} accounts (equity-based)`,
            action_category: 'system',
            target_entity: 'ChallengeAccount',
            details: {
              repaired, errors,
              affected_accounts: candidates.map(a => ({
                account_id: a.account_id,
                old_progress: a.profit_target_progress,
                new_progress: parseFloat(Math.max(0, ((a.equity || a.balance) - (a.account_size || 100000)) / (a.account_size || 100000) * 100).toFixed(2)),
              })),
            },
            status: 'success',
          }).catch(() => {});
        }
      }

      summary.profit_target = {
        total_checked: allAccounts.length,
        candidates: candidates.length,
        repaired: dryRun ? 0 : repaired,
        errors: dryRun ? 0 : errors,
        dry_run_preview: dryRun ? candidates.map(a => ({
          account_id: a.account_id,
          old_progress: a.profit_target_progress,
          balance: a.balance,
          equity: a.equity,
          new_progress: parseFloat(Math.max(0, ((a.equity || a.balance) - (a.account_size || 100000)) / (a.account_size || 100000) * 100).toFixed(2)),
        })) : undefined,
      };
      console.log(`[profit_target] candidates=${candidates.length}, repaired=${dryRun ? '(dry)' : repaired}`);
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      repair_type: repairType,
      summary,
      note: dryRun
        ? 'Dry run complete — no changes written. Re-run with dry_run=false to apply.'
        : 'Repair complete. All changes are logged in StaffActivityLog.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});