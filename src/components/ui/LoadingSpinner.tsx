import React from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

/**
 * LoadingSpinner - A high-visibility progress indicator.
 *
 * Used for long-running operations or as a fallback for smaller component states
 * where a skeleton loader might be too intrusive.
 *
 * @component
 * @param {('sm'|'md'|'lg')} [size='md'] - The size of the spinner icon
 * @param {string} [label] - Optional descriptive text to display beneath the spinner
 * @example
 * return <LoadingSpinner size="lg" label="Analyzing health records..." />
 */
export default function LoadingSpinner({
  size = "md",
  label,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <span className="sr-only">{label || "Loading..."}</span>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="text-indigo-500"
        aria-hidden="true"
      >
        <Loader2 className={sizeClasses[size]} />
      </motion.div>
      {label && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-slate-400 font-medium tracking-tight"
          aria-hidden="true"
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}
