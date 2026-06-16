import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info, Flag, Percent, Layers, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';

const ACCENT = '#CCFF00';
const ACCENT_DIM = '#b3e600';
const CARD = '#1a1d25';
const BORDER = 'rgba(255,255,255,0.07)';

// ── 3D Icons ────────────────────────────────────────────────────────────────
function VaultIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="8" y="20" width="48" height="36" rx="6" fill={ACCENT} opacity="0.85" />
      <rect x="8" y="20" width="48" height="36" rx="6" fill="none" stroke={ACCENT_DIM} strokeWidth="1.5" />
      <rect x="12" y="24" width="40" height="28" rx="4" fill="#1a1a1a" opacity="0.3" />
      <circle cx="32" cy="38" r="10" fill="#1a1a1a" stroke={ACCENT} strokeWidth="2" />
      <circle cx="32" cy="38" r="3" fill={ACCENT} />
      <line x1="32" y1="28" x2="32" y2="32" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="44" x2="32" y2="48" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="38" x2="26" y2="38" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="38" x2="42" y2="38" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MoneyBagIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="44" rx="4" ry="2" fill={ACCENT} opacity="0.3" />
      <path d="M18 28C18 28, 20 14, 32 14C44 14, 46 28, 46 28L48 48C48 48, 46 52, 32 52C18 52, 16 48, 16 48Z" fill={ACCENT} opacity="0.85" stroke={ACCENT_DIM} strokeWidth="1.5" />
      <path d="M22 28C22 28, 26 22, 32 22C38 22, 42 28, 42 28" fill="#1a1a1a" opacity="0.3" />
      <text x="32" y="40" textAnchor="middle" fontSize="10" fontWeight="900" fill="#1a1a1a">$</text>
      <line x1="28" y1="22" x2="36" y2="22" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HourglassIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="44" rx="4" ry="2" fill={ACCENT} opacity="0.3" />
      <path d="M20 12L20 24C20 24, 22 32, 32 32C42 32, 44 24, 44 24L44 12Z" fill={ACCENT} opacity="0.85" stroke={ACCENT_DIM} strokeWidth="1.5" />
      <path d="M20 52L20 40C20 40, 22 32, 32 32C42 32, 44 40, 44 40L44 52Z" fill={ACCENT} opacity="0.85" stroke={ACCENT_DIM} strokeWidth="1.5" />
      <rect x="18" y="9" width="28" height="5" rx="2" fill={ACCENT} />
      <rect x="18" y="50" width="28" height="5" rx="2" fill={ACCENT} />
      <line x1="32" y1="14" x2="32" y2="28" stroke="#1a1a1a" strokeWidth="1" opacity="0.5" />
      <line x1="32" y1="36" x2="32" y2="50" stroke="#1a1a1a" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function AnimatedNumber({ value, prefix = '', decimals = 2 }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) return;
    const duration = 1000;
    const step = 16;
    const increment = end / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { start = end; clearInterval(timer); }
      setDisplayed(start);
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{decimals === 0 ? Math.round(displayed) : displayed.toFixed(decimals)}</>;
}

// ── Gradient Card Wrapper ───────────────────────────────────────────────────
function GradientCard({ children, className = '', noGlow = false }) {
  return (
    <div className={`relative rounded-[20px] overflow-hidden ${className}`}
      style={{
        background: CARD,
        border: `1px solid ${ACCENT}30`,
      }}>
      {!noGlow && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ background: `radial-gradient(ellipse 300px 200px at 0% 0%, ${ACCENT}08 0%, transparent 70%)` }} />
      )}
      {children}
    </div>
  );
}

// ── Perf Card ───────────────────────────────────────────────────────────────
function PerfCard({ label, value, sub, icon: IconComponent, highlight }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: highlight ? ACCENT : CARD,
        border: highlight ? 'none' : `1px solid ${BORDER}`,
        padding: '18px',
        minHeight: '130px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-1" style={{ color: highlight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.35)' }}>
          <span className="text-[11px] font-semibold">{label}</span>
          <Info className="w-3 h-3 opacity-50" />
        </div>
        <div className="text-[26px] font-black leading-tight" style={{ color: highlight ? '#000' : '#fff' }}>{value}</div>
        {sub && <div className="text-[10px] mt-1 underline cursor-pointer" style={{ color: highlight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.2)' }}>{sub}</div>}
      </div>
      {IconComponent && (
        <div className="absolute bottom-2 right-2 opacity-85">
          <IconComponent size={48} />
        </div>
      )}
    </motion.div>
  );
}

// ── Tier Segments ───────────────────────────────────────────────────────────
const TIERS = [
  { min: 0, max: 9, rate: 15, label: 'Tier 1', purchaseRate: 15, subPurchaseRate: 0, subAffiliateRate: 10 },
  { min: 10, max: 24, rate: 22, label: 'Tier 2', purchaseRate: 22, subPurchaseRate: 5, subAffiliateRate: 15 },
  { min: 25, max: 49, rate: 30, label: 'Tier 3', purchaseRate: 30, subPurchaseRate: 7, subAffiliateRate: 20 },
  { min: 50, max: Infinity, rate: 40, label: 'Tier 4', purchaseRate: 40, subPurchaseRate: 10, subAffiliateRate: 25 },
];

// ── Main Component ──────────────────────────────────────────────────────────
export default function AffiliateOverview({ commissions = [], profile, accounts = [] }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const totalEarned = commissions.reduce((s, c) => s + (c.commission_amount || 0), 0);
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + (c.commission_amount || 0), 0);

  const activeFunded = profile?.active_funded_traders || 0;
  const totalReferrals = profile?.total_referrals || 0;
  const currentTier = TIERS.find(t => activeFunded >= t.min && activeFunded <= t.max) || TIERS[0];
  const nextTier = TIERS.find(t => t.min > activeFunded);
  const tierPct = nextTier ? Math.min((activeFunded / nextTier.min) * 100, 100) : 100;

  const refCode = profile?.referral_code || '—';
  const refLink = profile ? `${window.location.origin}/?ref=${profile.referral_code}` : '';

  const nextRewardDate = (() => {
    const now = new Date();
    const day = now.getUTCDate();
    const next15 = day <= 15 ? 15 : (day <= 28 ? 28 : 15);
    let d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), next15, 0, 35));
    if (d <= now) {
      d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + (next15 === 15 ? 0 : 1), next15 === 15 ? 28 : 15, 0, 35));
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  })();

  const copyText = async (text, setter) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* ── Tier Progress Section ── */}
      <GradientCard>
        <div className="p-5 sm:p-6">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black"
                style={{ background: ACCENT, color: '#000' }}>
                {currentTier.label}
              </div>
              <span className="text-[10px] font-mono text-white/20">{activeFunded} Referred</span>
              {nextTier && (
                <span className="text-[10px] font-mono text-white/15">
                  {nextTier.min} Referred · <span className="inline-flex items-center px-2 py-0.5 rounded text-white/20" style={{ background: 'rgba(255,255,255,0.05)' }}>{nextTier.label}</span>
                </span>
              )}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(tierPct, 100)}%`, background: ACCENT, boxShadow: `0 0 12px ${ACCENT}40` }} />
            </div>
          </div>

          {/* Benefits Row */}
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">Benefits</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: `rgba(255,255,255,0.04)`, border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
              <Flag className="w-3 h-3" style={{ color: ACCENT }} /> First Purchase {currentTier.purchaseRate}%
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: `rgba(255,255,255,0.04)`, border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
              <Percent className="w-3 h-3" style={{ color: ACCENT }} /> Subsequent Purchase {currentTier.subPurchaseRate}%
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: `rgba(255,255,255,0.04)`, border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
              <Layers className="w-3 h-3" style={{ color: ACCENT }} /> Sub-affiliate {currentTier.subAffiliateRate}%
            </div>
          </div>

          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:brightness-110"
            style={{ background: 'transparent', color: ACCENT, border: `1px solid ${ACCENT}50` }}>
            View All Tiers <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </GradientCard>

      {/* ── Performance Overview ── */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3">Performance Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <PerfCard
            label="Total Commissions"
            value={`$${totalEarned.toFixed(2)}`}
            icon={VaultIcon}
            highlight
          />
          <PerfCard
            label="Available to Withdraw"
            value={`$${totalApproved.toFixed(2)}`}
            icon={MoneyBagIcon}
          />
          <PerfCard
            label="Next Reward Available"
            value={nextRewardDate}
            sub="View schedule"
            icon={HourglassIcon}
          />
        </div>

        {/* Referred Customers */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, padding: '18px', minHeight: '100px' }}>
            <div>
              <div className="text-[11px] font-semibold text-white/35 mb-1 flex items-center gap-1.5">New Referrals <Info className="w-3 h-3 opacity-40" /></div>
              <div className="text-[28px] font-black text-white">{totalReferrals}</div>
            </div>
            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[9px] font-black" style={{ background: ACCENT, color: '#000' }}>{currentTier.label}</span>
              <span className="text-[10px] font-bold ml-1.5" style={{ color: ACCENT }}>{currentTier.purchaseRate}%</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
            className="relative rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, padding: '18px', minHeight: '100px' }}>
            <div>
              <div className="text-[11px] font-semibold text-white/35 mb-1 flex items-center gap-1.5">Existing Referrals <Info className="w-3 h-3 opacity-40" /></div>
              <div className="text-[28px] font-black text-white">{activeFunded}</div>
            </div>
            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[9px] font-black" style={{ background: ACCENT, color: '#000' }}>{currentTier.label}</span>
              <span className="text-[10px] font-bold ml-1.5" style={{ color: ACCENT }}>{currentTier.subPurchaseRate}%</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Referral Details (Purple Block) ── */}
      <div className="relative rounded-[20px] overflow-hidden" style={{
        background: 'linear-gradient(135deg, #3b1f6e 0%, #2d1555 40%, #1e0f3a 100%)',
        border: `1px solid rgba(204,255,0,0.15)`,
      }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
          {/* Discount */}
          <div className="p-5 sm:p-6">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1.5">Discount for your customers</div>
            <div className="text-[42px] font-black leading-none" style={{ color: ACCENT }}>{currentTier.purchaseRate}%</div>
          </div>

          {/* Referral Code */}
          <div className="p-5 sm:p-6">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Referral Code</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                <span className="text-sm font-black font-mono tracking-[0.1em] text-white">{refCode}</span>
              </div>
              <button onClick={() => copyText(refCode, setCopiedCode)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap"
                style={{
                  background: copiedCode ? 'rgba(16,185,129,0.15)' : `${ACCENT}15`,
                  color: copiedCode ? '#34d399' : ACCENT,
                  border: `1px solid ${copiedCode ? 'rgba(16,185,129,0.3)' : `${ACCENT}30`}`,
                }}>
                {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="p-5 sm:p-6">
            <div className="text-[11px] font-bold text-white mb-1">Your Referral Link</div>
            <div className="text-[10px] text-white/25 mb-3">Get a commission from every challenge purchased with your link!</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl px-3 py-2.5 truncate"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-xs font-mono text-white/50 truncate block">{refLink}</span>
              </div>
              <button onClick={() => copyText(refLink, setCopiedLink)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap"
                style={{
                  background: copiedLink ? 'rgba(16,185,129,0.15)' : `${ACCENT}15`,
                  color: copiedLink ? '#34d399' : ACCENT,
                  border: `1px solid ${copiedLink ? 'rgba(16,185,129,0.3)' : `${ACCENT}30`}`,
                }}>
                {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pending Commissions Quick View ── */}
      {commissions.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-3.5 border-b border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.015)' }}>
            <span className="text-[11px] font-bold text-white uppercase tracking-[0.08em]">Pending Commissions · ${totalPending.toFixed(2)}</span>
          </div>
          <div className="divide-y divide-white/[0.025]">
            {commissions.filter(c => c.status === 'pending').slice(0, 5).map((c, i) => (
              <div key={c.id || i} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">{c.referred_email || 'Referral'}</div>
                  <div className="text-[9px] font-mono text-white/15">{c.commission_type === 'payout_reward' ? 'Payout Reward' : 'Challenge Purchase'} · L{c.level || 1}</div>
                </div>
                <div className="text-sm font-black text-emerald-400">+${(c.commission_amount || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}