import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, Star, Trophy, Zap, Eye, Loader2, ExternalLink, Flag, Percent, Layers } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CertificateDocument from './CertificateDocument';

const FIRM = { name: 'XFUNDED TRADER', website: 'xfundedtrader.com' };

const ACCENT = '#CCFF00';
const ACCENT_DIM = '#B8E600';

const CERT_TYPES = {
  phase1_passed: { label: 'Phase 1', color: '#FF5C00', icon: Star, tier: 1 },
  phase2_passed: { label: 'Phase 2', color: '#FF5C00', icon: Trophy, tier: 2 },
  funded:        { label: 'Funded',  color: '#CCFF00', icon: Award, tier: 3 },
  first_payout:  { label: 'Withdrawal', color: '#10b981', icon: Zap, tier: 4 },
  consistency:   { label: 'Consistency', color: '#a78bfa', icon: Star, tier: 5 },
  special:       { label: 'Special', color: '#f59e0b', icon: Award, tier: 6 },
};

const TIERS = [
  { tier: 1, label: 'Phase 1', target: 'Pass Phase 1' },
  { tier: 2, label: 'Phase 2', target: 'Pass Phase 2' },
  { tier: 3, label: 'Funded', target: 'Get Funded' },
  { tier: 4, label: 'Withdrawal', target: 'First Payout' },
  { tier: 5, label: 'Consistency', target: 'Consistent Trading' },
];

// ── PDF Download ────────────────────────────────────────────────────────────
async function downloadPDF(cert, setLoading) {
  setLoading(true);
  const W = 1400;
  const H = Math.round(W / 1.414);

  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-9999px;top:0;width:${W}px;height:${H}px;z-index:-1;`;
  document.body.appendChild(container);

  const { createRoot } = await import('react-dom/client');
  const root = createRoot(container);
  await new Promise(r => {
    root.render(React.createElement(CertificateDocument, { cert, forCapture: true }));
    setTimeout(r, 500);
  });

  const certEl = container.querySelector('div');
  const canvas = await html2canvas(certEl, {
    scale: 2, useCORS: true, backgroundColor: '#05060a', logging: false,
    width: W, height: H,
  });
  root.unmount();
  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png');
  const pdfW = canvas.width / 2;
  const pdfH = canvas.height / 2;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [pdfW, pdfH] });
  pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
  pdf.save(`XFunded-Certificate-${cert.certificate_id || Date.now()}.pdf`);
  setLoading(false);
}

// ── 3D-style Icons ──────────────────────────────────────────────────────────
function VaultIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="8" y="20" width="48" height="36" rx="6" fill="#CCFF00" opacity="0.85" />
      <rect x="8" y="20" width="48" height="36" rx="6" fill="none" stroke="#AADD00" strokeWidth="1.5" />
      <rect x="12" y="24" width="40" height="28" rx="4" fill="#1a1a1a" opacity="0.3" />
      <circle cx="32" cy="38" r="10" fill="#1a1a1a" stroke="#CCFF00" strokeWidth="2" />
      <circle cx="32" cy="38" r="3" fill="#CCFF00" />
      <line x1="32" y1="28" x2="32" y2="32" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="44" x2="32" y2="48" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="38" x2="26" y2="38" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="38" x2="42" y2="38" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MoneyBagIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="44" rx="4" ry="2" fill="#CCFF00" opacity="0.3" />
      <path d="M18 28C18 28, 20 14, 32 14C44 14, 46 28, 46 28L48 48C48 48, 46 52, 32 52C18 52, 16 48, 16 48Z" fill="#CCFF00" opacity="0.85" stroke="#AADD00" strokeWidth="1.5" />
      <path d="M22 28C22 28, 26 22, 32 22C38 22, 42 28, 42 28" fill="#1a1a1a" opacity="0.3" />
      <text x="32" y="40" textAnchor="middle" fontSize="10" fontWeight="900" fill="#1a1a1a">$</text>
      <line x1="28" y1="22" x2="36" y2="22" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HourglassIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="44" rx="4" ry="2" fill="#CCFF00" opacity="0.3" />
      <path d="M20 12L20 24C20 24, 22 32, 32 32C42 32, 44 24, 44 24L44 12Z" fill="#CCFF00" opacity="0.85" stroke="#AADD00" strokeWidth="1.5" />
      <path d="M20 52L20 40C20 40, 22 32, 32 32C42 32, 44 40, 44 40L44 52Z" fill="#CCFF00" opacity="0.85" stroke="#AADD00" strokeWidth="1.5" />
      <rect x="18" y="9" width="28" height="5" rx="2" fill="#CCFF00" />
      <rect x="18" y="50" width="28" height="5" rx="2" fill="#CCFF00" />
      <line x1="32" y1="14" x2="32" y2="28" stroke="#1a1a1a" strokeWidth="1" opacity="0.5" />
      <line x1="32" y1="36" x2="32" y2="50" stroke="#1a1a1a" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

// ── Tier Progress Bar ───────────────────────────────────────────────────────
function TierProgress({ achievedTiers }) {
  const maxTier = Math.max(...achievedTiers, 0);
  const nextTier = TIERS.find(t => t.tier > maxTier) || TIERS[TIERS.length - 1];

  return (
    <div style={{ background: '#121212', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', marginBottom: '20px' }}>
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span style={{ background: ACCENT, color: '#000', fontWeight: 800, fontSize: '11px', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>
            TIER {maxTier || 1}
          </span>
          <span className="text-white/40 text-xs">{achievedTiers.length} Achieved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs">{TIERS.length} Total</span>
          <span style={{ background: '#1a1a1a', color: '#666', fontWeight: 700, fontSize: '11px', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em', border: '1px solid rgba(255,255,255,0.08)' }}>
            TIER {TIERS.length}
          </span>
        </div>
      </div>

      {/* Progress line */}
      <div className="relative h-2 rounded-full mb-3" style={{ background: '#1a1a1a' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(maxTier / TIERS.length) * 100}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: ACCENT }}
        />
        {TIERS.map((t) => (
          <div
            key={t.tier}
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all"
            style={{
              left: `${(t.tier / TIERS.length) * 100}%`,
              background: t.tier <= maxTier ? ACCENT : '#1a1a1a',
              borderColor: t.tier <= maxTier ? ACCENT : 'rgba(255,255,255,0.15)',
              marginLeft: '-5px',
            }}
          />
        ))}
      </div>

      {/* Benefits pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-white/60 text-xs font-semibold">Benefits</span>
        {[
          { icon: Flag, label: 'Phase Pass 15% Off' },
          { icon: Percent, label: 'Funded Bonus 5%' },
          { icon: Layers, label: 'Payout Priority' },
        ].map((b, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', color: '#999' }}>
            <b.icon className="w-3 h-3" style={{ color: ACCENT }} />
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Performance Overview Cards ──────────────────────────────────────────────
function PerfCard({ label, value, sub, icon: IconComponent, highlight, variant = 'default' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: highlight ? ACCENT : '#1a1a1a',
        border: highlight ? 'none' : '1px solid rgba(255,255,255,0.06)',
        padding: '20px',
        minHeight: '140px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}
    >
      <div>
        <div className="flex items-center gap-1.5 mb-1" style={{ color: highlight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)' }}>
          <span className="text-xs font-semibold">{label}</span>
        </div>
        <div className="text-3xl font-black" style={{ color: highlight ? '#000' : '#fff' }}>{value}</div>
        {sub && <div className="text-xs mt-1 underline" style={{ color: highlight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.25)' }}>{sub}</div>}
      </div>
      {IconComponent && (
        <div className="absolute bottom-3 right-3 opacity-80">
          <IconComponent size={52} />
        </div>
      )}
    </motion.div>
  );
}

// ── Cert List Item ──────────────────────────────────────────────────────────
function CertListItem({ cert, index, onPreview }) {
  const cfg = CERT_TYPES[cert.type] || CERT_TYPES.phase1_passed;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer group transition-all hover:bg-white/[0.02]"
      style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.05)' }}
      onClick={() => onPreview(cert)}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
        {React.createElement(cfg.icon, { className: 'w-5 h-5', style: { color: cfg.color } })}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white truncate">{cert.trader_name || 'Trader'}</div>
        <div className="text-[11px] text-white/30">
          {cfg.label} • {cert.issue_date || '—'}
          {cert.withdrawal_amount ? ` • $${Number(cert.withdrawal_amount).toLocaleString()}` : ''}
          {cert.account_size && !cert.withdrawal_amount ? ` • $${Number(cert.account_size).toLocaleString()}` : ''}
        </div>
      </div>
      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
        {cfg.label}
      </span>
      <Eye className="w-4 h-4 text-white/15 group-hover:text-white/40 transition-colors" />
    </motion.div>
  );
}

// ── Cert Achievements Card ──────────────────────────────────────────────────
function CertAchievementCard({ label, count, certType, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-5 flex flex-col justify-between"
      style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', minHeight: '120px' }}
    >
      <div>
        <div className="text-white/40 text-xs font-semibold mb-1">{label}</div>
        <div className="text-3xl font-black text-white">{count}</div>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
          {certType.toUpperCase()}
        </span>
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] font-semibold" style={{ color }}>{CERT_TYPES[certType]?.label || certType}</span>
      </div>
    </motion.div>
  );
}

// ── Preview Modal ───────────────────────────────────────────────────────────
function CertPreviewModal({ cert, onClose }) {
  const [downloading, setDownloading] = useState(false);
  if (!cert) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()} className="w-full max-w-4xl">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white/30 hover:text-white text-3xl font-light">×</button>
        <div className="w-full mb-4"><CertificateDocument cert={cert} /></div>
        <div className="flex justify-center">
          <button onClick={() => downloadPDF(cert, setDownloading)} disabled={downloading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
            style={{ background: ACCENT }}>
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Generating...' : 'Download as PDF'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function Certificates({ user }) {
  const [previewCert, setPreviewCert] = useState(null);

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certificates', user?.email],
    queryFn: () => base44.entities.Certificate.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const achievedTiers = [...new Set(certs.map(c => {
    const ct = CERT_TYPES[c.type];
    return ct?.tier || 0;
  }).filter(Boolean))];

  const phaseCerts = certs.filter(c => c.type === 'phase1_passed' || c.type === 'phase2_passed');
  const fundedCerts = certs.filter(c => c.type === 'funded');
  const payoutCerts = certs.filter(c => c.type === 'first_payout');

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Certificates</h1>
          <p className="text-xs text-white/30">Your achievement record from {FIRM.name}</p>
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-black transition-all hover:opacity-90"
          style={{ background: ACCENT }}>
          View All Tiers <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Tier Progress */}
      <TierProgress achievedTiers={achievedTiers} />

      {/* Performance Overview */}
      <div className="mb-3">
        <h2 className="text-sm font-bold text-white mb-4">Performance Overview</h2>
      </div>

      {/* Top row: 3 large cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <PerfCard
          label="Total Certificates"
          value={certs.length}
          icon={VaultIcon}
          highlight
        />
        <PerfCard
          label="Latest Achievement"
          value={certs.length > 0 ? (CERT_TYPES[certs[0]?.type]?.label || '—') : '—'}
          sub={certs.length > 0 ? (certs[0]?.issue_date || '') : 'No certificates yet'}
          icon={MoneyBagIcon}
        />
        <PerfCard
          label="Next Milestone"
          value={(() => {
            if (payoutCerts.length === 0) return 'First Payout';
            if (fundedCerts.length === 0) return 'Get Funded';
            if (phaseCerts.length < 2) return 'Pass Phase 2';
            return 'All Achieved';
          })()}
          sub="Keep trading consistently"
          icon={HourglassIcon}
        />
      </div>

      {/* Bottom row: achievement category cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <CertAchievementCard label="Phase Certificates" count={phaseCerts.length} certType="phase1_passed" icon={Star} color="#FF5C00" />
        <CertAchievementCard label="Funded Certificates" count={fundedCerts.length} certType="funded" icon={Award} color="#CCFF00" />
        <CertAchievementCard label="Payout Certificates" count={payoutCerts.length} certType="first_payout" icon={Zap} color="#10b981" />
      </div>

      {/* Certificate List */}
      <div className="mt-8">
        <h2 className="text-sm font-bold text-white mb-4">All Certificates</h2>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-[#CCFF00]/30 border-t-[#CCFF00] rounded-full animate-spin" />
          </div>
        ) : certs.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/[0.06]" style={{ background: '#121212' }}>
            <Award className="w-10 h-10 mx-auto mb-3" style={{ color: '#CCFF00', opacity: 0.25 }} />
            <div className="text-base font-bold text-white/30 mb-1">No Certificates Yet</div>
            <p className="text-xs text-white/15">Complete a challenge phase or receive your first payout.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {certs.map((c, i) => (
              <CertListItem key={c.id} cert={c} index={i} onPreview={setPreviewCert} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewCert && <CertPreviewModal cert={previewCert} onClose={() => setPreviewCert(null)} />}
      </AnimatePresence>
    </div>
  );
}