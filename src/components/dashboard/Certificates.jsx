import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, CheckCircle, Shield, Star, Trophy, Zap, Crown, Eye, Loader2, QrCode } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const FIRM = {
  name: 'XTRADING CAPITAL',
  tagline: 'ELITE PROPRIETARY TRADING FIRM',
  website: 'xtrading.com',
  verifyUrl: 'xtrading.com/verify',
  address: 'Dubai International Financial Centre, UAE',
};

const CERT_CONFIG = {
  phase1_passed: { title: 'Phase I Passed',       icon: Star,   color: '#FF5C00', glow: 'rgba(255,92,0,0.4)',    bg: 'rgba(255,92,0,0.06)',    label: 'Phase 1'      },
  phase2_passed: { title: 'Phase II Passed',       icon: Trophy, color: '#60a5fa', glow: 'rgba(96,165,250,0.4)', bg: 'rgba(96,165,250,0.06)',  label: 'Phase 2'      },
  funded:        { title: 'Funded Trader',         icon: Award,  color: '#CCFF00', glow: 'rgba(204,255,0,0.4)',  bg: 'rgba(204,255,0,0.06)',   label: 'Funded'       },
  first_payout:  { title: 'First Payout',          icon: Zap,    color: '#10b981', glow: 'rgba(16,185,129,0.4)','bg': 'rgba(16,185,129,0.06)', label: 'First Payout' },
  consistency:   { title: 'Consistency Award',     icon: Shield, color: '#a78bfa', glow: 'rgba(167,139,250,0.4)',bg: 'rgba(167,139,250,0.06)', label: 'Consistency'  },
  special:       { title: 'Special Achievement',   icon: Crown,  color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.06)', label: 'Special'      },
};

// ── Pixel-perfect HTML certificate (used for both preview AND PDF capture) ────
function CertificateDocument({ cert, forCapture = false }) {
  const cfg = CERT_CONFIG[cert.type] || CERT_CONFIG.funded;
  const Icon = cfg.icon;
  const challengeMap = { 'two-step': 'Two-Step Challenge', 'instant': 'Instant Funding Program', 'instant_light': 'Instant Light Program' };

  return (
    <div
      style={{
        width: forCapture ? '1200px' : '100%',
        aspectRatio: '1.414 / 1',
        background: 'linear-gradient(135deg, #030408 0%, #0a0608 50%, #030408 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
        borderRadius: forCapture ? '0' : '16px',
        border: `2px solid ${cfg.color}40`,
        flexShrink: 0,
      }}
    >
      {/* Background glow orbs */}
      <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '400px', height: '400px', background: `radial-gradient(circle, ${cfg.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '350px', height: '350px', background: `radial-gradient(circle, ${cfg.color}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025,
        backgroundImage: `repeating-linear-gradient(0deg, ${cfg.color} 0, ${cfg.color} 0.5px, transparent 0, transparent 48px), repeating-linear-gradient(90deg, ${cfg.color} 0, ${cfg.color} 0.5px, transparent 0, transparent 48px)`,
      }} />

      {/* Outer border frame */}
      <div style={{ position: 'absolute', inset: '12px', border: `1px solid ${cfg.color}20`, borderRadius: '8px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '16px', border: `1px solid ${cfg.color}10`, borderRadius: '4px', pointerEvents: 'none' }} />

      {/* Corner accents */}
      {[[12,12,'0 0'],['auto',12,'0 0'],[12,'auto','0 0'],['auto','auto','0 0']].map((_, i) => {
        const cx = i % 2 === 0 ? '14px' : 'auto', cy = i < 2 ? '14px' : 'auto';
        const rx = i % 2 === 0 ? '14px' : '14px', ry = i < 2 ? '14px' : '14px';
        const brs = [i % 2 === 0 ? `2px solid ${cfg.color}` : 'none', i % 2 !== 0 ? `2px solid ${cfg.color}` : 'none',
                     i < 2 ? 'none' : `2px solid ${cfg.color}`, i >= 2 ? 'none' : `2px solid ${cfg.color}`];
        return null; // rendered below
      })}
      {/* Simplified corner L-marks */}
      {[{t:'14px',l:'14px',bl:'none',br:'none',bt:`2px solid ${cfg.color}`,bb:'none',bbt:`2px solid ${cfg.color}`,bbb:'none',bl2:`2px solid ${cfg.color}`,br2:'none'},].map(()=>null)}

      {/* Top header band */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', background: `linear-gradient(90deg, ${cfg.color}12, rgba(0,0,0,0) 50%, ${cfg.color}08)`, borderBottom: `1px solid ${cfg.color}25` }} />

      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent, ${cfg.color}, ${cfg.color}80, transparent)` }} />

      {/* Firm logo + name in header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}80)`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#000', fontWeight: 900, fontSize: '14px' }}>FC</span>
          </div>
          <div>
            <div style={{ color: cfg.color, fontSize: '13px', fontWeight: 900, letterSpacing: '0.15em' }}>{FIRM.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '0.2em', marginTop: '1px' }}>{FIRM.tagline}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: cfg.color, fontSize: '9px', fontWeight: 700, letterSpacing: '0.25em' }}>{cfg.label.toUpperCase()} CERTIFICATE</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '8px', marginTop: '2px' }}>{FIRM.address}</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ position: 'absolute', top: '80px', left: 0, right: 0, bottom: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px' }}>

        {/* Icon */}
        <div style={{ width: '72px', height: '72px', background: cfg.bg, border: `2px solid ${cfg.color}50`, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: `0 0 40px ${cfg.glow}` }}>
          <Icon style={{ width: '36px', height: '36px', color: cfg.color }} />
        </div>

        {/* Certificate type */}
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '8px', fontWeight: 600 }}>
          THIS CERTIFICATE IS PROUDLY AWARDED TO
        </div>

        {/* Trader name */}
        <div style={{ color: cfg.color, fontSize: '36px', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '4px', textShadow: `0 0 30px ${cfg.glow}`, textAlign: 'center' }}>
          {(cert.trader_name || 'TRADER').toUpperCase()}
        </div>

        {/* Divider with diamond */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '500px', margin: '16px 0' }}>
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${cfg.color}50)` }} />
          <div style={{ width: '8px', height: '8px', background: cfg.color, transform: 'rotate(45deg)', margin: '0 12px', boxShadow: `0 0 8px ${cfg.glow}` }} />
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${cfg.color}50, transparent)` }} />
        </div>

        {/* Achievement title */}
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '6px' }}>
          {cfg.title.toUpperCase()}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', textAlign: 'center', maxWidth: '400px', lineHeight: 1.6, marginBottom: '28px' }}>
          For successfully completing the{' '}
          <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
            {challengeMap[cert.challenge_type] || 'Funded Program'}
          </span>
          {' '}with a{' '}
          <span style={{ color: cfg.color, fontWeight: 700 }}>${(cert.account_size || 0).toLocaleString()}</span>
          {' '}account
        </div>

        {/* Stats boxes */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '600px' }}>
          {[
            { label: 'ACCOUNT SIZE', value: `$${(cert.account_size || 0).toLocaleString()}` },
            { label: 'ACCOUNT ID', value: cert.account_id || '—' },
            { label: 'DATE ISSUED', value: cert.issue_date || new Date().toLocaleDateString('en-GB') },
            { label: 'CERT ID', value: cert.certificate_id ? `#${cert.certificate_id.slice(0, 8)}` : '—' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: `1px solid ${cfg.color}25`, borderRadius: '10px', padding: '10px 8px', textAlign: 'center', borderTop: `2px solid ${cfg.color}60` }}>
              <div style={{ color: cfg.color, fontSize: '11px', fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '8px', letterSpacing: '0.1em', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer band */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', background: `linear-gradient(90deg, ${cfg.color}08, rgba(0,0,0,0) 50%, ${cfg.color}05)`, borderTop: `1px solid ${cfg.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '8px', letterSpacing: '0.1em' }}>CERTIFICATE ID</div>
          <div style={{ color: cfg.color, fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>{cert.certificate_id || `XTC-${Date.now()}`}</div>
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '8px', marginTop: '1px' }}>Verify at: {FIRM.verifyUrl}</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: cfg.color, fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em' }}>{FIRM.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '8px', marginTop: '1px' }}>Institutional Prop Trading · Elite Funded Program</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '8px', letterSpacing: '0.1em', marginBottom: '6px' }}>AUTHORIZED SIGNATURE</div>
          {/* SVG hand-drawn signature — Diego Reyes */}
          <svg width="130" height="48" viewBox="0 0 200 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', marginLeft: 'auto', marginBottom: '4px' }}>
            {/* D - large looping capital */}
            <path d="M10 48 C10 20, 14 12, 20 12 C28 12, 34 18, 34 30 C34 42, 28 50, 18 50 C14 50, 10 48, 10 48" stroke={cfg.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
            {/* i */}
            <path d="M38 34 C39 30, 41 26, 43 24 C44 32, 44 40, 43 48" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
            <circle cx="42" cy="20" r="1.5" fill={cfg.color} opacity="0.9"/>
            {/* e */}
            <path d="M46 38 C48 32, 53 28, 57 30 C60 32, 59 38, 56 42 C53 46, 48 46, 46 42 C45 38, 47 32, 52 32" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
            {/* g */}
            <path d="M62 30 C66 24, 72 24, 74 30 C76 36, 72 44, 68 46 C64 48, 60 46, 60 40 C60 34, 64 30, 68 30" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
            <path d="M74 30 C76 38, 76 50, 72 58 C70 62, 66 64, 62 62" stroke={cfg.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
            {/* o */}
            <path d="M80 34 C82 26, 90 24, 94 30 C98 36, 96 46, 90 48 C84 50, 79 44, 80 36" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
            {/* space + R (capital) */}
            <path d="M102 14 C102 14, 102 34, 102 50" stroke={cfg.color} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.95"/>
            <path d="M102 14 C110 14, 116 16, 116 22 C116 28, 110 30, 102 30" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.95"/>
            <path d="M104 30 C110 34, 118 44, 122 50" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.95"/>
            {/* e */}
            <path d="M126 38 C128 30, 134 28, 138 32 C141 35, 139 42, 135 45 C131 48, 126 46, 126 40 C126 34, 130 32, 135 32" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
            {/* y */}
            <path d="M143 26 C145 32, 148 40, 150 46" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.95"/>
            <path d="M158 26 C155 32, 150 46, 146 54 C143 60, 140 64, 136 66" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85"/>
            {/* e */}
            <path d="M162 36 C164 28, 172 26, 175 32 C178 37, 175 44, 170 47 C165 50, 160 46, 161 39 C162 32, 167 30, 172 32" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
            {/* s - trailing flourish */}
            <path d="M178 32 C182 28, 188 30, 186 36 C184 40, 178 40, 178 44 C178 48, 184 50, 190 48 C194 46, 196 42, 195 40" stroke={cfg.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
            {/* underline flourish */}
            <path d="M8 56 C40 60, 90 58, 140 56 C160 55, 180 56, 195 54" stroke={cfg.color} strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
          </svg>
          <div style={{ width: '110px', height: '1px', background: `linear-gradient(90deg, transparent, ${cfg.color}80, ${cfg.color})`, marginLeft: 'auto', marginBottom: '3px' }} />
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '8px', fontWeight: 700 }}>Diego Reyes</div>
          <div style={{ color: 'rgba(255,255,255,0.18)', fontSize: '7px', marginTop: '1px' }}>Chief Executive Officer</div>
        </div>
      </div>

      {/* Watermark */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-25deg)', color: cfg.color, fontSize: '80px', fontWeight: 900, opacity: 0.025, pointerEvents: 'none', whiteSpace: 'nowrap', letterSpacing: '0.1em' }}>
        CERTIFICATE
      </div>
    </div>
  );
}

// ── PDF download using html2canvas ────────────────────────────────────────────
async function downloadCertificatePDF(cert, setLoading) {
  setLoading(true);
  // Create a hidden container, render the certificate into it, capture as image
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1200px;z-index:-1;';
  document.body.appendChild(container);

  const { createRoot } = await import('react-dom/client');
  const root = createRoot(container);

  await new Promise(resolve => {
    root.render(
      React.createElement(CertificateDocument, { cert, forCapture: true })
    );
    setTimeout(resolve, 300); // allow render
  });

  const canvas = await html2canvas(container.firstChild, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#030408',
    logging: false,
  });

  root.unmount();
  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(`${FIRM.name.replace(/\s/g, '-')}-Certificate-${cert.certificate_id || Date.now()}.pdf`);

  setLoading(false);
}

// ── Certificate Card ──────────────────────────────────────────────────────────
function CertCard({ cert, index, onPreview }) {
  const cfg = CERT_CONFIG[cert.type] || CERT_CONFIG.funded;
  const Icon = cfg.icon;
  const [downloading, setDownloading] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative rounded-3xl overflow-hidden"
      style={{ background: 'rgba(6,8,18,0.98)', border: `1px solid ${cfg.color}30` }}
    >
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, ${cfg.color}90, transparent)` }} />
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full pointer-events-none"
        style={{ background: cfg.glow, filter: 'blur(48px)', opacity: 0.12 }} />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: `repeating-linear-gradient(0deg, ${cfg.color} 0, ${cfg.color} 0.5px, transparent 0, transparent 40px), repeating-linear-gradient(90deg, ${cfg.color} 0, ${cfg.color} 0.5px, transparent 0, transparent 40px)` }} />

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
            {cfg.label} Certificate
          </span>
          <span className="text-[9px] font-mono text-white/25">{cert.issue_date || '—'}</span>
        </div>

        <div className="flex items-center gap-5 mb-5">
          <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.bg, border: `1px solid ${cfg.color}40`, boxShadow: `0 0 24px ${cfg.glow}` }}>
            <Icon className="w-8 h-8" style={{ color: cfg.color }} />
          </motion.div>
          <div>
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-0.5">{cfg.title}</div>
            <div className="text-4xl font-black" style={{ color: cfg.color, textShadow: `0 0 20px ${cfg.glow}` }}>
              ${(cert.account_size || 0).toLocaleString()}
            </div>
            <div className="text-sm font-bold text-white mt-0.5">{cert.trader_name || 'Trader'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}30)` }} />
          <div className="w-1.5 h-1.5 rotate-45 flex-shrink-0" style={{ background: cfg.color, opacity: 0.6 }} />
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${cfg.color}30, transparent)` }} />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Account ID', value: cert.account_id || '—' },
            { label: 'Firm', value: 'XTRADING' },
            { label: 'Cert #', value: cert.certificate_id ? `#${cert.certificate_id.slice(0, 8)}` : '—' },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[9px] font-mono text-white/25 mb-0.5">{item.label}</div>
              <div className="text-[10px] font-bold text-white/80 truncate">{item.value}</div>
            </div>
          ))}
        </div>

        {/* CEO Signature strip */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3"
          style={{ background: `${cfg.color}06`, border: `1px solid ${cfg.color}20` }}>
          <div>
            <div className="text-[8px] font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Authorized Signature</div>
            <div className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>Diego Reyes</div>
            <div className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>Chief Executive Officer</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {/* SVG hand-drawn signature — Diego Reyes */}
            <svg width="90" height="34" viewBox="0 0 200 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 48 C10 20, 14 12, 20 12 C28 12, 34 18, 34 30 C34 42, 28 50, 18 50 C14 50, 10 48, 10 48" stroke={cfg.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
              <path d="M38 34 C39 30, 41 26, 43 24 C44 32, 44 40, 43 48" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
              <circle cx="42" cy="20" r="1.5" fill={cfg.color} opacity="0.9"/>
              <path d="M46 38 C48 32, 53 28, 57 30 C60 32, 59 38, 56 42 C53 46, 48 46, 46 42 C45 38, 47 32, 52 32" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
              <path d="M62 30 C66 24, 72 24, 74 30 C76 36, 72 44, 68 46 C64 48, 60 46, 60 40 C60 34, 64 30, 68 30" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
              <path d="M74 30 C76 38, 76 50, 72 58 C70 62, 66 64, 62 62" stroke={cfg.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
              <path d="M80 34 C82 26, 90 24, 94 30 C98 36, 96 46, 90 48 C84 50, 79 44, 80 36" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
              <path d="M102 14 C102 14, 102 34, 102 50" stroke={cfg.color} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.95"/>
              <path d="M102 14 C110 14, 116 16, 116 22 C116 28, 110 30, 102 30" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.95"/>
              <path d="M104 30 C110 34, 118 44, 122 50" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.95"/>
              <path d="M126 38 C128 30, 134 28, 138 32 C141 35, 139 42, 135 45 C131 48, 126 46, 126 40 C126 34, 130 32, 135 32" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
              <path d="M143 26 C145 32, 148 40, 150 46" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.95"/>
              <path d="M158 26 C155 32, 150 46, 146 54 C143 60, 140 64, 136 66" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85"/>
              <path d="M162 36 C164 28, 172 26, 175 32 C178 37, 175 44, 170 47 C165 50, 160 46, 161 39 C162 32, 167 30, 172 32" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
              <path d="M178 32 C182 28, 188 30, 186 36 C184 40, 178 40, 178 44 C178 48, 184 50, 190 48 C194 46, 196 42, 195 40" stroke={cfg.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
              <path d="M8 56 C40 60, 90 58, 140 56 C160 55, 180 56, 195 54" stroke={cfg.color} strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
            </svg>
            <div className="w-16 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color})` }} />
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
          style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[10px] font-mono text-emerald-400/70">Verified by Team Manager</span>
          <span className="text-[9px] font-mono text-white/15 ml-auto">{FIRM.verifyUrl}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onPreview(cert)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => downloadCertificatePDF(cert, setDownloading)}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black text-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`, boxShadow: `0 4px 16px ${cfg.glow}` }}>
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Preview Modal — renders the actual HTML cert ──────────────────────────────
function CertPreviewModal({ cert, onClose }) {
  const cfg = CERT_CONFIG[cert?.type] || CERT_CONFIG.funded;
  const [downloading, setDownloading] = useState(false);
  if (!cert) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl">

        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white/40 hover:text-white transition-colors text-2xl font-bold">×</button>

        {/* The actual certificate rendered as HTML */}
        <div className="w-full mb-4">
          <CertificateDocument cert={cert} forCapture={false} />
        </div>

        {/* Download button below preview */}
        <div className="flex justify-center">
          <button
            onClick={() => downloadCertificatePDF(cert, setDownloading)}
            disabled={downloading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black text-black disabled:opacity-60 transition-all"
            style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`, boxShadow: `0 6px 24px ${cfg.glow}` }}>
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
    queryFn: () => base44.entities.Certificate.list('-created_date', 50),
  });

  const stats = [
    { label: 'Total Certificates', value: certs.length,                                                                       color: '#FF5C00', icon: Award },
    { label: 'Phases Passed',      value: certs.filter(c => c.type === 'phase1_passed' || c.type === 'phase2_passed').length, color: '#60a5fa', icon: Trophy },
    { label: 'Funded Accounts',    value: certs.filter(c => c.type === 'funded').length,                                       color: '#CCFF00', icon: Star },
    { label: 'Payouts Received',   value: certs.filter(c => c.type === 'first_payout').length,                                 color: '#10b981', icon: Zap },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.2)' }}>
              <Award className="w-5 h-5 text-primary" />
            </div>
            Certificates
          </h1>
          <p className="text-sm text-white/30 font-mono mt-1">Official achievement certificates from {FIRM.name}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono" style={{ background: 'rgba(204,255,0,0.06)', border: '1px solid rgba(204,255,0,0.15)', color: '#CCFF00' }}>
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
              style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[9px] font-mono text-white/25">{s.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : certs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-24 rounded-3xl border border-dashed"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}>
            <Award className="w-8 h-8 text-primary/30" />
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