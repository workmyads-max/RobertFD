import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, ShieldAlert, Info, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const SEVERITY_CONFIG = {
  critical: { icon: ShieldAlert,    color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)', label: 'CRITICAL' },
  high:     { icon: AlertOctagon,   color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',   label: 'HIGH'     },
  medium:   { icon: AlertOctagon,   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: 'MEDIUM'   },
  low:      { icon: Info,           color: '#60a5fa', bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.2)',  label: 'LOW'      },
};

const VIOLATION_DESCRIPTIONS = {
  hft_detection:          'High-frequency trading or arbitrage patterns detected.',
  ultra_fast_scalping:    'Ultra-fast scalping activity (trades < 10 seconds) detected.',
  martingale_grid:        'Martingale or grid trading pattern detected.',
  consistency_manipulation: 'Consistency rule violation: single trade exceeds 50% of total profits.',
  suspicious_lot_sizing:  'Unusual lot sizing patterns detected.',
  hedge_abuse:            'Prohibited hedging activity detected on Standard account.',
  copy_trading_signal:    'Possible copy trading or signal service usage detected.',
  toxic_flow:             'Abnormal stop-hunt ratio flagged.',
  unusual_dd_behavior:    'Drawdown usage approaching limit - review your risk management.',
  overnight_violation:    'Overnight position holding violation on Standard account.',
  synthetic_arbitrage:    'Synthetic arbitrage via correlated instruments detected.',
  news_trading_violation: 'News trading detected during high-impact event blackout.',
  weekend_holding_violation: 'Weekend position holding on Standard account detected.',
};

// Risk engine is ADMIN-REVIEW-ONLY as of 2026-06-22.
// Non-DD risk detections (HFT, IP, behavioral, EA/bot, "approaching limit") must
// NEVER produce a user-facing warning, never auto-fail/review/suspend an account,
// and never set can_trade=false. Only a REAL Daily DD or Overall/Max DD breach
// (handled server-side by mt5RealtimeSync / scheduledMTSync / automatedDDBreach)
// may automatically fail an account. The user-facing breach modal (DDBreachModal)
// already handles real breaches - so this panel renders nothing.
// Admins still see all risk_score/risk_level/risk_flags in the Admin Risk Center.
export default function UserWarningPanel() {
  return null;
}