import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { getDocuments } from "../../lib/firebase/firestore";
import { generateSBAR } from "../../services/sbarGenerationService";
import { generateDoctorReport, SBAROutput, TrendSummary, LabObservation } from "../../services/pdfExportService";
import { format } from "date-fns";
import {
  FileText,
  Calendar,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Stethoscope,
  Sparkles,
  RefreshCw,
  Sliders,
  Plus,
  Info,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { logAuditEvent } from "../../lib/auditLogger";

export default function ClinicalHandover() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();

  // Documents State
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // SBAR Content State
  const [sbarRaw, setSbarRaw] = useState<string>("");
  const [isGeneratingSbar, setIsGeneratingSbar] = useState(false);
  const [sbarError, setSbarError] = useState<string | null>(null);

  // Editable SBAR Sections
  const [editableSbar, setEditableSbar] = useState<SBAROutput>({
    situation: "",
    background: "",
    assessment: [],
    recommendation: []
  });

  // UI Tabs / Controls
  const [activeTab, setActiveTab] = useState<"sbar" | "flagged" | "trends">("sbar");
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // 1. Fetch raw documents for context and selection
  useEffect(() => {
    async function loadDocuments() {
      if (!user) return;
      setIsLoadingDocs(true);
      try {
        const docs = await getDocuments(user.uid, activeProfile?.id);
        const sortedDocs = (docs || []).sort(
          (a, b) => new Date(b.date || b.uploadedAt || 0).getTime() - new Date(a.date || a.uploadedAt || 0).getTime()
        );
        setDocuments(sortedDocs);
        // Default select all
        setSelectedDocIds(sortedDocs.map((d) => d.id));
      } catch (err) {
        console.error("Failed to load documents for handover:", err);
      } finally {
        setIsLoadingDocs(false);
      }
    }
    loadDocuments();
  }, [user, activeProfile]);

  // 2. Fetch/Generate SBAR on load or profile change
  const fetchSBARText = async (force = false) => {
    if (!user || !activeProfile) return;
    setIsGeneratingSbar(true);
    setSbarError(null);
    try {
      const sbar = await generateSBAR(user.uid, activeProfile, force);
      setSbarRaw(sbar);
      
      // Parse the raw text into structured SBAR sections
      const parsed = parseSBARText(sbar);
      setEditableSbar(parsed);
    } catch (err: any) {
      console.error("SBAR synthesis error:", err);
      setSbarError("Unable to synthesize SBAR Clinical Handover data.");
    } finally {
      setIsGeneratingSbar(false);
    }
  };

  useEffect(() => {
    if (user && activeProfile) {
      fetchSBARText(false);
    }
  }, [user, activeProfile]);

  // SBAR Parsing Helper
  const parseSBARText = (text: string): SBAROutput => {
    const result: SBAROutput = { situation: "", background: "", assessment: [], recommendation: [] };
    if (!text) return result;

    // Use whitespace-tolerant, case-insensitive regex matching for headers
    const situationRegex = /(?:S\s*-\s*SITUATION|SITUATION\s*:?)([\s\S]*?)(?=B\s*-\s*BACKGROUND|BACKGROUND\s*:?|$)/i;
    const backgroundRegex = /(?:B\s*-\s*BACKGROUND|BACKGROUND\s*:?)([\s\S]*?)(?=A\s*-\s*ASSESSMENT|ASSESSMENT\s*:?|$)/i;
    const assessmentRegex = /(?:A\s*-\s*ASSESSMENT|ASSESSMENT\s*:?)([\s\S]*?)(?=R\s*-\s*RECOMMENDATION|RECOMMENDATION\s*:?|$)/i;
    const recommendationRegex = /(?:R\s*-\s*RECOMMENDATION|RECOMMENDATION\s*:?)([\s\S]*?)(?=PART\s*2|AI\s*DR\s*SUMMARY|---+|$)/i;

    const sMatch = text.match(situationRegex);
    const bMatch = text.match(backgroundRegex);
    const aMatch = text.match(assessmentRegex);
    const rMatch = text.match(recommendationRegex);

    if (sMatch && sMatch[1]) {
      result.situation = sMatch[1].trim();
    }
    if (bMatch && bMatch[1]) {
      result.background = bMatch[1].trim();
    }

    const parseList = (sectionText: string): string[] => {
      if (!sectionText) return [];
      return sectionText
        .split("\n")
        .map((line) => line.replace(/^[•\-\*\d\.\s]+/, "").trim())
        .filter((line) => line.length > 2);
    };

    if (aMatch && aMatch[1]) {
      result.assessment = parseList(aMatch[1]);
    }
    if (rMatch && rMatch[1]) {
      result.recommendation = parseList(rMatch[1]);
    }

    // Elegant fallbacks
    if (!result.situation) {
      result.situation = "Refer to the active reports for the clinical situation summary.";
    }
    if (!result.background) {
      result.background = "Primary healthcare history and underlying conditions recorded.";
    }
    if (!result.assessment || result.assessment.length === 0) {
      result.assessment = ["Review attached reports to confirm diagnostic lab results."];
    }
    if (!result.recommendation || result.recommendation.length === 0) {
      result.recommendation = ["Discuss laboratory findings with primary physician for diagnosis and prescription."];
    }

    return result;
  };

  // Toggle selection helper
  const toggleDocSelected = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  // Get selected documents
  const selectedDocs = useMemo(() => {
    return documents.filter((d) => selectedDocIds.includes(d.id));
  }, [documents, selectedDocIds]);

  // Compute date range for selected documents
  const selectedDateRange = useMemo(() => {
    if (selectedDocs.length === 0) return { from: "N/A", to: "N/A" };
    const dates = selectedDocs.map((d) => new Date(d.extractedDate || d.date || d.uploadedAt || 0).getTime()).filter((t) => !isNaN(t));
    if (dates.length === 0) return { from: "N/A", to: "N/A" };
    
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return {
      from: format(minDate, "yyyy-MM-dd"),
      to: format(maxDate, "yyyy-MM-dd")
    };
  }, [selectedDocs]);

  // Compute dynamic flagged markers for the selected documents
  const selectedFlaggedObservations = useMemo(() => {
    const flagged: LabObservation[] = [];
    selectedDocs.forEach((doc) => {
      const obs = doc.extractedData?.observations || doc.extractedData?.lab_values || [];
      obs.forEach((o: any) => {
        const flagStr = String(o.status || o.flag || "NORMAL").toUpperCase();
        if (
          flagStr.includes("HIGH") ||
          flagStr.includes("LOW") ||
          flagStr.includes("CRITICAL") ||
          flagStr.includes("ABNORMAL")
        ) {
          flagged.push({
            testName: o.marker || o.testName || o.name || "Biomarker",
            value: o.valueCanonical ?? o.numeric_value ?? o.valueOriginal ?? "-",
            unit: o.unitCanonical || o.unitOriginal || "",
            flag: flagStr,
            referenceRange: o.referenceRange || o.reference_range || "N/A"
          });
        }
      });
    });
    // Deduplicate by test name + flag
    const uniqueMap = new Map<string, LabObservation>();
    flagged.forEach((f) => {
      const key = `${f.testName}_${f.flag}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, f);
      }
    });
    return Array.from(uniqueMap.values());
  }, [selectedDocs]);

  // Compute dynamic trends for selected documents
  const selectedTrends = useMemo(() => {
    const map = new Map<string, Array<{ val: number; date: string }>>();
    selectedDocs.forEach((doc) => {
      const obs = doc.extractedData?.observations || doc.extractedData?.lab_values || [];
      const dateStr = doc.extractedDate || doc.date || doc.uploadedAt || new Date().toISOString();
      obs.forEach((o: any) => {
        const name = (o.marker || o.testName || o.name || "").trim();
        const rawVal = o.valueCanonical ?? o.numeric_value ?? o.valueOriginal;
        const val = rawVal !== undefined && rawVal !== null ? parseFloat(String(rawVal)) : null;
        if (name && val !== null && !isNaN(val)) {
          if (!map.has(name)) map.set(name, []);
          map.get(name)!.push({ val, date: dateStr });
        }
      });
    });

    const trends: TrendSummary[] = [];
    map.forEach((values, biomarker) => {
      values.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (values.length >= 2) {
        const oldest = values[0];
        const newest = values[values.length - 1];
        const diff = newest.val - oldest.val;
        const deltaPercent = oldest.val !== 0 ? Math.round((diff / oldest.val) * 100) : 0;
        trends.push({
          biomarker,
          direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
          deltaPercent: deltaPercent > 0 ? `+${deltaPercent}` : `${deltaPercent}`
        });
      }
    });
    return trends;
  }, [selectedDocs]);

  // Copy plain SBAR summary text to clipboard
  const handleCopy = () => {
    const plainText = `SBAR CLINICAL SUMMARY\n\nSITUATION:\n${editableSbar.situation}\n\nBACKGROUND:\n${editableSbar.background}\n\nASSESSMENT:\n${editableSbar.assessment.map(a => `• ${a}`).join("\n")}\n\nRECOMMENDATION:\n${editableSbar.recommendation.map(r => `• ${r}`).join("\n")}`;
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate and Download Handover PDF
  const handleDownloadPDF = async () => {
    if (!user || isExporting) return;
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      const metrics = {
        name: activeProfile?.fullName || activeProfile?.name || "Patient",
        age: activeProfile?.dob
          ? Math.floor((new Date().getTime() - new Date(activeProfile.dob).getTime()) / 3.15576e10)
          : undefined,
        sex: activeProfile?.gender,
        conditions: activeProfile?.chronicConditions || []
      };

      const blob = await generateDoctorReport({
        profile: metrics,
        sbar: editableSbar,
        trendSummaries: selectedTrends,
        flaggedObservations: selectedFlaggedObservations,
        reportDateRange: selectedDateRange
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ClinicalHandoverSummary_${metrics.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);

      await logAuditEvent(user.uid, "PDF_EXPORTED", selectedDateRange.from);
    } catch (err: any) {
      console.error("Clinical PDF Export failed:", err);
      setExportError("Failed to generate clinical handover PDF. Please retry.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="clinical-handover-container">
      {/* Intro Header */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider">
            <Stethoscope className="w-5 h-5" /> Clinical Handover Summary
          </div>
          <h3 className="text-2xl font-bold text-[var(--color-text)]">Share With Doctor</h3>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            Select, customize, and bundle your medical reports into a professional, clinician-formatted SBAR summary. Give your physician precise insight with chronological trend comparisons and flagged indicators.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={handleCopy}
            className="flex-1 md:flex-none px-5 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/40 transition-colors flex items-center justify-center gap-2"
            id="btn-copy-handover"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Text
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting || selectedDocs.length === 0}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            id="btn-download-handover"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : exportSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? "Generating PDF..." : exportSuccess ? "Downloaded!" : "Download PDF"}
          </button>
        </div>
      </div>

      {exportError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{exportError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="handover-workspace-grid">
        {/* Left Column: Report Scope Picker */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-sm text-[var(--color-text)] flex items-center justify-between">
              <span>Report Scope Picker</span>
              <span className="text-xs font-normal text-[var(--color-text-muted)]">
                {selectedDocIds.length} of {documents.length} selected
              </span>
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Toggle specific laboratory reports to automatically compute the dynamic biomarker trends and critical indicators included in the doctor's document.
            </p>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1" id="scope-picker-list">
              {isLoadingDocs ? (
                [...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-12 bg-[var(--color-bg)]/40 rounded-xl animate-pulse" />
                ))
              ) : documents.length > 0 ? (
                documents.map((doc) => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  let formattedDate = "Unknown date";
                  if (doc.extractedDate || doc.date) {
                    try {
                      formattedDate = format(new Date(doc.extractedDate || doc.date), "dd MMM yyyy");
                    } catch (e) {
                      formattedDate = doc.extractedDate || doc.date;
                    }
                  }

                  return (
                    <button
                      key={doc.id}
                      onClick={() => toggleDocSelected(doc.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        isSelected
                          ? "bg-indigo-500/5 border-indigo-500/30 text-[var(--color-text)]"
                          : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                      }`}
                      id={`scope-picker-item-${doc.id}`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-[var(--color-border)] bg-transparent"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3px]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs truncate">
                          {doc.hospitalName && doc.hospitalName !== "Unknown" ? doc.hospitalName : doc.fileName || "Lab Report"}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> {formattedDate}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-[var(--color-text-faint)] italic">
                  No documents available. Upload some from the Documents tab.
                </div>
              )}
            </div>
          </div>

          {/* Prompt Sync Indicator */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex gap-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
            <Info className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[var(--color-text)] block mb-1">Empowering Your SBAR</span>
              Modify any section of the SBAR below to tailor the messages, clarify symptoms, or insert direct questions for your upcoming clinical consultation.
            </div>
          </div>
        </div>

        {/* Right Column: SBAR Customization & Live Previews */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs header */}
          <div className="flex border-b border-[var(--color-border)] gap-6" id="handover-tab-header">
            <button
              onClick={() => setActiveTab("sbar")}
              className={`pb-3 font-bold text-sm tracking-tight transition-colors border-b-2 ${
                activeTab === "sbar"
                  ? "border-indigo-500 text-[var(--color-text)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Editable SBAR Draft
            </button>
            <button
              onClick={() => setActiveTab("flagged")}
              className={`pb-3 font-bold text-sm tracking-tight transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "flagged"
                  ? "border-indigo-500 text-[var(--color-text)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Flagged Indicators
              {selectedFlaggedObservations.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {selectedFlaggedObservations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("trends")}
              className={`pb-3 font-bold text-sm tracking-tight transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "trends"
                  ? "border-indigo-500 text-[var(--color-text)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Consolidated Trends
              {selectedTrends.length > 0 && (
                <span className="bg-indigo-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {selectedTrends.length}
                </span>
              )}
            </button>
          </div>

          <div id="handover-tab-content">
            {isGeneratingSbar ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 text-center flex flex-col items-center">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                  Synthesizing medical history into SBAR framework...
                </p>
              </div>
            ) : sbarError ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 text-center flex flex-col items-center">
                <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
                <h4 className="font-bold text-base text-[var(--color-text)] mb-1">Synthesis Offline</h4>
                <p className="text-xs text-[var(--color-text-muted)] mb-4">{sbarError}</p>
                <button
                  onClick={() => fetchSBARText(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  Retry Synthesis
                </button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === "sbar" && (
                  <motion.div
                    key="tab-sbar"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Situation Field */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-indigo-500 block">
                        S - Situation (Current Status)
                      </label>
                      <textarea
                        value={editableSbar.situation}
                        onChange={(e) => setEditableSbar({ ...editableSbar, situation: e.target.value })}
                        className="w-full min-h-[70px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text)] placeholder-muted focus:outline-none focus:border-[var(--color-primary)]/50 transition-colors"
                        id="textarea-sbar-situation"
                      />
                    </div>

                    {/* Background Field */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-indigo-500 block">
                        B - Background (History & Medications)
                      </label>
                      <textarea
                        value={editableSbar.background}
                        onChange={(e) => setEditableSbar({ ...editableSbar, background: e.target.value })}
                        className="w-full min-h-[90px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text)] placeholder-muted focus:outline-none focus:border-[var(--color-primary)]/50 transition-colors"
                        id="textarea-sbar-background"
                      />
                    </div>

                    {/* Assessment Lists */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-indigo-500 block">
                        A - Assessment (Abnormal findings & clinical meaning)
                      </label>
                      <div className="space-y-2">
                        {editableSbar.assessment.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newAss = [...editableSbar.assessment];
                                newAss[idx] = e.target.value;
                                setEditableSbar({ ...editableSbar, assessment: newAss });
                              }}
                              className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                const newAss = editableSbar.assessment.filter((_, i) => i !== idx);
                                setEditableSbar({ ...editableSbar, assessment: newAss });
                              }}
                              className="text-red-500 text-xs font-bold hover:underline px-2"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            setEditableSbar({
                              ...editableSbar,
                              assessment: [...editableSbar.assessment, "New clinical assessment point"]
                            })
                          }
                          className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1 mt-1"
                        >
                          + Add Assessment Bullet
                        </button>
                      </div>
                    </div>

                    {/* Recommendation Lists */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-indigo-500 block">
                        R - Recommendation (Clinical next steps & Patient Questions)
                      </label>
                      <div className="space-y-2">
                        {editableSbar.recommendation.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newRec = [...editableSbar.recommendation];
                                newRec[idx] = e.target.value;
                                setEditableSbar({ ...editableSbar, recommendation: newRec });
                              }}
                              className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                const newRec = editableSbar.recommendation.filter((_, i) => i !== idx);
                                setEditableSbar({ ...editableSbar, recommendation: newRec });
                              }}
                              className="text-red-500 text-xs font-bold hover:underline px-2"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            setEditableSbar({
                              ...editableSbar,
                              recommendation: [...editableSbar.recommendation, "New clinical recommendation or question"]
                            })
                          }
                          className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1 mt-1"
                        >
                          + Add Recommendation / Question Bullet
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "flagged" && (
                  <motion.div
                    key="tab-flagged"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-[var(--color-text)]">Highly Concerning & Flagged Indicators</h4>
                      <span className="text-xs text-[var(--color-text-muted)] italic">
                        {selectedFlaggedObservations.length} indicators flagged
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[var(--color-surface)] text-[var(--color-text-muted)] font-semibold border-b border-[var(--color-border)]">
                            <th className="px-4 py-3">Biomarker</th>
                            <th className="px-4 py-3 text-right">Value</th>
                            <th className="px-4 py-3 text-center">Severity</th>
                            <th className="px-4 py-3">Reference Range</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                          {selectedFlaggedObservations.length > 0 ? (
                            selectedFlaggedObservations.map((obs, idx) => {
                              const isCritical = String(obs.flag).toUpperCase().includes("CRITICAL");
                              const isHigh = String(obs.flag).toUpperCase().includes("HIGH");
                              const statusClass = isCritical
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : isHigh
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-orange-500/10 text-orange-500 border-orange-500/20";

                              return (
                                <tr key={idx} className="hover:bg-[var(--color-surface)]/40">
                                  <td className="px-4 py-3 font-semibold">{obs.testName}</td>
                                  <td className="px-4 py-3 text-right font-bold">{obs.value} {obs.unit}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusClass}`}>
                                      {obs.flag}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{obs.referenceRange}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)] italic">
                                No highly concerning biomarkers flagged across selected documents.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {activeTab === "trends" && (
                  <motion.div
                    key="tab-trends"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-[var(--color-text)]">Dynamic Historical Trends</h4>
                      <span className="text-xs text-[var(--color-text-muted)] italic">
                        Computed across {selectedDocs.length} documents
                      </span>
                    </div>

                    <div className="space-y-2">
                      {selectedTrends.length > 0 ? (
                        selectedTrends.map((trend, idx) => {
                          const isUp = trend.direction === "up";
                          const isDown = trend.direction === "down";
                          return (
                            <div
                              key={idx}
                              className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3.5 flex justify-between items-center"
                            >
                              <span className="font-semibold text-xs text-[var(--color-text)]">{trend.biomarker}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-[var(--color-text-muted)]">
                                  Trend:
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    isUp
                                      ? "bg-red-500/10 text-red-500"
                                      : isDown
                                      ? "bg-emerald-500/10 text-emerald-500"
                                      : "bg-slate-100 text-slate-300"
                                  }`}
                                >
                                  {isUp ? "Increased" : isDown ? "Decreased" : "Stable"} ({trend.deltaPercent}%)
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-xs text-[var(--color-text-faint)] italic bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl">
                          Insufficient timeline data. Please select at least two reports containing identical biomarkers to generate trend lines.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
