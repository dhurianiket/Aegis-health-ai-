import React from "react";
import { motion } from "motion/react";
import { ArrowUp, ArrowDown } from "lucide-react";

export interface ConditionTileProps {
  condition: string;
  keyMetric: string;
  unit: string;
  delta: number;
  status: "NORMAL" | "HIGH" | "CRITICAL" | "LOW";
  lastTested: string;
  onClick: () => void;
}

export const ConditionTile: React.FC<ConditionTileProps> = ({
  condition,
  keyMetric,
  unit,
  delta,
  status,
  lastTested,
  onClick,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "CRITICAL":
        return "text-[var(--color-critical)] bg-[var(--color-critical)]/10";
      case "HIGH":
      case "LOW":
        return "text-[var(--color-warning)] bg-[var(--color-warning)]/10";
      case "NORMAL":
        return "text-[var(--color-success)] bg-[var(--color-success)]/10";
    }
  };

  const getMetricColor = () => {
    switch (status) {
      case "CRITICAL":
        return "text-[var(--color-critical)]";
      case "HIGH":
      case "LOW":
        return "text-[var(--color-warning)]";
      case "NORMAL":
        return "text-[var(--color-primary)]";
    }
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.015, y: -2 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.18 }}
      className="glass-card p-6 w-full text-left flex flex-col gap-4 shadow-sm hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
    >
      <div className="flex justify-between items-center w-full">
        <span className="label-caps">{condition}</span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold tracking-wider ${getStatusColor()}`}
        >
          {status}
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={`hero-number text-[var(--color-text)]`}>
            {keyMetric}
          </span>
          <span className="text-[var(--color-text-muted)] text-sm">{unit}</span>
        </div>

        <div className="flex items-center gap-1 mt-1">
          {delta !== 0 && (
            <span
              className={`flex items-center text-sm font-medium ${delta > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}
            >
              {delta > 0 ? (
                <ArrowUp size={14} className="mr-0.5" />
              ) : (
                <ArrowDown size={14} className="mr-0.5" />
              )}
              {Math.abs(delta)}
            </span>
          )}
          <span className="text-[var(--color-text-muted)] text-sm">
            from last test
          </span>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
        <span className="text-[var(--color-text-faint)] text-xs">
          Last updated {lastTested}
        </span>
      </div>
    </motion.button>
  );
};
