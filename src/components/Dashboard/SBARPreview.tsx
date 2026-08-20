import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronDown, ChevronUp, AlertCircle, FileDown, CheckCircle2, Loader2, Share2, Clipboard, Activity } from "lucide-react";
import { SBARSummary } from "../../types/medical";
import { exportToPDF } from "../../services/pdfExportService";
import { exportToFhirBundle, downloadFhirJson } from "../../services/fhirService";

export interface SBARPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  sbar: string | null;
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [fhirExportSuccess, setFhirExportSuccess] = useState(false);

  const handleDownloadPDF = async () => {
    if (!sbar) return;
    setIsExporting(true);
    try {
      await exportToPDF("sbar-content", `Aegis_SBAR_${new Date().toISOString().split('T')[0]}.pdf`);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error("PDF Export failed:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFhir = () => {
    if (!sbar) return;
    try {
      const patient = { id: 'patient-user', name: 'Patient' };
      const bundle = exportToFhirBundle(patient, [], sbar);
      downloadFhirJson(bundle, `Aegis_SBAR_FHIR_${new Date().toISOString().split('T')[0]}.json`);
      setFhirExportSuccess(true);
      setTimeout(() => setFhirExportSuccess(false), 3000);
    } catch (err) {
      console.error("FHIR Export failed:", err);
    }
  };

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
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl bg-[var(--color-bg)] border border-[var(--color-primary)] z-[9910] rounded-[32px] shadow-md dark:shadow-2xl flex flex-col h-[90vh] md:h-[80vh] max-h-[900px]"
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
                  Clinical Handover & Patient Summary
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mt-1 font-medium">
                  SBAR & AI DR Format (Plain Text)
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 -mr-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 p-4 rounded-2xl flex gap-3 mb-6">
                <AlertCircle
                  size={20}
                  className="text-[var(--color-warning)] shrink-0 mt-0.5"
                />
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-warning)] mb-0.5">
                    Professional SBAR & Patient Summary
                  </h4>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                    This summary contains two sections: one designed to be handed to a clinician, and another (AI DR) designed to help you understand your medical reports in clear layperson terms.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mb-4" />
                  <p className="text-[var(--color-text-muted)] text-sm font-medium">
                    Synthesizing clinical data into SBAR format...
                  </p>
                </div>
              ) : sbar === "No data provided." || sbar?.includes("No data provided.") || sbar?.includes("Empty") || error ? (
                <div className="bg-[var(--color-critical)]/10 border border-[var(--color-critical)]/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <AlertCircle
                    size={32}
                    className="text-[var(--color-warning)] mb-3"
                  />
                  <h4 className="font-semibold text-[var(--color-warning)] mb-1">
                    No Clinical Data
                  </h4>
                  <p className="text-sm text-[var(--color-warning)] leading-relaxed">
                    SBAR cannot be generated yet because no lab results or clinical documents exist for this profile. Upload a report first from Ingest.
                  </p>
                </div>
              ) : (
                <div className="bg-[var(--color-surface)]/20 p-6 rounded-24px border border-[var(--color-border)]">
                  <pre 
                    id="sbar-content"
                    className="text-[var(--color-text)] leading-relaxed text-sm whitespace-pre-wrap font-mono"
                  >
                    {sbar || "No data provided."}
                  </pre>
                  <div className="mt-8 pt-4 border-t border-[var(--color-border)] text-center">
                    <span className="text-[var(--color-text-faint)] text-xs italic text-center block w-full">
                      Generated by Aegis AI Clinical Engine. Not a medical diagnosis.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg)] shrink-0 flex flex-col-reverse md:flex-row justify-end gap-3 rounded-b-[32px] flex-wrap">
              <button
                onClick={handleExportFhir}
                disabled={!sbar || isLoading || isExporting}
                className="px-5 py-3 rounded-full text-sm font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 transition-colors focus:outline-none w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {fhirExportSuccess ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <Activity size={16} className="text-indigo-500" />
                )}
                {fhirExportSuccess ? "FHIR Exported!" : "Export FHIR R4"}
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={!sbar || isLoading || isExporting}
                className="px-6 py-3 rounded-full text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors focus:outline-none w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
                ) : exportSuccess ? (
                  <CheckCircle2 size={16} className="text-[var(--color-success)]" />
                ) : (
                  <FileDown size={16} className="text-[var(--color-primary)]" />
                )}
                {isExporting ? "Generating PDF..." : exportSuccess ? "Downloaded!" : "Download PDF"}
              </button>

              <button
                onClick={async () => {
                  if (typeof navigator.share === 'function') {
                    try {
                      await navigator.share({
                        title: "Clinical Handover (SBAR)",
                        text: sbar || "",
                      });
                    } catch (err) {
                      if (import.meta.env.DEV) console.log("Share canceled or failed:", err);
                    }
                  } else {
                    navigator.clipboard.writeText(sbar || "");
                    alert("Summary copied to clipboard!");
                  }
                }}
                className="px-8 py-3 rounded-full text-sm font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 focus:outline-none w-full md:w-auto shadow-lg shadow-[var(--color-primary)]/20"
              >
                {typeof navigator.share === 'function' ? <Share2 size={16} /> : <Clipboard size={16} />}
                {typeof navigator.share === 'function' ? "Share SBAR Report" : "Copy to Clipboard"}
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
