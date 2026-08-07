import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "motion/react";
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
  const isCriticalByRef = (refLow !== undefined && value < refLow) || (refHigh !== undefined && value > refHigh);
  const isCriticalByStatus = status === 'high' || status === 'low' || status === 'critical' || status === 'abnormal';
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

  return (
    <div className="flex flex-col gap-2 p-5 bg-white dark:bg-[#121214] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm transition-all hover:border-teal-500/30">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">{label}</h3>

      <div className="flex items-baseline gap-2">
        <motion.span
          className={`text-3xl font-extrabold tracking-tight tabular-nums ${isCritical ? "text-rose-600 dark:text-rose-400" : "text-teal-600 dark:text-teal-400"}`}
        >
          {displayValue.toFixed(1)}
        </motion.span>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{unit}</span>
      </div>

      {(refLow !== undefined || refHigh !== undefined) && (
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Ref: <span className="font-semibold text-slate-800 dark:text-slate-200">{refLow !== undefined ? refLow : ''}–{refHigh !== undefined ? refHigh : ''}</span>
        </div>
      )}

      {delta !== 0 && (
        <div className="flex items-center gap-1 mt-1 text-xs font-semibold">
          <span
            className={`inline-flex items-center ${isHigher && isCritical ? "text-rose-600 dark:text-rose-400" : !isHigher && isCritical ? "text-rose-600 dark:text-rose-400" : isHigher ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}
          >
            {isHigher ? (
              <ArrowUp size={14} className="mr-0.5" />
            ) : (
              <ArrowDown size={14} className="mr-0.5" />
            )}
            {Math.abs(delta).toFixed(1)}
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            vs {previousValue} ({previousDate})
          </span>
        </div>
      )}
    </div>
  );
};
