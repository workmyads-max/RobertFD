import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, CheckCircle, Shield, Star, Trophy, Zap, Crown, Eye, Loader2, QrCode, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import XFLogo from '@/components/shared/XFLogo';

const FIRM = {
  name: 'XFUNDED TRADER',
  tagline: 'ELITE PROPRIETARY TRADING FIRM',
  website: 'xfundedtrader.com',
  verifyUrl: 'xfundedtrader.com/verify',
  address: 'Dubai International Financial Centre, UAE',
  ceo: 'Diego Reyes',
};

const CERT_CONFIG = {
  phase1_passed: { title: 'PHASE 1 EVALUATION', badge: 'PHASE 1', color: '#FF5C00', gold: '#C5A059', icon: Star },
  phase2_passed: { title: 'PHASE 2 EVALUATION', badge: 'PHASE 2', color: '#FF5C00', gold: '#C5A059', icon: Trophy },
  funded:        { title: 'FUNDED TRADER',       badge: 'FUNDED',  color: '#CCFF00', gold: '#C5A059', icon: Award },
  first_payout:  { title: 'WITHDRAWAL',           badge: 'WITHDRAWAL', color: '#10b981', gold: '#C5A059', icon: Zap },
  consistency:   { title: 'CONSISTENCY AWARD',    badge: 'CONSISTENCY', color: '#a78bfa', gold: '#C5A059', icon: Shield },
  special:       { title: 'SPECIAL ACHIEVEMENT',  badge: 'SPECIAL', color: '#f59e0b', gold: '#C5A059', icon: Crown },
};

// ─── Trading chart watermark SVG ───────────────────────────────────────────────
function ChartWatermark() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }}>
      {Array.from({ length: 20 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 14} x2="400" y2={i * 14} stroke="#C5A059" strokeWidth="0.3" />
      ))}
      {Array.from({ length: 28 }, (_, i) => (
        <line key={`v${i}`} x1={i * 14.5} y1="0" x2={i * 14.5} y2="280" stroke="#C5A059" strokeWidth="0.3" />
      ))}
      {/* Candlestick chart pattern */}
      <rect x="30" y="160" width="6" height="40" rx="1" fill="#C5A059" opacity="0.6" />
      <line x1="33" y1="140" x2="33" y2="210" stroke="#C5A059" strokeWidth="0.8" opacity="0.5" />
      <rect x="50" y="130" width="6" height="50" rx="1" fill="#C5A059" opacity="0.5" />
      <line x1="53" y1="110" x2="53" y2="190" stroke="#C5A059" strokeWidth="0.8" opacity="0.5" />
      <rect x="70" y="150" width="6" height="30" rx="1" fill="#C5A059" opacity="0.4" />
      <line x1="73" y1="140" x2="73" y2="190" stroke="#C5A059" strokeWidth="0.8" opacity="0.5" />
      <rect x="90" y="120" width="6" height="70" rx="1" fill="#C5A059" opacity="0.65" />
      <line x1="93" y1="90" x2="93" y2="200" stroke="#C5A059" strokeWidth="0.8" opacity="0.5" />
      <rect x="110" y="140" width="6" height="45" rx="1" fill="#C5A059" opacity="0.5" />
      <line x1="113" y1="125" x2="113" y2="195" stroke="#C5A059" strokeWidth="0.8" opacity="0.5" />
      <rect x="130" y="100" width="6" height="80" rx="1" fill="#C5A059" opacity="0.7" />
      <line x1="133" y1="70" x2="133" y2="190" stroke="#C5A059" strokeWidth="0.8" opacity="0.5" />
      <rect x="150" y="90" width="6" height="90" rx="1" fill="#C5A059" opacity="0.75" />
      <line x1="153" y1="60" x2="153" y2="190" stroke="#C5A059" strokeWidth="0.8" opacity="0.5" />
      <rect x="170" y="110" width="6" height="60" rx="1" fill="#C5A059" opacity="0.6" />
      <line x1="173" y1="90" x2="173" y2="180" stroke="#C5A059" strokeWidth="0.8" opacity="0.5" />
      <rect x="190" y="80" width="6" height="100" rx="1" fill="#C5A059" opacity="0.8" />
      <line x1="193" y1="50" x2="193" y2="190" stroke="#C5A059" strokeWidth="0.8" opacity="0.5" />
      <rect x="210" y="95" width="6" height="70" rx="1" fill="#C5A059" opacity="0.65" />
      <line x1="213" y1="70" x2="213" y2="175" stroke="#C5A059" strokeWidth="0.8" opacity="0.5" />
      <rect x="230" y="75" width="6" height="95" rx="1" fill="#C5A059" opacity="0.75" />
      <line x1="233" y1="50" x2="233" y2="180" stroke="#C5A059" strokeWidth="0.8" opacity="0.5" />
      <polyline points="33,180 53,165 73,180 93,140 113,175 133,120 153,110 173,140 193,100 213,130 233,95"
        fill="none" stroke="#C5A059" strokeWidth="0.6" opacity="0.5" strokeDasharray="2 2" />
    </svg>
  );
}

// ─── Gold decorative corner ────────────────────────────────────────────────────
function GoldCorner({ position }) {
  const rotations = { tl: 0, tr: 90, bl: -90, br: 180 };
  const style = {
    tl: { top: 0, left: 0 },
    tr: { top: 0, right: 0 },
    bl: { bottom: 0, left: 0 },
    br: { bottom: 0, right: 0 },
  };
  return (
    <div style={{ position: 'absolute', ...style[position], width: '60px', height: '60px', pointerEvents: 'none', transform: `rotate(${rotations[position]}deg)` }}>
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <rect x="2" y="2" width="56" height="56" rx="0" fill="none" />
        <line x1="4" y1="4" x2="30" y2="4" stroke="#C5A059" strokeWidth="1.5" opacity="0.8" />
        <line x1="4" y1="4" x2="4" y2="30" stroke="#C5A059" strokeWidth="1.5" opacity="0.8" />
        <line x1="4" y1="14" x2="20" y2="4" stroke="#C5A059" strokeWidth="0.5" opacity="0.4" />
        <circle cx="10" cy="10" r="2" fill="#FF5C00" opacity="0.7" />
      </svg>
    </div>
  );
}

// ─── XF Seal ───────────────────────────────────────────────────────────────────
function XFSeal({ color = '#C5A059' }) {
  return (
    <div style={{ width: '70px', height: '70px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
        {/* Outer ring */}
        <circle cx="35" cy="35" r="33" fill="none" stroke={color} strokeWidth="1.5" opacity="0.8" />
        <circle cx="35" cy="35" r="30" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5" />
        {/* Inner ring */}
        <circle cx="35" cy="35" r="24" fill="none" stroke={color} strokeWidth="0.8" opacity="0.6" />
        {/* XF monogram */}
        <text x="35" y="42" textAnchor="middle" fontSize="22" fontWeight="900" fill={color} fontFamily="serif" opacity="0.95">XF</text>
        {/* Dots around ring */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
          const rad = (deg * Math.PI) / 180;
          const cx = 35 + 27 * Math.cos(rad);
          const cy = 35 + 27 * Math.sin(rad);
          return <circle key={deg} cx={cx} cy={cy} r="1.5" fill={color} opacity="0.7" />;
        })}
      </svg>
    </div>
  );
}

// ─── Phase Badge ───────────────────────────────────────────────────────────────
function PhaseBadge({ label, color = '#FF5C00' }) {
  return (
    <div style={{
      background: '#050505',
      border: `1.5px solid ${color}`,
      borderRadius: '6px',
      padding: '6px 14px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, opacity: 0.8 }} />
      <span style={{ color, fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Pixel-perfect Certificate Document ────────────────────────────────────────
function CertificateDocument({ cert, forCapture = false }) {
  const cfg = CERT_CONFIG[cert.type] || CERT_CONFIG.phase1_passed;
  const isWithdrawal = cert.type === 'first_payout' || cert.type === 'withdrawal';
  const certLabel = isWithdrawal ? 'OF WITHDRAWAL' : 'OF COMPLETION';
  const achievementText = isWithdrawal
    ? 'Successfully processed a withdrawal from'
    : cert.type === 'phase2_passed'
      ? 'For successfully completing the'
      : 'For successfully completing the';
  const highlightText = isWithdrawal
    ? 'XFUNDED TRADER'
    : cert.type === 'phase1_passed'
      ? 'PHASE 1 EVALUATION'
      : cert.type === 'phase2_passed'
        ? 'PHASE 2 EVALUATION'
        : 'FUNDED TRADER PROGRAM';

  return (
    <div
      style={{
        width: forCapture ? '1400px' : '100%',
        aspectRatio: '1.414 / 1',
        background: 'linear-gradient(135deg, #fafaf8 0%, #f5f3ef 30%, #f8f6f2 60%, #f3f1ec 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Inter", "Georgia", "Times New Roman", serif',
        borderRadius: forCapture ? '0' : '12px',
        boxShadow: forCapture ? 'none' : '0 20px 60px rgba(0,0,0,0.4)',
        flexShrink: 0,
        color: '#1a1a1a',
      }}
    >
      {/* Obsidian border frame */}
      <div style={{ position: 'absolute', inset: '20px', border: '2px solid #1a1a1a', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '24px', border: '1px solid #C5A059', opacity: 0.6, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '28px', border: '1px solid #1a1a1a', opacity: 0.3, pointerEvents: 'none' }} />

      {/* Gold corners */}
      <GoldCorner position="tl" />
      <GoldCorner position="tr" />
      <GoldCorner position="bl" />
      <GoldCorner position="br" />

      {/* Chart watermark */}
      <ChartWatermark />

      {/* Header section */}
      <div style={{
        position: 'absolute', top: '40px', left: '50px', right: '50px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(197,160,89,0.4)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <XFLogo size="sm" />
        </div>

        {/* Badge */}
        <PhaseBadge label={cfg.badge} color={cfg.color} />
      </div>

      {/* Main content */}
      <div style={{
        position: 'absolute', top: '110px', left: '50px', right: '50px', bottom: '90px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* CERTIFICATE title */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '44px', fontWeight: 900, color: '#1a1a1a', letterSpacing: '0.08em', fontFamily: '"Times New Roman", Georgia, serif', lineHeight: 1.1 }}>
            CERTIFICATE
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: cfg.color, letterSpacing: '0.35em', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
            {certLabel}
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '500px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #C5A059)' }} />
          <div style={{ width: '8px', height: '8px', background: '#C5A059', transform: 'rotate(45deg)', margin: '0 14px', boxShadow: '0 0 8px rgba(197,160,89,0.5)' }} />
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #C5A059, transparent)' }} />
        </div>

        {/* Presented to */}
        <div style={{ color: '#666', fontSize: '11px', letterSpacing: '0.25em', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '12px' }}>
          PROUDLY PRESENTED TO
        </div>

        {/* Trader name — elegant script style */}
        <div style={{
          fontSize: '48px', fontWeight: 400, color: '#1a1a1a',
          fontFamily: '"Georgia", "Times New Roman", "Brush Script MT", serif',
          fontStyle: 'italic',
          textAlign: 'center',
          marginBottom: '16px',
          lineHeight: 1.1,
        }}>
          {cert.trader_name || 'Your Name'}
        </div>

        {/* Achievement text */}
        <div style={{
          color: '#555', fontSize: '13px', fontWeight: 500, textAlign: 'center',
          fontFamily: 'Inter, sans-serif', lineHeight: 1.6, maxWidth: '500px',
        }}>
          {achievementText}{' '}
          <span style={{ color: cfg.color, fontWeight: 700 }}>{highlightText}</span>
        </div>

        {/* Subtext */}
        <div style={{
          color: '#777', fontSize: '12px', fontWeight: 400, textAlign: 'center',
          fontFamily: 'Inter, sans-serif', marginTop: '6px',
        }}>
          {isWithdrawal
            ? 'Your hard work and consistency have paid off. Congratulations!'
            : 'You have demonstrated exceptional skill, discipline and consistency.'}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: '20px', marginTop: '30px', width: '100%', maxWidth: '650px',
          justifyContent: 'center',
        }}>
          {[
            ...(isWithdrawal ? [
              { label: 'WITHDRAWAL AMOUNT', value: cert.withdrawal_amount ? `$${Number(cert.withdrawal_amount).toLocaleString()}` : '—' },
            ] : [
              { label: 'ACCOUNT SIZE', value: cert.account_size ? `$${Number(cert.account_size).toLocaleString()}` : '—' },
            ]),
            { label: 'DATE', value: cert.issue_date || new Date().toLocaleDateString('en-GB') },
            { label: 'CERTIFICATE ID', value: cert.certificate_id ? `#${cert.certificate_id.slice(0, 12)}` : '—' },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1, background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(197,160,89,0.5)', borderRadius: '8px',
              padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ color: cfg.color, fontSize: '14px', fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>{s.value}</div>
              <div style={{ color: '#888', fontSize: '8px', letterSpacing: '0.12em', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer section */}
      <div style={{
        position: 'absolute', bottom: '40px', left: '50px', right: '50px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid rgba(197,160,89,0.4)',
      }}>
        {/* Left: Date */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ color: '#888', fontSize: '8px', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>DATE</div>
          <div style={{ color: '#1a1a1a', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            {cert.issue_date || new Date().toLocaleDateString('en-GB')}
          </div>
        </div>

        {/* Center: Seal */}
        <div style={{ textAlign: 'center' }}>
          <XFSeal color="#C5A059" />
        </div>

        {/* Right: CEO Signature */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#888', fontSize: '8px', letterSpacing: '0.15em', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>CEO</div>
          {/* Hand-drawn signature SVG */}
          <svg width="140" height="50" viewBox="0 0 200 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '2px' }}>
            <path d="M10 48 C10 20, 14 12, 20 12 C28 12, 34 18, 34 30 C34 42, 28 50, 18 50 C14 50, 10 48, 10 48" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
            <path d="M38 34 C39 30, 41 26, 43 24 C44 32, 44 40, 43 48" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
            <circle cx="42" cy="20" r="1.5" fill="#1a1a1a" opacity="0.85"/>
            <path d="M46 38 C48 32, 53 28, 57 30 C60 32, 59 38, 56 42 C53 46, 48 46, 46 42 C45 38, 47 32, 52 32" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
            <path d="M62 30 C66 24, 72 24, 74 30 C76 36, 72 44, 68 46 C64 48, 60 46, 60 40 C60 34, 64 30, 68 30" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
            <path d="M74 30 C76 38, 76 50, 72 58 C70 62, 66 64, 62 62" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8"/>
            <path d="M80 34 C82 26, 90 24, 94 30 C98 36, 96 46, 90 48 C84 50, 79 44, 80 36" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
            <path d="M102 14 C102 14, 102 34, 102 50" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.9"/>
            <path d="M102 14 C110 14, 116 16, 116 22 C116 28, 110 30, 102 30" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9"/>
            <path d="M104 30 C110 34, 118 44, 122 50" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
            <path d="M126 38 C128 30, 134 28, 138 32 C141 35, 139 42, 135 45 C131 48, 126 46, 126 40 C126 34, 130 32, 135 32" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
            <path d="M143 26 C145 32, 148 40, 150 46" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
            <path d="M158 26 C155 32, 150 46, 146 54 C143 60, 140 64, 136 66" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8"/>
            <path d="M162 36 C164 28, 172 26, 175 32 C178 37, 175 44, 170 47 C165 50, 160 46, 161 39 C162 32, 167 30, 172 32" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
            <path d="M178 32 C182 28, 188 30, 186 36 C184 40, 178 40, 178 44 C178 48, 184 50, 190 48 C194 46, 196 42, 195 40" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
            <path d="M8 56 C40 60, 90 58, 140 56 C160 55, 180 56, 195 54" stroke="#1a1a1a" strokeWidth="0.8" strokeLinecap="round" opacity="0.25"/>
          </svg>
          <div style={{ color: '#1a1a1a', fontSize: '10px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{FIRM.ceo}</div>
          <div style={{ color: '#888', fontSize: '7px', marginTop: '1px', fontFamily: 'Inter, sans-serif' }}>Chief Executive Officer</div>
        </div>
      </div>

      {/* QR Code area — bottom-left verification */}
      <div style={{
        position: 'absolute', bottom: '100px', left: '50px',
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 14px',
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(197,160,89,0.4)',
        borderRadius: '8px',
      }}>
        <div style={{
          width: '44px', height: '44px',
          background: '#1a1a1a', borderRadius: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <QrCode style={{ width: '28px', height: '28px', color: '#C5A059' }} />
        </div>
        <div>
          <div style={{ color: '#888', fontSize: '7px', letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif' }}>VERIFY CERTIFICATE</div>
          <div style={{ color: '#1a1a1a', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{FIRM.verifyUrl}</div>
        </div>
      </div>
    </div>
  );
}

// ── PDF download ──────────────────────────────────────────────────────────────
async function downloadCertificatePDF(cert, setLoading) {
  setLoading(true);
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1400px;z-index:-1;';
  document.body.appendChild(container);

  const { createRoot } = await import('react-dom/client');
  const root = createRoot(container);

  await new Promise(resolve => {
    root.render(
      React.createElement(CertificateDocument, { cert, forCapture: true })
    );
    setTimeout(resolve, 400);
  });

  const canvas = await html2canvas(container.firstChild, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#f5f3ef',
    logging: false,
  });

  root.unmount();
  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(`XFunded-Certificate-${cert.certificate_id || Date.now()}.pdf`);

  setLoading(false);
}

// ── Certificate Card ──────────────────────────────────────────────────────────
function CertCard({ cert, index, onPreview }) {
  const cfg = CERT_CONFIG[cert.type] || CERT_CONFIG.phase1_passed;
  const [downloading, setDownloading] = useState(false);
  const isWithdrawal = cert.type === 'first_payout' || cert.type === 'withdrawal';

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fafaf7, #f3f1eb)', border: '1px solid rgba(197,160,89,0.35)' }}
    >
      {/* Gold top line */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #C5A059, #C5A059, transparent)' }} />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <XFLogo size="sm" />
          </div>
          <span className="text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest"
            style={{ color: cfg.color, background: `${cfg.color}10`, border: `1px solid ${cfg.color}40` }}>
            {cfg.badge}
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <div className="text-sm font-black text-[#1a1a1a] tracking-widest" style={{ fontFamily: '"Times New Roman", Georgia, serif' }}>
            CERTIFICATE {isWithdrawal ? 'OF WITHDRAWAL' : 'OF COMPLETION'}
          </div>
        </div>

        {/* Name */}
        <div className="text-center mb-4">
          <div className="text-[10px] text-[#888] tracking-widest mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            PROUDLY PRESENTED TO
          </div>
          <div className="text-2xl italic text-[#1a1a1a] font-normal"
            style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}>
            {cert.trader_name || 'Trader'}
          </div>
        </div>

        {/* Achievement */}
        <div className="text-center mb-5 px-4">
          <span className="text-[11px] text-[#666]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {isWithdrawal ? 'Successfully processed a withdrawal from ' : 'For successfully completing the '}
          </span>
          <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.title}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: isWithdrawal ? 'AMOUNT' : 'ACCOUNT SIZE', value: isWithdrawal ? (cert.withdrawal_amount ? `$${Number(cert.withdrawal_amount).toLocaleString()}` : '—') : (cert.account_size ? `$${Number(cert.account_size).toLocaleString()}` : '—') },
            { label: 'DATE', value: cert.issue_date || '—' },
            { label: 'CERT ID', value: cert.certificate_id ? `#${cert.certificate_id.slice(0, 8)}` : '—' },
          ].map(item => (
            <div key={item.label} className="rounded-lg p-2.5 text-center bg-white/60 border border-[#e5e0d5]">
              <div className="text-[9px] font-bold text-[#888] mb-1">{item.label}</div>
              <div className="text-[10px] font-bold text-[#1a1a1a] truncate">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Seal + CEO */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-4 bg-white/40 border border-[#e5e0d5]">
          <div className="flex items-center gap-2">
            <XFSeal color="#C5A059" />
          </div>
          <div className="text-right">
            <div className="text-[8px] text-[#888] tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>CEO</div>
            <div className="text-[11px] font-bold text-[#1a1a1a]">{FIRM.ceo}</div>
            <div className="text-[7px] text-[#aaa]">Chief Executive Officer</div>
          </div>
        </div>

        {/* Verify */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 bg-white/40 border border-[#e5e0d5]">
          <QrCode className="w-4 h-4 text-[#C5A059]" />
          <span className="text-[9px] text-[#888]">Verify: </span>
          <span className="text-[9px] font-semibold text-[#1a1a1a]">{FIRM.verifyUrl}</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button onClick={() => onPreview(cert)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', color: '#555' }}>
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={() => downloadCertificatePDF(cert, setDownloading)} disabled={downloading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, #1a1a1a, #333)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
function CertPreviewModal({ cert, onClose }) {
  const cfg = CERT_CONFIG[cert?.type] || CERT_CONFIG.phase1_passed;
  const [downloading, setDownloading] = useState(false);
  if (!cert) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl">
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white/40 hover:text-white transition-colors text-3xl font-light">×</button>
        <div className="w-full mb-4">
          <CertificateDocument cert={cert} forCapture={false} />
        </div>
        <div className="flex justify-center">
          <button onClick={() => downloadCertificatePDF(cert, setDownloading)} disabled={downloading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60 transition-all"
            style={{ background: 'linear-gradient(90deg, #1a1a1a, #333)', boxShadow: '0 6px 24px rgba(0,0,0,0.3)' }}>
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Generating PDF...' : 'Download as PDF'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Certificates({ user }) {
  const [previewCert, setPreviewCert] = useState(null);

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certificates', user?.email],
    queryFn: () => base44.entities.Certificate.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const stats = [
    { label: 'Total Certificates', value: certs.length, color: '#FF5C00', icon: Award },
    { label: 'Phases Passed', value: certs.filter(c => c.type === 'phase1_passed' || c.type === 'phase2_passed').length, color: '#C5A059', icon: Trophy },
    { label: 'Funded Accounts', value: certs.filter(c => c.type === 'funded').length, color: '#1a1a1a', icon: Star },
    { label: 'Payouts Received', value: certs.filter(c => c.type === 'first_payout').length, color: '#10b981', icon: Zap },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(197,160,89,0.15)', border: '1px solid rgba(197,160,89,0.3)' }}>
              <Award className="w-5 h-5" style={{ color: '#C5A059' }} />
            </div>
            Certificates
          </h1>
          <p className="text-sm text-white/30 font-mono mt-1">Official achievement certificates from {FIRM.name}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono"
          style={{ background: 'rgba(197,160,89,0.08)', border: '1px solid rgba(197,160,89,0.2)', color: '#C5A059' }}>
          <CheckCircle className="w-3.5 h-3.5" /> All Verified
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(197,160,89,0.12)' }}>
                <Icon className="w-4 h-4" style={{ color: '#C5A059' }} />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin" />
        </div>
      ) : certs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-24 rounded-3xl border border-dashed"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(197,160,89,0.1)', border: '1px solid rgba(197,160,89,0.2)' }}>
            <Award className="w-8 h-8" style={{ color: '#C5A059', opacity: 0.4 }} />
          </div>
          <div className="text-lg font-bold text-white/40 mb-2">No Certificates Yet</div>
          <p className="text-sm font-mono text-white/20 max-w-sm mx-auto leading-relaxed">
            Complete a challenge phase or receive your first payout to earn official certificates from {FIRM.name}.
          </p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {certs.map((c, i) => <CertCard key={c.id} cert={c} index={i} onPreview={setPreviewCert} />)}
        </div>
      )}

      <AnimatePresence>
        {previewCert && <CertPreviewModal cert={previewCert} onClose={() => setPreviewCert(null)} />}
      </AnimatePresence>
    </div>
  );
}