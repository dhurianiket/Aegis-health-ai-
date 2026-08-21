import React, { useState } from 'react';
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
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  calculateOrganSystemScores,
  OrganHealthOverview,
  OrganSystemScore,
  OrganSystemKey,
  LabObservationItem,
} from '../../services/organHealthService';

interface OrganHealthAvatarProps {
  labObservations?: LabObservationItem[];
}

export const OrganHealthAvatar: React.FC<OrganHealthAvatarProps> = ({ labObservations = [] }) => {
  const overview: OrganHealthOverview = calculateOrganSystemScores(labObservations);
  const [selectedOrgan, setSelectedOrgan] = useState<OrganSystemScore | null>(null);

  const getOrganIcon = (key: OrganSystemKey) => {
    switch (key) {
      case 'cardiovascular':
        return Heart;
      case 'pulmonary':
        return Wind;
      case 'metabolic':
        return Zap;
      case 'renal':
        return Droplets;
      case 'hepatic':
        return Activity;
      case 'hematology':
        return Shield;
      default:
        return Activity;
    }
  };

  const getStatusBadge = (status: 'optimal' | 'warning' | 'critical') => {
    if (status === 'critical') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5" /> Critical Shift
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 shrink-0">
          <Activity className="w-3.5 h-3.5" /> Warning Drift
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Health
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score < 65) return 'text-rose-400 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)] bg-rose-500/10';
    if (score < 85) return 'text-amber-400 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/10';
  };

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_16px_40px_-8px_rgba(16,185,129,0.25)] rounded-[32px] p-5 sm:p-7 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">3D Organ System Health Avatar</h3>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
                6 Organ Systems
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light mt-1">
              Anatomical physiological risk mapping driven by active lab panels
            </p>
          </div>
        </div>

        {/* Overall Score Badge */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 bg-slate-950/90 px-4 py-2.5 rounded-2xl border border-white/10">
          <div className="text-left sm:text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Overall Physiology</div>
            <div className="text-xs text-emerald-400 font-bold">
              {overview.optimalCount} Optimal · {overview.warningCount} Warning · {overview.criticalCount} Critical
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-lg shrink-0 ${getScoreColor(
              overview.overallScore
            )}`}
          >
            {overview.overallScore}
          </div>
        </div>
      </div>

      {/* 6 Organ System Responsive Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {Object.values(overview.organSystems).map((organ) => {
          const Icon = getOrganIcon(organ.key);
          const scoreClass = getScoreColor(organ.score);

          return (
            <div
              key={organ.key}
              onClick={() => setSelectedOrgan(organ)}
              className="bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer group flex flex-col justify-between space-y-4 shadow-md min-h-[160px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${scoreClass} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide group-hover:text-emerald-300 transition-colors leading-tight">
                      {organ.displayName}
                    </h4>
                    <div className="mt-1">{getStatusBadge(organ.status)}</div>
                  </div>
                </div>

                <div
                  className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${scoreClass}`}
                >
                  {organ.score}
                </div>
              </div>

              <p className="text-xs text-slate-300 font-light leading-relaxed line-clamp-2">
                {organ.summary}
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform min-h-[36px]">
                <span>View Biomarkers & Guidance</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Dialog for Selected Organ */}
      {selectedOrgan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-[#0F2647] via-[#0A192F] to-[#071325] border border-emerald-500/30 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl border ${getScoreColor(selectedOrgan.score)}`}>
                  {React.createElement(getOrganIcon(selectedOrgan.key), { className: 'w-6 h-6' })}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedOrgan.displayName}</h3>
                  <div className="mt-1">{getStatusBadge(selectedOrgan.status)}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrgan(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Biomarker List */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Primary Organ Biomarkers
              </h4>
              <div className="space-y-2">
                {selectedOrgan.primaryBiomarkers.map((bm, i) => (
                  <div key={i} className="bg-slate-950/90 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{bm.name}</span>
                    <span className="font-mono font-bold text-emerald-400">{bm.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Specialist */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Recommended Specialist Consultation</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                {selectedOrgan.recommendedSpecialist}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
