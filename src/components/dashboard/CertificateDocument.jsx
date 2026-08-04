import React from 'react';
import XFLogo from '@/components/shared/XFLogo';

const FIRM = {
  name: 'XFUNDED TRADER',
  website: 'xfundedtrader.com',
  ceo: 'Diego Reyes',
};

// ─── Luxury Theme ──────────────────────────────────────────────────────────
const T = {
  bg: '#05060a',
  bgGrad: 'linear-gradient(135deg, #07080d 0%, #05060a 40%, #08070a 60%, #05060a 100%)',
  text: '#f1f5f9',
  muted: 'rgba(148,163,184,0.5)',
  accent: '#FF5C00',
  gold: '#C5A059',
  goldDim: 'rgba(197,160,89,0.35)',
  border: 'rgba(255,255,255,0.08)',
  statBg: 'rgba(255,255,255,0.02)',
};

const BADGES = {
  phase1_passed: { label: 'PHASE 1', color: '#FF5C00' },
  phase2_passed: { label: 'PHASE 2', color: '#FF5C00' },
  funded:        { label: 'FUNDED',  color: '#CCFF00' },
  first_payout:  { label: 'WITHDRAWAL', color: '#10b981' },
  consistency:   { label: 'CONSISTENCY', color: '#a78bfa' },
  special:       { label: 'SPECIAL', color: '#f59e0b' },
};

const SUBTITLES = {
  phase1_passed: 'PHASE 1 EVALUATION',
  phase2_passed: 'PHASE 2 EVALUATION',
  funded:        'FUNDED TRADER PROGRAM',
  first_payout:  'WITHDRAWAL',
  consistency:   'CONSISTENCY AWARD',
  special:       'SPECIAL ACHIEVEMENT',
};

// ─── Subtle Candlestick Watermark ──────────────────────────────────────────
function Watermark() {
  const candles = [
    { o: 120, c: 135, h: 142, l: 115 }, { o: 135, c: 128, h: 140, l: 122 },
    { o: 128, c: 145, h: 150, l: 125 }, { o: 145, c: 160, h: 165, l: 140 },
    { o: 160, c: 152, h: 168, l: 148 }, { o: 152, c: 170, h: 175, l: 148 },
    { o: 170, c: 162, h: 178, l: 158 }, { o: 162, c: 185, h: 190, l: 160 },
    { o: 185, c: 178, h: 192, l: 172 }, { o: 178, c: 195, h: 200, l: 175 },
    { o: 195, c: 210, h: 215, l: 190 }, { o: 210, c: 200, h: 218, l: 195 },
    { o: 200, c: 225, h: 230, l: 198 }, { o: 225, c: 240, h: 248, l: 220 },
    { o: 240, c: 260, h: 265, l: 238 },
  ];
  const chartW = 480, chartH = 330, padding = { top: 30, right: 25, bottom: 25, left: 25 };
  const candleW = (chartW - padding.left - padding.right) / candles.length - 3;
  const allPrices = candles.flatMap(c => [c.h, c.l]);
  const minP = Math.min(...allPrices) - 10, maxP = Math.max(...allPrices) + 10;
  const scale = (v) => padding.top + chartH - padding.bottom - ((v - minP) / (maxP - minP)) * (chartH - padding.top - padding.bottom);
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${chartW} ${chartH}`} fill="none"
      style={{ position: 'absolute', inset: 0, opacity: 0.02, pointerEvents: 'none' }}>
      {Array.from({ length: 16 }, (_, i) => (
        <React.Fragment key={`grid-${i}`}>
          <line x1={padding.left} y1={padding.top + i * 19} x2={chartW - padding.right} y2={padding.top + i * 19} stroke="#C5A059" strokeWidth="0.2" />
          <line x1={padding.left + i * 30} y1={padding.top} x2={padding.left + i * 30} y2={chartH - padding.bottom} stroke="#C5A059" strokeWidth="0.2" />
        </React.Fragment>
      ))}
      {candles.map((c, i) => {
        const x = padding.left + i * (candleW + 3) + candleW / 2;
        const isBullish = c.c >= c.o;
        const fill = isBullish ? 'none' : '#C5A059';
        const strokeC = '#C5A059';
        const bodyTop = scale(Math.max(c.o, c.c)), bodyBottom = scale(Math.min(c.o, c.c));
        const bodyH = Math.max(bodyBottom - bodyTop, 1);
        return (
          <React.Fragment key={i}>
            <line x1={x} y1={scale(c.h)} x2={x} y2={scale(c.l)} stroke={strokeC} strokeWidth="0.8" />
            <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH} rx="1" fill={fill} stroke={strokeC} strokeWidth="0.7" />
            <rect x={x - candleW / 2 + 0.5} y={chartH - padding.bottom + 2} width={candleW - 1} height={3 + Math.abs(c.c - c.o) * 0.5} fill={strokeC} opacity="0.35" rx="0.5" />
          </React.Fragment>
        );
      })}
      <line x1={padding.left} y1={scale(118)} x2={chartW - padding.right} y2={scale(250)} stroke="#C5A059" strokeWidth="0.5" strokeDasharray="3,5" opacity="0.5" />
    </svg>
  );
}

// ─── Gold Corner Ornaments ─────────────────────────────────────────────────
function CornerOrnament({ position }) {
  const base = { position: 'absolute', width: '40px', height: '40px', pointerEvents: 'none' };
  const pos = {
    topLeft:     { top: '16px', left: '16px' },
    topRight:    { top: '16px', right: '16px', transform: 'scaleX(-1)' },
    bottomLeft:  { bottom: '16px', left: '16px', transform: 'scaleY(-1)' },
    bottomRight: { bottom: '16px', right: '16px', transform: 'scale(-1,-1)' },
  };
  return (
    <div style={{ ...base, ...pos[position] }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M4 20 L4 4 L20 4" stroke={T.gold} strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M8 20 L8 8 L20 8" stroke={T.gold} strokeWidth="0.5" fill="none" opacity="0.3" />
        <circle cx="4" cy="4" r="2" fill="none" stroke={T.gold} strokeWidth="0.8" opacity="0.7" />
      </svg>
    </div>
  );
}

// ─── Phase Badge ───────────────────────────────────────────────────────────
function Badge({ type }) {
  const b = BADGES[type] || BADGES.phase1_passed;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${b.color}40`,
      borderRadius: '100px',
      padding: '6px 16px',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: b.color }} />
      <span style={{ color: b.color, fontSize: '9px', fontWeight: 700, letterSpacing: '0.25em', fontFamily: "'Inter', sans-serif" }}>
        {b.label}
      </span>
    </div>
  );
}

// ─── Gold Seal ─────────────────────────────────────────────────────────────
function Seal() {
  return (
    <div style={{ position: 'relative', width: '76px', height: '76px' }}>
      <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
        <circle cx="38" cy="38" r="36" fill="none" stroke={T.gold} strokeWidth="1" opacity="0.7" />
        <circle cx="38" cy="38" r="33" fill="none" stroke={T.gold} strokeWidth="0.4" opacity="0.3" />
        <circle cx="38" cy="38" r="28" fill="none" stroke={T.gold} strokeWidth="0.6" opacity="0.5" />
        <circle cx="38" cy="38" r="25" fill="none" stroke={T.gold} strokeWidth="0.3" opacity="0.2" />
        <text x="38" y="45" textAnchor="middle" fontSize="18" fontWeight="900" fill={T.gold} fontFamily="'Cinzel', serif" opacity="0.9">XF</text>
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
          const rad = (deg * Math.PI) / 180;
          return <circle key={deg} cx={38 + 30 * Math.cos(rad)} cy={38 + 30 * Math.sin(rad)} r="1.2" fill={T.gold} opacity="0.5" />;
        })}
        <path d="M14 50 Q38 54 62 50" fill="none" stroke={T.gold} strokeWidth="0.3" opacity="0.3" />
        <text x="38" y="65" textAnchor="middle" fontSize="4" fontWeight="700" fill={T.gold} opacity="0.4" fontFamily="'Inter', sans-serif" letterSpacing="0.2em">PROP TRADER</text>
      </svg>
    </div>
  );
}

// ─── CEO Signature ─────────────────────────────────────────────────────────
function Signature() {
  return (
    <svg width="130" height="42" viewBox="0 0 200 70" fill="none" style={{ marginBottom: '2px' }}>
      <path d="M10 48 C10 20, 14 12, 20 12 C28 12, 34 18, 34 30 C34 42, 28 50, 18 50 C14 50, 10 48, 10 48" stroke="#e2e8f0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
      <path d="M38 34 C39 30, 41 26, 43 24 C44 32, 44 40, 43 48" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
      <circle cx="42" cy="20" r="1.5" fill="#e2e8f0" opacity="0.8"/>
      <path d="M46 38 C48 32, 53 28, 57 30 C60 32, 59 38, 56 42 C53 46, 48 46, 46 42 C45 38, 47 32, 52 32" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
      <path d="M62 30 C66 24, 72 24, 74 30 C76 36, 72 44, 68 46 C64 48, 60 46, 60 40 C60 34, 64 30, 68 30" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
      <path d="M74 30 C76 38, 76 50, 72 58 C70 62, 66 64, 62 62" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75"/>
      <path d="M80 34 C82 26, 90 24, 94 30 C98 36, 96 46, 90 48 C84 50, 79 44, 80 36" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
      <path d="M102 14 C102 14, 102 34, 102 50" stroke="#e2e8f0" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85"/>
      <path d="M102 14 C110 14, 116 16, 116 22 C116 28, 110 30, 102 30" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85"/>
      <path d="M104 30 C110 34, 118 44, 122 50" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85"/>
      <path d="M126 38 C128 30, 134 28, 138 32 C141 35, 139 42, 135 45 C131 48, 126 46, 126 40 C126 34, 130 32, 135 32" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
      <path d="M143 26 C145 32, 148 40, 150 46" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85"/>
      <path d="M158 26 C155 32, 150 46, 146 54 C143 60, 140 64, 136 66" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.75"/>
      <path d="M162 36 C164 28, 172 26, 175 32 C178 37, 175 44, 170 47 C165 50, 160 46, 161 39 C162 32, 167 30, 172 32" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
      <path d="M178 32 C182 28, 188 30, 186 36 C184 40, 178 40, 178 44 C178 48, 184 50, 190 48 C194 46, 196 42, 195 40" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8"/>
      <path d="M8 56 C40 60, 90 58, 140 56 C160 55, 180 56, 195 54" stroke="#e2e8f0" strokeWidth="0.7" strokeLinecap="round" opacity="0.2"/>
    </svg>
  );
}

// ─── Ornamental Divider ────────────────────────────────────────────────────
function OrnamentalDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '50%', maxWidth: '420px', margin: '26px 0' }}>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, transparent, ${T.goldDim})` }} />
      <div style={{ width: '5px', height: '5px', background: T.gold, transform: 'rotate(45deg)', margin: '0 10px' }} />
      <div style={{ width: '1px', height: '12px', background: T.goldDim }} />
      <div style={{ width: '5px', height: '5px', background: T.gold, transform: 'rotate(45deg)', margin: '0 10px' }} />
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(to left, transparent, ${T.goldDim})` }} />
    </div>
  );
}

// ─── MAIN: Certificate Document ────────────────────────────────────────────
export default function CertificateDocument({ cert, forCapture = false }) {
  const type = cert?.type || 'phase1_passed';
  const badge = BADGES[type] || BADGES.phase1_passed;
  const subtitle = SUBTITLES[type] || SUBTITLES.phase1_passed;
  const isWithdrawal = type === 'first_payout';

  return (
    <div style={{
      width: forCapture ? '1400px' : '100%',
      height: forCapture ? '990px' : undefined,
      aspectRatio: forCapture ? undefined : '1.414 / 1',
      background: T.bgGrad,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      borderRadius: forCapture ? '0' : '14px',
      boxShadow: forCapture ? 'none' : '0 0 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      flexShrink: 0,
      color: T.text,
      border: forCapture ? 'none' : '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Chart watermark */}
      <Watermark />

      {/* ── Double border frame ── */}
      <div style={{ position: 'absolute', inset: '20px', border: `1px solid ${T.goldDim}`, borderRadius: '2px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '26px', border: `0.5px solid ${T.border}`, borderRadius: '1px', pointerEvents: 'none' }} />

      {/* Gold corner ornaments */}
      <CornerOrnament position="topLeft" />
      <CornerOrnament position="topRight" />
      <CornerOrnament position="bottomLeft" />
      <CornerOrnament position="bottomRight" />

      {/* ── Header ── */}
      <div style={{
        position: 'absolute', top: '46px', left: '60px', right: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: '18px',
        borderBottom: `0.5px solid ${T.border}`,
      }}>
        <XFLogo size="md" />
        <Badge type={type} />
      </div>

      {/* ── Body ── */}
      <div style={{
        position: 'absolute', top: '130px', left: '60px', right: '60px', bottom: '110px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Crown icon */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '10px',
          background: 'rgba(197,160,89,0.04)',
          border: `0.5px solid ${T.goldDim}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
            <path d="M3 20h18" />
          </svg>
        </div>

        {/* Certificate title - luxury serif */}
        <div style={{
          fontSize: '52px', fontWeight: 600, color: T.text, letterSpacing: '0.08em',
          fontFamily: "'Cormorant Garamond', serif", lineHeight: 1, textAlign: 'center',
        }}>
          CERTIFICATE
        </div>
        <div style={{
          fontSize: '13px', fontWeight: 600, color: badge.color,
          letterSpacing: '0.35em', marginTop: '8px', fontFamily: "'Inter', sans-serif",
        }}>
          {isWithdrawal ? 'OF WITHDRAWAL' : 'OF COMPLETION'}
        </div>

        {/* Ornamental divider */}
        <OrnamentalDivider />

        {/* Presented to */}
        <div style={{
          color: T.muted, fontSize: '9px', letterSpacing: '0.28em', fontWeight: 600,
          fontFamily: "'Inter', sans-serif", marginBottom: '12px',
        }}>
          PROUDLY PRESENTED TO
        </div>

        {/* Trader name - luxury serif */}
        <div style={{
          fontSize: '48px', fontWeight: 600, color: T.text,
          fontFamily: "'Cormorant Garamond', serif",
          textAlign: 'center', marginBottom: '14px', lineHeight: 1.1,
          letterSpacing: '0.02em',
        }}>
          {cert?.trader_name || 'Your Name'}
        </div>

        {/* Underline beneath name */}
        <div style={{
          width: '200px', height: '1px',
          background: `linear-gradient(to right, transparent, ${T.goldDim}, transparent)`,
          marginBottom: '16px',
        }} />

        {/* Achievement text */}
        <div style={{
          color: 'rgba(148,163,184,0.6)', fontSize: '12px', fontWeight: 500, textAlign: 'center',
          fontFamily: "'Inter', sans-serif", lineHeight: 1.7,
        }}>
          {isWithdrawal ? (
            <>For successfully processing a withdrawal from{' '}<span style={{ color: badge.color, fontWeight: 700 }}>XFUNDED TRADER</span></>
          ) : (
            <>For successfully completing the{' '}<span style={{ color: badge.color, fontWeight: 700 }}>{subtitle}</span></>
          )}
        </div>
        <div style={{
          color: 'rgba(148,163,184,0.4)', fontSize: '11px', fontWeight: 400, textAlign: 'center',
          fontFamily: "'Inter', sans-serif", marginTop: '6px',
        }}>
          {isWithdrawal
            ? 'Your hard work and consistency have paid off. Congratulations!'
            : 'You have demonstrated exceptional skill, discipline and consistency.'}
        </div>

        {/* Stats row - refined minimalist boxes */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px',
          marginTop: '36px', width: '100%', maxWidth: '660px',
        }}>
          {(isWithdrawal
            ? [
              { label: 'WITHDRAWAL AMOUNT', value: cert?.withdrawal_amount ? `$${Number(cert.withdrawal_amount).toLocaleString()}` : '-' },
              { label: 'ACCOUNT SIZE', value: cert?.account_size ? `$${Number(cert.account_size).toLocaleString()}` : '-' },
              { label: 'DATE', value: cert?.issue_date || new Date().toLocaleDateString('en-GB') },
              { label: 'CERTIFICATE ID', value: cert?.certificate_id ? `#${cert.certificate_id.slice(0, 12)}` : '-' },
            ]
            : [
              { label: 'ACCOUNT SIZE', value: cert?.account_size ? `$${Number(cert.account_size).toLocaleString()}` : '-' },
              { label: 'CHALLENGE TYPE', value: (cert?.challenge_type || 'two-step').replace('-', ' ').toUpperCase() },
              { label: 'DATE', value: cert?.issue_date || new Date().toLocaleDateString('en-GB') },
              { label: 'CERTIFICATE ID', value: cert?.certificate_id ? `#${cert.certificate_id.slice(0, 12)}` : '-' },
            ]
          ).map((s) => (
            <div key={s.label} style={{
              background: T.statBg,
              borderTop: `1px solid ${T.goldDim}`,
              borderBottom: `0.5px solid ${T.border}`,
              borderLeft: 'none', borderRight: 'none',
              padding: '16px 8px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: '58px',
            }}>
              <div style={{ color: T.gold, fontSize: '14px', fontWeight: 600, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ color: T.muted, fontSize: '7px', letterSpacing: '0.18em', marginTop: '7px', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        position: 'absolute', bottom: '46px', left: '60px', right: '60px',
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '24px',
        paddingTop: '20px',
        borderTop: `0.5px solid ${T.border}`,
      }}>
        {/* Website / Verify */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ color: T.muted, fontSize: '7px', letterSpacing: '0.22em', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>VERIFY AT</div>
          <div style={{ color: 'rgba(226,232,240,0.75)', fontSize: '11px', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
            {FIRM.website}
          </div>
        </div>

        {/* Seal */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Seal />
        </div>

        {/* CEO */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <div style={{ color: T.muted, fontSize: '7px', letterSpacing: '0.22em', marginBottom: '4px', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>CERTIFIED BY</div>
          <Signature />
          <div style={{ width: '120px', height: '0.5px', background: T.border, marginTop: '4px', marginBottom: '6px' }} />
          <div style={{ color: 'rgba(226,232,240,0.85)', fontSize: '11px', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>{FIRM.ceo}</div>
          <div style={{ color: T.muted, fontSize: '7px', marginTop: '3px', fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em' }}>Chief Executive Officer</div>
        </div>
      </div>
    </div>
  );
}