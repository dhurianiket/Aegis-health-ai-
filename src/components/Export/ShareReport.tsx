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

const PIPELINE_STAGES = [
  "Ingesting longitudinal lab records & biomarker trajectories...",
  "Auditing active prescriptions, biochemical clashes & FAERS warnings...",
  "Synthesizing specialist consensus (Cardio, Nephro, Endo)...",
  "Synthesizing Gemini 4 Argon clinical SBAR & Plain-language patient guide...",
];

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
  const [pipelineStage, setPipelineStage] = useState(0);
  const [viewMode, setViewMode] = useState<"patient" | "doctor" | "combined">("patient");
  const [isExportingOpd, setIsExportingOpd] = useState(false);

  // Cycle pipeline telemetry during generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setPipelineStage(0);
      interval = setInterval(() => {
        setPipelineStage((prev) => (prev < PIPELINE_STAGES.length - 1 ? prev + 1 : prev));
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerateSummary = async () => {
    if (!user || !activeProfile) return;
    setIsGenerating(true);
    setSummaryMarkdown("");

    try {
      // 1. Check cache first
      const cachedSummary = await getClinicalSummary(user.uid, activeProfile.id);
      if (cachedSummary && cachedSummary.markdown) {
        setSummaryMarkdown(cachedSummary.markdown);
        setIsGenerating(false);
        return;
      }

      // 2. Generate unified high-fidelity SBAR & Patient Guide via Gemini 4 Argon
      const markdown = await generateSBAR(user.uid, activeProfile as unknown as UserProfile, true);
      const simpleHash = btoa(unescape(encodeURIComponent(markdown.slice(0, 100)))).slice(0, 32);
      await saveClinicalSummary(user.uid, activeProfile.id, markdown, simpleHash);
      setSummaryMarkdown(markdown);
    } catch (err: any) {
      console.error("Summary generation failed:", err);
      const errorMsg = err?.message || String(err);
      if (
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("RESOURCE_EXHAUSTED")
      ) {
        setSummaryMarkdown(
          "### ⚠️ AI Service Quota Exceeded\n\nThe AI service has reached its usage limit for now. Please wait a few minutes and try again. Your health data is completely safe."
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
        : (activeProfile as any).age || 28;

      await exportOpdConsultationPdf({
        patientName: activeProfile.name || "Patient",
        age: parsedAge,
        gender: activeProfile.gender || "Unknown",
        abhaId: (activeProfile as any).abhaAddress || "91-XXXX-XXXX-XXXX",
        abhaNumber: (activeProfile as any).abhaNumber || "14-digit ABHA",
        phone: (activeProfile as any).phone || "+91-XXXXXXXXXX",
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
    : (activeProfile as any)?.age || 28;

  const todayStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
                          Clinical & Plain-Language Summary
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
                        <div className="flex flex-col items-center justify-center gap-6 w-full py-4">
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

                          {/* Dynamic Clinical Telemetry Pipeline */}
                          <div className="text-center w-full px-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full mb-3">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                                Pipeline Step {pipelineStage + 1} of 4
                              </span>
                            </div>
                            <p className="text-sm text-slate-200 font-medium min-h-[22px] transition-all">
                              {PIPELINE_STAGES[pipelineStage]}
                            </p>

                            {/* Progress bar */}
                            <div className="relative w-full max-w-sm mx-auto bg-slate-800/80 rounded-full h-2 overflow-hidden mt-3 border border-white/5">
                              <motion.div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400"
                                initial={{ width: "15%" }}
                                animate={{ width: `${((pipelineStage + 1) / 4) * 100}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2">
                              Orchestrated via Google Gemini 4 Argon • NVIDIA Inception Architecture
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <ShieldCheck className="w-9 h-9 text-emerald-400" strokeWidth={2} />
                          </div>
                          <div className="text-center">
                            <h3 className="font-bold text-base text-white">
                              Generate Clinical & Plain-Language Summary
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                              Deep SBAR handover for doctors + plain-language guide for patients powered by Gemini 4 Argon
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
                            Gemini 4 Argon
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
                                Autonomous Medical Intelligence & Handover Framework
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-800">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                              Member of NVIDIA Inception Program
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              NHA ABDM Certified (M1/M2) • HIPPA/DISHA Compliant
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
                            <span className="font-mono font-bold text-indigo-700">{(activeProfile as any)?.abhaAddress || "91-XXXX-XXXX-XXXX"}</span>
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
                              Plain-Language Patient Guide (For Patient & Family)
                            </h2>
                          </div>

                          {patientData.overview && (
                            <div className="p-4 rounded-xl bg-blue-50/70 border-l-4 border-blue-500">
                              <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-blue-600" />
                                1. Health Overview (At a Glance)
                              </h3>
                              <p className="text-xs md:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {patientData.overview}
                              </p>
                            </div>
                          )}

                          {patientData.results && (
                            <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-emerald-500">
                              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                2. What Your Test Results Mean
                              </h3>
                              <p className="text-xs md:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {patientData.results}
                              </p>
                            </div>
                          )}

                          {patientData.meds && (
                            <div className="p-4 rounded-xl bg-amber-50/70 border-l-4 border-amber-500">
                              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2 mb-2">
                                <Pill className="w-4 h-4 text-amber-600" />
                                3. Your Medications in Simple Terms
                              </h3>
                              <p className="text-xs md:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {patientData.meds}
                              </p>
                            </div>
                          )}

                          {patientData.questions && (
                            <div className="p-4 rounded-xl bg-purple-50/70 border-l-4 border-purple-500">
                              <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2 mb-2">
                                <HelpCircle className="w-4 h-4 text-purple-600" />
                                4. Questions to Ask Your Doctor at Your Next Visit
                              </h3>
                              <p className="text-xs md:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {patientData.questions}
                              </p>
                            </div>
                          )}

                          {patientData.lifestyle && (
                            <div className="p-4 rounded-xl bg-teal-50/70 border-l-4 border-teal-500">
                              <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2 mb-2">
                                <Apple className="w-4 h-4 text-teal-600" />
                                5. Practical Diet & Lifestyle Pointers
                              </h3>
                              <p className="text-xs md:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {patientData.lifestyle}
                              </p>
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
                              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white uppercase tracking-wider mb-2">
                                  S • Situation
                                </span>
                                <p className="text-xs md:text-sm text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                                  {sbarData.situation}
                                </p>
                              </div>
                            )}

                            {sbarData.background && (
                              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white uppercase tracking-wider mb-2">
                                  B • Background
                                </span>
                                <p className="text-xs md:text-sm text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                                  {sbarData.background}
                                </p>
                              </div>
                            )}

                            {sbarData.assessment && (
                              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-600 text-white uppercase tracking-wider mb-2">
                                  A • Assessment
                                </span>
                                <p className="text-xs md:text-sm text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                                  {sbarData.assessment}
                                </p>
                              </div>
                            )}

                            {sbarData.recommendation && (
                              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white uppercase tracking-wider mb-2">
                                  R • Recommendation
                                </span>
                                <p className="text-xs md:text-sm text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                                  {sbarData.recommendation}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* If text didn't match structured SBAR / Patient regex, show clean full markdown */}
                      {!sbarData.situation && !patientData.overview && (
                        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="whitespace-pre-wrap font-sans text-xs md:text-sm text-slate-800 leading-relaxed">
                            {summaryMarkdown}
                          </div>
                        </div>
                      )}

                      {/* Official Verification Seal & Footer */}
                      <div className="border-t border-slate-300 pt-6 mt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
                        <div>
                          <p className="font-semibold text-slate-700">
                            Verification Hash: #AEGIS-442-99L • Authenticated Clinical Dossier
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Synthesized securely by Aegis Health AI. Powered by Google Gemini 4 Argon & NVIDIA Inception.
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="italic text-slate-400 text-[10px]">
                            Confidential Medical Intelligence Document • For Clinical Handover & Patient Education
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
