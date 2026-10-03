import React, { useEffect, useRef } from 'react';

const COLORS = [
  '#FACC15',
  '#EC4899',
  '#38BDF8',
  '#A855F7',
  '#4ADE80',
  '#FB923C',
  '#FFFFFF',
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  angle: number;
  vAngle: number;
  tilt: number;
  vTilt: number;
}

export const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 750);

    const particles: Particle[] = Array.from({ length: 65 }).map(() => ({
      x: Math.random() * width,
      y: -Math.random() * height * 0.8 - 20,
      vx: (Math.random() - 0.5) * 2.5,
      vy: 2.2 + Math.random() * 3.5,
      w: 8 + Math.random() * 8,
      h: 5 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.12,
      tilt: Math.random() * Math.PI,
      vTilt: 0.05 + Math.random() * 0.08,
    }));

    let frameId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx + Math.sin(p.tilt) * 0.6;
        p.y += p.vy;
        p.angle += p.vAngle;
        p.tilt += p.vTilt;

        if (p.y > height + 30) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.scale(1, Math.cos(p.tilt));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-20 w-full h-full"
    />
  );
};
