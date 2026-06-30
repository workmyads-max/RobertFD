import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, Users, Zap, TrendingUp, Globe, Gauge,
  Layers, Crosshair, Bot, Repeat, Clock, BarChart3, Server, FileText, Lock, RefreshCw,
} from 'lucide-react';
import { useRiskCenterData } from '@/hooks/useRiskCenterData';
import { LastSynced } from './rcShared';
import RCOverview from './RCOverview';
import RCUsersList from './RCUsersList';
import RCHftMonitor from './RCHftMonitor';
import RCBehavioral from './RCBehavioral';
import RCIpRisk from './RCIpRisk';
import RCMartingale from './RCMartingale';
import RCScalper from './RCScalper';
import RCStrategy from './RCStrategy';
import RCSwapNoSwap from './RCSwapNoSwap';
import RCClosedTrades from './RCClosedTrades';
import RCDataCenter from './RCDataCenter';
import RCActivityLogs from './RCActivityLogs';
import RCEvidencePanel from './RCEvidencePanel';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'users', label: 'Users List', icon: Users },
  { id: 'hft', label: 'HFT Monitor', icon: Zap },
  { id: 'behavioral', label: 'Behavioral Risk', icon: TrendingUp },
  { id: 'ip', label: 'IP Risk Monitor', icon: Globe },
  { id: 'martingale', label: 'Martingale', icon: Repeat },
  { id: 'scalper', label: 'Scalper Detection', icon: Crosshair },
  { id: 'strategy', label: 'Strategy & Concentration', icon: BarChart3 },
  { id: 'swap', label: 'Swap / No-Swap', icon: Clock },
  { id: 'margin', label: 'Margin & Leverage', icon: Gauge },
  { id: 'closed', label: 'Closed Trades', icon: Layers },
  { id: 'datacenter', label: 'Data Center', icon: Server },
  { id: 'logs', label: 'Activity Logs', icon: FileText },
];

export default function RiskManagementCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [detailAcc, setDetailAcc] = useState(null);
  const { data, isLoading, refetch, isFetching } = useRiskCenterData(true);

  const accounts = data?.accounts || [];
  const deviceLogs = data?.device_logs || [];
  const econEvents = data?.econ_events || [];
  const summary = data?.summary || {};

  const handleScan = () => refetch();

  const renderModule = () => {
    const common = { accounts, deviceLogs, econEvents, summary, isLoading, onView: setDetailAcc };
    switch (activeTab) {
      case 'overview': return <RCOverview {...common} />;
      case 'users': return <RCUsersList {...common} />;
      case 'hft': return <RCHftMonitor {...common} />;
      case 'behavioral': return <RCBehavioral {...common} />;
      case 'ip': return <RCIpRisk {...common} />;
      case 'martingale': return <RCMartingale {...common} />;
      case 'scalper': return <RCScalper {...common} />;
      case 'strategy': return <RCStrategy {...common} />;
      case 'swap': return <RCSwapNoSwap {...common} />;
      case 'margin': return <RCStrategy {...common} tab="margin" />;
      case 'closed': return <RCClosedTrades {...common} />;
      case 'datacenter': return <RCDataCenter {...common} />;
      case 'logs': return <RCActivityLogs />;
      default: return <RCOverview {...common} />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Left sub-nav */}
      <div className="w-56 flex-shrink-0 border-r overflow-y-auto hidden md:block" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h1 className="text-sm font-black text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Risk Center
          </h1>
          <p className="text-[10px] text-white/30 mt-1 leading-relaxed">Audit-only · No auto-enforcement</p>
        </div>
        <nav className="py-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-all"
                style={{
                  background: active ? 'rgba(255,92,0,0.1)' : 'transparent',
                  color: active ? '#FF5C00' : 'rgba(255,255,255,0.4)',
                  borderLeft: active ? '2px solid #FF5C00' : '2px solid transparent',
                }}>
                <Icon className="w-4 h-4 flex-shrink-0" /> {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(7,8,14,0.95)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)}
              className="md:hidden px-3 py-1.5 rounded-lg text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <LastSynced scannedAt={data?.scannedAt} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-emerald-300"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <Lock className="w-3 h-3" /> Monitor-only
            </div>
            <button onClick={handleScan} disabled={isFetching}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
              style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)' }}>
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> {isFetching ? 'Scanning...' : 'Scan All'}
            </button>
          </div>
        </div>

        {/* Audit-only banner */}
        <div className="mx-6 mt-4 rounded-xl px-4 py-2.5 text-[11px] text-white/50 flex items-center gap-2"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
          <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          This center is <strong className="text-emerald-300">audit-only</strong>. Scans compute risk scores for review. No action here auto-breaches, fails, suspends, or flags accounts. Admin actions are deliberate and logged.
        </div>

        {/* Module content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {isLoading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : renderModule()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Evidence drill-down */}
      <AnimatePresence>
        {detailAcc && <RCEvidencePanel account={detailAcc} onClose={() => setDetailAcc(null)} />}
      </AnimatePresence>
    </div>
  );
}