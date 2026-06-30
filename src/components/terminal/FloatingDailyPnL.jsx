import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, X, GripHorizontal, AlertTriangle } from 'lucide-react';

/**
 * Floating draggable Daily P&L box - shown when positions are open.
 * Mirrors the DailyPnlCard from FundedDashboard overview.
 */
export default function FloatingDailyPnL({ floatPnl, dailyClosedPnl, accountSize, dailyDDLimit, dailyOpenBalance, equity, visible }) {
  const [dismissed, setDismissed] = useState(false);
  const [pos, setPos] = useState({ x: 12, y: 80 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // Reset dismiss when positions open
  useEffect(() => { if (visible) setDismissed(false); }, [visible]);

  const dailyPnl = (dailyClosedPnl || 0) + floatPnl;
  const dailyDDPct = Math.max(0, ((dailyOpenBalance - equity) / (accountSize || 1)) * 100);
  const ddUsedPct = Math.min((dailyDDPct / (dailyDDLimit || 5)) * 100, 100);
  const isWarn = dailyDDPct >= (dailyDDLimit || 5) * 0.7;
  const isBreach = dailyDDPct >= (dailyDDLimit || 5);
  const isPos = dailyPnl >= 0;

  const accent = isBreach ? '#ef4444' : isWarn ? '#f97316' : isPos ? '#10b981' : '#ef4444';

  const onMouseDown = (e) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };
  const onMouseUp = () => {
    dragging.current = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            zIndex: 40,
            width: 200,
            background: isBreach
              ? 'linear-gradient(160deg, rgba(30,5,5,0.97), rgba(20,3,3,0.97))'
              : isWarn ? 'linear-gradient(160deg, rgba(28,12,3,0.97), rgba(20,9,2,0.97))'
              : 'linear-gradient(160deg, rgba(4,14,10,0.97), rgba(4,18,12,0.97))',
            border: `1px solid ${accent}50`,
            borderRadius: 14,
            boxShadow: `0 8px 32px ${accent}28, 0 0 0 1px rgba(0,0,0,0.5)`,
            backdropFilter: 'blur(20px)',
            userSelect: 'none',
          }}
        >
          {/* Top color line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}90, transparent)` }} />

          {/* Drag handle */}
          <div
            onMouseDown={onMouseDown}
            className="flex items-center justify-between px-3 pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-1.5">
              <GripHorizontal className="w-3 h-3" style={{ color: `${accent}60` }} />
              <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: `${accent}80` }}>Daily P&L</span>
              {(isWarn || isBreach) && (
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <AlertTriangle className="w-3 h-3" style={{ color: accent }} />
                </motion.div>
              )}
            </div>
            <button onClick={() => setDismissed(true)}
              className="w-4 h-4 flex items-center justify-center rounded-full transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              <X className="w-2.5 h-2.5 text-white/30 hover:text-white/70" />
            </button>
          </div>

          <div className="px-3 pb-3">
            {/* Main P&L number */}
            <motion.div
              key={Math.round(dailyPnl * 10)}
              initial={{ scale: 0.95, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="text-2xl font-black leading-none mb-0.5"
              style={{ color: accent, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 16px ${accent}50` }}>
              {dailyPnl >= 0 ? '+' : ''}${Math.abs(dailyPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </motion.div>
            <div className="text-[8px] font-mono mb-2" style={{ color: `${accent}60` }}>
              closed + float today
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-1 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
              <span className="text-[8px] font-mono font-black" style={{ color: accent }}>
                {isBreach ? 'LIMIT REACHED' : isWarn ? 'APPROACHING LIMIT' : 'LIVE'}
              </span>
            </div>

            {/* Float breakdown */}
            <div className="flex justify-between text-[8px] font-mono mb-2.5">
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                Closed: <span style={{ color: (dailyClosedPnl||0) >= 0 ? '#10b981' : '#ef4444' }}>
                  {(dailyClosedPnl||0) >= 0 ? '+' : ''}${(dailyClosedPnl||0).toFixed(2)}
                </span>
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                Float: <span style={{ color: floatPnl >= 0 ? '#10b981' : '#ef4444' }}>
                  {floatPnl >= 0 ? '+' : ''}${floatPnl.toFixed(2)}
                </span>
              </span>
            </div>

            {/* Daily DD bar */}
            <div>
              <div className="flex justify-between text-[8px] font-mono mb-1">
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>Daily DD</span>
                <span style={{ color: accent }}>{dailyDDPct.toFixed(2)}% / {dailyDDLimit}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                  animate={{ width: `${ddUsedPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${accent}70, ${accent})`, boxShadow: `0 0 8px ${accent}60` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}