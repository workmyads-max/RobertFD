import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, CheckCircle, Star, Trophy, Zap, Eye, Loader2, QrCode } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import XFLogo from '@/components/shared/XFLogo';
import CertificateDocument from './CertificateDocument';

const FIRM = { name: 'XFUNDED TRADER', website: 'xfundedtrader.com', ceo: 'Diego Reyes' };

const CERT_TYPES = {
  phase1_passed: { label: 'Phase 1', color: '#FF5C00', icon: Star },
  phase2_passed: { label: 'Phase 2', color: '#FF5C00', icon: Trophy },
  funded:        { label: 'Funded',  color: '#CCFF00', icon: Award },
  first_payout:  { label: 'Withdrawal', color: '#10b981', icon: Zap },
  consistency:   { label: 'Consistency', color: '#a78bfa', icon: Star },
  special:       { label: 'Special', color: '#f59e0b', icon: Award },
};

// ── PDF Download ────────────────────────────────────────────────────────────
async function downloadPDF(cert, setLoading) {
  setLoading(true);
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1400px;z-index:-1;';
  document.body.appendChild(container);

  const { createRoot } = await import('react-dom/client');
  const root = createRoot(container);
  await new Promise(r => { root.render(React.createElement(CertificateDocument, { cert, forCapture: true })); setTimeout(r, 400); });

  const canvas = await html2canvas(container.firstChild, {
    scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
  });
  root.unmount(); document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(`XFunded-Certificate-${cert.certificate_id || Date.now()}.pdf`);
  setLoading(false);
}

// ── Certificate Card ────────────────────────────────────────────────────────
function CertCard({ cert, index, onPreview }) {
  const cfg = CERT_TYPES[cert.type] || CERT_TYPES.phase1_passed;
  const [downloading, setDownloading] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, ease: [0.22,1,0.36,1] }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${cfg.color}, ${cfg.color}80, transparent)` }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest"
            style={{ color: cfg.color, background: `${cfg.color}12`, border: `1px solid ${cfg.color}30` }}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-white/25 font-mono">{cert.issue_date || '—'}</span>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}25` }}>
            {React.createElement(cfg.icon, { className: 'w-6 h-6', style: { color: cfg.color } })}
          </div>
          <div>
            <div className="text-lg font-black text-white">{cert.trader_name || 'Trader'}</div>
            <div className="text-[11px] text-white/40 font-mono">
              {cert.account_size ? `$${Number(cert.account_size).toLocaleString()}` : ''}
              {cert.withdrawal_amount ? `$${Number(cert.withdrawal_amount).toLocaleString()}` : ''}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Type', value: cfg.label },
            { label: 'Cert #', value: cert.certificate_id ? `#${cert.certificate_id.slice(0, 8)}` : '—' },
            { label: 'Firm', value: 'XFUNDED' },
          ].map(item => (
            <div key={item.label} className="rounded-lg p-2 text-center bg-white/5 border border-white/5">
              <div className="text-[9px] text-white/25 mb-0.5">{item.label}</div>
              <div className="text-[10px] font-bold text-white/70 truncate">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onPreview(cert)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white/50 hover:text-white/70 transition-colors">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={() => downloadPDF(cert, setDownloading)} disabled={downloading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)` }}>
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {downloading ? '...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Preview Modal ───────────────────────────────────────────────────────────
function CertPreviewModal({ cert, onClose }) {
  const [downloading, setDownloading] = useState(false);
  if (!cert) return null;
  const cfg = CERT_TYPES[cert.type] || CERT_TYPES.phase1_passed;

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
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
            style={{ background: 'linear-gradient(90deg, #1a1a1a, #333)' }}>
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

  const stats = [
    { label: 'Total Certs', value: certs.length, icon: Award },
    { label: 'Phases', value: certs.filter(c => c.type === 'phase1_passed' || c.type === 'phase2_passed').length, icon: Trophy },
    { label: 'Funded', value: certs.filter(c => c.type === 'funded').length, icon: Star },
    { label: 'Payouts', value: certs.filter(c => c.type === 'first_payout').length, icon: Zap },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(197,160,89,0.15)', border: '1px solid rgba(197,160,89,0.3)' }}>
              <Award className="w-5 h-5" style={{ color: '#C5A059' }} />
            </div>
            Certificates
          </h1>
          <p className="text-sm text-white/30 mt-1">Official achievement certificates from {FIRM.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-4 flex items-center gap-3 bg-white/[0.04] border border-white/[0.08]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#C5A059]/10">
              {React.createElement(s.icon, { className: 'w-4 h-4', style: { color: '#C5A059' } })}
            </div>
            <div><div className="text-xl font-bold text-foreground">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin" /></div>
      ) : certs.length === 0 ? (
        <div className="text-center py-24 rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.02]">
          <Award className="w-12 h-12 mx-auto mb-4" style={{ color: '#C5A059', opacity: 0.3 }} />
          <div className="text-lg font-bold text-white/40 mb-2">No Certificates Yet</div>
          <p className="text-sm text-white/20 max-w-sm mx-auto">Complete a challenge phase or receive your first payout to earn certificates.</p>
        </div>
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