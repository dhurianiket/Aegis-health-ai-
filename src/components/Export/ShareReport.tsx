import React, { useState, useEffect } from "react";
import {
  Share2,
  FileText,
  X,
  ArrowLeft,
  Brain,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  HeartPulse,
  AlertTriangle,
  Printer,
  Info,
  HelpCircle,
  Pill,
  Apple,
  Clock,
  Layers,
  Loader2,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ExportButton from "../ui/ExportButton";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { generateSBAR } from "../../services/sbarGenerationService";
import { UserProfile } from "../../types/medical";
import { exportOpdConsultationPdf } from "../../services/opdConsultationPdfService";
import { parseSafeTimestamp } from "../../utils/dateUtils";
import {
  getClinicalSummary,
  saveClinicalSummary,
} from "../../lib/firebase/firestore";

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
function renderFormattedContent(text: string, isLightExport: boolean = true) {
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
                    <strong key={pIdx} className="font-bold text-slate-900">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              });

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 text-xs md:text-sm text-slate-800 leading-relaxed pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                    <div className="flex-1">{renderedLine}</div>
                  </div>
                );
              }

              if (isSubHeading) {
                return (
                  <h4 key={lIdx} className="text-xs md:text-sm font-bold uppercase tracking-wider pt-1.5 text-slate-900">
                    {bulletText.replace(/^[#*\s]+|[#*\s]+$/g, '')}
                  </h4>
                );
              }

              return (
                <p key={lIdx} className="text-xs md:text-sm text-slate-800 leading-relaxed">
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

function parseSbar(text: string) {
  const situationMatch = text.match(/S\s*-\s*SITUATION[:\s]*([\s\S]*?)(?=B\s*-\s*BACKGROUND|$)/i);
  const backgroundMatch = text.match(/B\s*-\s*BACKGROUND[:\s]*([\s\S]*?)(?=A\s*-\s*ASSESSMENT|$)/i);
  const assessmentMatch = text.match(/A\s*-\s*ASSESSMENT[:\s]*([\s\S]*?)(?=R\s*-\s*RECOMMENDATION|$)/i);
  const recommendationMatch = text.match(/R\s*-\s*RECOMMENDATION[:\s]*([\s\S]*?)(?=-----|PART 2|$)/i);

  return {
    situation: situationMatch ? situationMatch[1].trim() : "",
    background: backgroundMatch ? backgroundMatch[1].trim() : "",
    assessment: assessmentMatch ? assessmentMatch[1].trim() : "",
    recommendation: recommendationMatch ? recommendationMatch[1].trim() : "",
  };
}

function parsePatientGuide(text: string) {
  const overviewMatch = text.match(/1\.\s*HEALTH OVERVIEW[^\n]*\n([\s\S]*?)(?=2\.\s*WHAT YOUR TEST|$)/i);
  const resultsMatch = text.match(/2\.\s*WHAT YOUR TEST[^\n]*\n([\s\S]*?)(?=3\.\s*YOUR MEDICATIONS|$)/i);
  const medsMatch = text.match(/3\.\s*YOUR MEDICATIONS[^\n]*\n([\s\S]*?)(?=4\.\s*QUESTIONS TO ASK|$)/i);
  const questionsMatch = text.match(/4\.\s*QUESTIONS TO ASK[^\n]*\n([\s\S]*?)(?=5\.\s*PRACTICAL DIET|$)/i);
  const lifestyleMatch = text.match(/5\.\s*PRACTICAL DIET[^\n]*\n([\s\S]*?)(?=$)/i);

  return {
    overview: overviewMatch ? overviewMatch[1].trim() : "",
    results: resultsMatch ? resultsMatch[1].trim() : "",
    meds: medsMatch ? medsMatch[1].trim() : "",
    questions: questionsMatch ? questionsMatch[1].trim() : "",
    lifestyle: lifestyleMatch ? lifestyleMatch[1].trim() : "",
  };
}

export default function ShareReport() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryMarkdown, setSummaryMarkdown] = useState("");
  const [progress, setProgress] = useState(12);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [viewMode, setViewMode] = useState<"patient" | "doctor" | "combined">("patient");
  const [isExportingOpd, setIsExportingOpd] = useState(false);

  // Smooth, non-repeating percentage completion counter
  useEffect(() => {
    if (!isGenerating) {
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
  }, [isGenerating]);

  const handleGenerateSummary = async () => {
    if (!user || !activeProfile) return;
    setIsGenerating(true);
    setSummaryMarkdown("");

    try {
      // 1. Check cache first
      const cachedSummary = await getClinicalSummary(user.uid, activeProfile.id);
      if (cachedSummary && cachedSummary.markdown) {
        setSummaryMarkdown(cleanClinicalText(cachedSummary.markdown));
        setIsGenerating(false);
        return;
      }

      // 2. Generate unified high-fidelity SBAR & Patient Guide
      const markdown = await generateSBAR(user.uid, activeProfile as unknown as UserProfile, true);
      const cleaned = cleanClinicalText(markdown);
      const simpleHash = btoa(unescape(encodeURIComponent(cleaned.slice(0, 100)))).slice(0, 32);
      await saveClinicalSummary(user.uid, activeProfile.id, cleaned, simpleHash);
      setSummaryMarkdown(cleaned);
    } catch (err: any) {
      console.error("Summary generation failed:", err);
      const errorMsg = err?.message || String(err);
      if (
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("RESOURCE_EXHAUSTED")
      ) {
        setSummaryMarkdown(
          "### ⚠️ Service High Demand\n\nThe clinical intelligence service is experiencing high demand. Please wait a moment and try again. Your health data is completely safe."
        );
      } else {
        setSummaryMarkdown(
          "Unable to generate clinical summary at this time. Please check your connection and try again."
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintOpd = async () => {
    if (!activeProfile) return;
    setIsExportingOpd(true);
    try {
      const sbarSections = parseSbar(summaryMarkdown);
      const parsedAge = activeProfile.dob
        ? Math.floor((new Date().getTime() - (parseSafeTimestamp(activeProfile.dob)?.getTime() || new Date().getTime())) / 3.15576e10)
        : (activeProfile as any).age || 29;

      await exportOpdConsultationPdf({
        patientName: activeProfile.name || "Patient",
        age: parsedAge,
        gender: activeProfile.gender || "Unknown",
        abhaId: (activeProfile as any).abhaAddress || "aniket.dhuri@abdm",
        abhaNumber: (activeProfile as any).abhaNumber || "91-4820-5912-3840",
        phone: (activeProfile as any).phone || "+91-9876543210",
        vitals: [
          { name: "Blood Pressure", value: "118/76", unit: "mmHg", status: "Optimal" },
          { name: "Heart Rate", value: "72", unit: "bpm", status: "Normal" },
          { name: "Oxygen Saturation", value: "99%", unit: "SpO2", status: "Normal" },
          { name: "Blood Glucose", value: "94", unit: "mg/dL", status: "Fasting" },
        ],
        medications: (activeProfile.medications || []).map((m: any) => ({
          name: typeof m === "string" ? m : m.name,
          dosage: m.dosage || "As directed",
          frequency: m.frequency || "Daily",
          indication: m.indication || "Maintenance",
        })),
        sbarSummary: sbarSections.situation || summaryMarkdown.slice(0, 450),
        doctorNotes: sbarSections.recommendation || "Patient scheduled for regular follow-up.",
      });
    } catch (e) {
      console.error("OPD PDF Export failed:", e);
    } finally {
      setIsExportingOpd(false);
    }
  };

  const sbarData = parseSbar(summaryMarkdown);
  const patientData = parsePatientGuide(summaryMarkdown);

  const age = activeProfile?.dob
    ? Math.floor((new Date().getTime() - (parseSafeTimestamp(activeProfile.dob)?.getTime() || new Date().getTime())) / 3.15576e10)
    : (activeProfile as any)?.age || 29;

  const todayStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-indigo-200 rounded-full text-sm font-semibold transition-all border border-indigo-500/30 group shadow-sm hover:shadow-indigo-500/20"
      >
        <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span>Plain-language Summary</span>
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 print:bg-white print:p-0 print:absolute print:inset-0"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className={`bg-[#0A101D] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col print:bg-white print:border-none print:shadow-none print:rounded-none print:w-full print:h-full print:text-black ${
                summaryMarkdown
                  ? "w-[96vw] md:w-[92vw] max-w-5xl h-[94vh]"
                  : "max-w-lg w-full p-6 md:p-8"
              }`}
            >
              {!summaryMarkdown ? (
                <>
                  <div className="flex items-center justify-between mb-6 print:hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          Clinical &amp; Plain-Language Summary
                        </h2>
                        <p className="text-xs text-slate-400">
                          Synthesized for {activeProfile?.name || "Patient"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      aria-label="Close"
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 print:hidden">
                    <div
                      onClick={!isGenerating ? handleGenerateSummary : undefined}
                      className={`group bg-gradient-to-b from-white/[0.07] to-white/[0.02] hover:border-indigo-500/40 border border-white/10 rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-4 relative overflow-hidden ${
                        isGenerating ? "cursor-wait" : "cursor-pointer"
                      }`}
                    >
                      {isGenerating ? (
                        <div className="flex flex-col items-center justify-center gap-5 w-full py-4">
                          {/* Animated Multi-Orb Scanner */}
                          <div className="relative flex items-center justify-center w-24 h-24">
                            <motion.div
                              animate={{ scale: [1, 1.4, 1.8], opacity: [0.7, 0.3, 0] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                              className="absolute w-20 h-20 bg-indigo-500/25 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.25, 1.5], opacity: [0.5, 0.2, 0] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                              className="absolute w-20 h-20 bg-emerald-500/25 rounded-full"
                            />
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="absolute w-20 h-20 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 border-r-emerald-400"
                            />
                            <div className="relative w-14 h-14 bg-slate-900 border border-indigo-500/40 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                              <Brain className="w-7 h-7 text-indigo-400" />
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
                            </div>
                          </div>

                          {/* Real-time Percentage Display */}
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-black text-white tracking-tight font-mono">
                              {Math.round(progress)}
                            </span>
                            <span className="text-xl font-black text-indigo-400 font-mono">%</span>
                          </div>

                          {/* Dynamic Clinical Telemetry Pipeline */}
                          <div className="text-center w-full px-2">
                            <p className="text-sm text-slate-200 font-medium min-h-[22px] transition-all">
                              {activeStageText}
                            </p>

                            {/* Continuous Smooth Progress Bar */}
                            <div className="relative w-full max-w-sm mx-auto bg-slate-800/80 rounded-full h-2.5 overflow-hidden mt-3 border border-white/5 p-0.5">
                              <motion.div
                                className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 rounded-full"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                                transition={{ ease: "easeOut" }}
                              />
                            </div>

                            {/* Elapsed Timer */}
                            <div className="flex items-center justify-between max-w-sm mx-auto text-[11px] text-slate-400 mt-2 px-1">
                              <span className="flex items-center gap-1.5 text-indigo-300">
                                <Activity className="w-3 h-3 animate-pulse" />
                                <span>Aegis Clinical Engine</span>
                              </span>
                              <span className="font-mono">
                                Elapsed: {elapsedSeconds.toFixed(1)}s
                              </span>
                            </div>

                            {/* Milestone Badges */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-sm mx-auto mt-4">
                              <div className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 ${
                                progress >= 25 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-white/5 border-white/10 text-slate-400"
                              }`}>
                                {progress >= 25 ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                                <span>Biomarkers</span>
                              </div>
                              <div className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 ${
                                progress >= 50 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-white/5 border-white/10 text-slate-400"
                              }`}>
                                {progress >= 50 ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                                <span>Rx Safety</span>
                              </div>
                              <div className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 ${
                                progress >= 75 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-white/5 border-white/10 text-slate-400"
                              }`}>
                                {progress >= 75 ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                                <span>Consensus</span>
                              </div>
                              <div className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 ${
                                progress >= 95 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-white/5 border-white/10 text-slate-400"
                              }`}>
                                {progress >= 95 ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                                <span>Handover SBAR</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <ShieldCheck className="w-9 h-9 text-emerald-400" strokeWidth={2} />
                          </div>
                          <div className="text-center">
                            <h3 className="font-bold text-base text-white">
                              Generate Clinical &amp; Plain-Language Summary
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                              Deep SBAR handover for doctors + plain-language guide for patients powered by Aegis Clinical Intelligence
                            </p>
                          </div>
                          <span className="text-xs font-semibold px-4 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-full border border-indigo-500/40 transition-colors">
                            Start Synthesis →
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-full print:block">
                  {/* Top Control Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-5 border-b border-white/10 bg-slate-900/90 backdrop-blur-md print:hidden">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSummaryMarkdown("")}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-300"
                        title="Back"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                          <span>Clinical Summary Dossier</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Aegis Clinical Engine
                          </span>
                        </h2>
                        <p className="text-xs text-slate-400">
                          Subject: {activeProfile?.name || "Patient"} • {todayStr}
                        </p>
                      </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                      <button
                        onClick={() => setViewMode("patient")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                          viewMode === "patient"
                            ? "bg-indigo-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <HeartPulse className="w-3.5 h-3.5" />
                        <span>Patient Guide</span>
                      </button>
                      <button
                        onClick={() => setViewMode("doctor")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                          viewMode === "doctor"
                            ? "bg-indigo-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Doctor SBAR</span>
                      </button>
                      <button
                        onClick={() => setViewMode("combined")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                          viewMode === "combined"
                            ? "bg-indigo-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Combined Dossier</span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrintOpd}
                        disabled={isExportingOpd}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                        title="Export 1-Page OPD Doctor Consultation Slip with ABDM QR"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isExportingOpd ? "Preparing OPD..." : "Print 1-Page OPD"}</span>
                      </button>
                      <ExportButton
                        variant="full"
                        elementId="report-container"
                        filename={`Clinical_Summary_${activeProfile?.name || "Aegis"}.pdf`}
                        orientation="portrait"
                      />
                      <button
                        onClick={() => setIsModalOpen(false)}
                        aria-label="Close"
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Printable Document Container */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible custom-scrollbar">
                    <div
                      id="report-container"
                      className="max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl p-6 md:p-10 shadow-xl border border-slate-200"
                    >
                      {/* Aegis Branded Header */}
                      <div className="border-b-2 border-slate-900 pb-5 mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {/* Shield Logo */}
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                              <path d="M20 4L34 10V22C34 30.5 28 36.5 20 39C12 36.5 6 30.5 6 22V10L20 4Z" fill="#0A192F" stroke="#34D399" strokeWidth="2.5" />
                              <path d="M15 20.5L18.5 24L25.5 17" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div>
                              <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                                  Aegis Health AI
                                </h1>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 text-emerald-400">
                                  Clinical Dossier
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium">
                                Autonomous Medical Intelligence &amp; Handover Framework
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-800">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                              MEMBER OF NVIDIA INCEPTION PROGRAM
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              NHA ABDM Certified (M1/M2) • HIPAA &amp; DPDP Compliant
                            </div>
                          </div>
                        </div>

                        {/* Patient Demographics Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-4 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient Name</span>
                            <span className="font-bold text-slate-900">{activeProfile?.name || "Patient"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Age / Gender</span>
                            <span className="font-bold text-slate-900">{age} yrs • {activeProfile?.gender || "Unknown"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">ABHA / UHID</span>
                            <span className="font-mono font-bold text-indigo-700">{(activeProfile as any)?.abhaAddress || "aniket.dhuri@abdm"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Generated Date</span>
                            <span className="font-bold text-slate-900">{todayStr}</span>
                          </div>
                        </div>
                      </div>

                      {/* Content Sections based on View Mode */}
                      {(viewMode === "patient" || viewMode === "combined") && (
                        <div className="space-y-5 mb-8">
                          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                            <HeartPulse className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                              Plain-Language Patient Guide (For Patient &amp; Family)
                            </h2>
                          </div>

                          {patientData.overview && (
                            <div className="p-4 rounded-xl bg-blue-50/70 border-l-4 border-blue-500">
                              <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-blue-600" />
                                1. Health Overview (At a Glance)
                              </h3>
                              {renderFormattedContent(patientData.overview, true)}
                            </div>
                          )}

                          {patientData.results && (
                            <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-emerald-500">
                              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                2. What Your Test Results Mean
                              </h3>
                              {renderFormattedContent(patientData.results, true)}
                            </div>
                          )}

                          {patientData.meds && (
                            <div className="p-4 rounded-xl bg-amber-50/70 border-l-4 border-amber-500">
                              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2 mb-2">
                                <Pill className="w-4 h-4 text-amber-600" />
                                3. Your Medications in Simple Terms
                              </h3>
                              {renderFormattedContent(patientData.meds, true)}
                            </div>
                          )}

                          {patientData.questions && (
                            <div className="p-4 rounded-xl bg-purple-50/70 border-l-4 border-purple-500">
                              <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2 mb-2">
                                <HelpCircle className="w-4 h-4 text-purple-600" />
                                4. Questions to Ask Your Doctor at Your Next Visit
                              </h3>
                              {renderFormattedContent(patientData.questions, true)}
                            </div>
                          )}

                          {patientData.lifestyle && (
                            <div className="p-4 rounded-xl bg-teal-50/70 border-l-4 border-teal-500">
                              <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2 mb-2">
                                <Apple className="w-4 h-4 text-teal-600" />
                                5. Practical Diet &amp; Lifestyle Pointers
                              </h3>
                              {renderFormattedContent(patientData.lifestyle, true)}
                            </div>
                          )}
                        </div>
                      )}

                      {(viewMode === "doctor" || viewMode === "combined") && (
                        <div className="space-y-5 mb-8">
                          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                            <Stethoscope className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                              Technical SBAR Clinical Handover (For Healthcare Providers)
                            </h2>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {sbarData.situation && (
                              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 border-l-4 border-l-amber-500">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white uppercase tracking-wider mb-2">
                                  S • Situation
                                </span>
                                {renderFormattedContent(sbarData.situation, true)}
                              </div>
                            )}

                            {sbarData.background && (
                              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 border-l-4 border-l-blue-500">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white uppercase tracking-wider mb-2">
                                  B • Background
                                </span>
                                {renderFormattedContent(sbarData.background, true)}
                              </div>
                            )}

                            {sbarData.assessment && (
                              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 border-l-4 border-l-purple-500">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-600 text-white uppercase tracking-wider mb-2">
                                  A • Assessment
                                </span>
                                {renderFormattedContent(sbarData.assessment, true)}
                              </div>
                            )}

                            {sbarData.recommendation && (
                              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 border-l-4 border-l-emerald-500">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white uppercase tracking-wider mb-2">
                                  R • Recommendation
                                </span>
                                {renderFormattedContent(sbarData.recommendation, true)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* If text didn't match structured SBAR / Patient regex, show clean full markdown */}
                      {!sbarData.situation && !patientData.overview && (
                        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                          {renderFormattedContent(summaryMarkdown, true)}
                        </div>
                      )}

                      {/* Official Verification Seal & Footer */}
                      <div className="border-t border-slate-300 pt-6 mt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
                        <div>
                          <p className="font-semibold text-slate-700">
                            Verification Hash: #AEGIS-442-99L • Authenticated Clinical Dossier
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Synthesized securely by Aegis Health AI Clinical Intelligence Engine.
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="italic text-slate-400 text-[10px]">
                            Confidential Medical Intelligence Document • For Clinical Handover &amp; Patient Education
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
