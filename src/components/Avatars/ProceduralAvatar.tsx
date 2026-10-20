/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Clean-room Procedural SVG Avatar Engine for Aegis Health AI.
 * Renders 2D geometric avatars with 3D-inspired shading, layered iris/catchlight eyes,
 * smooth expression transitions, natural blinking, and state-driven animations
 * (idle, listening, thinking, speaking, concerned, celebrating) in pure SVG.
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useId,
  useRef,
  useState,
} from 'react';
import {
  AURA_AVATAR_DEFINITION,
  AvatarAnimationState,
  AvatarExpression,
  ProceduralAvatarDefinition,
  SPECIALIST_AVATARS,
} from '../../data/avatars/avatarPresets';
import { SpecialistId } from '../../types/ai';

export type AvatarGesture = 'none' | 'wave' | 'point' | 'thumbs-up' | 'explain';

export interface AvatarController {
  play: (animation: AvatarAnimationState) => void;
  setExpression: (expression: AvatarExpression) => void;
  lookAt: (normalizedX: number, normalizedY: number) => void;
}

export interface ProceduralAvatarProps {
  definition?: ProceduralAvatarDefinition;
  specialistId?: SpecialistId;
  state?: AvatarAnimationState;
  expression?: AvatarExpression;
  gesture?: AvatarGesture;
  trackCursor?: boolean;
  lookAt?: { x: number; y: number } | null;
  size?: number | string;
  className?: string;
  ariaLabel?: string;
  showStatusRing?: boolean;
}

// Shared lightweight pointer listener across all mounted ProceduralAvatars
type PointerSubscriber = (clientX: number, clientY: number) => void;
const pointerSubscribers = new Set<PointerSubscriber>();
let globalPointerAttached = false;

function subscribeGlobalPointer(cb: PointerSubscriber): () => void {
  pointerSubscribers.add(cb);
  if (!globalPointerAttached && typeof window !== 'undefined') {
    globalPointerAttached = true;
    window.addEventListener(
      'pointermove',
      (e: PointerEvent) => {
        pointerSubscribers.forEach((sub) => sub(e.clientX, e.clientY));
      },
      { passive: true }
    );
  }
  return () => {
    pointerSubscribers.delete(cb);
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Computes head contour path in a 100x100 SVG coordinate space.
 */
function getHeadPath(shape: ProceduralAvatarDefinition['geometry']['headShape']): string {
  switch (shape) {
    case 'oval':
      return 'M 50 20 C 67 20, 74 33, 73 51 C 72 68, 62 78, 50 78 C 38 78, 28 68, 27 51 C 26 33, 33 20, 50 20 Z';
    case 'soft-square':
      return 'M 50 21 C 66 21, 74 28, 74 47 C 74 66, 66 77, 50 77 C 34 77, 26 66, 26 47 C 26 28, 34 21, 50 21 Z';
    case 'heart':
      return 'M 50 22 C 67 20, 75 33, 73 50 C 71 65, 59 77, 50 79 C 41 77, 29 65, 27 50 C 25 33, 33 20, 50 22 Z';
    case 'chibi':
      return 'M 50 22 C 69 22, 77 35, 76 52 C 75 69, 64 77, 50 77 C 36 77, 25 69, 24 52 C 23 35, 31 22, 50 22 Z';
    case 'rounded':
    default:
      return 'M 50 20 C 68 20, 75 33, 74 50 C 73 67, 63 77, 50 77 C 37 77, 27 67, 26 50 C 25 33, 32 20, 50 20 Z';
  }
}

/**
 * Renders procedural hair paths layered above the head with 3D highlight planes.
 */
function renderHair(
  style: ProceduralAvatarDefinition['geometry']['hairStyle'],
  hairColor: string,
  accentColor: string
) {
  switch (style) {
    case 'wave':
      return (
        <g>
          <path
            d="M 24 46 C 21 24, 35 14, 52 14 C 69 14, 79 25, 76 46 C 73 33, 64 26, 50 27 C 36 28, 28 35, 24 46 Z"
            fill={hairColor}
          />
          <path
            d="M 27 36 C 34 22, 49 19, 67 25 C 58 19, 42 17, 29 29 Z"
            fill={accentColor}
            opacity={0.5}
          />
        </g>
      );
    case 'crown':
      return (
        <g>
          <path
            d="M 25 44 C 24 23, 36 15, 50 15 C 64 15, 76 23, 75 44 C 70 31, 60 26, 50 26 C 40 26, 30 31, 25 44 Z"
            fill={hairColor}
          />
          <path
            d="M 38 22 L 43 12 L 50 18 L 57 12 L 62 22 Z"
            fill={accentColor}
          />
        </g>
      );
    case 'bun':
      return (
        <g>
          <circle cx="50" cy="14" r="9.5" fill={hairColor} />
          <ellipse cx="50" cy="18" rx="7.5" ry="2.4" fill={accentColor} opacity={0.9} />
          <path
            d="M 25 44 C 24 24, 36 17, 50 17 C 64 17, 76 24, 75 44 C 70 32, 61 26, 50 26 C 39 26, 30 32, 25 44 Z"
            fill={hairColor}
          />
        </g>
      );
    case 'curly':
      return (
        <g fill={hairColor}>
          <circle cx="31" cy="27" r="8.5" />
          <circle cx="43" cy="20" r="9.5" />
          <circle cx="57" cy="20" r="9.5" />
          <circle cx="69" cy="27" r="8.5" />
          <circle cx="25" cy="38" r="6.5" />
          <circle cx="75" cy="38" r="6.5" />
          <circle cx="43" cy="19" r="4" fill={accentColor} opacity={0.25} />
        </g>
      );
    case 'headwrap':
      return (
        <g>
          <path
            d="M 23 46 C 22 22, 35 14, 50 14 C 65 14, 78 22, 77 46 C 71 32, 62 26, 50 26 C 38 26, 29 32, 23 46 Z"
            fill={accentColor}
          />
          <path
            d="M 26 37 C 38 23, 62 23, 74 37 C 66 28, 34 28, 26 37 Z"
            fill={hairColor}
            opacity={0.7}
          />
        </g>
      );
    case 'spiky':
      return (
        <g>
          <path
            d="M 24 42 L 27 24 L 35 28 L 43 13 L 51 24 L 60 13 L 66 26 L 74 22 L 76 42 C 68 30, 32 30, 24 42 Z"
            fill={hairColor}
          />
          <path
            d="M 35 28 L 43 15 L 50 24 L 59 15 L 64 26 C 54 22, 44 22, 35 28 Z"
            fill={accentColor}
            opacity={0.35}
          />
        </g>
      );
    case 'bob':
      return (
        <g>
          <path
            d="M 22 56 C 20 28, 32 15, 50 15 C 68 15, 80 28, 78 56 C 75 38, 68 28, 50 28 C 32 28, 25 38, 22 56 Z"
            fill={hairColor}
          />
          <path
            d="M 29 29 C 38 19, 62 19, 71 29 C 62 23, 38 23, 29 29 Z"
            fill={accentColor}
            opacity={0.35}
          />
        </g>
      );
    case 'sage':
      return (
        <g>
          <path
            d="M 26 40 C 26 28, 34 21, 50 21 C 66 21, 74 28, 74 40 C 71 31, 63 25, 50 25 C 37 25, 29 31, 26 40 Z"
            fill={hairColor}
            opacity={0.55}
          />
        </g>
      );
    case 'parted':
      return (
        <g>
          <path
            d="M 25 44 C 24 23, 36 16, 50 16 C 65 16, 76 24, 75 44 C 71 32, 60 26, 44 27 C 35 28, 29 34, 25 44 Z"
            fill={hairColor}
          />
          <path
            d="M 32 26 C 42 18, 58 18, 68 27 C 58 22, 44 22, 32 26 Z"
            fill={accentColor}
            opacity={0.35}
          />
        </g>
      );
    case 'short-neat':
    default:
      return (
        <g>
          <path
            d="M 25 42 C 24 23, 35 16, 50 16 C 65 16, 76 23, 75 42 C 70 31, 62 26, 50 26 C 38 26, 30 31, 25 42 Z"
            fill={hairColor}
          />
          <path
            d="M 33 25 C 43 19, 57 19, 67 25 C 57 22, 43 22, 33 25 Z"
            fill={accentColor}
            opacity={0.35}
          />
        </g>
      );
  }
}

/**
 * Renders procedural accessories (glasses, neural halo, badges, stethoscope collar).
 */
function renderAccessory(
  accessory: ProceduralAvatarDefinition['geometry']['accessory'],
  accentColor: string,
  glowColor: string
) {
  switch (accessory) {
    case 'glasses-round':
      return (
        <g stroke={glowColor} strokeWidth="2" fill="none" opacity={0.95}>
          <circle cx="38.5" cy="48" r="7.5" fill="#ffffff" fillOpacity={0.1} />
          <circle cx="61.5" cy="48" r="7.5" fill="#ffffff" fillOpacity={0.1} />
          <path d="M 46 48 L 54 48" strokeLinecap="round" />
          <path d="M 26 46 L 31 47" strokeLinecap="round" />
          <path d="M 69 47 L 74 46" strokeLinecap="round" />
        </g>
      );
    case 'glasses-modern':
      return (
        <g stroke={glowColor} strokeWidth="2" fill="none" opacity={0.95}>
          <rect x="30" y="42.5" width="17" height="11" rx="3" fill="#ffffff" fillOpacity={0.1} />
          <rect x="53" y="42.5" width="17" height="11" rx="3" fill="#ffffff" fillOpacity={0.1} />
          <path d="M 47 46.5 L 53 46.5" strokeLinecap="round" />
        </g>
      );
    case 'headband-aura':
      return (
        <g>
          <path
            d="M 27 34 Q 50 24 73 34"
            stroke={glowColor}
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="50" cy="29" r="3.5" fill={glowColor} />
          <circle cx="50" cy="29" r="1.6" fill="#FFFFFF" />
        </g>
      );
    case 'neural-halo':
      return (
        <g opacity={0.92}>
          <ellipse
            cx="50"
            cy="17"
            rx="23"
            ry="5"
            stroke={glowColor}
            strokeWidth="1.8"
            strokeDasharray="3.5 2"
            fill="none"
          />
          <circle cx="27" cy="17" r="2.2" fill={glowColor} />
          <circle cx="73" cy="17" r="2.2" fill={glowColor} />
          <circle cx="50" cy="12" r="2.5" fill={accentColor} />
        </g>
      );
    case 'stethoscope-collar':
      return (
        <g stroke={glowColor} strokeWidth="2.2" fill="none" strokeLinecap="round">
          <path d="M 36 77 C 36 88, 43 92, 50 92 C 57 92, 64 88, 64 77" />
          <circle cx="59" cy="88" r="3.8" fill={accentColor} stroke={glowColor} strokeWidth="1.6" />
        </g>
      );
    case 'heart-pin':
      return (
        <path
          d="M 64 85.5 C 64 83.2, 61.2 82, 60 83.8 C 58.8 82, 56 83.2, 56 85.5 C 56 88.2, 60 90.5, 60 90.5 C 60 90.5, 64 88.2, 64 85.5 Z"
          fill={glowColor}
        />
      );
    case 'leaf-pin':
      return (
        <path
          d="M 56.5 89 C 56.5 83.5, 63.5 82.5, 64.5 87 C 63.5 90.5, 59 91.5, 56.5 89 Z"
          fill={glowColor}
        />
      );
    case 'shield-pin':
      return (
        <path
          d="M 60 82 L 64.5 83.8 L 64.5 87.8 C 64.5 90.8, 60 92.5, 60 92.5 C 60 92.5, 55.5 90.8, 55.5 87.8 L 55.5 83.8 Z"
          fill={glowColor}
        />
      );
    case 'star-badge':
      return (
        <polygon
          points="60,81.5 61.6,84.8 65,85.2 62.4,87.6 63.1,91 60,89.2 56.9,91 57.6,87.6 55,85.2 58.4,84.8"
          fill={glowColor}
        />
      );
    case 'none':
    default:
      return null;
  }
}

export const ProceduralAvatar = forwardRef<AvatarController, ProceduralAvatarProps>(
  function ProceduralAvatar(
    {
      definition,
      specialistId,
      state = 'idle',
      expression,
      gesture = 'none',
      trackCursor = true,
      lookAt = null,
      size = '100%',
      className = '',
      ariaLabel,
      showStatusRing = true,
    },
    ref
  ) {
    const uid = useId().replace(/:/g, '');
    const svgRef = useRef<SVGSVGElement | null>(null);
    const resolvedDef: ProceduralAvatarDefinition =
      definition ||
      (specialistId ? SPECIALIST_AVATARS[specialistId] : AURA_AVATAR_DEFINITION) ||
      AURA_AVATAR_DEFINITION;

    const [imperativeState, setImperativeState] = useState<AvatarAnimationState | null>(null);
    const [imperativeExpr, setImperativeExpr] = useState<AvatarExpression | null>(null);
    const [imperativeLook, setImperativeLook] = useState<{ x: number; y: number } | null>(null);
    const [pointerGaze, setPointerGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isBlinking, setIsBlinking] = useState(false);
    const [speechTick, setSpeechTick] = useState(0);

    useImperativeHandle(ref, () => ({
      play: (anim: AvatarAnimationState) => {
        setImperativeState(anim);
      },
      setExpression: (expr: AvatarExpression) => {
        setImperativeExpr(expr);
      },
      lookAt: (normalizedX: number, normalizedY: number) => {
        setImperativeLook({
          x: clamp(normalizedX, -1, 1),
          y: clamp(normalizedY, -1, 1),
        });
      },
    }));

    // Subscribe to global cursor coordinates for 2.5D gaze & head parallax
    useEffect(() => {
      if (!trackCursor || lookAt || imperativeLook) return;
      return subscribeGlobalPointer((clientX, clientY) => {
        const el = svgRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const nx = clamp((clientX - cx) / 280, -1, 1);
        const ny = clamp((clientY - cy) / 280, -1, 1);
        setPointerGaze((prev) =>
          Math.abs(prev.x - nx) < 0.04 && Math.abs(prev.y - ny) < 0.04
            ? prev
            : { x: Number(nx.toFixed(2)), y: Number(ny.toFixed(2)) }
        );
      });
    }, [trackCursor, lookAt, imperativeLook]);

    const activeState: AvatarAnimationState = imperativeState ?? state;
    const activeExpression: AvatarExpression =
      imperativeExpr ??
      expression ??
      (activeState === 'listening'
        ? 'listening'
        : activeState === 'thinking'
        ? 'thinking'
        : activeState === 'speaking'
        ? 'speaking'
        : activeState === 'concerned'
        ? 'concerned'
        : activeState === 'celebrating'
        ? 'celebrating'
        : resolvedDef.defaultExpression);

    // Natural periodic blink loop
    useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      const scheduleBlink = () => {
        const delay = 2800 + Math.random() * 2200;
        timeoutId = setTimeout(() => {
          setIsBlinking(true);
          setTimeout(() => {
            setIsBlinking(false);
            scheduleBlink();
          }, 140);
        }, delay);
      };
      scheduleBlink();
      return () => clearTimeout(timeoutId);
    }, []);

    // Mouth articulation loop when speaking
    useEffect(() => {
      if (activeExpression !== 'speaking' && activeState !== 'speaking') {
        setSpeechTick(0);
        return;
      }
      const interval = setInterval(() => {
        setSpeechTick((t) => (t + 1) % 3);
      }, 180);
      return () => clearInterval(interval);
    }, [activeExpression, activeState]);

    const { palette, geometry } = resolvedDef;

    // Effective 2.5D gaze vector in [-1, 1]
    const activeGaze = imperativeLook ?? lookAt ?? pointerGaze;
    const gx = activeGaze.x;
    const gy = activeGaze.y;

    // Head tilt / float transform by state + 2.5D cursor parallax
    const baseRotate =
      activeState === 'listening'
        ? -3.5
        : activeState === 'thinking'
        ? 2.5
        : 0;
    const totalRotate = Number((baseRotate + gx * 3.2).toFixed(2));
    const headTranslateX = Number((gx * 1.4).toFixed(2));
    const headTranslateY = Number(
      (
        (activeState === 'listening'
          ? -1
          : activeState === 'thinking'
          ? -1.5
          : activeState === 'concerned'
          ? 0.5
          : 0) +
        gy * 1.1
      ).toFixed(2)
    );
    const headTransform = `translate(${headTranslateX}, ${headTranslateY}) rotate(${totalRotate} 50 50)`;

    // Multi-plane parallax offsets (inspired by bible-strong-avatar-lab surfaces.ts & scene.ts)
    const earOffsetX = Number((-gx * 0.8).toFixed(2));
    const earOffsetY = Number((-gy * 0.6).toFixed(2));
    const featureOffsetX = Number((gx * 1.2).toFixed(2));
    const featureOffsetY = Number((gy * 0.9).toFixed(2));
    const pupilOffsetX = Number(
      ((activeExpression === 'thinking' ? 1.4 : 0) + gx * 2.4).toFixed(2)
    );
    const pupilOffsetY = Number(
      ((activeExpression === 'thinking' ? -1.4 : 0) + gy * 1.8).toFixed(2)
    );

    // Eyebrow paths based on expression
    const leftBrowPath =
      activeExpression === 'concerned'
        ? 'M 32 39.5 Q 38.5 41.5 44 37.5'
        : activeExpression === 'thinking'
        ? 'M 32 36.5 Q 38.5 33.5 44.5 36.5'
        : activeExpression === 'listening'
        ? 'M 32 36.5 Q 38.5 34 44.5 36.5'
        : 'M 32.5 38.5 Q 38.5 36 44.5 38.5';

    const rightBrowPath =
      activeExpression === 'concerned'
        ? 'M 56 37.5 Q 61.5 41.5 68 39.5'
        : activeExpression === 'thinking'
        ? 'M 55.5 38.5 Q 61.5 37 67.5 38.5'
        : activeExpression === 'listening'
        ? 'M 55.5 36.5 Q 61.5 34 68 36.5'
        : 'M 55.5 38.5 Q 61.5 36 67.5 38.5';

    // Mouth rendering based on expression and speech cadence
    const renderMouth = () => {
      if (activeExpression === 'speaking') {
        const mouthHeights = [3.0, 4.8, 2.0];
        const ry = mouthHeights[speechTick] ?? 3.2;
        return (
          <g>
            <ellipse
              cx="50"
              cy="64.5"
              rx="5.2"
              ry={ry}
              fill="#581C32"
              stroke={palette.skinShadow}
              strokeWidth="0.9"
            />
            <path d="M 46.5 62.5 Q 50 63.2 53.5 62.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        );
      }
      if (activeExpression === 'concerned') {
        return (
          <path
            d="M 43.5 66.5 Q 50 63 56.5 66.5"
            stroke="#581C32"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        );
      }
      if (activeExpression === 'thinking') {
        return (
          <path
            d="M 45 64.5 Q 50 64 54.5 63"
            stroke="#581C32"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        );
      }
      if (activeExpression === 'celebrating' || activeExpression === 'happy') {
        return (
          <g>
            <path
              d="M 41.5 62.5 Q 50 70.5 58.5 62.5 Z"
              fill="#6D233C"
              stroke="#581C32"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M 44 63.2 Q 50 64.8 56 63.2"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        );
      }
      // neutral / listening gentle reassuring smile
      return (
        <path
          d="M 43 63.5 Q 50 68 57 63.5"
          stroke="#581C32"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      );
    };

    // Procedural hand / pointer gesture (inspired by bible-strong-avatar-lab body.ts)
    const renderGesture = () => {
      if (gesture === 'point' || gesture === 'explain') {
        return (
          <g transform={`translate(${Number((gx * 2.2).toFixed(2))}, ${Number((gy * 1.4).toFixed(2))})`}>
            <circle
              cx="77"
              cy="78"
              r="7.5"
              fill={palette.skinBase}
              stroke={palette.glowColor}
              strokeWidth="1.5"
            />
            <path
              d="M 77 75 L 77 68"
              stroke={palette.skinBase}
              strokeWidth="3.4"
              strokeLinecap="round"
            />
            <circle cx="77" cy="66.5" r="2.1" fill={palette.glowColor} />
          </g>
        );
      }
      if (gesture === 'wave') {
        return (
          <g transform="translate(0, -1)">
            <ellipse
              cx="78"
              cy="74"
              rx="6.5"
              ry="7.5"
              transform="rotate(18 78 74)"
              fill={palette.skinBase}
              stroke={palette.glowColor}
              strokeWidth="1.4"
            />
            <path
              d="M 83 68 Q 87 72 84 77"
              stroke={palette.glowColor}
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        );
      }
      if (gesture === 'thumbs-up') {
        return (
          <g>
            <circle
              cx="77"
              cy="79"
              r="6.5"
              fill={palette.skinBase}
              stroke={palette.glowColor}
              strokeWidth="1.4"
            />
            <path
              d="M 75 76 L 75 70"
              stroke={palette.skinBase}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </g>
        );
      }
      return null;
    };

    const statusColor =
      activeState === 'concerned'
        ? '#F43F5E'
        : activeState === 'listening'
        ? '#38BDF8'
        : activeState === 'thinking'
        ? '#A855F7'
        : activeState === 'speaking'
        ? '#14B8A6'
        : palette.glowColor;

    return (
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="img"
        aria-label={ariaLabel || `${resolvedDef.name} avatar (${activeExpression})`}
        data-testid={`procedural-avatar-${resolvedDef.id}`}
        data-avatar-state={activeState}
        data-avatar-expression={activeExpression}
        data-avatar-gaze={`${gx},${gy}`}
        className={`select-none overflow-visible block shrink-0 ${className}`}
      >
        <defs>
          <linearGradient id={`bg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.bgGradientStart} />
            <stop offset="100%" stopColor={palette.bgGradientEnd} />
          </linearGradient>
          <linearGradient id={`skin-${uid}`} x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor={palette.skinBase} />
            <stop offset="100%" stopColor={palette.skinShadow} />
          </linearGradient>
          <linearGradient id={`rim-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="55%" stopColor={palette.glowColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id={`suit-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.clothingColor} />
            <stop offset="100%" stopColor={palette.bgGradientEnd} />
          </linearGradient>
          <clipPath id={`clip-${uid}`}>
            <circle cx="50" cy="50" r="46" />
          </clipPath>
        </defs>

        {/* Background Medallion */}
        <circle cx="50" cy="50" r="46" fill={`url(#bg-${uid})`} />

        {/* Dynamic Status / State Aura Ring */}
        {showStatusRing && (
          <circle
            cx="50"
            cy="50"
            r="47.2"
            fill="none"
            stroke={statusColor}
            strokeWidth={activeState === 'idle' ? '1.8' : '2.8'}
            strokeOpacity={activeState === 'idle' ? 0.55 : 0.95}
            strokeDasharray={activeState === 'thinking' ? '6 4' : undefined}
          />
        )}

        <g clipPath={`url(#clip-${uid})`}>
          {/* Ambient Glow Halo Behind Head (Counter-parallax depth plane) */}
          <circle
            cx={50 - gx * 1.5}
            cy={44 - gy * 1.2}
            r="32"
            fill={statusColor}
            opacity={activeState === 'idle' ? 0.18 : 0.32}
          />

          {/* Shoulders & Torso */}
          <path
            d="M 15 100 C 17 79, 32 74, 50 74 C 68 74, 83 79, 85 100 Z"
            fill={`url(#suit-${uid})`}
          />

          {/* Soft Collar / Lapel V-Neck */}
          <path
            d="M 40 75 L 50 89 L 60 75"
            fill="none"
            stroke={palette.glowColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />

          {/* Neck */}
          <rect
            x="43.5"
            y="67"
            width="13"
            height="12"
            rx="5"
            fill={palette.skinShadow}
          />

          {/* Animated 2.5D Head Group */}
          <g transform={headTransform}>
            {/* Ears (Mid-back depth plane) */}
            <g transform={`translate(${earOffsetX}, ${earOffsetY})`}>
              <circle cx="25.5" cy="50" r="4.5" fill={palette.skinShadow} />
              <circle cx="74.5" cy="50" r="4.5" fill={palette.skinShadow} />
            </g>

            {/* 3D-shaded Procedural Head */}
            <path d={getHeadPath(geometry.headShape)} fill={`url(#skin-${uid})`} />

            {/* 3D Faceted Surface Rim-Lighting Plane (surfaces.ts inspired) */}
            <path
              d={getHeadPath(geometry.headShape)}
              fill={`url(#rim-${uid})`}
              pointerEvents="none"
            />

            {/* Foreground Facial Features Group (2.5D foreground plane) */}
            <g transform={`translate(${featureOffsetX}, ${featureOffsetY})`}>
              {/* Subtle Cheek Warmth */}
              <ellipse
                cx="34.5"
                cy="55.5"
                rx="4.2"
                ry="2.2"
                fill={palette.accentColor}
                opacity={activeExpression === 'happy' || activeExpression === 'celebrating' ? 0.35 : 0.18}
              />
              <ellipse
                cx="65.5"
                cy="55.5"
                rx="4.2"
                ry="2.2"
                fill={palette.accentColor}
                opacity={activeExpression === 'happy' || activeExpression === 'celebrating' ? 0.35 : 0.18}
              />

              {/* Eyebrows */}
              <path
                d={leftBrowPath}
                stroke={palette.hairColor}
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={rightBrowPath}
                stroke={palette.hairColor}
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />

              {/* Layered Expressive Eyes with Cursor Gaze Tracking */}
              {isBlinking ? (
                <g stroke="#1E293B" strokeWidth="2.2" fill="none" strokeLinecap="round">
                  <path d="M 34.5 48 Q 38.5 50.5 42.5 48" />
                  <path d="M 57.5 48 Q 61.5 50.5 65.5 48" />
                </g>
              ) : (
                <g>
                  {/* Sclera */}
                  <ellipse cx="38.5" cy="48" rx="4.8" ry="4.5" fill="#FFFFFF" opacity={0.96} />
                  <ellipse cx="61.5" cy="48" rx="4.8" ry="4.5" fill="#FFFFFF" opacity={0.96} />
                  {/* Colored Iris Ring */}
                  <circle
                    cx={38.5 + pupilOffsetX}
                    cy={48 + pupilOffsetY}
                    r="3.2"
                    fill={palette.accentColor}
                    opacity={0.85}
                  />
                  <circle
                    cx={61.5 + pupilOffsetX}
                    cy={48 + pupilOffsetY}
                    r="3.2"
                    fill={palette.accentColor}
                    opacity={0.85}
                  />
                  {/* Pupil Core */}
                  <circle
                    cx={38.5 + pupilOffsetX}
                    cy={48 + pupilOffsetY}
                    r="2.2"
                    fill="#0F172A"
                  />
                  <circle
                    cx={61.5 + pupilOffsetX}
                    cy={48 + pupilOffsetY}
                    r="2.2"
                    fill="#0F172A"
                  />
                  {/* Primary & Secondary Catchlights */}
                  <circle
                    cx={37.3 + pupilOffsetX}
                    cy={46.6 + pupilOffsetY}
                    r="1.2"
                    fill="#FFFFFF"
                  />
                  <circle
                    cx={60.3 + pupilOffsetX}
                    cy={46.6 + pupilOffsetY}
                    r="1.2"
                    fill="#FFFFFF"
                  />
                  <circle
                    cx={39.8 + pupilOffsetX}
                    cy={49.2 + pupilOffsetY}
                    r="0.55"
                    fill={palette.glowColor}
                  />
                  <circle
                    cx={62.8 + pupilOffsetX}
                    cy={49.2 + pupilOffsetY}
                    r="0.55"
                    fill={palette.glowColor}
                  />
                </g>
              )}

              {/* Soft Geometric Nose */}
              <path
                d="M 50 47.5 L 48.6 55.2 Q 50 56.2 51.6 55.2"
                stroke={palette.skinShadow}
                strokeWidth="1.7"
                fill="none"
                strokeLinecap="round"
              />

              {/* Mouth */}
              {renderMouth()}
            </g>

            {/* Hair Layer */}
            {renderHair(geometry.hairStyle, palette.hairColor, palette.accentColor)}

            {/* Accessory Layer */}
            <g transform={`translate(${Number((featureOffsetX * 0.7).toFixed(2))}, ${Number((featureOffsetY * 0.7).toFixed(2))})`}>
              {renderAccessory(geometry.accessory, palette.accentColor, palette.glowColor)}
            </g>
          </g>

          {/* Procedural Hand / Gesture Layer */}
          {renderGesture()}

          {/* Thinking Orbiting Dots */}
          {activeState === 'thinking' && (
            <g fill={palette.glowColor}>
              <circle cx="24" cy="24" r="2.2" opacity={0.9} />
              <circle cx="76" cy="22" r="1.8" opacity={0.75} />
              <circle cx="82" cy="32" r="1.4" opacity={0.55} />
            </g>
          )}
        </g>
      </svg>
    );
  }
);

export interface AuraCompanionProps {
  isListening?: boolean;
  isGenerating?: boolean;
  isSpeaking?: boolean;
  hasTriageAlert?: boolean;
  gesture?: AvatarGesture;
  lookAt?: { x: number; y: number } | null;
  size?: number | string;
  className?: string;
}

/**
 * State-driven Aura AI Companion Avatar wrapper for ChatCoach.tsx and AuraCursorGuide.tsx.
 */
export function AuraCompanion({
  isListening = false,
  isGenerating = false,
  isSpeaking = false,
  hasTriageAlert = false,
  gesture = 'none',
  lookAt = null,
  size = '100%',
  className = '',
}: AuraCompanionProps) {
  let state: AvatarAnimationState = 'idle';
  if (hasTriageAlert) {
    state = 'concerned';
  } else if (isSpeaking) {
    state = 'speaking';
  } else if (isGenerating) {
    state = 'thinking';
  } else if (isListening) {
    state = 'listening';
  }

  return (
    <ProceduralAvatar
      definition={AURA_AVATAR_DEFINITION}
      state={state}
      gesture={gesture}
      lookAt={lookAt}
      size={size}
      className={className}
      ariaLabel={`Aura AI Companion (${state})`}
    />
  );
}

export default ProceduralAvatar;
