import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, GitBranch, ArrowRight, Share2 } from 'lucide-react';

const ORANGE = '#FF5C00';
const CARD = '#15171e';
const BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.35)';
import { base44 } from '@/api/base44Client';

function TraderBadge({ email, isRoot = false }) {
  return (
    <div className="rounded-lg px-3 py-1.5 flex items-center gap-2"
      style={{
        background: isRoot ? `${ORANGE}10` : 'rgba(129,140,248,0.06)',
        border: isRoot ? `1px solid ${ORANGE}30` : '1px solid rgba(129,140,248,0.15)',
      }}>
      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black flex-shrink-0"
        style={{
          background: isRoot ? `${ORANGE}18` : 'rgba(129,140,248,0.1)',
          color: isRoot ? ORANGE : '#a5b4fc',
        }}>
        {isRoot ? 'YOU' : email?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <span className="font-mono text-white/70 truncate max-w-[110px] text-[11px]">{email}</span>
    </div>
  );
}

export default function ReferralTree({ commissions = [], userEmail }) {
  const [l1Profiles, setL1Profiles] = useState([]);
  const [l2Profiles, setL2Profiles] = useState([]);
  const [l3Profiles, setL3Profiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }
    (async () => {
      try {
        const all = await base44.entities.AffiliateProfile.filter({}, '-created_date', 500);
        const l1 = all.filter(p => p.referred_by_email === userEmail);
        setL1Profiles(l1);
        const l1e = l1.map(p => p.user_email);
        const l2 = all.filter(p => l1e.includes(p.referred_by_email));
        setL2Profiles(l2);
        const l2e = l2.map(p => p.user_email);
        const l3 = all.filter(p => l2e.includes(p.referred_by_email));
        setL3Profiles(l3);
      } catch (e) {
        console.error('[Tree]', e);
      }
      setLoading(false);
    })();
  }, [userEmail]);

  const total = l1Profiles.length + l2Profiles.length + l3Profiles.length;

  if (loading) {
    return (
      <div className="rounded-2xl p-16 flex items-center justify-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (l1Profiles.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-3.5 border-b border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5" style={{ color: ORANGE }} />
            <span className="text-[11px] font-bold text-white uppercase tracking-[0.08em]">Network Tree</span>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${ORANGE}08`, border: `1px solid ${ORANGE}20` }}>
            <Users className="w-7 h-7" style={{ color: ORANGE }} />
          </div>
          <div className="text-sm font-bold text-white mb-1.5">No Referrals Yet</div>
          <div className="text-xs text-white/25">Share your referral link to start building your network</div>
          <button className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110"
            style={{ background: `${ORANGE}12`, color: ORANGE, border: `1px solid ${ORANGE}25` }}>
            <Share2 className="w-3 h-3" /> Go to Referral Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Level 1', count: l1Profiles.length, rate: '8%', color: ORANGE, bg: `${ORANGE}08`, bd: `${ORANGE}18` },
          { label: 'Level 2', count: l2Profiles.length, rate: '2%', color: '#818cf8', bg: 'rgba(129,140,248,0.06)', bd: 'rgba(129,140,248,0.16)' },
          { label: 'Level 3', count: l3Profiles.length, rate: '1%', color: '#c084fc', bg: 'rgba(192,132,252,0.06)', bd: 'rgba(192,132,252,0.16)' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-3.5 text-center" style={{ background: s.bg, border: `1px solid ${s.bd}` }}>
            <div className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.count}</div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-white/20">{s.label}</div>
            <div className="text-[10px] font-bold mt-1" style={{ color: s.color }}>{s.rate}</div>
          </motion.div>
        ))}
      </div>

      {/* Tree */}
      <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-3.5 border-b border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5" style={{ color: ORANGE }} />
              <span className="text-[11px] font-bold text-white uppercase tracking-[0.08em]">Network Tree</span>
            </div>
            <span className="text-[10px] text-white/15 font-mono">{total} total</span>
          </div>
        </div>
        <div className="p-5 overflow-x-auto">
          <div className="flex items-start gap-6 min-w-max">
            {/* Root */}
            <div className="flex flex-col items-center gap-1.5 pt-1">
              <div className="rounded-xl px-4 py-2.5 flex items-center gap-2"
                style={{ background: `${ORANGE}12`, border: `1.5px solid ${ORANGE}40`, boxShadow: `0 0 20px ${ORANGE}10` }}>
                <Zap className="w-3.5 h-3.5" style={{ color: ORANGE }} />
                <span className="text-sm font-black" style={{ color: ORANGE }}>YOU</span>
              </div>
              <span className="text-[9px] font-mono text-white/15 truncate max-w-[90px] text-center">{userEmail}</span>
            </div>

            <div className="flex items-center self-center pt-1"><ArrowRight className="w-4 h-4 text-white/8" /></div>

            {/* L1 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }} />
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/20">Level 1 · 8%</span>
              </div>
              {l1Profiles.slice(0, 10).map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                  <TraderBadge email={p.user_email} />
                </motion.div>
              ))}
              {l1Profiles.length > 10 && <div className="text-[10px] text-white/10 pl-1">+{l1Profiles.length - 10} more</div>}
            </div>

            {l2Profiles.length > 0 && (<>
              <div className="flex items-center self-center pt-1"><ArrowRight className="w-4 h-4 text-white/8" /></div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#818cf8' }} />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-white/20">Level 2 · 2%</span>
                </div>
                {l2Profiles.slice(0, 8).map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                    <TraderBadge email={p.user_email} />
                  </motion.div>
                ))}
                {l2Profiles.length > 8 && <div className="text-[10px] text-white/10 pl-1">+{l2Profiles.length - 8} more</div>}
              </div>
            </>)}

            {l3Profiles.length > 0 && (<>
              <div className="flex items-center self-center pt-1"><ArrowRight className="w-4 h-4 text-white/8" /></div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c084fc' }} />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-white/20">Level 3 · 1%</span>
                </div>
                {l3Profiles.slice(0, 6).map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                    <TraderBadge email={p.user_email} />
                  </motion.div>
                ))}
                {l3Profiles.length > 6 && <div className="text-[10px] text-white/10 pl-1">+{l3Profiles.length - 6} more</div>}
              </div>
            </>)}
          </div>
        </div>
      </div>
    </div>
  );
}