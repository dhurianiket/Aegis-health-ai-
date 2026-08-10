import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Heart,
  Moon,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Flame,
  Footprints,
  Info,
  ChevronRight,
  RefreshCw,
  Apple,
  Chrome,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { WearableBiometrics } from "../../types/wearables";
import { LabResult, MedicalDocument } from "../../types/medical";
import {
  evaluateBiometricDiagnosticCorrelation,
  BiometricDiagnosticCorrelation,
} from "../../services/biometricDiagnosticEngine";
import { generateMockTelemetry, connectWebBluetooth } from "../../services/wearableService";
import {
  syncAppleHealth,
  syncGoogleHealth,
  getHealthSyncState,
  HealthProvider,
  HealthSyncState,
} from "../../services/healthSyncService";
import { useAuth } from "../../context/AuthContext";
import HealthConnectModal from "../Settings/HealthConnectModal";

export interface WearableCoachWidgetProps {
  telemetry?: WearableBiometrics;
  correlation?: BiometricDiagnosticCorrelation;
  labResults?: LabResult[];
  imagingFindings?: string[] | MedicalDocument[];
  onActionClick?: (action: string) => void;
  /** Called with the current telemetry when the user requests a cloud sync */
  onSyncRequest?: (overrides: Partial<WearableBiometrics>) => Promise<void>;
}

export default function WearableCoachWidget({
  telemetry: initialTelemetry,
  correlation: initialCorrelation,
  labResults = [],
  imagingFindings = [],
  onActionClick,
  onSyncRequest,
}: WearableCoachWidgetProps) {
  const { user } = useAuth();
  // Use state to allow mock toggles/updates if interactive
  const [telemetry, setTelemetry] = useState<WearableBiometrics>(
    () => initialTelemetry || generateMockTelemetry("demo_user")
  );
  const activeUserId = user?.uid || telemetry.userId || 'demo-user-id';
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'synced' | 'error'>('idle');
  const [activeHealthModal, setActiveHealthModal] = useState<HealthProvider | null>(null);

  const [syncState, setSyncState] = useState<HealthSyncState>(() =>
    getHealthSyncState(activeUserId)
  );

  useEffect(() => {
    setSyncState(getHealthSyncState(activeUserId));
  }, [activeUserId, telemetry]);

  // Compute correlation matrix dynamically if not explicitly passed
  const correlation = useMemo<BiometricDiagnosticCorrelation>(() => {
    if (initialCorrelation) return initialCorrelation;
    return evaluateBiometricDiagnosticCorrelation(telemetry, labResults, imagingFindings);
  }, [telemetry, labResults, imagingFindings, initialCorrelation]);

  const readinessScore = correlation.readinessScore;

  // Readiness color theme calculation
  const readinessTheme = useMemo(() => {
    if (readinessScore >= 80) {
      return {
        label: "Optimal Readiness",
        badgeBg: "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        progressFill: "bg-emerald-500",
        textColor: "text-emerald-700 dark:text-emerald-300",
      };
    } else if (readinessScore >= 60) {
      return {
        label: "Moderate Readiness",
        badgeBg: "bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-500/30",
        progressFill: "bg-amber-500",
        textColor: "text-amber-700 dark:text-amber-300",
      };
    } else {
      return {
        label: "Low Readiness / Rest Required",
        badgeBg: "bg-rose-500/10 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-500/30",
        progressFill: "bg-rose-500",
        textColor: "text-rose-700 dark:text-rose-300",
      };
    }
  }, [readinessScore]);

  // Data for Panel 2: Sleep Architecture Recharts
  const sleepData = useMemo(() => {
    const sleep = telemetry.sleep || {
      totalMinutes: 480,
      deepMinutes: 110,
      remMinutes: 110,
      lightMinutes: 260,
      sleepScore: 82,
    };

    return [
      {
        name: "Stage Minutes",
        Deep: sleep.deepMinutes,
        REM: sleep.remMinutes,
        Light: sleep.lightMinutes,
      },
    ];
  }, [telemetry.sleep]);

  // Mock historical micro-trend data for Panel 3 sparklines
  const sparklineData = useMemo(() => {
    const rhrBase = telemetry.rhr || 65;
    const hrvBase = telemetry.hrv || 50;
    const spo2Base = telemetry.spo2 || 98;
    const stepsBase = telemetry.steps || 7500;

    return [
      { day: "M", rhr: rhrBase - 2, hrv: hrvBase - 4, spo2: 98, steps: stepsBase - 1200 },
      { day: "T", rhr: rhrBase + 1, hrv: hrvBase - 2, spo2: 98, steps: stepsBase - 500 },
      { day: "W", rhr: rhrBase - 1, hrv: hrvBase + 5, spo2: 99, steps: stepsBase + 800 },
      { day: "T", rhr: rhrBase + 3, hrv: hrvBase - 3, spo2: 97, steps: stepsBase + 200 },
      { day: "F", rhr: rhrBase, hrv: hrvBase + 2, spo2: 98, steps: stepsBase },
    ];
  }, [telemetry]);

  const handleSync = async (overrides?: Partial<WearableBiometrics>) => {
    if (!onSyncRequest) return;
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      await onSyncRequest(overrides ?? telemetry);
      setSyncStatus('synced');
      setSyncState(getHealthSyncState(activeUserId));
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync prop updates from parent / Firestore real-time listener
  useEffect(() => {
    if (initialTelemetry) {
      setTelemetry(initialTelemetry);
    }
  }, [initialTelemetry]);

  const handleConnectBluetooth = async () => {
    try {
      const state = await connectWebBluetooth();
      if (state === 'connected') {
        alert("Web Bluetooth connected successfully! Syncing live telemetry...");
        if (onSyncRequest) {
          await handleSync();
        }
      } else if (state === 'unsupported') {
        alert("Web Bluetooth is not supported on this browser or platform. Please use Google Chrome or Edge on desktop/Android.");
      } else {
        alert("Bluetooth pairing canceled or device disconnected.");
      }
    } catch (e: any) {
      console.warn("Bluetooth connection error:", e);
    }
  };

  const isAppleConnected = syncState.appleHealth.connected;
  const isGoogleConnected = syncState.googleHealth.connected;

  return (
    <section
      role="region"
      aria-label="AI Health Coach & Wearable Telemetry Widget"
      className="relative overflow-hidden bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-700/60 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.15)] p-6 md:p-8 rounded-[36px] space-y-8 pointer-events-auto"
    >
      {/* Ambient Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-radial from-teal-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-50">
              AI Health Coach Fusion & Biometrics
            </h2>
            {(isAppleConnected || isGoogleConnected) && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Live Connected
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-200 font-medium">
            Real-time wearable telemetry cross-correlated with lab panels & diagnostic imaging
          </p>
        </div>

        {/* Real Bluetooth & Cloud Sync Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveHealthModal('apple')}
            className={`group relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer backdrop-blur-md border ${
              isAppleConnected
                ? 'bg-gradient-to-b from-slate-800 to-slate-950 border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-gradient-to-b from-slate-800/90 to-slate-950/90 border-slate-700/70 text-slate-50 shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:border-slate-500/80'
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-white" />
            <span>{isAppleConnected ? ' Apple Health (Live)' : ' Apple Health'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHealthModal('google')}
            className={`group relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer backdrop-blur-md border ${
              isGoogleConnected
                ? 'bg-gradient-to-b from-blue-600 to-indigo-900 border-teal-400/50 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.25)]'
                : 'bg-gradient-to-b from-blue-600/90 to-indigo-900/90 border-blue-400/50 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)] hover:border-blue-300/70'
            }`}
          >
            <Chrome className="w-3.5 h-3.5 text-cyan-300" />
            <span>{isGoogleConnected ? 'Google Health (Live)' : 'Google Health'}</span>
          </button>

          <button
            type="button"
            onClick={handleConnectBluetooth}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-b from-indigo-600 to-indigo-900 border border-indigo-400/40 text-white shadow-md hover:border-indigo-300 transition-all cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-300" />
            Pair Bluetooth Device
          </button>

          {/* Sync to Cloud button */}
          {onSyncRequest && (
            <button
              type="button"
              onClick={() => handleSync()}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing…' : syncStatus === 'synced' ? '✓ Synced' : syncStatus === 'error' ? '⚠ Retry' : 'Sync Cloud Data'}
            </button>
          )}
        </div>
      </div>

      {/* PANEL 5: Clinical Triage Safety Alerts */}
      {correlation.safetyAlerts && correlation.safetyAlerts.length > 0 && (
        <div className="space-y-3 relative z-10" role="region" aria-label="Clinical Triage Safety Alerts">
          {correlation.safetyAlerts.map((triageAlert, index) => {
            if (dismissedAlerts[triageAlert.metric]) return null;
            return (
              <div
                key={index}
                className="bg-rose-950/70 border-2 border-rose-500/50 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-600 text-white">
                        {triageAlert.severity} Safety Alert
                      </span>
                      <span className="text-xs font-bold text-rose-200">
                        {triageAlert.source}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-50 leading-snug">
                      {triageAlert.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => {
                      if (onActionClick) onActionClick(triageAlert.message);
                      if (typeof window !== "undefined") {
                        window.alert("Triage Action Triggered: Urging immediate rest and notifying provider.");
                      }
                    }}
                    className="flex-1 md:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
                  >
                    Rest Immediately & Contact Care Team
                  </button>
                  <button
                    onClick={() =>
                      setDismissedAlerts((prev) => ({ ...prev, [triageAlert.metric]: true }))
                    }
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Grid: Panels 1 & 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* PANEL 1: Daily Readiness Target & Composite Score */}
        <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-slate-50">
                Daily Readiness Target & Score
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${readinessTheme.badgeBg}`}
            >
              {readinessTheme.label}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-5xl font-extrabold text-slate-50 tracking-tight">
                {readinessScore}
              </span>
              <span className="text-lg font-bold text-slate-300 ml-1">
                /100
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-300">
                Sleep Contribution: {Math.round(((telemetry.sleep?.sleepScore ?? 80) / 100) * 35)}/35 pts
              </p>
              <p className="text-xs font-bold text-slate-300">
                HRV Baseline: {telemetry?.hrv ?? 0} ms
              </p>
            </div>
          </div>

          {/* Progress Bar Envelope */}
          <div className="space-y-2">
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${readinessTheme.progressFill}`}
                style={{ width: `${Math.max(5, Math.min(100, readinessScore))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-300">
              <span>0 (Rest Required)</span>
              <span>60 (Moderate)</span>
              <span>80+ (Optimal Peak)</span>
            </div>
          </div>
        </div>

        {/* PANEL 2: Sleep Architecture Recharts Graph */}
        <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <Moon className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-slate-50">
                Sleep Architecture & Stages
              </h3>
            </div>
            <span className="text-xs font-bold text-indigo-300">
              Score: {telemetry.sleep?.sleepScore ?? 0}/100
            </span>
          </div>

          {/* Recharts Boundary Envelope: Strict h-[300px] min-h-[300px] (AGENTS.md Rule 3) */}
          <div className="h-[300px] min-h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fill: "#cbd5e1", fontWeight: "bold" }} />
                <YAxis stroke="#cbd5e1" tick={{ fill: "#cbd5e1", fontWeight: "bold" }} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontWeight: "bold",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "10px", fontWeight: "bold" }} />
                <Bar dataKey="Deep" fill="#6366f1" radius={[4, 4, 0, 0]} name="Deep Sleep (min)" />
                <Bar dataKey="REM" fill="#a855f7" radius={[4, 4, 0, 0]} name="REM Sleep (min)" />
                <Bar dataKey="Light" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Light Sleep (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PANEL 3: Biometric Micro-Trend Sparklines */}
      <div className="space-y-4 relative z-10" role="region" aria-label="Biometric Micro-Trend Sparklines">
        <h3 className="font-bold text-base text-slate-50 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Biometric Telemetry Micro-Trends
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Micro Card 1: Resting HR */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Resting HR</span>
              <span className={`text-xs font-extrabold ${(telemetry?.rhr ?? 0) > 100 ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                {(telemetry?.rhr ?? 0) > 100 ? "Tachycardic" : "Normal"}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-50">
              {telemetry?.rhr ?? 0} <span className="text-xs font-semibold text-slate-300">bpm</span>
            </div>
            <div className="h-10 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line type="monotone" dataKey="rhr" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Micro Card 2: HRV */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">HRV (rMSSD)</span>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">Good</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-50">
              {telemetry?.hrv ?? 0} <span className="text-xs font-semibold text-slate-300">ms</span>
            </div>
            <div className="h-10 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line type="monotone" dataKey="hrv" stroke="#a855f7" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Micro Card 3: SpO2 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Blood Oxygen (SpO2)</span>
              <span className={`text-xs font-extrabold ${(telemetry?.spo2 ?? 0) < 92 ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                {(telemetry?.spo2 ?? 0) < 92 ? "Hypoxic" : "Optimal"}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-50">
              {telemetry?.spo2 ?? 0}%
            </div>
            <div className="h-10 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line type="monotone" dataKey="spo2" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Micro Card 4: Daily Steps */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Daily Steps</span>
              <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300">Active</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-50">
              {(telemetry?.steps ?? 0).toLocaleString()}
            </div>
            <div className="h-10 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line type="monotone" dataKey="steps" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL 4: Recovery Warning Banners & Activity Filters */}
      <div className="space-y-4 relative z-10" role="region" aria-label="Recovery Warning Banners & Activity Filters">
        <h3 className="font-bold text-base text-slate-50 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Cross-Correlated Recovery Overrides & Exercise Restrictions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recovery Strain Overrides */}
          <div className="bg-amber-950/50 border border-amber-500/30 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Strain Reduction Overrides</span>
            </div>
            {correlation.recoveryOverrides && correlation.recoveryOverrides.length > 0 ? (
              correlation.recoveryOverrides.map((override, i) => (
                <div key={i} className="text-xs text-slate-200 font-semibold space-y-1">
                  <p className="font-bold text-slate-50">{override.reason}</p>
                  <p className="text-amber-300 font-bold">
                    Active Strain Override: -{override.strainReductionPercent}% intensity adjustment applied.
                  </p>
                  <p className="text-xs text-slate-200 font-semibold">
                    {override.evidence}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs font-bold text-slate-200">
                No active strain reduction overrides based on current bloodwork.
              </p>
            )}
          </div>

          {/* Diagnostic Imaging Activity Filters */}
          <div className="bg-indigo-950/50 border border-indigo-500/30 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Diagnostic Imaging Exercise Restrictions</span>
            </div>
            {correlation.activityFilters && correlation.activityFilters.length > 0 ? (
              correlation.activityFilters.map((filter, i) => (
                <div key={i} className="text-xs text-slate-200 font-semibold space-y-1">
                  <p className="font-bold text-indigo-200">
                    Target: {filter.anatomicalTarget}
                  </p>
                  <p className="text-rose-300">
                    <span className="font-bold">Restricted:</span> {filter.restrictedActivities.join(", ")}
                  </p>
                  <p className="text-emerald-300">
                    <span className="font-bold">Recommended:</span> {filter.recommendedActivities.join(", ")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs font-bold text-slate-200">
                No imaging-based spinal or joint exercise restrictions detected.
              </p>
            )}
          </div>
        </div>
      </div>

      <HealthConnectModal
        isOpen={activeHealthModal !== null}
        onClose={() => setActiveHealthModal(null)}
        provider={activeHealthModal || 'apple'}
        onSyncComplete={() => {
          setSyncState(getHealthSyncState(activeUserId));
          if (onSyncRequest) (onSyncRequest as any)();
        }}
      />
    </section>
  );
}
