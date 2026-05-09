import React, { useEffect, useRef } from 'react';

export default function TradingBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let width, height;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Candlestick objects
    const candles = Array.from({ length: 18 }, (_, i) => ({
      x: (i / 17) * width,
      y: height * 0.3 + Math.random() * height * 0.4,
      vy: (Math.random() - 0.5) * 0.15,
      vx: (Math.random() - 0.5) * 0.08,
      bodyH: 20 + Math.random() * 50,
      wickTop: 8 + Math.random() * 25,
      wickBot: 8 + Math.random() * 25,
      bullish: Math.random() > 0.45,
      opacity: 0.04 + Math.random() * 0.06,
      scale: 0.6 + Math.random() * 0.9,
    }));

    // Floating line chart
    const linePoints = Array.from({ length: 60 }, (_, i) => ({
      x: (i / 59) * width,
      y: height * 0.5 + Math.sin(i * 0.3) * 80 + Math.random() * 40,
    }));
    let lineOffset = 0;

    // Grid lines
    const gridLines = Array.from({ length: 8 }, (_, i) => ({
      y: (i / 7) * height,
      opacity: 0.015 + Math.random() * 0.02,
    }));

    // Floating numbers (price levels)
    const priceLabels = [
      { val: '2,338.50', x: width * 0.1, y: height * 0.2 },
      { val: '1.0821', x: width * 0.75, y: height * 0.35 },
      { val: '67,420', x: width * 0.45, y: height * 0.7 },
      { val: '18,254', x: width * 0.85, y: height * 0.6 },
    ];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Horizontal grid lines
      gridLines.forEach(l => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,92,0,${l.opacity})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 12]);
        ctx.moveTo(0, l.y);
        ctx.lineTo(width, l.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Scrolling equity line
      lineOffset += 0.4;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,92,0,0.07)';
      ctx.lineWidth = 1.5;
      linePoints.forEach((p, i) => {
        const x = ((p.x + lineOffset) % (width + 100)) - 50;
        const y = p.y;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Second equity line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(204,255,0,0.04)';
      ctx.lineWidth = 1;
      linePoints.forEach((p, i) => {
        const x = ((p.x + lineOffset * 0.6 + 200) % (width + 100)) - 50;
        const y = p.y + 120;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Floating candles
      candles.forEach(c => {
        c.x += c.vx;
        c.y += c.vy;
        if (c.x < -40) c.x = width + 40;
        if (c.x > width + 40) c.x = -40;
        if (c.y < 40 || c.y > height - 40) c.vy *= -1;

        const col = c.bullish ? `rgba(16,185,129,${c.opacity})` : `rgba(239,68,68,${c.opacity})`;
        const bodyW = 8 * c.scale;
        const bodyH = c.bodyH * c.scale;

        ctx.fillStyle = col;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;

        // Wick
        ctx.beginPath();
        ctx.moveTo(c.x, c.y - c.wickTop * c.scale);
        ctx.lineTo(c.x, c.y + bodyH + c.wickBot * c.scale);
        ctx.stroke();

        // Body
        ctx.fillRect(c.x - bodyW / 2, c.y, bodyW, bodyH);
      });

      // Price labels
      priceLabels.forEach(l => {
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillText(l.val, l.x, l.y);
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 1 }}
    />
  );
}