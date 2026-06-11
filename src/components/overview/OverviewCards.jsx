import React from 'react';

export function Card({ children, className = '', accent = false }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: accent ? '1px solid rgba(255,92,0,0.25)' : '1px solid rgba(255,255,255,0.07)',
      }}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 border-b ${className}`}
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }) {
  return <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{children}</span>;
}