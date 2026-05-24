/**
 * CoinPayments IPN (Instant Payment Notification) handler
 * Validates HMAC-SHA512 signature, tracks confirmations, prevents duplicates,
 * and provisions challenge accounts only after confirmed payment.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function parseFormData(body) {
  const params = {};
  for (const pair of body.split('&')) {
    const [k, v] = pair.split('=');
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return params;
}

async function verifyCoinPaymentsIPN(body, hmac, ipnSecret) {
  if (!hmac || !ipnSecret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(ipnSecret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
  );
  const rawSig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expected = Array.from(new Uint8Array(rawSig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expected.toLowerCase() === hmac.toLowerCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const hmac = req.headers.get('hmac');

    // Load gateway config
    const gateways = await base44.asServiceRole.entities.PaymentGateway.filter({ provider: 'coinpayments', is_active: true });
    const gateway = gateways[0];
    const ipnSecret = gateway?.webhook_secret;

    // IPN signature verification (HMAC-SHA512)
    if (ipnSecret) {
      const isValid = await verifyCoinPaymentsIPN(body, hmac, ipnSecret);
      if (!isValid) {
        console.error('[SECURITY] Invalid CoinPayments IPN signature');
        await base44.asServiceRole.entities.PaymentLog.create({
          gateway: 'coinpayments', event_type: 'signature_failure',
          event_data: { hmac, body_preview: body.slice(0, 200) }, status: 'failed',
          notes: 'HMAC-SHA512 IPN verification failed',
        });
        return new Response('INVALID_IPN', { status: 401 });
      }
    }

    const ipn = parseFormData(body);
    const txnId = ipn.txn_id;
    const status = parseInt(ipn.status || '0');
    const orderId = ipn.custom || ipn.order_id;
    const confirmations = parseInt(ipn.confirms || '0');

    console.log(`[CoinPayments] IPN: order=${orderId} txn=${txnId} status=${status} confirms=${confirmations}`);

    // Duplicate prevention: check txn_id uniqueness
    const existingLogs = await base44.asServiceRole.entities.PaymentLog.filter({ transaction_id: txnId, processed: true });
    if (existingLogs.length > 0) {
      console.log(`[CoinPayments] Duplicate IPN ignored: txn_id=${txnId}`);
      return new Response('IPN_OK', { status: 200 });
    }

    const isPending = status >= 0 && status < 100;
    const isComplete = status >= 100;
    const isFailed = status < 0;

    // Log IPN
    await base44.asServiceRole.entities.PaymentLog.create({
      gateway: 'coinpayments', event_type: isComplete ? 'payment.complete' : isFailed ? 'payment.failed' : 'payment.confirming',
      event_data: ipn, order_id: orderId, transaction_id: txnId,
      status: isComplete ? 'paid' : isFailed ? 'failed' : 'confirming',
      amount: parseFloat(ipn.amount1 || 0), currency: ipn.currency1 || 'USD',
      crypto_currency: ipn.currency2, confirmations,
      customer_email: ipn.email, processed: isComplete || isFailed,
    });

    if (!orderId) return new Response('IPN_OK', { status: 200 });

    const orders = await base44.asServiceRole.entities.Order.filter({ order_id: orderId });
    const order = orders[0];
    if (!order) { console.warn(`[CoinPayments] Order not found: ${orderId}`); return new Response('IPN_OK', { status: 200 }); }

    if (isPending) {
      await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: 'confirming', transaction_id: txnId,
      });
    } else if (isComplete) {
      await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: 'confirmed', transaction_id: txnId, payment_method: 'coinpayments',
      });

      // Auto-provision challenge account
      try {
        await base44.asServiceRole.functions.invoke('provisionMatchTraderAccount', {
          account_id: order.account_id || order.order_id,
          user_email: order.email,
          challenge_type: order.challenge_type,
          account_size: order.account_size,
        });
      } catch (e) { console.error('[CoinPayments] Provisioning failed:', e.message); }

      try {
        await base44.asServiceRole.functions.invoke('sendBrandedEmail', {
          to: order.email, template_type: 'payment_success',
          data: { name: order.full_name, amount: order.price, order_id: order.order_id, challenge_type: order.challenge_type, account_size: order.account_size },
        });
      } catch (e) { console.error('[CoinPayments] Email failed:', e.message); }

      await base44.asServiceRole.entities.Notification.create({
        title: '✅ CoinPayments Transaction Confirmed',
        message: `Order ${orderId} fully confirmed after ${confirmations} blockchain confirmations. Challenge account provisioning initiated.`,
        type: 'payout', priority: 'high', display_mode: 'popup', is_active: true, target: 'challenge',
      });
    } else if (isFailed) {
      const failReason = status === -1 ? 'Cancelled' : status === -2 ? 'Timed Out' : `Failed (status ${status})`;
      await base44.asServiceRole.entities.Order.update(order.id, { payment_status: 'failed' });
      console.warn(`[CoinPayments] Payment failed for order ${orderId}: ${failReason}`);
    }

    return new Response('IPN_OK', { status: 200 });
  } catch (error) {
    console.error('[CoinPayments] IPN error:', error.message);
    return new Response('IPN_ERR', { status: 500 });
  }
});