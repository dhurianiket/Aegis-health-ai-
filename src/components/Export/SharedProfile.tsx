import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase/config";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { Activity, ShieldAlert, Clock, ChevronLeft, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";

interface SharedProfileProps {
  shareId: string;
  userId: string;
}

export default function SharedProfile({ shareId, userId }: SharedProfileProps) {
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedData() {
      try {
        // Path: users/{userId}/shares/{shareId}
        const shareDoc = await getDoc(doc(db, "users", userId, "shares", shareId));
        if (!shareDoc.exists()) {
          setError("Share link not found.");
          setLoading(false);
          return;
        }

        const data = shareDoc.data();
        const now = new Date();
        const expiresAt = data.expiresAt.toDate();

        if (now > expiresAt) {
          setError("This share link has expired.");
          setLoading(false);
          return;
        }

        setShareInfo(data);

        // Fetch the corresponding profile: users/{userId}/profiles/{profileId}
        const profileDoc = await getDoc(doc(db, "users", userId, "profiles", data.profileId));
        if (profileDoc.exists()) {
          setProfileData(profileDoc.data());
          // Update view count
          await updateDoc(doc(db, "users", userId, "shares", shareId), {
            viewCount: increment(1),
          });
        } else {
          setError("Profile data is no longer available.");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching shared data.");
      } finally {
        setLoading(false);
      }
    }

    fetchSharedData();
  }, [shareId, userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6">
        <Activity className="w-12 h-12 text-indigo-500 animate-pulse mb-4" />
        <p className="text-slate-400 font-medium">Verifying secure link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Access Restricted
        </h2>
        <p className="text-slate-400 max-w-sm mb-8">{error}</p>
        <button
          onClick={() => (window.location.href = window.location.origin)}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Aura
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 selection:bg-indigo-500/30">
      <header className="sticky top-0 z-30 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            AURA <span className="text-indigo-400">SHARED</span>
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
          <Lock className="w-3 h-3" /> Secure View
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
        {/* Profile Card */}
        <section className="bg-slate-800/50 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-1">
              {profileData.name}'s Snapshot
            </h1>
            <p className="text-slate-400">
              Limited health overview for clinical review
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Age
                </p>
                <p className="text-xl font-bold text-white">
                  {profileData.dob
                    ? `${Math.floor((new Date().getTime() - new Date(profileData.dob).getTime()) / 31557600000)}Y`
                    : "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Blood Type
                </p>
                <p className="text-xl font-bold text-white">
                  {profileData.bloodType || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Expires In
                </p>
                <div className="flex items-center gap-2 text-amber-400">
                  <Clock className="w-4 h-4" />
                  <p className="text-sm font-bold">
                    {format(shareInfo.expiresAt.toDate(), "HH:mm")}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-20 -mt-20" />
        </section>

        {/* Data Sections based on exposure settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {shareInfo.dataToExpose.meds && (
            <div className="bg-slate-800/50 border border-white/10 p-6 rounded-[2rem] space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <Activity className="w-5 h-5" />
                </div>
                Active Medications
              </h2>
              <div className="space-y-4">
                {profileData.medications?.length > 0 ? (
                  profileData.medications.map((med: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 bg-white/5 rounded-2xl border border-white/5"
                    >
                      <p className="font-bold text-white">{med.name}</p>
                      <p className="text-xs text-slate-400">
                        {med.dosage} • {med.frequency}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">
                    No active medications.
                  </p>
                )}
              </div>
            </div>
          )}

          {shareInfo.dataToExpose.labs && (
            <div className="bg-slate-800/50 border border-white/10 p-6 rounded-[2rem] space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <Activity className="w-5 h-5" />
                </div>
                Recent Lab Results
              </h2>
              <div className="space-y-4">
                {profileData.labValues
                  ?.slice(0, 5)
                  .map((lab: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5"
                    >
                      <div>
                        <p className="font-bold text-sm text-white">
                          {lab.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {format(new Date(lab.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${lab.severity === "critical" ? "text-red-400" : lab.severity === "high" ? "text-amber-400" : "text-emerald-400"}`}
                        >
                          {lab.value}{" "}
                          <span className="text-[10px] font-normal">
                            {lab.unit}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {shareInfo.dataToExpose.notes &&
          profileData.doctorNotes?.length > 0 && (
            <div className="bg-slate-800/50 border border-white/10 p-8 rounded-[2rem] space-y-6">
              <h2 className="text-xl font-bold text-white">
                Clinical Observations
              </h2>
              <div className="space-y-4">
                {profileData.doctorNotes.map((note: string, i: number) => (
                  <p
                    key={i}
                    className="text-slate-300 text-sm italic leading-relaxed border-l-2 border-indigo-500/50 pl-4 py-1"
                  >
                    "{note}"
                  </p>
                ))}
              </div>
            </div>
          )}

        <div className="text-center pt-12">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            HIPAA-Secure View • Generated by Aura Intelligence
          </p>
          <p className="text-[10px] text-slate-600 mt-2">
            This information is private. Please do not share this URL.
          </p>
        </div>
      </main>
    </div>
  );
}
