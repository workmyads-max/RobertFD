import React from 'react';
import { motion } from 'framer-motion';
import { Award, Download, CheckCircle, Shield, Star, Trophy, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';

const CERT_CONFIG = {
  phase1_passed: { title: 'Phase 1 Challenge Passed', icon: Star, color: '#FF5C00', glow: 'rgba(255,92,0,0.4)', label: 'Phase 1' },
  phase2_passed: { title: 'Phase 2 Challenge Passed', icon: Trophy, color: '#60a5fa', glow: 'rgba(96,165,250,0.4)', label: 'Phase 2' },
  funded: { title: 'Funded Trader Certificate', icon: Award, color: '#CCFF00', glow: 'rgba(204,255,0,0.4)', label: 'Funded Account' },
  first_payout: { title: 'First Profit Payout', icon: Zap, color: '#10b981', glow: 'rgba(16,185,129,0.4)', label: 'First Payout' },
  consistency: { title: 'Consistency Achievement', icon: Shield, color: '#a78bfa', glow: 'rgba(167,139,250,0.4)', label: 'Consistency' },
  special: { title: 'Special Achievement', icon: Star, color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', label: 'Special' },
};

function generatePDF(cert) {
  const cfg = CERT_CONFIG[cert.type] || CERT_CONFIG.funded;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Background
  doc.setFillColor(4, 4, 7);
  doc.rect(0, 0, 297, 210, 'F');

  // Outer border
  doc.setDrawColor(255, 92, 0);
  doc.setLineWidth(1.5);
  doc.rect(8, 8, 281, 194);

  // Inner border
  doc.setDrawColor(255, 92, 0);
  doc.setLineWidth(0.3);
  doc.rect(12, 12, 273, 186);

  // Header section
  doc.setFillColor(26, 14, 6);
  doc.rect(12, 12, 273, 28, 'F');

  // Brand name
  doc.setTextColor(255, 92, 0);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ROBERT FUNDS', 148.5, 26, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'normal');
  doc.text('INSTITUTIONAL PROP TRADING FIRM  |  CERTIFICATE OF ACHIEVEMENT', 148.5, 34, { align: 'center' });

  // Certificate title
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(cfg.title.toUpperCase(), 148.5, 68, { align: 'center' });

  // Decorative line
  doc.setDrawColor(255, 92, 0);
  doc.setLineWidth(0.8);
  doc.line(60, 74, 237, 74);

  // Awarded to text
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('THIS CERTIFICATE IS PROUDLY AWARDED TO', 148.5, 84, { align: 'center' });

  // Trader name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 92, 0);
  doc.text(cert.trader_name || 'TRADER', 148.5, 98, { align: 'center' });

  // Account details
  doc.setFontSize(11);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  const challengeText = cert.challenge_type === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding';
  doc.text(
    `For successfully completing the ${challengeText} — $${(cert.account_size || 0).toLocaleString()} Account`,
    148.5, 112, { align: 'center' }
  );

  // Stats row
  const statsY = 128;
  const stats = [
    { label: 'Account Size', value: `$${(cert.account_size || 0).toLocaleString()}` },
    { label: 'Account ID', value: cert.account_id || '—' },
    { label: 'Achievement', value: cfg.label },
    { label: 'Issue Date', value: cert.issue_date || new Date().toLocaleDateString() },
  ];
  stats.forEach((s, i) => {
    const x = 40 + i * 62;
    doc.setFillColor(20, 20, 24);
    doc.rect(x - 1, statsY - 6, 58, 18, 'F');
    doc.setTextColor(255, 92, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(s.value, x + 28, statsY + 4, { align: 'center' });
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label.toUpperCase(), x + 28, statsY + 9, { align: 'center' });
  });

  // Footer
  doc.setFillColor(10, 10, 14);
  doc.rect(12, 176, 273, 22, 'F');

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.text(`Certificate ID: ${cert.certificate_id || 'RF-CERT-' + Date.now()}`, 25, 186);
  doc.text('Verify at: robertfunds.com/verify', 148.5, 186, { align: 'center' });
  doc.text('Authorized by Robert Funds — CEO & Risk Director', 272, 186, { align: 'right' });

  doc.setDrawColor(255, 92, 0);
  doc.setLineWidth(0.5);
  doc.line(200, 179, 270, 179);
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(6);
  doc.text('Authorized Signature', 235, 183, { align: 'center' });

  doc.save(`RF-Certificate-${cert.certificate_id || Date.now()}.pdf`);
}

function CertCard({ cert, index }) {
  const cfg = CERT_CONFIG[cert.type] || CERT_CONFIG.funded;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${cfg.color}30` }}
    >
      {/* Certificate preview */}
      <div className="relative p-8 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(10,8,4,0.95), rgba(26,14,6,0.8), rgba(8,8,12,0.95))' }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #FF5C00 0, #FF5C00 1px, transparent 0, transparent 50%)', backgroundSize: '14px 14px' }} />
        {/* Corner ornaments */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl" style={{ borderColor: cfg.color }} />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr" style={{ borderColor: cfg.color }} />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 rounded-bl" style={{ borderColor: cfg.color }} />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 rounded-br" style={{ borderColor: cfg.color }} />

        <div className="relative">
          <div className="text-[9px] font-mono uppercase tracking-[0.3em] mb-3" style={{ color: cfg.color }}>
            Robert Funds — Official Certificate
          </div>

          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${cfg.color}40, ${cfg.color}20)`, boxShadow: `0 0 24px ${cfg.glow}`, border: `1px solid ${cfg.color}50` }}>
            <Icon className="w-7 h-7" style={{ color: cfg.color }} />
          </div>

          <div className="text-lg font-black text-foreground mb-1">{cfg.title}</div>
          <div className="text-3xl font-black mb-1" style={{ color: cfg.color }}>
            ${(cert.account_size || 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            {cert.trader_name || 'Trader'}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-mono text-muted-foreground">
            <span>ID: <span className="text-foreground">{cert.account_id || '—'}</span></span>
            <span className="text-white/20">•</span>
            <span>Issued: <span className="text-foreground">{cert.issue_date}</span></span>
          </div>

          <div className="mt-3 text-[10px] font-mono text-muted-foreground/50">
            Cert ID: {cert.certificate_id}
          </div>
        </div>
      </div>

      <div className="p-4 flex items-center justify-between border-t"
        style={{ borderColor: `${cfg.color}20` }}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-muted-foreground font-mono">Verified by Robert Funds</span>
        </div>
        <button
          onClick={() => generatePDF(cert)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
          style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`, boxShadow: `0 4px 12px ${cfg.glow}` }}>
          <Download className="w-3.5 h-3.5" /> Download PDF
        </button>
      </div>
    </motion.div>
  );
}

export default function Certificates({ user }) {
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => base44.entities.Certificate.list('-created_date', 50),
  });

  const stats = [
    { label: 'Total Earned', value: certs.length, color: 'text-primary' },
    { label: 'Phase Passed', value: certs.filter(c => c.type === 'phase1_passed' || c.type === 'phase2_passed').length, color: 'text-blue-400' },
    { label: 'Funded', value: certs.filter(c => c.type === 'funded').length, color: 'text-accent' },
    { label: 'Payouts', value: certs.filter(c => c.type === 'first_payout').length, color: 'text-emerald-400' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Award className="w-6 h-6 text-primary" /> Certificates
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Your verified achievement certificates from Robert Funds</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-mono text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : certs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 rounded-2xl"
          style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Award className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <div className="text-lg font-bold text-foreground mb-2">No Certificates Yet</div>
          <p className="text-sm text-muted-foreground">Complete a challenge phase or receive a payout to earn certificates.</p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {certs.map((c, i) => <CertCard key={c.id} cert={c} index={i} />)}
        </div>
      )}
    </div>
  );
}