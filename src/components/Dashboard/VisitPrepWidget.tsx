import React, { useState } from 'react';
import { Stethoscope, Loader2, FileDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { getForm, getFormResponses } from '../../services/googleFormsService';
import { useClinicalContext } from '../../hooks/useClinicalContext';
import AutoSizeTextarea from '../Form/AutoSizeTextarea';

const SYMPTOMS_LIST = [
  "Fatigue",
  "Fever / Chills",
  "Muscle / Body Ache",
  "Cough",
  "Shortness of Breath",
  "Chest Pain / Tightness",
  "Headache",
  "Dizziness",
  "Nausea / Stomach Upset",
  "Sleeping Difficulties"
];

export default function VisitPrepWidget() {
  const { activeProfile } = useProfile();
  const { contextString } = useClinicalContext();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // In-app Form States (fallback & secondary modes)
  const [useInAppForm, setUseInAppForm] = useState(true);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [questions, setQuestions] = useState("");
  const [onsetNotes, setOnsetNotes] = useState("");

  const rawFormId = import.meta.env.VITE_VISIT_PREP_FORM_ID;
  const formId = rawFormId ? rawFormId.replace(/['"]/g, "").trim() : "";

  const generatePrep = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      let prepContext = "No Google Form answers provided.";
      
      // Read form submission
      if (!useInAppForm && formId) {
         try {
            const formMeta = await getForm(formId);
            const responses = await getFormResponses(formId);
            if (responses?.responses?.length > 0) {
               // Get earliest latest
               const latest = responses.responses.reduce((latest: any, current: any) => new Date(current.lastSubmittedTime).getTime() > new Date(latest.lastSubmittedTime).getTime() ? current : latest);
               let answersText = [];
               if (latest && latest.answers) {
                  for (const [qId, answerObj] of Object.entries(latest.answers)) {
                      const item = formMeta.items?.find((i: any) => i.questionItem?.question?.questionId === qId);
                      const qTitle = item?.title || "Unknown Question";
                      const ansArr = (answerObj as any).textAnswers?.answers?.map((a:any) => a.value) || [];
                      answersText.push(`${qTitle}: ${ansArr.join(", ")}`);
                  }
                  prepContext = answersText.join("\n");
               } else {
                  prepContext = "No answers found in the latest form submission.";
               }
            } else {
               prepContext = "No answers found. Please submit the form first.";
            }
         } catch (e: any) {
            console.warn("Could not fetch visit prep form.", e);
            let prepError = e?.message || "";
            if (prepError.includes("expected pattern") || prepError.includes("Failed to execute") || prepError.includes("token")) {
               throw new Error("Third-party cookie restrictions or oauth state mismatch in this iframe is blocking Google Forms lookup. Please open the app in a new tab using the top-right button to allow proper authentication!");
            }
            prepContext = `Could not load prep form data: ${prepError || "Ensure Google account is linked and you have filled the form."}`;
         }
      } else if (useInAppForm) {
         prepContext = `Symptoms reported: ${selectedSymptoms.join(", ") || "None specified"}\nQuestions for Doctor: ${questions || "None specified"}\nAdditional Notes: ${onsetNotes || "None specified"}`;
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
      let msg = e.message || "Failed to generate Visit Prep summary.";
      if (msg.includes("expected pattern") || msg.includes("Failed to execute") || msg.toLowerCase().includes("atob")) {
         msg = "Third-party cookie restrictions or oauth state mismatch in this iframe is blocking Google Forms lookup. Please open the app in a new tab using the top-right button to allow proper authentication!";
      }
      setError(msg);
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

        {/* Form selection tabs */}
        {!summary && !loading && (
           <div className="flex gap-2 mb-4 p-1 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-2xl">
              <button 
                 type="button"
                 onClick={() => { setUseInAppForm(true); setError(null); }}
                 className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
                    useInAppForm 
                       ? 'bg-indigo-600 text-white shadow-sm' 
                       : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                 }`}
              >
                 Quick In-App Form
              </button>
              <button 
                 type="button"
                 onClick={() => { setUseInAppForm(false); setError(null); }}
                 className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
                    !useInAppForm 
                       ? 'bg-indigo-600 text-white shadow-sm font-semibold' 
                       : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                 }`}
              >
                 Sync Google Form
              </button>
           </div>
        )}
        
        {!summary && !loading && (
           <div className="space-y-4">
              {useInAppForm ? (
                 <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 prep-form-label mb-2 uppercase tracking-wider">
                           Select Symptoms
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                           {SYMPTOMS_LIST.map((symptom) => {
                              const isSelected = selectedSymptoms.includes(symptom);
                              return (
                                 <button
                                    key={symptom}
                                    type="button"
                                    onClick={() => {
                                       setSelectedSymptoms(prev => 
                                          prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
                                       );
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl border transition-all text-left shadow-sm ${
                                       isSelected 
                                          ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-800 dark:text-indigo-200 font-bold' 
                                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                                    }`}
                                 >
                                    <span className={`w-4 h-4 rounded flex items-center justify-center border text-xs font-bold ${
                                       isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-400 dark:border-slate-500'
                                    }`}>
                                       {isSelected && "✓"}
                                    </span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{symptom}</span>
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                     
                     <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 prep-form-label mb-1 uppercase tracking-wider">
                           Questions for your Doctor
                        </label>
                        <AutoSizeTextarea
                           value={questions}
                           onChange={(e: any) => setQuestions(e.target.value)}
                           placeholder="e.g., Is this dosage of Lisinopril safe to continue? When should I retest?"
                           className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none shadow-sm"
                           minLines={2}
                        />
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 prep-form-label mb-1 uppercase tracking-wider">
                           Additional Symptoms or Notes
                        </label>
                        <AutoSizeTextarea
                           value={onsetNotes}
                           onChange={(e: any) => setOnsetNotes(e.target.value)}
                           placeholder="e.g., Symptoms have been mostly in the evening. Slight chest tightness."
                           className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none shadow-sm"
                           minLines={1}
                        />
                     </div>
                 </div>
              ) : (
                 <div className="p-3 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl text-center space-y-2">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                       Fetching inputs automatically from your outer Google Form responses. Ensure you submitted the form with your logged-in Google Account.
                    </p>
                    {formId && (
                       <a 
                          href={`https://docs.google.com/forms/d/${formId}/viewform`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                       >
                          Open Google Form directly ↗
                       </a>
                    )}
                 </div>
              )}

              <button 
                 type="button"
                 onClick={generatePrep}
                 className="w-full bg-teal-700 hover:bg-teal-800 dark:bg-teal-400 dark:hover:bg-teal-300 text-white dark:text-slate-950 font-extrabold py-3.5 rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 mt-4 cursor-pointer text-sm tracking-wide"
              >
                 <FileDown className="w-4 h-4" />
                 Generate Prep Document
              </button>
           </div>
        )}

        {loading && (
           <div className="flex flex-col items-center justify-center py-6 gap-3">
              <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <span className="text-xs text-muted uppercase tracking-wider animate-pulse">Compiling Medical Summary...</span>
           </div>
        )}

        {error && (
           <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 mt-2">
                 {error}
              </div>
              {/* Offer fallback option specifically when iframe errors throw */}
              {!useInAppForm && (
                 <button
                    type="button"
                    onClick={() => { setUseInAppForm(true); setError(null); }}
                    className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 py-2 rounded-xl text-xs font-semibold transition"
                 >
                    Fill Symptoms directly in the App instead
                 </button>
              )}
           </div>
        )}

        {summary && (
           <div className="mt-4 p-4 border border-[var(--color-border)] rounded-2xl bg-white/5 space-y-4 text-sm relative">
               <button 
                 type="button"
                 className="absolute top-4 right-4 text-xs text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold"
                 onClick={() => setSummary(null)}
               >
                   Reset
               </button>
               <div className="font-semibold text-[var(--color-text)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Ready for your visit
               </div>
               <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-muted whitespace-pre-wrap">
                  {summary}
               </div>
           </div>
        )}
    </div>
  );
}
