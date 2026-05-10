import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { SBARSummary } from "../../types/medical";

export interface SBARPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  sbar: SBARSummary | null;
  isLoading?: boolean;
  error?: string | null;
}

export const SBARPreview: React.FC<SBARPreviewProps> = ({
  isOpen,
  onClose,
  sbar,
  isLoading,
  error,
}) => {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    situation: true,
    background: true,
    assessment: true,
    recommendation: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const Section = ({
    title,
    content,
    id,
  }: {
    title: string;
    content: string;
    id: string;
  }) => (
    <div className="border border-[var(--color-border)] rounded-[16px] overflow-hidden bg-[var(--color-surface)]/30 mb-4 transition-colors hover:bg-[var(--color-surface)]/50">
      <button
        onClick={() => toggleSection(id)}
        className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="font-semibold text-[var(--color-text)]">{title}</span>
        {expandedSections[id] ? (
          <ChevronUp size={20} className="text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown size={20} className="text-[var(--color-text-muted)]" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {expandedSections[id] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-[var(--color-text-muted)] leading-relaxed text-sm whitespace-pre-wrap border-t border-[var(--color-border)] pt-4">
              {content || "No data provided."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9900]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-[var(--color-bg)] border border-[var(--color-primary)] z-[9910] rounded-[32px] shadow-2xl flex flex-col md:h-[80vh] max-h-[800px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sbar-title"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] shrink-0">
              <div>
                <h2
                  id="sbar-title"
                  className="text-xl font-semibold text-[var(--color-text)]"
                >
                  Clinical Handover
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mt-1 font-medium">
                  SBAR Format
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] rounded-full transition-colors focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 p-4 rounded-2xl flex gap-3 mb-6">
                <AlertCircle
                  size={20}
                  className="text-[var(--color-warning)] shrink-0 mt-0.5"
                />
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-warning)] mb-0.5">
                    Automated Insight
                  </h4>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                    This summary is AI-generated for your convenience to share
                    with healthcare providers. It is not a medical diagnosis.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mb-4" />
                  <p className="text-[var(--color-text-muted)] text-sm">
                    Synthesizing clinical data...
                  </p>
                </div>
              ) : error ? (
                <div className="bg-[var(--color-critical)]/10 border border-[var(--color-critical)]/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <AlertCircle
                    size={32}
                    className="text-[var(--color-critical)] mb-3"
                  />
                  <h4 className="font-semibold text-[var(--color-critical)] mb-1">
                    Error
                  </h4>
                  <p className="text-sm text-[var(--color-critical)] leading-relaxed">
                    {error}
                  </p>
                </div>
              ) : (
                <>
                  <Section
                    id="situation"
                    title="Situation"
                    content={sbar?.situation || ""}
                  />
                  <Section
                    id="background"
                    title="Background"
                    content={sbar?.background || ""}
                  />
                  <Section
                    id="assessment"
                    title="Assessment"
                    content={sbar?.assessment?.join("\n") || ""}
                  />
                  <Section
                    id="recommendation"
                    title="Recommendation"
                    content={sbar?.recommendation?.join("\n") || ""}
                  />

                  <div className="mt-6 text-center">
                    <span className="text-[var(--color-text-faint)] text-xs">
                      Generated by Aegis AI. Not a diagnosis.
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg)] shrink-0 flex flex-col-reverse md:flex-row justify-end gap-3 rounded-b-[32px]">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full text-sm font-medium border border-surface hover:bg-surface transition-colors focus:outline-none w-full md:w-auto"
              >
                Done
              </button>
              <button
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: "Health Handover",
                        text: `Situation:\n${sbar?.situation}\n\nBackground:\n${sbar?.background}\n\nAssessment:\n${sbar?.assessment?.join(", ")}\n\nRecommendation:\n${sbar?.recommendation?.join(", ")}`,
                      });
                    } catch (err) {
                      console.log("Share canceled or failed:", err);
                    }
                  }
                }}
                className="px-6 py-3 rounded-full text-sm font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 focus:outline-none w-full md:w-auto"
              >
                Share Report
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
