import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function AccountSwitcherRow({ accounts, selectedAccount, onSelect }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-bold text-foreground">Active Accounts</span>
        {accounts.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-primary"
            style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
            {accounts.length}
          </span>
        )}
      </div>

      {/* Account Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {accounts.map((account) => {
          const isSelected = selectedAccount?.id === account.id;
          return (
            <motion.button
              key={account.id}
              onClick={() => onSelect(account)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-shrink-0 rounded-xl px-4 py-3 min-w-[180px] transition-all ${
                isSelected ? 'text-white' : 'text-white/40 hover:text-white/60'
              }`}
              style={isSelected
                ? {
                    background: 'rgba(255,92,0,0.15)',
                    border: '2px solid #FF5C00',
                    boxShadow: '0 0 20px rgba(255,92,0,0.2)'
                  }
                : {
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }
              }
            >
              <div className="text-[10px] font-mono text-white/50 truncate mb-1">
                {account.account_id || account.id?.slice(0, 12)}
              </div>
              <div className="text-sm font-bold text-white mb-0.5">
                ${(account.account_size || 0).toLocaleString()}
              </div>
              <div className={`text-[9px] font-semibold ${
                account.status === 'funded' ? 'text-emerald-400' :
                account.status === 'passed' ? 'text-blue-400' :
                account.status === 'active' ? 'text-primary' :
                'text-white/40'
              }`}>
                {account.status === 'funded' ? 'Funded' :
                 account.status === 'passed' ? 'Passed' :
                 account.status === 'active' ? 'Active' :
                 account.status}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}