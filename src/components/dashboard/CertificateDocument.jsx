import React from 'react';
import XFLogo from '@/components/shared/XFLogo';
import { QrCode } from 'lucide-react';

const FIRM = {
  name: 'XFUNDED TRADER',
  tagline: 'ELITE PROPRIETARY TRADING FIRM',
  website: 'xfundedtrader.com',
  verifyUrl: 'xfundedtrader.com/verify',
  address: 'Dubai International Financial Centre, UAE',
  ceo: 'Diego Reyes',
};

// ─── Theme configs ──────────────────────────────────────────────────────────
const THEMES = {
  phase1_passed: {
    bg: '#ffffff',
    bgGradient: 'linear-gradient(180deg, #ffffff 0%, #faf9f7 50%, #f5f2ed 100%)',
    text: '#1a1a1a',
    muted: '#777',
    accent: '#FF5C00',
    accentLight: '#FF8A3D',
    gold: '#C5A059',
    border: '#e0ddd5',
    cardBg: 'rgba(0,0,0,0.03)',
    badgeBg: '#0a0a0a',
    badgeText: '#FF5C00',
    sealColor: '#C5A059',
    cornerColor: '#FF5C00',
    watermarkOpacity: 0.04,
    name: 'PHASE 1 EVALUATION',
    badge: 'PHASE 1',
  },
  phase2_passed: {
    bg: '#080808',
    bgGradient: 'linear-gradient(180deg, #080808 0%, #0c0a08 50%, #0a0806 100%)',
    text: '#f0ede8',
    muted: '#888',
    accent: '#FF5C00',
    accentLight: '#FF8A3D',
    gold: '#C5A059',
    border: 'rgba(197,160,89,0.25)',
    cardBg: 'rgba(255,255,255,0.04)',
    badgeBg: '#080808',
    badgeText: '#C5A059',
    sealColor: '#C5A059',
    cornerColor: '#C5A059',
    watermarkOpacity: 0.06,
    name: 'PHASE 2 EVALUATION',
    badge: 'PHASE 2',
  },
  first_payout: {
    bg: '#faf8f3',
    bgGradient: 'linear-gradient(180deg, #faf8f3 0%, #f5f0e8 30%, #f0ebe0 60%, #f5f0e8 100%)',
    text: '#2a2018',
    muted: '#8a7e6e',
    accent: '#FF5C00',
    accentLight: '#FF8A3D',
    gold: '#B8942E',
    border: 'rgba(184,148,46,0.3)',
    cardBg: 'rgba(184,148,46,0.06)',
    badgeBg: '#1a1a1a',
    badgeText: '#B8942E',
    sealColor: '#B8942E',
    cornerColor: '#B8942E',
    watermarkOpacity: 0.025,
    name: 'WITHDRAWAL',
    badge: 'WITHDRAWAL',
  },
  funded: {
    bg: '#050508',
    bgGradient: 'linear-gradient(180deg, #050508 0%, #0a0808 50%, #060508 100%)',
    text: '#f0ede8',
    muted: '#777',
    accent: '#CCFF00',
    accentLight: '#DDFF33',
    gold: '#C5A059',
    border: 'rgba(197,160,89,0.3)',
    cardBg: 'rgba(255,255,255,0.04)',
    badgeBg: '#050508',
    badgeText: '#CCFF00',
    sealColor: '#C5A059',
    cornerColor: '#CCFF00',
    watermarkOpacity: 0.05,
    name: 'FUNDED TRADER',
    badge: 'FUNDED',
  },
};

// ─── Chart Watermark SVG ────────────────────────────────────────────────────
function ChartWatermark({ theme }) {
  const c = theme.gold;
  return (
    <svg width="100%" height="100%" viewBox="0 0 500 350" fill="none"
      style={{ position: 'absolute', inset: 0, opacity: theme.watermarkOpacity, pointerEvents: 'none' }}>
      {Array.from({ length: 25 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 14} x2="500" y2={i * 14} stroke={c} strokeWidth="0.3" />)}
      {Array.from({ length: 36 }, (_, i) => <line key={`v${i}`} x1={i * 14} y1="0" x2={i * 14} y2="350" stroke={c} strokeWidth="0.3" />)}
      {[40,60,80,100,120,140,160,180,200,220,240,260,280,300,320,340,360,380,400,420].map((x, i) => {
        const h = 30 + Math.sin(i * 1.2) * 25 + Math.cos(i * 0.7) * 20;
        const y = 200 - h / 2;
        return <React.Fragment key={x}>
          <rect x={x} y={y} width="5" height={h} rx="1" fill={c} opacity={0.4 + Math.random() * 0.4} />
          <line x1={x + 2.5} y1={y - 20} x2={x + 2.5} y2={y + h + 20} stroke={c} strokeWidth="0.6" opacity="0.4" />
        </React.Fragment>;
      })}
    </svg>
  );
}

// ─── Marble Texture (Withdrawal) ─────────────────────────────────────────────
function MarbleTexture() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 500 350" fill="none"
      style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }}>
      <filter id="marble">
        <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
        <feBlend in="SourceGraphic" in2="gray" mode="multiply" />
      </filter>
      <rect width="500" height="350" filter="url(#marble)" fill="#f5f0e8" />
      <circle cx="120" cy="80" r="200" fill="#e8e0d0" opacity="0.3" filter="url(#marble)" />
      <circle cx="380" cy="280" r="180" fill="#ede5d5" opacity="0.25" filter="url(#marble)" />
      <circle cx="250" cy="180" r="150" fill="#f0e8da" opacity="0.2" filter="url(#marble)" />
    </svg>
  );
}

// ─── Geometric Corner Decorations ────────────────────────────────────────────
function CornerDecor({ position, color }) {
  const pos = { tl: { top: 0, left: 0 }, tr: { top: 0, right: 0 }, bl: { bottom: 0, left: 0 }, br: { bottom: 0, right: 0 } };
  const rot = { tl: 0, tr: 90, bl: -90, br: 180 };
  return (
    <div style={{ position: 'absolute', width: '70px', height: '70px', ...pos[position], pointerEvents: 'none', transform: `rotate(${rot[position]}deg)` }}>
      <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
        <rect x="3" y="3" width="64" height="64" fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" rx="0" />
        <rect x="8" y="8" width="54" height="54" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" rx="0" />
        <line x1="5" y1="5" x2="30" y2="5" stroke={color} strokeWidth="2" opacity="0.8" />
        <line x1="5" y1="5" x2="5" y2="30" stroke={color} strokeWidth="2" opacity="0.8" />
        <circle cx="10" cy="10" r="2.5" fill={color} opacity="0.9" />
        <line x1="5" y1="18" x2="22" y2="5" stroke={color} strokeWidth="0.4" opacity="0.3" />
      </svg>
    </div>
  );
}

// ─── Pentagonal Phase Badge ──────────────────────────────────────────────────
function PhaseBadge({ label, color, bg }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
      <svg width="100" height="38" viewBox="0 0 100 38" fill="none" style={{ position: 'absolute', inset: 0 }}>
        <polygon points="3,2 97,2 96,18 97,36 3,36 4,18" fill={bg} stroke={color} strokeWidth="1.2" />
      </svg>
      <span style={{
        position: 'relative', zIndex: 1, color, fontSize: '9px', fontWeight: 800,
        letterSpacing: '0.2em', fontFamily: "'Inter', sans-serif", padding: '8px 16px',
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── XF Gold Seal ────────────────────────────────────────────────────────────
function XFSeal({ color = '#C5A059' }) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="37" fill="none" stroke={color} strokeWidth="2" opacity="0.9" />
      <circle cx="40" cy="40" r="33" fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" />
      <circle cx="40" cy="40" r="28" fill="none" stroke={color} strokeWidth="1" opacity="0.7" />
      <text x="40" y="48" textAnchor="middle" fontSize="24" fontWeight="900" fill={color} fontFamily="'Playfair Display', 'Times New Roman', serif" opacity="0.95">XF</text>
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
        const rad = (deg * Math.PI) / 180;
        return <circle key={deg} cx={40 + 30 * Math.cos(rad)} cy={40 + 30 * Math.sin(rad)} r="1.8" fill={color} opacity="0.7" />;
      })}
      <text x="40" y="68" textAnchor="middle" fontSize="5" fontWeight="700" fill={color} opacity="0.5" fontFamily="'Inter', sans-serif" letterSpacing="0.15em">VERIFIED</text>
    </svg>
  );
}

// ─── CEO Signature SVG ───────────────────────────────────────────────────────
function CEOSignature({ color = '#1a1a1a' }) {
  return (
    <svg width="150" height="54" viewBox="0 0 200 70" fill="none" style={{ marginBottom: '2px' }}>
      <path d="M10 48 C10 20, 14 12, 20 12 C28 12, 34 18, 34 30 C34 42, 28 50, 18 50 C14 50, 10 48, 10 48" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
      <path d="M38 34 C39 30, 41 26, 43 24 C44 32, 44 40, 43 48" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
      <circle cx="42" cy="20" r="1.5" fill={color} opacity="0.85"/>
      <path d="M46 38 C48 32, 53 28, 57 30 C60 32, 59 38, 56 42 C53 46, 48 46, 46 42 C45 38, 47 32, 52 32" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
      <path d="M62 30 C66 24, 72 24, 74 30 C76 36, 72 44, 68 46 C64 48, 60 46, 60 40 C60 34, 64 30, 68 30" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
      <path d="M74 30 C76 38, 76 50, 72 58 C70 62, 66 64, 62 62" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8"/>
      <path d="M80 34 C82 26, 90 24, 94 30 C98 36, 96 46, 90 48 C84 50, 79 44, 80 36" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
      <path d="M102 14 C102 14, 102 34, 102 50" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M102 14 C110 14, 116 16, 116 22 C116 28, 110 30, 102 30" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M104 30 C110 34, 118 44, 122 50" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M126 38 C128 30, 134 28, 138 32 C141 35, 139 42, 135 45 C131 48, 126 46, 126 40 C126 34, 130 32, 135 32" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
      <path d="M143 26 C145 32, 148 40, 150 46" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M158 26 C155 32, 150 46, 146 54 C143 60, 140 64, 136 66" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M162 36 C164 28, 172 26, 175 32 C178 37, 175 44, 170 47 C165 50, 160 46, 161 39 C162 32, 167 30, 172 32" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
      <path d="M178 32 C182 28, 188 30, 186 36 C184 40, 178 40, 178 44 C178 48, 184 50, 190 48 C194 46, 196 42, 195 40" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
      <path d="M8 56 C40 60, 90 58, 140 56 C160 55, 180 56, 195 54" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.25"/>
    </svg>
  );
}

// ─── MAIN: Certificate Document ──────────────────────────────────────────────
export default function CertificateDocument({ cert, forCapture = false }) {
  const theme = THEMES[cert?.type] || THEMES.phase1_passed;
  const t = theme;
  const isWithdrawal = cert?.type === 'first_payout';
  const isDark = cert?.type === 'phase2_passed' || cert?.type === 'funded';
  const isPhase1 = cert?.type === 'phase1_passed';

  const sigColor = isDark ? '#e0ddd5' : '#1a1a1a';
  const footerBorder = isDark ? 'rgba(197,160,89,0.25)' : 'rgba(197,160,89,0.5)';

  return (
    <div
      style={{
        width: forCapture ? '1400px' : '100%',
        aspectRatio: '1.414 / 1',
        background: t.bgGradient,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        borderRadius: forCapture ? '0' : '12px',
        boxShadow: forCapture ? 'none' : `0 20px 60px rgba(0,0,0,${isDark ? 0.6 : 0.2})`,
        flexShrink: 0,
        color: t.text,
      }}
    >
      {/* Marble texture for withdrawal */}
      {isWithdrawal && <MarbleTexture />}

      {/* Chart watermark */}
      <ChartWatermark theme={t} />

      {/* Border frame */}
      <div style={{ position: 'absolute', inset: '20px', border: `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#1a1a1a'}`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '24px', border: `1px solid ${t.gold}`, opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '28px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)'}`, pointerEvents: 'none' }} />

      {/* Corner decorations */}
      <CornerDecor position="tl" color={t.cornerColor} />
      <CornerDecor position="tr" color={t.cornerColor} />
      <CornerDecor position="bl" color={t.cornerColor} />
      <CornerDecor position="br" color={t.cornerColor} />

      {/* ── Header ── */}
      <div style={{
        position: 'absolute', top: '38px', left: '50px', right: '50px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: '14px',
        borderBottom: `1px solid ${footerBorder}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <XFLogo size="sm" />
        </div>
        <PhaseBadge label={t.badge} color={isDark ? t.gold : t.accent} bg={t.badgeBg} />
      </div>

      {/* ── Main Content ── */}
      <div style={{
        position: 'absolute', top: '105px', left: '50px', right: '50px', bottom: '90px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Certificate Title */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <div style={{
            fontSize: '48px', fontWeight: 900, color: t.text, letterSpacing: '0.06em',
            fontFamily: "'Playfair Display', 'Times New Roman', Georgia, serif", lineHeight: 1.1,
          }}>
            CERTIFICATE
          </div>
          <div style={{
            fontSize: '17px', fontWeight: 600, color: t.accent, letterSpacing: '0.32em',
            fontFamily: "'Inter', sans-serif", marginTop: '3px',
          }}>
            {isWithdrawal ? 'OF WITHDRAWAL' : 'OF COMPLETION'}
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ display: 'flex', alignItems: 'center', width: '60%', maxWidth: '450px', margin: '18px 0' }}>
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${t.gold})` }} />
          <div style={{
            width: '10px', height: '10px', background: t.gold, transform: 'rotate(45deg)',
            margin: '0 16px', boxShadow: `0 0 10px ${t.gold}80`,
          }} />
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${t.gold}, transparent)` }} />
        </div>

        {/* Presented to */}
        <div style={{
          color: t.muted, fontSize: '11px', letterSpacing: '0.25em', fontWeight: 600,
          fontFamily: "'Inter', sans-serif", marginBottom: '10px',
        }}>
          PROUDLY PRESENTED TO
        </div>

        {/* Trader Name — Great Vibes cursive */}
        <div style={{
          fontSize: '52px', fontWeight: 400, color: t.text,
          fontFamily: "'Great Vibes', 'Brush Script MT', 'Snell Roundhand', cursive",
          textAlign: 'center', marginBottom: '14px', lineHeight: 1.15,
        }}>
          {cert?.trader_name || 'Your Name'}
        </div>

        {/* Achievement text */}
        <div style={{
          color: t.muted, fontSize: '13px', fontWeight: 500, textAlign: 'center',
          fontFamily: "'Inter', sans-serif", lineHeight: 1.6,
        }}>
          {isWithdrawal ? (
            <>For successfully processed a withdrawal from{' '}<span style={{ color: t.accent, fontWeight: 700 }}>XFUNDED TRADER</span></>
          ) : (
            <>For successfully completing the{' '}<span style={{ color: t.accent, fontWeight: 700 }}>{t.name}</span></>
          )}
        </div>
        <div style={{
          color: t.muted, fontSize: '12px', fontWeight: 400, textAlign: 'center',
          fontFamily: "'Inter', sans-serif", marginTop: '5px', opacity: 0.8,
        }}>
          {isWithdrawal
            ? 'Your hard work and consistency have paid off. Congratulations!'
            : 'You have demonstrated exceptional skill, discipline and consistency.'}
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '16px', marginTop: '28px', width: '100%', maxWidth: '600px', justifyContent: 'center',
        }}>
          {[
            ...(isWithdrawal
              ? [{ label: 'WITHDRAWAL AMOUNT', value: cert?.withdrawal_amount ? `$${Number(cert.withdrawal_amount).toLocaleString()}` : '—' }]
              : [{ label: 'ACCOUNT SIZE', value: cert?.account_size ? `$${Number(cert.account_size).toLocaleString()}` : '—' }]
            ),
            { label: 'DATE', value: cert?.issue_date || new Date().toLocaleDateString('en-GB') },
            { label: 'CERTIFICATE ID', value: cert?.certificate_id ? `#${cert.certificate_id.slice(0, 12)}` : '—' },
          ].map((s) => (
            <div key={s.label} style={{
              flex: 1, background: t.cardBg, border: `1px solid ${t.border}`,
              borderRadius: '8px', padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ color: t.accent, fontSize: '14px', fontWeight: 800, fontFamily: "'Inter', sans-serif" }}>{s.value}</div>
              <div style={{ color: t.muted, fontSize: '8px', letterSpacing: '0.12em', marginTop: '4px', fontFamily: "'Inter', sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        position: 'absolute', bottom: '40px', left: '50px', right: '50px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: `1px solid ${footerBorder}`,
      }}>
        {/* DATE */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ color: t.muted, fontSize: '8px', letterSpacing: '0.15em', marginBottom: '10px', fontFamily: "'Inter', sans-serif" }}>DATE</div>
          <div style={{ color: t.text, fontSize: '11px', fontWeight: 600, fontFamily: "'Inter', sans-serif", opacity: 0.8 }}>
            {cert?.issue_date || new Date().toLocaleDateString('en-GB')}
          </div>
        </div>

        {/* Seal */}
        <div style={{ textAlign: 'center' }}>
          <XFSeal color={t.sealColor} />
        </div>

        {/* CEO */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: t.muted, fontSize: '8px', letterSpacing: '0.15em', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>CEO</div>
          <CEOSignature color={sigColor} />
          <div style={{ width: '130px', height: '1px', background: `linear-gradient(90deg, transparent, ${sigColor}80)`, marginLeft: 'auto', marginBottom: '2px' }} />
          <div style={{ color: t.text, fontSize: '10px', fontWeight: 700, fontFamily: "'Inter', sans-serif", opacity: 0.85 }}>{FIRM.ceo}</div>
          <div style={{ color: t.muted, fontSize: '7px', marginTop: '1px', fontFamily: "'Inter', sans-serif" }}>Chief Executive Officer</div>
        </div>
      </div>

      {/* ── QR Verification zone ── */}
      <div style={{
        position: 'absolute', bottom: '100px', left: '50px',
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 14px',
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: '8px',
      }}>
        <div style={{
          width: '46px', height: '46px', background: isDark ? '#1a1a1a' : '#0a0a0a',
          borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <QrCode style={{ width: '30px', height: '30px', color: t.gold }} />
        </div>
        <div>
          <div style={{ color: t.muted, fontSize: '7px', letterSpacing: '0.1em', fontFamily: "'Inter', sans-serif" }}>VERIFY CERTIFICATE</div>
          <div style={{ color: t.text, fontSize: '10px', fontWeight: 600, fontFamily: "'Inter', sans-serif", opacity: 0.8 }}>{FIRM.verifyUrl}</div>
        </div>
      </div>
    </div>
  );
}