import React from 'react';

/**
 * ImpactBars - 3 small vertical bars indicating impact level.
 *   1 filled = Low (grey)
 *   2 filled = Medium (amber)
 *   3 filled = High (red)
 */
export default function ImpactBars({ impact }) {
  const filled = impact === 'High' ? 3 : impact === 'Medium' ? 2 : 1;
  const color = impact === 'High' ? '#ef4444' : impact === 'Medium' ? '#f59e0b' : '#6b7280';

  return (
    <div className="flex items-end gap-[2px] h-3.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-[1px] transition-all"
          style={{
            height: `${4 + i * 4}px`,
            background: i < filled ? color : 'rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  );
}