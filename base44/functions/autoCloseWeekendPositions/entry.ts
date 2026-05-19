import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Scheduled function to auto-close weekend positions for Standard accounts
 * Runs every hour on Fridays and Saturdays
 * Closes positions for Standard accounts (1:100) holding over weekend
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Only admins can trigger this
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const now = new Date();
    const utcDay = now.getUTCDay();
    const utcHour = now.getUTCHours();
    
    // Run on Friday 20:00-22:00 UTC (before 21:00 GMT weekend deadline)
    // and Saturday 00:00-02:00 UTC (grace period)
    const isFriday = utcDay === 5;
    const isSaturday = utcDay === 6;
    const shouldRun = (isFriday && (utcHour >= 20 && utcHour <= 22)) || (isSaturday && (utcHour >= 0 && utcHour <= 2));
    
    if (!shouldRun) {
      return Response.json({ 
        success: true, 
        skipped: true, 
        reason: 'Outside weekend enforcement window',
        nextRun: 'Friday 20:00 UTC'
      });
    }

    // Get all active Standard accounts (not Swing)
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ 
      status: 'active',
      account_type: 'standard' // Only Standard accounts, Swing can hold weekend
    });

    const results = [];
    let totalClosed = 0;

    for (const account of accounts) {
      try {
        // Get open positions for this account
        const positions = await base44.asServiceRole.entities.TradeRecord.filter({
          account_id: account.account_id,
          status: 'open'
        });

        if (positions.length === 0) {
          results.push({
            account_id: account.account_id,
            user_email: account.user_email,
            positions_found: 0,
            action: 'no_positions'
          });
          continue;
        }

        // Close all open positions
        for (const position of positions) {
          try {
            // Update position status to closed
            await base44.asServiceRole.entities.TradeRecord.update(position.id, {
              status: 'closed',
              close_time: now.toISOString(),
              close_reason: 'weekend_close_auto',
              pnl: position.pnl || 0,
              close: position.entry // Approximate close price
            });

            results.push({
              account_id: account.account_id,
              user_email: account.user_email,
              symbol: position.symbol,
              lots: position.lots,
              action: 'closed',
              reason: 'Standard account weekend enforcement'
            });

            totalClosed++;
          } catch (posError) {
            results.push({
              account_id: account.account_id,
              symbol: position.symbol,
              action: 'failed',
              error: posError.message
            });
          }
        }

        // Send notification email to user
        try {
          await base44.functions.invoke('emailService', {
            action: 'send_notification',
            to: account.user_email,
            type: 'weekend_close',
            data: {
              name: account.user_email.split('@')[0],
              positions_closed: positions.length,
              account_size: account.account_size,
              timestamp: now.toLocaleString('en-US', { timeZone: 'Asia/Dubai' })
            }
          });
        } catch (emailError) {
          console.error('Email notification failed:', emailError);
        }

      } catch (accError) {
        results.push({
          account_id: account.account_id,
          action: 'error',
          error: accError.message
        });
      }
    }

    return Response.json({
      success: true,
      execution_time: now.toISOString(),
      accounts_processed: accounts.length,
      total_positions_closed: totalClosed,
      details: results
    });

  } catch (error) {
    console.error('Weekend close error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});