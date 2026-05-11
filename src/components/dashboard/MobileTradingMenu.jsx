import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';

export default function MobileTradingMenu({ lotSize, setLotSize, onTrade }) {
  const [expanded, setExpanded] = useState(false);
  const lotSizes = ['0.01', '0.1', '0.5', '1.0', '2.0'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="md:hidden rounded-2xl overflow-hidden backdrop-blur-xl border"
      style={{
        background: 'linear-gradient(135deg, rgba(255,92,0,0.12), rgba(139,92,246,0.06))',
        border: '1px solid rgba(255,92,0,0.2)',
        boxShadow: '0 8px 32px rgba(255,92,0,0.1)'
      }}>
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3.5 flex items-center justify-between transition-all"
        style={{ borderBottom: expanded ? '1px solid rgba(255,92,0,0.15)' : 'none' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,92,0,0.8), rgba(255,140,60,0.8))' }}>
            <span className="text-sm font-black text-white">⚡</span>
          </div>
          <div className="text-left">
            <div className="text-xs font-mono text-orange-400 uppercase tracking-widest">Quick Trade</div>
            <div className="text-sm font-bold text-white">Lot: {lotSize}</div>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-orange-400" />}
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden">
            <div className="px-4 py-3 space-y-3 border-t" style={{ borderColor: 'rgba(255,92,0,0.15)' }}>
              {/* Lot size selector */}
              <div>
                <label className="text-[10px] font-mono text-orange-400 uppercase tracking-widest block mb-2">Select Lot Size</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {lotSizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setLotSize(size);
                        setExpanded(false);
                      }}
                      className="py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: lotSize === size
                          ? 'linear-gradient(135deg, rgba(255,92,0,0.8), rgba(255,140,60,0.8))'
                          : 'rgba(255,255,255,0.06)',
                        border: lotSize === size ? '1px solid rgba(255,92,0,0.6)' : '1px solid rgba(255,255,255,0.1)',
                        color: lotSize === size ? '#fff' : 'rgba(255,255,255,0.4)',
                        boxShadow: lotSize === size ? '0 4px 12px rgba(255,92,0,0.25)' : 'none'
                      }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick trade buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onTrade('BUY');
                    setExpanded(false);
                  }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.8), rgba(5,150,105,0.8))',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
                  }}>
                  <TrendingUp className="w-4 h-4" /> BUY
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onTrade('SELL');
                    setExpanded(false);
                  }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.8), rgba(220,38,38,0.8))',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.25)'
                  }}>
                  <TrendingDown className="w-4 h-4" /> SELL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}