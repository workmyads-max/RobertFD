import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Shield, Activity, TrendingUp, TrendingDown, AlertTriangle, Zap,
  BarChart2, Clock, Target, Brain, Eye, ChevronDown, ChevronUp,
  Calendar, Flame, Award, Radio, AlertCircle
} from 'lucide-react';
import RiskScoreGauge from './RiskScoreGauge';
import DDMonitor from './DDMonitor';
import SessionAnalytics from './SessionAnalytics';
import BehaviorAnalysis from './BehaviorAnalysis';
import RiskHeatmap from './RiskHeatmap';
import TradeQualityPanel from './TradeQualityPanel';
import ViolationAppealModal from './ViolationAppealModal';
import LiveRiskNotifications from './LiveRiskNotifications';
import NewsRiskFilter from './NewsRiskFilter';

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'risk', label: 'Risk Monitor', icon: Shield },
  { id: 'sessions', label: 'Sessions', icon: Clock },
  { id: 'behavior', label: 'Behavior', icon: Brain },
  { id: 'heatmap', label: 'Heatmap', icon: Flame },
  { id: 'quality', label: 'Trade Quality', icon: Target },
  { id: 'news', label: 'News Filter', icon: AlertCircle },
];

export default function MyPerformance({ user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [showAppeal, setShowAppeal] = useState(false);
  const [appealViolationType, setAppealViolationType] = useState(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
  });

  const activeAccounts = accounts.filter(a => ['active', 'funded', 'passed'].includes(a.status));
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || activeAccounts[0] || accounts[0];

  const { data: trades = [] } = useQuery({
    queryKey: ['trades-perf', selectedAccount?.id],
    queryFn: () => base44.entities.TradeRecord.filter({ account_id: selectedAccount?.id }),
    enabled: !!selectedAccount?.id,
  });

  const closedTrades = trades.filter(t => t.status === 'closed');

  // Risk score calculation
  const riskScore = useMemo(() => {
    if (!selectedAccount || closedTrades.length === 0) return { score: 0, level: 'low', factors: [] };
    const factors = [];
    let score = 0;

    // DD behavior
    const ddUsed = selectedAccount.max_drawdown_used || 0;
    if (ddUsed > 7) { score += 30; factors.push({ label: 'High Max DD Usage', severity: 'high', value: `${ddUsed.toFixed(1)}%` }); }
    else if (ddUsed > 4) { score += 15; factors.push({ label: 'Moderate DD Usage', severity: 'medium', value: `${ddUsed.toFixed(1)}%` }); }

    // Daily DD
    const dailyDD = selectedAccount.daily_drawdown_used || 0;
    if (dailyDD > 3.5) { score += 20; factors.push({ label: 'High Daily DD Usage', severity: 'high', value: `${dailyDD.toFixed(1)}%` }); }

    // Win rate
    const wr = selectedAccount.win_rate || 0;
    if (wr < 40) { score += 15; factors.push({ label: 'Low Win Rate', severity: 'medium', value: `${wr.toFixed(1)}%` }); }

    // Lot consistency
    const lots = closedTrades.map(t => t.lots).filter(Boolean);
    if (lots.length > 3) {
      const avgLot = lots.reduce((a, b) => a + b, 0) / lots.length;
      const maxLot = Math.max(...lots);
      if (maxLot > avgLot * 3) { score += 20; factors.push({ label: 'Inconsistent Lot Sizes', severity: 'high', value: `${maxLot.toFixed(2)} max` }); }
    }

    // Rapid re-entries (trades within 60s)
    const sorted = [...closedTrades].sort((a, b) => new Date(a.open_time) - new Date(b.open_time));
    let rapidCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      const diff = new Date(sorted[i].open_time) - new Date(sorted[i-1].close_time);
      if (!isNaN(diff) && diff < 60000) rapidCount++;
    }
    if (rapidCount > 3) { score += 15; factors.push({ label: 'Rapid Re-entries Detected', severity: 'medium', value: `${rapidCount} instances` }); }

    const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
    return { score: Math.min(score, 100), level, factors };
  }, [selectedAccount, closedTrades]);

  // Violation detection
  const violations = useMemo(() => {
    const v = [];
    if (!selectedAccount || closedTrades.length === 0) return v;

    // HFT: multiple trades in <200ms (simulated by checking same open_time)
    const timeGroups = {};
    closedTrades.forEach(t => {
      const key = t.open_time?.substring(0, 8);
      if (key) timeGroups[key] = (timeGroups[key] || 0) + 1;
    });
    const hftCount = Object.values(timeGroups).filter(c => c > 5).length;
    if (hftCount > 0) v.push({ type: 'hft_detection', label: 'Potential HFT Activity', severity: 'critical', desc: 'Abnormal trade frequency detected in short timeframes.' });

    // Overleverage: lots > account_size/100000 * 10
    const accountLotLimit = (selectedAccount.account_size || 100000) / 100000 * 10;
    const oversized = closedTrades.filter(t => (t.lots || 0) > accountLotLimit);
    if (oversized.length > 0) v.push({ type: 'overleveraging', label: 'Overleveraging Detected', severity: 'high', desc: `${oversized.length} trades exceeded safe lot size limits.` });

    return v;
  }, [selectedAccount, closedTrades]);

  const riskColors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
  const riskColor = riskColors[riskScore.level];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2"
            style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <Radio className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">Live Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
            <Activity className="w-7 h-7 text-primary" /> My Performance
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Institutional-grade risk intelligence & analytics center</p>
        </div>

        {/* Account selector */}
        {accounts.length > 0 && (
          <div className="flex items-center gap-3">
            <select
              value={selectedAccount?.id || ''}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="rounded-xl px-4 py-2.5 text-sm font-mono text-foreground outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {accounts.map(a => (
                <option key={a.id} value={a.id} className="bg-[#0e0f16]">
                  {a.account_id} — ${(a.account_size||0).toLocaleString()} ({a.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Live Risk Notifications */}
      <LiveRiskNotifications account={selectedAccount} riskScore={riskScore} violations={violations} />

      {/* Top KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Risk Score', value: `${riskScore.score}/100`, color: riskColor, sub: riskScore.level.toUpperCase() },
          { label: 'Win Rate', value: `${(selectedAccount?.win_rate || 0).toFixed(1)}%`, color: '#10b981', sub: `${closedTrades.length} trades` },
          { label: 'Daily DD Used', value: `${(selectedAccount?.daily_drawdown_used || 0).toFixed(2)}%`, color: (selectedAccount?.daily_drawdown_used || 0) > 3 ? '#ef4444' : '#10b981', sub: 'Resets 03:00 GMT+4' },
          { label: 'Max DD Used', value: `${(selectedAccount?.max_drawdown_used || 0).toFixed(2)}%`, color: (selectedAccount?.max_drawdown_used || 0) > 6 ? '#ef4444' : '#f59e0b', sub: 'Overall limit: 10%' },
          { label: 'Profit Target', value: `${(selectedAccount?.profit_target_progress || 0).toFixed(1)}%`, color: '#6366f1', sub: 'Progress' },
          { label: 'Violations', value: violations.length, color: violations.length > 0 ? '#ef4444' : '#10b981', sub: violations.length ? 'Action Required' : 'Clear' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-2xl p-4"
            style={{ background: `${kpi.color}0a`, border: `1px solid ${kpi.color}25` }}>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: kpi.color }}>{kpi.label}</div>
            <div className="text-xl font-black text-foreground">{kpi.value}</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Violations Alert Banner */}
      <AnimatePresence>
        {violations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-4 mb-6 flex items-start gap-4 flex-wrap"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-red-400 mb-1">Rule Violations Detected</div>
              <div className="flex flex-wrap gap-2">
                {violations.map((v, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                    style={{ background: v.severity === 'critical' ? '#7f1d1d' : '#7c2d12', border: '1px solid rgba(239,68,68,0.4)' }}>
                    ⚠ {v.label}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => { setShowAppeal(true); setAppealViolationType(violations[0]?.type); }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)' }}>
              Submit Appeal
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TAB_CONFIG.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
              style={{
                background: active ? 'rgba(255,92,0,0.15)' : 'transparent',
                color: active ? '#FF5C00' : 'hsl(var(--muted-foreground))',
                border: active ? '1px solid rgba(255,92,0,0.3)' : '1px solid transparent',
              }}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}>

          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <RiskScoreGauge score={riskScore.score} level={riskScore.level} factors={riskScore.factors} />
              </div>
              <div className="lg:col-span-2">
                <DDMonitor account={selectedAccount} />
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <RiskScoreGauge score={riskScore.score} level={riskScore.level} factors={riskScore.factors} expanded />
              <DDMonitor account={selectedAccount} expanded />
            </div>
          )}

          {activeTab === 'sessions' && <SessionAnalytics trades={closedTrades} />}
          {activeTab === 'behavior' && <BehaviorAnalysis trades={closedTrades} account={selectedAccount} />}
          {activeTab === 'heatmap' && <RiskHeatmap trades={closedTrades} account={selectedAccount} />}
          {activeTab === 'quality' && <TradeQualityPanel trades={closedTrades} />}
          {activeTab === 'news' && <NewsRiskFilter account={selectedAccount} />}
        </motion.div>
      </AnimatePresence>

      {/* Appeal Modal */}
      {showAppeal && (
        <ViolationAppealModal
          account={selectedAccount}
          user={user}
          violationType={appealViolationType}
          onClose={() => setShowAppeal(false)}
        />
      )}
    </div>
  );
}