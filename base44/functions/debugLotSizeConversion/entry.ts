/**
 * debugLotSizeConversion — Audit tool to verify MT5 volume values end-to-end
 * Run this to see raw MT5 API values vs database vs frontend display
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const mt5Providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const mt5Provider = mt5Providers[0];
    const MT5_BASE = mt5Provider?.server_url || Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = mt5Provider?.api_key    || Deno.env.get('MT5_API_KEY');

    if (!MT5_BASE || !MT5_KEY) {
      return Response.json({ error: 'MT5 not configured' }, { status: 500 });
    }

    const userAccounts = await base44.entities.ChallengeAccount.filter({ user_email: user.email });
    const activeAccounts = userAccounts.filter(a => a.mt_login && ['active', 'funded', 'passed'].includes(a.status) && a.platform === 'mt5');

    if (activeAccounts.length === 0) {
      return Response.json({ message: 'No active MT5 accounts found' });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };

    const audit = [];

    for (const acc of activeAccounts) {
      const loginNum = parseInt(acc.mt_login);
      
      // Fetch raw positions from MT5 API
      const posRes = await fetch(`${MT5_BASE}/api/v1/deal/get-position`, {
        method: 'POST', headers,
        body: JSON.stringify({ logins: [loginNum], groups: [], apikey: MT5_KEY, pageOffset: 0, pageSize: 500 }),
      });

      if (!posRes.ok) {
        audit.push({
          account_id: acc.account_id,
          mt_login: acc.mt_login,
          error: `API returned ${posRes.status}`,
        });
        continue;
      }

      const r = await posRes.json();
      const positions = r?.data || [];

      // Fetch stored TradeRecords for comparison
      const storedTrades = await base44.asServiceRole.entities.TradeRecord.filter({ account_id: acc.account_id, status: 'closed' });
      const storedLots = storedTrades.map(t => ({ trade_id: t.trade_id, lots: t.lots, symbol: t.symbol }));

      const positionAudit = positions.map((p, i) => {
        const rawVol = parseFloat(p.volume ?? 0);
        const oldConversion = rawVol / 100000; // OLD (buggy)
        const newConversion = rawVol / 10000;  // NEW (fixed)
        
        return {
          position: i + 1,
          symbol: p.symbol,
          raw_volume_api: rawVol,
          lots_old_buggy: parseFloat(oldConversion.toFixed(5)),
          lots_new_fixed: parseFloat(newConversion.toFixed(5)),
          action: p.actionID === 1 ? 'SELL' : 'BUY',
        };
      });

      audit.push({
        account_id: acc.account_id,
        mt_login: acc.mt_login,
        total_positions: positions.length,
        raw_api_samples: positionAudit.slice(0, 10), // First 10 positions
        stored_closed_trades_sample: storedLots.slice(0, 10),
      });
    }

    return Response.json({
      message: 'Lot Size Audit Complete',
      timestamp: new Date().toISOString(),
      accounts_audited: audit.length,
      data: audit,
      fix_summary: {
        old_divisor: 100000,
        new_divisor: 10000,
        example: {
          raw_api_volume: 10000,
          old_result: '0.10 lots (WRONG)',
          new_result: '1.00 lots (CORRECT)',
        },
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});