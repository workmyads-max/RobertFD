import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Copy, CheckCircle, Share2, Twitter, Send } from 'lucide-react';

export default function ReferralLink({ profile }) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const refLink = profile ? `https://fundedfirms.com/?ref=${profile.referral_code}` : '';
  const code = profile?.referral_code || '—';

  const copy = async (text, setter) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const LEVEL_TIERS = [
    { lvl: 'L1', pct: '8%', label: 'Direct Sales', color: '#FF5C00', desc: 'On every challenge purchase' },
    { lvl: 'L2', pct: '2%', label: 'Sub-referrals', color: '#60a5fa', desc: 'From your referrals\' referrals' },
    { lvl: 'L3', pct: '1%', label: 'Depth 3', color: '#a78bfa', desc: '3rd generation referrals' },
  ];

  const PAYOUT_TIERS = [
    { traders: '0–9', rate: '7%', color: '#60a5fa' },
    { traders: '10+', rate: '11%', color: '#a78bfa' },
    { traders: '25+', rate: '17%', color: '#fbbf24' },
    { traders: '50+', rate: '25%', color: '#FF5C00' },
  ];

  return (
    <div className="space-y-5">
      {/* Link Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Link className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold">Your Referral Link</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="flex-1 text-sm font-mono text-foreground truncate">{refLink || 'Loading...'}</span>
          <button onClick={() => copy(refLink, setCopied)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0"
            style={{
              background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,92,0,0.2)',
              color: copied ? '#10b981' : '#FF5C00',
              border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,92,0,0.4)'}`,
            }}>
            {copied ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>

        {/* Code */}
        <div className="flex items-center justify-between p-3 rounded-xl mb-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Referral Code</div>
            <div className="text-xl font-black text-primary font-mono tracking-widest">{code}</div>
          </div>
          <button onClick={() => copy(code, setCopiedCode)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: copiedCode ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: copiedCode ? '#10b981' : 'hsl(var(--muted-foreground))', border: '1px solid rgba(255,255,255,0.1)' }}>
            {copiedCode ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copiedCode ? 'Copied' : 'Copy Code'}
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2">
          <a href={`https://twitter.com/intent/tweet?text=Join%20Funded%20Firms%20with%20my%20referral%20link!&url=${encodeURIComponent(refLink)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(29,161,242,0.1)', color: '#1da1f2', border: '1px solid rgba(29,161,242,0.3)' }}>
            <Twitter className="w-3 h-3" /> Twitter
          </a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=Trade+with+Funded+Firms!`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(0,136,204,0.1)', color: '#0088cc', border: '1px solid rgba(0,136,204,0.3)' }}>
            <Send className="w-3 h-3" /> Telegram
          </a>
          <button onClick={() => navigator.share?.({ url: refLink, title: 'Funded Firms' })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'hsl(var(--muted-foreground))', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Share2 className="w-3 h-3" /> Share
          </button>
        </div>
      </motion.div>

      {/* Commission Tiers */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-xs font-bold text-foreground mb-4 uppercase tracking-widest">Multi-Level Commission Structure</div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {LEVEL_TIERS.map(t => (
            <div key={t.lvl} className="rounded-xl p-4 text-center"
              style={{ background: `${t.color}0d`, border: `1px solid ${t.color}25` }}>
              <div className="text-[10px] font-mono mb-1" style={{ color: t.color }}>{t.lvl}</div>
              <div className="text-2xl font-black mb-0.5" style={{ color: t.color }}>{t.pct}</div>
              <div className="text-xs font-semibold text-foreground mb-0.5">{t.label}</div>
              <div className="text-[10px] text-muted-foreground">{t.desc}</div>
            </div>
          ))}
        </div>

        <div className="text-xs font-bold text-foreground mb-3 uppercase tracking-widest">Payout Reward Scaling</div>
        <div className="grid grid-cols-4 gap-2">
          {PAYOUT_TIERS.map(t => (
            <div key={t.traders} className="rounded-xl p-3 text-center"
              style={{ background: `${t.color}0d`, border: `1px solid ${t.color}25` }}>
              <div className="text-[10px] font-mono text-muted-foreground mb-1">{t.traders} traders</div>
              <div className="text-xl font-black" style={{ color: t.color }}>{t.rate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}