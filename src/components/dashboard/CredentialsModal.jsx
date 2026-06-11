import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Lock } from 'lucide-react';

function CredentialRow({ label, value, copyable, onCopy, copied }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#666666' }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{value}</span>
        {copyable && (
          <button
            onClick={() => onCopy(value, label)}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CredentialsModal({ account, onClose }) {
  const [copied, setCopied] = React.useState(null);

  const handleCopy = (value, key) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  if (!account) return null;

  const statusColor = account.status === 'active' ? '#10b981' : account.status === 'funded' ? '#FF5C00' : '#60a5fa';

  return (
    <AnimatePresence>
      {account && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{
                background: '#111111',
                border: '1px solid rgba(255,92,0,0.25)',
                boxShadow: '0 0 60px rgba(255,92,0,0.15)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div>
                  <h2 className="text-base font-bold text-white">Account Credentials</h2>
                  <p className="text-xs text-white/40 mt-0.5">Keep these private and secure</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                <CredentialRow
                  label="Platform"
                  value={account.platform === 'mt5' ? 'MetaTrader 5' : account.platform || '—'}
                />
                <CredentialRow
                  label="Login ID"
                  value={account.mt_login || '—'}
                  copyable={!!account.mt_login}
                  onCopy={handleCopy}
                  copied={copied === 'Login ID'}
                />
                <CredentialRow
                  label="Password"
                  value={account.mt_password || '—'}
                  copyable={!!account.mt_password}
                  onCopy={handleCopy}
                  copied={copied === 'Password'}
                />
                <CredentialRow
                  label="Server"
                  value={account.mt_server || '—'}
                  copyable={!!account.mt_server}
                  onCopy={handleCopy}
                  copied={copied === 'Server'}
                />
                <CredentialRow
                  label="Account ID"
                  value={account.account_id || '—'}
                  copyable={!!account.account_id}
                  onCopy={handleCopy}
                  copied={copied === 'Account ID'}
                />
                <CredentialRow
                  label="Leverage"
                  value={account.leverage || '1:100'}
                />
                <CredentialRow
                  label="Account Size"
                  value={`$${(account.account_size || 0).toLocaleString()}`}
                />
                <CredentialRow
                  label="Challenge Type"
                  value={
                    account.challenge_type === 'two-step' ? 'Two-Step Challenge' :
                    account.challenge_type === 'instant' ? 'Instant Funding' :
                    'Instant Light Challenge'
                  }
                />
                <CredentialRow
                  label="Status"
                  value={
                    account.status === 'active' ? 'Active' :
                    account.status === 'funded' ? 'Funded' :
                    account.status === 'passed' ? 'Passed' :
                    account.status || '—'
                  }
                />
              </div>

              {/* Warning Footer */}
              <div
                className="px-6 py-4 flex items-start gap-3"
                style={{
                  background: 'rgba(255,92,0,0.08)',
                  borderTop: '1px solid rgba(255,92,0,0.15)',
                }}
              >
                <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FF5C00' }} />
                <p className="text-xs text-white/50 leading-relaxed">
                  <span className="text-white/70 font-medium">Never share your credentials.</span> XFunded will never ask for your password.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}