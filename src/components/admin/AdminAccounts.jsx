import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STATUS_COLOR = { pending: '#f59e0b', active: '#10b981', passed: '#60a5fa', failed: '#ef4444', funded: '#FF5C00' };
const STATUS_OPTS = ['pending', 'active', 'passed', 'failed', 'funded'];
const PHASE_OPTS = ['phase1', 'phase2', 'funded'];

const BLANK = {
  account_id: '', user_email: '', challenge_type: 'two-step', account_type: 'standard',
  account_size: 100000, platform: 'xtrading', leverage: '1:100', status: 'active', phase: 'phase1',
  balance: 100000, equity: 100000, pnl: 0, daily_pnl: 0, daily_drawdown_used: 0,
  max_drawdown_used: 0, profit_target_progress: 0, win_rate: 0, total_trades: 0,
  login_credentials: '', server: 'rf-live.robertfunds.com',
};

export default function AdminAccounts() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK);
  const qc = useQueryClient();

  // Admin-scoped fetch via service-role backend function — bypasses per-user RLS
  // so admins see ALL users' accounts. Normal-user isolation stays intact.
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['admin-accounts-all'],
    queryFn: async () => {
      const res = await base44.functions.invoke('adminListAllAccounts', { limit: 500 });
      return res?.data?.accounts || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const result = editItem
        ? await base44.entities.ChallengeAccount.update(editItem.id, data)
        : await base44.entities.ChallengeAccount.create(data);

      // Auto-issue certificates on key status changes
      if (data.user_email && data.status) {
        const { maybeIssueCertificate } = await import('@/lib/certUtils');
        if (data.status === 'passed' && data.phase === 'phase1') {
          await maybeIssueCertificate({ userEmail: data.user_email, traderName: data.user_email, type: 'phase1_passed', accountId: data.account_id, accountSize: data.account_size, challengeType: data.challenge_type }).catch(() => {});
        }
        if (data.status === 'passed' && data.phase === 'phase2') {
          await maybeIssueCertificate({ userEmail: data.user_email, traderName: data.user_email, type: 'phase2_passed', accountId: data.account_id, accountSize: data.account_size, challengeType: data.challenge_type }).catch(() => {});
        }
        if (data.status === 'funded') {
          await maybeIssueCertificate({ userEmail: data.user_email, traderName: data.user_email, type: 'funded', accountId: data.account_id, accountSize: data.account_size, challengeType: data.challenge_type }).catch(() => {});
        }
      }
      return result;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-accounts'] }); qc.invalidateQueries({ queryKey: ['certificates'] }); setShowForm(false); setEditItem(null); setForm(BLANK); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ChallengeAccount.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-accounts'] }),
  });

  const openEdit = (a) => { setEditItem(a); setForm({ ...a }); setShowForm(true); };
  const openNew = () => { setEditItem(null); setForm({ ...BLANK, account_id: `RF-${Date.now().toString(36).toUpperCase()}` }); setShowForm(true); };

  const filtered = accounts.filter(a =>
    !search || a.account_id?.toLowerCase().includes(search.toLowerCase()) || a.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  const F = ({ label, fkey, type = 'text', opts }) => (
    <div>
      <label className="text-[10px] font-mono text-muted-foreground mb-1 block uppercase">{label}</label>
      {opts ? (
        <select value={form[fkey] ?? ''} onChange={e => setForm(f => ({ ...f, [fkey]: e.target.value }))}
          className="w-full rounded-lg px-3 py-2 text-xs text-foreground outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {opts.map(o => <option key={o} value={o} className="bg-[#0e0e10]">{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[fkey] ?? ''} onChange={e => setForm(f => ({ ...f, [fkey]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
          className="w-full rounded-lg px-3 py-2 text-xs text-foreground outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Wallet className="w-6 h-6 text-primary" /> Challenge Accounts
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Create, manage and deliver trading accounts</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> Create Account
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5 w-full max-w-sm"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Search className="w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search account ID or email..."
          className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-7 gap-2 px-5 py-3 text-[10px] font-mono text-muted-foreground uppercase border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="col-span-2">Account</span>
          <span>Type</span>
          <span>Size</span>
          <span>Phase</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No accounts found.</div>
        ) : filtered.map((a) => {
          const sc = STATUS_COLOR[a.status] || '#888';
          return (
            <div key={a.id} className="grid grid-cols-7 gap-2 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] items-center transition-colors">
              <div className="col-span-2 min-w-0">
                <div className="text-xs font-mono font-bold text-foreground">{a.account_id}</div>
                <div className="text-[11px] text-muted-foreground truncate">{a.user_email || '—'}</div>
              </div>
              <span className="text-xs text-muted-foreground capitalize">{a.challenge_type === 'two-step' ? '2-Step' : 'Instant'} / {a.account_type}</span>
              <span className="text-xs text-foreground">${(a.account_size||0).toLocaleString()}</span>
              <span className="text-xs text-muted-foreground capitalize">{a.phase?.replace('phase', 'P')}</span>
              <select value={a.status} onChange={e => saveMutation.mutate({ ...a, status: e.target.value })}
                className="text-[10px] font-mono px-2 py-1 rounded-lg outline-none capitalize"
                style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}30` }}>
                {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-[#0e0e10] text-foreground">{s}</option>)}
              </select>
              <div className="flex gap-1">
                <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <Edit className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
                <button onClick={() => { if (confirm('Delete this account?')) deleteMutation.mutate(a.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-base font-black">{editItem ? 'Edit Account' : 'Create Funded Account'}</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <F label="Account ID" fkey="account_id" />
                <F label="User Email" fkey="user_email" type="email" />
                <F label="Challenge Type" fkey="challenge_type" opts={['two-step','instant']} />
                <F label="Account Type" fkey="account_type" opts={['standard','swing']} />
                <F label="Account Size" fkey="account_size" type="number" />
                <F label="Leverage" fkey="leverage" opts={['1:100','1:30','1:50','1:200']} />
                <F label="Platform" fkey="platform" opts={['xtrading','mt5','tradelocker']} />
                <F label="Status" fkey="status" opts={STATUS_OPTS} />
                <F label="Phase" fkey="phase" opts={PHASE_OPTS} />
                <F label="Balance" fkey="balance" type="number" />
                <F label="P&L" fkey="pnl" type="number" />
                <F label="Win Rate (%)" fkey="win_rate" type="number" />
                <F label="Daily DD Used (%)" fkey="daily_drawdown_used" type="number" />
                <F label="Max DD Used (%)" fkey="max_drawdown_used" type="number" />
                <F label="Profit Target (%)" fkey="profit_target_progress" type="number" />
                <F label="Total Trades" fkey="total_trades" type="number" />
                <div className="col-span-2">
                  <F label="Login Credentials" fkey="login_credentials" />
                </div>
                <div className="col-span-2">
                  <F label="Server" fkey="server" />
                </div>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-muted-foreground"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                  {saveMutation.isPending ? 'Saving...' : editItem ? 'Update Account' : 'Create & Deliver'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}