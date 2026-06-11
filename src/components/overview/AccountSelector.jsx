import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function AccountSelector({ accounts, selectedAccount, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {accounts.map((account) => {
        const isSelected = selectedAccount?.id === account.id;
        const statusColor = account.status === 'active' ? '#10b981' 
          : account.status === 'passed' ? '#60a5fa' 
          : account.status === 'funded' ? '#FF5C00' : '#ef4444';
        
        return (
          <button
            key={account.id}
            onClick={() => onSelect(account)}
            className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all min-w-[180px] text-left ${
              isSelected ? 'ring-2 ring-white' : 'hover:opacity-90'
            }`}
            style={{
              background: isSelected ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isSelected ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `${statusColor}20`, border: `1px solid ${statusColor}40` }}>
                <span className="text-[9px] font-black" style={{ color: statusColor }}>
                  {account.status === 'active' ? 'AC' : account.status === 'passed' ? 'PA' : account.status === 'funded' ? 'FU' : 'NO'}
                </span>
              </div>
              {isSelected && <Check className="w-4 h-4 text-primary" />}
            </div>
            <div className="text-xs font-bold text-white font-mono truncate">
              {account.mt_login || account.account_id?.slice(0, 12)}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">
              ${(account.account_size || 0).toLocaleString()}
            </div>
          </button>
        );
      })}
    </div>
  );
}