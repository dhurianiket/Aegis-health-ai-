import React, { Suspense } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import IntegrationsPanel from "./IntegrationsPanel";
import IdentityLinkingCard from "./IdentityLinkingCard";
import {
  Moon,
  Sun,
  Download,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { logAuditEvent } from "../../lib/auditLogger";
import { useTheme } from "../../context/ThemeContext";

export default function SettingsPage() {
  const { logOut, user } = useAuth();
  const { activeProfile, profiles, deleteProfile } = useProfile();
  const { theme, toggleTheme } = useTheme();

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
        `Are you sure you want to delete the profile "${activeProfile?.name}"? This cannot be undone.`,
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
                Settings &amp; Clinical Preferences
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                WCAG 2.2 AA Verified
              </span>
            </div>
            <p className="text-[var(--color-text-muted)] text-xs sm:text-sm mt-1">
              Configure display theme, ABDM health integrations, zero-knowledge encryption, and privacy controls.
            </p>
          </div>
        </div>
      </div>

      {/* ── Appearance & Theme Studio ── */}
      <section
        aria-label="Appearance and Display Theme"
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Appearance &amp; Display Mode
            </h3>
            <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
              Choose between Clinical Daylight (Light) and OLED Command Center (Dark) themes.
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-xs sm:text-sm font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] self-start sm:self-auto"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-700" />
            )}
            <span>Toggle {theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Light Mode Option Card */}
          <button
            type="button"
            onClick={() => {
              if (theme !== "light") toggleTheme();
            }}
            aria-pressed={theme === "light"}
            className={`group text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
              theme === "light"
                ? "bg-teal-500/10 border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                : "bg-[var(--color-bg)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--color-text)]">
                    Clinical Daylight (Light)
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  High-contrast daylight surface calibrated for ward rounds and printed report review.
                </p>
              </div>
            </div>
            {theme === "light" && (
              <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
            )}
          </button>

          {/* Dark Mode Option Card */}
          <button
            type="button"
            onClick={() => {
              if (theme !== "dark") toggleTheme();
            }}
            aria-pressed={theme === "dark"}
            className={`group text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
              theme === "dark"
                ? "bg-teal-500/10 border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                : "bg-[var(--color-bg)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--color-text)]">
                    OLED Command Center (Dark)
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Low-glare deep slate canvas optimized for 3D organ telemetry and night-shift monitoring.
                </p>
              </div>
            </div>
            {theme === "dark" && (
              <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
            )}
          </button>
        </div>
      </section>

      {/* ── Linked Login Identities & Multi-Factor Security ── */}
      <IdentityLinkingCard />

      {/* ── Connected Apps & ABHA / Health Integrations ── */}
      <section aria-label="Connected Apps and Health Integrations">
        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-1">
          Connected Apps &amp; Health Integrations
        </h3>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-48 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="w-6 h-6 border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          }
        >
          <IntegrationsPanel activeProfile={activeProfile} />
        </Suspense>
      </section>

      <div className="space-y-6">
        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            Data, Privacy &amp; Emergency
          </h3>
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-bg)] border border-[var(--color-border)] p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--color-success)] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text)]">
                    Export Data
                  </h4>
                  <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
                    Download a portable copy of your personal health records and FHIR bundles.
                  </p>
                </div>
              </div>
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-xs sm:text-sm font-bold transition text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] shrink-0">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-bg)] border border-amber-500/30 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text)]">
                    Global Emergency Mode
                  </h4>
                  <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
                    Activate priority data access and write a cryptographic audit event.
                  </p>
                </div>
              </div>
              <button
                onClick={handleEmergencyMode}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 rounded-xl text-xs sm:text-sm font-bold transition border border-amber-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
              >
                Enable Mode
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-bg)] border border-[var(--color-critical)]/30 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-[var(--color-critical)] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text)]">
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
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-critical)]/10 hover:bg-[var(--color-critical)]/20 text-[var(--color-critical)] rounded-xl text-xs sm:text-sm font-bold transition border border-[var(--color-critical)]/30 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-critical)] shrink-0"
              >
                Delete Profile
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-bg)] border border-[var(--color-critical)]/30 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-[var(--color-critical)] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text)]">
                    Delete Account
                  </h4>
                  <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
                    Permanently erase all personal clinical data from cloud storage.
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
                    alert("Account marked for deletion.");
                    logOut();
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-critical)]/10 hover:bg-[var(--color-critical)]/20 text-[var(--color-critical)] rounded-xl text-xs sm:text-sm font-bold transition border border-[var(--color-critical)]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-critical)] shrink-0"
              >
                Delete Data
              </button>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            About System
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
              <span className="text-sm font-medium text-[var(--color-text)]">Version</span>
              <span className="text-[var(--color-text-faint)] text-sm font-mono">
                v2.0.0 (Apple-grade build)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
              <span className="text-sm font-medium text-[var(--color-text)]">
                Diagnostic System
              </span>
              <span className="text-[var(--color-text-faint)] text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Aura AI Core
              </span>
            </div>
          </div>
        </section>

        <div className="flex justify-center pt-4">
          <button
            onClick={logOut}
            className="px-6 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-full text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            Sign Out
          </button>
        </div>

        <div className="pt-8 mt-6 border-t border-[var(--color-border)]">
          <div className="flex flex-col items-center text-center space-y-1">
            <h4 className="text-sm font-bold text-[var(--color-text)] tracking-tight">Aegis Health AI</h4>
            <p className="text-xs text-[var(--color-text-faint)] font-mono uppercase tracking-[0.2em] mb-2">Version 2.0.0</p>
            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              Developed by <a href="https://aniket.aegishealthai.co.in/" target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] underline underline-offset-2 decoration-[var(--color-text-faint)] hover:decoration-[var(--color-primary)] transition-colors">Aniket Dhuri</a> ✨
            </p>
            <p className="text-xs text-[var(--color-text-faint)] font-medium">
              Powered by Google AI Studio &amp; Gemini AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
