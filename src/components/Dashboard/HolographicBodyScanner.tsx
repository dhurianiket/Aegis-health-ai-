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

      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-indigo-500/25 text-cyan-300 border border-cyan-500/40 glow-cyan-3d shrink-0">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                3D Holographic Anatomical Body Scanner
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
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-slate-200 hover:text-white text-xs font-bold transition-all min-h-[44px] flex items-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{viewMode === '3d-mesh' ? 'Vector HUD' : '3D Anatomical Render'}</span>
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
          className="lg:col-span-7 flex flex-col items-center justify-center p-4 bg-slate-950/90 rounded-3xl border border-cyan-500/30 relative overflow-hidden min-h-[520px] shadow-[0_0_40px_rgba(6,182,212,0.15)]"
          style={{ perspective: 1000 }}
        >
          {/* Spatial Holographic Floor Base Grid & Concentric Glowing Rings */}
          <div className="absolute bottom-4 inset-x-8 h-40 flex items-center justify-center pointer-events-none">
            <div
              className="w-full h-full opacity-40"
              style={{
                transform: 'perspective(400px) rotateX(65deg)',
                backgroundImage:
                  'radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.4), transparent 70%), linear-gradient(to right, rgba(45, 212, 191, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(45, 212, 191, 0.3) 1px, transparent 1px)',
                backgroundSize: '100% 100%, 20px 20px, 20px 20px',
              }}
            />
            {/* Concentric Base Circles */}
            <div className="absolute bottom-2 w-72 h-24 rounded-full border-2 border-cyan-400/60 shadow-[0_0_30px_rgba(34,211,238,0.5)] transform rotateX-65 pointer-events-none" />
            <div className="absolute bottom-4 w-52 h-16 rounded-full border border-teal-300/40 transform rotateX-65 pointer-events-none" />
          </div>

          {/* 3D Transformable Stage */}
          <div
            className="relative w-full max-w-[380px] h-[500px] transition-transform duration-200 ease-out flex items-center justify-center"
            style={{
              transform: `rotateX(${mouseRotation.rx}deg) rotateY(${mouseRotation.ry}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* SVG High-Fidelity Translucent Anatomical Body Model */}
            <svg
              viewBox="0 0 400 600"
              className="w-full h-full drop-shadow-[0_0_30px_rgba(45,212,191,0.35)] select-none relative z-10"
            >
              <defs>
                <linearGradient id="bodyHoloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="0.85" />
                </linearGradient>

                <linearGradient id="organGlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
                </linearGradient>

                <linearGradient id="scanBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>

                <filter id="hologramGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Spatial Depth Coordinate Rings */}
              <ellipse cx="200" cy="115" rx="55" ry="12" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
              <ellipse cx="200" cy="210" rx="90" ry="18" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
              <ellipse cx="200" cy="310" rx="75" ry="15" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
              <ellipse cx="200" cy="450" rx="60" ry="12" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="3 3" />

              {/* High-Fidelity Anatomical Body Contours & Internal Organs */}
              <g filter="url(#hologramGlow)">
                {/* Translucent Body Silhouette Mesh */}
                <path
                  d="M200 25 C175 25 162 45 162 70 C162 95 174 110 185 116 L185 130 C155 134 125 145 110 160 C98 172 90 220 82 280 C76 325 72 370 70 395 C68 405 78 408 82 400 C90 380 98 340 106 290 L118 280 L130 330 C138 370 148 430 152 480 C156 525 158 565 155 580 C154 585 168 588 172 580 C178 560 182 500 185 450 L195 380 L205 380 L215 450 C218 500 222 560 228 580 C232 588 246 585 245 580 C242 565 244 525 248 480 C252 430 262 370 270 330 L282 280 L294 290 C302 340 310 380 318 400 C322 408 332 405 330 395 C328 370 324 325 318 280 C310 220 302 172 290 160 C275 145 245 134 215 130 L215 116 C226 110 238 95 238 70 C238 45 225 25 200 25 Z"
                  fill="rgba(34, 211, 238, 0.08)"
                  stroke="url(#bodyHoloGrad)"
                  strokeWidth="2"
                />

                {/* Skull & Brain Hemisphere Outline */}
                <ellipse cx="200" cy="65" rx="24" ry="30" fill="rgba(56, 189, 248, 0.12)" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
                <path d="M200 40 L200 90 M182 65 Q200 55 218 65" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" fill="none" />

                {/* Vertebral Column (Spine) */}
                <path d="M200 115 L200 360" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="4 2" />

                {/* Ribcage Structure */}
                <path d="M170 160 Q200 145 230 160 M164 178 Q200 162 236 178 M160 196 Q200 180 240 196 M162 214 Q200 198 238 214 M168 232 Q200 216 232 232 M176 248 Q200 235 224 248" stroke="rgba(45, 212, 191, 0.45)" strokeWidth="1.5" fill="none" />

                {/* Translucent Internal Organ Contours */}
                {/* Lungs */}
                <path d="M165 160 C155 180 155 220 178 225 C185 225 188 200 185 160 Z" fill="rgba(34, 211, 238, 0.2)" stroke="#22D3EE" strokeWidth="1.5" />
                <path d="M235 160 C245 180 245 220 222 225 C215 225 212 200 215 160 Z" fill="rgba(34, 211, 238, 0.2)" stroke="#22D3EE" strokeWidth="1.5" />

                {/* Heart Contour */}
                <path d="M200 185 C190 175 180 190 195 210 C205 220 215 200 205 185 Z" fill="rgba(244, 63, 94, 0.35)" stroke="#F43F5E" strokeWidth="2" />

                {/* Liver Contour */}
                <path d="M160 235 C155 250 165 270 195 265 C195 245 180 235 160 235 Z" fill="rgba(16, 185, 129, 0.3)" stroke="#10B981" strokeWidth="1.5" />

                {/* Pancreas Contour */}
                <path d="M190 260 Q215 255 230 265 Q210 275 190 260 Z" fill="rgba(245, 158, 11, 0.35)" stroke="#F59E0B" strokeWidth="1.5" />

                {/* Kidneys */}
                <ellipse cx="178" cy="295" rx="10" ry="16" fill="rgba(99, 102, 241, 0.35)" stroke="#818CF8" strokeWidth="1.5" />
                <ellipse cx="222" cy="295" rx="10" ry="16" fill="rgba(99, 102, 241, 0.35)" stroke="#818CF8" strokeWidth="1.5" />

                {/* Cardiovascular Plexus (Glowing Red & Cyan Artery Lines) */}
                <path d="M200 200 L170 135 M200 200 L230 135 M200 220 L160 570 M200 220 L240 570" stroke="rgba(244, 63, 94, 0.5)" strokeWidth="1.2" fill="none" />
                <path d="M195 205 L165 138 M205 205 L235 138 M195 225 L155 570 M205 225 L245 570" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="1.2" fill="none" />
              </g>

              {/* Animated Vertical Laser Scanline */}
              {scanActive && (
                <g className="animate-[hologramScan_3s_ease-in-out_infinite]">
                  <line x1="40" y1="0" x2="360" y2="0" stroke="#22D3EE" strokeWidth="2.5" opacity="0.95" />
                  <rect x="40" y="-16" width="320" height="32" fill="url(#scanBeamGrad)" />
                </g>
              )}

              {/* 6 Clickable Organ Hotspots */}
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
                    {/* Outer Expanding Ping Wave */}
                    <circle
                      cx={hotspot.cx}
                      cy={hotspot.cy}
                      r="18"
                      fill={colorConfig.ring}
                      opacity="0.3"
                      className="animate-ping origin-center"
                    />

                    {/* Concentric Telemetry Ring */}
                    <circle
                      cx={hotspot.cx}
                      cy={hotspot.cy}
                      r="13"
                      fill="rgba(10, 15, 30, 0.9)"
                      stroke={colorConfig.ring}
                      strokeWidth={isSelected ? '3' : '2'}
                      className="transition-all duration-300 group-hover:scale-125"
                    />

                    {/* Center Core Dot */}
                    <circle
                      cx={hotspot.cx}
                      cy={hotspot.cy}
                      r="5"
                      fill={colorConfig.ring}
                      className="transition-all duration-300 group-hover:r-7"
                    />

                    {/* Hotspot Floating HUD Label Pill */}
                    <g
                      transform={`translate(${hotspot.anchorSide === 'right' ? hotspot.cx + 20 : hotspot.cx - 105}, ${
                        hotspot.cy - 12
                      })`}
                      className="opacity-90 group-hover:opacity-100 transition-opacity"
                    >
                      <rect
                        width="88"
                        height="24"
                        rx="8"
                        fill="rgba(15, 23, 42, 0.95)"
                        stroke={colorConfig.ring}
                        strokeWidth="1.2"
                        className="shadow-lg"
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

        {/* Right: Live Biometrics HUD (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
            <span>Continuous Physiological Telemetry</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          {/* Metric 1: Dynamic Pulse Rate ECG Waveform */}
          <div className="bg-slate-950/90 p-4 rounded-2xl border border-white/15 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Cardio ECG Waveform</span>
              </div>
              <span className="font-mono text-base font-black text-rose-300">{heartRate} bpm</span>
            </div>
            {/* SVG Animated Dynamic ECG Wave */}
            <div className="w-full h-14 bg-slate-900/90 rounded-xl overflow-hidden relative flex items-center px-2 border border-rose-500/20">
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

          {/* Metric 2 & 3: SpO2 Dial & Blood Pressure 3D Ring */}
          <div className="grid grid-cols-2 gap-3">
            {/* SpO2 Dial */}
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-white/15 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>SpO2 Oxygen</span>
                <Gauge className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="my-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-cyan-300">{spo2}%</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${spo2 >= 95 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300'}`}>
                  {spo2 >= 95 ? 'Optimal' : 'Warning'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, spo2))}%` }}
                />
              </div>
            </div>

            {/* Blood Pressure 3D Ring with MAP */}
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-white/15 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>Blood Pressure</span>
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-indigo-300">{sbp}/{dbp}</span>
                <span className="text-[10px] text-slate-400">mmHg</span>
              </div>
              <div className="text-[10px] text-emerald-300 font-bold">
                MAP: {mapValue} mmHg · Normal
              </div>
            </div>
          </div>

          {/* Metric 4 & 5: Body Temperature & Breathing Rate */}
          <div className="grid grid-cols-2 gap-3">
            {/* Body Temperature */}
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-white/15 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>Body Temp</span>
                <Thermometer className="w-4 h-4 text-amber-400" />
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-amber-300">{bodyTempF}°F</span>
                <span className="text-[10px] text-slate-400 font-mono">({bodyTempC}°C)</span>
              </div>
              <div className="text-[10px] text-slate-400">Afebrile · Homeostatic</div>
            </div>

            {/* Breathing Rate */}
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-white/15 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>Breathing Rate</span>
                <Wind className="w-4 h-4 text-teal-400" />
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-teal-300">{breathingRate}</span>
                <span className="text-[10px] text-slate-400">/min</span>
              </div>
              <div className="text-[10px] text-teal-400">Eupnea · Regular</div>
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
