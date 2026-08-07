import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import {
  FileText,
  Stethoscope,
  Droplets,
  Microscope,
  Calendar,
  Pill,
  ShieldAlert,
  ArrowUpRight,
  Loader2,
  Filter,
  Download,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  getDocuments,
  deleteDocumentRecord,
} from "../../lib/firebase/firestore";
import { MedicalDocument, DocumentType } from "../../types/medical";
import { TimelineSkeleton } from "../ui/SkeletonLoader";
import {
  computeAllTrends,
  formatTrendForPrompt,
} from "../../utils/trendAnalysis";
import { getSourceForMarker, getUrgencyAndNextStep } from "../../services/sourceGroundedService";
import { AIErrorBoundary } from "../ui/AIErrorBoundary";
import { LabObservation } from "../../types/health";

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  [DocumentType.LAB_REPORT]: { icon: Droplets, color: "emerald" },
  [DocumentType.PRESCRIPTION]: { icon: Pill, color: "amber" },
  [DocumentType.CONSULTATION_NOTE]: { icon: Stethoscope, color: "blue" },
  [DocumentType.IMAGING_REPORT]: { icon: Microscope, color: "purple" },
  [DocumentType.DISCHARGE_SUMMARY]: { icon: FileText, color: "indigo" },
  default: { icon: FileText, color: "slate" },
};

export default function Timeline() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [trends, setTrends] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");

  const [selectedDoc, setSelectedDoc] = useState<MedicalDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trendKey, setTrendKey] = useState(0);

  useEffect(() => {
    async function fetchDocs() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const fetchedDocs = await getDocuments(user.uid, activeProfile?.id);
        const docs = fetchedDocs || [];
        setDocuments(docs);

        let obs: LabObservation[] = [];
        docs.forEach((doc: any) => {
          // Backward compatibility for lab_values -> observations
          const rawObs =
            doc.extractedData?.observations ||
            doc.extractedData?.lab_values ||
            [];
          rawObs.forEach((o: any) => {
            // ensure collectedAt is present (needed by computeAllTrends)
            if (!o.collectedAt) {
              o.collectedAt = doc.date;
            }
            obs.push(o as LabObservation);
          });
        });
        setTrends(computeAllTrends(obs));
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocs();
  }, [user, activeProfile]);

  const filteredDocs = useMemo(() => {
    return filterType === "ALL"
      ? documents
      : documents.filter((d) => d.type === filterType);
  }, [documents, filterType]);

  const categories = [
    { id: "ALL", label: "All Records" },
    { id: DocumentType.LAB_REPORT, label: "Blood & Labs" },
    { id: DocumentType.IMAGING_REPORT, label: "MRI & X-Rays" },
    { id: DocumentType.PRESCRIPTION, label: "Prescriptions" },
    { id: DocumentType.CONSULTATION_NOTE, label: "Consults" },
    { id: DocumentType.DISCHARGE_SUMMARY, label: "Discharges" },
  ];

  const handleDownload = (docResult: MedicalDocument) => {
    const json = JSON.stringify(docResult.extractedData || {}, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docResult.type}-${docResult.date || "record"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async (docResult: MedicalDocument) => {
    const text = `Record Type: ${docResult.type?.replace("_", " ")}\nDate: ${docResult.date}\nProvider: ${docResult.hospitalName}\nFindings: ${docResult.extractedData?.findings || "Not available"}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Medical Record: ${docResult.type}`,
          text,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert("Record info copied to clipboard!");
    }
  };

  const handleDelete = async (docResult: MedicalDocument) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this record forever?"))
      return;
    setIsDeleting(true);
    try {
      await deleteDocumentRecord(user.uid, docResult.id);
      setDocuments((prev) => prev.filter((d) => d.id !== docResult.id));
      setSelectedDoc(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete the document.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            Clinical Narrative
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-light">
            A longitudinal reconstruction of every clinical interaction for{" "}
            {activeProfile?.name || "this profile"}.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 overflow-x-auto w-full md:w-auto scrollbar-none snap-x">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id)}
              aria-label={cat.label}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all snap-start ${
                filterType === cat.id
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white dark:hover:bg-white/5"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <AIErrorBoundary
        key={trendKey}
        onReset={() => setTrendKey((k) => k + 1)}
        fallbackMessage="Trend engine temporarily unavailable."
      >
        {Object.keys(trends).length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-bold tracking-tight text-white mb-4 uppercase text-sm tracking-widest text-slate-400">
              Clinical Trends
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(trends)
                .sort((a, b) => {
                  const severityMap: Record<string, number> = {
                    CRITICAL: 0,
                    HIGH: 1,
                    LOW: 2,
                    NORMAL: 3,
                  };
                  return (
                    (severityMap[a.latestFlag || "NORMAL"] ?? 4) -
                    (severityMap[b.latestFlag || "NORMAL"] ?? 4)
                  );
                })
                .map((trend: any, idx) => {
                  const isUp = trend.direction === "increasing";
                  const isDown = trend.direction === "decreasing";
                  const arrow = isUp ? "↑" : isDown ? "↓" : "→";
                  const isCritical = trend.latestFlag === "CRITICAL";
                  const isHigh = trend.latestFlag === "HIGH";
                  const isLow = trend.latestFlag === "LOW";

                  const bgClass = isCritical
                    ? "bg-red-500/10 border-red-500/20"
                    : isHigh
                      ? "bg-amber-500/10 border-amber-500/20"
                      : isLow
                        ? "bg-blue-500/10 border-blue-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20";

                  const textClass = isCritical
                    ? "text-red-400"
                    : isHigh
                      ? "text-amber-400"
                      : isLow
                        ? "text-blue-400"
                        : "text-emerald-400";

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border ${bgClass} backdrop-blur-sm`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`font-bold text-sm ${textClass}`}>
                          {trend.testName}
                        </span>
                        <span className={`text-lg font-black ${textClass}`}>
                          {arrow}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-300">
                        {trend.lastValue} {trend.unitCanonical || trend.unit}
                        <span className="opacity-60 ml-2">
                          ({trend.delta > 0 ? "+" : ""}
                          {trend.percentChange.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </AIErrorBoundary>

      <div className="relative">
        <div className="absolute left-[23px] md:left-[31px] top-4 bottom-4 w-px bg-gradient-to-b from-indigo-500/50 via-white/10 to-transparent"></div>

        <div className="space-y-8 md:space-y-12">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <TimelineSkeleton />
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map((doc, idx) => {
                const config = TYPE_CONFIG[doc.type] || TYPE_CONFIG.default;
                return (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="relative pl-16 md:pl-24 group"
                  >
                    <div className="absolute left-0 top-0 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-[#0F172A] border border-white/10 flex items-center justify-center shadow-2xl z-10 transition-transform group-hover:scale-110">
                      <config.icon
                        className={`w-5 h-5 md:w-7 md:h-7 text-${config.color}-400`}
                      />
                    </div>

                    <div
                      onClick={() => setSelectedDoc(doc)}
                      className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl md:rounded-[40px] border border-white/10 shadow-3xl hover:bg-white/10 transition-all cursor-pointer group/card flex-1 ml-4 md:ml-8"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6">
                        <div className="space-y-2 md:space-y-3 flex-1">
                          <p className="text-xs md:text-xs font-bold text-slate-300 uppercase tracking-[0.2em] mb-1">
                            {new Date(doc.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                          <h4 className="text-lg md:text-xl font-bold text-white group-hover/card:text-indigo-400 transition-colors uppercase tracking-tight">
                            {doc.type.replace("_", " ")}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs md:text-xs font-semibold text-indigo-400 italic opacity-80">
                              {doc.hospitalName || "Independent Provider"}
                            </span>
                          </div>
                          <p className="text-[var(--color-text)] text-xs md:text-sm leading-relaxed font-medium mt-2 md:mt-3 truncate max-w-xl">
                            Record for {doc.fileName} —{" "}
                            {doc.doctorName
                              ? `Physician: ${doc.doctorName}`
                              : "Self-uploaded"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-white/5 text-xs md:text-xs font-bold text-slate-300 uppercase tracking-widest border border-white/5 rounded-full whitespace-nowrap">
                            {doc.type}
                          </span>
                        </div>
                        <div className="md:ml-auto flex items-center gap-2 text-indigo-400 font-bold text-xs md:text-xs uppercase tracking-widest group-hover/card:underline">
                          Digitized Record{" "}
                          <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10 flex flex-col items-center justify-center p-6"
              >
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Your health vault is empty.</h3>
                <p className="text-slate-300 text-sm max-w-sm mx-auto">
                  Upload your first lab report to generate insights and track your trends.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-6 md:p-10 bg-indigo-600 rounded-3xl md:rounded-[48px] shadow-2xl shadow-indigo-500/20 border border-white/20 flex flex-col md:flex-row gap-6 md:gap-8 items-start relative overflow-hidden">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/10 flex items-center justify-center text-white shrink-0 relative z-10 border border-white/20">
          <ShieldAlert className="w-6 h-6 md:w-8 md:h-8" />
        </div>
        <div className="relative z-10">
          <h4 className="font-bold text-white text-base md:text-lg uppercase tracking-tight mb-2">
            Continuity Gap Detected
          </h4>
          <p className="text-indigo-100 text-xs md:text-sm leading-relaxed font-light italic">
            "Your longitudinal record shows a lack of recent checkups.
            Synchronizing historical records or scheduling a screening is
            recommended for profile completeness."
          </p>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-40"></div>
      </div>

      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col md:items-center md:justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 w-full max-w-3xl rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 relative shrink-0">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight uppercase">
                    {selectedDoc.type.replace("_", " ")}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {selectedDoc.date} •{" "}
                    {selectedDoc.hospitalName || "Unknown Provider"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  aria-label="Close"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8">
                {selectedDoc.extractedData?.findings ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                      Clinical Findings
                    </h4>
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 text-slate-300 font-light text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedDoc.extractedData.findings}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-300 text-sm italic">
                    No extracted findings available.
                  </p>
                )}

                {selectedDoc.extractedData?.lab_values &&
                  selectedDoc.extractedData.lab_values.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                        Lab Results
                      </h4>
                      <div className="grid gap-3">
                        {selectedDoc.extractedData.lab_values.map(
                          (lab: any, i: number) => {
                            const isCritical =
                              lab.status === "critical" ||
                              lab.status === "abnormal";
                            const source = getSourceForMarker(lab.marker);
                            const urgency = getUrgencyAndNextStep(lab.marker, lab.status, lab.value);
                            return (
                              <div
                                key={i}
                                className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${isCritical ? "bg-red-500/5 border-red-500/20" : "bg-white/5 border-white/10"}`}
                              >
                                <div className="flex-1">
                                  <p className="font-bold text-slate-200 text-sm">
                                    {lab.marker}
                                  </p>
                                  <p className="text-xs text-slate-300 font-bold uppercase mt-1">
                                    Ref: {lab.reference_range || "-"}
                                  </p>
                                  <p className="text-xs text-slate-300 mt-0.5">
                                    Source: {source ? (
                                      <a 
                                        href={source.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-[var(--color-primary)] hover:underline font-medium inline-flex items-center gap-1"
                                        id={`ref-link-tl-${lab.id || i}`}
                                      >
                                        {source.name}
                                      </a>
                                    ) : (
                                      <span className="text-slate-600 italic">reference not available</span>
                                    )}
                                  </p>
                                  <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs text-slate-400 font-medium">Urgency:</span>
                                      <span className={`px-1.5 py-0.2 rounded text-xs font-bold uppercase tracking-wider ${urgency.badgeClass}`}>
                                        {urgency.level}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-tight">
                                      <span className="font-medium text-slate-300">Next Step:</span> {urgency.nextStep}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-left md:text-right shrink-0">
                                  <p
                                    className={`text-lg font-light ${lab.status === "abnormal" ? "text-amber-400" : lab.status === "critical" ? "text-red-400" : "text-emerald-400"}`}
                                  >
                                    {lab.value}{" "}
                                    <span className="text-xs opacity-50">
                                      {lab.unit}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                {selectedDoc.extractedData?.medications &&
                  selectedDoc.extractedData.medications.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                        Medications
                      </h4>
                      <div className="grid gap-3">
                        {selectedDoc.extractedData.medications.map(
                          (med: any, i: number) => (
                            <div
                              key={i}
                              className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-bold text-slate-200 text-sm">
                                  {med.name}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {med.dosage} • {med.frequency}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>

                <div className="p-6 md:p-8 border-t border-white/5 flex items-center gap-3 shrink-0 flex-wrap">
                  {selectedDoc.fileUrl && (
                    <a
                      href={selectedDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex-1 justify-center"
                    >
                      <Download className="w-4 h-4" /> Original PDF
                    </a>
                  )}
                  <button
                    onClick={() => handleDownload(selectedDoc)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex-1 justify-center"
                  >
                    <Download className="w-4 h-4" /> JSON
                  </button>
                  <button
                    onClick={() => handleShare(selectedDoc)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex-1 justify-center"
                  >
                    <Share2 className="w-4 h-4" /> Share Info
                  </button>
                  <button
                    onClick={() => handleDelete(selectedDoc)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex-1 justify-center disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}{" "}
                    Delete
                  </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-8 mt-12 border-t border-white/10 opacity-40 text-center">
        <p className="text-xs text-slate-300 font-mono uppercase tracking-[0.15em]">
          Built by <a href="https://aniket.aegishealthai.co.in/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-300 underline decoration-slate-500 transition-colors">Aniket Dhuri</a> · Powered by Gemini AI
        </p>
      </div>
    </div>
  );
}
