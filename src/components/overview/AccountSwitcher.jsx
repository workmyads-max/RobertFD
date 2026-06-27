import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

// ─── Compact Wave Canvas ──────────────────────────────────────────────────────
function WaveCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let time = 0;
    let animId;

    const waves = Array.from({ length: 4 }).map((_, i) => ({
      value: 0.3 + i * 0.1,
      targetValue: 0.3 + i * 0.1,
      speed: 0.015 + i * 0.005,
      hue: i % 2 === 0 ? [255, 120, 0] : [255, 180, 60],
    }));

    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function update() {
      waves.forEach(d => {
        if (Math.random() < 0.005) d.targetValue = 0.2 + Math.random() * 0.5;
        d.value += (d.targetValue - d.value) * d.speed;
      });
    }

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      waves.forEach((d, i) => {
        const amp = d.value * h * 0.28;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 1) {
          const t = (x / w) * Math.PI * 2;
          const y = h / 2 + Math.sin(t * 2.5 + time + i * 0.8) * amp * 0.6
                  + Math.sin(t * 1.2 + time * 0.7 + i * 1.2) * amp * 0.4;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const [r, g, b] = d.hue;
        const alpha = 0.5 - i * 0.08;
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = 1.5 - i * 0.2;
        ctx.shadowColor = `rgba(${r},${g},${b},0.3)`;
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    }

    function animate() {
      time += 0.016;
      update();
      draw();
      animId = requestAnimationFrame(animate);
    }

    resize();
    animate();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// ─── Account Card ─────────────────────────────────────────────────────────────
function AccountCard({ account, isSelected, onSelect, i, onNavigate }) {
  const pnl = account.pnl || 0;
  const isProfit = pnl >= 0;
  const size = account.account_size || 0;
  const progress = Math.min(100, Math.max(0, account.profit_target_progress || 0));
  const profitTargetPct = account.rule_snapshot?.phase1_target ?? 10;

  const isFundedLive = account.status === 'funded';
  const isTwoStep = account.challenge_type === 'two-step';
  const challengeType = isFundedLive ? 'SIM FUNDED'
    : account.challenge_type === 'one_step' ? '1-STEP'
    : account.challenge_type === 'instant' ? 'INSTANT'
    : account.challenge_type === 'instant_account' ? 'INSTANT ACCT'
    : account.challenge_type === 'instant_light' ? 'INST. LIGHT' : '2-STEP';
  // Only show phase label for two-step challenge accounts (not instant types)
  const phaseLabel = (!isFundedLive && isTwoStep) ? (account.phase || 'phase1').replace('phase', 'PH ') : '';
  const statusLabel = account.status === 'active' ? 'Active'
    : account.status === 'passed' ? 'Passed'
    : account.status === 'funded' ? 'Sim Funded' : account.status;
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden"
      style={{
        width: '220px',
        background: 'rgba(10,11,20,0.98)',
        border: `1px solid ${isSelected ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.09)'}`,
        boxShadow: isSelected
          ? '0 0 0 1px rgba(255,92,0,0.15), 0 8px 32px rgba(0,0,0,0.4)'
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* ── Wave panel ── */}
      <div className="relative overflow-hidden" style={{ height: '88px', background: 'rgba(6,7,14,1)' }}>
        <WaveCanvas />

        {/* subtle vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(6,7,14,0.7) 100%)' }} />

        {/* Type + Phase — top left */}
        <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
          <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,92,0,0.18)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.25)' }}>
            {challengeType}
          </span>
          <span className="text-[9px] font-bold tracking-widest text-white/40">{phaseLabel}</span>
        </div>

        {/* Status — top right */}
        <div className="absolute top-2.5 right-3 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
          <span className="text-[9px] font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
        </div>

        {/* Account ID — bottom left */}
        <div className="absolute bottom-2 left-3 text-[9px] font-mono text-white/25 tracking-wider">
          #{(account.account_id || account.id?.slice(0, 8) || '').toUpperCase()}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pt-3.5 pb-3">
        {/* Size label */}
        <div className="text-[9px] font-bold tracking-widest text-white/30 uppercase mb-0.5">Account Size</div>

        {/* Size + PnL row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[22px] font-black text-white tracking-tight leading-none">
            ${size.toLocaleString()}
          </div>
          <div className={`flex items-center gap-1 text-[11px] font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isProfit ? '+' : ''}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-[9px] font-mono mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>Reward Target</span>
            <span style={{ color: '#FF5C00' }}>{progress.toFixed(1)}% / {profitTargetPct}%</span>
          </div>
          <div className="h-px rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((progress / profitTargetPct) * 100, 100)}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: 'linear-gradient(90deg, #FF5C00, #FFAA00)' }} />
          </div>
        </div>

        {/* Manage button */}
        <button
          onClick={handleDetails}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all hover:brightness-110 active:scale-[0.97]"
          style={{ background: '#FF5C00', color: '#fff' }}
        >
          Manage <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Bottom strip ── */}
      <div className="grid grid-cols-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
        {[
          { label: 'MODEL', value: account.account_type === 'swing' ? 'Swing' : 'Standard', accent: true },
          { label: 'LEVERAGE', value: account.leverage || '1:100' },
          { label: 'PLATFORM', value: (account.platform || 'MT5').toUpperCase() },
        ].map((item, idx) => (
          <div key={item.label} className="py-2 text-center"
            style={{ borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div className="text-[7.5px] font-bold tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>{item.label}</div>
            <div className="text-[10px] font-bold" style={{ color: item.accent ? '#FF5C00' : 'rgba(255,255,255,0.6)' }}>{item.value}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function AccountSwitcher({ accounts, selectedId, onSelect, onNavigate }) {
  if (!accounts?.length) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
  );
}