import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Pill, Clock, Plus, Trash2, ShieldAlert, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../../lib/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { logAuditEvent } from "../../lib/auditLogger";
import { getActiveMedications, getInteractions, saveMedication, lookupRxCUI } from "../../services/medicationService";
import { Medication, DrugInteraction } from "../../types/health";
import InteractionMatrix from "./InteractionMatrix";

import { useClinicalContext } from "../../hooks/useClinicalContext";

export default function Medications({
  onOpenChat,
}: {
  onOpenChat?: () => void;
}) {
  const { user } = useAuth();
  const { labBiomarkers, drugLabContraindications } = useClinicalContext();

  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [startDate, setStartDate] = useState("");

  const [meds, setMeds] = useState<Medication[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);

  const fetchData = async () => {
    if (!user?.uid) return;
    try {
      const active = await getActiveMedications(user.uid);
      setMeds(active);
      const warns = await getInteractions(user.uid);
      setInteractions(warns);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.uid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !name.trim()) return;

    setIsLoading(true);
    try {
      const genericName = name.trim();
      const rxcui = await lookupRxCUI(genericName);

      const newMed: Omit<Medication, 'id' | 'addedAt'> = {
        userId: user.uid,
        genericName,
        brandName: null,
        rxcui,
        dosage: dose.trim() || null,
        frequency: frequency || null,
        startDate: startDate || new Date().toISOString().split("T")[0],
        endDate: null,
        prescribedFor: null
      };

      await saveMedication(user.uid, newMed);
      await logAuditEvent(user.uid, "ADD_MEDICATION", genericName);

      setIsAdding(false);
      setName("");
      setDose("");
      setFrequency("Once daily");
      setStartDate("");
      
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add medication.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (med: Medication) => {
    if (!user?.uid) return;
    try {
      const docRef = doc(db, "users", user.uid, "medications", med.id);
      await updateDoc(docRef, {
        endDate: new Date().toISOString()
      });

      // Simple refresh to recalculate
      const remainingMeds = await getActiveMedications(user.uid);
      const rxcuis = remainingMeds.map(m => m.rxcui).filter(Boolean) as string[];
      
      const { checkInteractions } = await import("../../services/medicationService");
      if (rxcuis.length >= 2) {
        const newInteractions = await checkInteractions(rxcuis);
        const { getDocs, collection, deleteDoc, addDoc } = await import('firebase/firestore');
        const oldInteractionsSnap = await getDocs(collection(db, 'users', user.uid, 'drugInteractions'));
        await Promise.all(oldInteractionsSnap.docs.map(d => deleteDoc(d.ref)));
        await Promise.all(newInteractions.map(interaction => {
          const { id, ...data } = interaction;
          return addDoc(collection(db, 'users', user.uid, 'drugInteractions'), data);
        }));
      } else {
        const { getDocs, collection, deleteDoc } = await import('firebase/firestore');
        const oldInteractionsSnap = await getDocs(collection(db, 'users', user.uid, 'drugInteractions'));
        await Promise.all(oldInteractionsSnap.docs.map(d => deleteDoc(d.ref)));
      }

      await logAuditEvent(user.uid, "REMOVE_MEDICATION", med.genericName);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to remove medication.");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-theme mb-2">
            Pharmacy
          </h2>
          <p className="text-muted text-xs md:text-sm font-light">
            Manage your active regimen.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-colors font-semibold shadow-xl"
          >
            <Plus className="w-4 h-4" /> Add Medication
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleAdd}
            className="bg-surface backdrop-blur-xl border border-surface p-6 rounded-[24px] shadow-2xl relative"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-1.5">
                  Name
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface border border-surface rounded-xl px-4 py-3 placeholder-[var(--color-text-faint)] text-theme focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Metformin"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-1.5">
                  Dose
                </label>
                <input
                  type="text"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  className="w-full bg-surface border border-surface rounded-xl px-4 py-3 placeholder-[var(--color-text-faint)] text-theme focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 500mg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-1.5">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-surface border border-surface rounded-xl px-4 py-3 text-theme focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-surface border border-surface rounded-xl px-4 py-3 placeholder-[var(--color-text-faint)] text-theme focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                disabled={isLoading}
                className="px-5 py-2 text-muted hover:text-theme transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center min-w-[80px] disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {meds.length > 0 ? (
            meds.map((med: any, idx: number) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={`${med.genericName}-${idx}`}
                className="bg-surface backdrop-blur-xl border border-surface p-6 rounded-[32px] shadow-2xl hover:bg-[var(--color-border)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Pill className="w-6 h-6" />
                    </div>
                    <button
                      onClick={() => handleRemove(med)}
                      className="p-2 text-faint hover:text-red-400 transition-colors bg-surface hover:bg-red-500/10 rounded-full"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                    {med.genericName}
                  </h3>
                  <div className="flex gap-4 mb-4">
                    <div className="text-sm font-semibold text-muted">
                      {med.dosage}
                    </div>
                    {med.frequency && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" /> {med.frequency}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300 text-xs uppercase font-extrabold tracking-widest leading-relaxed mb-4">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <p>
                      Always discuss medication changes with your doctor before
                      starting or stopping.
                    </p>
                  </div>

                  {onOpenChat && (
                    <button
                      onClick={onOpenChat}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors w-full justify-center py-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl"
                    >
                      <Sparkles className="w-4 h-4" /> Ask Aura AI about this
                      medication
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border border-dashed border-surface rounded-[40px] bg-surface">
              <Pill className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-theme mb-2">
                No medications logged yet
              </h3>
              <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
                Keep track of your active regimen and monitor potential
                interactions.
              </p>
              <button
                onClick={() => setIsAdding(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-colors"
              >
                Add Medication
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
        <InteractionMatrix 
          medications={meds} 
          interactions={interactions} 
          labBiomarkers={labBiomarkers}
          drugLabContraindications={drugLabContraindications}
          onOpenChat={onOpenChat} 
        />
      </div>

      {interactions.length > 0 && (
        <div className="mt-12 space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-theme" />
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-theme">
              Interaction Alerts
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interactions.map((interaction) => {
              let containerColor = "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-900/50";
              let textColor = "text-blue-700 dark:text-blue-400";
              let badgeColor = "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
              let badgeText = "Low concern";
              
              if (interaction.severity === 'severe') {
                containerColor = "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-900/50";
                textColor = "text-red-700 dark:text-red-400";
                badgeColor = "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
                badgeText = "Discuss with doctor";
              } else if (interaction.severity === 'moderate') {
                containerColor = "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-900/50";
                textColor = "text-amber-700 dark:text-amber-400";
                badgeColor = "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
                badgeText = "Be aware";
              }

              return (
                <div key={interaction.id} className={`${containerColor} border rounded-[24px] p-5 shadow-lg`}>
                  <div className="flex items-start justify-between mb-3">
                    <h4 className={`font-bold text-base ${textColor}`}>
                      {interaction.drugA} + {interaction.drugB}
                    </h4>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${badgeColor}`}>
                      {badgeText}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed mb-4 ${textColor} opacity-90`}>
                    {interaction.plainSummary || interaction.description}
                  </p>
                  <div className={`mt-auto pt-3 border-t border-current text-xs uppercase tracking-widest space-y-1 ${textColor} opacity-70`}>
                    <p>Source: RxNorm Drug Interaction API (NLM)</p>
                    <p>This information is for educational purposes only. Do not change medications without consulting your doctor.</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-8 mt-12 border-t border-surface opacity-40 text-center">
        <p className="text-xs text-faint font-mono uppercase tracking-[0.15em]">
          Built by <a href="https://aniket.aegishealthai.co.in/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-[var(--color-text)] underline decoration-faint transition-colors">Aniket Dhuri</a> · Powered by Gemini AI
        </p>
      </div>
    </div>
  );
}
