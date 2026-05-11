import React from 'react';
import { motion } from 'framer-motion';
import { Award, Download, CheckCircle, Shield, Star, Trophy, Zap, Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';

// ── Firm branding ─────────────────────────────────────────────────────────────
const FIRM = {
  name: 'XTRADING CAPITAL',
  tagline: 'ELITE PROPRIETARY TRADING FIRM',
  website: 'xtrading.com',
  verifyUrl: 'xtrading.com/verify',
  address: 'Dubai International Financial Centre, UAE',
};

const CERT_CONFIG = {
  phase1_passed: { title: 'Phase I Challenge Passed',       icon: Star,    color: '#FF5C00', glow: 'rgba(255,92,0,0.4)',    label: 'Phase 1'      },
  phase2_passed: { title: 'Phase II Challenge Passed',      icon: Trophy,  color: '#60a5fa', glow: 'rgba(96,165,250,0.4)',  label: 'Phase 2'      },
  funded:        { title: 'Funded Trader Certificate',      icon: Award,   color: '#CCFF00', glow: 'rgba(204,255,0,0.4)',   label: 'Funded'       },
  first_payout:  { title: 'First Profit Payout Milestone',  icon: Zap,     color: '#10b981', glow: 'rgba(16,185,129,0.4)', label: 'First Payout' },
  consistency:   { title: 'Consistency Achievement Award',  icon: Shield,  color: '#a78bfa', glow: 'rgba(167,139,250,0.4)','label': 'Consistency'},
  special:       { title: 'Special Achievement Award',      icon: Crown,   color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', label: 'Special'      },
};

// ── PDF Generator ─────────────────────────────────────────────────────────────
function generatePDF(cert) {
  const cfg = CERT_CONFIG[cert.type] || CERT_CONFIG.funded;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;

  // ── Background gradient simulation ──
  doc.setFillColor(3, 5, 12);
  doc.rect(0, 0, W, H, 'F');

  // Subtle corner fills
  doc.setFillColor(14, 8, 4);
  doc.rect(0, 0, 80, 80, 'F');
  doc.rect(W - 80, H - 80, 80, 80, 'F');

  // ── Outer golden border ──
  const [r1, g1, b1] = hexToRgb(cfg.color);
  doc.setDrawColor(r1, g1, b1);
  doc.setLineWidth(1.8);
  doc.rect(7, 7, W - 14, H - 14);

  // ── Second thin border ──
  doc.setLineWidth(0.35);
  doc.setDrawColor(r1, g1, b1, 0.5);
  doc.rect(11, 11, W - 22, H - 22);

  // ── Decorative corner ornaments ──
  const corners = [[10, 10], [W - 10, 10], [10, H - 10], [W - 10, H - 10]];
  corners.forEach(([cx, cy], idx) => {
    doc.setDrawColor(r1, g1, b1);
    doc.setLineWidth(0.6);
    const d = 12;
    const xs = idx % 2 === 0 ? 1 : -1;
    const ys = idx < 2 ? 1 : -1;
    doc.line(cx, cy, cx + xs * d, cy);
    doc.line(cx, cy, cx, cy + ys * d);
    // Dot
    doc.setFillColor(r1, g1, b1);
    doc.circle(cx, cy, 0.8, 'F');
  });

  // ── Header band ──
  doc.setFillColor(8, 4, 2);
  doc.rect(11, 11, W - 22, 34, 'F');
  doc.setDrawColor(r1, g1, b1);
  doc.setLineWidth(0.4);
  doc.line(11, 45, W - 11, 45);

  // Firm name
  doc.setTextColor(r1, g1, b1);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(FIRM.name, W / 2, 26, { align: 'center' });

  // Tagline
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.setFont('helvetica', 'normal');
  doc.text(FIRM.tagline + '  ·  ' + FIRM.address, W / 2, 34, { align: 'center' });

  // Certificate type label (top-right)
  doc.setFontSize(7);
  doc.setTextColor(r1, g1, b1);
  doc.text(cfg.label.toUpperCase() + ' CERTIFICATE', W - 20, 24, { align: 'right' });

  // ── Center "CERTIFICATE" watermark text ──
  doc.setFontSize(58);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(r1, g1, b1);
  doc.setGState(new doc.GState({ opacity: 0.04 }));
  doc.text('CERTIFICATE', W / 2, H / 2 + 8, { align: 'center' });
  doc.setGState(new doc.GState({ opacity: 1 }));

  // ── Certificate title ──
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(cfg.title.toUpperCase(), W / 2, 66, { align: 'center' });

  // Decorative rule under title
  doc.setDrawColor(r1, g1, b1);
  doc.setLineWidth(0.7);
  doc.line(70, 71, W - 70, 71);
  // Small center diamond
  doc.setFillColor(r1, g1, b1);
  doc.rect(W / 2 - 1.5, 69, 3, 3, 'F');

  // ── Awarded to ──
  doc.setFontSize(8.5);
  doc.setTextColor(140, 140, 140);
  doc.setFont('helvetica', 'normal');
  doc.text('THIS CERTIFICATE IS PROUDLY AWARDED TO', W / 2, 82, { align: 'center' });

  // ── Trader name ──
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(r1, g1, b1);
  doc.text((cert.trader_name || 'TRADER').toUpperCase(), W / 2, 98, { align: 'center' });

  // Underline name
  doc.setDrawColor(r1, g1, b1);
  doc.setLineWidth(0.3);
  const nameWidth = doc.getTextWidth((cert.trader_name || 'TRADER').toUpperCase());
  doc.line(W / 2 - nameWidth / 2, 101, W / 2 + nameWidth / 2, 101);

  // ── Achievement description ──
  const challengeMap = { 'two-step': 'Two-Step Challenge', 'instant': 'Instant Funding Program', 'instant_light': 'Instant Light Program' };
  const challengeLabel = challengeMap[cert.challenge_type] || 'Funded Program';
  doc.setFontSize(10.5);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `For successfully completing the ${challengeLabel}  —  $${(cert.account_size || 0).toLocaleString()} Account`,
    W / 2, 112, { align: 'center' }
  );

  // ── Stats boxes ──
  const statsY = 124;
  const stats = [
    { label: 'FIRM', value: FIRM.name },
    { label: 'ACCOUNT SIZE', value: `$${(cert.account_size || 0).toLocaleString()}` },
    { label: 'ACCOUNT ID', value: cert.account_id || '—' },
    { label: 'ACHIEVEMENT', value: cfg.label },
    { label: 'DATE ISSUED', value: cert.issue_date || new Date().toLocaleDateString('en-GB') },
  ];
  const boxW = (W - 30) / stats.length;
  stats.forEach((s, i) => {
    const bx = 15 + i * boxW;
    // Box bg
    doc.setFillColor(14, 14, 18);
    doc.rect(bx, statsY, boxW - 4, 22, 'F');
    doc.setDrawColor(r1, g1, b1);
    doc.setLineWidth(0.3);
    doc.rect(bx, statsY, boxW - 4, 22);
    // Top accent line
    doc.setLineWidth(0.8);
    doc.line(bx, statsY, bx + boxW - 4, statsY);
    // Value
    doc.setFontSize(i === 0 ? 7 : 11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(r1, g1, b1);
    doc.text(s.value, bx + (boxW - 4) / 2, statsY + 10, { align: 'center', maxWidth: boxW - 8 });
    // Label
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(s.label, bx + (boxW - 4) / 2, statsY + 17, { align: 'center' });
  });

  // ── Footer band ──
  doc.setFillColor(8, 6, 3);
  doc.rect(11, H - 35, W - 22, 24, 'F');
  doc.setDrawColor(r1, g1, b1);
  doc.setLineWidth(0.4);
  doc.line(11, H - 35, W - 11, H - 35);

  // Signature line (right)
  doc.setDrawColor(r1, g1, b1);
  doc.setLineWidth(0.5);
  doc.line(W - 80, H - 18, W - 20, H - 18);
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text('AUTHORIZED SIGNATURE — CEO & RISK DIRECTOR', W - 50, H - 14, { align: 'center' });

  // Left footer text
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text(`Certificate ID: ${cert.certificate_id || 'XTC-' + Date.now()}`, 20, H - 24);
  doc.text(`Verify at: ${FIRM.verifyUrl}`, 20, H - 18);

  // Center
  doc.setTextColor(r1, g1, b1);
  doc.setFontSize(7);
  doc.text(FIRM.name, W / 2, H - 24, { align: 'center' });
  doc.setTextColor(80, 80, 80);
  doc.text('Institutional Prop Trading · Elite Funded Program', W / 2, H - 18, { align: 'center' });

  doc.save(`${FIRM.name.replace(/\s/g, '-')}-Certificate-${cert.certificate_id || Date.now()}.pdf`);
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [255, 92, 0];
}

// ── Certificate card ──────────────────────────────────────────────────────────
function CertCard({ cert, index }) {
  const cfg = CERT_CONFIG[cert.type] || CERT_CONFIG.funded;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(6,8,16,0.98)', border: `1px solid ${cfg.color}35` }}
    >
      {/* ── Certificate preview ── */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, rgba(8,5,2,0.99), rgba(14,10,4,0.98), rgba(4,6,14,0.99))` }}>

        {/* Top color line */}
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />

        {/* Subtle grid bg */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `repeating-linear-gradient(0deg, ${cfg.color} 0, ${cfg.color} 0.5px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, ${cfg.color} 0, ${cfg.color} 0.5px, transparent 0, transparent 50%)`, backgroundSize: '24px 24px' }} />

        {/* Corner ornaments */}
        {[['top-3 left-3', 'border-t-2 border-l-2 rounded-tl'], ['top-3 right-3', 'border-t-2 border-r-2 rounded-tr'], ['bottom-3 left-3', 'border-b-2 border-l-2 rounded-bl'], ['bottom-3 right-3', 'border-b-2 border-r-2 rounded-br']].map(([pos, cls], i) => (
          <div key={i} className={`absolute ${pos} w-5 h-5 ${cls}`} style={{ borderColor: cfg.color }} />
        ))}

        {/* Glow orb */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-40 h-20 rounded-full pointer-events-none"
          style={{ background: cfg.glow, filter: 'blur(32px)', opacity: 0.25 }} />

        <div className="relative z-10 px-8 py-6 text-center">
          {/* Firm name */}
          <div className="text-[9px] font-black uppercase tracking-[0.35em] mb-0.5" style={{ color: cfg.color }}>
            {FIRM.name}
          </div>
          <div className="text-[7px] font-mono text-white/25 uppercase tracking-widest mb-4">{FIRM.tagline}</div>

          {/* Icon */}
          <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${cfg.color}18`, boxShadow: `0 0 28px ${cfg.glow}`, border: `1px solid ${cfg.color}50` }}>
            <Icon className="w-8 h-8" style={{ color: cfg.color }} />
          </motion.div>

          {/* Title */}
          <div className="text-xs font-mono uppercase tracking-widest text-white/40 mb-1">{cfg.title}</div>

          {/* Amount */}
          <div className="text-4xl font-black mb-1" style={{ color: cfg.color, textShadow: `0 0 24px ${cfg.glow}` }}>
            ${(cert.account_size || 0).toLocaleString()}
          </div>

          {/* Trader name */}
          <div className="text-lg font-black text-white mb-1">{cert.trader_name || 'Trader'}</div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}40)` }} />
            <div className="w-2 h-2 rotate-45" style={{ background: cfg.color }} />
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${cfg.color}40, transparent)` }} />
          </div>

          {/* Meta */}
          <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-white/30">
            <span>ID: <span className="text-white/60">{cert.account_id || '—'}</span></span>
            <span className="text-white/10">·</span>
            <span>Issued: <span className="text-white/60">{cert.issue_date}</span></span>
          </div>
          <div className="mt-2 text-[8px] font-mono text-white/15">Cert #{cert.certificate_id}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex items-center justify-between"
        style={{ background: `${cfg.color}08`, borderTop: `1px solid ${cfg.color}25` }}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-mono text-white/40">Verified by {FIRM.name}</span>
        </div>
        <button
          onClick={() => generatePDF(cert)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black text-black transition-all hover:scale-105 active:scale-95"
          style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`, boxShadow: `0 4px 14px ${cfg.glow}` }}>
          <Download className="w-3.5 h-3.5" /> Download PDF
        </button>
      </div>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Certificates({ user }) {
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => base44.entities.Certificate.list('-created_date', 50),
  });

  const stats = [
    { label: 'Total Earned',  value: certs.length,                                                                        color: '#FF5C00' },
    { label: 'Phase Passed',  value: certs.filter(c => c.type === 'phase1_passed' || c.type === 'phase2_passed').length,  color: '#60a5fa' },
    { label: 'Funded',        value: certs.filter(c => c.type === 'funded').length,                                        color: '#CCFF00' },
    { label: 'Payouts',       value: certs.filter(c => c.type === 'first_payout').length,                                  color: '#10b981' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Award className="w-6 h-6 text-primary" /> Certificates
          </h1>
          <p className="text-xs font-mono text-white/30 mt-1">Official achievement certificates from {FIRM.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-4 text-center border"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}22` }}>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-mono text-white/30 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : certs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 rounded-2xl border border-dashed border-white/10">
          <Award className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <div className="text-lg font-bold text-white/40 mb-2">No Certificates Yet</div>
          <p className="text-xs font-mono text-white/20">Complete a challenge phase or receive a payout to earn certificates from {FIRM.name}.</p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {certs.map((c, i) => <CertCard key={c.id} cert={c} index={i} />)}
        </div>
      )}
    </div>
  );
}