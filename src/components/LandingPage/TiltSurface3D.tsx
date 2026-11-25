import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

export interface TiltSurface3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  maxTilt?: number;
  as?: 'div' | 'article';
}

const SPRING_CONFIG = { stiffness: 220, damping: 26, mass: 0.6 };

/**
 * TiltSurface3D — Physics-damped 3D perspective card for the public landing page.
 * Updates transform directly via Motion springs and paints a pointer specular glow on
 * an isolated overlay layer without triggering React re-renders or mutating CSS variables.
 */
export const TiltSurface3D: React.FC<TiltSurface3DProps> = ({
  children,
  className = '',
  glowColor = 'rgba(45, 212, 191, 0.18)',
  maxTilt = 6,
  as = 'div',
  onPointerMove,
  onPointerLeave,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setFinePointer(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const springRotateX = useSpring(rawRotateX, SPRING_CONFIG);
  const springRotateY = useSpring(rawRotateY, SPRING_CONFIG);
  const transformTemplate = useMotionTemplate`perspective(1100px) rotateX(${springRotateX}deg) rotateY(${springRotateY}deg)`;

  const tiltEnabled = finePointer && !prefersReducedMotion;

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (el && tiltEnabled) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          const nextRotateY = (px - 0.5) * 2 * maxTilt;
          const nextRotateX = (0.5 - py) * 2 * maxTilt;
          rawRotateX.set(nextRotateX);
          rawRotateY.set(nextRotateY);

          if (overlayRef.current) {
            overlayRef.current.style.opacity = '1';
            overlayRef.current.style.background = `radial-gradient(380px circle at ${e.clientX - rect.left}px ${
              e.clientY - rect.top
            }px, ${glowColor}, transparent 72%)`;
          }
        }
      }
      onPointerMove?.(e);
    },
    [tiltEnabled, maxTilt, rawRotateX, rawRotateY, glowColor, onPointerMove],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      rawRotateX.set(0);
      rawRotateY.set(0);
      if (overlayRef.current) {
        overlayRef.current.style.opacity = '0';
      }
      onPointerLeave?.(e);
    },
    [rawRotateX, rawRotateY, onPointerLeave],
  );

  const Component = as === 'article' ? motion.article : motion.div;

  return (
    <Component
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={tiltEnabled ? { transform: transformTemplate } : undefined}
      className={`aegis-hairline-surface hover-lift-fine relative overflow-hidden ${className}`}
      {...(rest as any)}
    >
      {/* Top 1px specular hairline edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent z-10"
      />
      {/* Isolated pointer glow layer */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 z-0"
      />
      <div className="relative z-10 h-full">{children}</div>
    </Component>
  );
};

export default TiltSurface3D;
