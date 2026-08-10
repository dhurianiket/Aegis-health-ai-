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
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setSyncState(getHealthSyncState(userId));
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
        setSyncState(getHealthSyncState(userId));
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
        setSyncState(getHealthSyncState(userId));
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

  const handleToggleConnection = (provider: HealthProvider) => {
    const isConnected = provider === "apple" ? syncState.appleHealth.connected : syncState.googleHealth.connected;
    const newState = saveHealthSyncState(userId, provider, {
      connected: !isConnected,
    });
    setSyncState(newState);
    setSyncFeedback({
      type: "success",
      message: `${provider === "apple" ? "Apple Health" : "Google Health Connect"} ${!isConnected ? "connected" : "disconnected"}.`,
    });
  };

  const integrations = [
    {
      id: "apple" as HealthProvider,
      name: "Apple Health (HealthKit)",
      icon: Apple,
      color: "bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-slate-700/50 shadow-md",
      status: syncState.appleHealth.connected ? "Connected" : "Available",
      config: syncState.appleHealth,
      description:
        "Sync vitals, heart rate variability (HRV), SpO2, steps and sleep architecture directly from Apple Watch and HealthKit.",
    },
    {
      id: "google" as HealthProvider,
      name: "Google Health Connect",
      icon: Chrome,
      color: "bg-blue-600 text-white dark:bg-blue-500 shadow-md",
      status: syncState.googleHealth.connected ? "Connected" : "Available",
      config: syncState.googleHealth,
      description:
        "Import real-time activity logs, telemetry metrics, and biometric measurements from Google Health Connect & Google Fit.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Feedback Banner */}
      {syncFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            syncFeedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
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
            className="text-xs font-bold opacity-70 hover:opacity-100 uppercase tracking-widest px-2 py-1"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Health Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => {
          const isSyncing = syncingProvider === item.id;
          const lastSyncedDate = item.config.lastSynced
            ? new Date(item.config.lastSynced).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Never";

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-3xl flex flex-col justify-between group shadow-sm hover:shadow-xl transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-2xl ${item.color} shadow-lg`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-widest ${
                      item.config.connected
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                        : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
                  {item.name}
                </h3>
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-4">
                  {item.description}
                </p>

                {item.config.connected && (
                  <div className="p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl mb-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                      <span>Last Synced:</span>
                      <span className="font-bold text-[var(--color-text)]">
                        {lastSyncedDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                      <span>Records Synced:</span>
                      <span className="font-bold text-emerald-400">
                        {item.config.recordsCount} biometrics
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--color-border)] space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setModalProvider(item.id)}
                    disabled={isSyncing}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
                    />
                    {isSyncing
                      ? "Syncing..."
                      : item.config.connected
                      ? "Sync Now"
                      : "Connect & Sync"}
                  </button>

                  <label className="flex items-center gap-2 py-2.5 px-3 bg-[var(--color-bg)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-bold text-xs rounded-xl transition-all cursor-pointer">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Import File</span>
                    <input
                      type="file"
                      accept=".xml,.json,.txt"
                      onChange={(e) => handleFileUpload(item.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          );
        })}
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
          setSyncState(getHealthSyncState(userId));
        }}
      />
    </div>
  );
}
