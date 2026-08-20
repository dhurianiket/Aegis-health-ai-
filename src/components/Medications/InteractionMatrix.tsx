import React, { useState, useMemo, useEffect } from "react";
import { Medication, DrugInteraction } from "../../types/health";
import { 
  LabBiomarker, 
  DrugLabContraindication, 
  evaluateDrugLabContraindications,
  buildBioRegimenSafetySummary
} from "../../services/drugLabEngine";
import {
  fetchOpenFdaAdverseEvents,
  resolveRxCuiFuzzy,
  OpenFdaAdverseEventSummary,
} from "../../services/drugInteractionService";
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck,
  HeartPulse, 
  Info, 
  ArrowUpRight,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InteractionMatrixProps {
  medications: Medication[];
  interactions: DrugInteraction[];
  labBiomarkers?: LabBiomarker[];
  drugLabContraindications?: DrugLabContraindication[];
  onOpenChat?: (prompt?: string) => void;
}

export default function InteractionMatrix({
  medications,
  interactions,
  labBiomarkers = [],
  drugLabContraindications: externalContraindications,
  onOpenChat,
}: InteractionMatrixProps) {
  const [viewMode, setViewMode] = useState<"drug-drug" | "drug-lab" | "overview">("drug-drug");
  const [selectedPair, setSelectedPair] = useState<{
    medA: Medication;
    medB: Medication;
    interaction: DrugInteraction | null;
  } | null>(null);

  const [selectedContra, setSelectedContra] = useState<DrugLabContraindication | null>(null);
  const [adverseSummaries, setAdverseSummaries] = useState<Record<string, OpenFdaAdverseEventSummary>>({});

  // Filter out any invalid / empty medications
  const activeMeds = useMemo(() => medications.filter(m => m.genericName), [medications]);

  // Load OpenFDA Adverse Event and RxCUI data
  useEffect(() => {
    let isMounted = true;
    async function loadOpenFdaData() {
      const results: Record<string, OpenFdaAdverseEventSummary> = {};
      for (const med of activeMeds) {
        const name = med.genericName || med.brandName || '';
        if (!name) continue;
        const summary = await fetchOpenFdaAdverseEvents(med.rxcui || name);
        results[name.toLowerCase()] = summary;
        if (med.rxcui) results[med.rxcui] = summary;
      }
      if (isMounted) {
        setAdverseSummaries(results);
      }
    }
    if (activeMeds.length > 0) {
      loadOpenFdaData();
    }
    return () => { isMounted = false; };
  }, [activeMeds]);

  // Evaluated Drug-Lab contraindications
  const computedContraindications = useMemo(() => {
    if (externalContraindications && externalContraindications.length > 0) {
      return externalContraindications;
    }
    return evaluateDrugLabContraindications(activeMeds, labBiomarkers);
  }, [activeMeds, labBiomarkers, externalContraindications]);

  // Overall Safety Summary
  const safetySummary = useMemo(() => {
    return buildBioRegimenSafetySummary(activeMeds, labBiomarkers, interactions);
  }, [activeMeds, labBiomarkers, interactions]);

  // Unique lab biomarkers for matrix columns
  const monitoredBiomarkers = useMemo(() => {
    const uniqueMap = new Map<string, LabBiomarker>();
    labBiomarkers.forEach((b) => {
      const name = b.testName || b.marker || "";
      if (name && !uniqueMap.has(name.toLowerCase())) {
        uniqueMap.set(name.toLowerCase(), b);
      }
    });
    return Array.from(uniqueMap.values());
  }, [labBiomarkers]);

  if (activeMeds.length === 0) {
    return (
      <div className="bg-surface backdrop-blur-xl border border-surface p-8 rounded-[32px] text-center max-w-2xl mx-auto shadow-xl">
        <div className="w-16 h-16 rounded-full bg-slate-500/10 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <HeartPulse className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Clinical Interaction Matrix
        </h3>
        <p className="text-muted text-sm max-w-md mx-auto mb-6">
          Add active medications and upload lab reports to generate real-time Drug-Drug & Drug-Lab contraindication matrices.
        </p>
        <div className="text-xs text-faint uppercase tracking-wider font-semibold">
          Currently tracking 0 medications
        </div>
      </div>
    );
  }

  // Find drug-drug interaction helper
  const getCellInteraction = (med1: Medication, med2: Medication): DrugInteraction | null => {
    if (med1.id === med2.id) return null;
    
    return (
      interactions.find((inter) => {
        if (med1.rxcui && med2.rxcui) {
          const matchRxCUI =
            (inter.rxcuiA === med1.rxcui && inter.rxcuiB === med2.rxcui) ||
            (inter.rxcuiA === med2.rxcui && inter.rxcuiB === med1.rxcui);
          if (matchRxCUI) return true;
        }

        const nameA = inter.drugA.toLowerCase();
        const nameB = inter.drugB.toLowerCase();
        const genA = med1.genericName.toLowerCase();
        const genB = med2.genericName.toLowerCase();

        return (
          (nameA === genA && nameB === genB) ||
          (nameA === genB && nameB === genA) ||
          (genA.includes(nameA) && genB.includes(nameB)) ||
          (genB.includes(nameA) && genA.includes(nameB))
        );
      }) || null
    );
  };

  // Find drug-lab contraindication helper
  const getDrugLabContra = (med: Medication, biomarker: LabBiomarker): DrugLabContraindication | null => {
    return (
      computedContraindications.find((c) => {
        const medMatch = c.medicationId === med.id || 
          c.medicationName.toLowerCase().includes(med.genericName.toLowerCase()) ||
          med.genericName.toLowerCase().includes(c.medicationName.toLowerCase());
        
        const bioMatch = c.biomarkerName.toLowerCase().includes((biomarker.testName || biomarker.marker || "").toLowerCase()) ||
          (biomarker.testName || biomarker.marker || "").toLowerCase().includes(c.biomarkerName.toLowerCase());
        
        return medMatch && bioMatch;
      }) || null
    );
  };

  const handleDrugCellClick = (med1: Medication, med2: Medication) => {
    if (med1.id === med2.id) return;
    const inter = getCellInteraction(med1, med2);
    setSelectedContra(null);
    setSelectedPair({
      medA: med1,
      medB: med2,
      interaction: inter,
    });
  };

  const handleLabCellClick = (med: Medication, bio: LabBiomarker) => {
    const contra = getDrugLabContra(med, bio);
    setSelectedPair(null);
    if (contra) {
      setSelectedContra(contra);
    } else {
      setSelectedContra({
        id: `safe-${med.id}-${bio.testName}`,
        medicationName: med.genericName,
        biomarkerName: bio.testName || bio.marker || "Biomarker",
        biomarkerValue: `${bio.value} ${bio.unit || ""}`,
        severity: "safe",
        title: "Compatible Pairing",
        description: `No active clinical contraindication identified between ${med.genericName} and ${bio.testName}.`,
        plainSummary: `${med.genericName} shows no contraindication with current ${bio.testName} level (${bio.value}).`,
        clinicalRationale: "Normal physiological clearance and mechanism of action.",
        recommendedAction: "Maintain standard routine care and monitoring.",
        detectedAt: new Date().toISOString()
      });
    }
  };

  const askAuraAI = (promptText: string) => {
    if (onOpenChat) {
      onOpenChat(promptText);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface backdrop-blur-xl border border-surface p-6 md:p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
        {/* Decorative Grid Mesh */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-500 uppercase tracking-wider font-bold text-xs mb-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Live Bio-Regimen Safety Matrix
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Integrated Regimen & Biomarker Safety Engine
              </h3>
            </div>
            
            {/* View Mode Switcher */}
            <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/10 text-xs font-semibold">
              <button
                onClick={() => setViewMode("drug-drug")}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  viewMode === "drug-drug"
                    ? "bg-indigo-600 text-white font-bold shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:text-theme"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Drug-Drug Matrix
              </button>
              <button
                onClick={() => setViewMode("drug-lab")}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  viewMode === "drug-lab"
                    ? "bg-indigo-600 text-white font-bold shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:text-theme"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Drug-Lab Matrix
              </button>
              <button
                onClick={() => setViewMode("overview")}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  viewMode === "overview"
                    ? "bg-indigo-600 text-white font-bold shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:text-theme"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Integrated Overview
              </button>
            </div>
          </div>

          {/* Color Coding Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-surface">
            <p className="text-muted text-sm max-w-2xl leading-relaxed">
              {viewMode === "drug-drug" && "Cross-referencing active medications for metabolic and pharmacodynamic interactions via RxNorm."}
              {viewMode === "drug-lab" && "Evaluating real-time lab biomarkers against active prescription contraindications per clinical guidelines."}
              {viewMode === "overview" && "Unified bio-regimen safety dashboard summarizing critical alerts, warnings, and compatible pairings."}
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-red-500">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </span>
                Critical
              </div>
              <div className="flex items-center gap-1.5 text-amber-500">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </span>
                Moderate
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                Compatible / Safe
              </div>
            </div>
          </div>

          {/* 1. DRUG-DRUG MATRIX VIEW */}
          {viewMode === "drug-drug" && (
            <div>
              {/* Desktop / Tablet Grid with Horizontal Scroll */}
              <div className="overflow-x-auto pb-4 scrollbar-thin">
                <div className="min-w-[650px] select-none p-2 bg-black/10 rounded-2xl border border-white/5">
                  <div className="grid" style={{ gridTemplateColumns: `160px repeat(${activeMeds.length}, minmax(0, 1fr))` }}>
                    <div className="p-3 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center bg-black/20 rounded-tl-xl border-b border-white/5">
                      Active Regimen
                    </div>
                    {activeMeds.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 text-center text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight uppercase border-b border-white/5 bg-black/5 flex flex-col items-center justify-center gap-1"
                        title={m.genericName}
                      >
                        <span className="truncate max-w-[120px]">{m.genericName}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-semibold tracking-normal lowercase">
                          RxCUI: {m.rxcui || (adverseSummaries[m.genericName.toLowerCase()]?.rxcui) || 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {activeMeds.map((mRow) => (
                    <div
                      key={mRow.id}
                      className="grid border-b border-white/5 last:border-0"
                      style={{ gridTemplateColumns: `160px repeat(${activeMeds.length}, minmax(0, 1fr))` }}
                    >
                      <div
                        className="p-3 text-xs font-bold text-slate-800 dark:text-slate-200 truncate bg-black/10 flex flex-col justify-center border-r border-white/5 gap-1"
                        title={mRow.genericName}
                      >
                        <span className="truncate">{mRow.genericName}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-semibold w-fit">
                          RxCUI: {mRow.rxcui || (adverseSummaries[mRow.genericName.toLowerCase()]?.rxcui) || 'Pending'}
                        </span>
                      </div>

                      {activeMeds.map((mCol) => {
                        const isSelf = mRow.id === mCol.id;
                        const inter = getCellInteraction(mRow, mCol);
                        const isSelected = selectedPair && 
                          ((selectedPair.medA.id === mRow.id && selectedPair.medB.id === mCol.id) ||
                           (selectedPair.medA.id === mCol.id && selectedPair.medB.id === mRow.id));

                        let cellBg = "bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer";
                        let ringColor = isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-500/10 hover:border-emerald-500/30";
                        let dotColor = "bg-emerald-500";

                        if (isSelf) {
                          cellBg = "bg-slate-400/5 dark:bg-slate-800/20";
                          ringColor = "border-transparent";
                        } else if (inter) {
                          if (inter.severity === "severe") {
                            cellBg = "bg-red-500/10 hover:bg-red-500/20 cursor-pointer";
                            dotColor = "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]";
                            ringColor = isSelected ? "border-red-500 ring-2 ring-red-500/20" : "border-red-500/25 hover:border-red-500/50";
                          } else if (inter.severity === "moderate") {
                            cellBg = "bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer";
                            dotColor = "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]";
                            ringColor = isSelected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-amber-500/25 hover:border-amber-500/50";
                          }
                        }

                        return (
                          <div
                            key={mCol.id}
                            onClick={() => handleDrugCellClick(mRow, mCol)}
                            className={`h-16 flex items-center justify-center border-r border-white/5 last:border-0 transition-all ${cellBg} ${ringColor} border-2 m-[2px] rounded-xl`}
                          >
                            {isSelf ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-600 opacity-20" />
                            ) : (
                              <div className="flex flex-col items-center gap-1 justify-center">
                                <span className={`w-3 h-3 rounded-full flex items-center justify-center border border-white/10 ${dotColor}`} />
                                {inter && (
                                  <span className="text-[10px] font-bold uppercase tracking-tighter px-1 rounded bg-black/40 text-white">
                                    {inter.severity}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Stacked Cards Layout (md:hidden block per AGENTS.md Rule 3) */}
              <div className="md:hidden block space-y-3 mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Drug-Drug Pairings (Mobile View)</h4>
                {activeMeds.flatMap((mRow, rIdx) => 
                  activeMeds.slice(rIdx + 1).map((mCol) => {
                    const inter = getCellInteraction(mRow, mCol);
                    const cuiA = mRow.rxcui || adverseSummaries[mRow.genericName.toLowerCase()]?.rxcui;
                    const cuiB = mCol.rxcui || adverseSummaries[mCol.genericName.toLowerCase()]?.rxcui;
                    return (
                      <div
                        key={`mob-${mRow.id}-${mCol.id}`}
                        onClick={() => handleDrugCellClick(mRow, mCol)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                          inter?.severity === "severe"
                            ? "bg-red-500/10 border-red-500/30 text-red-300"
                            : inter?.severity === "moderate"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : "bg-surface border-surface hover:border-border text-theme"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {mRow.genericName} + {mCol.genericName}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            inter?.severity === "severe" ? "bg-red-500 text-white" : inter?.severity === "moderate" ? "bg-amber-500 text-black" : "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          }`}>
                            {inter ? inter.severity : "Compatible"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {cuiA && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-semibold">
                              {mRow.genericName}: RxCUI {cuiA}
                            </span>
                          )}
                          {cuiB && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-semibold">
                              {mCol.genericName}: RxCUI {cuiB}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted">
                          {inter ? inter.plainSummary : "No known direct interaction"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 2. DRUG-LAB MATRIX VIEW */}
          {viewMode === "drug-lab" && (
            <div>
              {monitoredBiomarkers.length === 0 ? (
                <div className="p-8 text-center bg-black/10 rounded-2xl border border-white/5">
                  <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No extracted lab biomarkers found</p>
                  <p className="text-xs text-muted mt-1">Upload lab reports to enable real-time Drug-Lab contraindication auditing.</p>
                </div>
              ) : (
                <>
                  {/* Desktop / Tablet Grid with Horizontal Scroll */}
                  <div className="overflow-x-auto pb-4 scrollbar-thin">
                    <div className="min-w-[650px] select-none p-2 bg-black/10 rounded-2xl border border-white/5">
                      <div className="grid" style={{ gridTemplateColumns: `160px repeat(${monitoredBiomarkers.length}, minmax(0, 1fr))` }}>
                        <div className="p-3 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center bg-black/20 rounded-tl-xl border-b border-white/5">
                          Medication / Lab
                        </div>
                        {monitoredBiomarkers.map((b, idx) => (
                          <div
                            key={idx}
                            className="p-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 truncate tracking-tight uppercase border-b border-white/5 bg-black/5"
                            title={`${b.testName}: ${b.value} ${b.unit || ""}`}
                          >
                            <div>{b.testName}</div>
                            <div className="text-[10px] text-muted normal-case font-normal">{b.value} {b.unit || ""}</div>
                          </div>
                        ))}
                      </div>

                      {activeMeds.map((med) => (
                        <div
                          key={med.id}
                          className="grid border-b border-white/5 last:border-0"
                          style={{ gridTemplateColumns: `160px repeat(${monitoredBiomarkers.length}, minmax(0, 1fr))` }}
                        >
                          <div
                            className="p-3 text-xs font-bold text-slate-800 dark:text-slate-200 truncate bg-black/10 flex items-center border-r border-white/5"
                            title={med.genericName}
                          >
                            {med.genericName}
                          </div>

                          {monitoredBiomarkers.map((bio, bIdx) => {
                            const contra = getDrugLabContra(med, bio);
                            const isSelected = selectedContra && selectedContra.medicationName.toLowerCase().includes(med.genericName.toLowerCase()) && selectedContra.biomarkerName.toLowerCase().includes((bio.testName || bio.marker || "").toLowerCase());

                            let cellBg = "bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer";
                            let ringColor = isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-500/10 hover:border-emerald-500/30";
                            let dotColor = "bg-emerald-500";

                            if (contra) {
                              if (contra.severity === "critical") {
                                cellBg = "bg-red-500/10 hover:bg-red-500/20 cursor-pointer";
                                dotColor = "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]";
                                ringColor = isSelected ? "border-red-500 ring-2 ring-red-500/20" : "border-red-500/25 hover:border-red-500/50";
                              } else if (contra.severity === "moderate") {
                                cellBg = "bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer";
                                dotColor = "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]";
                                ringColor = isSelected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-amber-500/25 hover:border-amber-500/50";
                              }
                            }

                            return (
                              <div
                                key={bIdx}
                                onClick={() => handleLabCellClick(med, bio)}
                                className={`h-16 flex items-center justify-center border-r border-white/5 last:border-0 transition-all ${cellBg} ${ringColor} border-2 m-[2px] rounded-xl`}
                              >
                                <div className="flex flex-col items-center gap-1 justify-center">
                                  <span className={`w-3 h-3 rounded-full flex items-center justify-center border border-white/10 ${dotColor}`} />
                                  {contra ? (
                                    <span className="text-[10px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded bg-black/40 text-white">
                                      {contra.severity}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-emerald-400 opacity-60">Safe</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Stacked Cards Layout (md:hidden block) */}
                  <div className="md:hidden block space-y-3 mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Drug-Lab Pairings (Mobile View)</h4>
                    {activeMeds.flatMap((med) =>
                      monitoredBiomarkers.map((bio, bIdx) => {
                        const contra = getDrugLabContra(med, bio);
                        return (
                          <div
                            key={`mob-lab-${med.id}-${bIdx}`}
                            onClick={() => handleLabCellClick(med, bio)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              contra?.severity === "critical"
                                ? "bg-red-500/10 border-red-500/30 text-red-300"
                                : contra?.severity === "moderate"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                : "bg-surface border-surface hover:border-border text-theme"
                            }`}
                          >
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white">
                                {med.genericName} + {bio.testName} ({bio.value} {bio.unit || ""})
                              </div>
                              <div className="text-xs text-muted mt-0.5">
                                {contra ? contra.plainSummary : "No clinical contraindication detected"}
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              contra?.severity === "critical" ? "bg-red-500 text-white" : contra?.severity === "moderate" ? "bg-amber-500 text-black" : "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                            }`}>
                              {contra ? contra.severity : "Safe"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 3. INTEGRATED BIO-REGIMEN OVERVIEW */}
          {viewMode === "overview" && (
            <div className="space-y-6">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-lg">
                    {safetySummary.criticalAlertCount}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-red-400 uppercase tracking-wider">Critical Alerts</div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">Immediate clinical attention recommended</div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                    {safetySummary.warningCount}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Moderate Warnings</div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">Monitoring & routine check recommended</div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                    {safetySummary.compatibleCount + (monitoredBiomarkers.length * activeMeds.length - computedContraindications.length)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Safe Pairings</div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">Compatible bio-regimen combinations</div>
                  </div>
                </div>
              </div>

              {/* FDA Boxed Warnings Regimen Alert Banners */}
              {activeMeds.some((m) => {
                const adv = adverseSummaries[m.genericName.toLowerCase()] || (m.rxcui ? adverseSummaries[m.rxcui] : null);
                return adv?.blackBoxWarning.hasWarning;
              }) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                    FDA Boxed Warnings in Active Regimen
                  </h4>
                  {activeMeds.map((m) => {
                    const adv = adverseSummaries[m.genericName.toLowerCase()] || (m.rxcui ? adverseSummaries[m.rxcui] : null);
                    if (!adv?.blackBoxWarning.hasWarning) return null;
                    return (
                      <div
                        key={`boxed-${m.id}`}
                        className="bg-rose-950/20 border border-rose-500/40 rounded-2xl p-4 shadow-lg flex items-start gap-3"
                      >
                        <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-rose-500 text-white font-black text-[10px] uppercase rounded-full tracking-wider">
                              FDA Boxed Warning
                            </span>
                            <h5 className="font-bold text-slate-900 dark:text-rose-100 text-sm">
                              {m.genericName} Safety Warning
                            </h5>
                          </div>
                          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                            {adv.blackBoxWarning.summary || adv.blackBoxWarning.warningText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* All Contraindication Alert Cards */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  Active Bio-Regimen Safety Alerts ({computedContraindications.length + interactions.length})
                </h4>

                {computedContraindications.length === 0 && interactions.length === 0 ? (
                  <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <h5 className="text-base font-bold text-emerald-400">Zero Clinical Contraindications Detected</h5>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1">All active medications and lab biomarkers are fully compatible based on current medical guidelines.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Drug-Lab Contraindications */}
                    {computedContraindications.map((contra) => (
                      <div
                        key={contra.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          contra.severity === "critical"
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-amber-500/10 border-amber-500/30"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              contra.severity === "critical" ? "bg-red-500 text-white border-red-600" : "bg-amber-500 text-black border-amber-600"
                            }`}>
                              {contra.severity === "critical" ? "Critical Alert" : "Moderate Warning"}
                            </span>
                            <h5 className="font-bold text-slate-900 dark:text-white text-base">{contra.title}</h5>
                          </div>
                          {onOpenChat && (
                            <button
                              onClick={() => askAuraAI(`Please explain this clinical contraindication: ${contra.title}. ${contra.plainSummary}`)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all w-fit"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Ask Aura AI about this
                            </button>
                          )}
                        </div>

                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">{contra.plainSummary}</p>
                        <div className="text-xs text-muted bg-black/20 p-3 rounded-xl border border-white/5 space-y-1">
                          <div><strong>Clinical Rationale:</strong> {contra.clinicalRationale}</div>
                          <div><strong>Recommended Action:</strong> {contra.recommendedAction}</div>
                        </div>
                      </div>
                    ))}

                    {/* Drug-Drug Interactions */}
                    {interactions.map((inter) => (
                      <div
                        key={inter.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          inter.severity === "severe"
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-amber-500/10 border-amber-500/30"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              inter.severity === "severe" ? "bg-red-500 text-white border-red-600" : "bg-amber-500 text-black border-amber-600"
                            }`}>
                              {inter.severity === "severe" ? "Severe Drug Interaction" : "Moderate Drug Interaction"}
                            </span>
                            <h5 className="font-bold text-slate-900 dark:text-white text-base">{inter.drugA} + {inter.drugB}</h5>
                          </div>
                          {onOpenChat && (
                            <button
                              onClick={() => askAuraAI(`Please analyze the interaction between ${inter.drugA} and ${inter.drugB}: ${inter.plainSummary}`)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all w-fit"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Ask Aura AI about this
                            </button>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{inter.plainSummary || inter.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Interaction/Contraindication Inspection Drawer */}
      <AnimatePresence>
        {(selectedPair || selectedContra) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-surface backdrop-blur-xl border border-surface rounded-[32px] p-6 shadow-2xl relative space-y-6"
          >
            <button
              onClick={() => { setSelectedPair(null); setSelectedContra(null); }}
              className="absolute top-4 right-4 text-xs font-bold px-3 py-1 bg-black/20 hover:bg-black/30 text-slate-800 dark:text-slate-200 rounded-full transition-colors"
            >
              Clear Inspector
            </button>

            {selectedPair && (() => {
              const advA = adverseSummaries[selectedPair.medA.genericName.toLowerCase()] || (selectedPair.medA.rxcui ? adverseSummaries[selectedPair.medA.rxcui] : null);
              const advB = adverseSummaries[selectedPair.medB.genericName.toLowerCase()] || (selectedPair.medB.rxcui ? adverseSummaries[selectedPair.medB.rxcui] : null);

              return (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    Drug-Drug Interaction & Pharmacology Safety
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedPair.medA.genericName} + {selectedPair.medB.genericName}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedPair.medA.rxcui && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-bold">
                          {selectedPair.medA.genericName}: RxCUI {selectedPair.medA.rxcui}
                        </span>
                      )}
                      {selectedPair.medB.rxcui && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-bold">
                          {selectedPair.medB.genericName}: RxCUI {selectedPair.medB.rxcui}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interaction Detail */}
                  {selectedPair.interaction ? (
                    <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-2">
                      <p className="text-sm text-theme font-medium">{selectedPair.interaction.description}</p>
                      {selectedPair.interaction.plainSummary && (
                        <p className="text-xs text-muted pt-2 border-t border-white/5">{selectedPair.interaction.plainSummary}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                      No known severe pharmacokinetic interaction detected between {selectedPair.medA.genericName} and {selectedPair.medB.genericName}.
                    </div>
                  )}

                  {/* FDA Boxed Warnings Alert if present */}
                  {(advA?.blackBoxWarning.hasWarning || advB?.blackBoxWarning.hasWarning) && (
                    <div className="space-y-3">
                      {advA?.blackBoxWarning.hasWarning && (
                        <div className="bg-rose-950/20 border border-rose-500/40 rounded-2xl p-4 shadow-lg flex items-start gap-3">
                          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-rose-500 text-white font-black text-[10px] uppercase rounded-full tracking-wider">
                                FDA Boxed Warning
                              </span>
                              <h5 className="font-bold text-slate-900 dark:text-rose-100 text-sm">
                                {selectedPair.medA.genericName}
                              </h5>
                            </div>
                            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                              {advA.blackBoxWarning.summary || advA.blackBoxWarning.warningText}
                            </p>
                          </div>
                        </div>
                      )}
                      {advB?.blackBoxWarning.hasWarning && (
                        <div className="bg-rose-950/20 border border-rose-500/40 rounded-2xl p-4 shadow-lg flex items-start gap-3">
                          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-rose-500 text-white font-black text-[10px] uppercase rounded-full tracking-wider">
                                FDA Boxed Warning
                              </span>
                              <h5 className="font-bold text-slate-900 dark:text-rose-100 text-sm">
                                {selectedPair.medB.genericName}
                              </h5>
                            </div>
                            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                              {advB.blackBoxWarning.summary || advB.blackBoxWarning.warningText}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FAERS Adverse Reactions Bars */}
                  {(advA?.topReactions || advB?.topReactions) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {advA && (
                        <div className="p-4 bg-black/10 rounded-2xl border border-white/5 space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            {selectedPair.medA.genericName} — Top Adverse Events (FAERS)
                          </h5>
                          <div className="space-y-2">
                            {advA.topReactions.map((rx, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium text-slate-800 dark:text-slate-200">
                                  <span>{rx.term}</span>
                                  <span className="font-mono text-muted text-[11px]">{rx.count.toLocaleString()} reports ({rx.frequencyPercentage || 10}%)</span>
                                </div>
                                <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (rx.frequencyPercentage || 10) * 3)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {advB && (
                        <div className="p-4 bg-black/10 rounded-2xl border border-white/5 space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            {selectedPair.medB.genericName} — Top Adverse Events (FAERS)
                          </h5>
                          <div className="space-y-2">
                            {advB.topReactions.map((rx, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium text-slate-800 dark:text-slate-200">
                                  <span>{rx.term}</span>
                                  <span className="font-mono text-muted text-[11px]">{rx.count.toLocaleString()} reports ({rx.frequencyPercentage || 10}%)</span>
                                </div>
                                <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (rx.frequencyPercentage || 10) * 3)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clinical Citation Chips */}
                  {((advA?.citations && advA.citations.length > 0) || (advB?.citations && advB.citations.length > 0)) && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Clinical Evidence & Citations
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[...(advA?.citations || []), ...(advB?.citations || [])].map((cite) => (
                          <a
                            key={cite.id}
                            href={cite.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:scale-105 transition-all shadow-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{cite.title}</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {onOpenChat && (
                    <button
                      onClick={() => askAuraAI(`Please provide a detailed safety breakdown for taking ${selectedPair.medA.genericName} together with ${selectedPair.medB.genericName}.`)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Consult Aura AI regarding this drug pair
                    </button>
                  )}
                </div>
              );
            })()}

            {selectedContra && (() => {
              const adv = adverseSummaries[selectedContra.medicationName.toLowerCase()] || (selectedContra.rxcui ? adverseSummaries[selectedContra.rxcui] : null);

              return (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Activity className="w-4 h-4" />
                    Drug-Lab Contraindication & Organ Safety
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">{selectedContra.title}</h4>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                      selectedContra.severity === "critical" ? "bg-red-500 text-white border-red-600" : selectedContra.severity === "moderate" ? "bg-amber-500 text-black border-amber-600" : "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    }`}>
                      {selectedContra.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{selectedContra.plainSummary}</p>
                  
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-2 text-xs text-muted">
                    <div><strong>Clinical Rationale:</strong> {selectedContra.clinicalRationale}</div>
                    <div><strong>Recommended Action:</strong> {selectedContra.recommendedAction}</div>
                  </div>

                  {/* FAERS Events & Citations for the drug */}
                  {adv && adv.topReactions.length > 0 && (
                    <div className="p-4 bg-black/10 rounded-2xl border border-white/5 space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {selectedContra.medicationName} — Top Adverse Reactions (OpenFDA FAERS)
                      </h5>
                      <div className="space-y-2">
                        {adv.topReactions.slice(0, 3).map((rx, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-slate-800 dark:text-slate-200">
                              <span>{rx.term}</span>
                              <span className="font-mono text-muted text-[11px]">{rx.count.toLocaleString()} reports ({rx.frequencyPercentage || 10}%)</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (rx.frequencyPercentage || 10) * 3)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {adv?.citations && adv.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                      {adv.citations.map((cite) => (
                        <a
                          key={cite.id}
                          href={cite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:scale-105 transition-all shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{cite.title}</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      ))}
                    </div>
                  )}

                  {onOpenChat && (
                    <button
                      onClick={() => askAuraAI(`Please advise me on this clinical contraindication: ${selectedContra.title}. ${selectedContra.plainSummary}`)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Ask Aura AI about this contraindication
                    </button>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
