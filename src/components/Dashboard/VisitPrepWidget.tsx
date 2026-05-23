import React, { useState } from 'react';
import { Stethoscope, Loader2, FileDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { getForm, getFormResponses } from '../../services/googleFormsService';
import { getMedications } from '../../services/medicationService';

// Fallback to fetch latest lab from dashboard state or firestore
// For simplicity, we assume we fetch the context from useClinicalContext or similar.
import { useClinicalContext } from '../../hooks/useClinicalContext';

export default function VisitPrepWidget() {
  const { activeProfile } = useProfile();
  const { contextString } = useClinicalContext();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formId = import.meta.env.VITE_VISIT_PREP_FORM_ID;

  const generatePrep = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      let prepContext = "No Google Form answers provided.";
      // Read form submission
      if (formId) {
         try {
            const formMeta = await getForm(formId);
            const responses = await getFormResponses(formId);
            if (responses?.responses?.length > 0) {
               // Get earliest latest
               const latest = responses.responses.sort((a,b) => new Date(b.lastSubmittedTime).getTime() - new Date(a.lastSubmittedTime).getTime())[0];
               let answersText = [];
               for (const [qId, answerObj] of Object.entries(latest.answers)) {
                   const item = formMeta.items.find(i => i.questionItem?.question?.questionId === qId);
                   const qTitle = item?.title || "Unknown Question";
                   const ansArr = (answerObj as any).textAnswers?.answers?.map((a:any) => a.value) || [];
                   answersText.push(`${qTitle}: ${ansArr.join(", ")}`);
               }
               prepContext = answersText.join("\n");
            }
         } catch (e) {
            console.warn("Could not fetch visit prep form.", e);
            prepContext = "Could not load prep form data. Ensure Google account is linked and you have filled the form.";
         }
      } else {
         prepContext = "Visit Prep form ID not configured (VITE_VISIT_PREP_FORM_ID).";
      }

      // Merge with lab results (available via contextString)
      const promptText = `
You are a medical assistant completing a Visit Prep document for the user.
Please create a clean, one-page summary that the patient can hand to their doctor.
Include their basic info, their recent labs and medications (from clinical context), and their checklisted symptoms/questions (from Prep Form Answers).

Clinical Context & Labs:
${contextString}

Prep Form Answers:
${prepContext}

Format as a clean, highly structured Markdown document with:
1. Patient Profile
2. Symptoms & Questions (from the form answers)
3. Key Lab Trends & Baseline
4. Current Medications.
`;

      const resp = await fetch("/api/generate-visit-prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptText })
      });
         
      if (!resp.ok) {
         throw new Error("Failed to generate summary via backend");
      }
      const data = await resp.json();
      setSummary(data.text || "Generated Document empty.");

    } catch (e: any) {
      setError(e.message || "Failed to generate Visit Prep summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-3xl shadow-md dark:shadow-2xl">
       <div className="flex items-center gap-3 mb-4 text-[var(--color-primary)]">
          <Stethoscope className="w-6 h-6" />
          <h3 className="font-bold tracking-tight uppercase text-sm">Doctor Visit Prep</h3>
       </div>
       <p className="text-sm text-muted mb-4">
          Check off your symptoms and list questions in the Prep Form, then generate a clean summary document to hand directly to your physician.
       </p>
       
       {!summary && !loading && (
          <button 
             onClick={generatePrep}
             className="w-full bg-[var(--color-primary)] hover:opacity-90 text-slate-900 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
             <FileDown className="w-4 h-4" />
             Generate Prep Document
          </button>
       )}

       {loading && (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
             <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
             <span className="text-xs text-muted uppercase tracking-wider">Compiling Medical Summary...</span>
          </div>
       )}

       {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 mt-2">
             {error}
          </div>
       )}

       {summary && (
          <div className="mt-4 p-4 border border-[var(--color-border)] rounded-2xl bg-white/5 space-y-4 text-sm relative">
              <button 
                className="absolute top-4 right-4 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                onClick={() => setSummary(null)}
              >
                  Reset
              </button>
              <div className="font-semibold text-[var(--color-text)] flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                 Ready for your visit
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-muted whitespace-pre-wrap">
                 {summary}
              </div>
          </div>
       )}
    </div>
  );
}
