import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Edit2,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  Save,
} from "lucide-react";
import { useProfile, Profile } from "../../context/ProfileContext";
import { UserProfile } from "../../types/medical";
import { validateProfileName } from "../../lib/validation";
import { logger } from "../../lib/logger";

export default function ProfileManagement() {
  const {
    profiles,
    activeProfile,
    setActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useProfile();

  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [createError, setCreateError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");

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
    setEditName(p.fullName || p.name || "");
    setEditError("");
  };

  const handleUpdate = async (id: string) => {
    const validation = validateProfileName(editName);
    if (!validation.isValid) {
      setEditError(validation.error || "Invalid name");
      return;
    }

    try {
      await updateProfile(id, editName.trim());
      setEditingId(null);
    } catch (error: any) {
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
                <div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    className={`w-full bg-black/20 border ${editError ? "border-red-500" : "border-white/10"} rounded-md px-3 py-1.5 text-white mb-2 text-sm`}
                  />
                  {editError && (
                    <p className="text-red-400 text-xs mb-2">{editError}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleUpdate(p.id)}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/30"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs px-2 py-1 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <h3
                  className="text-xl font-semibold text-white truncate pr-6"
                  title={p.name}
                >
                  {p.name}
                </h3>
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
                    : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
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

      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
    </div>
  );
}
