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

const PIPELINE_STAGES = [
  "Ingesting longitudinal lab records & biomarker trajectories...",
  "Auditing active prescriptions, biochemical clashes & FAERS warnings...",
  "Synthesizing specialist consensus (Cardio, Nephro, Endo)...",
  "Synthesizing Gemini 4 Argon clinical SBAR & Plain-language patient guide...",
];

export const SBARPreview: React.FC<SBARPreviewProps> = ({
  isOpen,
  onClose,
  sbar,
  isLoading,
  error,
  patientProfile,
}) => {
  const [activeTab, setActiveTab] = useState<"doctor" | "patient" | "combined">("doctor");
  const [pipelineStep, setPipelineStep] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isOpdExporting, setIsOpdExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [fhirExportSuccess, setFhirExportSuccess] = useState(false);

  // Cycling pipeline stage messages during generation
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setPipelineStep((prev) => (prev + 1) % PIPELINE_STAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Clean patient metadata
  const patientName = patientProfile?.fullName || patientProfile?.name || "Aniket Dhuri";
  const patientAge = patientProfile?.dob
    ? Math.floor((new Date().getTime() - (parseSafeTimestamp(patientProfile.dob)?.getTime() || new Date().getTime())) / 3.15576e10)
    : 29;
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

    // Patient sections
    const part2Index = sbar.search(/(PART\s*2|PLAIN-LANGUAGE SUMMARY)/i);
    const patientText = part2Index !== -1 ? sbar.slice(part2Index) : sbar;

    const patientOverview = extractSection(/(1\.\s*HEALTH OVERVIEW|OVERVIEW:\s*WHAT IS HAPPENING)/i, /(2\.\s*WHAT YOUR TEST RESULTS MEAN|2\.\s*YOUR LAB RESULTS)/i);
    const patientResults = extractSection(/(2\.\s*WHAT YOUR TEST RESULTS MEAN|2\.\s*YOUR LAB RESULTS)/i, /(3\.\s*YOUR MEDICATIONS IN SIMPLE TERMS|3\.\s*YOUR ACTIVE MEDICATIONS)/i);
    const patientMeds = extractSection(/(3\.\s*YOUR MEDICATIONS IN SIMPLE TERMS|3\.\s*YOUR ACTIVE MEDICATIONS)/i, /(4\.\s*QUESTIONS TO ASK YOUR DOCTOR|4\.\s*IMPORTANT QUESTIONS)/i);
    const patientQuestions = extractSection(/(4\.\s*QUESTIONS TO ASK YOUR DOCTOR|4\.\s*IMPORTANT QUESTIONS)/i, /(5\.\s*PRACTICAL DIET|5\.\s*LIFESTYLE|CLINICAL CONTEXT)/i);
    const patientLifestyle = extractSection(/(5\.\s*PRACTICAL DIET|5\.\s*LIFESTYLE|DIETARY POINTERS)/i, /(CLINICAL CONTEXT|==================================================|$)/i);

    return {
      situation: situation || sbar.slice(0, 300),
      background,
      assessment,
      recommendation,
      patientOverview,
      patientResults,
      patientMeds,
      patientQuestions,
      patientLifestyle,
      rawPatientText: patientText,
    };
  }, [sbar]);

  // Handle Export PDF with official Aegis Health AI branding
  const handleDownloadPDF = async () => {
    if (!sbar) return;
    setIsExporting(true);
    try {
      await exportToPDF(
        "sbar-export-container",
        `Aegis_Clinical_Summary_${patientName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
        "portrait"
      );
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error("PDF Export failed:", err);
      alert("Failed to export PDF. Please try again.");
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
                      NVIDIA INCEPTION MEMBER
                    </span>
                  </div>
                  <p className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                    <span>Subject: <strong className="text-theme font-semibold">{patientName}</strong> ({patientAge}Y / {patientGender})</span>
                    <span>•</span>
                    <span className="text-teal-600 dark:text-teal-400 font-mono text-[10px]">Gemini 4 Argon Grounded</span>
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
                /* Dynamic Clinical Pipeline Progress Animation */
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-lg mx-auto">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-[var(--color-primary)] animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500" />
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-theme mb-2">
                    Synthesizing Clinical Intelligence
                  </h3>
                  <p className="text-xs text-muted leading-relaxed mb-6">
                    Gemini 4 Argon is actively correlating your longitudinal biomarker history, active medications, and multi-specialist consultations into an accurate clinical handover.
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-surface border border-surface rounded-full h-2 mb-4 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-teal-400 via-emerald-500 to-indigo-500 rounded-full"
                      initial={{ width: "15%" }}
                      animate={{ width: `${(pipelineStep + 1) * 25}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Dynamic Telemetry Status */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-700 dark:text-teal-300">
                    <Activity className="w-3.5 h-3.5 animate-pulse shrink-0" />
                    <span className="truncate">{PIPELINE_STAGES[pipelineStep]}</span>
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
                      textToNarrate={sbar}
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
                            Situation &amp; Primary Urgency
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-theme leading-relaxed whitespace-pre-wrap">
                          {parsedSections?.situation || "No situation data extracted."}
                        </p>
                      </div>

                      {/* B: Background */}
                      <div className="bg-surface/60 border border-purple-500/25 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 font-black text-xs flex items-center justify-center">
                            B
                          </span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Clinical Background, Regimen &amp; Trajectory
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-theme leading-relaxed whitespace-pre-wrap">
                          {parsedSections?.background || "Longitudinal records and medical history documented."}
                        </p>
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
                        <p className="text-xs sm:text-sm text-theme leading-relaxed whitespace-pre-wrap">
                          {parsedSections?.assessment || "Laboratory evaluations and multi-specialist assessments synthesized."}
                        </p>
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
                        <p className="text-xs sm:text-sm text-theme leading-relaxed whitespace-pre-wrap">
                          {parsedSections?.recommendation || "Review findings with primary physician for treatment plan."}
                        </p>
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
                        <p className="text-xs sm:text-sm text-theme leading-relaxed whitespace-pre-wrap">
                          {parsedSections?.patientOverview || parsedSections?.situation || "Your overall health summary in clear, easy terms."}
                        </p>
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
                          <p className="text-xs sm:text-sm text-theme leading-relaxed whitespace-pre-wrap">
                            {parsedSections.patientResults}
                          </p>
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
                          <p className="text-xs sm:text-sm text-theme leading-relaxed whitespace-pre-wrap">
                            {parsedSections.patientMeds}
                          </p>
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
                          <p className="text-xs sm:text-sm text-theme leading-relaxed whitespace-pre-wrap">
                            {parsedSections.patientQuestions}
                          </p>
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
                          <p className="text-xs sm:text-sm text-theme leading-relaxed whitespace-pre-wrap">
                            {parsedSections.patientLifestyle}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Combined Dossier Raw View */}
                  {activeTab === "combined" && (
                    <div className="bg-surface/40 p-6 rounded-2xl border border-surface shadow-inner">
                      <pre className="text-theme leading-relaxed text-xs sm:text-sm whitespace-pre-wrap font-sans selection:bg-teal-500/20">
                        {sbar}
                      </pre>
                    </div>
                  )}

                  {/* Hidden Export Container: Captured by html-to-image with 100% Brand Fidelity */}
                  <div id="sbar-export-container" className="hidden">
                    <div style={{ backgroundColor: "#FFFFFF", color: "#0F172A", padding: "32px", fontFamily: "Arial, sans-serif" }}>
                      {/* Brand Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0F2647", paddingBottom: "16px", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "42px", height: "42px", backgroundColor: "#0A192F", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                              <path d="m9 12 2 2 4-4"/>
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontSize: "18px", fontWeight: "900", color: "#0F172A" }}>AEGIS HEALTH AI</div>
                            <div style={{ fontSize: "10px", color: "#475569" }}>Clinical-Grade Medical Intelligence · Member of NVIDIA Inception Program</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#0F2647" }}>CLINICAL DOSSIER &amp; SBAR</div>
                          <div style={{ fontSize: "9px", color: "#059669", fontWeight: "bold" }}>DATE: {dateStr}</div>
                        </div>
                      </div>

                      {/* Demographics */}
                      <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "10px 14px", marginBottom: "18px", display: "flex", justifyContent: "space-between" }}>
                        <div><strong style={{ fontSize: "10px", color: "#64748B" }}>PATIENT:</strong> <span style={{ fontSize: "13px", fontWeight: "bold" }}>{patientName}</span></div>
                        <div><strong style={{ fontSize: "10px", color: "#64748B" }}>AGE/SEX:</strong> <span style={{ fontSize: "12px", fontWeight: "bold" }}>{patientAge} YRS / {patientGender}</span></div>
                        <div><strong style={{ fontSize: "10px", color: "#64748B" }}>ABHA ID:</strong> <span style={{ fontSize: "11px", fontFamily: "monospace" }}>{abhaId}</span></div>
                      </div>

                      {/* Full Formatted Text */}
                      <div style={{ fontSize: "11px", lineHeight: "1.55", color: "#1E293B", whiteSpace: "pre-wrap" }}>
                        {sbar}
                      </div>

                      {/* Signature Footer */}
                      <div style={{ marginTop: "32px", borderTop: "1.5px dashed #CBD5E1", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          <div style={{ fontSize: "9px", fontWeight: "bold" }}>Synthesized via Aegis Clinical Engine (Gemini 4 Argon)</div>
                          <div style={{ fontSize: "8px", color: "#64748B" }}>NHA ABDM Compliant · Not a replacement for clinical consultation</div>
                        </div>
                        <div style={{ textAlign: "center", width: "180px" }}>
                          <div style={{ height: "28px", borderBottom: "1px solid #0F2647", marginBottom: "4px" }} />
                          <div style={{ fontSize: "9px", fontWeight: "bold" }}>ATTENDING PHYSICIAN</div>
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
                onClick={handleDownloadPDF}
                disabled={!sbar || isLoading || isExporting}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-surface bg-surface hover:bg-surface/80 text-theme transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isExporting ? <Loader2 size={14} className="animate-spin text-[var(--color-primary)]" /> : exportSuccess ? <CheckCircle2 size={14} className="text-emerald-500" /> : <FileDown size={14} />}
                <span>{isExporting ? "Generating PDF..." : exportSuccess ? "Downloaded!" : "Download SBAR PDF"}</span>
              </button>

              <button
                onClick={async () => {
                  if (typeof navigator.share === "function") {
                    try {
                      await navigator.share({
                        title: "Clinical Handover & Patient Summary — Aegis Health AI",
                        text: sbar || "",
                      });
                    } catch (err) {
                      if (import.meta.env.DEV) console.log("Share canceled:", err);
                    }
                  } else {
                    navigator.clipboard.writeText(sbar || "");
                    alert("Clinical summary copied to clipboard!");
                  }
                }}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[var(--color-primary)]/20"
              >
                <Share2 size={14} />
                <span>Share Summary</span>
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
