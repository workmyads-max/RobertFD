import React from 'react';
import XFLogo from '@/components/shared/XFLogo';

const FIRM = {
  name: 'XFUNDED TRADER',
  website: 'xfundedtrader.com',
  ceo: 'Diego Reyes',
};

// ─── Luxury Palette ────────────────────────────────────────────────────────
const T = {
  bg: '#05060a',
  bgGrad: 'radial-gradient(ellipse at 50% 0%, #0a0c14 0%, #06070d 40%, #05060a 100%)',
  text: '#f1f5f9',
  textSoft: 'rgba(241,245,249,0.7)',
  muted: 'rgba(148,163,184,0.45)',
  accent: '#FF5C00',
  gold: '#C5A059',
  goldBright: '#D4B06A',
  goldDim: 'rgba(197,160,89,0.25)',
  goldFaint: 'rgba(197,160,89,0.08)',
  border: 'rgba(255,255,255,0.06)',
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

// ─── Ornate Gold Corner Flourish ───────────────────────────────────────────
function CornerFlourish({ position }) {
  const base = { position: 'absolute', width: '90px', height: '90px', pointerEvents: 'none' };
  const transforms = {
    topLeft:     { top: '28px', left: '28px' },
    topRight:    { top: '28px', right: '28px', transform: 'scaleX(-1)' },
    bottomLeft:  { bottom: '28px', left: '28px', transform: 'scaleY(-1)' },
    bottomRight: { bottom: '28px', right: '28px', transform: 'scale(-1,-1)' },
  };
  return (
    <div style={{ ...base, ...transforms[position] }}>
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
        {/* L-shaped corner lines */}
        <path d="M6 60 L6 6 L60 6" stroke={T.gold} strokeWidth="1.2" fill="none" opacity="0.7" />
        <path d="M12 60 L12 12 L60 12" stroke={T.gold} strokeWidth="0.5" fill="none" opacity="0.3" />
        {/* Decorative arcs */}
        <path d="M6 30 Q6 6 30 6" stroke={T.goldBright} strokeWidth="0.6" fill="none" opacity="0.4" />
        <path d="M12 36 Q12 12 36 12" stroke={T.gold} strokeWidth="0.4" fill="none" opacity="0.2" />
        {/* Corner diamond */}
        <path d="M6 6 L12 0 L18 6 L12 12 Z" fill="none" stroke={T.goldBright} strokeWidth="1" opacity="0.8" />
        <circle cx="12" cy="6" r="2.5" fill="none" stroke={T.gold} strokeWidth="0.8" opacity="0.6" />
        {/* Small flourish dots */}
        <circle cx="24" cy="6" r="1" fill={T.gold} opacity="0.5" />
        <circle cx="6" cy="24" r="1" fill={T.gold} opacity="0.5" />
        <circle cx="30" cy="6" r="0.5" fill={T.gold} opacity="0.3" />
        <circle cx="6" cy="30" r="0.5" fill={T.gold} opacity="0.3" />
        {/* Leaf-like swirl */}
        <path d="M20 20 Q28 18 30 26 Q28 30 22 28 Q18 26 20 20" fill="none" stroke={T.gold} strokeWidth="0.5" opacity="0.3" />
      </svg>
    </div>
  );
}

// ─── Ornamental Divider with Center Diamond ─────────────────────────────────
function Divider({ width = '360px' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width, maxWidth: '100%', margin: '20px 0' }}>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, transparent, ${T.goldDim})` }} />
      <div style={{ width: '4px', height: '4px', background: T.gold, transform: 'rotate(45deg)', margin: '0 8px' }} />
      <div style={{ width: '1px', height: '10px', background: T.goldDim }} />
      <div style={{ width: '6px', height: '6px', background: T.goldBright, transform: 'rotate(45deg)', margin: '0 10px', boxShadow: `0 0 6px ${T.goldDim}` }} />
      <div style={{ width: '1px', height: '10px', background: T.goldDim }} />
      <div style={{ width: '4px', height: '4px', background: T.gold, transform: 'rotate(45deg)', margin: '0 8px' }} />
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(to left, transparent, ${T.goldDim})` }} />
    </div>
  );
}

// ─── CEO Signature (handwritten SVG) ───────────────────────────────────────
function Signature() {
  return (
    <svg width="150" height="44" viewBox="0 0 200 70" fill="none" style={{ marginBottom: '0' }}>
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
      <path d="M8 56 C40 60, 90 58, 140 56 C160 55, 180 56, 195 54" stroke="#e2e8f0" strokeWidth="0.7" strokeLinecap="round" opacity="0.15"/>
    </svg>
  );
}

// ─── Gold Seal ─────────────────────────────────────────────────────────────
function Seal() {
  return (
    <div style={{ position: 'relative', width: '72px', height: '72px' }}>
      <svg width="72" height="72" viewBox="0 0 76 76" fill="none">
        <circle cx="38" cy="38" r="36" fill="none" stroke={T.gold} strokeWidth="1" opacity="0.7" />
        <circle cx="38" cy="38" r="33" fill="none" stroke={T.gold} strokeWidth="0.4" opacity="0.3" />
        <circle cx="38" cy="38" r="28" fill="none" stroke={T.gold} strokeWidth="0.6" opacity="0.5" />
        <circle cx="38" cy="38" r="25" fill={T.goldFaint} stroke={T.gold} strokeWidth="0.3" opacity="0.2" />
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

// ─── Crown Emblem ──────────────────────────────────────────────────────────
function CrownEmblem() {
  return (
    <div style={{
      width: '56px', height: '56px', borderRadius: '50%',
      background: T.goldFaint,
      border: `1px solid ${T.goldDim}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '20px',
    }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.goldBright} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
        <path d="M3 20h18" />
        <circle cx="2" cy="4" r="1" fill={T.goldBright} />
        <circle cx="22" cy="4" r="1" fill={T.goldBright} />
        <circle cx="12" cy="3" r="1" fill={T.goldBright} />
      </svg>
    </div>
  );
}

// ─── Type Badge (centered pill) ────────────────────────────────────────────
function TypeBadge({ type }) {
  const b = BADGES[type] || BADGES.phase1_passed;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      background: `${b.color}0D`,
      border: `1px solid ${b.color}33`,
      borderRadius: '100px',
      padding: '5px 14px',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: b.color }} />
      <span style={{ color: b.color, fontSize: '8px', fontWeight: 700, letterSpacing: '0.28em', fontFamily: "'Inter', sans-serif" }}>
        {b.label}
      </span>
    </div>
  );
}

// ─── Inline Stat Strip with vertical dividers ───────────────────────────────
function StatStrip({ cert, isWithdrawal }) {
  const stats = isWithdrawal
    ? [
      { label: 'WITHDRAWAL', value: cert?.withdrawal_amount ? `$${Number(cert.withdrawal_amount).toLocaleString()}` : '-' },
      { label: 'ACCOUNT SIZE', value: cert?.account_size ? `$${Number(cert.account_size).toLocaleString()}` : '-' },
      { label: 'DATE', value: cert?.issue_date || new Date().toLocaleDateString('en-GB') },
      { label: 'CERT ID', value: cert?.certificate_id ? `#${cert.certificate_id.slice(0, 10)}` : '-' },
    ]
    : [
      { label: 'ACCOUNT SIZE', value: cert?.account_size ? `$${Number(cert.account_size).toLocaleString()}` : '-' },
      { label: 'CHALLENGE', value: (cert?.challenge_type || 'two-step').replace('-', ' ').toUpperCase() },
      { label: 'DATE', value: cert?.issue_date || new Date().toLocaleDateString('en-GB') },
      { label: 'CERT ID', value: cert?.certificate_id ? `#${cert.certificate_id.slice(0, 10)}` : '-' },
    ];

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', justifyContent: 'center',
      marginTop: '32px', width: '100%', maxWidth: '640px',
    }}>
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          <div style={{
            flex: 1, textAlign: 'center', padding: '0 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              color: T.goldBright, fontSize: '15px', fontWeight: 600,
              fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.2, marginBottom: '6px',
            }}>
              {s.value}
            </div>
            <div style={{
              color: T.muted, fontSize: '7px', letterSpacing: '0.2em', fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
            }}>
              {s.label}
            </div>
          </div>
          {i < stats.length - 1 && (
            <div style={{ width: '1px', background: T.goldDim, alignSelf: 'stretch', margin: '4px 0' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── MAIN: Certificate Document ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
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
      {/* ── Triple border frame ── */}
      <div style={{ position: 'absolute', inset: '16px', border: `1px solid ${T.goldDim}`, borderRadius: '3px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '22px', border: `0.5px solid ${T.goldFaint}`, borderRadius: '2px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '28px', border: `0.5px solid ${T.border}`, borderRadius: '1px', pointerEvents: 'none' }} />

      {/* Ornate corner flourishes */}
      <CornerFlourish position="topLeft" />
      <CornerFlourish position="topRight" />
      <CornerFlourish position="bottomLeft" />
      <CornerFlourish position="bottomRight" />

      {/* ── Centered content container ── */}
      <div style={{
        position: 'absolute', inset: '50px 70px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* ── Top: Logo centered + badge below ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingBottom: '16px', borderBottom: `0.5px solid ${T.border}`, width: '100%' }}>
          <XFLogo size="md" />
        </div>

        {/* ── Type badge ── */}
        <div style={{ marginTop: '16px' }}>
          <TypeBadge type={type} />
        </div>

        {/* ── Crown emblem ── */}
        <div style={{ marginTop: '20px' }}>
          <CrownEmblem />
        </div>

        {/* ── Certificate title ── */}
        <div style={{
          fontSize: '56px', fontWeight: 600, color: T.text, letterSpacing: '0.06em',
          fontFamily: "'Cormorant Garamond', serif", lineHeight: 1, textAlign: 'center',
        }}>
          CERTIFICATE
        </div>
        <div style={{
          fontSize: '13px', fontWeight: 600, color: badge.color,
          letterSpacing: '0.35em', marginTop: '6px', fontFamily: "'Inter', sans-serif",
        }}>
          {isWithdrawal ? 'OF WITHDRAWAL' : 'OF COMPLETION'}
        </div>

        {/* ── Ornamental divider ── */}
        <Divider />

        {/* ── Presented to ── */}
        <div style={{
          color: T.muted, fontSize: '9px', letterSpacing: '0.28em', fontWeight: 600,
          fontFamily: "'Inter', sans-serif", marginBottom: '10px',
        }}>
          PROUDLY PRESENTED TO
        </div>

        {/* ── Trader name ── */}
        <div style={{
          fontSize: '44px', fontWeight: 600, color: T.text,
          fontFamily: "'Cormorant Garamond', serif",
          textAlign: 'center', marginBottom: '10px', lineHeight: 1.1,
          letterSpacing: '0.02em',
        }}>
          {cert?.trader_name || 'Your Name'}
        </div>

        {/* ── Name underline ── */}
        <div style={{
          width: '220px', height: '1px',
          background: `linear-gradient(to right, transparent, ${T.goldDim}, transparent)`,
          marginBottom: '14px',
        }} />

        {/* ── Achievement description ── */}
        <div style={{
          color: T.textSoft, fontSize: '12px', fontWeight: 500, textAlign: 'center',
          fontFamily: "'Inter', sans-serif", lineHeight: 1.7,
        }}>
          {isWithdrawal ? (
            <>For successfully processing a withdrawal from{' '}<span style={{ color: badge.color, fontWeight: 700 }}>XFUNDED TRADER</span></>
          ) : (
            <>For successfully completing the{' '}<span style={{ color: badge.color, fontWeight: 700 }}>{subtitle}</span></>
          )}
        </div>
        <div style={{
          color: T.muted, fontSize: '11px', fontWeight: 400, textAlign: 'center',
          fontFamily: "'Inter', sans-serif", marginTop: '5px',
        }}>
          {isWithdrawal
            ? 'Your hard work and consistency have paid off. Congratulations!'
            : 'You have demonstrated exceptional skill, discipline and consistency.'}
        </div>

        {/* ── Inline stat strip ── */}
        <StatStrip cert={cert} isWithdrawal={isWithdrawal} />
      </div>

      {/* ── Footer ── 2-column: signature left, seal+domain right ── */}
      <div style={{
        position: 'absolute', bottom: '50px', left: '70px', right: '70px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        paddingTop: '20px',
        borderTop: `0.5px solid ${T.border}`,
      }}>
        {/* LEFT: CEO Signature */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Signature />
          <div style={{ width: '150px', height: '0.5px', background: T.goldDim, marginTop: '2px', marginBottom: '5px' }} />
          <div style={{ color: 'rgba(226,232,240,0.85)', fontSize: '12px', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>{FIRM.ceo}</div>
          <div style={{ color: T.muted, fontSize: '8px', marginTop: '2px', fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em' }}>Chief Executive Officer</div>
        </div>

        {/* RIGHT: Seal + Domain verification */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <Seal />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ color: T.muted, fontSize: '7px', letterSpacing: '0.22em', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>VERIFY AT</div>
            <div style={{ color: 'rgba(226,232,240,0.75)', fontSize: '11px', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
              {FIRM.website}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}