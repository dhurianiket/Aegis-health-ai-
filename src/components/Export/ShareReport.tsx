import React, { useState, useRef } from "react";
import {
  Share2,
  Download,
  FileText,
  CheckCircle2,
  X,
  ArrowLeft,
  Brain,
  Activity,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ExportButton from "../ui/ExportButton";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { generateClinicalSummary } from "../../services/ai/gemini";
import {
  getLabHistory,
  getDocuments,
  getMedications,
  getLatestInsights,
  getClinicalSummary,
  saveClinicalSummary,
} from "../../lib/firebase/firestore";

export default function ShareReport() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryMarkdown, setSummaryMarkdown] = useState("");

  const handleGenerateSummary = async () => {
    if (!user || !activeProfile) return;
    setIsGenerating(true);
    setSummaryMarkdown("");

    try {
      const [labs, documents, medications, insights] = await Promise.all([
        getLabHistory(user.uid, undefined, activeProfile.id),
        getDocuments(user.uid, activeProfile.id),
        getMedications(user.uid, activeProfile.id),
        getLatestInsights(user.uid, activeProfile.id),
      ]);

      const pLabs = labs || [];
      const pDocs = documents || [];
      const pMeds = medications || [];
      const pIns = insights || [];

      // Calculate a rough "hash" based on length and IDs
      const dataHashStr =
        pLabs.map((l) => l.id).join("") +
        pDocs.map((d) => d.id).join("") +
        pMeds.map((m) => m.id).join("") +
        pIns.map((i) => i.id).join("") +
        pLabs.length +
        pDocs.length +
        pMeds.length +
        pIns.length;

      const currentDataHash = btoa(dataHashStr).slice(0, 64);

      const cachedSummary = await getClinicalSummary(
        user.uid,
        activeProfile.id,
      );

      if (cachedSummary && cachedSummary.dataHash === currentDataHash) {
        setSummaryMarkdown(cachedSummary.markdown);
      } else {
        const markdown = await generateClinicalSummary(
          activeProfile,
          pLabs,
          pDocs,
          pMeds,
          pIns,
        );
        await saveClinicalSummary(
          user.uid,
          activeProfile.id,
          markdown,
          currentDataHash,
        );
        setSummaryMarkdown(markdown);
      }
    } catch (err: any) {
      console.error("Summary generation failed:", err);
      // Catch quota errors and provide a clear message
      const errorMsg = err?.message || String(err);
      if (
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("RESOURCE_EXHAUSTED")
      ) {
        setSummaryMarkdown(
          "### ⚠️ AI Service Quota Exceeded\\n\\nThe AI service has reached its usage limit for now. Please wait a few minutes and try again. Your data is perfectly safe.",
        );
      } else {
        setSummaryMarkdown(
          "Failed to generate summary. Please try again later.",
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-indigo-200 rounded-full text-sm font-semibold transition-all border border-indigo-500/30 group"
      >
        <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span>AI Dr. Summary</span>
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 print:bg-white print:p-0 print:absolute print:inset-0 "
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={`bg-[#0F172A] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col print:bg-white print:border-none print:shadow-none print:rounded-none print:w-full print:h-full print:text-black ${
                summaryMarkdown
                  ? "w-[95vw] md:w-[90vw] h-[95vh] md:h-[90vh]"
                  : "max-w-lg w-full p-6 md:p-8"
              }`}
            >
              {!summaryMarkdown ? (
                <>
                  <div className="flex items-center justify-between mb-8 print:hidden">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                      <Share2 className="text-indigo-400 w-5 h-5" />
                      Export Health Records
                    </h2>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      aria-label="Close share report"
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mb-8 print:hidden">
                    <div
                      onClick={handleGenerateSummary}
                      className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center justify-center gap-4 relative overflow-hidden h-full min-h-[140px] md:min-h-[160px]"
                    >
                      {isGenerating ? (
                        <div className="flex flex-col items-center justify-center gap-6 w-full py-4">
                          <div className="relative flex items-center justify-center">
                            {/* Outer pulsing ring */}
                            <motion.div
                              animate={{
                                scale: [1, 1.5, 2],
                                opacity: [0.8, 0.3, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeOut",
                              }}
                              className="absolute w-16 h-16 bg-indigo-500/20 rounded-full"
                            />
                            <motion.div
                              animate={{
                                scale: [1, 1.3, 1.8],
                                opacity: [0.6, 0.2, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeOut",
                                delay: 0.5,
                              }}
                              className="absolute w-16 h-16 bg-blue-500/20 rounded-full"
                            />

                            {/* Inner rotating scanner */}
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="absolute w-16 h-16 rounded-full border border-indigo-500/20 border-t-indigo-400 border-r-blue-400"
                            />

                            {/* Core icon container */}
                            <motion.div
                              className="relative w-12 h-12 bg-slate-900 border border-indigo-500/30 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                              animate={{
                                boxShadow: [
                                  "0 0 15px rgba(99,102,241,0.3)",
                                  "0 0 25px rgba(99,102,241,0.6)",
                                  "0 0 15px rgba(99,102,241,0.3)",
                                ],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              <Brain className="w-6 h-6 text-indigo-400 absolute z-10" />
                              <motion.div
                                className="absolute -top-1 -right-1 z-20"
                                animate={{
                                  opacity: [0, 1, 0],
                                  scale: [0.8, 1.2, 0.8],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: 1,
                                }}
                              >
                                <Sparkles className="w-4 h-4 text-blue-300" />
                              </motion.div>
                              <motion.div
                                animate={{
                                  height: ["0%", "100%", "0%"],
                                  top: ["0%", "0%", "100%"],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                className="absolute left-0 w-full bg-indigo-400/20 rounded-full z-0"
                              />
                            </motion.div>
                          </div>

                          <div className="text-center w-full px-2">
                            <div className="flex items-center justify-center gap-2 mb-2 h-5">
                              <Activity className="w-3 h-3 text-indigo-400 animate-pulse shrink-0" />
                              <p className="text-xs text-indigo-300 font-medium truncate">
                                Generating clinical summary...
                              </p>
                            </div>

                            {/* DNA-like progress bar */}
                            <div className="relative w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden backdrop-blur-sm border border-white/5">
                              <motion.div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-400"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 15, ease: "linear" }}
                              />
                              {/* Shimmer effect */}
                              <motion.div
                                animate={{ x: ["-100%", "300%"] }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Activity className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform" />
                          <div className="text-center">
                            <h3 className="font-bold text-sm text-white">
                              Generate AI Report
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Compile comprehensive clinical summary
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-full print:block">
                  <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900 print:hidden">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSummaryMarkdown("")}
                        aria-label="Go back"
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-300"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          Clinical Summary
                        </h2>
                        <p className="text-xs text-slate-400">
                          Subject: {activeProfile?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ExportButton
                        variant="full"
                        elementId="report-container"
                        filename={`Clinical_Summary_${activeProfile?.name || "Aura"}.pdf`}
                        orientation="portrait"
                      />
                      <button
                        onClick={() => setIsModalOpen(false)}
                        aria-label="Close share report"
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-300 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Markdown Content */}
                  <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible custom-scrollbar">
                    <div
                      id="report-container"
                      className="max-w-4xl mx-auto bg-slate-900 print:bg-white print:text-black p-4 md:p-8"
                    >
                      <div className="hidden print:block mb-8 border-b border-slate-300 pb-4">
                        <h1 className="text-3xl font-bold text-black font-sans">
                          AURA INTELLIGENCE
                        </h1>
                        <h2 className="text-xl text-slate-600 mt-1">
                          Clinical Expert Review
                        </h2>
                        <div className="mt-4 text-sm text-slate-500">
                          <p>
                            <strong>Patient:</strong> {activeProfile?.name}
                          </p>
                          <p>
                            <strong>Generated:</strong>{" "}
                            {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-800/30 p-6 md:p-8 rounded-2xl border border-white/5 shadow-inner min-h-[400px]">
                        <div className="whitespace-pre-wrap font-sans text-sm md:text-base text-slate-300 leading-relaxed tracking-wide print:text-black">
                          {summaryMarkdown}
                        </div>
                      </div>
                      <div className="hidden print:block mt-24 border-t border-slate-300 pt-8 text-center text-xs text-slate-400">
                        Generated securely by Aura AI Health Manager.
                        Verification #AURA-442-99L
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
