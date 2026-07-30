import React, { useState } from "react";
import { Medication, DrugInteraction } from "../../types/health";
import { AlertTriangle, CheckCircle2, ShieldAlert, HeartPulse, Info, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

interface InteractionMatrixProps {
  medications: Medication[];
  interactions: DrugInteraction[];
  onOpenChat?: () => void;
}

export default function InteractionMatrix({
  medications,
  interactions,
  onOpenChat,
}: InteractionMatrixProps) {
  const [selectedPair, setSelectedPair] = useState<{
    medA: Medication;
    medB: Medication;
    interaction: DrugInteraction | null;
  } | null>(null);

  // Filter out any invalid / empty medications
  const activeMeds = medications.filter(m => m.genericName);

  if (activeMeds.length < 2) {
    return (
      <div className="bg-surface backdrop-blur-xl border border-surface p-8 rounded-[32px] text-center max-w-2xl mx-auto shadow-xl">
        <div className="w-16 h-16 rounded-full bg-slate-500/10 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <HeartPulse className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Clinical Interaction Matrix
        </h3>
        <p className="text-muted text-sm max-w-md mx-auto mb-6">
          To map out potential drug-to-drug interactions, please add at least two medications to your profile. The matrix will automatically populate with real-time RxNorm clinical data.
        </p>
        <div className="text-xs text-faint uppercase tracking-wider font-semibold">
          Currently tracking {activeMeds.length} medication{activeMeds.length === 1 ? "" : "s"}
        </div>
      </div>
    );
  }

  // Find interaction helper
  const getCellInteraction = (med1: Medication, med2: Medication): DrugInteraction | null => {
    if (med1.id === med2.id) return null;
    
    return (
      interactions.find((inter) => {
        // Match using RxCUI if available
        if (med1.rxcui && med2.rxcui) {
          const matchRxCUI =
            (inter.rxcuiA === med1.rxcui && inter.rxcuiB === med2.rxcui) ||
            (inter.rxcuiA === med2.rxcui && inter.rxcuiB === med1.rxcui);
          if (matchRxCUI) return true;
        }

        // Fallback to name match
        const nameA = inter.drugA.toLowerCase();
        const nameB = inter.drugB.toLowerCase();
        const genA = med1.genericName.toLowerCase();
        const genB = med2.genericName.toLowerCase();

        return (
          (nameA === genA && nameB === genB) ||
          (nameA === genB && nameB === genA) ||
          genA.includes(nameA) && genB.includes(nameB) ||
          genB.includes(nameA) && genA.includes(nameB)
        );
      }) || null
    );
  };

  const handleCellClick = (med1: Medication, med2: Medication) => {
    if (med1.id === med2.id) return;
    const inter = getCellInteraction(med1, med2);
    setSelectedPair({
      medA: med1,
      medB: med2,
      interaction: inter,
    });
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
                Drug-Drug Interaction Matrix
              </h3>
            </div>
            
            {/* Color Coding Legend */}
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-red-500">
                <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </span>
                Severe
              </div>
              <div className="flex items-center gap-1.5 text-amber-500">
                <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </span>
                Moderate
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                Compatible
              </div>
            </div>
          </div>

          <p className="text-muted text-sm font-light mb-8 max-w-3xl leading-relaxed">
            Unify and audit your current active medications. Select any intersecting tile below to analyze biochemical compatibility, metabolic pathways, and side-effect synergies automatically aggregated from RxNorm databases.
          </p>

          {/* Responsive Matrix Grid Layout */}
          <div className="overflow-x-auto pb-4 scrollbar-thin">
            <div className="min-w-[600px] select-none p-2 bg-black/10 rounded-2xl border border-white/5">
              {/* Grid Header Row */}
              <div className="grid" style={{ gridTemplateColumns: `150px repeat(${activeMeds.length}, minmax(0, 1fr))` }}>
                <div className="p-3 text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center bg-black/20 rounded-tl-xl border-b border-white/5">
                  Regimen
                </div>
                {activeMeds.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 truncate tracking-tight uppercase border-b border-white/5 bg-black/5"
                    title={m.genericName}
                  >
                    {m.genericName}
                  </div>
                ))}
              </div>

              {/* Grid Rows */}
              {activeMeds.map((mRow, rIdx) => (
                <div
                  key={mRow.id}
                  className="grid border-b border-white/5 last:border-0"
                  style={{ gridTemplateColumns: `150px repeat(${activeMeds.length}, minmax(0, 1fr))` }}
                >
                  {/* Left Label */}
                  <div
                    className="p-3 text-xs font-bold text-slate-800 dark:text-slate-200 truncate bg-black/10 flex items-center border-r border-white/5"
                    title={mRow.genericName}
                  >
                    {mRow.genericName}
                  </div>

                  {/* Intersecting Matrix Cells */}
                  {activeMeds.map((mCol, cIdx) => {
                    const isSelf = mRow.id === mCol.id;
                    const inter = getCellInteraction(mRow, mCol);
                    const isSelected = selectedPair && 
                      ((selectedPair.medA.id === mRow.id && selectedPair.medB.id === mCol.id) ||
                       (selectedPair.medA.id === mCol.id && selectedPair.medB.id === mRow.id));

                    let cellBg = "bg-transparent";
                    let ringColor = "";
                    let dotColor = "bg-emerald-500";
                    let statusLabel = "No known major interaction";

                    if (isSelf) {
                      cellBg = "bg-slate-400/5 dark:bg-slate-800/20";
                      ringColor = "border-transparent";
                    } else if (inter) {
                      if (inter.severity === "severe") {
                        cellBg = "bg-red-500/5 hover:bg-red-500/10 cursor-pointer";
                        dotColor = "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]";
                        ringColor = isSelected ? "border-red-500 ring-2 ring-red-500/20" : "border-red-500/20 hover:border-red-500/50";
                        statusLabel = "Severe interaction alert";
                      } else if (inter.severity === "moderate") {
                        cellBg = "bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer";
                        dotColor = "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]";
                        ringColor = isSelected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-amber-500/20 hover:border-amber-500/50";
                        statusLabel = "Moderate interaction alert";
                      } else {
                        cellBg = "bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer";
                        dotColor = "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]";
                        ringColor = isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-blue-500/20 hover:border-blue-500/50";
                        statusLabel = "Mild interaction alert";
                      }
                    } else {
                      // Fully compatible
                      cellBg = "bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer";
                      dotColor = "bg-emerald-500";
                      ringColor = isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-500/10 hover:border-emerald-500/30";
                    }

                    return (
                      <div
                        key={mCol.id}
                        onClick={() => handleCellClick(mRow, mCol)}
                        className={`aspect-square md:aspect-auto md:h-16 flex items-center justify-center border-r border-white/5 last:border-0 transition-all ${cellBg} ${ringColor} border-2 m-[2px] rounded-xl`}
                        title={isSelf ? "N/A" : `${mRow.genericName} + ${mCol.genericName}: ${statusLabel}`}
                      >
                        {isSelf ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-600 opacity-20" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 justify-center">
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center border border-white/10 ${dotColor}`} />
                            {inter && (
                              <span className="text-xs font-bold text-xs scale-90 whitespace-nowrap px-1 rounded bg-black/30 dark:text-slate-300">
                                {inter.severity === "severe" ? "severe" : inter.severity === "moderate" ? "moderate" : "mild"}
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

          <div className="mt-4 flex items-center gap-2 text-xs text-faint font-semibold uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Tip: Click on any colored tile intersection to view complete biological interaction summaries.
          </div>
        </div>
      </div>

      {/* Selected Interaction Analyzer Panel */}
      <div className="relative">
        {selectedPair ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface backdrop-blur-xl border border-surface rounded-[32px] p-6 shadow-2xl relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPair(null)}
              className="absolute top-4 right-4 text-faint hover:text-theme p-1.5 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
            >
              <span className="text-xs font-bold px-2">Clear Selection</span>
            </button>

            <div className="flex items-center gap-2.5 text-indigo-400 uppercase tracking-wider font-bold text-xs mb-4">
              <ShieldAlert className="w-4 h-4" />
              Direct-Drug Analysis
            </div>

            {/* Drug Header cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-black/15 border border-white/5 rounded-2xl">
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Medication A</span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedPair.medA.genericName}</h4>
                <div className="text-xs text-slate-300 font-medium mt-1">Dose: {selectedPair.medA.dosage || "Not set"} · Frequency: {selectedPair.medA.frequency || "Not set"}</div>
              </div>
              <div className="p-4 bg-black/15 border border-white/5 rounded-2xl">
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Medication B</span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedPair.medB.genericName}</h4>
                <div className="text-xs text-slate-300 font-medium mt-1">Dose: {selectedPair.medB.dosage || "Not set"} · Frequency: {selectedPair.medB.frequency || "Not set"}</div>
              </div>
            </div>

            {selectedPair.interaction ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h5 className="text-base font-bold text-theme">
                    Interaction Detected: {(selectedPair.interaction.drugA)} and {(selectedPair.interaction.drugB)}
                  </h5>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    selectedPair.interaction.severity === "severe"
                      ? "bg-red-500/10 text-red-400 border-red-500/25"
                      : selectedPair.interaction.severity === "moderate"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/25"
                  }`}>
                    {selectedPair.interaction.severity === "severe" ? "Severe Concern" : "Moderate Concern"}
                  </span>
                </div>

                <div className="p-5 bg-black/20 rounded-2xl border border-white/5 space-y-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest font-bold text-slate-300 block mb-1">
                      RxNorm DB Information
                    </span>
                    <p className="text-sm text-theme leading-relaxed">
                      {selectedPair.interaction.description}
                    </p>
                  </div>

                  {selectedPair.interaction.plainSummary && (
                    <div className="pt-4 border-t border-white/5">
                      <span className="text-xs uppercase tracking-widest font-bold text-indigo-400 flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        Clinical Narrative by Aura AI
                      </span>
                      <p className="text-sm text-muted leading-relaxed">
                        {selectedPair.interaction.plainSummary}
                      </p>
                    </div>
                  )}
                </div>

                {onOpenChat && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={onOpenChat}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Audit side-effects further in Aura Chat
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    No Known Direct Interactions Detected
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    Both {selectedPair.medA.genericName} and {selectedPair.medB.genericName} are currently categorized as bio-compatible for simultaneous consumption based on RxNorm cross-referencing.
                  </p>
                </div>
                {onOpenChat && (
                  <button
                    onClick={onOpenChat}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/15 rounded-xl border border-indigo-500/10"
                  >
                    Discuss timing with Aura
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <div className="p-6 border border-dashed border-white/5 rounded-[32px] bg-black/10 text-center text-xs text-muted">
            Select an active medication tile intersection from the grid layout above to initiate bio-compatibility diagnostic modeling.
          </div>
        )}
      </div>
    </div>
  );
}
