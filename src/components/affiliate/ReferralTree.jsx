import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, GitBranch, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ACCENT = '#FF5C00';

function TraderNode({ email, isRoot = false }) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-xl px-3 py-2 flex items-center gap-2"
        style={{
          background: isRoot ? `${ACCENT}12` : 'rgba(99,102,241,0.06)',
          border: isRoot ? `1.5px solid ${ACCENT}40` : '1px solid rgba(99,102,241,0.18)',
        }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
          style={{ background: isRoot ? `${ACCENT}20` : 'rgba(99,102,241,0.12)', color: isRoot ? ACCENT : '#818cf8' }}>
          {isRoot ? 'YOU' : email?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span className="font-mono text-white/80 truncate max-w-[130px] text-xs">{email}</span>
      </div>
    </div>
  );
}

export default function ReferralTree({ commissions = [], userEmail }) {
  const [l1Profiles, setL1Profiles] = useState([]);
  const [l2Profiles, setL2Profiles] = useState([]);
  const [l3Profiles, setL3Profiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildTree = async () => {
      if (!userEmail) { setLoading(false); return; }
      try {
        const allProfiles = await base44.entities.AffiliateProfile.filter({}, '-created_date', 500);
        const l1 = allProfiles.filter(p => p.referred_by_email === userEmail);
        setL1Profiles(l1);
        const l1Emails = l1.map(p => p.user_email);
        const l2 = allProfiles.filter(p => l1Emails.includes(p.referred_by_email));
        setL2Profiles(l2);
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

  const totalReferrals = l1Profiles.length + l2Profiles.length + l3Profiles.length;

  if (loading) {
    return (
      <div className="rounded-2xl p-12 flex items-center justify-center" style={{ background: '#1a1d25', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-6 h-6 border-2 border-[#FF5C00]/30 border-t-[#FF5C00] rounded-full animate-spin" />
      </div>
    );
  }

  if (l1Profiles.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center" style={{ background: '#1a1d25', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
          <Users className="w-7 h-7" style={{ color: ACCENT }} />
        </div>
        <div className="text-sm font-bold text-white mb-1.5">No Referrals Yet</div>
        <div className="text-xs text-white/30">Share your referral link to start building your network</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Level 1', count: l1Profiles.length, rate: '8%', color: '#FF5C00', bg: `${ACCENT}10`, borderColor: `${ACCENT}25` },
          { label: 'Level 2', count: l2Profiles.length, rate: '2%', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' },
          { label: 'Level 3', count: l3Profiles.length, rate: '1%', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', borderColor: 'rgba(167,139,250,0.2)' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 text-center"
            style={{ background: s.bg, border: `1px solid ${s.borderColor}` }}>
            <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.count}</div>
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{s.label}</div>
            <div className="text-[11px] font-bold mt-1.5" style={{ color: s.color }}>{s.rate}</div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#1a1d25', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-4 border-b border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Network Tree</span>
            <span className="text-[10px] font-mono text-white/20 ml-auto">{totalReferrals} total</span>
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          <div className="flex items-start gap-8 min-w-max pb-2">
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="rounded-xl px-5 py-3 flex items-center gap-2"
                style={{ background: `${ACCENT}15`, border: `2px solid ${ACCENT}50`, boxShadow: `0 0 24px ${ACCENT}15` }}>
                <Zap className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-sm font-black" style={{ color: ACCENT }}>YOU</span>
              </div>
              <div className="text-[10px] font-mono text-white/20 truncate max-w-[110px] text-center">{userEmail}</div>
            </div>
            <div className="flex items-center self-center"><ArrowRight className="w-5 h-5 text-white/10" /></div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">Level 1 · 8%</span>
              </div>
              {l1Profiles.slice(0, 10).map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <TraderNode email={p.user_email} />
                </motion.div>
              ))}
              {l1Profiles.length > 10 && <div className="text-[10px] font-mono text-white/15 pl-2">+{l1Profiles.length - 10} more</div>}
            </div>
            {l2Profiles.length > 0 && (<>
              <div className="flex items-center self-center"><ArrowRight className="w-5 h-5 text-white/10" /></div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6366f1' }} />
                  <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">Level 2 · 2%</span>
                </div>
                {l2Profiles.slice(0, 8).map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <TraderNode email={p.user_email} />
                  </motion.div>
                ))}
                {l2Profiles.length > 8 && <div className="text-[10px] font-mono text-white/15 pl-2">+{l2Profiles.length - 8} more</div>}
              </div>
            </>)}
            {l3Profiles.length > 0 && (<>
              <div className="flex items-center self-center"><ArrowRight className="w-5 h-5 text-white/10" /></div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa' }} />
                  <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">Level 3 · 1%</span>
                </div>
                {l3Profiles.slice(0, 6).map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <TraderNode email={p.user_email} />
                  </motion.div>
                ))}
                {l3Profiles.length > 8 && <div className="text-[10px] font-mono text-white/15 pl-2">+{l3Profiles.length - 6} more</div>}
              </div>
            </>)}
          </div>
        </div>
      </div>
    </div>
  );
}