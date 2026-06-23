import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Key, Server, CheckCircle, AlertTriangle, BookOpen, Shield, Zap, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdminMT5Configuration() {
  const [showInstructions, setShowInstructions] = useState(false);

  const { data: mtAccounts = [] } = useQuery({
    queryKey: ['mt5-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.filter({ platform: 'mt5' }),
    refetchInterval: 30000,
  });

  const { data: pendingMT5Orders = [] } = useQuery({
    queryKey: ['pending-mt5-orders'],
    queryFn: () => base44.entities.Order.filter({ platform: 'mt5', payment_status: 'confirmed' }),
  });

  const mt5Stats = {
    total: mtAccounts.length,
    active: mtAccounts.filter(a => a.status === 'active').length,
    pending: mtAccounts.filter(a => a.status === 'pending').length,
    failed: mtAccounts.filter(a => a.status === 'failed' || (a.login_credentials || '').includes('PROVISIONING_FAILED')).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.25)' }}>
              <Server className="w-5 h-5 text-primary" />
            </div>
            MT5 Platform Configuration
          </h1>
          <p className="text-sm text-white/30 font-mono mt-1">Configure MetaTrader 5 API integration and monitor provisioning</p>
        </div>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
        >
          <BookOpen className="w-4 h-4 text-violet-400" />
          {showInstructions ? 'Hide Guide' : 'Setup Guide'}
        </button>
      </div>

      {/* Setup Instructions Modal */}
      {showInstructions && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-black text-white">MT5 API Setup Instructions</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-violet-400">Step 1: Get MT5 API Credentials</h3>
              <ol className="text-xs text-white/60 space-y-2 list-decimal list-inside">
                <li>Contact your MT5 bridge provider (e.g., PluginFactory, Soft-Finix, MetaAPI)</li>
                <li>Request API endpoint URL and API key</li>
                <li>Get your MT5 server name for client connections</li>
              </ol>

              <h3 className="text-sm font-bold text-violet-400 mt-4">Step 2: Configure Secrets</h3>
              <div className="rounded-xl p-4 font-mono text-xs" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="text-violet-400 mb-2">// Required secrets (set in Dashboard → Settings → Secrets)</div>
                <div className="text-emerald-400">MT5_API_BASE_URL</div>
                <div className="text-white/40 ml-2">https://your-mt5-api.com/api</div>
                <div className="text-emerald-400 mt-2">MT5_API_KEY</div>
                <div className="text-white/40 ml-2">your-secret-api-key</div>
                <div className="text-emerald-400 mt-2">MT5_SERVER_NAME</div>
                <div className="text-white/40 ml-2">mt5-live.yourbroker.com</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-violet-400">Step 3: API Requirements</h3>
              <div className="space-y-2 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>REST API endpoint for account management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Support for: create account, get balance, get positions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>API key or Bearer token authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ensure CORS is enabled for API calls</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-violet-400 mt-4">How It Works</h3>
              <div className="text-xs text-white/60 space-y-1">
                <div>1. Admin approves order → Account created with status "pending"</div>
                <div>2. System auto-calls <code className="bg-violet-400/20 px-1 rounded">provisionMatchTraderAccount</code></div>
                <div>3. MT5 API creates real trading account</div>
                <div>4. Credentials stored securely in database</div>
                <div>5. User receives email with login details</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Configuration Status */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-white/30 uppercase">Pending Provisioning</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{mt5Stats.pending}</div>
          <div className="text-[10px] font-mono text-white/40 mt-1">Awaiting MT5 API call</div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-white/30 uppercase">Active MT5 Accounts</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{mt5Stats.active}</div>
          <div className="text-[10px] font-mono text-white/40 mt-1">Successfully provisioned</div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-white/30 uppercase">Failed Provisioning</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-black text-white">{mt5Stats.failed}</div>
          <div className="text-[10px] font-mono text-white/40 mt-1">API errors or timeouts</div>
        </div>
      </div>

      {/* Pending Orders Requiring MT5 Provisioning */}
      {pendingMT5Orders.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ background: 'rgba(255,92,0,0.05)' }}>
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono text-white/30 uppercase">Pending MT5 Orders Requiring Provisioning</span>
            </div>
            <span className="text-xs font-bold text-amber-400">{pendingMT5Orders.length} orders</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {pendingMT5Orders.slice(0, 10).map(order => (
              <div key={order.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02]">
                <div>
                  <div className="text-xs font-mono font-bold text-white">{order.order_id || `ORD-${order.id?.slice(0,8)}`}</div>
                  <div className="text-[10px] text-white/30">{order.email} • ${(order.account_size||0).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-amber-400">⏳ Awaiting MT5 API</span>
                  <button
                    onClick={() => base44.functions.invoke('provisionMatchTraderAccount', {
                      order_id: order.order_id,
                      account_id: order.account_id,
                      user_email: order.email,
                      challenge_type: order.challenge_type,
                      account_type: order.account_type,
                      account_size: order.account_size,
                      leverage: order.leverage,
                      platform: 'mt5',
                    })}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}
                  >
                    Provision Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secrets Configuration Check */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-black text-white">Required API Secrets</h3>
          <span className="ml-auto text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20">
            ⚠️ Must be set in Base44 Dashboard → Settings → Secrets
          </span>
        </div>

        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[10px] font-mono text-violet-400 mb-3 uppercase tracking-widest">Step: Go to Base44 Dashboard → Settings → Environment Variables → Add these:</div>
          <div className="space-y-3">
            {[
              { name: 'MT5_API_BASE_URL', desc: 'Your broker MT5 REST API URL', example: 'https://api.yourbroker.com' },
              { name: 'MT5_API_KEY', desc: 'Your MT5 API key', example: 'sk-xxxxxxxxxxxxxxxx' },
              { name: 'MT5_SERVER_NAME', desc: 'MT5 server name shown to traders', example: 'YourBroker-Live' },
            ].map(s => (
              <div key={s.name} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold text-white">{s.name}</div>
                  <div className="text-[10px] text-white/40">{s.desc}</div>
                  <div className="text-[10px] font-mono text-white/25">e.g. {s.example}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-3 flex items-start gap-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-300/80">
            Once these 3 secrets are set, <strong>everything works automatically</strong> — account provisioning, balance sync every 5 min, DD breach detection, phase progression, and funded account creation all use these credentials.
          </p>
        </div>
      </div>
    </div>
  );
}