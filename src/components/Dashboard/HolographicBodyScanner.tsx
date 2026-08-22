import React, { useState, useMemo, useRef } from 'react';
import {
  Heart,
  Wind,
  Zap,
  Droplets,
  Activity,
  Shield,
  X,
  Sparkles,
  ChevronRight,
  Rotate3d,
  Layers,
  Thermometer,
  Gauge,
  Stethoscope,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  calculateOrganSystemScores,
  OrganHealthOverview,
  OrganSystemScore,
  OrganSystemKey,
  LabObservationItem,
} from '../../services/organHealthService';
import { WearableBiometrics } from '../../types/wearables';

export interface HolographicBodyScannerProps {
  labObservations?: LabObservationItem[];
  telemetry?: WearableBiometrics;
  onSelectSpecialist?: (specialistKey: string) => void;
  className?: string;
}

interface HotspotCoord {
  key: OrganSystemKey;
  label: string;
  cx: number;
  cy: number;
  icon: React.ComponentType<{ className?: string }>;
  anchorSide: 'left' | 'right';
}

const ORGAN_HOTSPOTS: HotspotCoord[] = [
  { key: 'cardiovascular', label: 'Heart', cx: 208, cy: 195, icon: Heart, anchorSide: 'right' },
  { key: 'pulmonary', label: 'Lungs', cx: 175, cy: 175, icon: Wind, anchorSide: 'left' },
  { key: 'hepatic', label: 'Liver', cx: 170, cy: 245, icon: Activity, anchorSide: 'left' },
  { key: 'metabolic', label: 'Pancreas', cx: 200, cy: 265, icon: Zap, anchorSide: 'right' },
  { key: 'renal', label: 'Kidneys', cx: 228, cy: 300, icon: Droplets, anchorSide: 'right' },
  { key: 'hematology', label: 'Blood Network', cx: 176, cy: 385, icon: Shield, anchorSide: 'left' },
];

export const HolographicBodyScanner: React.FC<HolographicBodyScannerProps> = ({
  labObservations = [],
  telemetry,
  onSelectSpecialist,
  className = '',
}) => {
  const overview: OrganHealthOverview = useMemo(
    () => calculateOrganSystemScores(labObservations),
    [labObservations]
  );

  const [selectedOrgan, setSelectedOrgan] = useState<OrganSystemScore | null>(null);
  const [scanActive, setScanActive] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'3d-mesh' | 'hologram-scan'>('3d-mesh');
  const [mouseRotation, setMouseRotation] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse move 3D tilt tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rx = -(y / (rect.height / 2)) * 10;
    const ry = (x / (rect.width / 2)) * 14;
    setMouseRotation({ rx, ry });
  };

  const handleMouseLeave = () => {
    setMouseRotation({ rx: 0, ry: 0 });
  };

  const getStatusColor = (status: 'optimal' | 'warning' | 'critical') => {
    if (status === 'critical') {
      return {
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        ring: '#F43F5E',
        glow: 'glow-rose-3d',
        text: 'text-rose-400',
        border: 'border-rose-500/50',
        bg: 'bg-rose-500/10',
      };
    }
    if (status === 'warning') {
      return {
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        ring: '#F59E0B',
        glow: 'glow-amber-3d',
        text: 'text-amber-400',
        border: 'border-amber-500/50',
        bg: 'bg-amber-500/10',
      };
    }
    return {
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      ring: '#10B981',
      glow: 'glow-emerald-3d',
      text: 'text-emerald-400',
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-500/10',
    };
  };

  // Telemetry Defaults & MAP (Mean Arterial Pressure) Calculation
  const heartRate = telemetry?.heartRate ?? 72;
  const spo2 = telemetry?.spo2 ?? 98;
  const sbp = 120;
  const dbp = 80;
  const mapValue = Math.round(dbp + (sbp - dbp) / 3);
  const bodyTempF = 98.4;
  const bodyTempC = Number(((bodyTempF - 32) * (5 / 9)).toFixed(1));
  const breathingRate = 16;

  // SpO2 circular gauge calculations
  const spo2Radius = 32;
  const spo2Circumference = 2 * Math.PI * spo2Radius;
  const spo2Offset = spo2Circumference - (spo2Circumference * Math.min(100, spo2)) / 100;

  // BP ring calculations
  const bpRadius = 28;
  const bpCircumference = 2 * Math.PI * bpRadius;
  const sbpNormalized = Math.min(100, Math.max(0, ((sbp - 60) / 140) * 100));
  const dbpNormalized = Math.min(100, Math.max(0, ((dbp - 40) / 80) * 100));
  const sbpOffset = bpCircumference - (bpCircumference * sbpNormalized) / 100;
  const dbpOffset = bpCircumference - (bpCircumference * dbpNormalized) / 100;

  // Cardiac pulse animation duration derived from BPM
  const cardiacDuration = heartRate > 0 ? 60 / heartRate : 0.85;
  // Breathing animation duration derived from breaths per minute
  const breathDuration = breathingRate > 0 ? 60 / breathingRate : 3.75;

  const isWireframeMode = viewMode === 'hologram-scan';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`w-full glass-card-ultra-3d p-5 sm:p-7 md:p-8 space-y-6 relative overflow-hidden ${className}`}
      data-testid="holographic-body-scanner"
    >
      {/* Background Ambient Hologram Glow */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-indigo-500/25 text-cyan-300 border border-cyan-500/40 glow-cyan-3d shrink-0">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Interactive 3D Holographic Anatomical Body Scanner
              </h3>
              <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider glow-cyan-3d">
                Live Spatial HUD
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light mt-1">
              Depth-calibrated 3D anatomical organ scanning & continuous physiological telemetry
            </p>
          </div>
        </div>

        {/* Action / Laser Scan Switcher Controls */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => setViewMode(viewMode === '3d-mesh' ? 'hologram-scan' : '3d-mesh')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all min-h-[44px] flex items-center gap-2 cursor-pointer ${
              isWireframeMode
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 glow-indigo-3d'
                : 'bg-white/5 border-white/15 text-slate-200 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{isWireframeMode ? 'Wireframe Mode' : 'Anatomical View'}</span>
          </button>

          <button
            onClick={() => setScanActive(!scanActive)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all min-h-[44px] flex items-center gap-2 cursor-pointer ${
              scanActive
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 glow-cyan-3d'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            aria-label={scanActive ? 'Pause Laser Scan' : 'Resume Laser Scan'}
          >
            <Rotate3d className="w-4 h-4" />
            <span>{scanActive ? 'Laser Scan ON' : 'Laser Scan PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left 3D Anatomical Body Viewport, Right Live Biometrics HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-center">
        {/* Left: 3D Holographic Body Stage (7 Cols) */}
        <div
          className="lg:col-span-7 flex flex-col items-center justify-center p-4 rounded-3xl relative overflow-hidden min-h-[520px]"
          style={{
            perspective: 1000,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(6, 182, 212, 0.08) 0%, rgba(2, 6, 23, 0.97) 70%)',
            border: '1px solid rgba(34, 211, 238, 0.2)',
            boxShadow: '0 0 60px -10px rgba(6, 182, 212, 0.15), inset 0 0 80px -20px rgba(6, 182, 212, 0.06)',
          }}
        >
          {/* Animated Holographic Floor Base with Rotating Concentric Rings */}
          <div className="absolute bottom-2 inset-x-4 h-44 flex items-end justify-center pointer-events-none">
            {/* Perspective floor grid */}
            <div
              className="w-full h-32 opacity-30"
              style={{
                transform: 'perspective(400px) rotateX(68deg)',
                backgroundImage:
                  'radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.5), transparent 65%), linear-gradient(to right, rgba(45, 212, 191, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(45, 212, 191, 0.3) 1px, transparent 1px)',
                backgroundSize: '100% 100%, 18px 18px, 18px 18px',
              }}
            />
            {/* Outer rotating ring */}
            <div
              className="absolute bottom-4 w-80 h-28 rounded-full pointer-events-none"
              style={{
                border: '2px solid rgba(34, 211, 238, 0.5)',
                boxShadow: '0 0 30px rgba(34, 211, 238, 0.35), inset 0 0 20px rgba(34, 211, 238, 0.15)',
                transform: 'perspective(400px) rotateX(68deg)',
                animation: 'floorRingSpin 20s linear infinite',
              }}
            />
            {/* Middle ring */}
            <div
              className="absolute bottom-6 w-60 h-20 rounded-full pointer-events-none"
              style={{
                border: '1.5px solid rgba(45, 212, 191, 0.4)',
                boxShadow: '0 0 20px rgba(45, 212, 191, 0.25)',
                transform: 'perspective(400px) rotateX(68deg)',
                animation: 'floorRingSpin 14s linear infinite reverse',
              }}
            />
            {/* Inner ring */}
            <div
              className="absolute bottom-8 w-40 h-14 rounded-full pointer-events-none"
              style={{
                border: '1px solid rgba(56, 189, 248, 0.35)',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)',
                transform: 'perspective(400px) rotateX(68deg)',
                animation: 'floorRingSpin 10s linear infinite',
              }}
            />
            {/* Volumetric light cone from platform */}
            <div
              className="absolute bottom-10 w-48 h-[420px]"
              style={{
                background: 'linear-gradient(to top, rgba(34, 211, 238, 0.12) 0%, rgba(34, 211, 238, 0.03) 40%, transparent 80%)',
                clipPath: 'polygon(25% 100%, 75% 100%, 60% 0%, 40% 0%)',
                animation: 'volumetricPulse 3s ease-in-out infinite',
              }}
            />
          </div>

          {/* 3D Transformable Stage */}
          <div
            className="relative w-full max-w-[380px] h-[500px] transition-transform duration-200 ease-out flex items-center justify-center"
            style={{
              transform: `rotateX(${mouseRotation.rx}deg) rotateY(${mouseRotation.ry}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* SVG High-Fidelity Multi-Layer Anatomical Body Model */}
            <svg
              viewBox="0 0 400 600"
              className="w-full h-full select-none relative z-10 holographic-body-glow"
            >
              <defs>
                {/* Body contour gradients */}
                <linearGradient id="bodyHoloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="0.85" />
                </linearGradient>

                <linearGradient id="bodyFillGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.15" />
                  <stop offset="30%" stopColor="#06B6D4" stopOpacity="0.1" />
                  <stop offset="60%" stopColor="#2DD4BF" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="0.12" />
                </linearGradient>

                <linearGradient id="organGlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
                </linearGradient>

                <linearGradient id="scanBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="40%" stopColor="#22D3EE" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#22D3EE" stopOpacity="1" />
                  <stop offset="60%" stopColor="#22D3EE" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>

                <linearGradient id="arterialGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#E11D48" stopOpacity="0.4" />
                </linearGradient>

                <linearGradient id="venousGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.3" />
                </linearGradient>

                <radialGradient id="neuralGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
                  <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                </radialGradient>

                {/* Fresnel rim glow filter */}
                <filter id="hologramGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Stronger outer glow */}
                <filter id="outerBodyGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feFlood floodColor="#22D3EE" floodOpacity="0.4" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="colorBlur" />
                  <feMerge>
                    <feMergeNode in="colorBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Heart glow filter */}
                <filter id="heartGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feFlood floodColor="#F43F5E" floodOpacity="0.5" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="colorBlur" />
                  <feMerge>
                    <feMergeNode in="colorBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Wireframe grid pattern */}
                <pattern id="wireframeGrid" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M12 0 L0 0 0 12" fill="none" stroke="rgba(34, 211, 238, 0.15)" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* ══════════════════════════════════════════════ */}
              {/* LAYER 0: Spatial Depth Coordinate Rings */}
              {/* ══════════════════════════════════════════════ */}
              <g opacity="0.5">
                <ellipse cx="200" cy="115" rx="55" ry="12" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="0.8" strokeDasharray="3 5" />
                <ellipse cx="200" cy="210" rx="95" ry="18" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="0.8" strokeDasharray="4 6" />
                <ellipse cx="200" cy="310" rx="80" ry="15" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="0.8" strokeDasharray="4 6" />
                <ellipse cx="200" cy="450" rx="65" ry="12" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="0.8" strokeDasharray="3 5" />
              </g>

              {/* ══════════════════════════════════════════════ */}
              {/* LAYER 1: Outer Body Glow (Fresnel Edge Light) */}
              {/* ══════════════════════════════════════════════ */}
              <path
                d="M200 25 C175 25 162 45 162 70 C162 95 174 110 185 116 L185 130 C155 134 125 145 110 160 C98 172 90 220 82 280 C76 325 72 370 70 395 C68 405 78 408 82 400 C90 380 98 340 106 290 L118 280 L130 330 C138 370 148 430 152 480 C156 525 158 565 155 580 C154 585 168 588 172 580 C178 560 182 500 185 450 L195 380 L205 380 L215 450 C218 500 222 560 228 580 C232 588 246 585 245 580 C242 565 244 525 248 480 C252 430 262 370 270 330 L282 280 L294 290 C302 340 310 380 318 400 C322 408 332 405 330 395 C328 370 324 325 318 280 C310 220 302 172 290 160 C275 145 245 134 215 130 L215 116 C226 110 238 95 238 70 C238 45 225 25 200 25 Z"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="6"
                opacity="0.15"
                filter="url(#outerBodyGlow)"
              />

              {/* ══════════════════════════════════════════════ */}
              {/* LAYER 2: Body Silhouette with Depth Fill */}
              {/* ══════════════════════════════════════════════ */}
              <g filter="url(#hologramGlow)">
                {/* Main body contour with translucent depth fill */}
                <path
                  d="M200 25 C175 25 162 45 162 70 C162 95 174 110 185 116 L185 130 C155 134 125 145 110 160 C98 172 90 220 82 280 C76 325 72 370 70 395 C68 405 78 408 82 400 C90 380 98 340 106 290 L118 280 L130 330 C138 370 148 430 152 480 C156 525 158 565 155 580 C154 585 168 588 172 580 C178 560 182 500 185 450 L195 380 L205 380 L215 450 C218 500 222 560 228 580 C232 588 246 585 245 580 C242 565 244 525 248 480 C252 430 262 370 270 330 L282 280 L294 290 C302 340 310 380 318 400 C322 408 332 405 330 395 C328 370 324 325 318 280 C310 220 302 172 290 160 C275 145 245 134 215 130 L215 116 C226 110 238 95 238 70 C238 45 225 25 200 25 Z"
                  fill="url(#bodyFillGrad)"
                  stroke="url(#bodyHoloGrad)"
                  strokeWidth="2"
                />

                {/* Wireframe grid overlay on body (clips to body shape) */}
                <clipPath id="bodyClip">
                  <path d="M200 25 C175 25 162 45 162 70 C162 95 174 110 185 116 L185 130 C155 134 125 145 110 160 C98 172 90 220 82 280 C76 325 72 370 70 395 C68 405 78 408 82 400 C90 380 98 340 106 290 L118 280 L130 330 C138 370 148 430 152 480 C156 525 158 565 155 580 C154 585 168 588 172 580 C178 560 182 500 185 450 L195 380 L205 380 L215 450 C218 500 222 560 228 580 C232 588 246 585 245 580 C242 565 244 525 248 480 C252 430 262 370 270 330 L282 280 L294 290 C302 340 310 380 318 400 C322 408 332 405 330 395 C328 370 324 325 318 280 C310 220 302 172 290 160 C275 145 245 134 215 130 L215 116 C226 110 238 95 238 70 C238 45 225 25 200 25 Z" />
                </clipPath>
                {isWireframeMode && (
                  <rect x="80" y="20" width="240" height="570" fill="url(#wireframeGrid)" clipPath="url(#bodyClip)" opacity="0.8" />
                )}

                {/* ══════════════════════════════════════════════ */}
                {/* LAYER 3: Skeletal & Anatomical Structure */}
                {/* ══════════════════════════════════════════════ */}

                {/* Skull & Brain — Multi-layer cranium with neural glow */}
                <g style={{ animation: 'neuralImpulse 3s ease-in-out infinite' }}>
                  {/* Cranium outer contour */}
                  <path
                    d="M200 30 C180 30 168 45 168 65 C168 85 178 100 190 108 L210 108 C222 100 232 85 232 65 C232 45 220 30 200 30 Z"
                    fill="rgba(56, 189, 248, 0.08)"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                  />
                  {/* Neural network glow */}
                  <circle cx="200" cy="62" r="22" fill="url(#neuralGlowGrad)" />
                  {/* Brain hemisphere division */}
                  <path d="M200 38 L200 92" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="1" />
                  {/* Left hemisphere sulci */}
                  <path d="M185 50 Q192 55 188 65 Q183 72 186 80" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="0.8" fill="none" />
                  {/* Right hemisphere sulci */}
                  <path d="M215 50 Q208 55 212 65 Q217 72 214 80" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="0.8" fill="none" />
                  {/* Frontal cortex */}
                  <path d="M184 55 Q200 48 216 55" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="0.7" fill="none" />
                  {/* Temporal lobe indicators */}
                  <circle cx="175" cy="65" r="3" fill="rgba(56, 189, 248, 0.2)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.5" />
                  <circle cx="225" cy="65" r="3" fill="rgba(56, 189, 248, 0.2)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.5" />
                  {/* Brainstem */}
                  <path d="M196 95 L196 115 M204 95 L204 115" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1" />
                </g>

                {/* Articulated Vertebral Spine — 24 individual vertebrae */}
                <g>
                  {Array.from({ length: 24 }, (_, i) => {
                    const y = 120 + i * 10;
                    const w = i < 7 ? 8 : i < 19 ? 10 : 12; // Cervical, Thoracic, Lumbar widths
                    return (
                      <g key={`vert-${i}`}>
                        {/* Vertebral body */}
                        <rect
                          x={200 - w / 2}
                          y={y}
                          width={w}
                          height={6}
                          rx={2}
                          fill="rgba(56, 189, 248, 0.12)"
                          stroke="rgba(56, 189, 248, 0.4)"
                          strokeWidth="0.7"
                        />
                        {/* Intervertebral disc glow */}
                        {i < 23 && (
                          <line
                            x1={200 - w / 2 + 1}
                            y1={y + 7}
                            x2={200 + w / 2 - 1}
                            y2={y + 7}
                            stroke="rgba(34, 211, 238, 0.3)"
                            strokeWidth="1.5"
                          />
                        )}
                      </g>
                    );
                  })}
                  {/* Spinal canal center glow line */}
                  <line x1="200" y1="120" x2="200" y2="358" stroke="rgba(34, 211, 238, 0.15)" strokeWidth="3" />
                </g>

                {/* Ribcage — Bilateral with sternum and depth gradients */}
                <g opacity="0.7">
                  {/* Sternum centerline */}
                  <path d="M200 140 L200 255" stroke="rgba(45, 212, 191, 0.5)" strokeWidth="2" />
                  {/* 12 pairs of ribs (left and right) */}
                  {[
                    { y: 148, lx: 158, rx: 242, w: 0.5 },
                    { y: 158, lx: 154, rx: 246, w: 0.6 },
                    { y: 168, lx: 150, rx: 250, w: 0.7 },
                    { y: 178, lx: 148, rx: 252, w: 0.8 },
                    { y: 188, lx: 150, rx: 250, w: 0.8 },
                    { y: 198, lx: 152, rx: 248, w: 0.7 },
                    { y: 208, lx: 155, rx: 245, w: 0.7 },
                    { y: 218, lx: 158, rx: 242, w: 0.6 },
                    { y: 228, lx: 162, rx: 238, w: 0.5 },
                    { y: 238, lx: 167, rx: 233, w: 0.5 },
                    { y: 246, lx: 172, rx: 228, w: 0.4 },
                    { y: 253, lx: 178, rx: 222, w: 0.4 },
                  ].map((rib, i) => (
                    <g key={`rib-${i}`}>
                      {/* Left rib arc */}
                      <path
                        d={`M200 ${rib.y} Q${rib.lx + 15} ${rib.y - 3} ${rib.lx} ${rib.y + 10}`}
                        stroke={`rgba(45, 212, 191, ${0.3 + rib.w * 0.3})`}
                        strokeWidth={1 + rib.w}
                        fill="none"
                      />
                      {/* Right rib arc */}
                      <path
                        d={`M200 ${rib.y} Q${rib.rx - 15} ${rib.y - 3} ${rib.rx} ${rib.y + 10}`}
                        stroke={`rgba(45, 212, 191, ${0.3 + rib.w * 0.3})`}
                        strokeWidth={1 + rib.w}
                        fill="none"
                      />
                    </g>
                  ))}
                </g>

                {/* ══════════════════════════════════════════════ */}
                {/* LAYER 4: Internal Organs — High Detail */}
                {/* ══════════════════════════════════════════════ */}

                {/* Lungs with bronchial tree — BREATHING ANIMATION */}
                <g style={{ animation: `pulmonaryBreathing ${breathDuration}s ease-in-out infinite`, transformOrigin: '200px 190px' }}>
                  {/* Left Lung */}
                  <path
                    d="M165 150 C152 168 148 200 152 225 C156 242 168 248 178 245 C186 242 188 215 186 190 C185 168 178 150 165 150 Z"
                    fill="rgba(34, 211, 238, 0.12)"
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                  />
                  {/* Left bronchial branches */}
                  <path d="M195 145 L178 165 L172 185 M178 165 L168 175 M172 185 L165 200 M172 185 L178 205" stroke="rgba(34, 211, 238, 0.35)" strokeWidth="0.8" fill="none" />
                  {/* Left alveoli dots */}
                  <circle cx="165" cy="195" r="2" fill="rgba(34, 211, 238, 0.25)" />
                  <circle cx="170" cy="210" r="1.5" fill="rgba(34, 211, 238, 0.2)" />
                  <circle cx="160" cy="220" r="1.5" fill="rgba(34, 211, 238, 0.2)" />

                  {/* Right Lung */}
                  <path
                    d="M235 150 C248 168 252 200 248 225 C244 242 232 248 222 245 C214 242 212 215 214 190 C215 168 222 150 235 150 Z"
                    fill="rgba(34, 211, 238, 0.12)"
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                  />
                  {/* Right bronchial branches */}
                  <path d="M205 145 L222 165 L228 185 M222 165 L232 175 M228 185 L235 200 M228 185 L222 205" stroke="rgba(34, 211, 238, 0.35)" strokeWidth="0.8" fill="none" />
                  {/* Right alveoli dots */}
                  <circle cx="235" cy="195" r="2" fill="rgba(34, 211, 238, 0.25)" />
                  <circle cx="230" cy="210" r="1.5" fill="rgba(34, 211, 238, 0.2)" />
                  <circle cx="240" cy="220" r="1.5" fill="rgba(34, 211, 238, 0.2)" />
                </g>

                {/* Heart — 4-Chamber with Aortic Arch — CARDIAC PULSE ANIMATION */}
                <g
                  filter="url(#heartGlow)"
                  style={{ animation: `cardiacPulse ${cardiacDuration}s ease-in-out infinite`, transformOrigin: '200px 198px' }}
                >
                  {/* Heart outer contour */}
                  <path
                    d="M200 180 C190 168 175 172 175 188 C175 204 192 216 200 224 C208 216 225 204 225 188 C225 172 210 168 200 180 Z"
                    fill="rgba(244, 63, 94, 0.25)"
                    stroke="#F43F5E"
                    strokeWidth="2"
                  />
                  {/* Interventricular septum */}
                  <path d="M200 180 L200 222" stroke="rgba(244, 63, 94, 0.5)" strokeWidth="1" />
                  {/* Atrial division */}
                  <path d="M182 190 L218 190" stroke="rgba(244, 63, 94, 0.35)" strokeWidth="0.8" />
                  {/* Aortic arch */}
                  <path
                    d="M200 175 C200 160 210 152 220 155 C230 158 235 165 232 175"
                    stroke="rgba(244, 63, 94, 0.6)"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  {/* Pulmonary arteries */}
                  <path d="M195 175 C190 162 178 158 172 165" stroke="rgba(99, 102, 241, 0.5)" strokeWidth="1" fill="none" />
                  {/* Chamber labels (tiny) */}
                  <text x="188" y="186" fontSize="5" fill="rgba(244, 63, 94, 0.6)" fontFamily="monospace">LA</text>
                  <text x="208" y="186" fontSize="5" fill="rgba(244, 63, 94, 0.6)" fontFamily="monospace">RA</text>
                  <text x="188" y="210" fontSize="5" fill="rgba(244, 63, 94, 0.6)" fontFamily="monospace">LV</text>
                  <text x="208" y="210" fontSize="5" fill="rgba(244, 63, 94, 0.6)" fontFamily="monospace">RV</text>
                </g>

                {/* Liver — Detailed with hepatic structure */}
                <g>
                  <path
                    d="M155 232 C148 245 152 265 162 272 C172 278 195 275 200 268 C200 252 185 238 165 232 Z"
                    fill="rgba(16, 185, 129, 0.2)"
                    stroke="#10B981"
                    strokeWidth="1.5"
                  />
                  {/* Hepatic lobe division */}
                  <path d="M175 245 L185 265" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="0.7" fill="none" />
                  {/* Portal vein */}
                  <path d="M170 255 L162 248 M170 255 L165 265" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="0.6" fill="none" />
                </g>

                {/* Pancreas — Curved with duct */}
                <path
                  d="M185 258 Q200 250 225 256 Q235 262 230 268 Q210 275 185 265 Z"
                  fill="rgba(245, 158, 11, 0.2)"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                />
                {/* Pancreatic duct */}
                <path d="M192 262 L218 260" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="0.7" fill="none" />

                {/* Kidneys — Detailed with renal cortex */}
                <g>
                  {/* Left Kidney */}
                  <ellipse cx="175" cy="292" rx="12" ry="18" fill="rgba(99, 102, 241, 0.2)" stroke="#818CF8" strokeWidth="1.5" />
                  {/* Renal cortex */}
                  <ellipse cx="175" cy="292" rx="7" ry="12" fill="none" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="0.7" />
                  {/* Renal pelvis */}
                  <path d="M175 282 L175 302" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="0.7" />
                  {/* Adrenal gland */}
                  <ellipse cx="175" cy="276" rx="6" ry="3" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="0.5" />

                  {/* Right Kidney */}
                  <ellipse cx="225" cy="292" rx="12" ry="18" fill="rgba(99, 102, 241, 0.2)" stroke="#818CF8" strokeWidth="1.5" />
                  <ellipse cx="225" cy="292" rx="7" ry="12" fill="none" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="0.7" />
                  <path d="M225 282 L225 302" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="0.7" />
                  <ellipse cx="225" cy="276" rx="6" ry="3" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="0.5" />

                  {/* Ureters connecting kidneys to bladder */}
                  <path d="M175 310 C178 340 185 370 195 395" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="0.7" fill="none" />
                  <path d="M225 310 C222 340 215 370 205 395" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="0.7" fill="none" />
                  {/* Bladder */}
                  <ellipse cx="200" cy="400" rx="10" ry="8" fill="rgba(99, 102, 241, 0.1)" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="0.7" />
                </g>

                {/* ══════════════════════════════════════════════ */}
                {/* LAYER 5: Dynamic Vascular Network — Blood Flow */}
                {/* ══════════════════════════════════════════════ */}
                <g>
                  {/* Arterial system (red) — branching tree with flow animation */}
                  <g>
                    {/* Aorta descending */}
                    <path
                      d="M200 195 L200 320"
                      stroke="url(#arterialGrad)"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      style={{ animation: 'vascularFlow 2s linear infinite' }}
                    />
                    {/* Carotid arteries (neck to head) */}
                    <path d="M200 150 L188 115 M200 150 L212 115" stroke="url(#arterialGrad)" strokeWidth="1.2" strokeDasharray="4 4" style={{ animation: 'vascularFlow 1.8s linear infinite' }} />
                    {/* Subclavian / Brachial (arms) */}
                    <path d="M200 155 L148 175 L120 240 L95 340 M200 155 L252 175 L280 240 L305 340" stroke="url(#arterialGrad)" strokeWidth="1" strokeDasharray="4 5" style={{ animation: 'vascularFlow 2.2s linear infinite' }} fill="none" />
                    {/* Iliac / Femoral (legs) */}
                    <path d="M200 320 L175 370 L168 440 L162 530 M200 320 L225 370 L232 440 L238 530" stroke="url(#arterialGrad)" strokeWidth="1" strokeDasharray="4 5" style={{ animation: 'vascularFlow 2.5s linear infinite' }} fill="none" />
                  </g>

                  {/* Venous system (blue) — parallel return paths */}
                  <g>
                    <path d="M196 200 L196 320" stroke="url(#venousGrad)" strokeWidth="1.5" strokeDasharray="5 5" style={{ animation: 'vascularFlow 2.3s linear infinite reverse' }} />
                    <path d="M196 155 L145 178 L117 244 L92 345 M204 155 L255 178 L283 244 L308 345" stroke="url(#venousGrad)" strokeWidth="0.8" strokeDasharray="4 6" style={{ animation: 'vascularFlow 2.6s linear infinite reverse' }} fill="none" />
                    <path d="M196 320 L172 372 L165 442 L159 532 M204 320 L228 372 L235 442 L241 532" stroke="url(#venousGrad)" strokeWidth="0.8" strokeDasharray="4 6" style={{ animation: 'vascularFlow 2.8s linear infinite reverse' }} fill="none" />
                  </g>
                </g>
              </g>

              {/* ══════════════════════════════════════════════ */}
              {/* Enhanced Volumetric Laser Scanline */}
              {/* ══════════════════════════════════════════════ */}
              {scanActive && (
                <g className="animate-[hologramScan_3s_ease-in-out_infinite]">
                  {/* Main scan beam */}
                  <line x1="60" y1="0" x2="340" y2="0" stroke="#22D3EE" strokeWidth="2.5" opacity="0.95" />
                  {/* Volumetric glow band */}
                  <rect x="60" y="-20" width="280" height="40" fill="url(#scanBeamGrad)" opacity="0.7" />
                  {/* Particle dust dots along scan line */}
                  {[80, 120, 160, 200, 240, 280, 320].map((px, i) => (
                    <circle
                      key={`particle-${i}`}
                      cx={px}
                      cy={Math.sin(px * 0.1) * 8}
                      r={1 + Math.random()}
                      fill="#22D3EE"
                      opacity={0.4 + Math.random() * 0.4}
                    />
                  ))}
                </g>
              )}

              {/* ══════════════════════════════════════════════ */}
              {/* LAYER 6: Multi-Ring Targeting Reticle Hotspots */}
              {/* ══════════════════════════════════════════════ */}
              {ORGAN_HOTSPOTS.map((hotspot) => {
                const organScore = overview.organSystems[hotspot.key];
                const colorConfig = getStatusColor(organScore?.status || 'optimal');
                const isSelected = selectedOrgan?.key === hotspot.key;

                return (
                  <g
                    key={hotspot.key}
                    onClick={() => setSelectedOrgan(organScore)}
                    className="cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect ${organScore?.displayName || hotspot.label}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedOrgan(organScore);
                      }
                    }}
                  >
                    {/* Outer targeting reticle ring (rotating) */}
                    <circle
                      cx={hotspot.cx}
                      cy={hotspot.cy}
                      r="20"
                      fill="none"
                      stroke={colorConfig.ring}
                      strokeWidth="1"
                      strokeDasharray="4 8"
                      opacity={isSelected ? 0.9 : 0.4}
                      style={{
                        transformOrigin: `${hotspot.cx}px ${hotspot.cy}px`,
                        animation: isSelected ? 'reticleRotate 3s linear infinite' : 'none',
                      }}
                    />

                    {/* Expanding ping wave */}
                    <circle
                      cx={hotspot.cx}
                      cy={hotspot.cy}
                      r="16"
                      fill={colorConfig.ring}
                      opacity="0.2"
                      className="animate-ping origin-center"
                    />

                    {/* Concentric sensor ring */}
                    <circle
                      cx={hotspot.cx}
                      cy={hotspot.cy}
                      r="12"
                      fill="rgba(2, 6, 23, 0.9)"
                      stroke={colorConfig.ring}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      className="transition-all duration-300 group-hover:scale-125"
                    />

                    {/* Center core with icon-sized glow */}
                    <circle
                      cx={hotspot.cx}
                      cy={hotspot.cy}
                      r="5"
                      fill={colorConfig.ring}
                      opacity="0.9"
                    />

                    {/* Crosshair ticks */}
                    <line x1={hotspot.cx - 16} y1={hotspot.cy} x2={hotspot.cx - 13} y2={hotspot.cy} stroke={colorConfig.ring} strokeWidth="1.5" opacity="0.7" />
                    <line x1={hotspot.cx + 13} y1={hotspot.cy} x2={hotspot.cx + 16} y2={hotspot.cy} stroke={colorConfig.ring} strokeWidth="1.5" opacity="0.7" />
                    <line x1={hotspot.cx} y1={hotspot.cy - 16} x2={hotspot.cx} y2={hotspot.cy - 13} stroke={colorConfig.ring} strokeWidth="1.5" opacity="0.7" />
                    <line x1={hotspot.cx} y1={hotspot.cy + 13} x2={hotspot.cx} y2={hotspot.cy + 16} stroke={colorConfig.ring} strokeWidth="1.5" opacity="0.7" />

                    {/* Callout leader line */}
                    <line
                      x1={hotspot.anchorSide === 'right' ? hotspot.cx + 14 : hotspot.cx - 14}
                      y1={hotspot.cy}
                      x2={hotspot.anchorSide === 'right' ? hotspot.cx + 22 : hotspot.cx - 22}
                      y2={hotspot.cy}
                      stroke={colorConfig.ring}
                      strokeWidth="1"
                      opacity="0.5"
                    />

                    {/* Floating HUD Label Pill */}
                    <g
                      transform={`translate(${hotspot.anchorSide === 'right' ? hotspot.cx + 22 : hotspot.cx - 108}, ${
                        hotspot.cy - 12
                      })`}
                      className="opacity-90 group-hover:opacity-100 transition-opacity"
                    >
                      <rect
                        width="88"
                        height="24"
                        rx="8"
                        fill="rgba(2, 6, 23, 0.95)"
                        stroke={colorConfig.ring}
                        strokeWidth="1.2"
                      />
                      <text
                        x="44"
                        y="16"
                        textAnchor="middle"
                        fill="#F8FAFC"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {hotspot.label} {organScore?.score}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Live Biometrics Cyber HUD (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
            <span>Continuous Physiological Telemetry</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          {/* Metric 1: Dynamic Pulse Rate ECG Waveform */}
          <div className="cyber-hud-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" style={{ animation: `cardiacPulse ${cardiacDuration}s ease-in-out infinite` }} />
                <span className="text-xs font-bold text-white">Cardio ECG Waveform</span>
              </div>
              <span className="font-mono text-base font-black text-rose-300">{heartRate} bpm</span>
            </div>
            {/* SVG Animated Dynamic ECG Wave */}
            <div className="w-full h-14 bg-slate-900/80 rounded-xl overflow-hidden relative flex items-center px-2 border border-rose-500/20">
              <svg className="w-full h-12 stroke-rose-400 fill-none stroke-[2]" viewBox="0 0 300 40">
                <path
                  d="M0 20 L40 20 L50 12 L60 28 L70 20 L90 20 L98 5 L106 35 L114 20 L130 20 L140 14 L150 20 L190 20 L198 5 L206 35 L214 20 L230 20 L240 14 L250 20 L300 20"
                  strokeDasharray="600"
                  strokeDashoffset="0"
                  className="animate-[ecgDash_2.5s_linear_infinite]"
                />
              </svg>
              <div className="absolute right-2 bottom-1 text-[9px] font-mono text-slate-400">
                Normal Sinus Rhythm
              </div>
            </div>
          </div>

          {/* Metric 2 & 3: SpO2 Circular Gauge & Blood Pressure Concentric Rings */}
          <div className="grid grid-cols-2 gap-3">
            {/* SpO2 Circular Gauge */}
            <div className="cyber-hud-card flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2">
                <span>SpO2 Oxygen</span>
                <Gauge className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  {/* Background track */}
                  <circle cx="40" cy="40" r={spo2Radius} fill="none" stroke="rgba(51, 65, 85, 0.5)" strokeWidth="5" />
                  {/* Value arc */}
                  <circle
                    cx="40"
                    cy="40"
                    r={spo2Radius}
                    fill="none"
                    stroke="url(#spo2GaugeGrad)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={spo2Circumference}
                    strokeDashoffset={spo2Offset}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="spo2GaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22D3EE" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black font-mono text-cyan-300">{spo2}%</span>
                  <span className={`text-[8px] font-bold ${spo2 >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {spo2 >= 95 ? 'OPTIMAL' : 'WARNING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Blood Pressure Concentric Rings */}
            <div className="cyber-hud-card flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2">
                <span>Blood Pressure</span>
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  {/* Systolic track */}
                  <circle cx="40" cy="40" r={bpRadius} fill="none" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="4" />
                  <circle cx="40" cy="40" r={bpRadius} fill="none" stroke="#818CF8" strokeWidth="4" strokeLinecap="round" strokeDasharray={bpCircumference} strokeDashoffset={sbpOffset} className="transition-all duration-1000" />
                  {/* Diastolic track (inner) */}
                  <circle cx="40" cy="40" r={bpRadius - 8} fill="none" stroke="rgba(51, 65, 85, 0.3)" strokeWidth="3" />
                  <circle cx="40" cy="40" r={bpRadius - 8} fill="none" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * (bpRadius - 8)} strokeDashoffset={2 * Math.PI * (bpRadius - 8) - (2 * Math.PI * (bpRadius - 8) * dbpNormalized) / 100} className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black font-mono text-indigo-300">{sbp}/{dbp}</span>
                  <span className="text-[8px] text-emerald-400 font-bold">MAP {mapValue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric 4 & 5: Body Temperature & Breathing Rate */}
          <div className="grid grid-cols-2 gap-3">
            {/* Body Temperature */}
            <div className="cyber-hud-card">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>Body Temp</span>
                <Thermometer className="w-4 h-4 text-amber-400" />
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-amber-300">{bodyTempF}°F</span>
                <span className="text-[10px] text-slate-400 font-mono">({bodyTempC}°C)</span>
              </div>
              {/* Mini temperature bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 h-full rounded-full" style={{ width: '36%' }} />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Afebrile · Homeostatic</div>
            </div>

            {/* Breathing Rate */}
            <div className="cyber-hud-card">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>Breathing Rate</span>
                <Wind className="w-4 h-4 text-teal-400" style={{ animation: `pulmonaryBreathing ${breathDuration}s ease-in-out infinite` }} />
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-teal-300">{breathingRate}</span>
                <span className="text-[10px] text-slate-400">/min</span>
              </div>
              {/* Mini breathing wave */}
              <svg className="w-full h-4" viewBox="0 0 100 16">
                <path
                  d="M0 8 Q12 2 25 8 Q38 14 50 8 Q62 2 75 8 Q88 14 100 8"
                  stroke="#2DD4BF"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.6"
                />
              </svg>
              <div className="text-[10px] text-teal-400 mt-0.5">Eupnea · Regular</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Organ Quick Selector Deck */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 relative z-10 pt-2">
        {ORGAN_HOTSPOTS.map((hotspot) => {
          const organScore = overview.organSystems[hotspot.key];
          const colorConfig = getStatusColor(organScore?.status || 'optimal');
          const Icon = hotspot.icon;

          return (
            <button
              key={hotspot.key}
              onClick={() => setSelectedOrgan(organScore)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 hover:-translate-y-1 min-h-[96px] ${
                selectedOrgan?.key === hotspot.key
                  ? 'bg-slate-900 border-cyan-400 glow-cyan-3d shadow-xl'
                  : 'bg-slate-950/90 border-white/10 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${colorConfig.text}`} />
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${colorConfig.bg} ${colorConfig.text}`}>
                  {organScore?.score}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-white truncate">{hotspot.label}</div>
                <div className="text-[10px] text-slate-400 capitalize">{organScore?.status}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Organ Hotspot Inspection Modal */}
      <AnimatePresence>
        {selectedOrgan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="organ-dialog-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-gradient-to-b from-[#0F2647] via-[#0A192F] to-[#071325] border border-cyan-500/30 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl border ${getStatusColor(selectedOrgan.status).border} ${getStatusColor(selectedOrgan.status).bg}`}>
                    <Activity className={`w-6 h-6 ${getStatusColor(selectedOrgan.status).text}`} />
                  </div>
                  <div>
                    <h3 id="organ-dialog-title" className="text-lg font-bold text-white">
                      {selectedOrgan.displayName}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(selectedOrgan.status).badge}`}>
                        {selectedOrgan.status} Status
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrgan(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  aria-label="Close Organ Inspection"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Score Indicator */}
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Physiological Health Score</div>
                  <div className="text-xs text-slate-300 font-light mt-0.5">Calculated from weighted active lab panels</div>
                </div>
                <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-mono font-black text-xl ${getStatusColor(selectedOrgan.status).text} ${getStatusColor(selectedOrgan.status).border} ${getStatusColor(selectedOrgan.status).bg}`}>
                  {selectedOrgan.score}
                </div>
              </div>

              {/* Primary Biomarkers */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  Contributing Biomarkers
                </h4>
                <div className="space-y-2">
                  {selectedOrgan.primaryBiomarkers.map((bm, i) => (
                    <div
                      key={i}
                      className="bg-slate-950/90 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-slate-200">{bm.name}</span>
                      <span className="font-mono font-bold text-cyan-300">{bm.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Summary */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Clinical Assessment</div>
                <p className="text-xs text-slate-200 leading-relaxed font-light">{selectedOrgan.summary}</p>
              </div>

              {/* Recommended Specialist Referral & 1-Click CTA */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Clinical Specialist Guidance</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  {selectedOrgan.recommendedSpecialist}
                </p>
                <button
                  onClick={() => {
                    const organKey = selectedOrgan.key;
                    setSelectedOrgan(null);
                    if (onSelectSpecialist) {
                      onSelectSpecialist(organKey);
                    } else {
                      window.location.hash = 'specialists';
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Consult AI Specialist Lounge</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HolographicBodyScanner;
