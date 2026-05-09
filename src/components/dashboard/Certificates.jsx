import React from 'react';
import { motion } from 'framer-motion';
import { Award, Download, CheckCircle } from 'lucide-react';

const DEMO_CERTS = [
  { id: 1, type: 'funded', title: 'Funded Trader Certificate', account: 'RF-082341', size: '$50,000', date: 'May 8, 2026', phase: 'Funded Account' },
  { id: 2, type: 'passed', title: 'Challenge Passed — Phase 1', account: 'RF-082341', size: '$50,000', date: 'Apr 20, 2026', phase: 'Phase 1' },
];

function CertCard({ cert }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,92,0,0.2)' }}
    >
      {/* Certificate preview */}
      <div className="relative p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(26,14,6,0.8), rgba(42,21,6,0.6), rgba(14,14,16,0.8))' }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #FF5C00 0, #FF5C00 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
        <div className="relative">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF5C00, #FF8A3D)', boxShadow: '0 0 30px rgba(255,92,0,0.4)' }}>
            <Award className="w-8 h-8 text-white" />
          </div>
          <div className="text-xs font-mono text-primary uppercase tracking-widest mb-2">Robert Funds — Official Certificate</div>
          <div className="text-xl font-black text-foreground mb-1">{cert.title}</div>
          <div className="text-2xl font-black text-primary mb-2">{cert.size}</div>
          <div className="text-sm text-muted-foreground">Account ID: <span className="text-foreground font-mono">{cert.account}</span></div>
          <div className="text-xs text-muted-foreground font-mono mt-1">Issued: {cert.date}</div>
        </div>
      </div>

      <div className="p-4 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-muted-foreground font-mono">Verified by Robert Funds</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
          <Download className="w-3.5 h-3.5" /> Download PDF
        </button>
      </div>
    </motion.div>
  );
}

export default function Certificates() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <Award className="w-6 h-6 text-primary" /> Certificates
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Your achievement certificates from Robert Funds</p>
      </div>

      {DEMO_CERTS.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Award className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No certificates yet. Pass a challenge to earn one!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {DEMO_CERTS.map(c => <CertCard key={c.id} cert={c} />)}
        </div>
      )}
    </div>
  );
}