import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronRight
} from 'lucide-react';
import { extractClinicalEntities, ExtractedClinicalEntities } from '../../services/ai/entityExtractorService';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { saveDocument } from '../../lib/firebase/firestore';
import { DocumentType } from '../../types/medical';

export default function NoteAnalyzer() {
  const [note, setNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ExtractedClinicalEntities | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const { user } = useAuth();
  const { activeProfile } = useProfile();

  const handleAnalyze = async () => {
    if (!note.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setSaveStatus('idle');

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
        profileId: activeProfile?.id
      });
      setSaveStatus('success');
      setTimeout(() => {
        setNote('');
        setResult(null);
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Stethoscope className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Clinical Note Parser</h3>
            <p className="text-xs text-slate-500 font-medium">Paste doctor notes, summary letters, or Discharge papers.</p>
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g., Patient presents with mild hypertension. Currently taking Lisinopril 10mg. Follow up in 3 weeks with Cardiology..."
          className="w-full h-48 bg-black/20 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
        />

        <button
          onClick={handleAnalyze}
          disabled={!note.trim() || isAnalyzing}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 group"
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
            className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 bg-indigo-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-lg">Analysis Summary</h4>
                  <p className="text-indigo-300 text-sm font-medium mt-1 uppercase tracking-wider text-[10px]">AI-Synthesized Context</p>
                </div>
                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  Processed
                </div>
              </div>
              <p className="text-slate-300 text-sm mt-4 leading-relaxed font-light italic">
                "{result.summary}"
              </p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Symptoms & Conditions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Activity className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Findings</span>
                </div>
                <div className="space-y-2">
                  {result.conditions.map((c, i) => (
                    <div key={i} className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-medium">
                      {c} (Condition)
                    </div>
                  ))}
                  {result.symptoms.map((s, i) => (
                    <div key={i} className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-medium">
                      {s} (Symptom)
                    </div>
                  ))}
                  {result.conditions.length === 0 && result.symptoms.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No specific conditions or symptoms identified.</p>
                  )}
                </div>
              </div>

              {/* Medications */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Pill className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pharmacology</span>
                </div>
                <div className="space-y-2">
                  {result.medications.map((m, i) => (
                    <div key={i} className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <div className="text-indigo-200 text-xs font-bold">{m.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">
                        {m.dosage} • {m.frequency}
                      </div>
                    </div>
                  ))}
                  {result.medications.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No medications identified.</p>
                  )}
                </div>
              </div>

              {/* Appointments */}
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Suggested Follow-ups</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.appointments.map((a, i) => (
                    <div key={i} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <div>
                        <div className="text-emerald-200 text-xs font-bold">{a.specialist}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{a.purpose}</div>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{a.timeframe}</div>
                    </div>
                  ))}
                  {result.appointments.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No follow-up appointments identified.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 pt-0">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 group"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Analysis...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Analysis Saved to Vault
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Failed to Save
                  </>
                ) : (
                  <>
                    Save Extraction Results <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
