import React from 'react';
import XFLogo from '@/components/shared/XFLogo';
import { QrCode, CheckCircle } from 'lucide-react';

const FIRM = {
  name: 'XFUNDED TRADER',
  website: 'xfundedtrader.com',
  verifyUrl: 'xfundedtrader.com/verify',
  ceo: 'Diego Reyes',
};

// ─── Theme — single premium dark theme matching homepage ──────────────────
const T = {
  bg: '#05060a',
  text: '#f1f5f9',
  muted: 'rgba(148,163,184,0.5)',
  accent: '#FF5C00',
  accent2: '#CCFF00',
  gold: '#C5A059',
  cardBg: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  glassBg: 'rgba(255,255,255,0.03)',
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

// ─── Trading Chart Watermark ───────────────────────────────────────────────
function Watermark() {
  // Generate realistic-looking candle data
  const candles = [
    { o: 120, c: 135, h: 142, l: 115 },
    { o: 135, c: 128, h: 140, l: 122 },
    { o: 128, c: 145, h: 150, l: 125 },
    { o: 145, c: 160, h: 165, l: 140 },
    { o: 160, c: 152, h: 168, l: 148 },
    { o: 152, c: 170, h: 175, l: 148 },
    { o: 170, c: 162, h: 178, l: 158 },
    { o: 162, c: 185, h: 190, l: 160 },
    { o: 185, c: 178, h: 192, l: 172 },
    { o: 178, c: 195, h: 200, l: 175 },
    { o: 195, c: 210, h: 215, l: 190 },
    { o: 210, c: 200, h: 218, l: 195 },
    { o: 200, c: 225, h: 230, l: 198 },
    { o: 225, c: 240, h: 248, l: 220 },
    { o: 240, c: 260, h: 265, l: 238 },
  ];

  const chartW = 480;
  const chartH = 330;
  const padding = { top: 30, right: 25, bottom: 25, left: 25 };
  const candleW = (chartW - padding.left - padding.right) / candles.length - 3;
  const allPrices = candles.flatMap(c => [c.h, c.l]);
  const minP = Math.min(...allPrices) - 10;
  const maxP = Math.max(...allPrices) + 10;
  const scale = (v) => padding.top + chartH - padding.bottom - ((v - minP) / (maxP - minP)) * (chartH - padding.top - padding.bottom);

  // Support & resistance levels
  const levels = [135, 160, 185, 210, 240];

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${chartW} ${chartH}`} fill="none"
      style={{ position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none' }}>
      {/* Grid lines */}
      {Array.from({ length: 16 }, (_, i) => (
        <React.Fragment key={`grid-${i}`}>
          <line x1={padding.left} y1={padding.top + i * 19} x2={chartW - padding.right} y2={padding.top + i * 19}
            stroke="#C5A059" strokeWidth="0.2" />
          <line x1={padding.left + i * 30} y1={padding.top} x2={padding.left + i * 30} y2={chartH - padding.bottom}
            stroke="#C5A059" strokeWidth="0.2" />
        </React.Fragment>
      ))}

      {/* Support/Resistance levels */}
      {levels.map((lv, i) => (
        <line key={`sr-${i}`} x1={padding.left} y1={scale(lv)} x2={chartW - padding.right} y2={scale(lv)}
          stroke="#C5A059" strokeWidth="0.6" strokeDasharray="6,4" opacity="0.8" />
      ))}

      {/* Candlesticks */}
      {candles.map((c, i) => {
        const x = padding.left + i * (candleW + 3) + candleW / 2;
        const isBullish = c.c >= c.o;
        const fill = isBullish ? 'none' : '#C5A059';
        const strokeC = '#C5A059';
        const bodyTop = scale(Math.max(c.o, c.c));
        const bodyBottom = scale(Math.min(c.o, c.c));
        const bodyH = Math.max(bodyBottom - bodyTop, 1);
        return (
          <React.Fragment key={i}>
            {/* Wick */}
            <line x1={x} y1={scale(c.h)} x2={x} y2={scale(c.l)} stroke={strokeC} strokeWidth="0.8" />
            {/* Body */}
            <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH} rx="1"
              fill={fill} stroke={strokeC} strokeWidth="0.7" />
            {/* Volume bar below */}
            <rect x={x - candleW / 2 + 0.5} y={chartH - padding.bottom + 2} width={candleW - 1}
              height={3 + Math.abs(c.c - c.o) * 0.5} fill={strokeC} opacity="0.35" rx="0.5" />
          </React.Fragment>
        );
      })}

      {/* Trend line — rising channel */}
      <line x1={padding.left} y1={scale(118)} x2={chartW - padding.right} y2={scale(250)}
        stroke="#C5A059" strokeWidth="0.5" strokeDasharray="3,5" opacity="0.5" />
      <line x1={padding.left + 20} y1={scale(105)} x2={chartW - padding.right} y2={scale(238)}
        stroke="#C5A059" strokeWidth="0.5" strokeDasharray="3,5" opacity="0.5" />

      {/* Pulsing breakout arrow — top right */}
      <line x1={400} y1={scale(230)} x2={430} y2={scale(210)} stroke="#C5A059" strokeWidth="1" opacity="0.6" />
      <polygon points="430,150 436,166 424,166" fill="#C5A059" opacity="0.6"
        transform={`translate(0, ${scale(210) - 158})`} />
    </svg>
  );
}

// ─── Corner accent marks ───────────────────────────────────────────────────
function Corners() {
  const marks = [
    { top: '24px', left: '24px' },
    { top: '24px', right: '24px', flipH: true },
    { bottom: '24px', left: '24px', flipV: true },
    { bottom: '24px', right: '24px', flipH: true, flipV: true },
  ];
  return marks.map((pos, i) => (
    <div key={i} style={{
      position: 'absolute', ...pos, width: '40px', height: '40px', pointerEvents: 'none',
      transform: `${pos.flipH ? 'scaleX(-1)' : ''} ${pos.flipV ? 'scaleY(-1)' : ''}`,
    }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <line x1="2" y1="2" x2="18" y2="2" stroke="#FF5C00" strokeWidth="1.5" opacity="0.6" />
        <line x1="2" y1="2" x2="2" y2="18" stroke="#FF5C00" strokeWidth="1.5" opacity="0.6" />
        <line x1="2" y1="10" x2="12" y2="2" stroke="#FF5C00" strokeWidth="0.4" opacity="0.2" />
        <circle cx="6" cy="6" r="1.5" fill="#FF5C00" opacity="0.5" />
      </svg>
    </div>
  ));
}

// ─── Phase badge ───────────────────────────────────────────────────────────
function Badge({ type }) {
  const b = BADGES[type] || BADGES.phase1_passed;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${b.color}40`,
      borderRadius: '6px',
      padding: '5px 14px',
      display: 'flex', alignItems: 'center', gap: '6px',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: b.color, boxShadow: `0 0 8px ${b.color}80` }} />
      <span style={{ color: b.color, fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em', fontFamily: "'Inter', sans-serif" }}>
        {b.label}
      </span>
    </div>
  );
}

// ─── XF Gold Seal ──────────────────────────────────────────────────────────
function Seal() {
  return (
    <div style={{ position: 'relative', width: '72px', height: '72px' }}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <circle cx="36" cy="36" r="34" fill="none" stroke="#C5A059" strokeWidth="1.5" opacity="0.8" />
        <circle cx="36" cy="36" r="30" fill="none" stroke="#C5A059" strokeWidth="0.5" opacity="0.45" />
        <circle cx="36" cy="36" r="25" fill="none" stroke="#C5A059" strokeWidth="0.8" opacity="0.6" />
        <text x="36" y="43" textAnchor="middle" fontSize="20" fontWeight="900" fill="#C5A059" fontFamily="'Inter', sans-serif" opacity="0.9">XF</text>
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
          const rad = (deg * Math.PI) / 180;
          return <circle key={deg} cx={36 + 27 * Math.cos(rad)} cy={36 + 27 * Math.sin(rad)} r="1.3" fill="#C5A059" opacity="0.65" />;
        })}
        <text x="36" y="62" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#C5A059" opacity="0.4" fontFamily="'Inter', sans-serif" letterSpacing="0.15em">PROP TRADER</text>
      </svg>
    </div>
  );
}

// ─── CEO Signature ─────────────────────────────────────────────────────────
function Signature() {
  return (
    <svg width="140" height="48" viewBox="0 0 200 70" fill="none" style={{ marginBottom: '2px' }}>
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

// ─── MAIN: Certificate Document ──────────────────────────────────────────
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
      background: T.bg,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      borderRadius: forCapture ? '0' : '16px',
      boxShadow: forCapture ? 'none' : '0 0 60px rgba(255,92,0,0.08), 0 0 120px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      flexShrink: 0,
      color: T.text,
      border: forCapture ? 'none' : '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Ambient glow top — subtle solid oval */}
      <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '120px', background: 'rgba(255,92,0,0.03)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Chart watermark */}
      <Watermark />

      {/* Border frame */}
      <div style={{ position: 'absolute', inset: '22px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '26px', border: '1px solid rgba(197,160,89,0.2)', borderRadius: '2px', pointerEvents: 'none' }} />

      {/* Corner marks */}
      <Corners />

      {/* Side tick marks — Bloomberg terminal style */}
      <div style={{ position: 'absolute', top: '50%', left: '30px', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
        {['1.0842', '1.0838', '1.0834', '1.0830', '1.0826', '1.0822'].map((v, i) => (
          <div key={`l${i}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '1px', background: i === 2 ? 'rgba(197,160,89,0.25)' : 'rgba(255,255,255,0.04)' }} />
            <span style={{ color: i === 2 ? 'rgba(197,160,89,0.25)' : 'rgba(255,255,255,0.04)', fontSize: '5px', fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', top: '50%', right: '30px', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', alignItems: 'flex-end' }}>
        {['2,652.40', '2,651.80', '2,651.20', '2,650.60', '2,650.00', '2,649.40'].map((v, i) => (
          <div key={`r${i}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: i === 2 ? 'rgba(197,160,89,0.25)' : 'rgba(255,255,255,0.04)', fontSize: '5px', fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em' }}>{v}</span>
            <div style={{ width: '8px', height: '1px', background: i === 2 ? 'rgba(197,160,89,0.25)' : 'rgba(255,255,255,0.04)' }} />
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div style={{
        position: 'absolute', top: '42px', left: '56px', right: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Tiny bull/bear accent */}
        <svg width="20" height="12" viewBox="0 0 20 12" fill="none" style={{ opacity: 0.2 }}>
          <path d="M2 10 L5 4 L8 7 L11 2 L14 5 L17 1" stroke="#C5A059" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 1 L17 1 L17 3" stroke="#C5A059" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <XFLogo size="md" />
        <Badge type={type} />
      </div>

      {/* ── Body ── */}
      <div style={{
        position: 'absolute', top: '120px', left: '56px', right: '56px', bottom: '100px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Crown icon */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'rgba(255,92,0,0.08)',
          border: '1px solid rgba(255,92,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 0 30px rgba(255,92,0,0.1)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={badge.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
            <path d="M3 20h18" />
          </svg>
        </div>

        {/* Certificate title */}
        <div style={{
          fontSize: '42px', fontWeight: 900, color: T.text, letterSpacing: '0.06em',
          fontFamily: "'Inter', sans-serif", lineHeight: 1, textAlign: 'center',
        }}>
          CERTIFICATE
        </div>
        <div style={{
          fontSize: '15px', fontWeight: 700, color: badge.color,
          letterSpacing: '0.3em', marginTop: '6px', fontFamily: "'Inter', sans-serif",
        }}>
          {isWithdrawal ? 'OF WITHDRAWAL' : 'OF COMPLETION'}
        </div>

        {/* Gold divider — use solid lines to avoid html2canvas gradient bug */}
        <div style={{ display: 'flex', alignItems: 'center', width: '55%', maxWidth: '420px', margin: '22px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(197,160,89,0.35)' }} />
          <div style={{ width: '8px', height: '8px', background: '#C5A059', transform: 'rotate(45deg)', margin: '0 14px', boxShadow: '0 0 10px rgba(197,160,89,0.5)' }} />
          <div style={{ flex: 1, height: '1px', background: 'rgba(197,160,89,0.35)' }} />
        </div>

        {/* Presented to */}
        <div style={{
          color: T.muted, fontSize: '10px', letterSpacing: '0.22em', fontWeight: 600,
          fontFamily: "'Inter', sans-serif", marginBottom: '8px',
        }}>
          PROUDLY PRESENTED TO
        </div>

        {/* Trader name */}
        <div style={{
          fontSize: '44px', fontWeight: 800, color: T.text,
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center', marginBottom: '12px', lineHeight: 1.15,
          letterSpacing: '-0.01em',
        }}>
          {cert?.trader_name || 'Your Name'}
        </div>

        {/* Achievement text */}
        <div style={{
          color: 'rgba(148,163,184,0.6)', fontSize: '12px', fontWeight: 500, textAlign: 'center',
          fontFamily: "'Inter', sans-serif", lineHeight: 1.6,
        }}>
          {isWithdrawal ? (
            <>For successfully processed a withdrawal from{' '}<span style={{ color: badge.color, fontWeight: 700 }}>XFUNDED TRADER</span></>
          ) : (
            <>For successfully completing the{' '}<span style={{ color: badge.color, fontWeight: 700 }}>{subtitle}</span></>
          )}
        </div>
        <div style={{
          color: 'rgba(148,163,184,0.4)', fontSize: '11px', fontWeight: 400, textAlign: 'center',
          fontFamily: "'Inter', sans-serif", marginTop: '4px',
        }}>
          {isWithdrawal
            ? 'Your hard work and consistency have paid off. Congratulations!'
            : 'You have demonstrated exceptional skill, discipline and consistency.'}
        </div>

        {/* Trading philosophy mantra */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginTop: '22px',
          color: 'rgba(197,160,89,0.3)', fontSize: '8px', fontWeight: 700,
          letterSpacing: '0.25em', fontFamily: "'Inter', sans-serif",
        }}>
          <span style={{ width: '14px', height: '1px', background: 'rgba(197,160,89,0.2)' }} />
          DISCIPLINE
          <span style={{ width: '4px', height: '4px', background: 'rgba(197,160,89,0.3)', borderRadius: '50%' }} />
          CONSISTENCY
          <span style={{ width: '4px', height: '4px', background: 'rgba(197,160,89,0.3)', borderRadius: '50%' }} />
          EXECUTION
          <span style={{ width: '14px', height: '1px', background: 'rgba(197,160,89,0.2)' }} />
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: '14px', marginTop: '26px', width: '100%', maxWidth: '580px', justifyContent: 'center',
        }}>
          {(isWithdrawal
            ? [
              { label: 'WITHDRAWAL AMOUNT', value: cert?.withdrawal_amount ? `$${Number(cert.withdrawal_amount).toLocaleString()}` : '—' },
              { label: 'ACCOUNT', value: cert?.account_size ? `$${Number(cert.account_size).toLocaleString()}` : '—' },
            ]
            : [
              { label: 'ACCOUNT SIZE', value: cert?.account_size ? `$${Number(cert.account_size).toLocaleString()}` : '—' },
            ]
          ).concat([
            { label: 'DATE', value: cert?.issue_date || new Date().toLocaleDateString('en-GB') },
            { label: 'CERTIFICATE ID', value: cert?.certificate_id ? `#${cert.certificate_id.slice(0, 12)}` : '—' },
          ]).map((s) => (
            <div key={s.label} style={{
              flex: 1, background: T.glassBg,
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px', padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ color: badge.color, fontSize: '13px', fontWeight: 800, fontFamily: "'Inter', sans-serif" }}>{s.value}</div>
              <div style={{ color: T.muted, fontSize: '8px', letterSpacing: '0.1em', marginTop: '4px', fontFamily: "'Inter', sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        position: 'absolute', bottom: '44px', left: '56px', right: '56px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        paddingTop: '14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* DATE */}
        <div>
          <div style={{ color: T.muted, fontSize: '8px', letterSpacing: '0.12em', marginBottom: '8px', fontFamily: "'Inter', sans-serif" }}>DATE</div>
          <div style={{ color: 'rgba(226,232,240,0.7)', fontSize: '10px', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
            {cert?.issue_date || new Date().toLocaleDateString('en-GB')}
          </div>
        </div>

        {/* Seal */}
        <Seal />

        {/* CEO */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: T.muted, fontSize: '8px', letterSpacing: '0.12em', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>CEO</div>
          <Signature />
          <div style={{ width: '120px', height: '1px', background: 'rgba(255,255,255,0.25)', marginLeft: 'auto', marginBottom: '3px' }} />
          <div style={{ color: 'rgba(226,232,240,0.8)', fontSize: '9px', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>{FIRM.ceo}</div>
          <div style={{ color: T.muted, fontSize: '7px', marginTop: '1px', fontFamily: "'Inter', sans-serif" }}>Chief Executive Officer</div>
        </div>
      </div>

      {/* ── QR Verification ── */}
      <div style={{
        position: 'absolute', bottom: '108px', left: '56px',
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '7px 12px',
        background: T.glassBg,
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '8px',
      }}>
        <div style={{
          width: '40px', height: '40px', background: '#0a0a0a',
          borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(197,160,89,0.3)',
        }}>
          <QrCode style={{ width: '26px', height: '26px', color: '#C5A059' }} />
        </div>
        <div>
          <div style={{ color: T.muted, fontSize: '7px', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>VERIFY CERTIFICATE</div>
          <div style={{ color: 'rgba(226,232,240,0.7)', fontSize: '9px', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{FIRM.verifyUrl}</div>
        </div>
      </div>
    </div>
  );
}