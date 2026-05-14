import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import {
  Heart,
  Stethoscope,
  Droplets,
  Zap,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  Clock,
  ExternalLink,
  Brain,
  Loader2,
  CheckCircle2,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import {
  Specialty,
  MedicalDocument,
  LabResult,
  Medication,
  UserProfile,
} from "../../types/medical";
import {
  analyzeWithSpecialist,
  SpecialistAnalysisResponse,
} from "../../services/ai/gemini";
import {
  getDocuments,
  getLabHistory,
  getMedications,
  saveSpecialistInsight,
} from "../../lib/firebase/firestore";
import { SpecialistsSkeleton } from "../ui/SkeletonLoader";

interface SpecialistInfo {
  id: string;
  name: string;
  specialty: Specialty;
  icon: any; // Lucide icon
  color: string;
  description: string;
}

const specialists: SpecialistInfo[] = [
  {
    id: "cardiology",
    name: "Cardiology AI",
    specialty: Specialty.CARDIOLOGY,
    icon: Heart,
    color: "red",
    description: "Lipids, BP, and Heart Health",
  },
  {
    id: "endocrinology",
    name: "Endocrinology AI",
    specialty: Specialty.ENDOCRINOLOGY,
    icon: Zap,
    color: "amber",
    description: "Metabolism, Sugar, and Thyroid",
  },
  {
    id: "hematology",
    name: "Hematology AI",
    specialty: Specialty.HEMATOLOGY,
    icon: Droplets,
    color: "emerald",
    description: "Iron, CBC, and Blood Markers",
  },
  {
    id: "internal",
    name: "Internal Medicine AI",
    specialty: Specialty.INTERNAL_MEDICINE,
    icon: Stethoscope,
    color: "indigo",
    description: "Holistic Evidence Synthesis",
  },
];

const QuestionItem = ({
  q,
}: {
  q: { question: string; reason_for_asking: string };
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col group cursor-pointer hover:bg-white/10 transition-all"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-300 pr-4 leading-relaxed">
          {typeof q === "string" ? q : q.question}
        </p>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-indigo-400 shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 shrink-0 transition-colors" />
        )}
      </div>
      <AnimatePresence>
        {expanded && q.reason_for_asking && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                <strong className="text-indigo-300 font-medium">
                  Why ask this:
                </strong>{" "}
                {q.reason_for_asking}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function SpecialistLounge() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [selectedId, setSelectedId] = useState(specialists[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insight, setInsight] = useState<SpecialistAnalysisResponse | null>(
    null,
  );
  const [sensitivity, setSensitivity] = useState("Standard");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const [dateRangeStr, setDateRangeStr] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const activeSpecialist = specialists.find((s) => s.id === selectedId);

  useEffect(() => {
    setInsight(null);
  }, [selectedId]);

  if (initialLoading) {
    return <SpecialistsSkeleton />;
  }

  const runAnalysis = async () => {
    if (!activeSpecialist) return;
    if (!user || !activeProfile) {
      setError("Please ensure you are signed in and have an active profile.");
      return;
    }
    setIsAnalyzing(true);
    setInsight(null);
    setError(null);
    try {
      const userId = user.uid;
      const profileId = activeProfile.id;

      const [recentReports, recentLabs, recentMeds] = await Promise.all([
        getDocuments(userId, profileId),
        getLabHistory(userId, undefined, profileId),
        getMedications(userId, profileId),
      ]);

      // Calculate date range string
      const dates = [
        ...(recentReports || []).map((d) => d.date ? new Date(d.date).getTime() : NaN),
        ...(recentLabs || []).map((l) => l.date ? new Date(l.date).getTime() : NaN)
      ].filter((n) => !isNaN(n));

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates)).toLocaleDateString();
        const maxDate = new Date(Math.max(...dates)).toLocaleDateString();
        setDateRangeStr(`Based on ${(recentReports?.length || 0) + (recentLabs?.length || 0)} records from ${minDate} to ${maxDate}`);
      } else {
        setDateRangeStr("Based on current active records");
      }

      // We need to pass the actual objects or formatted summaries to the specialist
      // analyzeWithSpecialist expects UserProfile and MedicalDocument[]

      const analysis = await analyzeWithSpecialist(
        activeSpecialist.specialty,
        activeProfile,
        recentReports || [],
        sensitivity,
      );

      if (analysis) {
        setInsight(analysis);
        try {
          await saveSpecialistInsight(userId, {
            specialty: activeSpecialist.specialty,
            content: analysis.summary,
            confidence: analysis.confidence_score,
            flags: analysis.abnormalities || [],
            profileId: profileId,
          } as any);
        } catch (dbError) {
          console.error(
            "Failed to save insight to db, but showing results:",
            dbError,
          );
        }
      } else {
        alert(
          "We couldn't generate an analysis at this time. Please try again.",
        );
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setError("Unable to generate summary. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 shrink-0">
          <Brain className="w-6 h-6 md:w-9 md:h-9" />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white mb-1 uppercase tracking-widest">
            Medical Intelligence Panel
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-light">
            Cross-specialty clinical reasoning using your longitudinal digitized
            record.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Selection Sidebar */}
        <div className="xl:col-span-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            {specialists.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`
                  w-full p-4 md:p-6 rounded-[24px] md:rounded-[32px] border transition-all text-left group relative overflow-hidden flex flex-col justify-center
                  ${
                    selectedId === s.id
                      ? "bg-indigo-600 border-white/20 shadow-2xl shadow-indigo-500/20"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  }
                `}
              >
                <div className="relative z-10 flex items-center gap-4 md:gap-5">
                  <div
                    className={`
                    w-10 h-10 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center transition-all bg-white/10
                    ${selectedId === s.id ? "text-white" : "text-slate-500 group-hover:text-white"}
                  `}
                  >
                    <s.icon className="w-5 h-5 md:w-7 md:h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-bold uppercase tracking-tight text-xs md:text-sm transition-colors truncate ${selectedId === s.id ? "text-white" : "text-slate-300"}`}
                    >
                      {s.name}
                    </h4>
                    <p
                      className={`text-[9px] md:text-[10px] mt-0.5 md:mt-1 font-medium transition-colors truncate ${selectedId === s.id ? "text-indigo-200" : "text-slate-500"}`}
                    >
                      {s.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 md:w-5 md:h-5 shrink-0 transition-all ${selectedId === s.id ? "text-white translate-x-1" : "text-slate-700"}`}
                  />
                </div>
                {selectedId === s.id && (
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full blur-2xl" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8 bg-white/5 rounded-[32px] md:rounded-[40px] border border-white/10 mt-6 md:mt-8 hidden xl:block">
            <div className="flex items-center gap-3 mb-4 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                Encryption Status
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light leading-relaxed italic">
              "Clinical synthesis occurs in an isolated memory buffer. No PHI is
              persisted to model training sets."
            </p>
          </div>
        </div>

        {/* Insight Display */}
        <div className="xl:col-span-8 bg-white/5 backdrop-blur-3xl rounded-[32px] md:rounded-[48px] border border-white/10 shadow-3xl overflow-hidden flex flex-col min-h-[400px] md:min-h-[600px] relative">
          <AnimatePresence mode="wait">
            {!insight && !isAnalyzing ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 text-center gap-6 md:gap-8 min-h-[400px]"
              >
                <div className="w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
                  {activeSpecialist && (
                    <activeSpecialist.icon className="w-8 h-8 md:w-10 md:h-10 text-slate-700" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-light text-white mb-2 md:mb-3">
                    Ready for Analysis
                  </h3>
                  <p className="text-slate-500 text-xs md:text-sm max-w-sm mx-auto leading-relaxed font-light">
                    Initiate a {activeSpecialist?.name} assessment of your
                    clinical history, lab trends, and medications.
                  </p>
                </div>
                <div className="w-full max-w-sm mt-4 text-left">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                        Sensitivity Level
                      </span>
                    </div>
                    <select
                      value={sensitivity}
                      onChange={(e) => setSensitivity(e.target.value)}
                      className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl p-3 border border-white/10 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Conservative">
                        Conservative (Flag critical only)
                      </option>
                      <option value="Standard">
                        Standard (Flag out-of-range)
                      </option>
                      <option value="High">
                        High (Hyper-analyze all risks)
                      </option>
                    </select>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="disclaimer"
                        className="mt-1 w-4 h-4 rounded border-amber-500/50 bg-black/20 text-amber-500 focus:ring-amber-500 cursor-pointer shrink-0"
                        checked={disclaimerAccepted}
                        onChange={(e) =>
                          setDisclaimerAccepted(e.target.checked)
                        }
                      />
                      <label
                        htmlFor="disclaimer"
                        className="text-xs text-amber-200/80 cursor-pointer leading-relaxed"
                      >
                        <strong>Medical Disclaimer:</strong> I understand that
                        Aura is an AI assistant, not a licensed healthcare
                        provider. Insights generated are for informational
                        purposes only and must be verified by a board-certified
                        physician. Do not alter medications or treatments based
                        on this analysis.
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  onClick={runAnalysis}
                  disabled={!disclaimerAccepted}
                  className={`px-6 md:px-10 py-3 md:py-4 rounded-2xl font-bold uppercase tracking-widest text-[9px] md:text-[11px] shadow-2xl transition-all ${
                    disclaimerAccepted
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30 hover:scale-105 cursor-pointer"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                  }`}
                >
                  Start Clinical Synthesis
                </button>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-12"
              >
                <div className="relative">
                  <div className="w-40 h-40 rounded-full border border-white/5 relative flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 border-t-2 border-indigo-500 rounded-full"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-2 border-b-2 border-emerald-500 rounded-full opacity-50"
                    />
                    {activeSpecialist && (
                      <activeSpecialist.icon className="w-12 h-12 text-indigo-400" />
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-light text-white tracking-widest">
                    SYNTHESIZING...
                  </h3>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em]">
                      Processing Lab Vectors
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] opacity-40 italic">
                      Cross-referencing Medical Literature
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-6 md:gap-8 min-h-[400px]"
              >
                <div className="w-16 h-16 md:w-24 md:h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-inner">
                  <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-light text-white mb-2 md:mb-3">
                    Analysis Failed
                  </h3>
                  <p className="text-red-400 text-xs md:text-sm max-w-sm mx-auto leading-relaxed font-light">
                    {error}
                  </p>
                </div>
                <button
                  onClick={runAnalysis}
                  className="px-6 md:px-10 py-3 md:py-4 rounded-2xl font-bold uppercase tracking-widest text-[9px] md:text-[11px] shadow-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30 hover:scale-105 transition-all"
                >
                  Retry Analysis
                </button>
              </motion.div>
            ) : insight ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 p-12 space-y-12 overflow-y-auto pb-20"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          insight.urgency_level === "High" ||
                          insight.urgency_level === "Emergency"
                            ? "bg-red-500/20 text-red-400 border-red-500/20"
                            : insight.urgency_level === "Moderate"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        Urgency: {insight.urgency_level}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                        Confidence: {insight.confidence_score}%
                      </span>
                    </div>
                    <h3 className="text-3xl font-light text-white tracking-tight">
                      {activeSpecialist?.name} Findings
                    </h3>
                  </div>
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
                    {activeSpecialist && (
                      <activeSpecialist.icon className="w-7 h-7" />
                    )}
                  </div>
                </div>

                {dateRangeStr && (
                  <p className="text-[11px] font-medium text-indigo-300 uppercase tracking-widest">{dateRangeStr}</p>
                )}

                {insight.key_concern && (
                  <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl">
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4" /> Key Concern
                    </h4>
                    <p className="text-sm text-red-200">{insight.key_concern}</p>
                  </div>
                )}

                <div className="p-8 bg-white/5 rounded-3xl border border-white/10 border-l-4 border-l-indigo-500 prose prose-invert prose-lg max-w-none">
                  <ReactMarkdown>{insight.summary}</ReactMarkdown>
                  <p className="text-[10px] text-slate-500 italic mt-4 pt-4 border-t border-white/5">
                    For informational purposes only. Not medical advice.
                  </p>
                </div>

                {insight.analyzed_markers && insight.analyzed_markers.length > 0 && (
                   <div className="space-y-4">
                     <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                       <Droplets className="w-4 h-4 text-emerald-400" /> Lab Values Analyzed
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insight.analyzed_markers.map((marker: any, idx: number) => (
                           <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10">
                              <p className="text-sm font-bold text-white">{marker.marker}</p>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{marker.reason}</p>
                           </div>
                        ))}
                     </div>
                   </div>
                )}

                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                      <Zap className="w-4 h-4 text-amber-400" /> Evidence Logs
                    </h4>
                    <ul className="space-y-4">
                      {insight.observations?.map((o: any, i: number) => (
                        <li
                          key={i}
                          className="flex gap-4 text-sm text-slate-400 group items-start"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-indigo-400" /> Action
                      Roadmap
                    </h4>
                    <ul className="space-y-3">
                      {insight.suggested_next_steps?.map(
                        (s: any, i: number) => (
                          <li
                            key={i}
                            className="flex gap-3 text-sm bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 text-indigo-100"
                          >
                            <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>

                <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 space-y-6">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> Physician
                    Prep Questions
                  </h4>
                  <div className="grid gap-3">
                    {insight.recommended_questions?.map((q: any, i: number) => (
                      <QuestionItem key={i} q={q} />
                    ))}
                  </div>
                </div>

                <div className="flex justify-center pt-8">
                  <button
                    onClick={() => {
                      setInsight(null);
                      setDisclaimerAccepted(false);
                    }}
                    className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-all group"
                  >
                    <Loader2 className="w-4 h-4 group-hover:-rotate-180 transition-transform" />{" "}
                    Reset & Configure Analysis
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mt-auto p-4 md:p-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between bg-black/20 gap-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-200/70 leading-relaxed max-w-2xl">
                <strong className="text-amber-400">SAFETY WARNING:</strong> AI
                insights are generated purely from your provided history and
                literature pattern-matching. They may contain inaccuracies or
                hallucinated correlations. <strong>NEVER</strong> use this tool
                for emergency diagnosis. If experiencing acute distress, call
                emergency services immediately. All outputs must be clinically
                correlated by your physician.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-8 mt-12 border-t border-white/10 opacity-40 text-center">
        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.15em]">
          Built by <span className="text-slate-400">Aniket Dhuri</span> · Powered by Gemini AI
        </p>
      </div>
    </div>
  );
}
