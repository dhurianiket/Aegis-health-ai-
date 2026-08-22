import React from 'react';
import { Activity, Heart, Zap, ShieldCheck, Sparkles, QrCode, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface Hero3DHealthGaugeProps {
  score?: number;
  userName?: string;
  heartRate?: number;
  hrv?: number;
  spo2?: number;
  onOpenScanShare?: () => void;
  onOpenSbar?: () => void;
}

export const Hero3DHealthGauge: React.FC<Hero3DHealthGaugeProps> = ({
  score = 85,
  userName = 'Aniket Dhuri',
  heartRate = 68,
  hrv = 55,
  spo2 = 98,
  onOpenScanShare,
  onOpenSbar,
}) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-teal-500/30 shadow-[0_20px_50px_-12px_rgba(45,212,191,0.25)] rounded-[32px] p-6 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Ambient Radial Lighting Glow */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left Info Column */}
        <div className="space-y-4 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>NHA ABDM & Clinical AI Suite Active</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-teal-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">{userName}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
              Real-time physiological telemetry, 3D organ risk mapping, and SNOMED CT / LOINC standardized clinical insights.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            {onOpenScanShare && (
              <button
                onClick={onOpenScanShare}
                className="px-4 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors min-h-[44px]"
              >
                <QrCode className="w-4 h-4 text-teal-400" /> OPD Check-In QR
              </button>
            )}

            {onOpenSbar && (
              <button
                onClick={onOpenSbar}
                className="px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors min-h-[44px]"
              >
                <FileText className="w-4 h-4 text-indigo-400" /> Clinical SBAR & OPD PDF
              </button>
            )}
          </div>
        </div>

        {/* Right 3D Gauge & Biometrics Strip */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/80 p-5 sm:p-6 rounded-2xl border border-white/10 w-full lg:w-auto">
          {/* SVG 3D Animated Ring Gauge */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background Track */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="#1E293B"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Glowing Ring */}
              <motion.circle
                cx="72"
                cy="72"
                r={radius}
                stroke="url(#tealGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2DD4BF" />
                  <stop offset="50%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Score Center Text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-white font-mono tracking-tight">{score}</span>
              <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">Health Index</span>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto text-xs">
            <div className="bg-slate-900/90 border border-white/10 p-3 rounded-xl flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Heart Rate</div>
                <div className="font-mono font-bold text-white text-sm">{heartRate} <span className="text-[10px] text-slate-400">bpm</span></div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-white/10 p-3 rounded-xl flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">HRV Index</div>
                <div className="font-mono font-bold text-white text-sm">{hrv} <span className="text-[10px] text-slate-400">ms</span></div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-white/10 p-3 rounded-xl flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">SpO2 Oxygen</div>
                <div className="font-mono font-bold text-white text-sm">{spo2}%</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-white/10 p-3 rounded-xl flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Physiology</div>
                <div className="font-mono font-bold text-emerald-300 text-xs">Optimal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
