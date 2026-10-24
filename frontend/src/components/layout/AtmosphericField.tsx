import React, { useEffect, useRef } from 'react';

/**
 * Atmospheric Light Depth Field
 * Extremely subtle wind stream caustics in deep emerald (#087F6A) and terracotta (#C96A3D)
 * Opacity strictly below 4% to remain calm, expensive, and non-distracting.
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

    // 2 very subtle undulating wind streamlines
    const streamCount = 2;
    const streams = [
      { y: height * 0.25, amplitude: 18, wavelength: 480, speed: 0.0002, alpha: 0.025, color: 'rgba(8, 127, 106,' },
      { y: height * 0.65, amplitude: 22, wavelength: 540, speed: 0.00025, alpha: 0.020, color: 'rgba(201, 106, 61,' },
    ];

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      streams.forEach((stream) => {
        ctx.beginPath();
        ctx.strokeStyle = `${stream.color} ${stream.alpha})`;
        ctx.lineWidth = 1;

        for (let x = 0; x < width; x += 30) {
          const y =
            stream.y +
            Math.sin(x / stream.wavelength + time * stream.speed * 800) * stream.amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
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
      className="fixed inset-0 pointer-events-none z-0 opacity-60"
      aria-hidden="true"
    />
  );
};
