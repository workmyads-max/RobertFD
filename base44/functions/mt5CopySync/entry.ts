/**
 * mt5CopySync — Intra-user MT5 Copy Trading Engine
 *
 * ISOLATION NOTE: This function is fully self-contained.
 * To remove the copy trading feature entirely:
 *   1. Delete this file (functions/mt5CopySync.js)
 *   2. Delete entities/CopyTradingRule.json
 *   3. Delete components/dashboard/CopyTradingPanel.jsx
 *   4. Remove the 'copy-trading' case from Dashboard.jsx renderPage()
 *   5. Remove the sidebar entry in DashboardSidebar
 * Nothing else is affected.
 *
 * FLOW:
 *   1. Load all active CopyTradingRules for the authenticated user
 *   2. Fetch live positions on each master account
 *   3. Fetch live positions on each slave account
 *   4. For any position on master NOT on slave → open it on slave
 *   5. For any position on slave NOT on master → close it on slave
 *   6. Track state via a "position_key" = symbol+direction+open_time (±30s)
 *
 * Called from: CopyTradingPanel (frontend) on a 5s polling loop
 * Also supports: action=test (dry run), action=sync (live), action=toggle_rule
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const POSITION_MATCH_WINDOW_MS = 60_000; // 60s window for open_time matching

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action = 'sync', rule_id, is_active } = body;

    const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = Deno.env.get('MT5_API_KEY');
    if (!MT5_BASE || !MT5_KEY) {
      return Response.json({ error: 'MT5 not configured' }, { status: 500 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };

    // ── TOGGLE RULE ────────────────────────────────────────────────────────────
    if (action === 'toggle_rule' && rule_id) {
      const rules = await base44.entities.CopyTradingRule.filter({ user_email: user.email });
      const rule = rules.find(r => r.id === rule_id);
      if (!rule) return Response.json({ error: 'Rule not found' }, { status: 404 });
      await base44.entities.CopyTradingRule.update(rule.id, { is_active: !rule.is_active });
      return Response.json({ success: true, is_active: !rule.is_active });
    }

    // ── LOAD ACTIVE RULES FOR THIS USER ───────────────────────────────────────
    const allRules = await base44.entities.CopyTradingRule.filter({ user_email: user.email });
    const activeRules = allRules.filter(r => r.is_active);

    if (activeRules.length === 0) {
      return Response.json({ success: true, message: 'No active copy rules', actions_taken: [] });
    }

    // ── HELPER: fetch open positions for an MT5 login ─────────────────────────
    const fetchPositions = async (loginNum) => {
      const res = await fetch(`${MT5_BASE}/api/v1/deal/get-position`, {
        method: 'POST', headers,
        body: JSON.stringify({ logins: [loginNum], groups: [], apikey: MT5_KEY, pageOffset: 0, pageSize: 500 }),
      }).catch(() => ({ ok: false }));
      if (!res.ok) return [];
      const r = await res.json().catch(() => ({}));
      return (r?.data || []).map(p => {
        const isSell = (p.actionID ?? p.action ?? 0) === 1;
        return {
          ticket: String(p.position ?? p.externalID ?? ''),
          symbol: (p.symbol ?? '').toUpperCase(),
          type: isSell ? 'SELL' : 'BUY',
          lots: parseFloat(p.volume ?? 0) / 10000,
          entry: parseFloat(p.priceOpen ?? 0),
          sl: parseFloat(p.priceSL ?? 0),
          tp: parseFloat(p.priceTP ?? 0),
          open_time_ms: p.timeCreate ? new Date(p.timeCreateDateTime ?? p.timeCreate * 1000).getTime() : 0,
          raw: p,
        };
      });
    };

    // ── CAPABILITY CHECK: probe if trade execution is supported ──────────────
    // Tritech bridge only exposes read endpoints on this deployment.
    // We probe once per sync call to detect if execution was enabled by broker.
    const checkTradeExecution = async () => {
      const probeRes = await fetch(`${MT5_BASE}/api/v1/deal/open`, {
        method: 'POST', headers,
        body: JSON.stringify({ probe: true, apikey: MT5_KEY }),
      }).catch(() => ({ status: 0 }));
      // 404 = endpoint missing, 405 = method not allowed → execution not supported
      // 400/422/500 = endpoint exists but rejected payload → execution IS supported
      return probeRes.status !== 404 && probeRes.status !== 405 && probeRes.status !== 0;
    };

    const executionSupported = await checkTradeExecution();

    if (!executionSupported) {
      return Response.json({
        success: false,
        execution_supported: false,
        broker_error: 'BROKER_API_NO_EXECUTION',
        message: 'Your broker API bridge does not support programmatic trade execution (/api/v1/deal/open is not available). Copy trading requires the broker to enable the Manager API trade execution endpoints. Please contact your broker (Tritech) to enable deal/order execution on the API bridge.',
        actions_taken: [],
        errors: ['Broker API does not support trade execution — contact Tritech support to enable Manager API order placement'],
      });
    }

    // ── HELPER: open a position on a slave account ────────────────────────────
    const openPosition = async (slaveLogin, masterPos, multiplier, copySLTP) => {
      const isSell = masterPos.type === 'SELL';
      const lots = Math.max(0.01, Math.round(masterPos.lots * multiplier * 100) / 100);
      const payload = {
        Login: slaveLogin,
        Symbol: masterPos.symbol,
        Action: isSell ? 1 : 0,
        Volume: Math.round(lots * 10000),
        Price: 0,
        apikey: MT5_KEY,
      };
      if (copySLTP) {
        if (masterPos.sl > 0) payload.SL = masterPos.sl;
        if (masterPos.tp > 0) payload.TP = masterPos.tp;
      }
      const res = await fetch(`${MT5_BASE}/api/v1/deal/open`, {
        method: 'POST', headers,
        body: JSON.stringify(payload),
      }).catch(() => ({ ok: false }));
      const text = res.ok ? await res.text().catch(() => '{}') : '{}';
      let data = {};
      try { data = JSON.parse(text); } catch {}
      console.log(`[openPosition] slave=${slaveLogin} ${masterPos.symbol} ${masterPos.type} ${lots}L → HTTP ${res.status}: ${text.slice(0, 200)}`);
      return { ok: res.ok && (data?.resultCode === '200' || data?.data?.errorcode === 0), data, lots };
    };

    // ── HELPER: close a position on a slave account ───────────────────────────
    const closePosition = async (slaveLogin, slaveTicket, slavePos) => {
      const payload = {
        Login: slaveLogin,
        Position: parseInt(slaveTicket),
        Symbol: slavePos.symbol,
        Action: slavePos.type === 'SELL' ? 0 : 1,
        Volume: Math.round(slavePos.lots * 10000),
        Price: 0,
        apikey: MT5_KEY,
      };
      const res = await fetch(`${MT5_BASE}/api/v1/deal/close`, {
        method: 'POST', headers,
        body: JSON.stringify(payload),
      }).catch(() => ({ ok: false }));
      const text = res.ok ? await res.text().catch(() => '{}') : '{}';
      let data = {};
      try { data = JSON.parse(text); } catch {}
      return { ok: res.ok && (data?.resultCode === '200' || data?.data?.errorcode === 0), data };
    };

    // ── SYNC ALL RULES ─────────────────────────────────────────────────────────
    const actionsTaken = [];
    const errors = [];
    const isDryRun = action === 'test';

    for (const rule of activeRules) {
      const masterLogin = parseInt(rule.master_mt_login);
      const slaveLogin  = parseInt(rule.slave_mt_login);
      if (!masterLogin || !slaveLogin) continue;

      const [masterPositions, slavePositions] = await Promise.all([
        fetchPositions(masterLogin),
        fetchPositions(slaveLogin),
      ]);

      console.log(`[CopySync] master=${masterLogin} positions=${masterPositions.length}, slave=${slaveLogin} positions=${slavePositions.length}`);

      // ── MATCHING STRATEGY ────────────────────────────────────────────────────
      // Primary: match by symbol+direction+open_time (±60s)
      // Fallback: if open_time_ms is 0 for all (API doesn't return it), match by
      //   symbol+direction+lots (within 1% tolerance) — prevents infinite re-opens
      const allTimesZero = masterPositions.every(p => p.open_time_ms === 0) &&
                           slavePositions.every(p => p.open_time_ms === 0);

      const positionMatches = (mp, sp) => {
        const symbolMatch = sp.symbol === mp.symbol;
        const dirMatch    = sp.type === mp.type;
        if (!symbolMatch || !dirMatch) return false;
        if (!allTimesZero) {
          // Time-based match (preferred)
          return Math.abs(sp.open_time_ms - mp.open_time_ms) < POSITION_MATCH_WINDOW_MS;
        }
        // Fallback: lot-size similarity (within 20% or same multiplier)
        const lotsRatio = sp.lots / (mp.lots * rule.lot_multiplier || 1);
        return lotsRatio > 0.5 && lotsRatio < 2.0;
      };

      // Count how many slave positions match each master position (for 1:1 copy tracking)
      // If master has 2 EURUSD BUY and slave has 1 — copy 1 more
      const countSlaveMatches = (mp) => slavePositions.filter(sp => positionMatches(mp, sp)).length;
      const countMasterMatches = (symbol, type) => masterPositions.filter(mp => mp.symbol === symbol && mp.type === type).length;

      // ── OPEN: positions on master that are NOT on slave ─────────────────────
      // Group by symbol+type and compare counts to avoid duplicate opens
      const masterGroups = {};
      for (const mp of masterPositions) {
        const key = `${mp.symbol}_${mp.type}`;
        masterGroups[key] = (masterGroups[key] || 0) + 1;
      }
      const slaveGroups = {};
      for (const sp of slavePositions) {
        const key = `${sp.symbol}_${sp.type}`;
        slaveGroups[key] = (slaveGroups[key] || 0) + 1;
      }

      const openedThisCycle = {};
      for (const mp of masterPositions) {
        const key = `${mp.symbol}_${mp.type}`;
        const masterCount = masterGroups[key] || 0;
        const slaveCount  = slaveGroups[key] || 0;
        const alreadyOpenedThisCycle = openedThisCycle[key] || 0;

        // Only open if slave has fewer positions of this type than master
        if (slaveCount + alreadyOpenedThisCycle >= masterCount) continue;

        openedThisCycle[key] = alreadyOpenedThisCycle + 1;
        const alreadyCopied = false; // handled by count logic above
        if (true) {
          actionsTaken.push({
            rule_id: rule.id,
            action: 'OPEN',
            symbol: mp.symbol,
            type: mp.type,
            master_lots: mp.lots,
            slave_lots: Math.max(0.01, Math.round(mp.lots * rule.lot_multiplier * 100) / 100),
            dry_run: isDryRun,
          });
          if (!isDryRun) {
            const result = await openPosition(slaveLogin, mp, rule.lot_multiplier, rule.copy_sl_tp ?? true);
            actionsTaken[actionsTaken.length - 1].result = result.data;
            actionsTaken[actionsTaken.length - 1].ok = result.ok;
            if (!result.ok) errors.push(`Failed to open ${mp.symbol} ${mp.type} on slave ${slaveLogin}`);
          }
        }
      }

      // ── CLOSE: positions on slave that exceed master count ──────────────────
      for (const sp of slavePositions) {
        const key = `${sp.symbol}_${sp.type}`;
        const masterCount = masterGroups[key] || 0;
        const slaveCount  = slaveGroups[key] || 0;
        const stillOpen = masterCount >= slaveCount; // slave has same or fewer than master — keep
        if (!stillOpen) {
          actionsTaken.push({
            rule_id: rule.id,
            action: 'CLOSE',
            symbol: sp.symbol,
            type: sp.type,
            slave_lots: sp.lots,
            dry_run: isDryRun,
          });
          if (!isDryRun) {
            const result = await closePosition(slaveLogin, sp.ticket, sp);
            actionsTaken[actionsTaken.length - 1].result = result.data;
            actionsTaken[actionsTaken.length - 1].ok = result.ok;
            if (!result.ok) errors.push(`Failed to close ${sp.symbol} ${sp.type} on slave ${slaveLogin}`);
          }
        }
      }

      // Update last_synced_at + trade count (non-blocking)
      const openedCount = actionsTaken.filter(a => a.action === 'OPEN' && a.rule_id === rule.id && !isDryRun).length;
      if (!isDryRun && openedCount > 0) {
        base44.entities.CopyTradingRule.update(rule.id, {
          last_synced_at: new Date().toISOString(),
          total_trades_copied: (rule.total_trades_copied || 0) + openedCount,
        }).catch(() => {});
      }
    }

    return Response.json({
      success: true,
      dry_run: isDryRun,
      rules_processed: activeRules.length,
      actions_taken: actionsTaken,
      errors,
      synced_at: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});