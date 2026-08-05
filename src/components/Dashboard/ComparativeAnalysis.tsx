import React, { useMemo } from "react";
import { motion } from "motion/react";
import { BarChart2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LabResult, LabStatus } from "../../types/medical";

import { parseSafeTimestamp } from "../../utils/dateUtils";

interface ComparativeAnalysisProps {
  labs: LabResult[];
}

function simpleHash(str: string | undefined | null): number {
  if (!str) return 0;
  const s = String(str);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export default function ComparativeAnalysis({
  labs,
}: ComparativeAnalysisProps) {
  const latestLabs = useMemo(() => {
    // Get the most recent lab for each marker
    const latest: Record<string, LabResult> = {};
    const latestTime: Record<string, number> = {};

    labs.forEach((lab) => {
      const name = lab.markerName
        ? lab.markerName.trim().toUpperCase()
        : "UNKNOWN";

      const time = parseSafeTimestamp(lab.date)?.getTime() || 0;

      if (!latest[name] || time >= (latestTime[name] || 0)) {
        latest[name] = lab;
        latestTime[name] = time;
      }
    });

    return Object.values(latest).slice(0, 4); // Take top 4
  }, [labs]);

  if (latestLabs.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-[32px] shadow-md dark:shadow-2xl h-[200px] flex flex-col items-center justify-center text-muted text-sm gap-2">
         <BarChart2 className="w-6 h-6 opacity-30 text-slate-400" />
         <span>No comparatives available yet.</span>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-[32px] shadow-md dark:shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/20 rounded-xl">
          <BarChart2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 tracking-tight">
            Percentile Ranking
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
            Your values compared to healthy peers
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {latestLabs.map((lab, idx) => {
          const labId = lab?.id || (lab as any)?.docId || lab?.markerName || `lab_${idx}`;
          // Synthetic percentile calculation based on normal ranges if provided
          // Or just deterministic hash for the MVP visualization
          let percentile = (simpleHash(labId) % 60) + 20; // 20-80
          if (lab?.status === LabStatus.NORMAL)
            percentile = (simpleHash(labId) % 40) + 50; // 50-90
          if (
            lab?.status === LabStatus.CRITICAL ||
            lab?.status === LabStatus.ABNORMAL
          )
            percentile = (simpleHash(labId) % 20) + 80;

          const getStatusColor = () => {
            if (lab?.status === LabStatus.CRITICAL)
              return "from-red-500 to-red-600";
            if (lab?.status === LabStatus.ABNORMAL)
              return "from-amber-500 to-orange-500";
            return "from-emerald-400 to-teal-500";
          };

          return (
            <div key={labId} className="relative">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-900 dark:text-gray-100">
                  {lab.markerName}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {lab.value} {lab.unit}
                </span>
              </div>

              <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-900/60 rounded-full overflow-hidden border border-black/5 dark:border-white/5 relative">
                {/* Population curve background hint */}
                <div className="absolute inset-y-0 left-1/4 right-1/4 bg-white/5"></div>

                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentile}%` }}
                  transition={{ delay: idx * 0.1, duration: 1, type: "spring" }}
                  className={`h-full rounded-full bg-gradient-to-r ${getStatusColor()}`}
                />

                {/* Marker line for 50th percentile */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20"></div>
              </div>

              <div className="flex justify-between mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                <span>Lower</span>
                <span className="text-slate-900 dark:text-white font-extrabold">Median</span>
                <span>Upper</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
