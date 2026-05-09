import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, CheckCircle, TrendingUp, DollarSign, Link } from 'lucide-react';

const MOCK_REFERRALS = [
  { id: 1, name: 'Alex T.', date: 'May 7', plan: '$100K Two-Step', commission: '$51.70', status: 'paid' },
  { id: 2, name: 'Sarah K.', date: 'May 5', plan: '$50K Instant', commission: '$135.00', status: 'pending' },
  { id: 3, name: 'James M.', date: 'May 2', plan: '$25K Two-Step', commission: '$23.50', status: 'paid' },
];

export default function Affiliate() {
  const [copied, setCopied] = useState(false);
  const refLink = 'https://robertfunds.com/?ref=TRADER123';

  const copy = async () => {
    await navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" /> Affiliate Program
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Earn up to 15% commission on every referral</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Earned', value: '$210.20', color: 'text-emerald-400', icon: DollarSign },
          { label: 'Referrals', value: '3', color: 'text-primary', icon: Users },
          { label: 'Conversions', value: '2', color: 'text-accent', icon: TrendingUp },
          { label: 'Pending', value: '$135.00', color: 'text-yellow-400', icon: DollarSign },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</span>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Referral link */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Link className="w-4 h-4 text-primary" /> Your Referral Link</div>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="flex-1 text-sm font-mono text-foreground truncate">{refLink}</span>
          <button onClick={copy} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,92,0,0.15)', color: copied ? '#10b981' : '#FF5C00', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,92,0,0.3)'}` }}>
            {copied ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Commission: <span className="text-primary font-semibold">10%</span> on every challenge purchase through your link.</p>
      </div>

      {/* Referrals table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-3 border-b border-white/5 text-xs font-bold text-foreground">Recent Referrals</div>
        {MOCK_REFERRALS.map((r, i) => (
          <div key={r.id} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-sm font-semibold text-foreground">{r.name}</div>
              <div className="text-xs text-muted-foreground font-mono">{r.plan} • {r.date}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-400">{r.commission}</div>
              <div className={`text-[10px] font-mono capitalize ${r.status === 'paid' ? 'text-emerald-400' : 'text-yellow-400'}`}>{r.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}