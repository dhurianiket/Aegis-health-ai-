import React, { useState, useMemo } from "react";
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
import { generateMockTelemetry } from "../../services/wearableService";

export interface WearableCoachWidgetProps {
  telemetry?: WearableBiometrics;
  correlation?: BiometricDiagnosticCorrelation;
  labResults?: LabResult[];
  imagingFindings?: string[] | MedicalDocument[];
  onActionClick?: (action: string) => void;
}

export default function WearableCoachWidget({
  telemetry: initialTelemetry,
  correlation: initialCorrelation,
  labResults = [],
  imagingFindings = [],
  onActionClick,
}: WearableCoachWidgetProps) {
  // Use state to allow mock toggles/updates if interactive
  const [telemetry, setTelemetry] = useState<WearableBiometrics>(
    () => initialTelemetry || generateMockTelemetry("demo_user")
  );
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});

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

  const toggleMockScenario = (scenario: "normal" | "tachycardia" | "hypoxia") => {
    if (scenario === "normal") {
      setTelemetry(generateMockTelemetry("demo_user", { rhr: 64, spo2: 98 }));
    } else if (scenario === "tachycardia") {
      setTelemetry(generateMockTelemetry("demo_user", { rhr: 108, heartRate: 112 }));
    } else if (scenario === "hypoxia") {
      setTelemetry(generateMockTelemetry("demo_user", { spo2: 89 }));
    }
  };

  return (
    <section
      role="region"
      aria-label="AI Health Coach & Wearable Telemetry Widget"
      className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 md:p-8 rounded-[36px] shadow-lg dark:shadow-2xl space-y-8 pointer-events-auto"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              AI Health Coach Fusion & Biometrics
            </h2>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
            Real-time wearable telemetry cross-correlated with lab panels & diagnostic imaging
          </p>
        </div>

        {/* Diagnostic Scenario Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleMockScenario("normal")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Normal
          </button>
          <button
            onClick={() => toggleMockScenario("tachycardia")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-500/30 transition-colors"
          >
            Tachycardia Demo
          </button>
          <button
            onClick={() => toggleMockScenario("hypoxia")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            Hypoxia Demo
          </button>
        </div>
      </div>

      {/* PANEL 5: Clinical Triage Safety Alerts (Top priority when active) */}
      {correlation.safetyAlerts && correlation.safetyAlerts.length > 0 && (
        <div className="space-y-3" role="region" aria-label="Clinical Triage Safety Alerts">
          {correlation.safetyAlerts.map((triageAlert, index) => {
            if (dismissedAlerts[triageAlert.metric]) return null;
            return (
              <div
                key={index}
                className="bg-rose-500/10 dark:bg-rose-950/60 border-2 border-rose-500/40 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-7 h-7 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-600 text-white">
                        {triageAlert.severity} Safety Alert
                      </span>
                      <span className="text-xs font-bold text-rose-800 dark:text-rose-200">
                        {triageAlert.source}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
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
                    className="flex-1 md:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95"
                  >
                    Rest Immediately & Contact Care Team
                  </button>
                  <button
                    onClick={() =>
                      setDismissedAlerts((prev) => ({ ...prev, [triageAlert.metric]: true }))
                    }
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: Daily Readiness Target & Composite Score */}
        <div className="bg-[var(--color-bg)]/80 p-6 rounded-3xl border border-[var(--color-border)] flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
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
              <span className="text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {readinessScore}
              </span>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-300 ml-1">
                /100
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sleep Contribution: {Math.round(((telemetry.sleep?.sleepScore ?? 80) / 100) * 35)}/35 pts
              </p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                HRV Baseline: {telemetry?.hrv ?? 0} ms
              </p>
            </div>
          </div>

          {/* Progress Bar Envelope */}
          <div className="space-y-2">
            <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${readinessTheme.progressFill}`}
                style={{ width: `${Math.max(5, Math.min(100, readinessScore))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>0 (Rest Required)</span>
              <span>60 (Moderate)</span>
              <span>80+ (Optimal Peak)</span>
            </div>
          </div>
        </div>

        {/* PANEL 2: Sleep Architecture Recharts Graph */}
        <div className="bg-[var(--color-bg)]/80 p-6 rounded-3xl border border-[var(--color-border)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <Moon className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Sleep Architecture & Stages
              </h3>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Score: {telemetry.sleep?.sleepScore ?? 0}/100
            </span>
          </div>

          {/* Recharts Boundary Envelope: Strict h-[300px] min-h-[300px] (AGENTS.md Rule 3) */}
          <div className="h-[300px] min-h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b", fontWeight: "bold" }} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontWeight: "bold" }} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
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
      <div className="space-y-4" role="region" aria-label="Biometric Micro-Trend Sparklines">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-500" />
          Biometric Telemetry Micro-Trends
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Micro Card 1: Resting HR */}
          <div className="bg-[var(--color-bg)] p-4 rounded-2xl border border-[var(--color-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Resting HR</span>
              <span className={`text-xs font-extrabold ${(telemetry?.rhr ?? 0) > 100 ? "text-rose-500" : "text-emerald-500"}`}>
                {(telemetry?.rhr ?? 0) > 100 ? "Tachycardic" : "Normal"}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {telemetry?.rhr ?? 0} <span className="text-xs font-normal">bpm</span>
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
          <div className="bg-[var(--color-bg)] p-4 rounded-2xl border border-[var(--color-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">HRV (rMSSD)</span>
              <span className="text-xs font-extrabold text-emerald-500">Good</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {telemetry?.hrv ?? 0} <span className="text-xs font-normal">ms</span>
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
          <div className="bg-[var(--color-bg)] p-4 rounded-2xl border border-[var(--color-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Blood Oxygen (SpO2)</span>
              <span className={`text-xs font-extrabold ${(telemetry?.spo2 ?? 0) < 92 ? "text-rose-500" : "text-emerald-500"}`}>
                {(telemetry?.spo2 ?? 0) < 92 ? "Hypoxic" : "Optimal"}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
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
          <div className="bg-[var(--color-bg)] p-4 rounded-2xl border border-[var(--color-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Daily Steps</span>
              <span className="text-xs font-extrabold text-cyan-500">Active</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
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
      <div className="space-y-4" role="region" aria-label="Recovery Warning Banners & Activity Filters">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Cross-Correlated Recovery Overrides & Exercise Restrictions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recovery Strain Overrides */}
          <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Strain Reduction Overrides</span>
            </div>
            {correlation.recoveryOverrides && correlation.recoveryOverrides.length > 0 ? (
              correlation.recoveryOverrides.map((override, i) => (
                <div key={i} className="text-xs text-slate-900 dark:text-slate-100 font-semibold space-y-1">
                  <p className="font-bold">{override.reason}</p>
                  <p className="text-amber-800 dark:text-amber-200">
                    Active Strain Override: -{override.strainReductionPercent}% intensity adjustment applied.
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    {override.evidence}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No active strain reduction overrides based on current bloodwork.
              </p>
            )}
          </div>

          {/* Diagnostic Imaging Activity Filters */}
          <div className="bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/30 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Diagnostic Imaging Exercise Restrictions</span>
            </div>
            {correlation.activityFilters && correlation.activityFilters.length > 0 ? (
              correlation.activityFilters.map((filter, i) => (
                <div key={i} className="text-xs text-slate-900 dark:text-slate-100 font-semibold space-y-1">
                  <p className="font-bold text-indigo-900 dark:text-indigo-200">
                    Target: {filter.anatomicalTarget}
                  </p>
                  <p className="text-rose-700 dark:text-rose-300">
                    <span className="font-bold">Restricted:</span> {filter.restrictedActivities.join(", ")}
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    <span className="font-bold">Recommended:</span> {filter.recommendedActivities.join(", ")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No imaging-based spinal or joint exercise restrictions detected.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
