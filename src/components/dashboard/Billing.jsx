import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Billing() {
  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 20),
  });

  const DEMO_ORDERS = [
    { id: 'demo1', order_id: 'RF-A1B2C3', challenge_type: 'instant', account_size: 50000, price: 1350, payment_status: 'confirmed', payment_method: 'usdt_trc20', created_date: '2026-05-08' },
    { id: 'demo2', order_id: 'RF-D4E5F6', challenge_type: 'two-step', account_size: 100000, price: 517, payment_status: 'confirmed', payment_method: 'bitcoin', created_date: '2026-04-20' },
  ];

  const displayOrders = orders.length > 0 ? orders : DEMO_ORDERS;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-primary" /> Billing
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Your invoices and payment history</p>
      </div>

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
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 capitalize">{order.payment_status}</span>
            </span>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}