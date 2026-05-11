import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { getDocuments } from "../../lib/firebase/firestore";
import { useProfile } from "../../context/ProfileContext";
import UploadCenter from "../Upload/UploadCenter";
import {
  FileText,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";

interface LabReport {
  id: string;
  fileName?: string;
  hospitalName?: string;
  date?: string;
  uploadedAt: string;
  extractedData?: {
    observations?: any[];
    lab_values?: any[];
    summary?: string;
  };
  status?: "complete" | "processing" | "error";
}

function ReportCard({ report }: { report: LabReport }) {
  const [expanded, setExpanded] = useState(false);
  const labName =
    report.hospitalName && report.hospitalName !== "Unknown"
      ? report.hospitalName
      : report.fileName || "Lab Report";

  let dateText = "Unknown Date";
  if (report.date) {
    try {
      dateText = format(new Date(report.date), "dd MMM yyyy");
    } catch (e) {
      dateText = report.date;
    }
  }

  const observations =
    report.extractedData?.observations ||
    report.extractedData?.lab_values ||
    [];
  const observationCount = observations.length;
  const status = report.status || "complete";

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-lg text-[var(--color-text)] truncate max-w-[200px] sm:max-w-xs">
              {labName}
            </h4>
            <div className="text-sm text-[var(--color-text-muted)] space-y-0.5 mt-1">
              <p>Collected: {dateText}</p>
              <p>{observationCount} observations extracted</p>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              {status === "complete" && (
                <>
                  <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">
                    Complete
                  </span>
                </>
              )}
              {status === "processing" && (
                <>
                  <div className="w-2 h-2 rounded-full bg-[var(--color-warning)] animate-pulse" />
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">
                    Processing...
                  </span>
                </>
              )}
              {status === "error" && (
                <>
                  <div className="w-2 h-2 rounded-full bg-[var(--color-critical)]" />
                  <span className="text-xs font-medium text-[var(--color-critical)]">
                    Error
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {observationCount > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] hover:underline self-start sm:self-center focus:outline-none"
          >
            {expanded ? "Hide Results" : "View Results"}
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && observationCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4 pt-4 border-t border-[var(--color-border)]"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--color-bg)] text-[var(--color-text-muted)] text-[11px] uppercase tracking-widest font-semibold">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Test Name</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="px-4 py-3">Flag</th>
                    <th className="px-4 py-3 rounded-r-lg">Ref Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                  {observations.map((m: any, i: number) => {
                    const flag = m.flag || m.status; // Fallback for old status
                    const isHigh =
                      flag?.toLowerCase() === "high" ||
                      flag?.toLowerCase() === "abnormal";
                    const isLow = flag?.toLowerCase() === "low";
                    const isCritical = flag?.toLowerCase() === "critical";
                    const flagColor = isCritical
                      ? "text-[var(--color-critical)] bg-[var(--color-critical)]/10"
                      : isHigh
                        ? "text-[var(--color-warning)] bg-[var(--color-warning)]/10"
                        : isLow
                          ? "text-blue-500 bg-blue-500/10"
                          : "text-[var(--color-success)] bg-[var(--color-success)]/10";
                    const flagText = flag || "NORMAL";

                    return (
                      <tr
                        key={i}
                        className="hover:bg-[var(--color-bg)]/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          {m.testName || m.marker}
                          {m.confidence && m.confidence < 0.7 && (
                            <span title="Low confidence — verify">
                              <AlertCircle className="w-3 h-3 text-[var(--color-warning)]" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {m.valueCanonical ?? m.valueOriginal ?? m.value}{" "}
                          <span className="text-[var(--color-text-muted)] text-xs font-normal ml-0.5">
                            {m.unitCanonical || m.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${flagColor}`}
                          >
                            {flagText}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">
                          {m.referenceLow !== null &&
                          m.referenceLow !== undefined &&
                          m.referenceHigh !== null &&
                          m.referenceHigh !== undefined
                            ? `${m.referenceLow}–${m.referenceHigh}`
                            : m.reference_range || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LabReportsSection({
  onOpenChat,
  onNavigateToUpload,
}: {
  onOpenChat?: () => void;
  onNavigateToUpload?: () => void;
}) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchReports();
  }, [user, activeProfile]);

  const fetchReports = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getDocuments(user.uid, activeProfile?.id);
      const formatted = (data || []).map((doc: any) => ({
        id: doc.id,
        fileName: doc.fileName,
        hospitalName: doc.hospitalName,
        date: doc.date,
        uploadedAt:
          doc.createdAt?.toDate?.()?.toISOString() ||
          doc.date ||
          new Date().toISOString(),
        extractedData: doc.extractedData,
        status: doc.isProcessed ? "complete" : "complete", // Assuming complete for now
      }));
      setReports(formatted as LabReport[]);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const lastUploadDate = (() => {
    try {
      if (!reports || reports.length === 0 || !reports[0].uploadedAt)
        return "recently";
      const ts: any = reports[0].uploadedAt;
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return format(d, "MMM d, yyyy");
    } catch {
      return "recently";
    }
  })();

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
            Lab Reports
          </h2>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            {reports.length} reports{" "}
            {reports.length > 0 ? `· Last uploaded ${lastUploadDate}` : ""}
          </p>
        </div>
        <div className="flex bg-[var(--color-surface)] p-1 rounded-xl">
          <button className="px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors bg-[var(--color-primary)] text-white shadow-sm">
            All Reports
          </button>
          <button
            onClick={() => onNavigateToUpload && onNavigateToUpload()}
            className="px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            Upload New
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          // Skeleton Loading
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-[var(--color-bg)] rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="w-1/3 h-5 bg-[var(--color-bg)] rounded" />
                  <div className="w-1/4 h-3 bg-[var(--color-bg)] rounded" />
                </div>
              </div>
            </div>
          ))
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))
        ) : (
          // Empty State
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-[var(--color-bg)] rounded-full flex items-center justify-center mb-6">
              <FileText
                className="w-10 h-10 text-[var(--color-text-muted)]"
                strokeWidth={1}
              />
            </div>
            <h3 className="section-title mb-2 text-[var(--color-text)]">
              No reports uploaded yet
            </h3>
            <p className="text-[var(--color-text-muted)] text-sm mb-8 max-w-sm">
              Upload your first medical report to unleash Aura AI's insights and
              start tracking your health trends.
            </p>
            <button
              onClick={() => onNavigateToUpload && onNavigateToUpload()}
              className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Upload Report
            </button>
          </div>
        )}
      </div>

      <div className="pt-8 mt-12 border-t border-[var(--color-border)] opacity-40 text-center">
        <p className="text-[10px] text-[var(--color-text-faint)] font-mono uppercase tracking-[0.15em]">
          Built by <span className="text-[var(--color-text-muted)]">Aniket Dhuri</span> · Powered by Gemini AI
        </p>
      </div>
    </div>
  );
}
