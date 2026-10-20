import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowUp, ArrowDown } from "lucide-react";

export interface HeroMetricProps {
  label: string;
  value: number;
  unit: string;
  refLow?: number;
  refHigh?: number;
  status?: string;
  previousValue: number;
  previousDate: string;
}

export const HeroMetric: React.FC<HeroMetricProps> = ({
  label,
  value,
  unit,
  refLow,
  refHigh,
  status,
  previousValue,
  previousDate,
}) => {
  const isCriticalByRef =
    (refLow !== undefined && value < refLow) ||
    (refHigh !== undefined && value > refHigh);
  const isCriticalByStatus =
    status === "high" ||
    status === "low" ||
    status === "critical" ||
    status === "abnormal";
  const isCritical = isCriticalByRef || isCriticalByStatus;
  const delta = value - previousValue;
  const isHigher = delta > 0;

  const [displayValue, setDisplayValue] = useState(previousValue || 0);

  useEffect(() => {
    const start = previousValue ?? 0;
    const end = value;
    const duration = 800;
    const startTime = performance.now();

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplayValue(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, previousValue]);

  // Calculate normalized position along reference range bar
  let rangePercent = 50;
  if (refLow !== undefined && refHigh !== undefined && refHigh > refLow) {
    const span = refHigh - refLow;
    const paddedMin = Math.max(0, refLow - span * 0.25);
    const paddedMax = refHigh + span * 0.25;
    rangePercent = Math.min(
      100,
      Math.max(4, ((value - paddedMin) / (paddedMax - paddedMin)) * 100)
    );
  }

  return (
    <div className="glass-card-3d aegis-spotlight-card bento-card-container p-4 sm:p-5 flex flex-col justify-between gap-2.5 h-full transition-all hover:border-teal-500/40">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 leading-snug">
          {label}
        </h3>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
            isCritical
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/25"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
          }`}
        >
          {isCritical ? status || "Alert" : "Optimal"}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 my-0.5">
        <motion.span
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
            isCritical
              ? "text-rose-600 dark:text-rose-400"
              : "text-teal-600 dark:text-teal-400"
          }`}
        >
          {displayValue.toFixed(1)}
        </motion.span>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {unit}
        </span>
      </div>

      {(refLow !== undefined || refHigh !== undefined) && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-clip relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCritical
                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                  : "bg-gradient-to-r from-teal-500 to-emerald-400"
              }`}
              style={{ width: `${rangePercent}%` }}
            />
          </div>
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Ref:{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              {refLow !== undefined ? refLow : ""}–
              {refHigh !== undefined ? refHigh : ""}
            </span>
          </div>
        </div>
      )}

      {delta !== 0 && (
        <div className="flex items-center gap-1 pt-1 border-t border-[var(--color-border)] text-xs font-semibold">
          <span
            className={`inline-flex items-center tabular-nums ${
              isHigher && isCritical
                ? "text-rose-600 dark:text-rose-400"
                : !isHigher && isCritical
                  ? "text-rose-600 dark:text-rose-400"
                  : isHigher
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isHigher ? (
              <ArrowUp size={13} className="mr-0.5 shrink-0" />
            ) : (
              <ArrowDown size={13} className="mr-0.5 shrink-0" />
            )}
            {Math.abs(delta).toFixed(1)}
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
            vs {previousValue} ({previousDate})
          </span>
        </div>
      )}
    </div>
  );
};
