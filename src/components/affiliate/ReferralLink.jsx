import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Copy, CheckCircle2, Share2, Twitter, Send, Zap, ExternalLink } from 'lucide-react';

const ORANGE = '#CCFF00';
const CARD = '#15171e';
const BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.35)';

const LEVEL_TIERS = [
  { lvl: 'L1', pct: '8%', label: 'Direct Sales', color: ORANGE, desc: 'Every challenge purchase' },
  { lvl: 'L2', pct: '2%', label: 'Sub-referrals', color: '#818cf8', desc: "Your referrals' referrals" },
  { lvl: 'L3', pct: '1%', label: 'Depth 3', color: '#c084fc', desc: '3rd generation referrals' },
];

const PAYOUT_TIERS = [
  { traders: '0–9', rate: '7%', color: '#818cf8' },
  { traders: '10–24', rate: '11%', color: '#a78bfa' },
  { traders: '25–49', rate: '17%', color: '#fbbf24' },
  { traders: '50+', rate: '25%', color: ORANGE },
];

export default function ReferralLink({ profile }) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const refLink = profile ? `${window.location.origin}/?ref=${profile.referral_code}` : '';
  const code = profile?.referral_code || '—';

  const copy = async (text, setter) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* ── Referral Link Card ── */}
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${ORANGE}, #ff8c42, transparent)` }} />
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ORANGE}12`, border: `1px solid ${ORANGE}25` }}>
              <Link2 className="w-4 h-4" style={{ color: ORANGE }} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Your Referral Link</div>
              <div className="text-[10px] tracking-wide" style={{ color: 'rgba(255,255,255,0.25)' }}>Share to earn commissions</div>
            </div>
          </div>

          {/* Link bar */}
          <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="flex-1 text-xs font-mono text-white/60 truncate">{refLink || 'Loading...'}</span>
            <button onClick={() => copy(refLink, setCopied)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
              style={{
                background: copied ? 'rgba(16,185,129,0.12)' : `${ORANGE}12`,
                color: copied ? '#34d399' : ORANGE,
                border: `1px solid ${copied ? 'rgba(16,185,129,0.25)' : `${ORANGE}25`}`,
              }}>
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>

          {/* Code */}
          <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex-1">
              <div className="text-[9px] font-mono uppercase tracking-[0.15em] mb-1" style={{ color: MUTED }}>Referral Code</div>
              <div className="text-xl font-black font-mono tracking-[0.12em]" style={{ color: ORANGE }}>{code}</div>
            </div>
            <button onClick={() => copy(code, setCopiedCode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background: copiedCode ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                color: copiedCode ? '#34d399' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${copiedCode ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              {copiedCode ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Share buttons */}
          <div className="flex gap-2">
            {[
              { icon: Twitter, label: 'Twitter', href: `https://twitter.com/intent/tweet?text=Trade+with+me+on+XFunded+Trader!&url=${encodeURIComponent(refLink)}`, color: '#1d9bf0', bg: 'rgba(29,155,240,0.08)', bd: 'rgba(29,155,240,0.2)' },
              { icon: Send, label: 'Telegram', href: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=Trade+with+me+on+XFunded+Trader!`, color: '#2aabee', bg: 'rgba(42,171,238,0.08)', bd: 'rgba(42,171,238,0.2)' },
              { icon: Share2, label: 'Share', href: null, color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.03)', bd: 'rgba(255,255,255,0.07)', action: true },
            ].map(b => (
              b.href ? (
                <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                  style={{ background: b.bg, color: b.color, border: `1px solid ${b.bd}` }}>
                  <b.icon className="w-3.5 h-3.5" /> {b.label}
                </a>
              ) : (
                <button key={b.label} onClick={() => navigator.share?.({ url: refLink, title: 'XFunded Trader' })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                  style={{ background: b.bg, color: b.color, border: `1px solid ${b.bd}` }}>
                  <b.icon className="w-3.5 h-3.5" /> {b.label}
                </button>
              )
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Commission Structure ── */}
      <div className="rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-3.5 border-b border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" style={{ color: ORANGE }} />
            <span className="text-[11px] font-bold text-white uppercase tracking-[0.08em]">Multi-Level Commission Structure</span>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 mb-6">
            {LEVEL_TIERS.map(t => (
              <div key={t.lvl} className="rounded-xl p-4 text-center transition-all hover:brightness-110"
                style={{ background: `${t.color}06`, border: `1px solid ${t.color}18` }}>
                <div className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold mb-2"
                  style={{ background: `${t.color}14`, color: t.color, border: `1px solid ${t.color}22` }}>{t.lvl}</div>
                <div className="text-[28px] font-black mb-0.5 leading-none" style={{ color: t.color }}>{t.pct}</div>
                <div className="text-[11px] font-bold text-white/90 mb-0.5">{t.label}</div>
                <div className="text-[9px] text-white/25">{t.desc}</div>
              </div>
            ))}
          </div>

          <div className="text-[11px] font-bold text-white/90 mb-4 uppercase tracking-[0.08em]">Payout Reward Scaling</div>
          <div className="grid grid-cols-4 gap-2">
            {PAYOUT_TIERS.map(t => (
              <div key={t.traders} className="rounded-xl py-3 px-2 text-center transition-all hover:brightness-110"
                style={{ background: `${t.color}06`, border: `1px solid ${t.color}18` }}>
                <div className="text-[9px] text-white/25 mb-1.5">{t.traders} traders</div>
                <div className="text-lg font-black" style={{ color: t.color }}>{t.rate}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}