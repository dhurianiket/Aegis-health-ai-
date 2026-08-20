import React, { useState, useEffect } from "react";
import {
  Database,
  FileJson,
  Table,
  CheckCircle2,
  ArrowRight,
  Apple,
  Chrome,
  RefreshCw,
  Upload,
  AlertCircle,
  Activity,
  Heart,
  Footprints,
} from "lucide-react";
import { motion } from "motion/react";
import { exportToCSV, exportToFHIR } from "../../services/integrationService";
import {
  getHealthSyncState,
  saveHealthSyncState,
  syncAppleHealth,
  syncGoogleHealth,
  parseAppleHealthExport,
  parseGoogleHealthExport,
  HealthSyncState,
  HealthProvider,
} from "../../services/healthSyncService";
import { useAuth } from "../../context/AuthContext";
import HealthConnectModal from "./HealthConnectModal";
import AbdmConnectModal from "./AbdmConnectModal";
import { getAbdmProfile, AbhaProfile } from "../../services/abdmService";
import { QrCode, ShieldCheck } from "lucide-react";

interface IntegrationsPanelProps {
  activeProfile: any;
}

export default function IntegrationsPanel({
  activeProfile,
}: IntegrationsPanelProps) {
  const { user } = useAuth();
  const userId = user?.uid || activeProfile?.id || "demo-user-id";

  const [syncState, setSyncState] = useState<HealthSyncState>(() =>
    getHealthSyncState(userId)
  );
  const [syncingProvider, setSyncingProvider] = useState<HealthProvider | null>(
    null
  );
  const [modalProvider, setModalProvider] = useState<HealthProvider | null>(null);
  const [isAbdmModalOpen, setIsAbdmModalOpen] = useState(false);
  const [abhaProfile, setAbhaProfile] = useState<AbhaProfile | null>(() =>
    getAbdmProfile(userId)
  );
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setAbhaProfile(getAbdmProfile(userId));
  }, [userId, isAbdmModalOpen]);

  const refreshSyncState = () => {
    setSyncState(getHealthSyncState(userId));
    setAbhaProfile(getAbdmProfile(userId));
  };

  useEffect(() => {
    refreshSyncState();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", refreshSyncState);
      return () => window.removeEventListener("storage", refreshSyncState);
    }
  }, [userId]);

  const handleSync = async (provider: HealthProvider) => {
    setSyncingProvider(provider);
    setSyncFeedback(null);

    try {
      const result =
        provider === "apple"
          ? await syncAppleHealth(userId)
          : await syncGoogleHealth(userId);

      if (result.success) {
        refreshSyncState();
        setSyncFeedback({
          type: "success",
          message: `Successfully synced 5 biometric data points from ${
            provider === "apple" ? "Apple Health" : "Google Health Connect"
          }.`,
        });
      } else {
        setSyncFeedback({
          type: "error",
          message: result.error || `Failed to sync with ${provider}.`,
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.message || `An error occurred during ${provider} sync.`,
      });
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleFileUpload = (
    provider: HealthProvider,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        const biometrics =
          provider === "apple"
            ? parseAppleHealthExport(content, userId)
            : parseGoogleHealthExport(content, userId);

        setSyncFeedback({
          type: "success",
          message: `Successfully imported ${provider === "apple" ? "Apple Health" : "Google Health"} export file. HR: ${biometrics.heartRate} bpm, Steps: ${biometrics.steps}.`,
        });
        refreshSyncState();
      } catch {
        setSyncFeedback({
          type: "error",
          message: `Failed to parse ${provider} export file. Please check file format.`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCSVExport = () => {
    if (activeProfile?.labValues) {
      exportToCSV(activeProfile.labValues, `Labs_${activeProfile.name}.csv`);
    }
  };

  const appleStatus = syncState.appleHealth.connected
    ? "Connected (Live HealthKit)"
    : "Available";
  const googleStatus = syncState.googleHealth.connected
    ? "Connected (Live Health Connect)"
    : "Available";

  return (
    <div className="space-y-8">
      {/* Feedback Banner */}
      {syncFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            syncFeedback.type === "success"
              ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
              : "bg-rose-500/15 border-rose-400/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {syncFeedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm font-bold">{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100 uppercase tracking-widest px-2 py-1 cursor-pointer"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Ultra-Premium 3D Glassmorphic Health Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Apple Health (HealthKit) 3D Glass Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-700/60 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.15)] rounded-[32px] p-6 md:p-8 transition-all duration-300 hover:border-slate-600/80 hover:shadow-[0_20px_48px_-10px_rgba(45,212,191,0.25),inset_0_1px_1px_0_rgba(255,255,255,0.25)] flex flex-col justify-between group"
        >
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-radial from-slate-400/20 via-rose-500/10 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700/80 text-white shadow-[0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] shrink-0">
                <Apple className="w-7 h-7 text-white" />
              </div>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full border uppercase tracking-widest ${
                  syncState.appleHealth.connected
                    ? "text-emerald-300 bg-emerald-500/20 border-emerald-400/40"
                    : "text-slate-400 bg-slate-800/60 border-slate-700/60"
                }`}
              >
                {appleStatus}
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-50 tracking-tight mb-2">
              Apple Health (HealthKit)
            </h3>
            <p className="text-slate-200 text-xs md:text-sm leading-relaxed mb-4">
              Continuous bidirectional telemetry bridge for heart rate variability (HRV), resting heart rate, SpO2, daily active energy, and sleep architecture directly from Apple Watch and HealthKit.
            </p>

            {syncState.appleHealth.connected && (
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Last Synced:</span>
                  <span className="font-bold text-slate-50">
                    {syncState.appleHealth.lastSynced
                      ? new Date(syncState.appleHealth.lastSynced).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Just now"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Records Synced:</span>
                  <span className="font-bold text-emerald-300">
                    {syncState.appleHealth.recordsCount} biometrics
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3 relative z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModalProvider("apple")}
                disabled={syncingProvider === "apple"}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-b from-slate-800/90 to-slate-950/90 border border-slate-700/70 hover:border-slate-500/80 text-slate-50 font-extrabold text-xs uppercase tracking-wider backdrop-blur-md rounded-2xl transition-all shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncingProvider === "apple" ? "animate-spin" : ""}`}
                />
                {syncingProvider === "apple"
                  ? "Syncing..."
                  : syncState.appleHealth.connected
                  ? "Sync Now"
                  : "Connect & Sync"}
              </button>

              <label className="flex items-center gap-2 py-3 px-4 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-slate-100 font-extrabold text-xs rounded-2xl transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Import File</span>
                <input
                  type="file"
                  accept=".xml,.json,.txt"
                  onChange={(e) => handleFileUpload("apple", e)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </motion.div>

        {/* Google Health Connect 3D Glass Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-blue-500/30 shadow-[0_16px_40px_-8px_rgba(37,99,235,0.25),inset_0_1px_1px_0_rgba(255,255,255,0.2)] rounded-[32px] p-6 md:p-8 transition-all duration-300 hover:border-blue-400/50 hover:shadow-[0_20px_48px_-10px_rgba(59,130,246,0.35),inset_0_1px_1px_0_rgba(255,255,255,0.3)] flex flex-col justify-between group"
        >
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-radial from-blue-500/25 via-teal-400/15 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-blue-600 to-indigo-900 border border-blue-400/60 text-white shadow-[0_8px_20px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] shrink-0">
                <Chrome className="w-7 h-7 text-cyan-300" />
              </div>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full border uppercase tracking-widest ${
                  syncState.googleHealth.connected
                    ? "text-teal-300 bg-teal-500/20 border-teal-400/40"
                    : "text-slate-400 bg-slate-800/60 border-slate-700/60"
                }`}
              >
                {googleStatus}
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-50 tracking-tight mb-2">
              Google Health Connect
            </h3>
            <p className="text-slate-200 text-xs md:text-sm leading-relaxed mb-4">
              Real-time encrypted Android telemetry bridge for Google Fit, Samsung Health, Garmin, and Fitbit biometrics and activity metrics.
            </p>

            {syncState.googleHealth.connected && (
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Last Synced:</span>
                  <span className="font-bold text-slate-50">
                    {syncState.googleHealth.lastSynced
                      ? new Date(syncState.googleHealth.lastSynced).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Just now"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Records Synced:</span>
                  <span className="font-bold text-teal-300">
                    {syncState.googleHealth.recordsCount} biometrics
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3 relative z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModalProvider("google")}
                disabled={syncingProvider === "google"}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-b from-blue-600/90 to-indigo-900/90 border border-blue-400/50 hover:border-blue-300/70 text-white font-extrabold text-xs uppercase tracking-wider backdrop-blur-md rounded-2xl transition-all shadow-[0_4px_16px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncingProvider === "google" ? "animate-spin" : ""}`}
                />
                {syncingProvider === "google"
                  ? "Syncing..."
                  : syncState.googleHealth.connected
                  ? "Sync Now"
                  : "Connect & Sync"}
              </button>

              <label className="flex items-center gap-2 py-3 px-4 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-slate-100 font-extrabold text-xs rounded-2xl transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-cyan-300" />
                <span>Import File</span>
                <input
                  type="file"
                  accept=".xml,.json,.txt"
                  onChange={(e) => handleFileUpload("google", e)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </motion.div>

        {/* ABDM (Ayushman Bharat Digital Mission) 3D Glass Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-orange-500/30 shadow-[0_16px_40px_-8px_rgba(234,88,12,0.25),inset_0_1px_1px_0_rgba(255,255,255,0.2)] rounded-[32px] p-6 md:p-8 transition-all duration-300 hover:border-orange-400/50 hover:shadow-[0_20px_48px_-10px_rgba(249,115,22,0.35),inset_0_1px_1px_0_rgba(255,255,255,0.3)] flex flex-col justify-between group col-span-1 md:col-span-2"
        >
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-radial from-orange-500/25 via-amber-400/15 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-orange-500 to-amber-700 text-white shadow-lg shrink-0">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border uppercase tracking-widest ${
                abhaProfile
                  ? "text-emerald-300 bg-emerald-500/20 border-emerald-400/40"
                  : "text-orange-300 bg-orange-500/20 border-orange-400/40"
              }`}>
                {abhaProfile ? "ABHA Verified • Connected" : "NHA ABDM Gateway • Ready"}
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-50 tracking-tight mb-2">
              Ayushman Bharat Digital Health ID (ABHA Card)
            </h3>
            <p className="text-slate-200 text-xs md:text-sm leading-relaxed mb-4">
              Link your 14-digit ABHA ID to continuously aggregate longitudinal medical records, lab reports, and doctor prescriptions across hospitals, clinics, and diagnostic centers in India.
            </p>

            {abhaProfile && (
              <div className="mb-4 p-3 bg-black/40 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-slate-300">
                  ABHA: <strong className="font-mono text-indigo-300">{abhaProfile.abhaAddress}</strong> ({abhaProfile.abhaNumber})
                </div>
                <div className="text-emerald-400 font-bold">
                  {abhaProfile.linkedCareContextsCount} Care Contexts Linked
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 relative z-10 flex justify-end">
            <button
              onClick={() => setIsAbdmModalOpen(true)}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {abhaProfile ? "Manage ABHA & Consent Hub" : "Connect & Verify ABHA ID"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Data Portability Section */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
              Data Portability & Export
            </h3>
          </div>
          <p className="text-[var(--color-text-muted)] text-sm">
            Export your complete health profile and vitals history in industry-standard EHR formats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* FHIR Export */}
          <div
            className="p-8 border-r border-[var(--color-border)] hover:bg-[var(--color-bg)]/50 transition-colors cursor-pointer group"
            onClick={() => exportToFHIR(activeProfile)}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                <FileJson className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-[var(--color-text)]">FHIR JSON Export</h4>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-6">
              Standardized format used by healthcare systems like Epic and
              Cerner for seamless record transfers.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-faint)] uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> V1.0.0
              Compatible
            </div>
          </div>

          {/* CSV Export */}
          <div
            className="p-8 hover:bg-[var(--color-bg)]/50 transition-colors cursor-pointer group"
            onClick={handleCSVExport}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                <Table className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-[var(--color-text)]">Spreadsheet (CSV)</h4>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-6">
              Download your complete lab history and vital trends for custom
              analysis in Excel or Google Sheets.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-faint)] uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Formatted
              for Analysis
            </div>
          </div>
        </div>
      </div>

      <HealthConnectModal
        isOpen={modalProvider !== null}
        onClose={() => setModalProvider(null)}
        provider={modalProvider || 'apple'}
        onSyncComplete={() => {
          refreshSyncState();
        }}
      />

      <AbdmConnectModal
        isOpen={isAbdmModalOpen}
        onClose={() => setIsAbdmModalOpen(false)}
        onSuccess={() => {
          setSyncFeedback({
            type: "success",
            message: "ABHA Card verified and linked to Aegis Health AI!",
          });
        }}
      />
    </div>
  );
}
