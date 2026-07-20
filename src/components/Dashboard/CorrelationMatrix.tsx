import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Network, Info } from "lucide-react";
import { LabResult } from "../../types/medical";
import { parseSafeTimestamp } from "../../utils/dateUtils";

interface CorrelationMatrixProps {
  labs: LabResult[];
}

export default function CorrelationMatrix({ labs }: CorrelationMatrixProps) {
  // Simple Pearson correlation coefficient calculation
  const calculateCorrelation = (x: number[], y: number[]) => {
    if (x.length !== y.length || x.length === 0) return 0;
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    const sumY2 = y.reduce((a, b) => a + b * b, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    );
    if (denominator === 0) return 0;
    return numerator / denominator;
  };

  const { matrix, markers } = useMemo(() => {
    // 1. Group labs by markerName and date
    // We need pairs of readings on roughly the same date to correlate them
    const byMarkerAndDate: Record<string, Record<string, number>> = {};
    const markerSet = new Set<string>();

    labs.forEach((lab) => {
      const name = lab.markerName
        ? lab.markerName.trim().toUpperCase()
        : "UNKNOWN";
      markerSet.add(name);
      if (!byMarkerAndDate[name]) byMarkerAndDate[name] = {};
      // Group by day safely
      const dateObj = parseSafeTimestamp(lab.date);
      if (dateObj && !isNaN(dateObj.getTime())) {
        const dateStr = dateObj.toISOString().split("T")[0];
        byMarkerAndDate[name][dateStr] = lab.value;
      }
    });

    const topMarkers = Array.from(markerSet).slice(0, 5); // Limit to top 5 for UI simplicity

    // Create correlation matrix
    const correlationMatrix: number[][] = [];

    for (let i = 0; i < topMarkers.length; i++) {
      correlationMatrix[i] = [];
      for (let j = 0; j < topMarkers.length; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1;
        } else {
          // Find dates where both markers have readings
          const m1 = topMarkers[i];
          const m2 = topMarkers[j];
          const dates1 = Object.keys(byMarkerAndDate[m1] || {});

          const x: number[] = [];
          const y: number[] = [];

          dates1.forEach((date) => {
            if (
              byMarkerAndDate[m2] &&
              byMarkerAndDate[m2][date] !== undefined
            ) {
              x.push(byMarkerAndDate[m1][date]);
              y.push(byMarkerAndDate[m2][date]);
            }
          });

          if (x.length > 1) {
            correlationMatrix[i][j] = calculateCorrelation(x, y);
          } else {
            correlationMatrix[i][j] = 0; // Not enough data
          }
        }
      }
    }

    return { matrix: correlationMatrix, markers: topMarkers };
  }, [labs]);

  if (markers.length < 2) {
    return (
      <div className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-[32px] shadow-md dark:shadow-2xl h-[200px] flex flex-col items-center justify-center text-muted text-sm gap-2">
         <Network className="w-6 h-6 opacity-30 text-slate-400" />
         <span>Not enough distinct markers for correlation.</span>
      </div>
    );
  }

  const getColor = (val: number) => {
    if (val > 0.7) return "bg-indigo-500 text-white";
    if (val > 0.3) return "bg-indigo-500/60 text-white";
    if (val > -0.3) return "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-300";
    if (val > -0.7) return "bg-amber-500/60 text-white";
    return "bg-amber-500 text-white";
  };

  return (
    <div className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-[32px] shadow-md dark:shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/20 rounded-xl">
          <Network className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 tracking-tight">
            Biomarker Correlation
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical relationships between labs
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="flex mb-2">
            <div className="w-20"></div>
            {markers.map((m) => (
              <div
                key={m}
                className="w-16 text-center text-[10px] font-bold text-slate-600 dark:text-slate-200 uppercase truncate px-1"
              >
                {m}
              </div>
            ))}
          </div>

          {markers.map((m1, i) => (
            <div key={m1} className="flex mb-2 items-center">
              <div className="w-20 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase truncate pr-2 text-right">
                {m1}
              </div>
              {markers.map((m2, j) => (
                <div
                  key={`${m1}-${m2}`}
                  className="w-16 flex justify-center px-1"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: (i * markers.length + j) * 0.05 }}
                    className={`w-full h-8 rounded flex items-center justify-center text-[10px] font-medium ${getColor(matrix[i][j])}`}
                    title={`${m1} vs ${m2}: ${matrix[i][j].toFixed(2)}`}
                  >
                    {matrix[i][j] !== 0 ? matrix[i][j].toFixed(1) : "-"}
                  </motion.div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 bg-slate-100 dark:bg-slate-900/40 p-3 rounded-xl border border-black/5 dark:border-white/5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Values near <span className="text-indigo-400 font-bold">1.0</span>{" "}
          indicate markers rise together. Values near{" "}
          <span className="text-amber-400 font-bold">-1.0</span> indicate an
          inverse relationship.
        </p>
      </div>
    </div>
  );
}
