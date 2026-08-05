import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, GitBranch, ChevronDown, ChevronRight, UserCheck, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ACCENT = '#FF5C00';

function formatDate(d) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '-';
  }
}

function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email?.charAt(0)?.toUpperCase() || '?';
}

function LevelSection({ level, rate, color, members, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const userMap = window.__refTreeUserMap || {};

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1a1d25', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Section header (clickable) */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02]"
        style={{ borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-sm font-bold text-white">Level {level}</span>
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">· {rate} commission</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-mono font-bold" style={{ color }}>{members.length} active</span>
          {open ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      {/* Member rows */}
      {open && (
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 text-[9px] font-mono text-white/25 uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <span>Member</span>
            <span>Status</span>
            <span>Joined</span>
          </div>
          {members.map((p, i) => {
            const user = userMap[p.user_email];
            const fullName = user?.full_name || user?.display_name || '';
            const joinDate = user?.created_date || p.created_date;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors">
                {/* Member */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                    {getInitials(fullName, p.user_email)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{fullName || 'Unnamed Trader'}</div>
                    <div className="text-[11px] font-mono text-white/30 truncate">{p.user_email}</div>
                  </div>
                </div>
                {/* Status */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Active</span>
                </div>
                {/* Joined */}
                <div className="text-right">
                  <div className="text-xs font-mono text-white/60 whitespace-nowrap">{formatDate(joinDate)}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReferralTree({ commissions = [], userEmail }) {
  const [l1Profiles, setL1Profiles] = useState([]);
  const [l2Profiles, setL2Profiles] = useState([]);
  const [l3Profiles, setL3Profiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildTree = async () => {
      if (!userEmail) { setLoading(false); return; }
      try {
        const allProfiles = await base44.entities.AffiliateProfile.filter({}, '-created_date', 500);

        const l1 = allProfiles.filter(p => p.referred_by_email === userEmail);
        const l1Emails = l1.map(p => p.user_email);
        const l2 = allProfiles.filter(p => l1Emails.includes(p.referred_by_email));
        const l2Emails = l2.map(p => p.user_email);
        const l3 = allProfiles.filter(p => l2Emails.includes(p.referred_by_email));
        const l3Emails = l3.map(p => p.user_email);

        // Fetch User records to resolve full names + join dates
        const downlineEmails = [...new Set([...l1Emails, ...l2Emails, ...l3Emails])];
        let userMap = {};
        if (downlineEmails.length > 0) {
          try {
            const users = await base44.entities.User.filter({}, '-created_date', 500);
            users.forEach(u => { if (u.email) userMap[u.email.toLowerCase()] = u; });
          } catch (e) {
            console.warn('[ReferralTree] Could not fetch users:', e);
          }
        }
        window.__refTreeUserMap = userMap;

        // Filter: only active members
        setL1Profiles(l1.filter(p => p.is_active !== false && p.is_frozen !== true));
        setL2Profiles(l2.filter(p => p.is_active !== false && p.is_frozen !== true));
        setL3Profiles(l3.filter(p => p.is_active !== false && p.is_frozen !== true));
      } catch (e) {
        console.error('[ReferralTree] Failed to build tree:', e);
      }
      setLoading(false);
    };
    buildTree();
  }, [userEmail]);

  const totalActive = l1Profiles.length + l2Profiles.length + l3Profiles.length;

  if (loading) {
    return (
      <div className="rounded-2xl p-12 flex items-center justify-center" style={{ background: '#1a1d25', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-6 h-6 border-2 border-[#FF5C00]/30 border-t-[#FF5C00] rounded-full animate-spin" />
      </div>
    );
  }

  if (totalActive === 0) {
    return (
      <div className="rounded-2xl p-12 text-center" style={{ background: '#1a1d25', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
          <Users className="w-7 h-7" style={{ color: ACCENT }} />
        </div>
        <div className="text-sm font-bold text-white mb-1.5">No Active Referrals Yet</div>
        <div className="text-xs text-white/30">Share your referral link to start building your network</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Level metric cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Level 1', count: l1Profiles.length, rate: '8%', color: '#FF5C00' },
          { label: 'Level 2', count: l2Profiles.length, rate: '2%', color: '#6366f1' },
          { label: 'Level 3', count: l3Profiles.length, rate: '1%', color: '#a78bfa' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 text-center"
            style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
            <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.count}</div>
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{s.label}</div>
            <div className="text-[11px] font-bold mt-1.5" style={{ color: s.color }}>{s.rate}</div>
          </motion.div>
        ))}
      </div>

      {/* Tree header */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#1a1d25', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-4 border-b border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Network Tree</span>
            <span className="text-[10px] font-mono text-white/20 ml-auto">{totalActive} active members</span>
          </div>
        </div>
      </div>

      {/* Level sections with member data */}
      <div className="space-y-3">
        {l1Profiles.length > 0 && (
          <LevelSection level={1} rate="8%" color="#FF5C00" members={l1Profiles} defaultOpen={true} />
        )}
        {l2Profiles.length > 0 && (
          <LevelSection level={2} rate="2%" color="#6366f1" members={l2Profiles} defaultOpen={true} />
        )}
        {l3Profiles.length > 0 && (
          <LevelSection level={3} rate="1%" color="#a78bfa" members={l3Profiles} defaultOpen={true} />
        )}
      </div>
    </div>
  );
}