import React, { useState } from 'react';
import { FileText, Download, Filter, CreditCard, Eye, X, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useOrders, useChallengeAccounts } from '@/hooks/useSupabaseQuery';
import { useSupabaseAuth } from '@/lib/SupabaseAuthContext';
import jsPDF from 'jspdf';

// ─── Payment method labels ────────────────────────────────────────────────────
function payMethodLabel(m) {
  const map = {
    usdt_trc20: 'USDT (TRC20)',
    bitcoin: 'Bitcoin (BTC)',
    checkout_com_card: 'Credit / Debit Card',
    checkout_com_apple_pay: 'Apple Pay',
    checkout_com_google_pay: 'Google Pay',
    confirmo_crypto: 'Confirmo Crypto',
    nowpayments: 'NOWPayments Crypto',
    coinpayments: 'CoinPayments Crypto',
  };
  return map[m] || m || 'Crypto';
}

// ─── PDF generator ────────────────────────────────────────────────────────────
function generateInvoicePDF(order, user, account) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const invoiceDate = order.created_date
    ? new Date(order.created_date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  const orderId = order.order_id || order.id || `XF-${Date.now()}`;
  const traderName = order.full_name || user?.full_name || 'Trader';
  const traderEmail = order.email || user?.email || '';
  const challengeType = order.challenge_type === 'two-step' ? 'Two-Step Challenge'
    : order.challenge_type === 'instant' ? 'Instant Funding' : 'Instant Light Challenge';
  const accountModel = order.account_type === 'swing' ? 'Swing' : 'Standard';
  const discount = order.discount_amount || 0;
  const subtotal = (order.price || 0) + discount;
  const total = order.price || 0;

  // ── Background ──────────────────────────────────────────────────────────────
  doc.setFillColor(8, 9, 16);
  doc.rect(0, 0, 210, 297, 'F');

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(255, 92, 0);
  doc.rect(0, 0, 210, 44, 'F');

  // subtle diagonal stripe on header
  doc.setFillColor(255, 110, 20);
  doc.setOpacity(0.3);
  for (let x = 0; x < 210; x += 14) {
    doc.rect(x, 0, 7, 44, 'F');
  }
  doc.setOpacity(1);

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('XFUNDED', 15, 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Institutional Proprietary Trading Firm', 15, 28);
  doc.text('support@xfunded.com  |  www.xfunded.com', 15, 35);

  // Invoice label
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 195, 18, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`# ${orderId}`, 195, 27, { align: 'right' });
  doc.text(`Issued: ${invoiceDate}`, 195, 35, { align: 'right' });

  // ── Status badge ────────────────────────────────────────────────────────────
  const isPaid = order.payment_status === 'paid' || order.payment_status === 'confirmed';
  const badgeColor = isPaid ? [16, 185, 129] : [245, 158, 11];
  doc.setFillColor(...badgeColor);
  doc.roundedRect(145, 48, 50, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(isPaid ? '✓  PAID' : '⏳  PENDING', 170, 55, { align: 'center' });

  // ── Bill To / From cards ────────────────────────────────────────────────────
  // Bill To
  doc.setFillColor(16, 17, 26);
  doc.roundedRect(10, 64, 88, 46, 3, 3, 'F');
  doc.setDrawColor(255, 92, 0);
  doc.setLineWidth(0.4);
  doc.line(10, 64, 10, 110);

  doc.setTextColor(255, 92, 0);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 16, 73);

  doc.setTextColor(230, 230, 240);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(traderName, 16, 82);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(170, 170, 185);
  doc.text(traderEmail, 16, 89);
  if (order.phone) doc.text(order.phone, 16, 96);
  const addrLine = [order.city, order.country].filter(Boolean).join(', ');
  if (addrLine) doc.text(addrLine, 16, order.phone ? 103 : 96);

  // From
  doc.setFillColor(16, 17, 26);
  doc.roundedRect(112, 64, 88, 46, 3, 3, 'F');
  doc.setDrawColor(255, 92, 0);
  doc.line(112, 64, 112, 110);

  doc.setTextColor(255, 92, 0);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', 118, 73);

  doc.setTextColor(230, 230, 240);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('XFunded Ltd.', 118, 82);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(170, 170, 185);
  doc.text('support@xfunded.com', 118, 89);
  doc.text('www.xfunded.com', 118, 96);

  // ── Line items table ────────────────────────────────────────────────────────
  // Header
  doc.setFillColor(255, 92, 0);
  doc.rect(10, 118, 190, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', 15, 124.5);
  doc.text('ACCOUNT SIZE', 90, 124.5);
  doc.text('MODEL', 135, 124.5);
  doc.text('AMOUNT', 198, 124.5, { align: 'right' });

  // Row 1
  doc.setFillColor(14, 15, 23);
  doc.rect(10, 127, 190, 13, 'F');
  doc.setTextColor(220, 220, 235);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(challengeType, 15, 135.5);
  doc.text(`$${(order.account_size || 0).toLocaleString()}`, 90, 135.5);
  doc.text(`${accountModel} / MT5`, 135, 135.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 92, 0);
  doc.text(`$${subtotal.toFixed(2)}`, 198, 135.5, { align: 'right' });

  // ── Totals section ──────────────────────────────────────────────────────────
  const totalsY = 148;
  doc.setFillColor(14, 15, 23);
  doc.rect(110, totalsY, 90, 50, 'F');

  const tRow = (label, value, y, bold, color) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 165);
    doc.text(label, 115, y);
    doc.setTextColor(...(color || [210, 210, 225]));
    doc.text(value, 198, y, { align: 'right' });
  };

  tRow('Subtotal:', `$${subtotal.toFixed(2)}`, totalsY + 12);
  if (discount > 0) {
    doc.setFillColor(255, 92, 0);
    doc.roundedRect(175, totalsY + 16, 22, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(`-$${discount.toFixed(2)}`, 186, totalsY + 21, { align: 'center' });
    doc.setTextColor(150, 150, 165);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Discount:', 115, totalsY + 22);
    if (order.coupon_code) {
      doc.setFontSize(7);
      doc.setTextColor(255, 92, 0);
      doc.text(`Code: ${order.coupon_code}`, 115, totalsY + 29);
    }
  }
  tRow('Tax / VAT:', '$0.00', totalsY + 32);

  doc.setDrawColor(255, 92, 0);
  doc.setLineWidth(0.4);
  doc.line(115, totalsY + 37, 198, totalsY + 37);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 92, 0);
  doc.text('TOTAL:', 115, totalsY + 46);
  doc.text(`$${total.toFixed(2)}`, 198, totalsY + 46, { align: 'right' });

  // ── Payment details ─────────────────────────────────────────────────────────
  doc.setFillColor(14, 15, 23);
  doc.rect(10, totalsY, 88, 50, 'F');

  doc.setTextColor(255, 92, 0);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', 15, totalsY + 12);

  const pRow = (label, value, y) => {
    if (!value) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 140);
    doc.text(`${label}:`, 15, y);
    doc.setTextColor(200, 200, 215);
    doc.text(String(value), 40, y);
  };

  pRow('Method', payMethodLabel(order.payment_method), totalsY + 21);
  pRow('Gateway', order.payment_gateway || 'manual', totalsY + 29);
  pRow('Status', (order.payment_status || '').toUpperCase(), totalsY + 37);
  if (order.transaction_id) {
    const txid = order.transaction_id.length > 18 ? order.transaction_id.slice(0, 18) + '…' : order.transaction_id;
    pRow('TxID', txid, totalsY + 45);
  }

  // ── MT5 Account block ───────────────────────────────────────────────────────
  const accY = totalsY + 60;
  if (account) {
    doc.setFillColor(16, 17, 28);
    doc.roundedRect(10, accY, 190, 32, 3, 3, 'F');
    doc.setDrawColor(255, 92, 0);
    doc.setLineWidth(0.3);
    doc.roundedRect(10, accY, 190, 32, 3, 3, 'S');

    doc.setTextColor(255, 92, 0);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('MT5 TRADING ACCOUNT', 15, accY + 9);

    const creds = [
      { label: 'Login', value: account.mt_login || '—' },
      { label: 'Server', value: account.mt_server || '—' },
      { label: 'Phase', value: (account.phase || 'phase1').replace('phase', 'Phase ') },
      { label: 'Leverage', value: account.leverage || '1:100' },
      { label: 'Status', value: account.status || '—' },
    ];

    creds.forEach((c, i) => {
      const col = i < 3 ? 0 : 1;
      const row = i < 3 ? i : i - 3;
      const x = 15 + col * 95;
      const y = accY + 17 + row * 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 140);
      doc.text(`${c.label}:`, x, y);
      doc.setTextColor(210, 210, 225);
      doc.text(String(c.value), x + 18, y);
    });
  }

  // ── Affiliate / referral ────────────────────────────────────────────────────
  if (order.affiliate_code) {
    const affY = accY + (account ? 40 : 0);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 140);
    doc.text(`Referred by: `, 15, affY);
    doc.setTextColor(255, 92, 0);
    doc.text(order.affiliate_code, 15 + 24, affY);
  }

  // ── Terms note ──────────────────────────────────────────────────────────────
  const noteY = 252;
  doc.setFillColor(12, 13, 20);
  doc.rect(10, noteY, 190, 16, 'F');
  doc.setTextColor(100, 100, 120);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('This invoice is auto-generated and serves as official proof of purchase. Challenges are non-refundable once the MT5 account', 15, noteY + 7);
  doc.text('is activated. For disputes or queries, contact support@xfunded.com within 48 hours of purchase.', 15, noteY + 13);

  // ── Footer ──────────────────────────────────────────────────────────────────
  doc.setFillColor(255, 92, 0);
  doc.rect(0, 272, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('XFUNDED — Institutional Proprietary Trading', 105, 280, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}  |  Invoice # ${orderId}`, 105, 287, { align: 'center' });
  doc.text('www.xfunded.com  |  support@xfunded.com', 105, 293, { align: 'center' });

  doc.save(`XFunded-Invoice-${orderId}.pdf`);
}

// ─── Invoice Preview Modal ────────────────────────────────────────────────────
function InvoicePreviewModal({ order, user, account, onClose, onDownload }) {
  if (!order) return null;
  const orderId = order.order_id || order.id || '—';
  const invoiceDate = order.created_date
    ? new Date(order.created_date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  const isPaid = order.payment_status === 'paid' || order.payment_status === 'confirmed';
  const challengeType = order.challenge_type === 'two-step' ? 'Two-Step Challenge'
    : order.challenge_type === 'instant' ? 'Instant Funding' : 'Instant Light Challenge';
  const accountModel = order.account_type === 'swing' ? 'Swing' : 'Standard';
  const discount = order.discount_amount || 0;
  const subtotal = (order.price || 0) + discount;
  const total = order.price || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#080910', border: '1px solid rgba(255,92,0,0.3)', boxShadow: '0 0 60px rgba(255,92,0,0.15)' }}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-foreground">Invoice Preview</span>
            <span className="text-xs font-mono text-muted-foreground">#{orderId}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ background: '#FF5C00' }}>
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice preview body */}
        <div className="p-6 space-y-5">
          {/* Header strip */}
          <div className="rounded-xl px-6 py-5 flex items-start justify-between" style={{ background: '#FF5C00' }}>
            <div>
              <div className="text-white font-black text-xl tracking-tight">XFUNDED</div>
              <div className="text-white/80 text-xs mt-0.5">Institutional Proprietary Trading Firm</div>
              <div className="text-white/70 text-xs">www.xfunded.com  ·  support@xfunded.com</div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-sm">INVOICE</div>
              <div className="text-white/80 text-xs mt-0.5">#{orderId}</div>
              <div className="text-white/70 text-xs">{invoiceDate}</div>
              <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold inline-block"
                style={{ background: isPaid ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)', color: isPaid ? '#6ee7b7' : '#fde68a', border: `1px solid ${isPaid ? '#10b981' : '#f59e0b'}50` }}>
                {isPaid ? '✓ PAID' : '⏳ PENDING'}
              </div>
            </div>
          </div>

          {/* Bill To / From */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'BILL TO', name: order.full_name || user?.full_name || 'Trader', email: order.email || user?.email, extra: [order.phone, [order.city, order.country].filter(Boolean).join(', ')].filter(Boolean) },
              { title: 'FROM', name: 'XFunded Ltd.', email: 'support@xfunded.com', extra: ['www.xfunded.com'] },
            ].map(col => (
              <div key={col.title} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderLeft: '3px solid #FF5C00' }}>
                <div className="text-[10px] font-bold text-primary mb-2">{col.title}</div>
                <div className="text-sm font-bold text-foreground">{col.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{col.email}</div>
                {col.extra.map((e, i) => e && <div key={i} className="text-xs text-muted-foreground">{e}</div>)}
              </div>
            ))}
          </div>

          {/* Line item */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="grid px-5 py-3 text-[10px] font-bold text-white uppercase" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#FF5C00' }}>
              <span>Description</span><span>Account Size</span><span>Model</span><span className="text-right">Amount</span>
            </div>
            <div className="grid px-5 py-4 items-center" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-sm font-semibold text-foreground">{challengeType}</span>
              <span className="text-sm text-foreground">${(order.account_size || 0).toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">{accountModel} / MT5</span>
              <span className="text-sm font-bold text-primary text-right">${subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Totals + Payment */}
          <div className="grid grid-cols-2 gap-4">
            {/* Payment details */}
            <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-[10px] font-bold text-primary mb-3">PAYMENT DETAILS</div>
              {[
                ['Method', payMethodLabel(order.payment_method)],
                ['Gateway', order.payment_gateway || 'manual'],
                ['Status', (order.payment_status || '').toUpperCase()],
                order.transaction_id && ['TxID', order.transaction_id.length > 20 ? order.transaction_id.slice(0, 20) + '…' : order.transaction_id],
                order.coupon_code && ['Coupon', order.coupon_code],
                order.affiliate_code && ['Referred By', order.affiliate_code],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-foreground font-mono">{v}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-[10px] font-bold text-primary mb-3">SUMMARY</div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">${subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span><span className="text-emerald-400">-${discount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Tax / VAT</span><span className="text-foreground">$0.00</span></div>
              <div className="border-t pt-2 mt-2 flex justify-between" style={{ borderColor: 'rgba(255,92,0,0.3)' }}>
                <span className="text-sm font-bold text-foreground">TOTAL</span>
                <span className="text-lg font-black text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* MT5 Account info */}
          {account && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
              <div className="text-[10px] font-bold text-primary mb-3">MT5 TRADING ACCOUNT</div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  ['Login', account.mt_login],
                  ['Server', account.mt_server],
                  ['Phase', (account.phase || 'phase1').replace('phase', 'Phase ')],
                  ['Leverage', account.leverage || '1:100'],
                  ['Status', account.status],
                  ['Account ID', account.account_id],
                ].map(([k, v]) => v && (
                  <div key={k}>
                    <div className="text-muted-foreground text-[10px]">{k}</div>
                    <div className="text-foreground font-mono font-semibold">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms note */}
          <div className="rounded-xl px-5 py-3 text-xs text-muted-foreground" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            This invoice is auto-generated and serves as official proof of purchase. Challenges are non-refundable once the MT5 account is activated. For disputes, contact support@xfunded.com within 48 hours.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Billing component ───────────────────────────────────────────────────
export default function Billing() {
  const [filter, setFilter] = useState('all');
  const [previewOrder, setPreviewOrder] = useState(null);
  const { user: sbUser } = useSupabaseAuth();
  const user = sbUser;

  const { data: orders = [], isLoading } = useOrders();
  const { data: accounts = [] } = useChallengeAccounts();

  const getLinkedAccount = (order) =>
    accounts.find(a => a.account_id === order.account_id || a.account_id === order.order_id) || null;

  const filtered = orders.filter(o => {
    if (filter === 'paid') return o.payment_status === 'paid' || o.payment_status === 'confirmed';
    if (filter === 'pending') return o.payment_status === 'pending' || o.payment_status === 'awaiting_confirmation';
    if (filter === 'failed') return o.payment_status === 'failed' || o.payment_status === 'cancelled';
    return true;
  });

  const isPaid = (s) => s === 'paid' || s === 'confirmed';

  const previewAccount = previewOrder ? getLinkedAccount(previewOrder) : null;

  return (
    <div>
      {/* Invoice Preview Modal */}
      {previewOrder && (
        <InvoicePreviewModal
          order={previewOrder}
          user={user}
          account={previewAccount}
          onClose={() => setPreviewOrder(null)}
          onDownload={() => {
            generateInvoicePDF(previewOrder, user, previewAccount);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Billing & Invoices
        </h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl p-16 text-center" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
          <CreditCard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No orders found.</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Table header */}
          <div className="grid gap-2 px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b"
            style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 100px', borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
            <span>Challenge</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Discount</span>
            <span>Account</span>
            <span>Status</span>
            <span>Invoice</span>
          </div>

          {filtered.map((order) => {
            const paid = isPaid(order.payment_status);
            const isPending = !paid && (order.payment_status === 'pending' || order.payment_status === 'awaiting_confirmation');
            const isFailed = order.payment_status === 'failed' || order.payment_status === 'cancelled';
            const created = order.created_date ? new Date(order.created_date) : null;
            const fmtDate = (d) => d ? d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
            const challengeLabel = order.challenge_type === 'two-step' ? '2-Step Challenge' : order.challenge_type === 'instant' ? 'Instant Funding' : 'Instant Light';
            const accountModel = order.account_type === 'swing' ? 'Swing' : 'Standard';
            const linkedAccount = getLinkedAccount(order);

            return (
              <div key={order.id}
                className="grid gap-2 px-5 py-4 border-b hover:bg-white/[0.02] transition-colors items-center"
                style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 100px', borderColor: 'rgba(255,255,255,0.05)' }}>

                {/* Challenge */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,92,0,0.15)' }}>
                    <span className="text-primary font-bold text-xs">$</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">${(order.account_size || 0).toLocaleString()}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{order.order_id || order.id?.slice(0, 10)}</div>
                  </div>
                </div>

                {/* Date */}
                <div className="text-xs text-muted-foreground font-mono">{fmtDate(created)}</div>

                {/* Amount */}
                <div className="text-sm font-semibold text-foreground">${(order.price || 0).toFixed(2)}</div>

                {/* Discount */}
                <div className="text-sm">
                  {order.discount_amount > 0
                    ? <span className="text-emerald-400 font-mono">-${order.discount_amount.toFixed(2)}</span>
                    : <span className="text-muted-foreground">—</span>
                  }
                  {order.coupon_code && <div className="text-[10px] text-primary font-mono">{order.coupon_code}</div>}
                </div>

                {/* Account */}
                <div className="text-xs text-foreground">
                  <div>{challengeLabel}</div>
                  <div className="text-muted-foreground text-[10px]">
                    {accountModel} / MT5
                    {linkedAccount?.mt_login && <span className="text-primary ml-1">· #{linkedAccount.mt_login}</span>}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit"
                    style={{
                      background: paid ? 'rgba(20,184,166,0.2)' : isPending ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: paid ? '#2dd4bf' : isPending ? '#fbbf24' : '#f87171',
                      border: `1px solid ${paid ? 'rgba(45,212,191,0.3)' : isPending ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'}`,
                    }}>
                    {paid ? <CheckCircle2 className="w-3 h-3" /> : isPending ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {paid ? 'Paid' : isPending ? 'Pending' : isFailed ? 'Failed' : order.payment_status}
                  </span>
                </div>

                {/* Invoice actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewOrder(order)}
                    title="Preview Invoice"
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => generateInvoicePDF(order, user, linkedAccount)}
                    title="Download Invoice PDF"
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    <Download className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}