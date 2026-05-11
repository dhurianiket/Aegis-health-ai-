import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import {
  Moon,
  Sun,
  Download,
  Trash2,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { logAuditEvent } from "../../lib/auditLogger";

export default function SettingsPage() {
  const { logOut, user } = useAuth();
  const { activeProfile, profiles, deleteProfile } = useProfile();

  const [theme, setTheme] = useState("light");

  React.useEffect(() => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleEmergencyMode = async () => {
    if (
      window.confirm(
        "Enable Global Emergency Mode? This logs an audit event and can trigger priority data access.",
      )
    ) {
      if (user) {
        await logAuditEvent(user.uid, "ENABLE_EMERGENCY_MODE", "global");
        alert("Emergency mode activated. Audit log written.");
      }
    }
  };

  const handleDeleteProfile = async () => {
    if (!activeProfile || !user) return;
    if (profiles.length <= 1) {
      alert("You cannot delete your primary profile.");
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete the profile "${activeProfile.name}"? This cannot be undone.`,
      )
    ) {
      try {
        await deleteProfile(activeProfile.id);
        await logAuditEvent(user.uid, "DELETE_PROFILE", activeProfile.id);
        alert("Profile deleted successfully.");
      } catch (e) {
        console.error(e);
        alert("Failed to delete profile.");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] mb-2">
          Settings
        </h2>
        <p className="text-[var(--color-text-muted)] text-sm">
          Manage your preferences, data, and account settings.
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[var(--color-text)]">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-[var(--color-primary)]" />
              ) : (
                <Sun className="w-5 h-5 text-[var(--color-warning)]" />
              )}
              <span className="font-medium">Theme</span>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-bg)]/80 transition"
            >
              Toggle {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </section>

        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            Data, Privacy & Emergency
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--color-success)]" />
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text)]">
                    Export Data
                  </h4>
                  <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
                    Download a copy of your personal health data.
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm font-medium transition text-[var(--color-text)]">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>

            <div className="flex items-center justify-between bg-[var(--color-bg)] border border-amber-500/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text)]">
                    Global Emergency Mode
                  </h4>
                  <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
                    Activate priority data access and log an audit event.
                  </p>
                </div>
              </div>
              <button
                onClick={handleEmergencyMode}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl text-sm font-medium transition border border-amber-500/20"
              >
                Enable Mode
              </button>
            </div>

            <div className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-critical)]/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-[var(--color-critical)]" />
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text)]">
                    Delete Profile
                  </h4>
                  <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
                    {profiles.length <= 1
                      ? "Primary profile cannot be deleted."
                      : `Delete the current profile (${activeProfile?.name}).`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDeleteProfile}
                disabled={profiles.length <= 1}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-critical)]/10 hover:bg-[var(--color-critical)]/20 text-[var(--color-critical)] rounded-xl text-sm font-medium transition border border-[var(--color-critical)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Profile
              </button>
            </div>

            <div className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-critical)]/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-[var(--color-critical)]" />
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text)]">
                    Delete Account
                  </h4>
                  <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
                    Permanently delete all your personal data.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete all your data? This action is irreversible.",
                    )
                  ) {
                    // MOCK deletion
                    alert("Account marked for deletion.");
                    logOut();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-critical)]/10 hover:bg-[var(--color-critical)]/20 text-[var(--color-critical)] rounded-xl text-sm font-medium transition border border-[var(--color-critical)]/20"
              >
                Delete Data
              </button>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            About
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text)]">Version</span>
              <span className="text-[var(--color-text-faint)] text-sm">
                v2.1.0 (Apple-grade build)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text)]">
                Diagnostic System
              </span>
              <span className="text-[var(--color-text-faint)] text-sm">
                Aura AI Core
              </span>
            </div>
          </div>
        </section>

        <div className="flex justify-center pt-6">
          <button
            onClick={logOut}
            className="px-6 py-2 border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-full text-sm font-medium transition"
          >
            Sign Out
          </button>
        </div>

        <div className="pt-12 mt-8 border-t border-[var(--color-border)] opacity-60">
          <div className="flex flex-col items-center text-center space-y-1">
            <h4 className="text-sm font-semibold text-[var(--color-text)] tracking-tight">Aegis Health AI</h4>
            <p className="text-[10px] text-[var(--color-text-faint)] font-mono uppercase tracking-[0.2em] mb-2">Version 1.5.0</p>
            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              Developed by <span className="font-medium text-[var(--color-text)]">Aniket Dhuri</span> ✨
            </p>
            <p className="text-[10px] text-[var(--color-text-faint)] font-medium">
              Powered by Google AI Studio & Gemini AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
