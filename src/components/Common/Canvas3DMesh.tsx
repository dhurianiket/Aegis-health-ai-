import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  vz: number;
}

export const Canvas3DMesh: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let idleCallbackId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isRunning = false;
    let lastFrameTime = 0;
    const TARGET_FRAME_MS = 1000 / 30; // 30 FPS cap saves 60-75% main-thread CPU
    const MAX_DIST = 140;
    const MAX_DIST_SQ = MAX_DIST * MAX_DIST; // 19600

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let resizeTimer: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!canvas) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Check for prefers-reduced-motion accessibility preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const particleCount = prefersReducedMotion ? 20 : 35;
    const particles: Particle[] = [];
    const colors = ['#2DD4BF', '#38BDF8', '#818CF8', '#34D399'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 2 + 0.5,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        vz: (Math.random() - 0.5) * 0.01,
      });
    }

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);

      // Fast distance pre-filtering eliminates expensive Math.sqrt calls
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          if (Math.abs(dx) > MAX_DIST) continue;
          const dy = p1.y - p2.y;
          if (Math.abs(dy) > MAX_DIST) continue;

          const distSq = dx * dx + dy * dy;
          if (distSq >= MAX_DIST_SQ) continue;

          const dist = Math.sqrt(distSq);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          const alpha = (1 - dist / MAX_DIST) * 0.14;
          ctx.strokeStyle = `rgba(45, 212, 191, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Update & render particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.z, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    const loop = (timestamp: number) => {
      if (!isRunning) return;

      const elapsed = timestamp - lastFrameTime;
      if (elapsed >= TARGET_FRAME_MS) {
        lastFrameTime = timestamp - (elapsed % TARGET_FRAME_MS);
        drawFrame();
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    const startAnimation = () => {
      if (prefersReducedMotion) {
        drawFrame(); // Draw one single static frame
        return;
      }

      isRunning = true;
      lastFrameTime = performance.now();
      animationFrameId = requestAnimationFrame(loop);
    };

    // Pause animation when tab is hidden to eliminate background CPU work
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else if (!prefersReducedMotion) {
        isRunning = true;
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Defer startup via requestIdleCallback to free main-thread during initial boot/hydration
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleCallbackId = (window as any).requestIdleCallback(
        () => startAnimation(),
        { timeout: 400 }
      );
    } else {
      timeoutId = setTimeout(startAnimation, 300);
    }

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (timeoutId) clearTimeout(timeoutId);
      if (idleCallbackId !== null && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleCallbackId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-60 transition-opacity duration-500"
    />
  );
};
