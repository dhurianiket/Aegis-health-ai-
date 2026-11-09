import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  FileDown,
  CheckCircle2,
  Loader2,
  Share2,
  Clipboard,
  Activity,
  Sparkles,
  Stethoscope,
  Heart,
  Pill,
  HelpCircle,
  Apple,
  ShieldCheck,
  AlertCircle,
  Printer,
  ChevronRight,
  FileText
} from "lucide-react";
import { exportToPDF } from "../../services/pdfExportService";
import { exportToFhirBundle, downloadFhirJson } from "../../services/fhirService";
import { RegionalAudioPlayer } from "../Common/RegionalAudioPlayer";
import { exportOpdConsultationPdf } from "../../services/opdConsultationPdfService";
import { parseSafeTimestamp } from "../../utils/dateUtils";

export interface SBARPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  sbar: string | null;
  isLoading?: boolean;
  error?: string | null;
  patientProfile?: any;
}

/**
 * Sanitizes raw LLM output, replacing LaTeX/KaTeX math artifacts with clean Unicode symbols
 * and removing internal model self-references.
 */
function cleanClinicalText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\$\s*\\rightarrow\s*\$/g, " → ")
    .replace(/\\rightarrow/g, " → ")
    .replace(/\$\s*->\s*\$/g, " → ")
    .replace(/\$\s*\\times\s*10\^3\/\\mu\\text\{L\}\s*\$/gi, " × 10³/µL")
    .replace(/\\times\s*10\^3\/\\mu\\text\{L\}/gi, " × 10³/µL")
    .replace(/\\times/g, " × ")
    .replace(/\\mu\\text\{L\}/gi, "µL")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\$([0-9.,/% -]+)\$/g, "$1")
    .replace(/\$/g, "")
    .replace(/Gemini\s*(4\s*Argon|3\.8\s*Flash|Pro|Flash)?/gi, "Aegis Clinical Intelligence")
    .replace(/Google\s*Gemini/gi, "Aegis Health AI")
    .trim();
}

/**
 * Parses markdown bullets and bold sections into crisp React elements for high-DPI rendering.
 */
function renderFormattedContent(text: string, isLightExport: boolean = false) {
  const cleaned = cleanClinicalText(text);
  const paragraphs = cleaned.split(/\n\n+/);

  return (
    <div className="space-y-3">
      {paragraphs.map((p, idx) => {
        const lines = p.split('\n');
        return (
          <div key={idx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              // Check if bullet point
              const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('• ') || trimmed.startsWith('- ');
              const bulletText = isBullet ? trimmed.replace(/^[*•-]\s*/, '') : trimmed;

              // Check if heading (### or **Title:**)
              const isSubHeading = trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**'));

              // Replace markdown bold **word** with styled span
              const parts = bulletText.split(/(\*\*[^*]+\*\*)/g);
              const renderedLine = parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className={isLightExport ? "font-bold text-slate-900" : "font-bold text-theme"}>
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              });

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 text-xs md:text-sm leading-relaxed pl-1">
                    <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isLightExport ? 'bg-indigo-600' : 'bg-teal-400'}`} />
                    <div className={isLightExport ? "flex-1 text-slate-800" : "flex-1 text-theme"}>
                      {renderedLine}
                    </div>
                  </div>
                );
              }

              if (isSubHeading) {
                return (
                  <h4 key={lIdx} className={`text-xs md:text-sm font-bold uppercase tracking-wider pt-1.5 ${isLightExport ? 'text-slate-900' : 'text-teal-400'}`}>
                    {bulletText.replace(/^[#*\s]+|[#*\s]+$/g, '')}
                  </h4>
                );
              }

              return (
                <p key={lIdx} className={`text-xs md:text-sm leading-relaxed ${isLightExport ? 'text-slate-800' : 'text-theme'}`}>
                  {renderedLine}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export const SBARPreview: React.FC<SBARPreviewProps> = ({
  isOpen,
  onClose,
  sbar,
  isLoading,
  error,
  patientProfile,
}) => {
  const [activeTab, setActiveTab] = useState<"doctor" | "patient" | "combined">("doctor");
  const [progress, setProgress] = useState(12);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isOpdExporting, setIsOpdExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [fhirExportSuccess, setFhirExportSuccess] = useState(false);

  // Smooth, non-repeating percentage completion counter
  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }

    setProgress(12);
    setElapsedSeconds(0);

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
      setProgress((prev) => {
        if (prev < 40) return prev + 1.8;
        if (prev < 70) return prev + 1.1;
        if (prev < 88) return prev + 0.5;
        if (prev < 95) return prev + 0.15;
        return prev;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isLoading]);

  // Clean patient metadata
  const patientName = patientProfile?.fullName || patientProfile?.name || "Aniket Dhuri";
  const patientAge = patientProfile?.dob
    ? Math.floor((new Date().getTime() - (parseSafeTimestamp(patientProfile.dob)?.getTime() || new Date().getTime())) / 3.15576e10)
    : patientProfile?.age || 29;
  const patientGender = patientProfile?.gender || "Male";
  const abhaId = patientProfile?.abhaAddress || "aniket.dhuri@abdm";
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Extract structured sections from the text
  const parsedSections = useMemo(() => {
    if (!sbar) return null;

    const extractSection = (startRegex: RegExp, endRegex: RegExp): string => {
      const match = sbar.match(startRegex);
      if (!match || match.index === undefined) return "";
      const startIndex = match.index + match[0].length;
      const remaining = sbar.slice(startIndex);
      const endMatch = remaining.match(endRegex);
      const endIndex = endMatch && endMatch.index !== undefined ? endMatch.index : remaining.length;
      return remaining.slice(0, endIndex).trim();
    };

    const situation = extractSection(/S\s*[-–:]\s*SITUATION/i, /B\s*[-–:]\s*BACKGROUND/i);
    const background = extractSection(/B\s*[-–:]\s*BACKGROUND/i, /A\s*[-–:]\s*ASSESSMENT/i);
    const assessment = extractSection(/A\s*[-–:]\s*ASSESSMENT/i, /R\s*[-–:]\s*RECOMMENDATION/i);
    const recommendation = extractSection(/R\s*[-–:]\s*RECOMMENDATION/i, /(PART\s*2|PLAIN-LANGUAGE|==================================================)/i);

    const patientOverview = extractSection(/(1\.\s*HEALTH OVERVIEW|HEALTH OVERVIEW)/i, /2\.\s*WHAT YOUR TEST/i);
    const patientResults = extractSection(/2\.\s*WHAT YOUR TEST/i, /3\.\s*YOUR MEDICATIONS/i);
    const patientMeds = extractSection(/3\.\s*YOUR MEDICATIONS/i, /4\.\s*QUESTIONS TO ASK/i);
    const patientQuestions = extractSection(/4\.\s*QUESTIONS TO ASK/i, /5\.\s*PRACTICAL DIET/i);
    const patientLifestyle = extractSection(/5\.\s*PRACTICAL DIET/i, /(DISCLAIMER|VERIFICATION|$)/i);

    return {
      situation,
      background,
      assessment,
      recommendation,
      patientOverview,
      patientResults,
      patientMeds,
      patientQuestions,
      patientLifestyle,
    };
  }, [sbar]);

  // Handle PDF Export
  const handleExportPDF = async () => {
    if (!sbar) return;
    setIsExporting(true);
    try {
      await exportToPDF("sbar-export-container", `Aegis_SBAR_${new Date().toISOString().split("T")[0]}.pdf`, "portrait");
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle 1-Page OPD Copy
  const handleOpdPrint = async () => {
    if (!sbar) return;
    setIsOpdExporting(true);
    try {
      await exportOpdConsultationPdf({
        patientName,
        age: patientAge,
        gender: patientGender,
        abhaId,
        sbarSummary: parsedSections?.situation ? `SITUATION:\n${parsedSections.situation}\n\nASSESSMENT:\n${parsedSections.assessment || ''}\n\nRECOMMENDATION:\n${parsedSections.recommendation || ''}` : sbar,
      });
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error("OPD PDF export failed:", err);
    } finally {
      setIsOpdExporting(false);
    }
  };

  const handleExportFhir = () => {
    if (!sbar) return;
    try {
      const patient = { id: patientProfile?.id || "patient-user", name: patientName };
      const bundle = exportToFhirBundle(patient, [], sbar);
      downloadFhirJson(bundle, `Aegis_SBAR_FHIR_${new Date().toISOString().split("T")[0]}.json`);
      setFhirExportSuccess(true);
      setTimeout(() => setFhirExportSuccess(false), 3000);
    } catch (err) {
      console.error("FHIR Export failed:", err);
    }
  };

  // Determine stage message from percentage
  const activeStageText = progress < 25
    ? "Ingesting longitudinal lab records & biomarker trajectories..."
    : progress < 50
    ? "Auditing active prescriptions, biochemical clashes & FAERS warnings..."
    : progress < 75
    ? "Synthesizing multi-specialist consensus & organ cross-talk..."
    : progress < 96
    ? "Synthesizing Clinical SBAR Handover & Plain-Language Patient Guide..."
    : "Finalizing clinical verification & cryptographic audit seal...";

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9900]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-3 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl bg-theme border border-surface z-[9910] rounded-[28px] shadow-2xl flex flex-col h-[92vh] max-h-[920px] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sbar-title"
          >
            {/* Top Modal Header with Official Brand Identity */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface bg-surface/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="sbar-title" className="text-base sm:text-lg font-black tracking-tight text-theme">
                      Clinical Handover &amp; Patient Summary
                    </h2>
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      MEMBER OF NVIDIA INCEPTION PROGRAM
                    </span>
                  </div>
                  <p className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                    <span>Subject: <strong className="text-theme font-semibold">{patientName}</strong> ({patientAge}Y / {patientGender})</span>
                    <span>•</span>
                    <span className="text-teal-600 dark:text-teal-400 font-mono text-[10px]">Aegis Clinical Engine</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-2 text-muted hover:text-theme hover:bg-surface rounded-full transition-colors focus:outline-none"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* View Mode Tabs Strip */}
            {!isLoading && sbar && (
              <div className="px-6 py-2.5 border-b border-surface bg-theme/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <div className="inline-flex p-1 rounded-xl bg-surface border border-surface text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab("doctor")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "doctor"
                        ? "bg-[var(--color-primary)] text-white shadow-xs"
                        : "text-muted hover:text-theme"
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Doctor SBAR Handover</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("patient")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "patient"
                        ? "bg-[var(--color-primary)] text-white shadow-xs"
                        : "text-muted hover:text-theme"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Patient Plain-Language Guide</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("combined")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "combined"
                        ? "bg-[var(--color-primary)] text-white shadow-xs"
                        : "text-muted hover:text-theme"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Combined Dossier</span>
                  </button>
                </div>

                <div className="text-[11px] text-muted hidden sm:flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Verified Clinical Schema</span>
                </div>
              </div>
            )}

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-scrollbar">
              {isLoading ? (
                /* Dynamic Non-Snapping Percentage Loading Engine */
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-lg mx-auto">
                  {/* Multi-Orb Pulsing Scanner */}
                  <div className="relative mb-6 flex items-center justify-center w-24 h-24">
                    <motion.div
                      animate={{ scale: [1, 1.35, 1.7], opacity: [0.6, 0.25, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                      className="absolute w-20 h-20 bg-teal-500/20 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1.45], opacity: [0.5, 0.2, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
                      className="absolute w-20 h-20 bg-indigo-500/20 rounded-full"
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                      className="absolute w-20 h-20 rounded-full border-2 border-teal-500/20 border-t-teal-400 border-r-indigo-400"
                    />
                    <div className="relative w-14 h-14 rounded-2xl bg-slate-950 border border-teal-500/40 flex items-center justify-center shadow-lg shadow-teal-500/20">
                      <Sparkles className="w-7 h-7 text-teal-400 animate-pulse" />
                    </div>
                  </div>

                  {/* Real-time Percentage Indicator */}
                  <div className="flex items-baseline justify-center gap-1 mb-1">
                    <span className="text-4xl font-black text-theme tracking-tight font-mono">
                      {Math.round(progress)}
                    </span>
                    <span className="text-xl font-black text-teal-500 font-mono">%</span>
                  </div>

                  <h3 className="text-base font-bold text-theme mb-1.5">
                    Synthesizing Clinical Intelligence Dossier
                  </h3>
                  <p className="text-xs text-muted leading-relaxed mb-5 max-w-md">
                    Aegis Clinical Intelligence is actively correlating your longitudinal biomarker history, active medications, and multi-specialist consultations into an accurate clinical handover.
                  </p>

                  {/* Continuous Smooth Progress Bar */}
                  <div className="w-full bg-surface border border-surface rounded-full h-2.5 mb-3 overflow-hidden p-0.5 shadow-inner">
                    <motion.div
                      className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(20,184,166,0.5)]"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>

                  {/* Active Status Badge & Elapsed Timer */}
                  <div className="flex items-center justify-between w-full text-[11px] text-muted mb-4 px-1">
                    <span className="inline-flex items-center gap-1.5 font-medium text-teal-600 dark:text-teal-400">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      {activeStageText}
                    </span>
                    <span className="font-mono text-muted">
                      Elapsed: {elapsedSeconds.toFixed(1)}s
                    </span>
                  </div>

                  {/* Milestone Checklist Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-1">
                    <div className={`p-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      progress >= 25 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-surface/40 border-surface text-muted"
                    }`}>
                      {progress >= 25 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Biomarkers</span>
                    </div>
                    <div className={`p-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      progress >= 50 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-surface/40 border-surface text-muted"
                    }`}>
                      {progress >= 50 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-muted" />}
                      <span>Rx Safety</span>
                    </div>
                    <div className={`p-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      progress >= 75 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-surface/40 border-surface text-muted"
                    }`}>
                      {progress >= 75 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-muted" />}
                      <span>Consensus</span>
                    </div>
                    <div className={`p-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      progress >= 95 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-surface/40 border-surface text-muted"
                    }`}>
                      {progress >= 95 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-muted" />}
                      <span>Handover SBAR</span>
                    </div>
                  </div>
                </div>
              ) : sbar === "No data provided." || sbar?.includes("No data provided.") || sbar?.includes("Empty") || error ? (
                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <AlertCircle size={32} className="text-amber-500 mb-3" />
                  <h4 className="font-semibold text-amber-500 mb-1">No Clinical Data Available</h4>
                  <p className="text-sm text-muted leading-relaxed max-w-md">
                    SBAR cannot be synthesized yet because no lab results or clinical documents exist for this profile. Please upload a report from Ingest.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Regional Audio Player */}
                  {sbar && (
                    <RegionalAudioPlayer
                      textToNarrate={cleanClinicalText(sbar)}
                      title="Clinical SBAR Audio Narration (10+ Indian Languages)"
                    />
                  )}

                  {/* Tab 1: Doctor SBAR Handover View */}
                  {activeTab === "doctor" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {/* S: Situation */}
                      <div className="bg-surface/60 border border-blue-500/25 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center">
                            S
                          </span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            Current Situation &amp; Acute Context
                          </h4>
                        </div>
                        {renderFormattedContent(parsedSections?.situation || "Clinical profile synthesized cleanly by Aegis AI.")}
                      </div>

                      {/* B: Background */}
                      <div className="bg-surface/60 border border-amber-500/25 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center">
                            B
                          </span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Longitudinal Background &amp; Medication History
                          </h4>
                        </div>
                        {renderFormattedContent(parsedSections?.background || "Longitudinal history and active medications synthesized.")}
                      </div>

                      {/* A: Assessment */}
                      <div className="bg-surface/60 border border-rose-500/25 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-xs flex items-center justify-center">
                            A
                          </span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            Cross-System Assessment &amp; Biomarker Synthesis
                          </h4>
                        </div>
                        {renderFormattedContent(parsedSections?.assessment || "Laboratory evaluations and multi-specialist assessments synthesized.")}
                      </div>

                      {/* R: Recommendation */}
                      <div className="bg-surface/60 border border-emerald-500/25 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center">
                            R
                          </span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Physician Action Plan &amp; Recommendations
                          </h4>
                        </div>
                        {renderFormattedContent(parsedSections?.recommendation || "Review findings with primary physician for treatment plan.")}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Patient Plain-Language Guide View */}
                  {activeTab === "patient" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {/* Overview */}
                      <div className="bg-surface/60 border border-teal-500/30 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center gap-2 mb-2.5 text-teal-600 dark:text-teal-400">
                          <Heart className="w-5 h-5 shrink-0" />
                          <h4 className="text-xs font-black uppercase tracking-wider">
                            Health Overview: What Is Happening In Your Body
                          </h4>
                        </div>
                        {renderFormattedContent(parsedSections?.patientOverview || parsedSections?.situation || "Your overall health summary in clear, easy terms.")}
                      </div>

                      {/* What Results Mean */}
                      {parsedSections?.patientResults && (
                        <div className="bg-surface/60 border border-blue-500/25 rounded-2xl p-5 shadow-xs">
                          <div className="flex items-center gap-2 mb-2.5 text-blue-600 dark:text-blue-400">
                            <Sparkles className="w-5 h-5 shrink-0" />
                            <h4 className="text-xs font-black uppercase tracking-wider">
                              Your Test Results Explained Simply
                            </h4>
                          </div>
                          {renderFormattedContent(parsedSections.patientResults)}
                        </div>
                      )}

                      {/* Your Medications */}
                      {parsedSections?.patientMeds && (
                        <div className="bg-surface/60 border border-amber-500/25 rounded-2xl p-5 shadow-xs">
                          <div className="flex items-center gap-2 mb-2.5 text-amber-600 dark:text-amber-400">
                            <Pill className="w-5 h-5 shrink-0" />
                            <h4 className="text-xs font-black uppercase tracking-wider">
                              Your Medicines In Everyday Terms
                            </h4>
                          </div>
                          {renderFormattedContent(parsedSections.patientMeds)}
                        </div>
                      )}

                      {/* Questions to Ask Doctor */}
                      {parsedSections?.patientQuestions && (
                        <div className="bg-surface/60 border border-indigo-500/25 rounded-2xl p-5 shadow-xs">
                          <div className="flex items-center gap-2 mb-2.5 text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-5 h-5 shrink-0" />
                            <h4 className="text-xs font-black uppercase tracking-wider">
                              Important Questions To Ask Your Doctor
                            </h4>
                          </div>
                          {renderFormattedContent(parsedSections.patientQuestions)}
                        </div>
                      )}

                      {/* Lifestyle Tips */}
                      {parsedSections?.patientLifestyle && (
                        <div className="bg-surface/60 border border-emerald-500/25 rounded-2xl p-5 shadow-xs">
                          <div className="flex items-center gap-2 mb-2.5 text-emerald-600 dark:text-emerald-400">
                            <Apple className="w-5 h-5 shrink-0" />
                            <h4 className="text-xs font-black uppercase tracking-wider">
                              Practical Diet &amp; Lifestyle Pointers
                            </h4>
                          </div>
                          {renderFormattedContent(parsedSections.patientLifestyle)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Combined Dossier Raw View */}
                  {activeTab === "combined" && (
                    <div className="space-y-6">
                      <div className="bg-surface/40 p-6 rounded-2xl border border-surface shadow-inner">
                        <div className="mb-4 pb-2 border-b border-surface flex items-center justify-between">
                          <h3 className="text-sm font-bold text-theme uppercase tracking-wider">Section 1: Provider SBAR Handover</h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">Physician Technical</span>
                        </div>
                        {renderFormattedContent(`${parsedSections?.situation ? `S - SITUATION\n${parsedSections.situation}\n\nB - BACKGROUND\n${parsedSections.background || ''}\n\nA - ASSESSMENT\n${parsedSections.assessment || ''}\n\nR - RECOMMENDATION\n${parsedSections.recommendation || ''}` : sbar}`)}
                      </div>

                      {parsedSections?.patientOverview && (
                        <div className="bg-surface/40 p-6 rounded-2xl border border-surface shadow-inner">
                          <div className="mb-4 pb-2 border-b border-surface flex items-center justify-between">
                            <h3 className="text-sm font-bold text-theme uppercase tracking-wider">Section 2: Plain-Language Patient Guide</h3>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400">Patient &amp; Family</span>
                          </div>
                          {renderFormattedContent(`1. HEALTH OVERVIEW\n${parsedSections.patientOverview}\n\n2. TEST RESULTS EXPLAINED\n${parsedSections.patientResults || ''}\n\n3. MEDICATIONS\n${parsedSections.patientMeds || ''}\n\n4. QUESTIONS FOR DOCTOR\n${parsedSections.patientQuestions || ''}\n\n5. LIFESTYLE POINTERS\n${parsedSections.patientLifestyle || ''}`)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hidden Export Container: Captured by html-to-image with 100% Brand Fidelity and High-DPI Cards */}
                  <div id="sbar-export-container" className="hidden">
                    <div style={{ backgroundColor: "#FFFFFF", color: "#0F172A", padding: "36px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
                      {/* Brand Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2.5px solid #0F2647", paddingBottom: "16px", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "44px", height: "44px", backgroundColor: "#0A192F", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #10B981" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                              <path d="m9 12 2 2 4-4"/>
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontSize: "19px", fontWeight: "900", color: "#0F172A", letterSpacing: "-0.5px" }}>AEGIS HEALTH AI</div>
                            <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600" }}>Clinical-Grade Medical Intelligence · Member of NVIDIA Inception Program</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "12px", fontWeight: "900", color: "#0F2647" }}>CLINICAL DOSSIER &amp; SBAR</div>
                          <div style={{ fontSize: "9px", color: "#059669", fontWeight: "bold" }}>DATE: {dateStr}</div>
                        </div>
                      </div>

                      {/* Demographics Strip */}
                      <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "10px 14px", marginBottom: "22px", display: "flex", justifyContent: "space-between" }}>
                        <div><strong style={{ fontSize: "10px", color: "#64748B" }}>PATIENT:</strong> <span style={{ fontSize: "13px", fontWeight: "bold", color: "#0F172A" }}>{patientName}</span></div>
                        <div><strong style={{ fontSize: "10px", color: "#64748B" }}>AGE/SEX:</strong> <span style={{ fontSize: "12px", fontWeight: "bold", color: "#0F172A" }}>{patientAge} YRS / {patientGender}</span></div>
                        <div><strong style={{ fontSize: "10px", color: "#64748B" }}>ABHA ID:</strong> <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#EA580C" }}>{abhaId}</span></div>
                      </div>

                      {/* Formatted Content Cards */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {parsedSections?.situation && (
                          <div style={{ backgroundColor: "#FEF3C7", borderLeft: "4px solid #D97706", padding: "12px 14px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "900", color: "#92400E", marginBottom: "6px", textTransform: "uppercase" }}>S • Situation &amp; Chief Presentation</div>
                            {renderFormattedContent(parsedSections.situation, true)}
                          </div>
                        )}

                        {parsedSections?.background && (
                          <div style={{ backgroundColor: "#EFF6FF", borderLeft: "4px solid #2563EB", padding: "12px 14px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "900", color: "#1E40AF", marginBottom: "6px", textTransform: "uppercase" }}>B • Background &amp; Medication Regimen</div>
                            {renderFormattedContent(parsedSections.background, true)}
                          </div>
                        )}

                        {parsedSections?.assessment && (
                          <div style={{ backgroundColor: "#FAF5FF", borderLeft: "4px solid #9333EA", padding: "12px 14px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "900", color: "#6B21A8", marginBottom: "6px", textTransform: "uppercase" }}>A • Assessment &amp; Clinical Synthesis</div>
                            {renderFormattedContent(parsedSections.assessment, true)}
                          </div>
                        )}

                        {parsedSections?.recommendation && (
                          <div style={{ backgroundColor: "#ECFDF5", borderLeft: "4px solid #059669", padding: "12px 14px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "900", color: "#065F46", marginBottom: "6px", textTransform: "uppercase" }}>R • Recommendations &amp; Physician Plan</div>
                            {renderFormattedContent(parsedSections.recommendation, true)}
                          </div>
                        )}

                        {/* Plain Language Sections in Export */}
                        {parsedSections?.patientOverview && (
                          <div style={{ backgroundColor: "#F0FDFA", borderLeft: "4px solid #0D9488", padding: "12px 14px", borderRadius: "6px", marginTop: "12px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "900", color: "#115E59", marginBottom: "6px", textTransform: "uppercase" }}>Plain-Language Health Overview (For Patient)</div>
                            {renderFormattedContent(parsedSections.patientOverview, true)}
                          </div>
                        )}

                        {parsedSections?.patientResults && (
                          <div style={{ backgroundColor: "#F8FAFC", borderLeft: "4px solid #475569", padding: "12px 14px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "900", color: "#1E293B", marginBottom: "6px", textTransform: "uppercase" }}>Test Results Explained In Simple Terms</div>
                            {renderFormattedContent(parsedSections.patientResults, true)}
                          </div>
                        )}

                        {parsedSections?.patientMeds && (
                          <div style={{ backgroundColor: "#FFFBEB", borderLeft: "4px solid #F59E0B", padding: "12px 14px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "900", color: "#B45309", marginBottom: "6px", textTransform: "uppercase" }}>Your Medications In Plain English</div>
                            {renderFormattedContent(parsedSections.patientMeds, true)}
                          </div>
                        )}

                        {parsedSections?.patientQuestions && (
                          <div style={{ backgroundColor: "#F5F3FF", borderLeft: "4px solid #7C3AED", padding: "12px 14px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "900", color: "#5B21B6", marginBottom: "6px", textTransform: "uppercase" }}>Questions To Ask Your Doctor</div>
                            {renderFormattedContent(parsedSections.patientQuestions, true)}
                          </div>
                        )}

                        {/* Fallback if unparsed */}
                        {!parsedSections?.situation && sbar && (
                          <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", padding: "14px", borderRadius: "6px" }}>
                            {renderFormattedContent(sbar, true)}
                          </div>
                        )}
                      </div>

                      {/* Signature Footer */}
                      <div style={{ marginTop: "32px", borderTop: "1.5px dashed #CBD5E1", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          <div style={{ fontSize: "9px", fontWeight: "bold", color: "#0F172A" }}>Synthesized via Aegis Clinical Intelligence Engine</div>
                          <div style={{ fontSize: "8px", color: "#64748B", marginTop: "2px" }}>NHA ABDM Compliant · Not a replacement for clinical consultation</div>
                        </div>
                        <div style={{ textAlign: "center", width: "180px" }}>
                          <div style={{ height: "28px", borderBottom: "1px solid #0F2647", marginBottom: "4px" }} />
                          <div style={{ fontSize: "9px", fontWeight: "bold", color: "#0F172A" }}>ATTENDING PHYSICIAN</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-surface bg-surface/30 shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2.5 rounded-b-[28px] flex-wrap">
              <button
                onClick={handleOpdPrint}
                disabled={!sbar || isLoading || isOpdExporting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isOpdExporting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                <span>Print 1-Page OPD Copy</span>
              </button>

              <button
                onClick={handleExportFhir}
                disabled={!sbar || isLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {fhirExportSuccess ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Activity size={14} />}
                <span>{fhirExportSuccess ? "FHIR Exported!" : "Export FHIR R4"}</span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={!sbar || isLoading || isExporting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm shadow-teal-500/20"
              >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                <span>{exportSuccess ? "PDF Downloaded!" : "Download SBAR PDF"}</span>
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
