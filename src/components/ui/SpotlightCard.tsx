import React, { useRef, useCallback } from 'react';

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  accentColor?: 'teal' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  enableContainerQuery?: boolean;
}

const ACCENT_SPOTLIGHTS: Record<NonNullable<SpotlightCardProps['accentColor']>, string> = {
  teal: 'rgba(45, 212, 191, 0.16)',
  indigo: 'rgba(129, 140, 248, 0.16)',
  emerald: 'rgba(52, 211, 153, 0.16)',
  amber: 'rgba(251, 191, 36, 0.16)',
  rose: 'rgba(251, 113, 133, 0.16)',
  sky: 'rgba(56, 189, 248, 0.16)',
};

/**
 * SpotlightCard — Apple HIG + React-Bits pointer-reactive glassmorphic Bento surface.
 * Tracks pointer coordinates (--mouse-x, --mouse-y) and edge angle to render a smooth
 * radial spotlight and hairline specular highlight with zero re-renders.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor,
  accentColor = 'teal',
  enableContainerQuery = false,
  onPointerMove,
  ...rest
}) => {
  const divRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = divRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
        el.style.setProperty(
          '--spotlight-color',
          spotlightColor || ACCENT_SPOTLIGHTS[accentColor]
        );
      }
      onPointerMove?.(e);
    },
    [spotlightColor, accentColor, onPointerMove]
  );

  return (
    <div
      ref={divRef}
      onPointerMove={handlePointerMove}
      className={`aegis-spotlight-card backdrop-blur-xl bg-[var(--color-surface)] border border-[var(--color-border)] ${
        enableContainerQuery ? 'bento-card-container' : ''
      } ${className}`}
      {...rest}
    >
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

export default SpotlightCard;
