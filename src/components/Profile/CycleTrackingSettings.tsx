import React, { useState } from "react";
import { UserProfile } from "../../types/medical";
import { Info, CalendarHeart } from "lucide-react";
import { db } from "../../lib/firebase/firestore";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function CycleTrackingSettings({ profile }: { profile: UserProfile }) {
  const { user } = useAuth();
  const rp = profile.reproductiveProfile;
  const isEnabled = rp?.cycleTrackingEnabled ?? false;
  const isMenstruating = rp?.menstruates ?? true;
  
  const [loading, setLoading] = useState(false);
  const [cycleLength, setCycleLength] = useState(rp?.averageCycleLength ?? 28);
  const [periodLength, setPeriodLength] = useState(rp?.averagePeriodLength ?? 5);

  const handleEnable = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "profiles", profile.id), {
        "reproductiveProfile.cycleTrackingEnabled": true,
        "reproductiveProfile.menstruates": isMenstruating,
        "reproductiveProfile.consentGivenAt": serverTimestamp(),
        "reproductiveProfile.averageCycleLength": cycleLength,
        "reproductiveProfile.averagePeriodLength": periodLength,
        "reproductiveProfile.updatedAt": serverTimestamp(),
        "reproductiveProfile.lastPeriodStart": rp?.lastPeriodStart || null,
      });
    } catch (err) {
      console.error("Failed to enable tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "profiles", profile.id), {
        "reproductiveProfile.cycleTrackingEnabled": false,
        "reproductiveProfile.updatedAt": serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to disable tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user || !isEnabled) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "profiles", profile.id), {
        "reproductiveProfile.averageCycleLength": cycleLength,
        "reproductiveProfile.averagePeriodLength": periodLength,
        "reproductiveProfile.updatedAt": serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to update tracking settings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isEnabled) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <CalendarHeart className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Cycle Tracking</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Optional, consent-based reproductive health tracking</p>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl mb-8 border border-slate-100 dark:border-white/5">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Menstrual cycle tracking allows for deeper contextual insights when evaluating lab markers 
            (like iron, hormones, or energy levels) alongside periods. 
            <br/><br/>
            This is <strong>sensitive health information</strong> and is strictly opt-in. It will only be stored 
            in your secure profile space, and you can disable tracking or delete logs at any time.
          </p>
        </div>

        <button 
          onClick={handleEnable}
          disabled={loading}
          className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl text-sm transition-all hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Enabling..." : "Enable Cycle Tracking"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <CalendarHeart className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Cycle Tracking</h3>
            <p className="text-sm text-emerald-500 font-semibold mt-1">Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
            Average Cycle Length (Days)
          </label>
          <input 
            type="number" 
            value={cycleLength}
            onChange={e => setCycleLength(parseInt(e.target.value) || 28)}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
            Average Period Length (Days)
          </label>
          <input 
            type="number" 
            value={periodLength}
            onChange={e => setPeriodLength(parseInt(e.target.value) || 5)}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4">
         <button 
           onClick={handleSaveSettings}
           disabled={loading}
           className="px-6 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
         >
           {loading ? "Saving..." : "Save Settings"}
         </button>
         <button 
           onClick={handleDisable}
           disabled={loading}
           className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 ml-auto"
         >
           Disable Tracking
         </button>
      </div>
    </div>
  );
}
