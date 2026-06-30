import React, { useState } from 'react';
import { FileText, Download, Filter, CreditCard, Eye, X, CheckCircle2, Clock, XCircle, TrendingUp, DollarSign, Receipt } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';

const ACCENT = '#CCFF00';

function payMethodLabel(m) {
  const map = {
    usdt_trc20: 'USDT (TRC20)', bitcoin: 'Bitcoin (BTC)',
    checkout_com_card: 'Credit / Debit Card', checkout_com_apple_pay: 'Apple Pay',
    checkout_com_google_pay: 'Google Pay', confirmo_crypto: 'Confirmo Crypto',
    nowpayments: 'NOWPayments Crypto', coinpayments: 'CoinPayments Crypto',
  };
  return map[m] || m || 'Crypto';
}

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

  doc.setFillColor(8, 9, 16); doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(255, 92, 0); doc.rect(0, 0, 210, 44, 'F');
  doc.setFillColor(255, 110, 20); doc.setOpacity(0.3);
  for (let x = 0; x < 210; x += 14) doc.rect(x, 0, 7, 44, 'F');
  doc.setOpacity(1);

  doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.setFont('helvetica', 'bold');
  doc.text('XFUNDED', 15, 20);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('Institutional Proprietary Trading Firm', 15, 28);
  doc.text('support@xfundedtrader.com  |  www.xfundedtrader.com', 15, 35);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 195, 18, { align: 'right' });
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
  doc.text(`# ${orderId}`, 195, 27, { align: 'right' });
  doc.text(`Issued: ${invoiceDate}`, 195, 35, { align: 'right' });

  const isPaid = order.payment_status === 'paid' || order.payment_status === 'confirmed';
  const badgeColor = isPaid ? [16, 185, 129] : [245, 158, 11];
  doc.setFillColor(...badgeColor); doc.roundedRect(145, 48, 50, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text(isPaid ? '✓  PAID' : '⏳  PENDING', 170, 55, { align: 'center' });

  doc.setFillColor(16, 17, 26); doc.roundedRect(10, 64, 88, 46, 3, 3, 'F');
  doc.setDrawColor(255, 92, 0); doc.setLineWidth(0.4); doc.line(10, 64, 10, 110);
  doc.setTextColor(255, 92, 0); doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.text('BILL TO', 16, 73);
  doc.setTextColor(230, 230, 240); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text(traderName, 16, 82);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(170, 170, 185); doc.text(traderEmail, 16, 89);

  doc.setFillColor(16, 17, 26); doc.roundedRect(112, 64, 88, 46, 3, 3, 'F');
  doc.setDrawColor(255, 92, 0); doc.line(112, 64, 112, 110);
  doc.setTextColor(255, 92, 0); doc.setFontSize(7); doc.text('FROM', 118, 73);
  doc.setTextColor(230, 230, 240); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('XFunded Ltd.', 118, 82);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(170, 170, 185); doc.text('support@xfundedtrader.com', 118, 89);

  doc.setFillColor(255, 92, 0); doc.rect(10, 118, 190, 9, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', 15, 124.5); doc.text('ACCOUNT SIZE', 90, 124.5); doc.text('MODEL', 135, 124.5); doc.text('AMOUNT', 198, 124.5, { align: 'right' });

  doc.setFillColor(14, 15, 23); doc.rect(10, 127, 190, 13, 'F');
  doc.setTextColor(220, 220, 235); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(challengeType, 15, 135.5); doc.text(`$${(order.account_size || 0).toLocaleString()}`, 90, 135.5);
  doc.text(`${accountModel} / MT5`, 135, 135.5);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 92, 0); doc.text(`$${subtotal.toFixed(2)}`, 198, 135.5, { align: 'right' });

  const totalsY = 148;
  doc.setFillColor(14, 15, 23); doc.rect(110, totalsY, 90, 50, 'F');
  const tRow = (label, value, y, bold, color) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 165); doc.text(label, 115, y);
    doc.setTextColor(...(color || [210, 210, 225])); doc.text(value, 198, y, { align: 'right' });
  };
  tRow('Subtotal:', `$${subtotal.toFixed(2)}`, totalsY + 12);
  if (discount > 0) { tRow('Discount:', `-$${discount.toFixed(2)}`, totalsY + 22); }
  tRow('Tax / VAT:', '$0.00', totalsY + 32);
  doc.setDrawColor(255, 92, 0); doc.line(115, totalsY + 37, 198, totalsY + 37);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 92, 0);
  doc.text('TOTAL:', 115, totalsY + 46); doc.text(`$${total.toFixed(2)}`, 198, totalsY + 46, { align: 'right' });

  doc.setFillColor(14, 15, 23); doc.rect(10, totalsY, 88, 50, 'F');
  doc.setTextColor(255, 92, 0); doc.setFontSize(7.5); doc.text('PAYMENT DETAILS', 15, totalsY + 12);

  const noteY = 252;
  doc.setFillColor(12, 13, 20); doc.rect(10, noteY, 190, 16, 'F');
  doc.setTextColor(100, 100, 120); doc.setFontSize(7);
  doc.text('This invoice is auto-generated. Challenges are non-refundable once the MT5 account is activated.', 15, noteY + 7);

  doc.setFillColor(255, 92, 0); doc.rect(0, 272, 210, 25, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('XFUNDED - Institutional Proprietary Trading', 105, 280, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text(`Invoice # ${orderId}`, 105, 287, { align: 'center' });
  doc.text('www.xfundedtrader.com  |  support@xfundedtrader.com', 105, 293, { align: 'center' });

  doc.save(`XFunded-Invoice-${orderId}.pdf`);
}

function InvoicePreviewModal({ order, user, account, onClose, onDownload }) {
  if (!order) return null;
  const orderId = order.order_id || order.id || '-';
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
        style={{ background: '#080910', border: '1px solid rgba(255,92,0,0.3)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-white">Invoice Preview</span>
            <span className="text-xs font-mono text-white/30">#{orderId}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onDownload} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-black transition-all hover:opacity-90" style={{ background: ACCENT }}>
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/30"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="rounded-xl px-6 py-5 flex items-start justify-between" style={{ background: '#FF5C00' }}>
            <div>
              <div className="text-white font-black text-xl tracking-tight">XFUNDED</div>
              <div className="text-white/80 text-xs mt-0.5">Institutional Proprietary Trading Firm</div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-sm">INVOICE</div>
              <div className="text-white/80 text-xs mt-0.5">#{orderId}</div>
              <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold inline-block"
                style={{ background: isPaid ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)', color: isPaid ? '#6ee7b7' : '#fde68a', border: `1px solid ${isPaid ? '#10b981' : '#f59e0b'}50` }}>
                {isPaid ? '✓ PAID' : '⏳ PENDING'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'BILL TO', name: order.full_name || user?.full_name || 'Trader', email: order.email || user?.email },
              { title: 'FROM', name: 'XFunded Ltd.', email: 'support@xfundedtrader.com' },
            ].map(col => (
              <div key={col.title} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderLeft: '3px solid #FF5C00' }}>
                <div className="text-[10px] font-bold text-primary mb-2">{col.title}</div>
                <div className="text-sm font-bold text-white">{col.name}</div>
                <div className="text-xs text-white/30 mt-0.5">{col.email}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xs text-white/40">TOTAL</div>
            <div className="text-xl font-black" style={{ color: ACCENT }}>${total.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3D Icons ────────────────────────────────────────────────────────────────
function VaultIcon({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="8" y="20" width="48" height="36" rx="6" fill={ACCENT} opacity="0.85" />
      <rect x="8" y="20" width="48" height="36" rx="6" fill="none" stroke="#AADD00" strokeWidth="1.5" />
      <circle cx="32" cy="38" r="10" fill="#1a1a1a" stroke={ACCENT} strokeWidth="2" />
      <circle cx="32" cy="38" r="3" fill={ACCENT} />
    </svg>
  );
}
function ReceiptIcon({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="14" y="6" width="36" height="52" rx="4" fill="#60a5fa" opacity="0.85" stroke="#93c5fd" strokeWidth="1.5" />
      <line x1="22" y1="18" x2="42" y2="18" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="22" y1="26" x2="38" y2="26" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="22" y1="34" x2="42" y2="34" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="22" y1="42" x2="34" y2="42" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function PerfCard({ label, value, sub, IconComponent, highlight, accentColor }) {
  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{
        background: highlight ? (accentColor || ACCENT) : '#1a1a1a',
        border: highlight ? 'none' : '1px solid rgba(255,255,255,0.06)',
        padding: '20px', minHeight: '140px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
      <div>
        <div className="text-xs font-semibold mb-1" style={{ color: highlight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)' }}>{label}</div>
        <div className="text-3xl font-black" style={{ color: highlight ? '#000' : '#fff' }}>{value}</div>
        {sub && <div className="text-xs mt-1" style={{ color: highlight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.25)' }}>{sub}</div>}
      </div>
      {IconComponent && <div className="absolute bottom-3 right-3 opacity-80"><IconComponent size={52} /></div>}
    </div>
  );
}

export default function Billing() {
  const [filter, setFilter] = useState('all');
  const [previewOrder, setPreviewOrder] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ email: user?.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['billing-accounts', user?.email],
    queryFn: () => base44.entities.ChallengeAccount.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const getLinkedAccount = (order) =>
    accounts.find(a => a.account_id === order.account_id || a.account_id === order.order_id) || null;

  const filtered = orders.filter(o => {
    if (filter === 'paid') return o.payment_status === 'paid' || o.payment_status === 'confirmed';
    if (filter === 'pending') return o.payment_status === 'pending' || o.payment_status === 'awaiting_confirmation';
    if (filter === 'failed') return o.payment_status === 'failed' || o.payment_status === 'cancelled';
    return true;
  });

  const isPaid = (s) => s === 'paid' || s === 'confirmed';
  const totalSpent = orders.filter(o => isPaid(o.payment_status)).reduce((s, o) => s + (o.price || 0), 0);
  const totalSaved = orders.filter(o => isPaid(o.payment_status)).reduce((s, o) => s + (o.discount_amount || 0), 0);
  const activeChallenges = orders.filter(o => !isPaid(o.payment_status) && o.payment_status !== 'failed' && o.payment_status !== 'cancelled').length;

  const previewAccount = previewOrder ? getLinkedAccount(previewOrder) : null;

  return (
    <div>
      {previewOrder && (
        <InvoicePreviewModal order={previewOrder} user={user} account={previewAccount}
          onClose={() => setPreviewOrder(null)}
          onDownload={() => generateInvoicePDF(previewOrder, user, previewAccount)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Billing & Invoices</h1>
          <p className="text-xs text-white/30">Your order history and payment records</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/20" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <option value="all" className="bg-[#121212]">All</option>
            <option value="paid" className="bg-[#121212]">Paid</option>
            <option value="pending" className="bg-[#121212]">Pending</option>
            <option value="failed" className="bg-[#121212]">Failed</option>
          </select>
        </div>
      </div>

      {/* Stats overview */}
      <h2 className="text-sm font-bold text-white mb-4">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <PerfCard label="Total Spent" value={`$${totalSpent.toFixed(2)}`} sub="Lifetime purchases" IconComponent={VaultIcon} highlight />
        <PerfCard label="Total Saved" value={`$${totalSaved.toFixed(2)}`} sub="Discounts & coupons" IconComponent={ReceiptIcon} />
        <PerfCard label="Orders" value={orders.length} sub={`${activeChallenges} pending`} IconComponent={null} />
      </div>

      {/* Orders list */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-2xl p-16 text-center" style={{ background: '#121212', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <CreditCard className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No orders found.</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="grid gap-2 px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wide border-b border-white/[0.07]"
            style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 100px', background: 'rgba(255,255,255,0.03)' }}>
            <span>Challenge</span><span>Date</span><span>Amount</span><span>Discount</span><span>Account</span><span>Status</span><span>Invoice</span>
          </div>
          {filtered.map((order) => {
            const paid = isPaid(order.payment_status);
            const isPending = !paid && (order.payment_status === 'pending' || order.payment_status === 'awaiting_confirmation');
            const isFailed = order.payment_status === 'failed' || order.payment_status === 'cancelled';
            const created = order.created_date ? new Date(order.created_date) : null;
            const fmtDate = (d) => d ? d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
            const challengeLabel = order.challenge_type === 'two-step' ? '2-Step Challenge' : order.challenge_type === 'instant' ? 'Instant Funding' : 'Instant Light';
            const linkedAccount = getLinkedAccount(order);

            return (
              <div key={order.id}
                className="grid gap-2 px-5 py-4 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors items-center"
                style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 100px' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,92,0,0.15)' }}>
                    <span className="text-primary font-bold text-xs">$</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">${(order.account_size || 0).toLocaleString()}</div>
                    <div className="text-[10px] font-mono text-white/30">{order.order_id || order.id?.slice(0, 10)}</div>
                  </div>
                </div>
                <div className="text-xs text-white/30 font-mono">{fmtDate(created)}</div>
                <div className="text-sm font-semibold text-white">${(order.price || 0).toFixed(2)}</div>
                <div className="text-sm">
                  {order.discount_amount > 0
                    ? <span className="text-emerald-400 font-mono">-${order.discount_amount.toFixed(2)}</span>
                    : <span className="text-white/20">-</span>}
                  {order.coupon_code && <div className="text-[10px] text-primary font-mono">{order.coupon_code}</div>}
                </div>
                <div className="text-xs text-white">
                  <div>{challengeLabel}</div>
                  <div className="text-white/30 text-[10px]">{linkedAccount?.mt_login && <span className="text-primary">#{linkedAccount.mt_login}</span>}</div>
                </div>
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
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPreviewOrder(order)} title="Preview"
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    <Eye className="w-3.5 h-3.5 text-white/30" />
                  </button>
                  <button onClick={() => generateInvoicePDF(order, user, linkedAccount)} title="Download"
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    <Download className="w-3.5 h-3.5 text-white/30 hover:text-primary" />
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