import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, StickyNote, Flag, Ban, Eye, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { RiskBadge, getScoreColor, FlagChip } from './rcShared';

export default function RCEvidencePanel({ account, onClose }) {
  const [noteText, setNoteText] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [result, setResult] = useState(null);
  const qc = useQueryClient();

  const ev = account.evidence || {};
  const scoreBreakdown = [
    { flag: 'high_frequency_trading', label: 'High-Frequency Trading', score: 25 },
    { flag: 'ultra_fast_scalping', label: 'Ultra-Fast Scalping', score: 20 },
    { flag: 'martingale_grid', label: 'Martingale/Grid', score: 25 },
    { flag: 'revenge_trading', label: 'Revenge Trading', score: 20 },
    { flag: 'overtrading', label: 'Overtrading', score: 15 },
    { flag: 'scalping_pattern', label: 'Scalping Pattern', score: 15 },
    { flag: 'ea_bot_detected', label: 'EA/Bot Detected', score: 20 },
    { flag: 'vpn_proxy_access', label: 'VPN/Proxy Access', score: 15 },
    { flag: 'concentration_risk', label: 'Concentration Risk', score: 10 },
    { flag: 'excessive_leverage', label: 'Excessive Leverage', score: 15 },
    { flag: 'swap_avoidance', label: 'Swap Avoidance', score: 10 },
    { flag: 'news_trading_violation', label: 'News Trading Violation', score: 15 },
  ];

  const handleAction = async (action, extra = {}) => {
    setActionLoading(action);
    setResult(null);
    try {
      const res = await base44.functions.invoke('riskCenterAction', {
        action, account_id: account.account_id, ...extra,
      });
      if (res?.data?.success) {
        setResult({ type: 'success', text: `Action "${action.replace(/_/g, ' ')}" completed and logged.` });
        qc.invalidateQueries({ queryKey: ['risk-center-data'] });
      } else {
        setResult({ type: 'error', text: res?.data?.error || 'Action failed' });
      }
    } catch (e) {
      setResult({ type: 'error', text: e?.message || 'Action failed' });
    }
    setActionLoading('');
    setTimeout(() => setResult(null), 4000);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    handleAction('add_note', { note: noteText });
    setNoteText('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="w-full max-w-2xl h-full overflow-y-auto" style={{ background: '#0e0e10', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between" style={{ background: '#0e0e10', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="text-base font-black text-white">{account.user_email}</h2>
            <div className="text-[10px] text-white/40 font-mono mt-0.5">{account.account_id} · MT5 {account.mt_login || '-'}</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Summary */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30 font-mono uppercase">Risk Score</span>
              <span className="text-2xl font-black" style={{ color: getScoreColor(account.risk_score) }}>{account.risk_score || 0}</span>
            </div>
            <RiskBadge level={account.risk_level} />
            <div className="flex gap-1 flex-wrap">
              {(account.risk_flags || []).map((f, i) => <FlagChip key={i} flag={f} />)}
            </div>
          </div>

          {/* Why flagged */}
          <Section title="Why This Account Was Flagged" icon={AlertTriangle} color="#ef4444">
            {account.risk_flags?.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-white/70">
                {account.risk_flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Flag className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="capitalize">{f.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-white/40">No active risk flags. Account appears clean.</p>
            )}
          </Section>

          {/* Score breakdown */}
          <Section title="Risk Score Breakdown" icon={Eye} color="#f59e0b">
            <div className="space-y-1.5">
              {scoreBreakdown.filter(s => account.risk_flags?.includes(s.flag)).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{s.label}</span>
                  <span className="font-bold text-white tabular">+{s.score}</span>
                </div>
              ))}
              {scoreBreakdown.filter(s => account.risk_flags?.includes(s.flag)).length === 0 && (
                <p className="text-xs text-white/40">No contributing factors.</p>
              )}
            </div>
          </Section>

          {/* Evidence: HFT */}
          {ev.hft && (ev.hft.max_tps > 1 || ev.hft.sub_second_count > 0) && (
            <Section title="HFT Evidence" icon={AlertTriangle} color="#ef4444">
              <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                <Metric label="Max TPS" value={ev.hft.max_tps} />
                <Metric label="Avg Hold" value={`${ev.hft.avg_hold_sec}s`} />
                <Metric label="Sub-second" value={ev.hft.sub_second_count} />
              </div>
              {ev.hft.rapid_trades?.length > 0 && (
                <TradeTable trades={ev.hft.rapid_trades} caption="Rapid trades (held < 5s)" />
              )}
            </Section>
          )}

          {/* Evidence: Martingale */}
          {ev.martingale && ev.martingale.sequences > 0 && (
            <Section title="Martingale Evidence" icon={AlertTriangle} color="#ef4444">
              <div className="grid grid-cols-4 gap-3 mb-3 text-xs">
                <Metric label="Sequences" value={ev.martingale.sequences} />
                <Metric label="Max Trades" value={ev.martingale.max_trades_in_seq} />
                <Metric label="Recovered" value={ev.martingale.recovered} />
                <Metric label="Unrecovered" value={ev.martingale.unrecovered} />
              </div>
              {ev.martingale.evidence?.map((seq, i) => (
                <div key={i} className="mb-2">
                  <div className="text-[10px] text-white/30 mb-1">Sequence {i + 1}</div>
                  <TradeTable trades={seq} caption="" compact />
                </div>
              ))}
            </Section>
          )}

          {/* Evidence: Behavioral */}
          {ev.behavioral && ev.behavioral.revenge_count > 0 && (
            <Section title="Behavioral Evidence" icon={AlertTriangle} color="#ef4444">
              <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                <Metric label="Revenge Trades" value={ev.behavioral.revenge_count} />
                <Metric label="Overtrading Days" value={ev.behavioral.overtrading_days} />
                <Metric label="Emotional Cost" value={`$${Math.round(ev.behavioral.emotional_cost)}`} />
              </div>
              {ev.behavioral.evidence?.slice(0, 5).map((r, i) => (
                <div key={i} className="text-[10px] text-white/50 mb-1.5 p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  Loss: ${Math.round(r.loss_trade.pnl)} at {r.loss_trade.close_time} → Revenge: {r.revenge_trade.lots} lots ${Math.round(r.revenge_trade.pnl || 0)} at {r.revenge_trade.open_time} ({r.gap_sec}s gap)
                </div>
              ))}
            </Section>
          )}

          {/* Evidence: Scalper */}
          {ev.scalper && ev.scalper.count > 0 && (
            <Section title="Scalper Evidence" icon={AlertTriangle} color="#ef4444">
              <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                <Metric label="Scalp Trades" value={ev.scalper.count} />
                <Metric label="Percentage" value={`${ev.scalper.percentage}%`} />
              </div>
              {ev.scalper.evidence?.length > 0 && <TradeTable trades={ev.scalper.evidence} caption="Short-hold trades" />}
            </Section>
          )}

          {/* Evidence: Swap */}
          {ev.swap && ev.swap.no_swap_count > 0 && (
            <Section title="Swap Avoidance Evidence" icon={AlertTriangle} color="#ef4444">
              <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                <Metric label="No-Swap Trades" value={ev.swap.no_swap_count} />
                <Metric label="Avoidance Rate" value={`${ev.swap.avoidance_rate}%`} />
              </div>
              {ev.swap.evidence?.length > 0 && <TradeTable trades={ev.swap.evidence} caption="Trades closed before swap time" />}
            </Section>
          )}

          {/* Evidence: News */}
          {ev.news && ev.news.violations > 0 && (
            <Section title="News Trading Evidence" icon={AlertTriangle} color="#ef4444">
              <p className="text-xs text-white/60 mb-2">{ev.news.violations} trade(s) within ±2min of a high-impact event.</p>
              {ev.news.evidence?.map((v, i) => (
                <div key={i} className="text-[10px] text-white/50 mb-1.5 p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <strong className="text-white/70">{v.symbol}</strong> {v.type} at {v.open_time} → Event: {v.event_title} ({v.event_currency}) at {v.event_time} ({v.diff_sec}s difference)
                </div>
              ))}
            </Section>
          )}

          {/* Evidence: IP */}
          {ev.ip && ev.ip.vpn_proxy_count > 0 && (
            <Section title="IP / Device Evidence" icon={AlertTriangle} color="#ef4444">
              <p className="text-xs text-white/60 mb-2">{ev.ip.vpn_proxy_count} VPN/Proxy/Datacenter access detected.</p>
              {ev.ip.devices?.map((d, i) => (
                <div key={i} className="text-[10px] text-white/50 mb-1 flex items-center gap-2">
                  <span className="font-mono">{d.ip}</span>
                  {d.is_vpn && <span className="px-1.5 py-0.5 rounded bg-red-500 text-white">VPN</span>}
                  {d.is_proxy && <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white">PROXY</span>}
                  {d.is_datacenter && <span className="px-1.5 py-0.5 rounded bg-red-900 text-white">DC</span>}
                  {d.country && <span className="text-white/30">{d.country}</span>}
                </div>
              ))}
            </Section>
          )}

          {/* Open positions */}
          {account.open_positions > 0 && (
            <Section title="Open Positions" icon={Eye} color="#60a5fa">
              <TradeTable trades={account.open_positions_list} caption={`${account.open_positions} open position(s)`} />
            </Section>
          )}

          {/* Admin actions */}
          <Section title="Manual Admin Actions" icon={Ban} color="#FF5C00">
            {result && (
              <div className={`mb-3 px-3 py-2 rounded-lg text-xs ${result.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}
                style={{ background: result.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
                {result.text}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <ActionBtn label="Fail Account" icon={Ban} color="#ef4444" loading={actionLoading === 'fail_account'} onClick={() => { if (confirm('Manually fail this account? This is a deliberate admin decision.')) handleAction('fail_account'); }} />
              <ActionBtn label="Suspend" icon={Ban} color="#f59e0b" loading={actionLoading === 'suspend_account'} onClick={() => handleAction('suspend_account')} />
              <ActionBtn label="Mark Reviewed" icon={CheckCircle2} color="#10b981" loading={actionLoading === 'mark_reviewed'} onClick={() => handleAction('mark_reviewed')} />
              <ActionBtn label="False Positive" icon={CheckCircle2} color="#10b981" loading={actionLoading === 'mark_false_positive'} onClick={() => handleAction('mark_false_positive')} />
              <ActionBtn label="Contact User" icon={Mail} color="#60a5fa" loading={actionLoading === 'contact_user'} onClick={() => handleAction('contact_user')} />
            </div>
            <div className="flex gap-2">
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2}
                placeholder="Add internal note (admin only, not visible to user)..."
                className="flex-1 rounded-lg px-3 py-2 text-xs text-white outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button onClick={handleAddNote} disabled={actionLoading === 'add_note' || !noteText.trim()}
                className="px-3 rounded-lg text-xs font-bold text-white disabled:opacity-50 self-end py-2"
                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                <StickyNote className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[9px] text-white/20 mt-2">All actions are logged to the audit trail with admin email, timestamp, and reason.</p>
          </Section>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Section({ title, icon: Icon, color, children }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs font-bold text-white/70 uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="text-[9px] text-white/30 uppercase">{label}</div>
      <div className="text-sm font-bold text-white tabular mt-0.5">{value}</div>
    </div>
  );
}

function TradeTable({ trades, caption, compact }) {
  if (!trades?.length) return null;
  return (
    <div>
      {caption && <div className="text-[10px] text-white/30 mb-1.5">{caption}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-white/30 border-b border-white/5">
              <th className="text-left py-1 px-1">Symbol</th>
              <th className="text-left py-1 px-1">Type</th>
              <th className="text-right py-1 px-1">Lots</th>
              {!compact && <th className="text-left py-1 px-1">Open</th>}
              {!compact && <th className="text-right py-1 px-1">PnL</th>}
              {compact && <th className="text-right py-1 px-1">Hold</th>}
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 12).map((t, i) => (
              <tr key={i} className="border-b border-white/[0.03]">
                <td className="py-1 px-1 text-white/70 font-mono">{t.symbol}</td>
                <td className="py-1 px-1 text-white/50">{t.type}</td>
                <td className="py-1 px-1 text-right text-white/70 tabular">{t.lots}</td>
                {!compact && <td className="py-1 px-1 text-white/40 font-mono">{t.open_time?.slice(11, 16) || '-'}</td>}
                {!compact && <td className={`py-1 px-1 text-right tabular ${(t.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{Math.round(t.pnl || 0)}</td>}
                {compact && <td className="py-1 px-1 text-right text-white/50 tabular">{t.hold_sec !== undefined ? `${t.hold_sec}s` : '-'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBtn({ label, icon: Icon, color, loading, onClick }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 hover:opacity-90"
      style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>
      {loading ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}