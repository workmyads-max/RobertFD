import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, MapPin, Wifi } from 'lucide-react';
import { useUserLocation } from '@/hooks/useUserLocation';

export default function WelcomeHeader({ user, kyc, onStartChallenge }) {
  const location = useUserLocation();
  const kycStatus = kyc?.status || 'not_submitted';
  const isVerified = kycStatus === 'approved';

  const displayName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Trader';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(12,18,36,0.97), rgba(14,22,44,0.95))',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(255,92,0,0.25), rgba(255,92,0,0.10))',
            border: '1px solid rgba(255,92,0,0.25)',
          }}>
          {displayName.charAt(0).toUpperCase()}
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: '#10b981', border: '2px solid rgba(12,18,36,1)' }}>
              <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Text */}
        <div>
          <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-0.5">Welcome On Board</div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-bold text-white tracking-tight leading-none">{displayName}</h2>
            {/* KYC Badge */}
            {isVerified ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
                <ShieldCheck className="w-2.5 h-2.5" /> KYC Verified
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
                style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                <AlertCircle className="w-2.5 h-2.5" /> Unverified
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location + IP */}
      <div className="flex items-center gap-4 flex-wrap">
        {!location.loading && (
          <div className="flex flex-col gap-1 text-right">
            <div className="flex items-center justify-end gap-1.5 text-[10px] font-mono text-white/40">
              <MapPin className="w-3 h-3" />
              {location.flag && <span>{location.flag}</span>}
              <span>{location.city || '—'}, {location.country || '—'}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-[10px] font-mono text-white/25">
              <Wifi className="w-3 h-3" />
              <span>IP: {location.ip || '—'}</span>
            </div>
          </div>
        )}
        {location.loading && (
          <div className="text-[10px] font-mono text-white/20 animate-pulse">Loading session...</div>
        )}
      </div>
    </motion.div>
  );
}