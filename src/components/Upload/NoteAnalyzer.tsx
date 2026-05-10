import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Activity,
  Calendar,
  Pill,
  ChevronRight,
} from "lucide-react";
import {
  extractClinicalEntities,
  ExtractedClinicalEntities,
} from "../../services/ai/entityExtractorService";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { saveDocument } from "../../lib/firebase/firestore";
import { DocumentType } from "../../types/medical";

export default function NoteAnalyzer() {
  const [note, setNote] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ExtractedClinicalEntities | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const { user } = useAuth();
  const { activeProfile } = useProfile();

  const handleAnalyze = async () => {
    if (!note.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setResult(null);
    setSaveStatus("idle");

    try {
      const entities = await extractClinicalEntities(note);
      setResult(entities);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user || isSaving) return;

    setIsSaving(true);
    try {
      await saveDocument(user.uid, {
        fileName: "Clinical Note Analysis",
        type: DocumentType.CONSULTATION_NOTE,
        date: new Date().toISOString(),
        hospitalName: "Extracted from text",
        doctorName: "AI Analyst",
        extractedData: result,
        profileId: activeProfile?.id,
      });
      setSaveStatus("success");
      setTimeout(() => {
        setNote("");
        setResult(null);
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[var(--color-primary)]/20 rounded-lg">
            <Stethoscope className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text)]">
              Clinical Note Parser
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] font-medium">
              Paste doctor notes, summary letters, or Discharge papers.
            </p>
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g., Patient presents with mild hypertension. Currently taking Lisinopril 10mg. Follow up in 3 weeks with Cardiology..."
          className="w-full h-48 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all resize-none"
        />

        <button
          onClick={handleAnalyze}
          disabled={!note.trim() || isAnalyzing}
          className="w-full bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-[var(--color-primary)]/20 flex items-center justify-center gap-2 group"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing Clinical Context...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Extract Clinical Entities
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] overflow-hidden"
          >
            <div className="p-8 border-b border-[var(--color-border)] bg-[var(--color-primary)]/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[var(--color-text)] font-bold text-lg">
                    Analysis Summary
                  </h4>
                  <p className="text-[var(--color-primary)] text-sm font-medium mt-1 uppercase tracking-wider text-[10px]">
                    AI-Synthesized Context
                  </p>
                </div>
                <div className="px-3 py-1 bg-[var(--color-success)]/20 border border-[var(--color-success)]/20 rounded-full text-[var(--color-success)] text-[10px] font-black uppercase tracking-widest">
                  Processed
                </div>
              </div>
              <p className="text-[var(--color-text-muted)] text-sm mt-4 leading-relaxed font-light italic">
                "{result.summary}"
              </p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Symptoms & Conditions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                  <Activity className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Clinical Findings
                  </span>
                </div>
                <div className="space-y-2">
                  {result.conditions.map((c, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-xl bg-[var(--color-critical)]/10 border border-[var(--color-critical)]/20 text-[var(--color-critical)] text-xs font-medium"
                    >
                      {c} (Condition)
                    </div>
                  ))}
                  {result.symptoms.map((s, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 text-[var(--color-warning)] text-xs font-medium"
                    >
                      {s} (Symptom)
                    </div>
                  ))}
                  {result.conditions.length === 0 &&
                    result.symptoms.length === 0 && (
                      <p className="text-xs text-[var(--color-text-faint)] italic">
                        No specific conditions or symptoms identified.
                      </p>
                    )}
                </div>
              </div>

              {/* Medications */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                  <Pill className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Pharmacology
                  </span>
                </div>
                <div className="space-y-2">
                  {result.medications.map((m, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20"
                    >
                      <div className="text-[var(--color-primary)] text-xs font-bold">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)] mt-1 uppercase tracking-wider font-bold">
                        {m.dosage} • {m.frequency}
                      </div>
                    </div>
                  ))}
                  {result.medications.length === 0 && (
                    <p className="text-xs text-[var(--color-text-faint)] italic">
                      No medications identified.
                    </p>
                  )}
                </div>
              </div>

              {/* Appointments */}
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Suggested Follow-ups
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.appointments.map((a, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[var(--color-success)] text-xs font-bold">
                          {a.specialist}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          {a.purpose}
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-[var(--color-success)] uppercase tracking-widest">
                        {a.timeframe}
                      </div>
                    </div>
                  ))}
                  {result.appointments.length === 0 && (
                    <p className="text-xs text-[var(--color-text-faint)] italic">
                      No follow-up appointments identified.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 pt-0">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[var(--color-surface)] hover:bg-[var(--color-bg)] border border-[var(--color-border)] disabled:opacity-50 text-[var(--color-text)] py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 group"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Analysis...
                  </>
                ) : saveStatus === "success" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Analysis Saved to Vault
                  </>
                ) : saveStatus === "error" ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Failed to Save
                  </>
                ) : (
                  <>
                    Save Extraction Results{" "}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
