import React from 'react';
import XFLogo from '@/components/shared/XFLogo';

const FIRM = {
  name: 'XFUNDED TRADER',
  website: 'xfundedtrader.com',
  ceo: 'Diego Reyes',
  ceoTitle: 'Chief Executive Officer',
};

// ─── Palette ───────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0a',
  bgGlow: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.025) 0%, transparent 60%)',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.4)',
  textSoft: 'rgba(255,255,255,0.65)',
  gold: '#c5a059',
  accent: '#FF5C00',
  border: 'rgba(255,255,255,0.08)',
  line: 'rgba(255,255,255,0.12)',
};

const TYPES = {
  phase1_passed: { phase: 'PHASE 1',     eval: 'PHASE 1 EVALUATION',   sub: 'OF COMPLETION' },
  phase2_passed: { phase: 'PHASE 2',     eval: 'PHASE 2 EVALUATION',   sub: 'OF COMPLETION' },
  funded:        { phase: 'FUNDED TRADER', eval: 'FUNDED TRADER PROGRAM', sub: 'OF ACHIEVEMENT' },
  first_payout:  { phase: 'WITHDRAWAL',   eval: 'WITHDRAWAL',            sub: 'OF WITHDRAWAL' },
  consistency:   { phase: 'CONSISTENCY',  eval: 'CONSISTENCY AWARD',    sub: 'OF ACHIEVEMENT' },
  special:       { phase: 'SPECIAL',      eval: 'SPECIAL ACHIEVEMENT',  sub: 'OF ACHIEVEMENT' },
};

// ─── CEO Signature ─────────────────────────────────────────────────────────
function Signature() {
  return (
    <svg width="140" height="40" viewBox="0 0 200 70" fill="none">
      <path d="M10 48 C10 20, 14 12, 20 12 C28 12, 34 18, 34 30 C34 42, 28 50, 18 50 C14 50, 10 48, 10 48" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8"/>
      <path d="M38 34 C39 30, 41 26, 43 24 C44 32, 44 40, 43 48" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8"/>
      <circle cx="42" cy="20" r="1.5" fill="#e2e8f0" opacity="0.7"/>
      <path d="M46 38 C48 32, 53 28, 57 30 C60 32, 59 38, 56 42 C53 46, 48 46, 46 42" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M62 30 C66 24, 72 24, 74 30 C76 36, 72 44, 68 46 C64 48, 60 46, 60 40 C60 34, 64 30, 68 30" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M74 30 C76 38, 76 50, 72 58 C70 62, 66 64, 62 62" stroke="#e2e8f0" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M80 34 C82 26, 90 24, 94 30 C98 36, 96 46, 90 48 C84 50, 79 44, 80 36" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M102 14 C102 14, 102 34, 102 50" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M102 14 C110 14, 116 16, 116 22 C116 28, 110 30, 102 30" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M104 30 C110 34, 118 44, 122 50" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M126 38 C128 30, 134 28, 138 32 C141 35, 139 42, 135 45 C131 48, 126 46, 126 40" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M143 26 C145 32, 148 40, 150 46" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M158 26 C155 32, 150 46, 146 54 C143 60, 140 64, 136 66" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M162 36 C164 28, 172 26, 175 32 C178 37, 175 44, 170 47 C165 50, 160 46, 161 39" stroke="#e2e8f0" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M178 32 C182 28, 188 30, 186 36 C184 40, 178 40, 178 44 C178 48, 184 50, 190 48" stroke="#e2e8f0" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.75"/>
    </svg>
  );
}

// ─── Faux QR Code (decorative verification block) ──────────────────────────
function VerifyQR() {
  // Simple deterministic grid pattern that looks like a QR code
  const pattern = [
    [1,1,1,1,1,1,1,0,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,0,1,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,0,1,0,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,0,0,1,1,0,1,0,1,0,1,1],
    [0,1,0,0,1,0,1,1,1,0,0,1,0,1,0,1,0,0],
    [1,1,0,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1],
    [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1,1,0],
    [1,1,1,1,1,1,1,0,1,0,0,0,1,1,0,0,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,1,0,0,1,1,0,0],
    [1,0,1,1,1,0,1,0,1,0,0,1,1,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,0,1,1,0,1,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,0,1,0,0],
    [1,0,0,0,0,0,1,0,0,0,0,1,0,1,1,0,1,1],
  ];
  const cell = 4;
  const size = pattern.length * cell;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="#ffffff" rx="3" />
      {pattern.map((row, y) =>
        row.map((v, x) =>
          v ? <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#0a0a0a" /> : null
        )
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── MAIN: Certificate Document ────────────────────────────────────────────
// Clean, modern prop-firm aesthetic (FTMO / FundedNext / FundingPips style)
// ═══════════════════════════════════════════════════════════════════════════
export default function CertificateDocument({ cert, forCapture = false }) {
  const type = cert?.type || 'phase1_passed';
  const t = TYPES[type] || TYPES.phase1_passed;
  const isWithdrawal = type === 'first_payout';
  const challengeLabel = (cert?.challenge_type || 'two-step').replace(/-/g, ' ').toUpperCase();

  const issueDate = cert?.issue_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{
      width: forCapture ? '1400px' : '100%',
      height: forCapture ? '990px' : undefined,
      aspectRatio: forCapture ? undefined : '1.414 / 1',
      background: C.bg,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      borderRadius: forCapture ? '0' : '12px',
      boxShadow: forCapture ? 'none' : '0 0 60px rgba(0,0,0,0.5)',
      flexShrink: 0,
      color: C.text,
      border: forCapture ? 'none' : '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Subtle radial glow */}
      <div style={{ position: 'absolute', inset: 0, background: C.bgGlow, pointerEvents: 'none' }} />

      {/* Thin border frame — minimal, single line */}
      <div style={{ position: 'absolute', inset: '32px', border: `1px solid ${C.border}`, pointerEvents: 'none' }} />

      {/* ── Content ── */}
      <div style={{
        position: 'absolute', inset: '70px 90px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* ── Logo centered (large) ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
          <XFLogo size="xl" />
        </div>

        {/* ── "CERTIFICATE OF COMPLETION" ── */}
        <div style={{
          textAlign: 'center',
          fontSize: '13px', fontWeight: 600, color: C.textMuted,
          letterSpacing: '0.4em', textTransform: 'uppercase',
        }}>
          Certificate {t.sub}
        </div>

        {/* ── Large phase / type text ── */}
        <div style={{
          textAlign: 'center', marginTop: '12px',
          fontSize: '48px', fontWeight: 800, color: C.text,
          letterSpacing: '0.02em', lineHeight: 1,
        }}>
          {t.phase}
        </div>

        {/* ── Thin gold divider ── */}
        <div style={{
          width: '60px', height: '2px', background: C.gold,
          margin: '28px auto',
        }} />

        {/* ── Proudly presented to ── */}
        <div style={{
          textAlign: 'center', fontSize: '11px', fontWeight: 500,
          color: C.textMuted, letterSpacing: '0.25em', textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          Proudly Presented To
        </div>

        {/* ── Recipient name (gold) ── */}
        <div style={{
          textAlign: 'center', fontSize: '40px', fontWeight: 700,
          color: C.gold, letterSpacing: '0.01em', lineHeight: 1.1,
          marginBottom: '24px',
        }}>
          {cert?.trader_name || 'Your Name'}
        </div>

        {/* ── Description paragraph ── */}
        <div style={{
          textAlign: 'center', maxWidth: '620px', margin: '0 auto',
          fontSize: '13px', fontWeight: 400, color: C.textSoft,
          lineHeight: 1.8,
        }}>
          {isWithdrawal ? (
            <>This certificate confirms that the holder has successfully processed a withdrawal from {FIRM.name}. By receiving this withdrawal, the trader has demonstrated consistent profitability and disciplined risk management throughout their funded trading period.</>
          ) : (
            <>The certificate holder has successfully completed the {t.eval}. By passing this stage, the trader has demonstrated strong risk management and advanced trading skills, reaching the profit target while staying within the defined loss limits.</>
          )}
        </div>

        {/* ── Account info line ── */}
        <div style={{
          textAlign: 'center', marginTop: '16px',
          fontSize: '12px', fontWeight: 500, color: C.textMuted,
          letterSpacing: '0.1em',
        }}>
          {cert?.account_size ? `$${Number(cert.account_size).toLocaleString()}` : ''} Account
          {cert?.challenge_type ? `  |  ${challengeLabel} Challenge` : ''}
          {cert?.certificate_id ? `  |  ID: ${cert.certificate_id}` : ''}
        </div>

        {/* Spacer pushes footer to bottom */}
        <div style={{ flex: 1 }} />

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          paddingTop: '24px', borderTop: `1px solid ${C.line}`,
        }}>
          {/* LEFT: Date */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '160px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, paddingBottom: '8px', borderBottom: `1px solid ${C.line}`, width: '140px' }}>
              {issueDate}
            </div>
            <div style={{ fontSize: '10px', color: C.textMuted, marginTop: '6px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Date
            </div>
          </div>

          {/* CENTER: Verify at domain */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '9px', color: C.textMuted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Verify At
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: C.textSoft }}>
              {FIRM.website}
            </div>
          </div>

          {/* RIGHT: Signature */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '160px' }}>
            <div style={{ paddingBottom: '4px', borderBottom: `1px solid ${C.line}`, width: '140px', display: 'flex', justifyContent: 'center' }}>
              <Signature />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.text, marginTop: '6px' }}>
              {FIRM.ceo}
            </div>
            <div style={{ fontSize: '10px', color: C.textMuted, marginTop: '2px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {FIRM.ceoTitle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}