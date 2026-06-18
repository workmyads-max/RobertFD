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

    // ── HELPER: open a position on a slave account ────────────────────────────
    const openPosition = async (slaveLogin, masterPos, multiplier, copySLTP) => {
      const isSell = masterPos.type === 'SELL';
      const lots = Math.max(0.01, Math.round(masterPos.lots * multiplier * 100) / 100);
      const payload = {
        Login: slaveLogin,
        Symbol: masterPos.symbol,
        Action: isSell ? 1 : 0,         // 0=BUY, 1=SELL
        Volume: Math.round(lots * 10000), // centi-lots
        Price: 0,                         // 0 = market price
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
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      return { ok: res.ok, data, lots };
    };

    // ── HELPER: close a position on a slave account ───────────────────────────
    const closePosition = async (slaveLogin, slaveTicket, slavePos) => {
      const isSell = slavePos.type === 'SELL';
      const payload = {
        Login: slaveLogin,
        Position: parseInt(slaveTicket),
        Symbol: slavePos.symbol,
        Action: isSell ? 0 : 1,           // close = opposite direction
        Volume: Math.round(slavePos.lots * 10000),
        Price: 0,
        apikey: MT5_KEY,
      };
      const res = await fetch(`${MT5_BASE}/api/v1/deal/close`, {
        method: 'POST', headers,
        body: JSON.stringify(payload),
      }).catch(() => ({ ok: false }));
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      return { ok: res.ok, data };
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

      // ── OPEN: positions on master that are NOT on slave ─────────────────────
      for (const mp of masterPositions) {
        // Match by symbol + direction + open_time within window
        const alreadyCopied = slavePositions.some(sp =>
          sp.symbol === mp.symbol &&
          sp.type === mp.type &&
          Math.abs(sp.open_time_ms - mp.open_time_ms) < POSITION_MATCH_WINDOW_MS
        );
        if (!alreadyCopied) {
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

      // ── CLOSE: positions on slave that are NOT on master ────────────────────
      for (const sp of slavePositions) {
        const stillOpen = masterPositions.some(mp =>
          mp.symbol === sp.symbol &&
          mp.type === sp.type &&
          Math.abs(mp.open_time_ms - sp.open_time_ms) < POSITION_MATCH_WINDOW_MS
        );
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