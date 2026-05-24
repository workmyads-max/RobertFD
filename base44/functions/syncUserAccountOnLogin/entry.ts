/**
 * syncUserAccountOnLogin - Sync MT5/Match Trader data when user opens dashboard
 * Only syncs accounts belonging to the authenticated user
 * Zero automation credits - runs on-demand only
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
    const MT5_API_KEY = Deno.env.get('MT5_API_KEY');
    const MT_BASE = Deno.env.get('MATCH_TRADER_BASE_URL');
    const MT_API_KEY = Deno.env.get('MATCH_TRADER_API_KEY');

    // Get only this user's active accounts
    const userAccounts = await base44.entities.ChallengeAccount.filter({ 
      user_email: user.email 
    });
    
    const activeAccounts = userAccounts.filter(a =>
      a.mt_login &&
      ['active', 'funded', 'passed'].includes(a.status) &&
      ['mt5', 'match_trader'].includes(a.platform)
    );

    if (activeAccounts.length === 0) {
      return Response.json({ 
        success: true, 
        synced: 0, 
        message: 'No active MT accounts to sync' 
      });
    }

    const results = [];

    for (const acc of activeAccounts) {
      try {
        const isMT5 = acc.platform === 'mt5';
        const apiBase = isMT5 ? MT5_BASE : MT_BASE;
        const apiKey = isMT5 ? MT5_API_KEY : MT_API_KEY;

        if (!apiBase || !apiKey) {
          results.push({ 
            account_id: acc.account_id, 
            ok: false, 
            error: `Missing API config for ${acc.platform}` 
          });
          continue;
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'api-key': apiKey,
        };

        const [infoRes, posRes, histRes] = await Promise.all([
          fetch(`${apiBase}/accounts/${acc.mt_login}`, { headers }),
          fetch(`${apiBase}/accounts/${acc.mt_login}/positions`, { headers }),
          fetch(`${apiBase}/accounts/${acc.mt_login}/deals?limit=100`, { headers }),
        ]);

        let mtData = {};
        let positions = [];
        let deals = [];

        if (infoRes.ok) mtData = await infoRes.json();
        if (posRes.ok) { 
          const d = await posRes.json(); 
          positions = d?.positions || d || []; 
        }
        if (histRes.ok) { 
          const d = await histRes.json(); 
          deals = d?.deals || d || []; 
        }

        const balance = mtData?.balance ?? acc.balance ?? 0;
        const equity = mtData?.equity ?? acc.equity ?? 0;
        const closedTrades = deals.filter(d => d.entry === 'OUT' || d.positionId);
        const wins = closedTrades.filter(d => (d.profit || 0) > 0).length;
        const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
        const accountSize = acc.account_size || 100000;
        const maxDDUsed = Math.max(0, ((accountSize - equity) / accountSize) * 100);
        const newHWM = Math.max(acc.high_water_mark || 0, balance);

        const maxAllowedDD = acc.challenge_type === 'instant_light' ? 6 : 10;
        const updates = {
          balance,
          equity,
          pnl: parseFloat((balance - accountSize).toFixed(2)),
          win_rate: parseFloat(winRate.toFixed(1)),
          total_trades: closedTrades.length,
          max_drawdown_used: parseFloat(maxDDUsed.toFixed(2)),
          profit_target_progress: parseFloat(Math.max(0, (balance - accountSize) / accountSize * 100).toFixed(2)),
          high_water_mark: newHWM,
          last_synced_at: new Date().toISOString(),
        };

        if (maxDDUsed >= maxAllowedDD && acc.status === 'active') {
          updates.status = 'failed';
          console.log(`[AUTO-BREACH] ${acc.account_id} breached DD: ${maxDDUsed.toFixed(2)}%`);
        }

        await base44.entities.ChallengeAccount.update(acc.id, updates);

        results.push({ 
          account_id: acc.account_id, 
          ok: true, 
          balance, 
          equity, 
          dd: maxDDUsed 
        });
      } catch (err) {
        results.push({ 
          account_id: acc.account_id, 
          ok: false, 
          error: err.message 
        });
      }
    }

    return Response.json({ 
      success: true, 
      synced: results.filter(r => r.ok).length, 
      results 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});