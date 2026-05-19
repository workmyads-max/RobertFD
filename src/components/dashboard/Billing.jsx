import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, CheckCircle, Clock, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';

function generateInvoicePDF(order, user) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const invoiceDate = order.created_date ? new Date(order.created_date).toLocaleDateString() : new Date().toLocaleDateString();
  const orderId = order.order_id || `RF-${Date.now()}`;

  // Background
  doc.setFillColor(6, 6, 10);
  doc.rect(0, 0, 210, 297, 'F');

  // Orange header bar
  doc.setFillColor(255, 92, 0);
  doc.rect(0, 0, 210, 38, 'F');

  // Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ROBERT FUNDS', 15, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Institutional Proprietary Trading Firm', 15, 26);
  doc.text('OFFICIAL INVOICE', 15, 33);

  // Invoice number top-right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice #${orderId}`, 195, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date: ${invoiceDate}`, 195, 26, { align: 'right' });

  // BILL TO section
  doc.setTextColor(255, 92, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 15, 52);

  doc.setTextColor(220, 220, 220);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(order.full_name || user?.full_name || 'Trader', 15, 60);
  doc.setFontSize(8);
  doc.text(order.email || user?.email || '', 15, 66);
  if (order.country) doc.text(order.country, 15, 72);
  if (order.city) doc.text(order.city, 15, 78);

  // FROM section
  doc.setTextColor(255, 92, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM:', 130, 52);

  doc.setTextColor(220, 220, 220);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Robert Funds Ltd.', 130, 60);
  doc.setFontSize(8);
  doc.text('Proprietary Trading Division', 130, 66);
  doc.text('support@robertfunds.com', 130, 72);
  doc.text('robertfunds.com', 130, 78);

  // Separator line
  doc.setDrawColor(255, 92, 0);
  doc.setLineWidth(0.5);
  doc.line(15, 88, 195, 88);

  // Table header
  doc.setFillColor(20, 14, 8);
  doc.rect(15, 92, 180, 10, 'F');
  doc.setTextColor(255, 92, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', 18, 99);
  doc.text('TYPE', 100, 99);
  doc.text('SIZE', 140, 99);
  doc.text('AMOUNT', 185, 99, { align: 'right' });

  // Line item
  const challengeType = order.challenge_type === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding';
  const accountModel = order.account_type === 'swing' ? 'Swing Account' : 'Standard Account';
  doc.setFillColor(12, 12, 16);
  doc.rect(15, 104, 180, 14, 'F');
  doc.setTextColor(220, 220, 220);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${challengeType} — ${accountModel}`, 18, 113);
  doc.text(order.leverage || '1:100', 100, 113);
  doc.text(`$${(order.account_size || 0).toLocaleString()}`, 140, 113);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 92, 0);
  doc.text(`$${order.price || 0}`, 185, 113, { align: 'right' });

  // Summary box
  doc.setFillColor(20, 14, 8);
  doc.rect(120, 130, 75, 52, 'F');
  doc.setDrawColor(255, 92, 0);
  doc.setLineWidth(0.3);
  doc.rect(120, 130, 75, 52);

  const summaryItems = [
    { label: 'Subtotal', val: `$${order.price || 0}` },
    { label: 'Discount', val: '$0.00' },
    { label: 'Tax', val: '$0.00' },
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  summaryItems.forEach((item, i) => {
    doc.text(item.label, 125, 140 + i * 8);
    doc.text(item.val, 192, 140 + i * 8, { align: 'right' });
  });
  doc.setDrawColor(255, 92, 0);
  doc.line(125, 165, 190, 165);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 92, 0);
  doc.text('TOTAL DUE', 125, 175);
  doc.text(`$${order.price || 0}`, 192, 175, { align: 'right' });

  // Payment info
  doc.setFillColor(12, 12, 16);
  doc.rect(15, 130, 95, 52, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 92, 0);
  doc.text('PAYMENT DETAILS', 18, 140);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  const payMethod = order.payment_method === 'usdt_trc20' ? 'USDT (TRC20)' : order.payment_method === 'bitcoin' ? 'Bitcoin (BTC)' : 'Bank Wire';
  const payStatus = order.payment_status || 'confirmed';
  doc.text(`Method: ${payMethod}`, 18, 150);
  doc.text(`Status: ${payStatus.toUpperCase()}`, 18, 158);
  if (order.transaction_id) doc.text(`TxID: ${order.transaction_id.slice(0, 20)}...`, 18, 166);
  doc.text(`Platform: ${order.platform || 'XTrading'}`, 18, 174);

  // Footer
  doc.setFillColor(255, 92, 0);
  doc.rect(0, 275, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Robert Funds — Institutional Proprietary Trading Firm', 105, 282, { align: 'center' });
  doc.text('This is an official invoice. Keep for your records. Challenges are non-refundable once activated.', 105, 288, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()} | Order: ${orderId}`, 105, 294, { align: 'center' });

  doc.save(`RF-Invoice-${orderId}.pdf`);
}

export default function Billing() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const displayOrders = orders;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-primary" /> Billing
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Your invoices and payment history</p>
      </div>

      {displayOrders.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
          <CreditCard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No orders yet. Purchase a challenge to see your billing history.</p>
        </div>
      )}
      {displayOrders.length > 0 && (
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-6 gap-2 px-5 py-3 text-[10px] font-mono text-muted-foreground uppercase border-b border-white/5">
          <span className="col-span-2">Order ID</span>
          <span>Type</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Invoice</span>
        </div>
        {displayOrders.map((order, i) => (
          <motion.div key={order.id || order.order_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="grid grid-cols-6 gap-2 px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] items-center transition-colors">
            <span className="col-span-2 text-xs font-mono font-bold text-foreground">{order.order_id}</span>
            <span className="text-xs text-muted-foreground capitalize">{order.challenge_type === 'two-step' ? 'Two-Step' : 'Instant'} ${(order.account_size / 1000)}K</span>
            <span className="text-xs font-bold text-foreground">${order.price}</span>
            <span className="flex items-center gap-1 text-[10px] font-mono">
              {order.payment_status === 'confirmed' || order.payment_status === 'paid'
                ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                : order.payment_status === 'failed' || order.payment_status === 'cancelled'
                ? <XCircle className="w-3 h-3 text-red-400" />
                : <Clock className="w-3 h-3 text-yellow-400" />}
              <span className={`capitalize ${order.payment_status === 'confirmed' || order.payment_status === 'paid' ? 'text-emerald-400' : order.payment_status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                {order.payment_status}
              </span>
            </span>
            <button onClick={() => generateInvoicePDF(order, null)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
}