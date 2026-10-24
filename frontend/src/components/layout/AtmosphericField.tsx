import React, { useEffect, useRef } from 'react';

/**
 * Atmospheric Light Glass Caustic Field
 * Simulates soft light rays & gentle energy caustics passing through layered glass
 */
export const AtmosphericField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Gentle light particles refracting through glass
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0.15 + Math.random() * 0.2,
      vy: (Math.random() - 0.5) * 0.08,
      size: 1.2 + Math.random() * 1.8,
      alpha: 0.12 + Math.random() * 0.18,
      // Muted emerald (#168F79) and soft coral (#E27D4F) tints
      color: Math.random() > 0.55 ? 'rgba(22, 143, 121,' : 'rgba(226, 125, 79,',
    }));

    // Soft refracted light beams
    const streamCount = 3;
    const streams = Array.from({ length: streamCount }, (_, i) => ({
      y: (height / (streamCount + 1)) * (i + 1) + (Math.random() - 0.5) * 50,
      amplitude: 15 + Math.random() * 20,
      wavelength: 320 + Math.random() * 200,
      speed: 0.0003 + Math.random() * 0.0004,
      alpha: 0.03 + Math.random() * 0.02,
      offset: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw soft undulating light streams (refraction waves)
      streams.forEach((stream) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(22, 143, 121, ${stream.alpha})`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x < width; x += 25) {
          const y =
            stream.y +
            Math.sin(x / stream.wavelength + time * stream.speed * 800 + stream.offset) *
              stream.amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // 2. Draw drifting light caustics
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.fill();

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x > width) p.x = 0;
          if (p.x < 0) p.x = width;
          if (p.y > height) p.y = 0;
          if (p.y < 0) p.y = height;
        }
      });

      time += 0.016;
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      aria-hidden="true"
    />
  );
};
