import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, CheckCircle, Shield, Star, Trophy, Zap, Crown, Share2, Eye, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';

const FIRM = {
  name: 'XTRADING CAPITAL',
  tagline: 'ELITE PROPRIETARY TRADING FIRM',
  website: 'xtrading.com',
  verifyUrl: 'xtrading.com/verify',
  address: 'Dubai International Financial Centre, UAE',
};

const CERT_CONFIG = {
  phase1_passed: { title: 'Phase I Passed',           icon: Star,   color: '#FF5C00', glow: 'rgba(255,92,0,0.4)',    bg: 'rgba(255,92,0,0.06)',    label: 'Phase 1'     },
  phase2_passed: { title: 'Phase II Passed',           icon: Trophy, color: '#60a5fa', glow: 'rgba(96,165,250,0.4)', bg: 'rgba(96,165,250,0.06)',  label: 'Phase 2'     },
  funded:        { title: 'Funded Trader',             icon: Award,  color: '#CCFF00', glow: 'rgba(204,255,0,0.4)',  bg: 'rgba(204,255,0,0.06)',   label: 'Funded'      },
  first_payout:  { title: 'First Payout',             icon: Zap,    color: '#10b981', glow: 'rgba(16,185,129,0.4)', bg: 'rgba(16,185,129,0.06)', label: 'First Payout'},
  consistency:   { title: 'Consistency Award',         icon: Shield, color: '#a78bfa', glow: 'rgba(167,139,250,0.4)',bg: 'rgba(167,139,250,0.06)',label: 'Consistency' },
  special:       { title: 'Special Achievement',       icon: Crown,  color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.06)', label: 'Special'     },
};

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [255, 92, 0];
}

function generatePDF(cert) {
  const cfg = CERT_CONFIG[cert.type] || CERT_CONFIG.funded;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;
  const [r1, g1, b1] = hexToRgb(cfg.color);

  doc.setFillColor(3, 5, 12); doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(14, 8, 4); doc.rect(0, 0, 80, 80, 'F'); doc.rect(W - 80, H - 80, 80, 80, 'F');

  doc.setDrawColor(r1, g1, b1); doc.setLineWidth(1.8); doc.rect(7, 7, W - 14, H - 14);
  doc.setLineWidth(0.35); doc.rect(11, 11, W - 22, H - 22);

  [[10, 10], [W - 10, 10], [10, H - 10], [W - 10, H - 10]].forEach(([cx, cy], idx) => {
    const xs = idx % 2 === 0 ? 1 : -1, ys = idx < 2 ? 1 : -1, d = 12;
    doc.setDrawColor(r1, g1, b1); doc.setLineWidth(0.6);
    doc.line(cx, cy, cx + xs * d, cy); doc.line(cx, cy, cx, cy + ys * d);
    doc.setFillColor(r1, g1, b1); doc.circle(cx, cy, 0.8, 'F');
  });

  doc.setFillColor(8, 4, 2); doc.rect(11, 11, W - 22, 34, 'F');
  doc.setDrawColor(r1, g1, b1); doc.setLineWidth(0.4); doc.line(11, 45, W - 11, 45);

  doc.setTextColor(r1, g1, b1); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text(FIRM.name, W / 2, 26, { align: 'center' });
  doc.setFontSize(7.5); doc.setTextColor(160, 160, 160); doc.setFont('helvetica', 'normal');
  doc.text(FIRM.tagline + '  ·  ' + FIRM.address, W / 2, 34, { align: 'center' });
  doc.setFontSize(7); doc.setTextColor(r1, g1, b1);
  doc.text(cfg.label.toUpperCase() + ' CERTIFICATE', W - 20, 24, { align: 'right' });

  doc.setFontSize(58); doc.setFont('helvetica', 'bold'); doc.setTextColor(r1, g1, b1);
  doc.setGState(new doc.GState({ opacity: 0.04 }));
  doc.text('CERTIFICATE', W / 2, H / 2 + 8, { align: 'center' });
  doc.setGState(new doc.GState({ opacity: 1 }));

  doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text(cfg.title.toUpperCase(), W / 2, 66, { align: 'center' });
  doc.setDrawColor(r1, g1, b1); doc.setLineWidth(0.7); doc.line(70, 71, W - 70, 71);
  doc.setFillColor(r1, g1, b1); doc.rect(W / 2 - 1.5, 69, 3, 3, 'F');

  doc.setFontSize(8.5); doc.setTextColor(140, 140, 140); doc.setFont('helvetica', 'normal');
  doc.text('THIS CERTIFICATE IS PROUDLY AWARDED TO', W / 2, 82, { align: 'center' });
  doc.setFontSize(30); doc.setFont('helvetica', 'bold'); doc.setTextColor(r1, g1, b1);
  doc.text((cert.trader_name || 'TRADER').toUpperCase(), W / 2, 98, { align: 'center' });
  const nameWidth = doc.getTextWidth((cert.trader_name || 'TRADER').toUpperCase());
  doc.setLineWidth(0.3); doc.line(W / 2 - nameWidth / 2, 101, W / 2 + nameWidth / 2, 101);

  const challengeMap = { 'two-step': 'Two-Step Challenge', 'instant': 'Instant Funding Program', 'instant_light': 'Instant Light Program' };
  doc.setFontSize(10.5); doc.setTextColor(200, 200, 200); doc.setFont('helvetica', 'normal');
  doc.text(`For successfully completing the ${challengeMap[cert.challenge_type] || 'Funded Program'}  —  $${(cert.account_size || 0).toLocaleString()} Account`, W / 2, 112, { align: 'center' });

  const statsY = 124;
  [{ label: 'FIRM', value: FIRM.name }, { label: 'ACCOUNT SIZE', value: `$${(cert.account_size || 0).toLocaleString()}` }, { label: 'ACCOUNT ID', value: cert.account_id || '—' }, { label: 'ACHIEVEMENT', value: cfg.label }, { label: 'DATE ISSUED', value: cert.issue_date || new Date().toLocaleDateString('en-GB') }].forEach((s, i) => {
    const boxW = (W - 30) / 5, bx = 15 + i * boxW;
    doc.setFillColor(14, 14, 18); doc.rect(bx, statsY, boxW - 4, 22, 'F');
    doc.setDrawColor(r1, g1, b1); doc.setLineWidth(0.3); doc.rect(bx, statsY, boxW - 4, 22);
    doc.setLineWidth(0.8); doc.line(bx, statsY, bx + boxW - 4, statsY);
    doc.setFontSize(i === 0 ? 7 : 11); doc.setFont('helvetica', 'bold'); doc.setTextColor(r1, g1, b1);
    doc.text(s.value, bx + (boxW - 4) / 2, statsY + 10, { align: 'center', maxWidth: boxW - 8 });
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
    doc.text(s.label, bx + (boxW - 4) / 2, statsY + 17, { align: 'center' });
  });

  doc.setFillColor(8, 6, 3); doc.rect(11, H - 35, W - 22, 24, 'F');
  doc.setDrawColor(r1, g1, b1); doc.setLineWidth(0.4); doc.line(11, H - 35, W - 11, H - 35);
  doc.setLineWidth(0.5); doc.line(W - 80, H - 18, W - 20, H - 18);
  doc.setFontSize(6.5); doc.setTextColor(120, 120, 120);
  doc.text('AUTHORIZED SIGNATURE — CEO & RISK DIRECTOR', W - 50, H - 14, { align: 'center' });
  doc.setFontSize(7); doc.setTextColor(80, 80, 80);
  doc.text(`Certificate ID: ${cert.certificate_id || 'XTC-' + Date.now()}`, 20, H - 24);
  doc.text(`Verify at: ${FIRM.verifyUrl}`, 20, H - 18);
  doc.setTextColor(r1, g1, b1); doc.text(FIRM.name, W / 2, H - 24, { align: 'center' });
  doc.setTextColor(80, 80, 80); doc.text('Institutional Prop Trading · Elite Funded Program', W / 2, H - 18, { align: 'center' });
  doc.save(`${FIRM.name.replace(/\s/g, '-')}-Certificate-${cert.certificate_id || Date.now()}.pdf`);
}

// ── Certificate Card ──────────────────────────────────────────────────────────
function CertCard({ cert, index, onPreview }) {
  const cfg = CERT_CONFIG[cert.type] || CERT_CONFIG.funded;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative rounded-3xl overflow-hidden"
      style={{ background: 'rgba(6,8,18,0.98)', border: `1px solid ${cfg.color}30` }}
    >
      {/* Animated top glow line */}
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, ${cfg.color}90, transparent)` }} />

      {/* Background glow orb */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full pointer-events-none"
        style={{ background: cfg.glow, filter: 'blur(48px)', opacity: 0.12 }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: `repeating-linear-gradient(0deg, ${cfg.color} 0, ${cfg.color} 0.5px, transparent 0, transparent 40px), repeating-linear-gradient(90deg, ${cfg.color} 0, ${cfg.color} 0.5px, transparent 0, transparent 40px)` }} />

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Top row: type badge + date */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
            {cfg.label} Certificate
          </span>
          <span className="text-[9px] font-mono text-white/25">{cert.issue_date || '—'}</span>
        </div>

        {/* Main display: icon + amount */}
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

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}30)` }} />
          <div className="w-1.5 h-1.5 rotate-45 flex-shrink-0" style={{ background: cfg.color, opacity: 0.6 }} />
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${cfg.color}30, transparent)` }} />
        </div>

        {/* Meta grid */}
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

        {/* Verified strip */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
          style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[10px] font-mono text-emerald-400/70">Verified by {FIRM.name}</span>
          <span className="text-[9px] font-mono text-white/15 ml-auto">{FIRM.verifyUrl}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(cert)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => generatePDF(cert)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black text-black transition-all hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`, boxShadow: `0 4px 16px ${cfg.glow}` }}>
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
function CertPreviewModal({ cert, onClose }) {
  const cfg = CERT_CONFIG[cert?.type] || CERT_CONFIG.funded;
  const Icon = cfg.icon;
  if (!cert) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative rounded-3xl overflow-hidden max-w-2xl w-full"
        style={{ background: 'linear-gradient(160deg, rgba(8,5,2,0.99), rgba(14,10,4,0.98))', border: `2px solid ${cfg.color}60` }}>

        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />

        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white/30 hover:text-white transition-colors text-xl font-bold">×</button>

        <div className="p-10 text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: cfg.color }}>{FIRM.name}</div>
          <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-6">{FIRM.tagline}</div>

          <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: cfg.bg, border: `1px solid ${cfg.color}50`, boxShadow: `0 0 32px ${cfg.glow}` }}>
            <Icon className="w-10 h-10" style={{ color: cfg.color }} />
          </div>

          <div className="text-xs font-mono text-white/30 uppercase tracking-widest mb-2">{cfg.title}</div>
          <div className="text-5xl font-black mb-2" style={{ color: cfg.color, textShadow: `0 0 30px ${cfg.glow}` }}>
            ${(cert.account_size || 0).toLocaleString()}
          </div>
          <div className="text-xl font-black text-white mb-1">{cert.trader_name || 'Trader'}</div>
          <div className="text-[10px] text-white/25 font-mono mb-6">
            {cert.challenge_type === 'two-step' ? 'Two-Step Challenge' : cert.challenge_type === 'instant' ? 'Instant Funding' : 'Instant Light Program'}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}40)` }} />
            <div className="w-2 h-2 rotate-45" style={{ background: cfg.color }} />
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${cfg.color}40, transparent)` }} />
          </div>

          <div className="flex justify-center gap-3">
            <button onClick={() => generatePDF(cert)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-black"
              style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`, boxShadow: `0 6px 20px ${cfg.glow}` }}>
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function Certificates({ user }) {
  const [previewCert, setPreviewCert] = useState(null);

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => base44.entities.Certificate.list('-created_date', 50),
  });

  const stats = [
    { label: 'Total Certificates', value: certs.length,                                                                          color: '#FF5C00', icon: Award },
    { label: 'Phases Passed',      value: certs.filter(c => c.type === 'phase1_passed' || c.type === 'phase2_passed').length,    color: '#60a5fa', icon: Trophy },
    { label: 'Funded Accounts',    value: certs.filter(c => c.type === 'funded').length,                                          color: '#CCFF00', icon: Star },
    { label: 'Payouts Received',   value: certs.filter(c => c.type === 'first_payout').length,                                    color: '#10b981', icon: Zap },
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

      {/* Preview Modal */}
      <AnimatePresence>
        {previewCert && <CertPreviewModal cert={previewCert} onClose={() => setPreviewCert(null)} />}
      </AnimatePresence>
    </div>
  );
}