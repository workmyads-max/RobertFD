/**
 * checkTronPayment — Auto-detects USDT TRC20 payments via TronGrid API
 * Hybrid approach:
 *   1. Auto-scan: polls TronGrid for incoming USDT transfers, matches by amount + time window
 *   2. User TXID: user pastes their TXID, we verify ownership and store it
 * Admin stays the final gatekeeper for MT5 provisioning.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const WALLET_ADDRESS = 'TCeumh27PZs7ALggMPA8oToNu6zeuEqHuu';
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const USDT_DECIMALS = 6;
const SCAN_WINDOW_HOURS = 2;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const { action, order_id, txid } = body;

    // ── SUBMIT TXID (user-facing, requires auth) ──────────────────────────────
    if (action === 'submit_txid') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      if (!order_id || !txid) {
        return Response.json({ error: 'order_id and txid required' }, { status: 400 });
      }

      const orders = await sr.entities.Order.filter({ order_id });
      const order = orders[0];
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

      // Verify ownership
      if (order.email?.toLowerCase() !== user.email?.toLowerCase()) {
        return Response.json({ error: 'Order does not belong to you' }, { status: 403 });
      }

      // Check TXID uniqueness across all orders
      const allOrders = await sr.entities.Order.list('-created_date', 500);
      const conflict = allOrders.find(o => o.transaction_id === txid && o.order_id !== order_id);
      if (conflict) {
        return Response.json({ error: 'This TXID has already been submitted for another order' }, { status: 409 });
      }

      await sr.entities.Order.update(order.id, {
        transaction_id: txid,
        payment_status: 'confirming',
      });

      // Notify admin
      await sr.entities.Notification.create({
        title: 'USDT Payment TXID Submitted',
        message: `Order ${order_id}: ${order.email} submitted TXID ${txid} for $${order.price}. Awaiting admin verification.`,
        type: 'system', priority: 'high', display_mode: 'sidebar', is_active: true, target: 'admin',
      });

      return Response.json({ success: true, status: 'confirming', message: 'TXID submitted. Awaiting admin verification.' });
    }

    // ── SCAN PENDING ORDERS (scheduled automation or single order) ───────────
    let ordersToCheck = [];

    if (order_id) {
      const orders = await sr.entities.Order.filter({ order_id });
      if (orders[0]) ordersToCheck = [orders[0]];
    } else {
      const allOrders = await sr.entities.Order.list('-created_date', 200);
      ordersToCheck = allOrders.filter(o =>
        o.payment_method === 'usdt_trc20' &&
        ['awaiting_confirmation', 'pending'].includes(o.payment_status)
      );
    }

    if (ordersToCheck.length === 0) {
      return Response.json({ success: true, message: 'No pending orders', checked: 0, matched: 0 });
    }

    // Fetch recent USDT TRC20 incoming transactions from TronGrid
    const tronUrl = `https://api.trongrid.io/v1/accounts/${WALLET_ADDRESS}/transactions/trc20?only_to=true&limit=50&contract_address=${USDT_CONTRACT}`;
    const tronRes = await fetch(tronUrl);

    if (!tronRes.ok) {
      return Response.json({ error: `TronGrid API error: ${tronRes.status}` }, { status: 502 });
    }

    const tronData = await tronRes.json();
    const transactions = tronData?.data || [];

    let matchedCount = 0;
    const scanWindowMs = SCAN_WINDOW_HOURS * 60 * 60 * 1000;
    const cutoffTime = Date.now() - scanWindowMs;

    for (const order of ordersToCheck) {
      // Skip if already has a TXID
      if (order.transaction_id) continue;

      const expectedValue = Math.round(order.price * Math.pow(10, USDT_DECIMALS));

      // Match by exact amount within the scan window
      const match = transactions.find(tx => {
        const value = parseInt(tx.value);
        if (value !== expectedValue) return false;

        const txTime = parseInt(tx.block_timestamp);
        return txTime >= cutoffTime;
      });

      if (match) {
        // Check if this TXID is already assigned to another order
        const conflictingOrders = await sr.entities.Order.filter({ transaction_id: match.transaction_id });
        if (conflictingOrders.length > 0) continue;

        await sr.entities.Order.update(order.id, {
          transaction_id: match.transaction_id,
          payment_status: 'confirming',
        });
        matchedCount++;

        // Notify admin
        await sr.entities.Notification.create({
          title: 'USDT Payment Auto-Detected',
          message: `Payment of $${order.price} detected for order ${order.order_id}. TXID: ${match.transaction_id}. Awaiting admin approval.`,
          type: 'system', priority: 'high', display_mode: 'sidebar', is_active: true, target: 'admin',
        });
      }
    }

    return Response.json({
      success: true,
      checked: ordersToCheck.length,
      matched: matchedCount,
      transactions_found: transactions.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}