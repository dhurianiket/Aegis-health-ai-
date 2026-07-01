import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Download,
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { exportToPDF } from "../../services/pdfExportService";

interface ExportModalProps {
  onClose: () => void;
  healthContext: {
    userName: string;
    healthScore: number;
    topFlags: string[];
    medications: any[];
    recentTrends: any[];
    doctorNotes: string[];
    aiClinicalSummary?: string;
  };
}

type DateRange = "30days" | "6months" | "1year" | "custom";

export default function ExportModal({
  onClose,
  healthContext,
}: ExportModalProps) {
  const [dateRange, setDateRange] = useState<DateRange>("30days");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(10);

    try {
      // Create a specific, well-formatted printable element for the PDF
      // We'll use a hidden template in the DOM or generate one on the fly
      const reportId = "health-report-printable";

      // Artificial delay to show progress and ensure DOM is ready
      setExportProgress(30);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setExportProgress(60);

      const fileName = `Health_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      await exportToPDF(reportId, fileName, "portrait");

      setExportProgress(100);
      setTimeout(() => onClose(), 800);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-800 border border-white/10 rounded-[2rem] w-full max-w-xl shadow-2xl relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3
                id="export-modal-title"
                className="text-xl font-bold text-white tracking-tight"
              >
                Export Health Report
              </h3>
              <p className="text-slate-400 text-sm">
                Professional PDF summary for your records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export modal"
            className="p-2 text-slate-500 hover:text-white rounded-full hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Date Range Selection */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date Range
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "30days", label: "Last 30 Days" },
                { id: "6months", label: "Last 6 Months" },
                { id: "1year", label: "Last 1 Year" },
                { id: "custom", label: "Custom Range" },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id as DateRange)}
                  className={`px-4 py-3 rounded-2xl text-sm font-medium transition-all border ${
                    dateRange === range.id
                      ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/5"
                      : "bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Report Preview Summary */}
          <div className="p-6 bg-black/20 rounded-3xl border border-white/5 space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Included Content
            </label>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-6 gap-y-3">
              {[
                "Health Overview Score",
                "Critical Lab Flags",
                "Active Medications",
                "Vital Sign Trends",
                "Specialist Notes",
                "Insurance Information",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-200/60 leading-relaxed">
              This report is for informational purposes only and does not
              constitute medical advice. Always consult with a qualified
              healthcare professional.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 order-2 sm:order-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Approx. generation: 5s</span>
          </div>

          <button
            disabled={isExporting}
            onClick={handleExport}
            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all relative overflow-hidden order-1 sm:order-2 ${
              isExporting
                ? "bg-indigo-600/50 text-white/50 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 active:scale-95"
            }`}
          >
            {isExporting ? (
              <>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress}%` }}
                  className="absolute inset-0 bg-indigo-400/20"
                />
                <span className="relative z-10 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                  >
                    <Clock className="w-5 h-5" />
                  </motion.div>
                  Generating...
                </span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Hidden Printable Component */}
      <div className="hidden">
        <HealthReportPrintable
          reportId="health-report-printable"
          context={healthContext}
        />
      </div>
    </div>
  );
}

function HealthReportPrintable({
  reportId,
  context,
}: {
  reportId: string;
  context: any;
}) {
  return (
    <div
      id={reportId}
      className="w-[800px] bg-white text-slate-900 p-12 font-sans"
    >
      {/* Cover Page / Header */}
      <div className="flex justify-between items-start mb-12 border-b-4 border-indigo-600 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="text-white w-6 h-6" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              AEGIS HEALTH AI
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-lg">
            Patient: {context?.userName || "Not recorded"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Export Date
          </p>
          <p className="text-xl font-bold">
            {format(new Date(), "MMMM dd, yyyy")}
          </p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold border-b-2 border-slate-200 pb-3 mb-6 uppercase tracking-widest text-indigo-700">
          Executive Summary
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 p-6 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Health Score
              </p>
              <p className="font-bold text-xl text-indigo-600">
                {context?.healthScore ?? "N/A"}% - Optimal
              </p>
          </div>
          <div className="bg-red-50 p-6 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">
                Top Flags
              </p>
            {context?.topFlags?.length > 0 ? (
              context.topFlags.map((flag: string, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm font-bold text-red-700"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {flag || "Unknown flag"}
                </div>
              ))
            ) : (
              <p className="text-sm text-red-500">
                No critical flags detected.
              </p>
            )}
          </div>
        </div>
      </div>

      {context?.aiClinicalSummary && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold border-b-2 border-slate-200 pb-3 mb-6 uppercase tracking-widest text-indigo-700">
            Clinical AI Summary (SBAAR)
          </h2>
          <div id="sbar-content" className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="whitespace-pre-wrap break-words text-slate-700 text-sm leading-relaxed">
              {context.aiClinicalSummary || "Not recorded"}
            </div>
          </div>
        </div>
      )}

      {context?.doctorNotes?.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold border-b-2 border-slate-200 pb-3 mb-6 uppercase tracking-widest text-indigo-700">
            AI Specialist Connect / Doctor Notes
          </h2>
          <div className="space-y-4">
            {context.doctorNotes.map((note: any, i: number) => (
              <div key={i} className="bg-blue-50 p-6 py-4 rounded-xl border border-blue-100">
                <div className="whitespace-pre-wrap break-words text-slate-700 text-sm leading-relaxed">
                  {typeof note === "string" ? note : note?.text || "Not recorded"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6 mb-12">
        <h2 className="text-2xl font-bold border-b-2 border-slate-200 pb-3 mb-6 uppercase tracking-widest text-indigo-700">
          Lab Values & Trends
        </h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Marker
              </th>
              <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Value
              </th>
              <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Trend
              </th>
              <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const safeGetTime = (d: any) => {
                if (!d) return 0;
                const ts = new Date(d).getTime();
                return isNaN(ts) ? (new Date(String(d).replace(/-/g, '/')).getTime() || 0) : ts;
              };

              return context?.recentTrends?.length > 0 ? (
                [...context.recentTrends].sort((a, b) => safeGetTime(a.date) - safeGetTime(b.date)).map((trend: any, i: number) => {
                  const isOutOfRange = trend?.direction === "up" || trend?.direction === "down";
                  const statusColor = isOutOfRange ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50";
                  const statusText = isOutOfRange ? "Out of Range" : "Normal";
                  const validTs = safeGetTime(trend?.date);
                  
                  return (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="py-4 font-bold text-slate-700">
                        {trend?.marker || "N/A"}
                        {validTs > 0 && <div className="text-xs text-slate-400 font-normal">{new Date(validTs).toLocaleDateString()}</div>}
                      </td>
                      <td className="py-4 text-slate-600 font-medium">
                        {trend?.value ?? "N/A"} <span className="text-xs text-slate-400">{trend?.unit || ""}</span>
                      </td>
                      <td className="py-4">
                        {trend?.direction === "up" ? (
                          <span className="text-red-500 font-bold flex items-center gap-1">↑ High</span>
                        ) : trend?.direction === "down" ? (
                          <span className="text-red-500 font-bold flex items-center gap-1">↓ Low</span>
                        ) : (
                          <span className="text-slate-500 font-medium flex items-center gap-1">- Stable</span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-slate-500">
                    Not recorded.
                  </td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>

      <div className="space-y-6 mb-12">
        <h2 className="text-2xl font-bold border-b-2 border-slate-200 pb-3 mb-6 uppercase tracking-widest text-indigo-700">
          Current Medications
        </h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Medication
              </th>
              <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Dosage
              </th>
              <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Frequency
              </th>
            </tr>
          </thead>
          <tbody>
            {context?.medications?.length > 0 ? (
              context.medications.map((med: any, i: number) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-4 font-bold text-slate-700">{med?.name || "Not recorded"}</td>
                  <td className="py-4 text-slate-600">{med?.dosage || "-"}</td>
                  <td className="py-4 text-slate-600">{med?.frequency || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-4 text-slate-500">
                  No medications listed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-auto pt-16 border-t border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
            Confidential Health Report • For Informational Purposes Only
          </p>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" /> Generated by Aegis Health AI
          </p>
        </div>
      </div>
    </div>
  );
}
