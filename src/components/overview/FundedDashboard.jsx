import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getAccountRules } from '../terminal/terminalConfig';
import { useAccountStats } from './useAccountStats';
import ThreePathsToFunded from '../dashboard/ThreePathsToFunded';
import FirstTimePromoBanner from '../dashboard/FirstTimePromoBanner';
import AffiliateSection from '../dashboard/AffiliateSection';
import Footer from '../dashboard/Footer';
import { useSupabaseAuth } from '@/lib/SupabaseAuthContext';
import { useB44TokenReady } from '@/hooks/useB44TokenReady';
import { useChallengeAccounts } from '@/hooks/useSupabaseQuery';

import ParticleBackground   from './ParticleBackground.jsx';
import AccountSwitcher      from './AccountSwitcher.jsx';
import UnifiedWelcomeHeader from './UnifiedWelcomeHeader.jsx';
import FloatingDailyPnL     from '../terminal/FloatingDailyPnL.jsx';

// ─── Debug Overlay (temporary — remove after diagnosis) ──────────────────────
function DebugOverlay({ supabaseUser, user, userEmail, accounts, activeAccounts, b44TokenReady, authLoading, isLoading, selectedAccount }) {
  const [ls, setLs] = React.useState({});
  const [trace, setTrace] = React.useState(null);
  const [tracing, setTracing] = React.useState(false);

  React.useEffect(() => {
    const allKeys = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.includes('base44') || k.includes('supabase') || k.includes('sb-') || k.includes('xf_')) {
        allKeys[k] = (localStorage.getItem(k) || '').slice(0, 40);
      }
    }
    setLs(allKeys);
  }, []);

  const runTrace = async () => {
    setTracing(true);
    try {
      const res = await base44.functions.invoke('debugAccountQuery', { user_email: userEmail });
      setTrace(res.data);
    } catch (e) {
      setTrace({ error: e.message });
    }
    setTracing(false);
  };

  const allStatuses = accounts.map(a => a.status);
  const isFilterKilling = accounts.length > 0 && activeAccounts.length === 0;

  const s = { fontSize: '11px', fontFamily: 'monospace', margin: '1px 0' };
  const hl = (c) => ({ ...s, color: c, fontWeight: 'bold' });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.95)', color: '#0f0', fontFamily: 'monospace',
      fontSize: '11px', padding: '10px 12px', maxHeight: '80vh', overflowY: 'auto',
      border: '2px solid lime'
    }}>
      <div style={{ color: '#ff0', fontWeight: 'bold', marginBottom: 4 }}>🔍 ACCOUNT QUERY TRACE</div>

      {/* Auth state */}
      <div style={s}>authLoading: <span style={hl(authLoading ? '#f00' : '#0f0')}>{String(authLoading)}</span></div>
      <div style={s}>b44TokenReady: <span style={hl(b44TokenReady ? '#0f0' : '#f00')}>{String(b44TokenReady)}</span> {!b44TokenReady && '← TIMEOUT FIRED'}</div>
      <div style={s}>supabaseUser.email: <span style={hl('#0ff')}>{supabaseUser?.email || 'NULL'}</span></div>
      <div style={s}>userEmail resolved: <span style={hl('#ff0')}>{userEmail || 'NULL'}</span></div>
      <div style={s}>base44_access_token: <span style={hl(ls['base44_access_token'] ? '#0f0' : '#f00')}>{ls['base44_access_token'] || 'UNDEFINED ← ROOT CAUSE'}</span></div>

      {/* localStorage dump */}
      <div style={{ color: '#555', marginTop: 4 }}>── localStorage keys ──</div>
      {Object.entries(ls).map(([k, v]) => (
        <div key={k} style={{ ...s, wordBreak: 'break-all', color: '#888' }}>{k}: <span style={{ color: '#aaa' }}>{v || '(empty)'}</span></div>
      ))}

      {/* Query results */}
      <div style={{ color: '#555', marginTop: 4 }}>── Query Results ──</div>
      <div style={s}>accounts.length: <span style={hl(accounts.length > 0 ? '#0f0' : '#f00')}>{accounts.length}</span></div>
      <div style={s}>activeAccounts.length: <span style={hl(activeAccounts.length > 0 ? '#0f0' : '#f00')}>{activeAccounts.length}</span></div>
      <div style={s}>all statuses: <span style={hl('#f80')}>{allStatuses.join(', ') || 'none'}</span></div>
      <div style={s}>filter killing: <span style={hl(isFilterKilling ? '#f00' : '#0f0')}>{String(isFilterKilling)}</span></div>

      {accounts.length > 0 && accounts.map((a, i) => (
        <div key={i} style={{ ...s, color: '#aaa' }}>#{i} {a.account_id} | {a.status} | {a.user_email} | owner:{a.created_by_id?.slice(0,8)}</div>
      ))}

      {/* Backend trace button */}
      <div style={{ marginTop: 8 }}>
        <button onClick={runTrace} disabled={tracing} style={{
          background: '#1a3a1a', border: '1px solid lime', color: 'lime',
          padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace'
        }}>
          {tracing ? '⏳ running...' : '▶ RUN BACKEND TRACE'}
        </button>
      </div>

      {/* Backend trace results */}
      {trace && (
        <div style={{ marginTop: 6 }}>
          <div style={{ color: '#ff0' }}>── Backend Trace ──</div>
          <div style={s}>b44 authenticated: <span style={hl(trace.base44_auth?.authenticated ? '#0f0' : '#f00')}>{String(trace.base44_auth?.authenticated)}</span></div>
          <div style={s}>b44 user: <span style={hl('#0ff')}>{trace.base44_auth?.user ? `${trace.base44_auth.user.email} (${trace.base44_auth.user.role})` : 'NULL — ' + (trace.base44_auth?.error || 'no session')}</span></div>
          <div style={s}>user_scoped count: <span style={hl(trace.user_scoped_query?.count > 0 ? '#0f0' : '#f00')}>{trace.user_scoped_query?.count}</span> {trace.user_scoped_query?.error && `ERR: ${trace.user_scoped_query.error}`}</div>
          <div style={s}>service_role count: <span style={hl(trace.service_role_query?.count > 0 ? '#0f0' : '#f00')}>{trace.service_role_query?.count}</span> {trace.service_role_query?.error && `ERR: ${trace.service_role_query.error}`}</div>
          <div style={s}>filtered_by_email count: <span style={hl(trace.filtered_by_email_query?.count > 0 ? '#0f0' : '#f00')}>{trace.filtered_by_email_query?.count}</span></div>
          <div style={{ ...s, color: '#ff0', marginTop: 4 }}>VERDICT: {trace.verdict?.root_cause_hypothesis}</div>
          {trace.filtered_by_email_query?.records?.map((r, i) => (
            <div key={i} style={{ ...s, color: '#aaa' }}>#{i} {r.account_id} | {r.status} | {r.user_email}</div>
          ))}
          {trace.service_role_query?.sample?.map((r, i) => (
            <div key={i} style={{ ...s, color: '#666' }}>svc#{i} {r.account_id} | {r.status} | {r.user_email}</div>
          ))}
          {trace.error && <div style={{ color: '#f00' }}>FUNCTION ERROR: {trace.error}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onStartChallenge }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
        style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)' }}>
        <Shield className="w-9 h-9 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">No Active Accounts</h2>
      <p className="text-[13px] text-muted-foreground mb-10 max-w-sm leading-relaxed font-light">
        Purchase a challenge to access the full funded trader platform — real-time analytics, live objectives, and institutional-grade tools.
      </p>
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onStartChallenge}
        className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#FF5C00' }}>
        <Plus className="w-4 h-4" /> Get Started
      </motion.button>
    </motion.div>
  );
}

// ─── Account info strip ───────────────────────────────────────────────────────
function AccountInfoStrip({ account }) {
  if (!account) return null;
  const items = [
    { label: 'Size',     value: `$${(account.account_size || 0).toLocaleString()}` },
    { label: 'Type',     value: account.challenge_type === 'instant' ? 'Instant' : account.challenge_type === 'instant_light' ? 'Inst.Light' : 'Two-Step' },
    { label: 'Model',    value: account.account_type === 'swing' ? 'Swing' : 'Standard' },
    { label: 'Phase',    value: (account.phase || 'phase1').replace('phase', 'Phase ') },
    { label: 'Leverage', value: account.leverage || '1:100' },
    { label: 'Platform', value: account.platform || 'MT5' },
  ];
  return (
    <motion.div key={account.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="flex overflow-x-auto rounded-xl border glass scrollbar-hide -mx-2 px-2"
      style={{ borderColor: 'rgba(255,255,255,0.1)', scrollbarWidth: 'none' }}>
      {items.map((item, idx) => (
        <div key={item.label} className="px-3 sm:px-4 py-2.5 min-w-[80px] sm:min-w-[90px] flex-shrink-0 border-r border-white/[0.06] last:border-r-0">
          <div className="text-[8px] sm:text-[9px] font-mono uppercase text-muted-foreground tracking-wider mb-0.5">{item.label}</div>
          <div className="text-[10px] sm:text-[11px] font-semibold text-primary whitespace-nowrap truncate max-w-[90px] sm:max-w-none">{item.value}</div>
        </div>
      ))}
    </motion.div>
  );
}



// ─── Main component ───────────────────────────────────────────────────────────
export default function FundedDashboard({ user, onStartChallenge, onNavigate }) {
  // Use Supabase auth directly — reliable on both desktop and mobile
  const { user: supabaseUser, loading: authLoading } = useSupabaseAuth();
  // Merge: prefer Supabase user (has user_metadata.full_name), fallback to prop
  const currentUser = supabaseUser || user;
  const userEmail = supabaseUser?.email || user?.email;

  const b44TokenReady = useB44TokenReady(); // kept for debug overlay only

  const { data: accounts = [], isLoading, refetch } = useChallengeAccounts();

  // Load KYC for welcome header
  const { data: kyc = null } = useQuery({
    queryKey: ['kyc-sb', userEmail],
    queryFn: async () => {
      const { supabase: sb } = await import('@/lib/supabaseClient');
      const { data } = await sb.from('kyc_verifications').select('*').eq('user_email', userEmail).maybeSingle();
      return data || null;
    },
    enabled: !!userEmail,
  });

  const activeAccounts = accounts.filter(a => ['active', 'funded', 'passed'].includes(a.status));
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Auto-select first account
  useEffect(() => {
    if (activeAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(activeAccounts[0]);
    }
  }, [activeAccounts.length]);

  // Keep selected in sync with refetches
  useEffect(() => {
    if (selectedAccount) {
      const fresh = activeAccounts.find(a => a.id === selectedAccount.id);
      if (fresh) setSelectedAccount(fresh);
    }
  }, [accounts]);

  // Load REAL trade records — fast refetch for live floating P&L
  const { data: trades = [] } = useQuery({
    queryKey: ['trade-records-sb', selectedAccount?.account_id],
    queryFn: async () => {
      const { supabase: sb } = await import('@/lib/supabaseClient');
      const { data } = await sb.from('trade_records').select('*').eq('account_id', selectedAccount.account_id).order('open_time', { ascending: false });
      return data || [];
    },
    enabled: !!selectedAccount?.account_id,
    refetchInterval: 5000,
  });

  const stats = useAccountStats(selectedAccount, trades);

  const debugOverlay = (
    <DebugOverlay
      supabaseUser={supabaseUser}
      user={user}
      userEmail={userEmail}
      accounts={accounts}
      activeAccounts={activeAccounts}
      b44TokenReady={b44TokenReady}
      authLoading={authLoading}
      isLoading={isLoading}
      selectedAccount={selectedAccount}
    />
  );

  if (authLoading || (isLoading && accounts.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64 bg-background">
        {debugOverlay}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-7 h-7 rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  // Derive open trades for floating P&L widget
  const openTrades = trades.filter(t => t.status === 'open');
  const floatPnl = openTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const accountSize = selectedAccount?.account_size || 100000;
  const balance = selectedAccount?.balance || accountSize;
  const rules = getAccountRules(selectedAccount);

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      {debugOverlay}
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-[700px] h-[500px] rounded-full blur-[140px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #FF5C00, transparent)' }} />
      </div>
      {/* Particles */}
      <ParticleBackground />

      {/* Floating Daily P&L — shown when open positions exist */}
      {selectedAccount && openTrades.length > 0 && (
        <div className="fixed z-50" style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <FloatingDailyPnL
              floatPnl={floatPnl}
              dailyClosedPnl={selectedAccount?.daily_pnl || 0}
              accountSize={accountSize}
              dailyDDLimit={rules?.dailyDDLimit || 5}
              dailyOpenBalance={balance}
              equity={balance + floatPnl}
              visible={openTrades.length > 0}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 max-w-[1440px] mx-auto w-full space-y-4 sm:space-y-6 mt-12 sm:mt-6">

        {/* Unified Welcome Header + Status Bar */}
        <UnifiedWelcomeHeader user={currentUser} kyc={kyc} onStartChallenge={onStartChallenge} />

        {activeAccounts.length === 0 && userEmail ? (
          <EmptyState onStartChallenge={onStartChallenge} />
        ) : (
          <>
            {/* First-Time Promo Banner */}
            <FirstTimePromoBanner onStartChallenge={() => onNavigate?.('marketplace')} />

            {/* Account Switcher */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                  {activeAccounts.length} Active Account{activeAccounts.length !== 1 ? 's' : ''}
                </span>
                <button onClick={() => refetch()}
                  className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="w-3 h-3" /> Sync
                </button>
              </div>
              <AccountSwitcher accounts={activeAccounts} selectedId={selectedAccount?.id} onSelect={setSelectedAccount} onNavigate={onNavigate} />
            </div>

            {/* Per-account content */}
            <AnimatePresence mode="wait">
              {selectedAccount && (
                <motion.div key={selectedAccount.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4 sm:space-y-6">

                  {/* Info strip */}
                  <AccountInfoStrip account={selectedAccount} />

                  {/* Three Paths to Funded Trading */}
                  <ThreePathsToFunded onNavigate={onNavigate} />
                  
                  {/* Affiliate Section */}
                  <AffiliateSection onNavigate={onNavigate} />
                  
                  {/* Footer */}
                  <Footer />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}