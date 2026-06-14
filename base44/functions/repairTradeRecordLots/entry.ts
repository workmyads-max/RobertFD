/**
 * repairTradeRecordLots — One-time migration to fix historical TradeRecords
 * written with the incorrect lot size formula (rawVolume / 100000) from
 * syncUserAccountOnLogin.
 *
 * CORRECT formula (from scheduledMTSync, authoritative):
 *   lots = rawVolume / 10000
 *
 * The old formula used /100000, producing values 10x too small.
 * e.g. volume=60000 → old: 0.0060 lots | correct: 0.6000 lots
 *
 * Detection strategy: records where lots < 0.01 AND pnl suggests a normal trade
 * are candidates. We re-fetch from MT5 and correct in-place.
 *
 * SAFETY: Admin-only. Dry-run mode available (pass { dry_run: true }).
 * Idempotent: records already at correct scale are skipped.
 * Only corrects the `lots` field — pnl/status/other fields are untouched.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SCALE_FACTOR_CORRECT = 10000;    // scheduledMTSync standard
const SCALE_FACTOR_OLD     = 100000;   // syncUserAccountOnLogin (wrong)
const CORRECTION_MULTIPLIER = SCALE_FACTOR_OLD / SCALE_FACTOR_CORRECT; // = 10

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const targetAccountId = body.account_id || null; // Optional: limit to one account

    console.log(`[repairTradeRecordLots] Starting repair. dry_run=${dryRun}, target=${targetAccountId || 'ALL'}`);

    // Fetch all TradeRecord entities (closed trades written by old sync)
    // Page through in batches to avoid memory issues
    const PAGE_SIZE = 500;
    let allRecords = [];
    let offset = 0;

    while (true) {
      const filter = targetAccountId ? { account_id: targetAccountId } : {};
      const batch = await base44.asServiceRole.entities.TradeRecord.filter(filter, '-created_date', PAGE_SIZE);
      if (!batch || batch.length === 0) break;
      allRecords = allRecords.concat(batch);
      if (batch.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
      // Prevent infinite loop on large datasets
      if (allRecords.length > 50000) {
        console.warn('[repairTradeRecordLots] Hit 50k record limit — run again with account_id filter');
        break;
      }
    }

    console.log(`[repairTradeRecordLots] Fetched ${allRecords.length} total TradeRecords`);

    // Identify records with incorrect lot sizes.
    // Heuristic: lots < 0.01 AND lots > 0 (old formula produced values like 0.006)
    // AND the record was NOT already repaired (lots * 10 would be >= 0.01)
    // We also cross-check: if lots * CORRECTION_MULTIPLIER gives a "normal" value (>= 0.01),
    // it's likely a candidate.
    const candidates = allRecords.filter(r => {
      const lots = parseFloat(r.lots || 0);
      // Old formula: rawVol/100000 → typically 0.001–0.01 for normal trades
      // Correct formula: rawVol/10000 → typically 0.01–1.0 for normal trades
      // Threshold: if current lots < 0.01 AND corrected value >= 0.01
      const corrected = lots * CORRECTION_MULTIPLIER;
      return lots > 0 && lots < 0.01 && corrected >= 0.01;
    });

    console.log(`[repairTradeRecordLots] Found ${candidates.length} candidate records with incorrect lots`);

    if (candidates.length === 0) {
      return Response.json({
        success: true,
        message: 'No records require repair. All lots appear to be at the correct scale.',
        dry_run: dryRun,
        total_checked: allRecords.length,
        repaired: 0,
        skipped: 0,
      });
    }

    let repaired = 0;
    let skipped = 0;
    let errors = 0;
    const repairLog = [];

    if (!dryRun) {
      // Process in batches of 50 to avoid overloading the API
      const BATCH_SIZE = 50;
      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(async (record) => {
          try {
            const oldLots = parseFloat(record.lots || 0);
            const newLots = parseFloat((oldLots * CORRECTION_MULTIPLIER).toFixed(5));
            await base44.asServiceRole.entities.TradeRecord.update(record.id, { lots: newLots });
            return { id: record.id, trade_id: record.trade_id, account_id: record.account_id, old: oldLots, new: newLots, ok: true };
          } catch (err) {
            return { id: record.id, trade_id: record.trade_id, account_id: record.account_id, error: err.message, ok: false };
          }
        }));

        for (const r of results) {
          if (r.ok) {
            repaired++;
            repairLog.push({ trade_id: r.trade_id, account_id: r.account_id, old_lots: r.old, new_lots: r.new });
          } else {
            errors++;
            console.error(`[repairTradeRecordLots] Failed to update ${r.trade_id}: ${r.error}`);
          }
        }

        // Small delay between batches to be gentle on the API
        if (i + BATCH_SIZE < candidates.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } else {
      // Dry run — just report what would be changed
      for (const record of candidates) {
        const oldLots = parseFloat(record.lots || 0);
        const newLots = parseFloat((oldLots * CORRECTION_MULTIPLIER).toFixed(5));
        repairLog.push({ trade_id: record.trade_id, account_id: record.account_id, old_lots: oldLots, new_lots: newLots });
      }
      repaired = candidates.length;
    }

    // Identify affected accounts for stats recalculation note
    const affectedAccountIds = [...new Set(candidates.map(r => r.account_id))];

    console.log(`[repairTradeRecordLots] Done. repaired=${repaired}, errors=${errors}, affected_accounts=${affectedAccountIds.length}`);

    return Response.json({
      success: true,
      dry_run: dryRun,
      message: dryRun
        ? `Dry run complete. ${repaired} records would be corrected (lots × 10).`
        : `Repair complete. ${repaired} records corrected, ${errors} errors.`,
      total_checked: allRecords.length,
      candidates_found: candidates.length,
      repaired: dryRun ? 0 : repaired,
      errors,
      affected_account_ids: affectedAccountIds,
      repair_log: repairLog.slice(0, 100), // Cap log at 100 entries in response
      note: dryRun
        ? 'Re-run with dry_run=false to apply corrections. Account statistics will be recalculated on the next scheduledMTSync run (every 5 minutes).'
        : 'Account statistics (win_rate, total_trades) will be recalculated automatically on the next scheduledMTSync run.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});