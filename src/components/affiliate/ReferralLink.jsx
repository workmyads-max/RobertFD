import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Copy, CheckCircle2, Share2, Twitter, Send, Zap } from 'lucide-react';

const ACCENT = '#FF5C00';

const LEVEL_TIERS = [
  { lvl: 'L1', pct: '8%', label: 'Direct Sales', color: '#FF5C00', desc: 'Every challenge purchase' },
  { lvl: 'L2', pct: '2%', label: 'Sub-referrals', color: '#6366f1', desc: "Your referrals' referrals" },
  { lvl: 'L3', pct: '1%', label: 'Depth 3', color: '#a78bfa', desc: '3rd generation referrals' },
];

const PAYOUT_TIERS = [
  { traders: '0–9', rate: '7%', color: '#6366f1' },
  { traders: '10–24', rate: '11%', color: '#a78bfa' },
  { traders: '25–49', rate: '17%', color: '#fbbf24' },
  { traders: '50+', rate: '25%', color: '#FF5C00' },
];

export default function ReferralLink({ profile }) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  // Official referral link — points to the register page with ?ref=CODE so the
  // visitor's referral is captured before authentication and attributed on signup.
  const refLink = profile?.referral_code
    ? `https://xfundedtrader.com/register?ref=${profile.referral_code}`
    : '';
  const code = profile?.referral_code || '—';

  const copy = async (text, setter) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#1a1d25', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${ACCENT}, #FF7A2F, transparent)` }} />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>
              <Link className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Your Referral Link</div>
              <div className="text-[10px] font-mono text-white/30">Share to earn commissions</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="flex-1 text-sm font-mono text-white/70 truncate">{refLink || 'Loading...'}</span>
            <button onClick={() => copy(refLink, setCopied)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: copied ? 'rgba(16,185,129,0.15)' : `${ACCENT}15`, color: copied ? '#10b981' : ACCENT, border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : `${ACCENT}30`}` }}>
              {copied ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
            </button>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-xl mb-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex-1">
              <div className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-1">Referral Code</div>
              <div className="text-xl font-black font-mono tracking-[0.15em]" style={{ color: ACCENT }}>{code}</div>
            </div>
            <button onClick={() => copy(code, setCopiedCode)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: copiedCode ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', color: copiedCode ? '#10b981' : '#888', border: `1px solid ${copiedCode ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
              {copiedCode ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedCode ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex gap-2">
            <a href={`https://twitter.com/intent/tweet?text=Join%20XFunded%20Trader%20with%20my%20link!&url=${encodeURIComponent(refLink)}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(29,161,242,0.1)', color: '#1da1f2', border: '1px solid rgba(29,161,242,0.2)' }}>
              <Twitter className="w-3.5 h-3.5" /> Twitter
            </a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=Trade+with+XFunded+Trader!`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(0,136,204,0.1)', color: '#0088cc', border: '1px solid rgba(0,136,204,0.2)' }}>
              <Send className="w-3.5 h-3.5" /> Telegram
            </a>
            <button onClick={() => navigator.share?.({ url: refLink, title: 'XFunded Trader' })}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#888', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>
      </motion.div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#1a1d25', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-4 border-b border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Multi-Level Commission Structure</span>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 mb-6">
            {LEVEL_TIERS.map(t => (
              <div key={t.lvl} className="rounded-xl p-4 text-center transition-all hover:scale-[1.02]"
                style={{ background: `${t.color}08`, border: `1px solid ${t.color}20` }}>
                <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black mb-2"
                  style={{ background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}25` }}>{t.lvl}</div>
                <div className="text-3xl font-black mb-1" style={{ color: t.color }}>{t.pct}</div>
                <div className="text-xs font-bold text-white mb-0.5">{t.label}</div>
                <div className="text-[10px] text-white/30">{t.desc}</div>
              </div>
            ))}
          </div>
          <div className="text-xs font-bold text-white mb-4 uppercase tracking-wider">Payout Reward Scaling</div>
          <div className="grid grid-cols-4 gap-2">
            {PAYOUT_TIERS.map(t => (
              <div key={t.traders} className="rounded-xl p-3 text-center transition-all hover:scale-[1.02]"
                style={{ background: `${t.color}08`, border: `1px solid ${t.color}20` }}>
                <div className="text-[10px] font-mono text-white/30 mb-1.5">{t.traders} traders</div>
                <div className="text-xl font-black" style={{ color: t.color }}>{t.rate}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}