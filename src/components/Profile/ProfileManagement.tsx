import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Edit2,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  Save,
  Activity
} from "lucide-react";
import { useProfile } from "../../context/ProfileContext";
import { Gender, UserProfile } from "../../types/medical";
import { validateProfileName } from "../../lib/validation";
import { logger } from "../../lib/logger";
import { getUserUsageStats } from "../../services/usageService";
import { auth } from "../../lib/firebase/config";
import { version } from "../../../package.json";
import CycleTrackingSettings from "./CycleTrackingSettings";
import AutoSizeTextarea from "../Form/AutoSizeTextarea";

export default function ProfileManagement() {
  const {
    profiles,
    activeProfile,
    setActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useProfile();

  const [usageStats, setUsageStats] = useState<any>(null);

  useEffect(() => {
    if (auth.currentUser?.uid) {
       getUserUsageStats(auth.currentUser.uid).then(stats => {
          if (stats) setUsageStats(stats);
       }).catch(console.error);
    }
  }, [auth.currentUser?.uid]);

  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [createError, setCreateError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState<Gender | "">("");
  const [editBloodType, setEditBloodType] = useState("");
  const [editHeight, setEditHeight] = useState<number | "">("");
  const [editWeight, setEditWeight] = useState<number | "">("");
  const [editGoogleFormId, setEditGoogleFormId] = useState("");
  const [editDoctorNotes, setEditDoctorNotes] = useState("");
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // BMI Calculation Helper
  const calculateBMI = (weight: number | "", height: number | "") => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Healthy range";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    const validation = validateProfileName(newProfileName);
    if (!validation.isValid) {
      setCreateError(validation.error || "Invalid name");
      return;
    }

    try {
      await createProfile(newProfileName.trim());
      setIsCreating(false);
      setNewProfileName("");
    } catch (error: any) {
      logger.error("Failed to create profile", { error });
      setCreateError("Failed to create profile");
    }
  };

  const handleEdit = (p: UserProfile) => {
    setEditingId(p.id);
    setEditFullName(p.fullName || p.name || "");
    setEditDob(p.dob || "");
    setEditGender((p.gender as Gender) || "");
    setEditBloodType(p.bloodType || "");
    setEditHeight(p.height || "");
    setEditWeight(p.weight || "");
    setEditGoogleFormId(p.googleFormId || "");
    setEditDoctorNotes(p.clinicalNotes || p.doctorNotes?.join("\n") || "");
    setEditError("");
  };

  const handleUpdate = async (id: string) => {
    try {
      setIsSaving(true);
      const updates: Partial<UserProfile> = {
        fullName: editFullName,
        name: editFullName,
        dob: editDob,
        gender: editGender as Gender,
        bloodType: editBloodType,
        height: editHeight ? Number(editHeight) : undefined,
        weight: editWeight ? Number(editWeight) : undefined,
        bmi: (editHeight && editWeight) ? Number(calculateBMI(Number(editWeight), Number(editHeight))) : undefined,
        clinicalNotes: editDoctorNotes,
        googleFormId: editGoogleFormId,
        doctorNotes: editDoctorNotes.split("\n").filter(Boolean),
      };
      await updateProfile(id, updates);
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setEditingId(null);
      }, 2000);
    } catch (error: any) {
      setIsSaving(false);
      logger.error("Failed to update profile", { error });
      setEditError("Failed to update profile");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile(id);
      setDeletingId(null);
    } catch (error: any) {
      logger.error("Failed to delete profile", { error });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Profile Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage multiple records and views
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => {
              setIsCreating(true);
              setCreateError("");
              setNewProfileName("");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Profile</span>
          </button>
        )}
      </div>

      {usageStats && (
        <div className="bg-slate-100 dark:bg-slate-800/50 backdrop-blur-md rounded-[24px] border border-slate-200 dark:border-slate-700/50 p-6 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700/50">
          <div className="flex-1 px-4 py-2 sm:py-0">
             <p className="text-slate-700 dark:text-slate-400 text-sm mb-1">Documents Uploaded</p>
             <p className="text-2xl font-bold text-slate-900 dark:text-white">{usageStats.documentsUploaded || 0}</p>
          </div>
          <div className="flex-1 px-4 py-2 sm:py-0">
             <p className="text-slate-700 dark:text-slate-400 text-sm mb-1">Storage Used</p>
             <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {((usageStats.totalStorageBytes || 0) / (1024 * 1024)).toFixed(2)} MB
             </p>
          </div>
          <div className="flex-1 px-4 py-2 sm:py-0 text-indigo-500 dark:text-indigo-400">
             <p className="text-indigo-600/80 dark:text-indigo-400/80 text-sm mb-1">AI Interactions (This Month)</p>
             <p className="text-2xl font-bold">
                {((usageStats.monthlyUsage && usageStats.monthlyUsage[new Date().toISOString().substring(0, 7)]) || 0).toLocaleString()}
             </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleCreate}
              className="bg-slate-800/50 backdrop-blur-md border border-indigo-500/30 p-6 rounded-2xl relative mb-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Create New Profile</h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <input
                type="text"
                autoFocus
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter patient name..."
                className={`w-full bg-black/20 border ${createError ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 mb-2`}
              />
              {createError && (
                <p className="text-red-400 text-xs mb-4">{createError}</p>
              )}

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => (
          <motion.div
            key={p.id}
            layout
            className={`relative bg-slate-800/30 border backdrop-blur-sm p-6 rounded-2xl transition-all ${
              activeProfile?.id === p.id
                ? "border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                : "border-white/5 hover:border-white/10"
            }`}
          >
            {activeProfile?.id === p.id && (
              <div className="absolute top-3 pl-3 text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
                Active Profile
              </div>
            )}

            <div className={`mt-4 ${editingId === p.id ? "mb-2" : "mb-6"}`}>
              {editingId === p.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-1.5 text-white text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">DOB</label>
                      <input
                        type="date"
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-1.5 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Gender</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value as Gender)}
                        className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-1.5 text-white text-sm"
                      >
                        <option value="">Select</option>
                        {Object.values(Gender).map((g) => (
                          <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Blood Type</label>
                      <select
                        value={editBloodType}
                        onChange={(e) => setEditBloodType(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-1.5 text-white text-sm"
                      >
                        <option value="">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={editHeight}
                        onChange={(e) => setEditHeight(e.target.value ? Number(e.target.value) : "")}
                        className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-1.5 text-white text-sm"
                        placeholder="cm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={editWeight}
                        onChange={(e) => setEditWeight(e.target.value ? Number(e.target.value) : "")}
                        className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-1.5 text-white text-sm"
                        placeholder="kg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Google Forms Intake ID (Optional)</label>
                    <input
                      type="text"
                      value={editGoogleFormId}
                      onChange={(e) => setEditGoogleFormId(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-1.5 text-white text-sm"
                      placeholder="e.g. 1FAIpQLScX..."
                    />
                    <p className="text-[10px] text-slate-500 mt-1">If provided, AI will fetch your form responses as clinical context.</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Clinical Notes</label>
                    <AutoSizeTextarea
                      value={editDoctorNotes}
                      onChange={(e: any) => setEditDoctorNotes(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-1.5 text-white text-sm"
                      placeholder="Medical history, allergies, or notes..."
                      minLines={3}
                    />
                  </div>
                  {editError && (
                    <p className="text-red-400 text-xs">{editError}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleUpdate(p.id)}
                      disabled={isSaving || isSaved}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded transition-colors ${
                        isSaved ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-500"
                      }`}
                    >
                      {isSaving ? "Saving..." : isSaved ? "Saved ✓" : <><Save className="w-3 h-3" /> Save</>}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={isSaving}
                      className="text-xs px-3 py-1.5 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3
                    className="text-xl font-semibold text-white truncate pr-6 mb-2"
                    title={p.fullName || p.name}
                  >
                    {p.fullName || p.name}
                  </h3>
                  
                  <div className="flex flex-col gap-2 mt-3">
                     <div className="flex items-center gap-4 text-xs text-slate-300">
                        {p.dob && <div><span className="text-slate-500">DOB:</span> {p.dob}</div>}
                        {p.bloodType && <div><span className="text-slate-500">Type:</span> <span className="font-bold text-red-400">{p.bloodType}</span></div>}
                     </div>
                     
                     {p.googleFormId && (
                       <div className="mt-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2 flex items-center gap-2 text-xs text-indigo-300">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                         Google Forms Intake Linked
                       </div>
                     )}

                     <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                        <div>
                           <div className="text-xs text-slate-400 mb-0.5">BMI</div>
                           {p.weight && p.height ? (
                              <div className="flex items-center gap-2">
                                 <span className="text-sm font-bold text-white">{calculateBMI(p.weight, p.height)}</span>
                                 <span className="text-[10px] uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{getBMICategory(Number(calculateBMI(p.weight, p.height)))}</span>
                              </div>
                           ) : (
                              <div className="text-[10px] text-slate-500">Add height and weight to calculate BMI</div>
                           )}
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-white/5 pt-4">
              <button
                onClick={() => {
                  if (activeProfile?.id !== p.id) setActiveProfile(p);
                }}
                disabled={activeProfile?.id === p.id}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeProfile?.id === p.id
                    ? "bg-indigo-500/10 text-indigo-400 cursor-default"
                    : "border border-slate-300 text-slate-700 dark:bg-white/10 dark:text-white"
                }`}
              >
                {activeProfile?.id === p.id ? "Viewing" : "Switch To"}
              </button>

              <button
                onClick={() => handleEdit(p)}
                className="p-1.5 text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10 rounded-lg transition-colors"
                title="Edit Profile"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeletingId(p.id)}
                disabled={profiles.length <= 1}
                className="p-1.5 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-white/5"
                title={
                  profiles.length <= 1
                    ? "Cannot delete last profile"
                    : "Delete Profile"
                }
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {activeProfile && (
         <div className="mt-8">
            <CycleTrackingSettings profile={activeProfile} />
         </div>
      )}

      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: "none" }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeletingId(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0F172A] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Delete Profile?
              </h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Are you sure you want to delete this profile? This action will
                permanently delete all associated medical records, timeline
                events, and insights. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="px-4 py-2 text-sm font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-xl transition-colors"
                >
                  Delete Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="text-center text-slate-500 text-xs mt-12 pb-8">
        Built by <a href="https://aniket.aegishealthai.co.in/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 underline decoration-slate-600 transition-colors">Aniket Dhuri</a> • Version {version}
      </div>
    </div>
  );
}
