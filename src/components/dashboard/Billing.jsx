import React, { useState } from 'react';
import { FileText, Download, Filter, CreditCard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';

function generateInvoicePDF(order, user) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const invoiceDate = order.created_date ? new Date(order.created_date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString();
  const orderId = order.order_id || order.id || `RF-${Date.now()}`;
  const traderName = order.full_name || user?.full_name || 'Trader';
  const traderEmail = order.email || user?.email || '';

  // Dark background
  doc.setFillColor(10, 11, 18);
  doc.rect(0, 0, 210, 297, 'F');

  // Top orange accent bar
  doc.setFillColor(255, 92, 0);
  doc.rect(0, 0, 210, 40, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('XFUNDED', 15, 17);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Institutional Proprietary Trading Firm', 15, 25);
  doc.text('www.xfunded.com', 15, 32);

  // Invoice label top-right
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 195, 17, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${orderId}`, 195, 25, { align: 'right' });
  doc.text(`Date: ${invoiceDate}`, 195, 32, { align: 'right' });

  // Bill To / From section
  doc.setFillColor(18, 19, 28);
  doc.rect(0, 42, 210, 42, 'F');

  doc.setTextColor(255, 92, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 15, 54);

  doc.setTextColor(200, 200, 210);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(traderName, 15, 62);
  doc.setFontSize(8);
  doc.text(traderEmail, 15, 69);
  if (order.country) doc.text(order.country, 15, 76);

  doc.setTextColor(255, 92, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', 120, 54);

  doc.setTextColor(200, 200, 210);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('XFunded Ltd.', 120, 62);
  doc.setFontSize(8);
  doc.text('support@xfunded.com', 120, 69);
  doc.text('xfunded.com', 120, 76);

  // Table header
  doc.setFillColor(255, 92, 0);
  doc.rect(0, 90, 210, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CHALLENGE', 15, 97);
  doc.text('ACCOUNT SIZE', 85, 97);
  doc.text('TYPE', 130, 97);
  doc.text('AMOUNT', 192, 97, { align: 'right' });

  // Table row
  const challengeType = order.challenge_type === 'two-step' ? 'Two-Step Challenge' : order.challenge_type === 'instant' ? 'Instant Funding' : 'Instant Light';
  const accountModel = order.account_type === 'swing' ? 'Swing' : 'Standard';

  doc.setFillColor(16, 17, 25);
  doc.rect(0, 102, 210, 14, 'F');
  doc.setTextColor(220, 220, 230);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(challengeType, 15, 111);
  doc.text(`$${(order.account_size || 0).toLocaleString()}`, 85, 111);
  doc.text(`${accountModel} / MT5`, 130, 111);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 92, 0);
  doc.text(`$${(order.price || 0).toFixed(2)}`, 192, 111, { align: 'right' });

  // Divider
  doc.setDrawColor(255, 92, 0);
  doc.setLineWidth(0.3);
  doc.line(15, 122, 195, 122);

  // Payment info + Summary side by side
  doc.setFillColor(18, 19, 28);
  doc.rect(0, 126, 100, 60, 'F');
  doc.setFillColor(14, 15, 22);
  doc.rect(110, 126, 100, 60, 'F');

  doc.setTextColor(255, 92, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', 15, 137);

  const payMethod = order.payment_method === 'usdt_trc20' ? 'USDT (TRC20)'
    : order.payment_method === 'bitcoin' ? 'Bitcoin (BTC)'
    : order.payment_method === 'checkout_com_card' ? 'Card'
    : order.payment_method || 'Crypto';

  doc.setTextColor(170, 170, 180);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Method: ${payMethod}`, 15, 147);
  doc.text(`Status: ${(order.payment_status || 'paid').toUpperCase()}`, 15, 155);
  if (order.transaction_id) {
    const txid = order.transaction_id.length > 22 ? order.transaction_id.slice(0, 22) + '…' : order.transaction_id;
    doc.text(`TxID: ${txid}`, 15, 163);
  }
  doc.text(`Platform: MT5`, 15, 171);

  doc.setTextColor(255, 92, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', 115, 137);

  const discount = order.discount_amount || 0;
  const subtotal = order.price || 0;
  doc.setTextColor(170, 170, 180);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 115, 147);
  doc.text(`$${subtotal.toFixed(2)}`, 207, 147, { align: 'right' });
  doc.text('Discount:', 115, 155);
  doc.text(discount > 0 ? `-$${discount.toFixed(2)}` : '$0.00', 207, 155, { align: 'right' });
  doc.text('Tax:', 115, 163);
  doc.text('$0.00', 207, 163, { align: 'right' });

  doc.setDrawColor(255, 92, 0);
  doc.line(115, 167, 207, 167);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 92, 0);
  doc.text('TOTAL:', 115, 176);
  doc.text(`$${subtotal.toFixed(2)}`, 207, 176, { align: 'right' });

  // Account credentials block
  const account_id = order.account_id;
  if (account_id) {
    doc.setFillColor(18, 19, 28);
    doc.rect(0, 195, 210, 28, 'F');
    doc.setTextColor(255, 92, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('LINKED ACCOUNT', 15, 206);
    doc.setTextColor(170, 170, 180);
    doc.setFont('helvetica', 'normal');
    doc.text(`Account ID: ${account_id}`, 15, 214);
  }

  // Footer
  doc.setFillColor(255, 92, 0);
  doc.rect(0, 275, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('XFunded — Institutional Proprietary Trading Firm', 105, 282, { align: 'center' });
  doc.text('Challenges are non-refundable once the MT5 account is activated.', 105, 288, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()} | Invoice #${orderId}`, 105, 294, { align: 'center' });

  doc.save(`XFunded-Invoice-${orderId}.pdf`);
}

export default function Billing() {
  const [filter, setFilter] = useState('all');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ email: user?.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const filtered = orders.filter(o => {
    if (filter === 'paid') return o.payment_status === 'paid' || o.payment_status === 'confirmed';
    if (filter === 'pending') return o.payment_status === 'pending' || o.payment_status === 'awaiting_confirmation';
    if (filter === 'failed') return o.payment_status === 'failed' || o.payment_status === 'cancelled';
    return true;
  });

  const isPaid = (s) => s === 'paid' || s === 'confirmed';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Billing
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
            style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 80px', borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
            <span>Challenge</span>
            <span>Dates</span>
            <span>Amount to pay</span>
            <span>Order</span>
            <span>Account</span>
            <span>Status</span>
            <span>Invoice</span>
          </div>

          {filtered.map((order, i) => {
            const paid = isPaid(order.payment_status);
            const isPending = !paid && (order.payment_status === 'pending' || order.payment_status === 'awaiting_confirmation');
            const isFailed = order.payment_status === 'failed' || order.payment_status === 'cancelled';
            const created = order.created_date ? new Date(order.created_date) : null;
            const fmtDate = (d) => d ? d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
            const challengeLabel = order.challenge_type === 'two-step' ? '2-Step Challenge' : order.challenge_type === 'instant' ? 'Instant Funding' : 'Instant Light';
            const accountModel = order.account_type === 'swing' ? 'Swing' : 'Standard';

            return (
              <div key={order.id}
                className="grid gap-2 px-5 py-4 border-b hover:bg-white/[0.02] transition-colors items-center"
                style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 80px', borderColor: 'rgba(255,255,255,0.05)' }}>

                {/* Challenge */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,92,0,0.15)' }}>
                    <span className="text-primary font-bold text-xs">$</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">${(order.account_size || 0).toLocaleString()}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{order.order_id || order.id?.slice(0, 10)}</div>
                  </div>
                </div>

                {/* Dates */}
                <div className="text-xs text-muted-foreground font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] opacity-60">📅</span>
                    {fmtDate(created)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] opacity-60">🔒</span>
                    {fmtDate(created)}
                  </div>
                </div>

                {/* Amount to pay */}
                <div className="text-sm font-semibold text-foreground">
                  ${(order.price || 0).toFixed(2)}
                </div>

                {/* Order amount */}
                <div className="text-sm text-foreground font-mono">
                  ${(order.price || 0).toFixed(2)}
                </div>

                {/* Account */}
                <div className="text-xs text-foreground">
                  <div>{challengeLabel}</div>
                  <div className="text-muted-foreground text-[10px]">{accountModel} / MT5</div>
                </div>

                {/* Status */}
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: paid ? 'rgba(20,184,166,0.2)' : isPending ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: paid ? '#2dd4bf' : isPending ? '#fbbf24' : '#f87171',
                      border: `1px solid ${paid ? 'rgba(45,212,191,0.3)' : isPending ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'}`,
                    }}>
                    {paid ? 'Paid' : isPending ? 'Pending' : isFailed ? 'Failed' : order.payment_status}
                  </span>
                </div>

                {/* Invoice download */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateInvoicePDF(order, user)}
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