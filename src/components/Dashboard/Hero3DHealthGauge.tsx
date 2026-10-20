import React, { useMemo } from 'react';
import { Activity, Heart, Zap, ShieldCheck, Sparkles, QrCode, FileText, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { SpotlightCard } from '../ui/SpotlightCard';
import { ProceduralAvatar } from '../Avatars/ProceduralAvatar';
import { resolveProfileAvatar, PaediatricAvatarConfig } from '../../data/avatars/avatarPresets';

interface Hero3DHealthGaugeProps {
  score?: number;
  userName?: string;
  avatarConfig?: PaediatricAvatarConfig;
  heartRate?: number;
  hrv?: number;
  spo2?: number;
  onOpenScanShare?: () => void;
  onOpenSbar?: () => void;
  onUploadClick?: () => void;
}

export const Hero3DHealthGauge: React.FC<Hero3DHealthGaugeProps> = ({
  score = 85,
  userName = 'Aniket Dhuri',
  avatarConfig,
  heartRate,
  hrv,
  spo2,
  onOpenScanShare,
  onOpenSbar,
  onUploadClick,
}) => {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  const avatarDefinition = useMemo(
    () => resolveProfileAvatar(avatarConfig),
    [avatarConfig]
  );

  // 24 hairline precision radial ticks inspired by Apple Watch Ultra & hairline isometric rules
  const radialTicks = useMemo(() => {
    return Array.from({ length: 24 }, (_, idx) => {
      const angle = (idx * 360) / 24;
      const rad = ((angle - 90) * Math.PI) / 180;
      const innerR = idx % 3 === 0 ? 66 : 68;
      const outerR = 71;
      return {
        x1: 76 + innerR * Math.cos(rad),
        y1: 76 + innerR * Math.sin(rad),
        x2: 76 + outerR * Math.cos(rad),
        y2: 76 + outerR * Math.sin(rad),
        major: idx % 3 === 0,
      };
    });
  }, []);

  return (
    <SpotlightCard
      accentColor="teal"
      spotlightColor="rgba(45, 212, 191, 0.18)"
      className="w-full !bg-gradient-to-br from-white via-slate-50/98 to-teal-50/40 dark:from-slate-900 dark:via-slate-900/98 dark:to-slate-950 !border-teal-500/30 shadow-[0_20px_50px_-15px_rgba(13,148,136,0.14)] dark:shadow-[0_24px_60px_-15px_rgba(13,148,136,0.28)] rounded-[28px] p-5 sm:p-7 lg:p-8 relative"
    >
      {/* Ambient Radial Lighting & Hairline Isometric Vector Mesh */}
      <div className="absolute -right-24 -top-24 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="aegis-hairline-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="#2DD4BF"
              strokeWidth="0.75"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#aegis-hairline-grid)" />
      </svg>

      <div className="relative z-10 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 lg:gap-8">
        {/* Left Identity & Clinical Context Column */}
        <div className="space-y-4 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-800 dark:text-teal-300 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>NHA ABDM &amp; Clinical AI Suite Active</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-300/70 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>FHIR R4 / LOINC Synchronized</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-teal-500/30 p-1 shadow-sm shrink-0 hidden sm:flex items-center justify-center">
              <ProceduralAvatar
                definition={avatarDefinition}
                expression={avatarConfig?.expression || 'happy'}
                size={54}
              />
            </div>
            <div className="space-y-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-teal-700 via-sky-700 to-indigo-700 dark:from-teal-300 dark:via-sky-300 dark:to-indigo-300 bg-clip-text text-transparent">
                  {userName}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-normal leading-relaxed max-w-2xl">
                Real-time physiological telemetry, 3D organ risk mapping, and SNOMED CT / LOINC standardized clinical insights.
              </p>
            </div>
          </div>

          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {onOpenScanShare && (
              <button
                onClick={onOpenScanShare}
                className="px-3.5 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/35 text-teal-900 dark:text-teal-200 text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all min-h-[40px] shadow-xs whitespace-nowrap"
              >
                <QrCode className="w-4 h-4 text-teal-700 dark:text-teal-300 shrink-0" />
                <span>OPD Check-In QR</span>
              </button>
            )}

            {onOpenSbar && (
              <button
                onClick={onOpenSbar}
                className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/35 text-indigo-900 dark:text-indigo-200 text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all min-h-[40px] shadow-xs whitespace-nowrap"
              >
                <FileText className="w-4 h-4 text-indigo-700 dark:text-indigo-300 shrink-0" />
                <span>Clinical SBAR &amp; OPD PDF</span>
              </button>
            )}

            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="px-3.5 py-2 rounded-xl bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/8 dark:hover:bg-white/14 border border-slate-300/80 dark:border-white/15 text-slate-800 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all min-h-[40px] whitespace-nowrap"
              >
                <Upload className="w-4 h-4 text-sky-700 dark:text-sky-300 shrink-0" />
                <span>Ingest Lab PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Right 3D Biometric Gauge & Telemetry Bento Strip */}
        <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-100/90 dark:bg-slate-950/85 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/12 shadow-inner w-full xl:w-auto shrink-0">
          {/* SVG Precision Multi-Ring Gauge */}
          <div className="relative w-[152px] h-[152px] flex items-center justify-center shrink-0">
            <svg className="w-full h-full" viewBox="0 0 152 152">
              <defs>
                <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0D9488" />
                  <stop offset="50%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
              </defs>

              {/* Outer Hairline Chrono Ticks */}
              {radialTicks.map((t, i) => (
                <line
                  key={i}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.major ? 'rgba(13, 148, 136, 0.55)' : 'rgba(100, 116, 139, 0.3)'}
                  strokeWidth={t.major ? '1.5' : '0.75'}
                  strokeLinecap="round"
                />
              ))}

              {/* Background Track */}
              <circle
                cx="76"
                cy="76"
                r={radius}
                stroke="rgba(148, 163, 184, 0.25)"
                strokeWidth="10"
                fill="transparent"
              />

              {/* Animated Glowing Ring */}
              <motion.circle
                cx="76"
                cy="76"
                r={radius}
                stroke="url(#tealGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                fill="transparent"
                transform="rotate(-90 76 76)"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>

            {/* Score Center Readout */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight tabular-nums">
                {score}
              </span>
              <span className="text-[10px] text-teal-800 dark:text-teal-300 font-bold uppercase tracking-widest mt-0.5">
                Composite
              </span>
            </div>
          </div>

          {/* 2x2 Biometric Telemetry Sub-Grid */}
          <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto text-xs">
            <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 px-3.5 py-3 rounded-xl flex items-center gap-2.5 min-w-[132px]">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">Heart Rate</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                  {typeof heartRate === 'number' && heartRate > 0 ? (
                    <>
                      {heartRate} <span className="text-[10px] text-slate-600 dark:text-slate-400">bpm</span>
                    </>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400">
                      -- <span className="text-[9px] font-normal">bpm</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 px-3.5 py-3 rounded-xl flex items-center gap-2.5 min-w-[132px]">
              <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/25 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">HRV Index</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                  {typeof hrv === 'number' && hrv > 0 ? (
                    <>
                      {hrv} <span className="text-[10px] text-slate-600 dark:text-slate-400">ms</span>
                    </>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400">
                      -- <span className="text-[9px] font-normal">ms</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 px-3.5 py-3 rounded-xl flex items-center gap-2.5 min-w-[132px]">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">SpO2 Oxygen</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                  {typeof spo2 === 'number' && spo2 > 0 ? (
                    `${spo2}%`
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400">--%</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 px-3.5 py-3 rounded-xl flex items-center gap-2.5 min-w-[132px]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">Physiology</div>
                <div className="font-mono font-bold text-xs">
                  {typeof heartRate === 'number' && heartRate > 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-300">Optimal</span>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400">Standby</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
};
