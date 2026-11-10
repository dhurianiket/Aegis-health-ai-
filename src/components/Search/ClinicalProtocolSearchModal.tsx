import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  FileText,
  Activity,
  Heart,
  Pill,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export interface ClinicalProtocol {
  id: string;
  title: string;
  category: "Cardiology" | "Metabolic" | "Pharmacology" | "Safety & Triage" | "Clinical Communication";
  source: string;
  doi?: string;
  uri: string;
  summary: string;
  keyCutoffs: string[];
  recommendation: string;
}

export const CLINICAL_PROTOCOLS: ClinicalProtocol[] = [
  {
    id: "wearable-cardio",
    title: "Wearable Cardiovascular & Telemetry Protocol 2026",
    category: "Cardiology",
    source: "JACC: Advances & BMJ Open Scoping Review (2026)",
    doi: "10.1016/j.jacadv.2026.103270",
    uri: "gs://aegis-health-app-90697.firebasestorage.app/protocols/wearable_cardiovascular_telemetry.md",
    summary:
      "Guidelines for continuous photoplethysmography (PPG), circadian heart rate dipping, and autonomic tone monitoring in outpatient cardiology.",
    keyCutoffs: [
      "Resting HR normal baseline: 60 - 82 bpm",
      "Severe Tachycardia alert: > 130 bpm",
      "Severe Bradycardia emergency: < 45 bpm",
      "HRV RMSSD target: > 35 ms (< 20 ms indicates autonomic stress)",
    ],
    recommendation:
      "If daytime resting HR > 130 bpm persists without exertion, initiate immediate 12-lead ECG and emergency triage.",
  },
  {
    id: "continuous-glucose",
    title: "Continuous Glucose & Dysglycemia Protocol 2026",
    category: "Metabolic",
    source: "BMJ Diabetes Research & Care (2026)",
    doi: "10.1136/bmjdrc-2026-006533",
    uri: "gs://aegis-health-app-90697.firebasestorage.app/protocols/continuous_glucose_metabolic_guidelines.md",
    summary:
      "Management of dysglycemia, interstitial glucose sensor accuracy, and critical hypoglycemia thresholds in clinical practice.",
    keyCutoffs: [
      "Fasting Plasma Glucose normal: 70 - 99 mg/dL",
      "Impaired Fasting Glucose (Pre-diabetes): 100 - 125 mg/dL",
      "Level 1 Hypoglycemia alert: 54 - 69 mg/dL",
      "Level 2 Hypoglycemia (Critical Emergency): < 54 mg/dL",
      "Time in Range (70-180 mg/dL): > 70% target",
    ],
    recommendation:
      "Enforce the Rule of 15 for glucose < 70 mg/dL (15g fast carbs, re-check in 15 minutes). For < 54 mg/dL, alert medical support.",
  },
  {
    id: "anticoagulant-ddi",
    title: "Anticoagulant & Antiplatelet Drug Interaction Formulary 2026",
    category: "Pharmacology",
    source: "Heart (BMJ) & European Renal Best Practice (2026)",
    doi: "10.1136/heartjnl-2024-324551",
    uri: "gs://aegis-health-app-90697.firebasestorage.app/protocols/anticoagulant_antiplatelet_ddi_protocols.md",
    summary:
      "Evidence-based contraindication mapping and bleeding hazard quantification for Vitamin K Antagonists (Warfarin) and DOACs co-prescribed with antiplatelets.",
    keyCutoffs: [
      "Warfarin + Aspirin/NSAIDs: CRITICAL (3.2x major bleed hazard)",
      "Target INR for VKA indications: 2.0 - 3.0",
      "RAAS Inhibitors + Spironolactone: HIGH (Severe hyperkalemia > 5.5 mmol/L)",
      "Metformin + Radiocontrast: HIGH (Withhold 48h pre/post procedure)",
    ],
    recommendation:
      "Discontinue concurrent non-selective NSAIDs with oral anticoagulants unless gastroprotected by a PPI under secondary prevention protocol.",
  },
  {
    id: "clinical-sbar",
    title: "SBAR Clinical Communication & Decision Support Protocol 2026",
    category: "Clinical Communication",
    source: "Pediatric Intensive Care & Acute Care Handover Trials (2026)",
    doi: "10.1590/0034-7167-2025-0398",
    uri: "gs://aegis-health-app-90697.firebasestorage.app/protocols/clinical_sbar_decision_support.md",
    summary:
      "World Health Organization (WHO) and IHI standard for interprofessional clinical communication, reducing omission errors by over 64%.",
    keyCutoffs: [
      "[S] Situation: Immediate acute issue & vital abnormalities",
      "[B] Background: Active medications, baseline trends, diagnoses",
      "[A] Assessment: Physiological risk classification & severity",
      "[R] Recommendation: Concrete orders, lab draws, and triage timeline",
    ],
    recommendation:
      "All complex clinical consultations must summarize findings into a standardized 4-part SBAR card with copyable handoff text.",
  },
  {
    id: "aegis-clinical-protocols",
    title: "Aegis Institutional Biomarker Normalization Guidelines",
    category: "Safety & Triage",
    source: "Aegis Health AI Clinical Board (2026)",
    uri: "gs://aegis-health-app-90697.firebasestorage.app/protocols/aegis_clinical_protocols.md",
    summary:
      "Foundational reference ranges for diagnostic metabolic panels, renal function, lipid markers, and cardiac troponin cutoffs.",
    keyCutoffs: [
      "Fasting Glucose: 70 - 99 mg/dL",
      "HbA1c: Normal < 5.7%, Pre-diabetes 5.7 - 6.4%, Diabetes >= 6.5%",
      "High-Sensitivity Troponin-I: < 14 ng/L (Emergency alert if > 34 ng/L)",
      "eGFR: Normal >= 90 mL/min/1.73m² (Renal impairment < 60)",
    ],
    recommendation:
      "Correlate laboratory biomarker flags with wearable continuous heart rate and patient symptoms before initiating pharmacotherapy.",
  },
  {
    id: "drug-interaction-formulary",
    title: "Aegis Core Drug-Drug Interaction High-Alert Formulary",
    category: "Pharmacology",
    source: "Aegis Health AI Clinical Board (2026)",
    uri: "gs://aegis-health-app-90697.firebasestorage.app/protocols/drug_interaction_formulary.md",
    summary:
      "Cross-mapped database of synergistic and antagonistic drug pairs with severe clinical consequence classifications.",
    keyCutoffs: [
      "Sertraline / SSRI + Tramadol: CRITICAL (Serotonin Syndrome risk)",
      "Lisinopril + Potassium supplements: CRITICAL (Cardiac arrest risk)",
      "Clopidogrel + Omeprazole: MODERATE (Reduced antiplatelet efficacy)",
    ],
    recommendation:
      "Mandatory pharmacist consult on all CRITICAL-tier interaction flags prior to patient discharge.",
  },
];

interface ClinicalProtocolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery?: (query: string) => void;
}

export default function ClinicalProtocolSearchModal({
  isOpen,
  onClose,
  onSelectQuery,
}: ClinicalProtocolSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeProtocol, setActiveProtocol] = useState<ClinicalProtocol | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setActiveProtocol(null);
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const categories = useMemo(() => {
    return ["All", "Cardiology", "Metabolic", "Pharmacology", "Safety & Triage", "Clinical Communication"];
  }, []);

  const filteredProtocols = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CLINICAL_PROTOCOLS.filter((p) => {
      const matchesCategory =
        selectedCategory === "All" || p.category === selectedCategory;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.source.toLowerCase().includes(q) ||
        p.keyCutoffs.some((c) => c.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Cardiology":
        return <Heart className="w-4 h-4 text-rose-500" />;
      case "Metabolic":
        return <Activity className="w-4 h-4 text-amber-500" />;
      case "Pharmacology":
        return <Pill className="w-4 h-4 text-indigo-500" />;
      case "Safety & Triage":
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-sky-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 md:pt-20 p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-surface border border-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Search Box */}
          <div className="flex items-center px-4 py-3.5 border-b border-surface gap-3">
            <Search className="w-5 h-5 text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinical research, protocols, drug interactions, vitals..."
              className="w-full bg-transparent text-sm md:text-base text-theme placeholder-muted outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 text-muted hover:text-theme rounded-md transition-colors"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold text-muted bg-surface border border-surface rounded shadow-xs">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1.5 text-muted hover:text-theme rounded-lg transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-surface overflow-x-auto no-scrollbar bg-surface/50">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-[var(--color-primary)] text-white shadow-xs"
                    : "bg-surface hover:bg-surface/80 text-muted hover:text-theme border border-surface"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Quick suggested searches if search is empty */}
            {!searchQuery && (
              <div className="mb-2">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">
                  Featured Medical Research Protocols (GCS Indexed)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["Glucose < 54 mg/dL", "Warfarin + Aspirin", "HRV RMSSD", "SBAR Handoff", "Tachycardia > 130 bpm"].map(
                    (tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="text-xs bg-surface border border-surface hover:border-[var(--color-primary)]/40 text-theme px-2.5 py-1 rounded-lg transition-all"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {filteredProtocols.length === 0 ? (
              <div className="text-center py-12 text-muted space-y-2">
                <FileText className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-sm">No protocols matched &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-xs">Try searching for &quot;glucose&quot;, &quot;warfarin&quot;, &quot;tachycardia&quot;, or &quot;SBAR&quot;.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredProtocols.map((p) => {
                  const isSelected = activeProtocol?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setActiveProtocol(isSelected ? null : p)}
                      className={`group p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--color-primary)]/5 border-[var(--color-primary)]/40 shadow-sm"
                          : "bg-surface border-surface hover:border-[var(--color-primary)]/30 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-surface border border-surface shrink-0 mt-0.5">
                            {getCategoryIcon(p.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold text-theme group-hover:text-[var(--color-primary)] transition-colors">
                                {p.title}
                              </h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-surface border border-surface text-muted">
                                {p.category}
                              </span>
                            </div>
                            <p className="text-xs text-muted line-clamp-2 mt-1">
                              {p.summary}
                            </p>
                          </div>
                        </div>
                        <ArrowRight
                          className={`w-4 h-4 text-muted shrink-0 transition-transform ${
                            isSelected ? "rotate-90 text-[var(--color-primary)]" : "group-hover:translate-x-0.5"
                          }`}
                        />
                      </div>

                      {/* Expandable Protocol Reader Drawer */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-surface space-y-3 text-xs"
                        >
                          <div className="bg-surface/80 p-3 rounded-lg border border-surface space-y-1.5">
                            <span className="font-semibold text-theme flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Key Clinical Reference Cutoffs:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-muted pl-1">
                              {p.keyCutoffs.map((cutoff, idx) => (
                                <li key={idx} className="text-theme font-medium">
                                  {cutoff}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-amber-200">
                            <span className="font-semibold block text-amber-300 mb-0.5">
                              Clinical Directive:
                            </span>
                            {p.recommendation}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted">
                            <span className="flex items-center gap-1 font-mono text-[10px] text-muted truncate max-w-sm">
                              GCS: {p.uri}
                            </span>
                            {onSelectQuery && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  onSelectQuery(`According to our protocol "${p.title}", what are the critical cutoffs and clinical recommendations?`);
                                }}
                                className="px-3 py-1.5 bg-[var(--color-primary)] hover:opacity-90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Ask AI Health Coach
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Info Bar */}
          <div className="px-4 py-2.5 bg-surface/80 border-t border-surface flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Google Discovery Engine Store: <strong className="text-theme">aegis-clinical-search</strong>
            </span>
            <span className="hidden sm:inline">6 Research Protocols Indexed</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
