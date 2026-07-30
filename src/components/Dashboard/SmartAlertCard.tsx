import React from "react";
import { motion } from "motion/react";
import { AlertTriangle, Info, AlertCircle, ArrowRight } from "lucide-react";

export interface SmartAlertCardProps {
  variant: "critical" | "warning" | "info";
  title: string;
  body: string;
  source: string;
  ctaLabel: string;
  onCta: () => void;
}

export const SmartAlertCard: React.FC<SmartAlertCardProps> = ({
  variant,
  title,
  body,
  source,
  ctaLabel,
  onCta,
}) => {
  const isCritical = variant === "critical";
  const isWarning = variant === "warning";

  const getContainerStyle = () => {
    if (isCritical)
      return "bg-[var(--color-critical)]/10 border border-[var(--color-critical)]/20";
    if (isWarning)
      return "bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20";
    return "bg-[var(--color-info)]/10 border border-[var(--color-info)]/20";
  };

  const getAccentColor = () => {
    if (isCritical) return "text-[var(--color-critical)]";
    if (isWarning) return "text-[var(--color-warning)]";
    return "text-[var(--color-info)]";
  };

  const Icon = isCritical ? AlertCircle : isWarning ? AlertTriangle : Info;

  return (
    <motion.div
      role="alert"
      aria-live={isCritical ? "assertive" : "polite"}
      className={`relative p-5 rounded-2xl flex items-start gap-4 ${getContainerStyle()}`}
      animate={
        isCritical
          ? {
              boxShadow: [
                "0 0 0px rgba(248,113,113,0)",
                "0 0 20px rgba(248,113,113,0.25)",
                "0 0 0px rgba(248,113,113,0)",
              ],
            }
          : undefined
      }
      transition={
        isCritical
          ? { repeat: Infinity, duration: 3.5, ease: "easeInOut" }
          : undefined
      }
    >
      {/* Small dot accent */}
      <div
        className={`absolute top-5 left-4 w-1.5 h-1.5 rounded-full ${isCritical ? "bg-[var(--color-critical)]" : isWarning ? "bg-[var(--color-warning)]" : "bg-[var(--color-info)]"}`}
      />

      <div className="pl-4 mt-0.5">
        <Icon size={18} className={getAccentColor()} />
      </div>

      <div className="flex-1">
        <h4 className={`font-semibold text-base mb-1 ${getAccentColor()}`}>
          {title}
        </h4>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-3">
          {body}
        </p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[var(--color-text-faint)] uppercase tracking-wider">
            {source}
          </span>
          <button
            onClick={onCta}
            className={`flex items-center gap-1 text-sm font-medium hover:underline text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-current rounded`}
          >
            Review with your doctor <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
