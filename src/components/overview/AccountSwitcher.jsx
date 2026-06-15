import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

// ─── Animated Wave Canvas ─────────────────────────────────────────────────────
function WaveCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let time = 0;
    let animId;

    const waveData = Array.from({ length: 6 }).map(() => ({
      value: Math.random() * 0.5 + 0.1,
      targetValue: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.02 + 0.01,
    }));

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function update() {
      waveData.forEach(d => {
        if (Math.random() < 0.008) d.targetValue = Math.random() * 0.6 + 0.1;
        d.value += (d.targetValue - d.value) * d.speed;
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      waveData.forEach((d, i) => {
        const freq = d.value * 6;
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 2) {
          const nx = (x / canvas.width) * 2 - 1;
          const px = nx + i * 0.05 + freq * 0.03;
          const py = Math.sin(px * 8 + time) * Math.cos(px * 1.5) * freq * 0.12 * ((i + 1) / 6);
          const y = (py + 1) * canvas.height / 2;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const intensity = Math.min(1, freq * 0.35);
        // Orange-tinted waves to match brand
        const r = 255;
        const g = Math.round(92 + intensity * 80);
        const b = Math.round(0 + intensity * 30);
        ctx.lineWidth = 0.8 + i * 0.25;
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.25 + intensity * 0.2})`;
        ctx.shadowColor = `rgba(${r},${g},${b},0.4)`;
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    }

    function animate() {
      time += 0.018;
      update();
      draw();
      animId = requestAnimationFrame(animate);
    }

    resize();
    animate();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─── Account Card ─────────────────────────────────────────────────────────────
function AccountCard({ account, isSelected, onSelect, i, onNavigate }) {
  const pnl = account.pnl || 0;
  const isProfit = pnl >= 0;
  const size = account.account_size || 0;
  const progress = Math.min(100, Math.max(0, account.profit_target_progress || 0));
  const profitTargetPct = account.rule_snapshot?.phase1_target ?? 10;

  const challengeType = account.challenge_type === 'instant' ? 'INSTANT'
    : account.challenge_type === 'instant_light' ? 'INST. LIGHT' : '2-STEP';
  const phaseLabel = (account.phase || 'phase1').replace('phase', 'PH ');
  const statusLabel = account.status === 'active' ? 'Active'
    : account.status === 'passed' ? 'Passed'
    : account.status === 'funded' ? 'Funded' : account.status;
  const statusColor = account.status === 'active' ? '#10b981'
    : account.status === 'funded' ? '#FF5C00'
    : account.status === 'passed' ? '#60a5fa' : '#94a3b8';

  const handleDetails = (e) => {
    e.stopPropagation();
    sessionStorage.setItem('selectedAccountId', account.account_id || account.id);
    onNavigate?.('account-overview');
  };

  return (
    <motion.div
      onClick={() => onSelect(account)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 cursor-pointer"
      style={{ minWidth: '240px', maxWidth: '260px' }}
    >
      {/* Float animation wrapper */}
      <div style={{ animation: `accountCardFloat ${3 + i * 0.4}s ease-in-out infinite` }}>
        {/* Gradient border shell */}
        <div className="relative rounded-2xl p-px overflow-hidden"
          style={{
            background: isSelected
              ? 'linear-gradient(135deg, rgba(255,92,0,0.8), rgba(255,140,0,0.4), rgba(255,92,0,0.2))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
            boxShadow: isSelected ? '0 0 30px rgba(255,92,0,0.2), 0 0 60px rgba(255,92,0,0.06)' : 'none',
          }}>

          {/* Inner card */}
          <div className="relative rounded-2xl overflow-hidden flex flex-col"
            style={{ background: 'rgba(8,9,18,0.97)' }}>

            {/* ── Wave visualizer panel ── */}
            <div className="relative h-32 overflow-hidden">
              <WaveCanvas />
              {/* Dark overlay gradient for depth */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,9,18,0.1) 0%, rgba(8,9,18,0.5) 100%)' }} />

              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }} />

              {/* Type + phase badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)', color: '#FF5C00' }}>
                  {challengeType}
                </span>
                <span className="text-[9px] font-bold tracking-widest text-white/40">{phaseLabel}</span>
              </div>

              {/* Status dot top-right */}
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
                <span className="text-[9px] font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
              </div>

              {/* Account ID at bottom */}
              <div className="absolute bottom-2 left-3 text-[9px] font-mono text-white/30 tracking-widest">
                {account.account_id || account.id?.slice(0, 12)}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,92,0,0.4), transparent)' }} />

            {/* ── Content ── */}
            <div className="p-4">
              {/* Size + PnL */}
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-[10px] text-white/30 font-mono mb-0.5">ACCOUNT SIZE</div>
                  <div className="text-2xl font-black text-white tracking-tight">${size.toLocaleString()}</div>
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {isProfit ? '+' : ''}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[9px] font-mono text-white/30 mb-1.5">
                  <span>Profit Target</span>
                  <span style={{ color: '#FF5C00' }}>{progress.toFixed(1)}% / {profitTargetPct}%</span>
                </div>
                <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress / profitTargetPct) * 100}%` }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: 'linear-gradient(90deg, #FF5C00, #FF8A3D)' }} />
                </div>
              </div>

              {/* Manage button */}
              <button
                onClick={handleDetails}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'rgba(255,92,0,0.08)',
                  border: '1px solid rgba(255,92,0,0.3)',
                  color: '#FF5C00',
                }}
              >
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ── Bottom info strip ── */}
            <div className="grid grid-cols-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
              {[
                { label: 'MODEL', value: account.account_type === 'swing' ? 'Swing' : 'Standard', highlight: true },
                { label: 'LEVERAGE', value: account.leverage || '1:100' },
                { label: 'PLATFORM', value: (account.platform || 'MT5').toUpperCase() },
              ].map((item, idx) => (
                <div key={item.label} className="px-3 py-2 text-center"
                  style={{ borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div className="text-[8px] font-bold tracking-widest text-white/20 mb-0.5">{item.label}</div>
                  <div className={`text-[10px] font-bold ${item.highlight ? 'text-primary' : 'text-white/50'}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function AccountSwitcher({ accounts, selectedId, onSelect, onNavigate }) {
  if (!accounts?.length) return null;

  return (
    <>
      <style>{`
        @keyframes accountCardFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
      <div className="flex gap-4 overflow-x-auto pb-2 -mb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {accounts.map((account, i) => (
          <AccountCard
            key={account.id}
            account={account}
            isSelected={account.id === selectedId}
            onSelect={onSelect}
            onNavigate={onNavigate}
            i={i}
          />
        ))}
      </div>
    </>
  );
}