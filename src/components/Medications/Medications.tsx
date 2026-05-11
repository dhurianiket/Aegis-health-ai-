import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { Pill, Clock, Plus, Trash2, ShieldAlert, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../../lib/firebase/config";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { logAuditEvent } from "../../lib/auditLogger";

export default function Medications({
  onOpenChat,
}: {
  onOpenChat?: () => void;
}) {
  const { user } = useAuth();
  const { activeProfile, setActiveProfile } = useProfile();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [startDate, setStartDate] = useState("");

  const meds = activeProfile?.medications || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeProfile || !name.trim()) return;

    const newMed = {
      name: name.trim(),
      dose: dose.trim(),
      frequency,
      startDate: startDate || new Date().toISOString().split("T")[0],
      status: "active",
    };

    try {
      const docRef = doc(db, "profiles", activeProfile.id);
      await updateDoc(docRef, {
        medications: arrayUnion(newMed),
      });

      const updatedProfile = {
        ...activeProfile,
        medications: [...(activeProfile.medications || []), newMed],
      };
      setActiveProfile(updatedProfile as any);

      await logAuditEvent(user.uid, "ADD_MEDICATION", newMed.name);

      setIsAdding(false);
      setName("");
      setDose("");
      setFrequency("Once daily");
      setStartDate("");
    } catch (err) {
      console.error(err);
      alert("Failed to add medication.");
    }
  };

  const handleRemove = async (med: any) => {
    if (!user || !activeProfile) return;
    try {
      const docRef = doc(db, "profiles", activeProfile.id);
      await updateDoc(docRef, {
        medications: arrayRemove(med),
      });

      const updatedProfile = {
        ...activeProfile,
        medications: (activeProfile.medications || []).filter(
          (m: any) => m.name !== med.name,
        ),
      };
      setActiveProfile(updatedProfile as any);

      await logAuditEvent(user.uid, "REMOVE_MEDICATION", med.name);
    } catch (err) {
      console.error(err);
      alert("Failed to remove medication.");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            Pharmacy
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-light">
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
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[24px] shadow-2xl relative"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Name
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 placeholder-slate-500 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Metformin"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Dose
                </label>
                <input
                  type="text"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 placeholder-slate-500 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 500mg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 placeholder-slate-500 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-5 py-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Save
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
                key={`${med.name}-${idx}`}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl hover:bg-white/10 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Pill className="w-6 h-6" />
                    </div>
                    <button
                      onClick={() => handleRemove(med)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/10 rounded-full"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight mb-1">
                    {med.name}
                  </h3>
                  <div className="flex gap-4 mb-4">
                    <div className="text-sm font-semibold text-slate-300">
                      {med.dose || med.dosage}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" /> {med.frequency}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-start gap-2 text-amber-500/80 text-[10px] uppercase font-bold tracking-widest leading-relaxed mb-4">
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
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-[40px] bg-white/5">
              <Pill className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                No medications logged yet
              </h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
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

      <div className="pt-8 mt-12 border-t border-white/10 opacity-40 text-center">
        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.15em]">
          Built by <span className="text-slate-400">Aniket Dhuri</span> · Powered by Gemini AI
        </p>
      </div>
    </div>
  );
}
