import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "motion/react";
import { ArrowUp, ArrowDown } from "lucide-react";

export interface HeroMetricProps {
  label: string;
  value: number;
  unit: string;
  refLow: number;
  refHigh: number;
  previousValue: number;
  previousDate: string;
}

export const HeroMetric: React.FC<HeroMetricProps> = ({
  label,
  value,
  unit,
  refLow,
  refHigh,
  previousValue,
  previousDate,
}) => {
  const isCritical = value < refLow || value > refHigh;
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
    <div className="flex flex-col gap-2 p-6">
      <h3 className="label-caps">{label}</h3>

      <div className="flex items-baseline gap-2">
        <motion.span
          className={`hero-number tabular-nums ${isCritical ? "text-[var(--color-critical)]" : "text-[var(--color-primary)]"}`}
        >
          {displayValue.toFixed(1)}
        </motion.span>
        <span className="text-muted">{unit}</span>
      </div>

      <div className="text-xs text-faint mb-2">
        Ref: {refLow}–{refHigh}
      </div>

      {delta !== 0 && (
        <div className="flex items-center gap-1 mt-1 text-sm">
          <span
            className={`inline-flex items-center font-medium ${isHigher && isCritical ? "text-[var(--color-critical)]" : !isHigher && isCritical ? "text-[var(--color-critical)]" : isHigher ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}
          >
            {isHigher ? (
              <ArrowUp size={14} className="mr-0.5" />
            ) : (
              <ArrowDown size={14} className="mr-0.5" />
            )}
            {Math.abs(delta).toFixed(1)}
          </span>
          <span className="text-muted">
            from {previousValue} on {previousDate}
          </span>
        </div>
      )}
    </div>
  );
};
