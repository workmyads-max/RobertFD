import React, { useState } from 'react';
import { Link as LinkIcon, Copy, CheckCircle2, Share2, Twitter, Send } from 'lucide-react';

const ACCENT = '#FF5C00';

export default function ReferralLinkCard({ profile }) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const refLink = profile?.referral_code
    ? `https://xfundedtrader.com/register?ref=${profile.referral_code}`
    : '';
  const code = profile?.referral_code || '-';

  const copy = async (text, setter) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch (e) {
      // fallback
    }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#16181e', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Thin orange top border */}
      <div className="h-0.5" style={{ background: ACCENT }} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>
            <LinkIcon className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">Your Referral Link</div>
            <div className="text-xs text-white/40">Share to earn commissions</div>
          </div>
        </div>

        {/* URL input with Copy Link button */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg mb-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="flex-1 text-sm text-white/60 truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {refLink || 'Loading...'}
          </span>
          <button onClick={() => copy(refLink, setCopied)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap"
            style={{
              background: copied ? 'rgba(16,185,129,0.12)' : `${ACCENT}15`,
              color: copied ? '#10b981' : ACCENT,
              border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : `${ACCENT}30`}`,
            }}>
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>

        {/* Referral Code block */}
        <div className="flex items-center gap-4 px-4 py-4 rounded-lg mb-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex-1">
            <div className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-1.5">Referral Code</div>
            <div className="text-2xl font-black tracking-[0.15em]" style={{ color: ACCENT, fontFamily: 'JetBrains Mono, monospace' }}>
              {code}
            </div>
          </div>
          <button onClick={() => copy(code, setCopiedCode)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all"
            style={{
              background: copiedCode ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
              color: copiedCode ? '#10b981' : '#888',
              border: `1px solid ${copiedCode ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }}>
            {copiedCode ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copiedCode ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Social actions row */}
        <div className="flex gap-2">
          <a href={`https://twitter.com/intent/tweet?text=Join%20XFunded%20Trader%20with%20my%20link!&url=${encodeURIComponent(refLink)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all hover:opacity-80"
            style={{ background: 'rgba(29,161,242,0.1)', color: '#1da1f2', border: '1px solid rgba(29,161,242,0.2)' }}>
            <Twitter className="w-3.5 h-3.5" /> Twitter
          </a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=Trade+with+XFunded+Trader!`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all hover:opacity-80"
            style={{ background: 'rgba(0,136,204,0.1)', color: '#0088cc', border: '1px solid rgba(0,136,204,0.2)' }}>
            <Send className="w-3.5 h-3.5" /> Telegram
          </a>
          <button onClick={() => navigator.share?.({ url: refLink, title: 'XFunded Trader' })}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#888', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}