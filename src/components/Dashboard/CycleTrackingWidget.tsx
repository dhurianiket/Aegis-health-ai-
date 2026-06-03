import React, { useState } from "react";
import { UserProfile, CycleLog } from "../../types/medical";
import { parseSafeTimestamp } from "../../utils/dateUtils";
import { Calendar, Plus, Settings, ChevronUp, Droplets, Activity } from "lucide-react";
import { db } from "../../lib/firebase/firestore";
import { collection, addDoc, serverTimestamp, doc, updateDoc, Timestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function CycleTrackingWidget({ userProfile }: { userProfile?: UserProfile }) {
  const { user } = useAuth();
  const [showSymptoms, setShowSymptoms] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [flowIntensity, setFlowIntensity] = useState<'light' | 'medium' | 'heavy' | undefined>();
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState('');
  
  if (!userProfile?.reproductiveProfile?.cycleTrackingEnabled || !userProfile?.reproductiveProfile?.menstruates) {
    return null;
  }
  
  const { lastPeriodStart, averageCycleLength = 28, averagePeriodLength = 5 } = userProfile.reproductiveProfile;

  const showFeedback = (msg: string) => {
    setLogSuccess(msg);
    setTimeout(() => setLogSuccess(''), 3000);
  };

  const logPeriodStart = async () => {
    if (!user || !userProfile || isLogging) return;
    setIsLogging(true);
    const now = new Date();
    try {
      await addDoc(collection(db, "users", user.uid, "profiles", userProfile.id, "cycleLogs"), {
        date: Timestamp.fromDate(now),
        eventType: "period_start",
        source: "manual",
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user.uid, "profiles", userProfile.id), {
        "reproductiveProfile.lastPeriodStart": Timestamp.fromDate(now),
        "reproductiveProfile.updatedAt": serverTimestamp(),
      });
      showFeedback('Period logged successfully');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogging(false);
    }
  };
  
  const SYMPTOM_OPTIONS = ['Cramps', 'Bloating', 'Headache', 'Fatigue', 'Mood changes', 'Acne'];

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
  };
  
  const saveSymptoms = async () => {
    if (!user || !userProfile || isLogging) return;
    if (selectedSymptoms.length === 0 && !flowIntensity) {
      setShowSymptoms(false);
      return;
    }
    setIsLogging(true);
    const now = new Date();
    try {
      await addDoc(collection(db, "users", user.uid, "profiles", userProfile.id, "cycleLogs"), {
        date: Timestamp.fromDate(now),
        eventType: "symptom",
        source: "manual",
        symptoms: selectedSymptoms,
        flowIntensity: flowIntensity || null,
        createdAt: serverTimestamp(),
      });
      setSelectedSymptoms([]);
      setFlowIntensity(undefined);
      setShowSymptoms(false);
      showFeedback('Symptoms logged successfully');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogging(false);
    }
  };

  let cycleDayDisplay = "Waiting for log";
  let nextPeriodDisplay = "";

  if (lastPeriodStart) {
    const lastDate = parseSafeTimestamp(lastPeriodStart);
    if (lastDate && !isNaN(lastDate.getTime())) {
      const msDiff = Date.now() - lastDate.getTime();
      const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));
      
      cycleDayDisplay = `Day ${daysDiff + 1}`;
      
      const nextTs = lastDate.getTime() + (averageCycleLength * 24 * 60 * 60 * 1000);
      const nextDate = new Date(nextTs);
      const msToNext = nextDate.getTime() - Date.now();
      const daysToNext = Math.ceil(msToNext / (1000 * 60 * 60 * 24));
      
      if (daysToNext > 0) {
        nextPeriodDisplay = `Predicted in ${daysToNext} days`;
      } else if (daysToNext === 0) {
        nextPeriodDisplay = `Predicted today`;
      } else {
        nextPeriodDisplay = `Late by ${Math.abs(daysToNext)} days`;
      }
    }
  }

  return (
    <div className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-[32px] shadow-md dark:shadow-2xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-[var(--color-text)] tracking-tight">Cycle Tracking</h3>
        </div>
        <button aria-label="Cycle tracking settings" onClick={() => window.location.hash = "profile"} className="text-muted hover:text-indigo-400 transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex items-center justify-between">
         <div>
           <div className="flex items-baseline gap-2 mb-2">
             <span className="text-3xl font-light text-[var(--color-text)]">{cycleDayDisplay}</span>
           </div>
           {nextPeriodDisplay && (
             <p className="text-[13px] text-[var(--color-text-muted)] font-medium mb-6">
               {nextPeriodDisplay}
             </p>
           )}
         </div>
         {logSuccess && (
           <div className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-3 py-1.5 rounded-full animate-pulse">
             {logSuccess}
           </div>
         )}
      </div>

      <div className="flex gap-3">
        <button 
          onClick={logPeriodStart}
          disabled={isLogging}
          className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-semibold py-3 px-4 rounded-[20px] text-[14px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4 shrink-0" /> <span className="truncate">Period Started</span>
        </button>
        <button 
          onClick={() => setShowSymptoms(!showSymptoms)}
          className={`flex-1 border font-semibold py-3 px-4 rounded-[20px] text-[14px] transition-colors flex items-center justify-center gap-2 ${showSymptoms ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)]' : 'bg-[var(--color-bg)] border-[var(--color-border)] hover:bg-slate-50 dark:hover:bg-white/5 text-[var(--color-text)]'}`}
        >
          {showSymptoms ? <ChevronUp className="w-4 h-4 shrink-0" /> : <Activity className="w-4 h-4 shrink-0" />} <span className="truncate">Symptoms</span>
        </button>
      </div>
      
      {showSymptoms && (
        <div className="mt-6 pt-6 border-t border-[var(--color-border)] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5" /> Flow Intensity
            </h4>
            <div className="flex gap-2">
               {(['light', 'medium', 'heavy'] as const).map(flow => (
                 <button 
                   key={flow}
                   onClick={() => setFlowIntensity(flowIntensity === flow ? undefined : flow)}
                   className={`flex-1 py-2 text-xs font-semibold rounded-xl capitalize transition-colors ${flowIntensity === flow ? 'bg-indigo-500 text-white' : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)]'}`}
                 >
                   {flow}
                 </button>
               ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Symptoms
            </h4>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map(sym => (
                 <button
                   key={sym}
                   onClick={() => toggleSymptom(sym)}
                   className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${selectedSymptoms.includes(sym) ? 'bg-[var(--color-text)] text-[var(--color-bg)]' : 'bg-transparent border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-slate-300 dark:hover:border-slate-600'}`}
                 >
                   {sym}
                 </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={saveSymptoms}
            disabled={isLogging || (selectedSymptoms.length === 0 && !flowIntensity)}
            className="w-full bg-[var(--color-text)] text-[var(--color-bg)] font-semibold py-3 px-4 rounded-xl text-sm transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {isLogging ? "Saving..." : "Save Log"}
          </button>
        </div>
      )}
    </div>
  );
}
