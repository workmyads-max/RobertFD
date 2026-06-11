import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp } from 'lucide-react';

const payouts = [
  { name: 'Kostiantyn B.', country: 'UA', amount: '$1,800.00', icon: 'USDT' },
  { name: 'Mike T.', country: 'ES', amount: '$1,518.10', icon: '💳' },
  { name: 'Shayekh M.', country: 'BD', amount: '$1,200.80', icon: 'USDT' },
  { name: 'Somayeh N.', country: 'AF', amount: '$837.75', icon: '💳' },
  { name: 'Ahmed K.', country: 'EG', amount: '$2,150.00', icon: 'USDT' },
  { name: 'John D.', country: 'UK', amount: '$1,925.50', icon: '💳' },
  { name: 'Maria S.', country: 'BR', amount: '$1,340.00', icon: 'USDT' },
  { name: 'Chen W.', country: 'CN', amount: '$2,890.25', icon: '💳' },
];

export default function LivePayouts() {
  return (
    <div className="mt-10 rounded-xl p-5 border"
      style={{ 
        background: 'linear-gradient(145deg, #0d1117, #0a0e14)',
        borderColor: 'rgba(255,255,255,0.06)'
      }}>
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Info */}
        <div className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 w-fit"
            style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <DollarSign className="w-3.5 h-3.5" style={{ color: '#FF5C00' }} />
            <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Payouts</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-3 leading-tight">
            Rewarding Our Traders, <span style={{ color: '#FF5C00' }}>Every Week</span>
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Join thousands of traders funded with simple rules and fast payouts. Keep up to 90% of your profits with weekly withdrawal processing.
          </p>
        </div>

        {/* Right Column - Payout Feed */}
        <div className="rounded-xl p-4 overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="space-y-2">
            <motion.div
              className="flex flex-col gap-2"
              animate={{ y: [0, -160] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              {[...payouts, ...payouts].map((payout, idx) => {
                const isUSDT = payout.icon === 'USDT';
                return (
                  <motion.div
                    key={`${payout.name}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="flex items-center gap-3 rounded-lg p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ 
                        background: isUSDT ? 'rgba(16,185,129,0.15)' : 'rgba(255,92,0,0.15)',
                        border: `1px solid ${isUSDT ? 'rgba(16,185,129,0.3)' : 'rgba(255,92,0,0.3)'}`
                      }}>
                      {payout.icon}
                    </div>
                    
                    {/* Name & Country */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {payout.name} <span className="text-gray-500 font-medium">{payout.country}</span>
                      </div>
                    </div>
                    
                    {/* Amount & Status */}
                    <div className="text-right">
                      <div className="text-sm font-bold text-white mb-1">{payout.amount}</div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold"
                        style={{ 
                          background: 'rgba(163,201,77,0.15)', 
                          color: '#a3c94d',
                          border: '1px solid rgba(163,201,77,0.25)'
                        }}>
                        Just now
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}