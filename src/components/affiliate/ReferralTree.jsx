import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronRight, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function TraderNode({ email, isRoot = false }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-xl px-3 py-2 flex items-center gap-2 ${isRoot ? 'text-sm' : 'text-xs'}`}
        style={{
          background: isRoot ? 'rgba(255,92,0,0.15)' : 'rgba(96,165,250,0.08)',
          border: isRoot ? '2px solid rgba(255,92,0,0.5)' : '1px solid rgba(96,165,250,0.25)',
          boxShadow: isRoot ? '0 0 20px rgba(255,92,0,0.2)' : 'none',
        }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black"
          style={{
            background: isRoot ? 'rgba(255,92,0,0.25)' : 'rgba(96,165,250,0.15)',
            color: isRoot ? '#FF5C00' : '#60a5fa',
          }}>
          {isRoot ? 'YOU' : email?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span className="font-mono text-foreground truncate max-w-[120px] text-xs">{email}</span>
      </div>
    </div>
  );
}

export default function ReferralTree({ commissions = [], userEmail }) {
  const [l1Profiles, setL1Profiles] = useState([]);
  const [l2Profiles, setL2Profiles] = useState([]);
  const [l3Profiles, setL3Profiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Build tree from REAL referral relationships stored in AffiliateProfile
  // NOT from commission records (which only show purchasers)
  useEffect(() => {
    const buildTree = async () => {
      if (!userEmail) { setLoading(false); return; }
      try {
        // L1: people directly referred by this user
        const allProfiles = await base44.entities.AffiliateProfile.filter({}, '-created_date', 500);
        const l1 = allProfiles.filter(p => p.referred_by_email === userEmail);
        setL1Profiles(l1);

        // L2: people referred by L1 profiles
        const l1Emails = l1.map(p => p.user_email);
        const l2 = allProfiles.filter(p => l1Emails.includes(p.referred_by_email));
        setL2Profiles(l2);

        // L3: people referred by L2 profiles
        const l2Emails = l2.map(p => p.user_email);
        const l3 = allProfiles.filter(p => l2Emails.includes(p.referred_by_email));
        setL3Profiles(l3);
      } catch (e) {
        console.error('[ReferralTree] Failed to build tree:', e);
      }
      setLoading(false);
    };
    buildTree();
  }, [userEmail]);

  if (loading) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (l1Profiles.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
          <Users className="w-8 h-8 text-primary" />
        </div>
        <div className="text-sm font-bold text-foreground mb-2">No Referrals Yet</div>
        <div className="text-xs text-muted-foreground">Share your referral link to build your network</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="text-xs font-bold text-foreground mb-5 uppercase tracking-widest flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" /> Referral Network Tree
      </div>

      <div className="overflow-x-auto">
        <div className="flex items-start gap-6 min-w-max pb-4">
          {/* Root node */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="rounded-xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'rgba(255,92,0,0.15)', border: '2px solid rgba(255,92,0,0.5)', boxShadow: '0 0 20px rgba(255,92,0,0.2)' }}>
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-black text-primary">YOU</span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px] text-center">{userEmail}</div>
          </div>

          <div className="flex items-center self-center">
            <ChevronRight className="w-5 h-5 text-primary/40" />
          </div>

          {/* L1 — Real referrals from AffiliateProfile */}
          <div className="flex flex-col gap-3">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Level 1 (8%)</div>
            {l1Profiles.slice(0, 8).map(p => (
              <motion.div key={p.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <TraderNode email={p.user_email} />
              </motion.div>
            ))}
            {l1Profiles.length > 8 && (
              <div className="text-[10px] font-mono text-muted-foreground">+{l1Profiles.length - 8} more</div>
            )}
          </div>

          {l2Profiles.length > 0 && (
            <>
              <div className="flex items-center self-center">
                <ChevronRight className="w-5 h-5 text-blue-400/40" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Level 2 (2%)</div>
                {l2Profiles.slice(0, 8).map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <TraderNode email={p.user_email} />
                  </motion.div>
                ))}
                {l2Profiles.length > 8 && (
                  <div className="text-[10px] font-mono text-muted-foreground">+{l2Profiles.length - 8} more</div>
                )}
              </div>
            </>
          )}

          {l3Profiles.length > 0 && (
            <>
              <div className="flex items-center self-center">
                <ChevronRight className="w-5 h-5 text-purple-400/40" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Level 3 (1%)</div>
                {l3Profiles.slice(0, 6).map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <TraderNode email={p.user_email} />
                  </motion.div>
                ))}
                {l3Profiles.length > 6 && (
                  <div className="text-[10px] font-mono text-muted-foreground">+{l3Profiles.length - 6} more</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
        {[
          { label: 'L1 Referrals', count: l1Profiles.length, color: '#FF5C00' },
          { label: 'L2 Referrals', count: l2Profiles.length, color: '#60a5fa' },
          { label: 'L3 Referrals', count: l3Profiles.length, color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.count}</div>
            <div className="text-[10px] font-mono text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}