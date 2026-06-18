import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, AlertTriangle, CheckCircle2, Clock, Activity, 
  TrendingDown, Calendar, Zap, BarChart3, RefreshCw, Play,
  XCircle, AlertOctagon, TrendingUp, Power, PowerOff
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function ViolationCard({ violation, onDismiss }) {
  const severityColors = {
    high: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: 'text-red-400' },
    medium: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: 'text-amber-400' },
    low: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', text: 'text-blue-400' }
  };

  const config = severityColors[violation.severity] || severityColors.low;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 space-y-3"
      style={{ background: config.bg, border: `1px solid ${config.border}` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <AlertOctagon className={`w-5 h-5 ${config.text}`} />
          <div>
            <div className="text-sm font-bold text-white capitalize">
              {violation.flag_type.replace(/_/g, ' ')}
            </div>
            <div className="text-xs text-white/40 font-mono mt-0.5">
              {violation.account_id} • {violation.user_email}
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${config.text}`}
          style={{ background: `${config.border}30` }}>
          {violation.severity}
        </span>
      </div>

      <div className="text-xs text-white/60">{violation.description}</div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="text-[10px] font-mono text-white/30">
          {new Date(violation.triggered_at).toLocaleString()}
        </div>
        <button
          onClick={() => onDismiss(violation.id)}
          className="text-[10px] font-semibold text-white/50 hover:text-white transition-colors"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

export default function AdminRiskDetection() {
  const [hftRunning, setHftRunning] = useState(false);
  const [newsRunning, setNewsRunning] = useState(false);
  const [weekendResult, setWeekendResult] = useState(null);

  const { data: riskFlags = [], refetch } = useQuery({
    queryKey: ['risk-flags'],
    queryFn: () => base44.entities.RiskFlag.filter({ status: 'active' }),
    refetchInterval: 30000,
  });

  const hftViolations = riskFlags.filter(f => f.flag_type === 'hft_detection');
  const newsViolations = riskFlags.filter(f => f.flag_type === 'news_trading_violation');
  const weekendViolations = riskFlags.filter(f => f.flag_type === 'weekend_holding_violation');

  const runHFTDetection = useMutation({
    mutationFn: (params) => base44.functions.invoke('detectHFTAndArbitrage', params || {}),
    onMutate: () => setHftRunning(true),
    onSuccess: () => {
      refetch();
      setHftRunning(false);
    },
    onError: () => setHftRunning(false),
  });

  const runNewsDetection = useMutation({
    mutationFn: (params) => base44.functions.invoke('detectNewsTrading', params || {}),
    onMutate: () => setNewsRunning(true),
    onSuccess: () => {
      refetch();
      setNewsRunning(false);
    },
    onError: () => setNewsRunning(false),
  });

  const runWeekendClose = useMutation({
    mutationFn: () => base44.functions.invoke('autoCloseWeekendPositions', {}),
    onSuccess: (res) => setWeekendResult(res.data),
  });

  const dismissFlag = useMutation({
    mutationFn: (flagId) => base44.entities.RiskFlag.update(flagId, { status: 'resolved' }),
    onSuccess: () => refetch(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            Risk Detection & Enforcement
          </h1>
          <p className="text-sm text-white/30 font-mono mt-1">HFT, arbitrage, news trading, and weekend holding violations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-white/30 uppercase">HFT Violations</span>
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-black text-white">{hftViolations.length}</div>
          <div className="text-[10px] font-mono text-white/40 mt-1">Active flags</div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-white/30 uppercase">News Trading</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{newsViolations.length}</div>
          <div className="text-[10px] font-mono text-white/40 mt-1">Standard accounts</div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-white/30 uppercase">Weekend Holding</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{weekendViolations.length}</div>
          <div className="text-[10px] font-mono text-white/40 mt-1">Active flags</div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-white/30 uppercase">Total Flags</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{riskFlags.length}</div>
          <div className="text-[10px] font-mono text-white/40 mt-1">All violations</div>
        </div>
      </div>

      {/* Detection Controls */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* HFT Detection */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-black text-white">HFT/Arbitrage Detection</h3>
          </div>
          <p className="text-xs text-white/40">
            Detects high-frequency trading, ultra-scalping, and arbitrage patterns
          </p>
          <button
            onClick={() => runHFTDetection.mutate({})}
            disabled={hftRunning}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            {hftRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {hftRunning ? 'Scanning...' : 'Run Detection'}
          </button>
        </div>

        {/* News Trading Detection */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black text-white">News Trading Detection</h3>
          </div>
          <p className="text-xs text-white/40">
            Checks if Standard accounts held positions during NFP, FOMC, CPI
          </p>
          <button
            onClick={() => runNewsDetection.mutate({})}
            disabled={newsRunning}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            {newsRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {newsRunning ? 'Scanning...' : 'Run Detection'}
          </button>
        </div>

        {/* Weekend Close */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-black text-white">Weekend Auto-Close</h3>
          </div>
          <p className="text-xs text-white/40">
            Closes positions for Standard accounts before weekend deadline
          </p>
          <button
            onClick={() => runWeekendClose.mutate()}
            disabled={runWeekendClose.isPending}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            {runWeekendClose.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {runWeekendClose.isPending ? 'Closing...' : 'Trigger Weekend Close'}
          </button>
          {weekendResult && (
            <div className="text-[10px] font-mono text-emerald-400">
              ✓ Closed {weekendResult.total_positions_closed || 0} positions
            </div>
          )}
        </div>
      </div>

      {/* Active Violations */}
      {riskFlags.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-[10px] font-mono text-white/30 uppercase">Active Risk Flags ({riskFlags.length})</span>
          </div>
          <div className="p-5 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskFlags.slice(0, 12).map(flag => (
              <ViolationCard key={flag.id} violation={flag} onDismiss={(id) => dismissFlag.mutate(id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}