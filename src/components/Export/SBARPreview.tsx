import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Copy, Check, X, Download, FileDown, AlertTriangle, Activity } from "lucide-react";
import { exportToPDF, generateDoctorReport, SBAROutput, TrendSummary, LabObservation } from "../../services/pdfExportService";
import { exportToFhirBundle, downloadFhirJson } from "../../services/fhirService";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { logAuditEvent } from "../../lib/auditLogger";

interface SBARPreviewProps {
  sbarText: string;
  isLoading?: boolean;
  onClose: () => void;
  sbarData?: SBAROutput;
  trendSummaries?: TrendSummary[];
  flaggedObservations?: LabObservation[];
  reportDateRange?: { from: string; to: string };
}

export default function SBARPreview({
  sbarText,
  isLoading,
  onClose,
  sbarData,
  trendSummaries,
  flaggedObservations,
  reportDateRange
}: SBARPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDoctorExporting, setIsDoctorExporting] = useState(false);
  const [isFhirExporting, setIsFhirExporting] = useState(false);
  const [doctorExportError, setDoctorExportError] = useState<string | null>(null);

  const { user } = useAuth();
  const { activeProfile } = useProfile();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sbarText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToPDF("sbar-content", "AI_Physician_SBAR.pdf");
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const parseSBAR = (text: string): SBAROutput => {
    const result: SBAROutput = { situation: '', background: '', assessment: [], recommendation: [] };
    if (!text) return result;
    const t = text;
    const matchS = t.match(/SITUATION:(.*?)(?=BACKGROUND:|$)/is);
    const matchB = t.match(/BACKGROUND:(.*?)(?=ASSESSMENT:|$)/is);
    const matchA = t.match(/ASSESSMENT:(.*?)(?=RECOMMENDATION:|$)/is);
    const matchR = t.match(/RECOMMENDATION:(.*?)$/is);

    if (matchS) result.situation = matchS[1].trim();
    if (matchB) result.background = matchB[1].trim();
    if (matchA) result.assessment = matchA[1].trim().split('\n').map(s=>s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
    if (matchR) result.recommendation = matchR[1].trim().split('\n').map(s=>s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
    return result;
  };

  const handleDoctorExport = async () => {
    setIsDoctorExporting(true);
    setDoctorExportError(null);
    try {
      const sbar = sbarData || parseSBAR(sbarText);
      const metrics = {
        name: activeProfile?.fullName || 'Patient',
        age: activeProfile?.dob ? Math.floor((new Date().getTime() - new Date(activeProfile.dob).getTime()) / 3.15576e+10) : undefined,
        sex: activeProfile?.gender,
        conditions: activeProfile?.chronicConditions || []
      };

      const finalFlagged = flaggedObservations || (activeProfile?.labValues || [])
        .filter(l => l.status?.toUpperCase() === 'HIGH' || l.status?.toUpperCase() === 'LOW' || l.status?.toUpperCase() === 'CRITICAL')
        .map(l => ({
          testName: l.markerName,
          value: l.value,
          unit: l.unit,
          flag: l.status.toUpperCase(),
          referenceRange: l.referenceRange
        }));

      const finalTrends = trendSummaries || [];
      const dates = (activeProfile?.labValues || []).map(l => new Date(l.date).getTime()).filter(t => !isNaN(t));
      const fallbackFrom = dates.length ? new Date(Math.min(...dates)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const fallbackTo = dates.length ? new Date(Math.max(...dates)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const finalDates = reportDateRange || { from: fallbackFrom, to: fallbackTo };

      const blob = await generateDoctorReport({
        profile: metrics,
        sbar,
        trendSummaries: finalTrends,
        flaggedObservations: finalFlagged,
        reportDateRange: finalDates
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AegisHealthSummary_${metrics.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      if (user?.uid) {
        await logAuditEvent(user.uid, 'PDF_EXPORTED', finalDates.from);
      }
    } catch (err) {
      console.error(err);
      setDoctorExportError("Failed to generate Doctor PDF. Please try again.");
    } finally {
      setIsDoctorExporting(false);
    }
  };

  const handleFhirExport = () => {
    setIsFhirExporting(true);
    try {
      const patient = {
        id: user?.uid || activeProfile?.id || 'patient-user',
        name: activeProfile?.fullName || user?.displayName || 'Patient',
        email: user?.email || '',
      };
      const bundle = exportToFhirBundle(patient, [], sbarData || sbarText);
      downloadFhirJson(bundle, `Aegis_SBAR_FHIR_${new Date().toISOString().split('T')[0]}.json`);
      if (user?.uid) {
        logAuditEvent(user.uid, 'SBAR_EXPORT_FHIR', JSON.stringify({ sbarLength: sbarText.length }));
      }
    } catch (err) {
      console.error("FHIR export failed:", err);
    } finally {
      setIsFhirExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 border border-white/10 p-6 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sbar-preview-title"
      >
        <div className="flex items-center justify-between mx-2 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3
              id="sbar-preview-title"
              className="text-xl font-bold text-white tracking-tight"
            >
              Clinical & Patient Summaries
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {doctorExportError && (
          <div className="mb-4 mx-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p>{doctorExportError}</p>
          </div>
        )}

        <div
          id="sbar-content"
          className="flex-1 overflow-y-auto p-8 md:p-12 bg-black/20 rounded-2xl border border-white/5 mb-4 text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap relative min-h-[200px]"
        >
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
              />
              <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                Consulting Gemini AI...
              </p>
            </div>
          ) : (
            <>
              {sbarText}
              <div className="mt-8 pt-4 border-t border-white/5">
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  DISCLAIMER: This SBAR summary is AI-generated for
                  informational purposes only. It is not a medical diagnosis or
                  professional clinical assessment. Always verify findings with
                  original laboratory reports and clinical documentation before
                  any patient care decisions.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 mt-2">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors order-5 sm:order-1"
          >
            Close
          </button>
          
          <button
            disabled={isLoading || isFhirExporting}
            onClick={handleFhirExport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 transition-colors shadow-lg shadow-indigo-950/20 order-4 sm:order-2 disabled:opacity-50"
          >
            <Activity className="w-4 h-4" />
            FHIR
          </button>

          <button
            disabled={isLoading || isExporting || isDoctorExporting}
            onClick={handleExport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10 order-3 sm:order-3 disabled:opacity-50"
          >
            {isExporting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Download className="w-4 h-4" />
              </motion.div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export PDF
          </button>
          
          <button
            disabled={isLoading || isDoctorExporting}
            onClick={handleDoctorExport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-500/20 order-2 sm:order-4 disabled:opacity-50"
          >
            {isDoctorExporting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <FileDown className="w-5 h-5" />
              </motion.div>
            ) : (
              <FileDown className="w-5 h-5" />
            )}
            📄 Download PDF for Doctor
          </button>

          <button
            disabled={isLoading}
            onClick={handleCopy}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/20 order-1 sm:order-5 disabled:opacity-50"
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
            {copied ? "Copied" : "Copy to Clipboard"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
