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
  { key: 'pulmonary', label: 'Lungs', cx: 175, cy: 165, icon: Wind, anchorSide: 'left' },
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
  const [mouseRotation, setMouseRotation] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse move 3D tilt tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rx = -(y / (rect.height / 2)) * 8; // -8deg to +8deg
    const ry = (x / (rect.width / 2)) * 12; // -12deg to +12deg
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
  // MAP = DBP + 1/3(SBP - DBP)
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
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 glow-cyan-3d shrink-0">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Interactive 3D Holographic Anatomical Body Scanner
              </h3>
              <span className="px-3 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider">
                Live Spatial HUD
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light mt-1">
              Depth-calibrated 3D anatomical organ scanning & continuous physiological telemetry
            </p>
          </div>
        </div>

        {/* Action / Laser Scan Switcher Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
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
          className="lg:col-span-7 flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-3xl border border-white/10 relative overflow-hidden min-h-[500px]"
          style={{ perspective: 1000 }}
        >
          {/* Spatial Holographic Floor Grid */}
          <div
            className="absolute bottom-2 inset-x-12 h-36 opacity-35 pointer-events-none"
            style={{
              transform: 'perspective(400px) rotateX(60deg)',
              backgroundImage:
                'linear-gradient(to right, rgba(45, 212, 191, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(45, 212, 191, 0.2) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* 3D Transformable Stage */}
          <div
            className="relative w-full max-w-[360px] h-[480px] transition-transform duration-200 ease-out flex items-center justify-center"
            style={{
              transform: `rotateX(${mouseRotation.rx}deg) rotateY(${mouseRotation.ry}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* SVG Anatomical Humanoid Contour */}
            <svg
              viewBox="0 0 400 600"
              className="w-full h-full drop-shadow-[0_0_25px_rgba(45,212,191,0.25)] select-none"
            >
              <defs>
                <linearGradient id="bodyHoloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="0.75" />
                </linearGradient>

                <linearGradient id="scanBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>

                <filter id="hologramGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Spatial Depth Coordinate Rings */}
              <ellipse cx="200" cy="115" rx="55" ry="12" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
              <ellipse cx="200" cy="210" rx="90" ry="18" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
              <ellipse cx="200" cy="310" rx="75" ry="15" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
              <ellipse cx="200" cy="450" rx="60" ry="12" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" strokeDasharray="3 3" />

              {/* Holographic Wireframe Silhouette */}
              <g filter="url(#hologramGlow)">
                {/* Head & Neck */}
                <ellipse cx="200" cy="70" rx="34" ry="44" fill="rgba(45, 212, 191, 0.08)" stroke="url(#bodyHoloGrad)" strokeWidth="2" />
                <path d="M190 114 L190 135 M210 114 L210 135" stroke="url(#bodyHoloGrad)" strokeWidth="2" fill="none" />

                {/* Torso & Shoulders */}
                <path
                  d="M130 145 C150 138 250 138 270 145 C285 152 280 180 270 230 C260 270 250 310 240 340 L160 340 C150 310 140 270 130 230 C120 180 115 152 130 145 Z"
                  fill="rgba(45, 212, 191, 0.05)"
                  stroke="url(#bodyHoloGrad)"
                  strokeWidth="2"
                />

                {/* Arms */}
                <path d="M130 148 L95 240 L80 340" stroke="url(#bodyHoloGrad)" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M270 148 L305 240 L320 340" stroke="url(#bodyHoloGrad)" strokeWidth="2" fill="none" strokeLinecap="round" />

                {/* Pelvis & Legs */}
                <path d="M160 340 L150 460 L140 570" stroke="url(#bodyHoloGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M240 340 L250 460 L260 570" stroke="url(#bodyHoloGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </g>

              {/* Animated Vertical Laser Scanline */}
              {scanActive && (
                <g className="animate-[hologramScan_3s_ease-in-out_infinite]">
                  <line x1="60" y1="0" x2="340" y2="0" stroke="#22D3EE" strokeWidth="2" opacity="0.9" />
                  <rect x="60" y="-12" width="280" height="24" fill="url(#scanBeamGrad)" />
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
                      r="16"
                      fill={colorConfig.ring}
                      opacity="0.25"
                      className="animate-ping origin-center"
                    />

                    {/* Concentric Telemetry Ring */}
                    <circle
                      cx={hotspot.cx}
                      cy={hotspot.cy}
                      r="12"
                      fill="rgba(10, 15, 30, 0.85)"
                      stroke={colorConfig.ring}
                      strokeWidth={isSelected ? '3' : '1.8'}
                      strokeDasharray="2 2"
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

                    {/* Hotspot Floating HUD Label */}
                    <g
                      transform={`translate(${hotspot.anchorSide === 'right' ? hotspot.cx + 18 : hotspot.cx - 95}, ${
                        hotspot.cy - 10
                      })`}
                      className="opacity-80 group-hover:opacity-100 transition-opacity"
                    >
                      <rect
                        width="80"
                        height="20"
                        rx="6"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke={colorConfig.ring}
                        strokeWidth="1"
                      />
                      <text
                        x="40"
                        y="14"
                        textAnchor="middle"
                        fill="#F8FAFC"
                        fontSize="9"
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
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          {/* Metric 1: Dynamic Pulse Rate ECG Waveform */}
          <div className="bg-slate-950/85 p-4 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Cardio ECG Waveform</span>
              </div>
              <span className="font-mono text-sm font-black text-rose-300">{heartRate} bpm</span>
            </div>
            {/* SVG Animated Dynamic ECG Wave */}
            <div className="w-full h-12 bg-slate-900/90 rounded-xl overflow-hidden relative flex items-center px-2">
              <svg className="w-full h-10 stroke-rose-400 fill-none stroke-[2]" viewBox="0 0 300 40">
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
            <div className="bg-slate-950/85 p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>SpO2 Oxygen</span>
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-cyan-300">{spo2}%</span>
                <span className={`text-[10px] font-bold ${spo2 >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {spo2 >= 95 ? 'Optimal' : 'Warning'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, spo2))}%` }}
                />
              </div>
            </div>

            {/* Blood Pressure 3D Ring with MAP */}
            <div className="bg-slate-950/85 p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>Blood Pressure</span>
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-lg font-black font-mono text-indigo-300">{sbp}/{dbp}</span>
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
            <div className="bg-slate-950/85 p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>Body Temp</span>
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-amber-300">{bodyTempF}°F</span>
                <span className="text-[10px] text-slate-400 font-mono">({bodyTempC}°C)</span>
              </div>
              <div className="text-[10px] text-slate-400">Afebrile · Homeostatic</div>
            </div>

            {/* Breathing Rate */}
            <div className="bg-slate-950/85 p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>Breathing Rate</span>
                <Wind className="w-3.5 h-3.5 text-teal-400" />
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10 pt-2">
        {ORGAN_HOTSPOTS.map((hotspot) => {
          const organScore = overview.organSystems[hotspot.key];
          const colorConfig = getStatusColor(organScore?.status || 'optimal');
          const Icon = hotspot.icon;

          return (
            <button
              key={hotspot.key}
              onClick={() => setSelectedOrgan(organScore)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 hover:-translate-y-1 min-h-[90px] ${
                selectedOrgan?.key === hotspot.key
                  ? 'bg-slate-900 border-cyan-400 glow-cyan-3d'
                  : 'bg-slate-950/80 border-white/10 hover:border-cyan-500/40'
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
