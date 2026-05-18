import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet, Settings, Shield, Globe, Key, CheckCircle, XCircle, Zap, Smartphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const GATEWAY_ICONS = {
  checkout_com: CreditCard,
  confirmo: Wallet,
  manual_crypto: Globe,
  nowpayments: Zap,
  coinpayments: Smartphone,
};

export default function AdminPaymentControl() {
  const [selectedGateway, setSelectedGateway] = useState(null);
  const qc = useQueryClient();

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ['payment-gateways'],
    queryFn: () => base44.entities.PaymentGateway.list('-created_date', 50),
  });

  const { data: paymentLogs = [] } = useQuery({
    queryKey: ['payment-logs'],
    queryFn: () => base44.entities.PaymentLog.list('-created_date', 100),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PaymentGateway.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-gateways'] }),
  });

  const stats = {
    total: gateways.length,
    active: gateways.filter(g => g.is_active).length,
    checkout_com: gateways.filter(g => g.provider === 'checkout_com').length,
    confirmo: gateways.filter(g => g.provider === 'confirmo').length,
    recent_payments: paymentLogs.filter(l => l.created_date && new Date(l.created_date) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)' }}>
              <Settings className="w-5 h-5 text-primary" />
            </div>
            Payment Gateway Control
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Manage Checkout.com, Confirmo, and crypto payment infrastructure</p>
        </div>
        <a href="/admin/wallets" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)' }}>
          <Settings className="w-4 h-4" /> Configure Gateways
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Total Gateways', value: stats.total, color: '#FF5C00', icon: Settings },
          { label: 'Active', value: stats.active, color: '#10b981', icon: CheckCircle },
          { label: 'Checkout.com', value: stats.checkout_com, color: '#635BFF', icon: CreditCard },
          { label: 'Confirmo', value: stats.confirmo, color: '#F7931A', icon: Wallet },
          { label: 'Payments (24h)', value: stats.recent_payments, color: '#8b5cf6', icon: Zap },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4" style={{ background: `${stat.color}08`, border: `1px solid ${stat.color}20` }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}25` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</div>
              </div>
              <div className="text-[9px] font-mono text-white/25">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Gateway Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {gateways.map((gw, i) => {
          const Icon = GATEWAY_ICONS[gw.provider] || Globe;
          return (
            <motion.div key={gw.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${gw.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.25)' }}>
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{gw.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{gw.provider}</div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ml-2 ${gw.is_active ? 'text-emerald-400' : 'text-muted-foreground'}`}
                    style={{ background: gw.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${gw.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                    {gw.is_active ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                    {gw.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button onClick={() => toggleMutation.mutate({ id: gw.id, is_active: !gw.is_active })}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(var(--muted-foreground))' }}>
                  {gw.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[9px] font-mono text-muted-foreground mb-1">MODE</div>
                  <div className="font-semibold text-foreground">{gw.sandbox_mode ? '🧪 Sandbox' : '🟢 Live'}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-muted-foreground mb-1">WEBHOOK</div>
                  <div className="font-semibold text-foreground truncate">{gw.webhook_url ? '✓ Configured' : '✗ Not set'}</div>
                </div>
              </div>

              {gw.provider === 'checkout_com' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(gw.supported_cards || []).map(card => (
                    <span key={card} className="text-[9px] font-mono px-2 py-1 rounded-md" style={{ background: '#635BFF12', border: '1px solid #635BFF25', color: '#635BFF' }}>
                      {card.toUpperCase().replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}

              {gw.provider === 'confirmo' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(gw.supported_crypto || []).map(crypto => (
                    <span key={crypto} className="text-[9px] font-mono px-2 py-1 rounded-md" style={{ background: '#F7931A12', border: '1px solid #F7931A25', color: '#F7931A' }}>
                      {crypto}
                    </span>
                  ))}
                </div>
              )}

              {gw.api_key && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <Key className="w-3 h-3 text-muted-foreground/50" />
                  <span className="text-[10px] font-mono text-muted-foreground/50">API Key: {gw.api_key.slice(0, 8)}••••••••</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Recent Payment Logs */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <h3 className="text-sm font-bold text-foreground">Recent Payment Events</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 100 webhook events from all gateways</p>
        </div>
        <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.05)' }}>
          {paymentLogs.slice(0, 10).map((log, i) => (
            <div key={log.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${log.status === 'paid' ? 'bg-emerald-400' : log.status === 'failed' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <div>
                  <div className="text-xs font-semibold text-foreground">{log.event_type}</div>
                  <div className="text-[9px] font-mono text-muted-foreground">{log.gateway} • {log.order_id || 'N/A'}</div>
                </div>
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                {log.created_date ? new Date(log.created_date).toLocaleString() : 'Just now'}
              </div>
            </div>
          ))}
          {paymentLogs.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No payment events logged yet</div>
          )}
        </div>
      </div>
    </div>
  );
}