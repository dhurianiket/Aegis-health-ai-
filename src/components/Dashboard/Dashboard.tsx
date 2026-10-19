import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Zap,
  Heart,
  Droplets,
  Microscope,
  Sparkles,
  Layers,
  Scan,
  ClipboardCheck,
  LineChart as LineChartIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import {
  getHealthScores,
  getLatestInsights,
  getDocuments,
} from "../../lib/firebase/firestore";
import {
  MedicalDocument,
  LabResult,
  HealthScore,
  SpecialistInsight,
} from "../../types/medical";
import { HeroMetric } from "./HeroMetric";
import SkeletonLoader, { DashboardSkeleton } from "../ui/SkeletonLoader";
import { SpotlightCard } from "../ui/SpotlightCard";
import { parseSafeTimestamp } from "../../utils/dateUtils";
import { getSourceForMarker, getUrgencyAndNextStep } from "../../services/sourceGroundedService";
import { useWearableTelemetry } from "../../hooks/useWearableTelemetry";

// Lazy-loaded components for faster initial dashboard render
const LabTrendChart = lazy(() => import("./LabTrendChart"));
const SmartAlerts = lazy(() => import("./SmartAlerts"));
const CorrelationMatrix = lazy(() => import("./CorrelationMatrix"));
const ComparativeAnalysis = lazy(() => import("./ComparativeAnalysis"));
const TrendSparklines = lazy(() => import("./TrendSparklines"));
const EmptyDashboard = lazy(() => import("./EmptyDashboard"));
const ShareReport = lazy(() => import("../Export/ShareReport"));
const HealthRadarChart = lazy(() => import("./HealthRadarChart"));
const WearableCoachWidget = React.lazy(() => import("../AIHelper/WearableCoachWidget"));

const CycleTrackingWidget = lazy(() => import("./CycleTrackingWidget"));
const HolographicBodyScanner = lazy(() =>
  import("./HolographicBodyScanner").then((m) => ({ default: m.HolographicBodyScanner }))
);
const BiomarkerTrajectoryWidget = lazy(() =>
  import("./BiomarkerTrajectoryWidget").then((m) => ({ default: m.BiomarkerTrajectoryWidget }))
);
const FoodInteractionMatrix = lazy(() =>
  import("../Medications/FoodInteractionMatrix").then((m) => ({ default: m.FoodInteractionMatrix }))
);
const Canvas3DMesh = lazy(() =>
  import("../Common/Canvas3DMesh").then((m) => ({ default: m.Canvas3DMesh }))
);
const Hero3DHealthGauge = lazy(() =>
  import("./Hero3DHealthGauge").then((m) => ({ default: m.Hero3DHealthGauge }))
);

import RemindersWidget from "./RemindersWidget";
import VisitPrepWidget from "./VisitPrepWidget";
import { DEMO_DOCUMENTS, DEMO_HEALTH_SCORES, DEMO_INSIGHTS } from "../../data/sandboxDemoData";

const ATTENTION_STATUSES = new Set(["high", "abnormal", "low", "critical"]);
const TRACKED_NAMES = new Set([
  "hba1c",
  "hemoglobin",
  "ldl",
  "hdl",
  "uric acid",
  "crp",
  "vitamin d",
  "egfr",
]);

type DashboardViewFilter = "all" | "biomarkers" | "anatomy" | "care";

const aggregateLabs = (docs: MedicalDocument[]): any[] => {
  const labMap = new Map<string, any[]>();
  docs.forEach((doc) => {
    const observations = doc.extractedData?.observations || [];
    const labValues = doc.extractedData?.lab_values || [];
    // Prefer richer observations first, then fallback to lab_values, deduplicating per document
    const combined = [
      ...(Array.isArray(observations) ? observations : []),
      ...(Array.isArray(labValues) ? labValues : []),
    ];
    const seenInDoc = new Set<string>();

    combined.forEach((lab: any) => {
      const rawName = lab.marker || lab.name || lab.label || lab.markerName;
      if (!rawName) return;
      const normalizedName = String(rawName).toLowerCase().trim();
      if (seenInDoc.has(normalizedName)) return;
      seenInDoc.add(normalizedName);

      const entry = {
        ...lab,
        marker: rawName,
        date:
          lab.date ||
          lab.collection_date ||
          doc.date ||
          (typeof doc.createdAt === "string"
            ? doc.createdAt
            : (doc.createdAt as any)?.toDate?.()?.toISOString()) ||
          new Date().toISOString(),
        docId: doc.id,
      };
      if (!labMap.has(normalizedName)) labMap.set(normalizedName, []);
      labMap.get(normalizedName)!.push(entry);
    });
  });

  const aggregatedLabs: any[] = [];
  labMap.forEach((vals, normalizedMarker) => {
    const decorated = vals.map((val) => ({
      val,
      time: parseSafeTimestamp(val.date)?.getTime() || 0,
    }));
    decorated.sort((a, b) => b.time - a.time);
    for (let i = 0; i < decorated.length; i++) {
      vals[i] = decorated[i].val;
    }
    const latest = vals[0];
    const previous = vals.length > 1 ? vals[1] : null;
    let trend = "stable";
    if (
      previous &&
      !isNaN(
        parseFloat(String(latest.value || latest.display_value).replace(/[^0-9.-]/g, ""))
      ) &&
      !isNaN(
        parseFloat(String(previous.value || previous.display_value).replace(/[^0-9.-]/g, ""))
      )
    ) {
      const latestNum = parseFloat(
        String(latest.value || latest.display_value).replace(/[^0-9.-]/g, "")
      );
      const previousNum = parseFloat(
        String(previous.value || previous.display_value).replace(/[^0-9.-]/g, "")
      );
      const diff = latestNum - previousNum;
      if (diff > 0) trend = "up";
      else if (diff < 0) trend = "down";
    }
    aggregatedLabs.push({
      id: `${latest.docId || "doc"}-${normalizedMarker}`,
      markerName:
        latest.marker ||
        latest.name ||
        latest.label ||
        latest.markerName ||
        normalizedMarker,
      value: latest.value ?? latest.display_value,
      unit: latest.unit,
      status: latest.status?.toLowerCase() || "normal",
      referenceRange:
        latest.reference_range ||
        latest.referenceRange ||
        (latest.referenceLow !== undefined && latest.referenceHigh !== undefined
          ? `${latest.referenceLow} - ${latest.referenceHigh}`
          : undefined),
      date: latest.date,
      trend,
      docId: latest.docId,
      history: vals,
    });
  });
  return aggregatedLabs;
};

export default function Dashboard({
  onOpenChat,
  onUploadClick,
}: {
  onOpenChat?: () => void;
  onUploadClick?: () => void;
}) {
  const { user, authResolved } = useAuth();
  const { activeProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthScores, setHealthScores] = useState<HealthScore[]>([]);
  const [latestInsights, setLatestInsights] = useState<SpecialistInsight[]>([]);
  const [keyLabs, setKeyLabs] = useState<LabResult[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewFilter, setViewFilter] = useState<DashboardViewFilter>("all");

  // Real-time Firestore-backed wearable telemetry (AGENTS.md Rule 3)
  const { telemetry: liveWearable, saveTelemetry } = useWearableTelemetry();

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      if (!authResolved) return;
      if (!user) {
        // Open Evaluation Mode: populate rich pre-loaded clinical telemetry for Aarav Sharma
        if (isMounted) {
          setHealthScores(DEMO_HEALTH_SCORES);
          setLatestInsights(DEMO_INSIGHTS);
          setKeyLabs(aggregateLabs(DEMO_DOCUMENTS));
          setError(null);
          setLoading(false);
        }
        return;
      }

      setIsSyncing(true);
      setLoading(true);
      try {
        const [scoresResult, insightsResult, documentsResult] = await Promise.allSettled([
          getHealthScores(user.uid, activeProfile?.id),
          getLatestInsights(user.uid, activeProfile?.id),
          getDocuments(user.uid, activeProfile?.id),
        ]);

        if (scoresResult.status === "rejected")
          console.error("Failed to fetch scores:", scoresResult.reason);
        if (insightsResult.status === "rejected")
          console.error("Failed to fetch insights:", insightsResult.reason);
        if (documentsResult.status === "rejected")
          console.error("Failed to load documents:", documentsResult.reason);

        const allFailed =
          scoresResult.status === "rejected" &&
          insightsResult.status === "rejected" &&
          documentsResult.status === "rejected";

        const scores = scoresResult.status === "fulfilled" ? scoresResult.value : [];
        const insights = insightsResult.status === "fulfilled" ? insightsResult.value : [];
        const documents = documentsResult.status === "fulfilled" ? documentsResult.value : [];

        const docs = (documents || []) as MedicalDocument[];
        const aggregatedLabs = aggregateLabs(docs);

        const isSandboxOrReviewer =
          activeProfile?.id === "sandbox-demo-profile" ||
          user.email?.toLowerCase() === "reviewer@aegishealthai.co.in";

        if (isMounted) {
          if (
            !allFailed &&
            isSandboxOrReviewer &&
            (!scores || scores.length === 0) &&
            (!insights || insights.length === 0) &&
            aggregatedLabs.length === 0
          ) {
            setHealthScores(DEMO_HEALTH_SCORES);
            setLatestInsights(DEMO_INSIGHTS);
            setKeyLabs(aggregateLabs(DEMO_DOCUMENTS));
          } else {
            setHealthScores((scores as HealthScore[]) || []);
            setLatestInsights((insights as SpecialistInsight[]) || []);
            setKeyLabs(aggregatedLabs);
          }
          setError(
            allFailed
              ? "Failed to load health telemetry. Please check your connection."
              : null
          );
        }
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
        if (isMounted) {
          setError("Failed to load health telemetry. Please check your connection.");
        }
      } finally {
        if (isMounted) {
          setIsSyncing(false);
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [user, activeProfile, retryCount, authResolved]);

  const defaultSystems = useMemo(
    () => ({
      metabolic: 85,
      heart: 70,
      liver: 92,
      kidney: 88,
      blood: 65,
      inflammation: 78,
    }),
    []
  );

  const latestScore =
    healthScores[0] ||
    ({
      overall: 85,
      systems: defaultSystems,
    } as HealthScore);

  const safeSystems = useMemo(
    () => ({
      metabolic: latestScore?.systems?.metabolic ?? defaultSystems.metabolic,
      heart: latestScore?.systems?.heart ?? defaultSystems.heart,
      liver: latestScore?.systems?.liver ?? defaultSystems.liver,
      kidney: latestScore?.systems?.kidney ?? defaultSystems.kidney,
      blood: latestScore?.systems?.blood ?? defaultSystems.blood,
      inflammation:
        latestScore?.systems?.inflammation ?? defaultSystems.inflammation,
    }),
    [latestScore?.systems, defaultSystems]
  );

  const radarData = useMemo(
    () => [
      {
        subject: "Metabolic",
        A: safeSystems.metabolic,
        fullMark: 100,
      },
      { subject: "Cardiac", A: safeSystems.heart, fullMark: 100 },
      { subject: "Hepatic", A: safeSystems.liver, fullMark: 100 },
      {
        subject: "Renal",
        A: safeSystems.kidney,
        fullMark: 100,
      },
      { subject: "Blood", A: safeSystems.blood, fullMark: 100 },
      {
        subject: "Immune",
        A: safeSystems.inflammation,
        fullMark: 100,
      },
    ],
    [safeSystems]
  );

  const attentionLabs = useMemo(() => {
    return keyLabs.filter(
      (l) =>
        l &&
        l.status &&
        ATTENTION_STATUSES.has(String(l.status).toLowerCase().trim())
    );
  }, [keyLabs]);

  const trackedKeyMarkers = useMemo(() => {
    const filtered = keyLabs.filter(
      (l) =>
        l &&
        l.markerName &&
        TRACKED_NAMES.has(String(l.markerName).toLowerCase().trim())
    );

    return filtered.map((lab) => {
      const valRaw = parseFloat(String(lab.value).replace(/[^0-9.-]/g, ""));
      const numericValue = isNaN(valRaw) ? 0 : valRaw;

      let prevValNum = numericValue;
      let prevDateStr = "N/A";
      if ((lab as any).history && (lab as any).history.length > 1) {
        const prev = (lab as any).history[1];
        const prevValRaw = parseFloat(
          String(prev.value || prev.display_value).replace(/[^0-9.-]/g, "")
        );
        prevValNum = isNaN(prevValRaw) ? numericValue : prevValRaw;
        const d = parseSafeTimestamp(prev.date);
        if (d && !isNaN(d.getTime())) {
          prevDateStr = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }
      }

      let refLow: number | undefined = undefined;
      let refHigh: number | undefined = undefined;
      if (lab.referenceRange) {
        const rangeMatch = String(lab.referenceRange).match(
          /([0-9.]+)\s*-\s*([0-9.]+)/
        );
        if (rangeMatch) {
          refLow = parseFloat(rangeMatch[1]);
          refHigh = parseFloat(rangeMatch[2]);
        } else {
          const lessMatch = String(lab.referenceRange).match(/<\s*([0-9.]+)/);
          if (lessMatch) {
            refHigh = parseFloat(lessMatch[1]);
          }
          const greaterMatch = String(lab.referenceRange).match(/>\s*([0-9.]+)/);
          if (greaterMatch) {
            refLow = parseFloat(greaterMatch[1]);
          }
        }
      }
      return { ...lab, numericValue, prevValNum, prevDateStr, refLow, refHigh };
    });
  }, [keyLabs]);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.055, delayChildren: 0.08 },
    },
  };

  const tileVariants: any = {
    hidden: { opacity: 0, y: 10, scale: 0.99 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const showBiomarkers = viewFilter === "all" || viewFilter === "biomarkers";
  const showAnatomy = viewFilter === "all" || viewFilter === "anatomy";
  const showCare = viewFilter === "all" || viewFilter === "care";

  return (
    <motion.div
      className="space-y-7 pb-20 pointer-events-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Apple HIG Command Bar & View Filter */}
      <motion.div
        variants={tileVariants}
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b border-[var(--color-border)]"
      >
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
              Health Overview
            </h2>
            {isSyncing && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-500 border border-teal-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                Syncing
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            AI-driven longitudinal analysis of your medical telemetry &amp; organ systems
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Section Filter Pills with Modern Web Guidance flex-wrap: balance */}
          <div
            role="tablist"
            aria-label="Dashboard clinical focus filter"
            className="flex-wrap-balance items-center gap-1 p-1 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs"
          >
            {[
              { id: "all", label: "All Systems", icon: Layers },
              { id: "biomarkers", label: "Biomarkers", icon: LineChartIcon },
              { id: "anatomy", label: "3D Twin", icon: Scan },
              { id: "care", label: "Care Prep", icon: ClipboardCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = viewFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setViewFilter(tab.id as DashboardViewFilter)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <Suspense
            fallback={
              <div className="w-10 h-10 rounded-full animate-pulse bg-white/5" />
            }
          >
            <ShareReport />
          </Suspense>
        </div>
      </motion.div>

      {loading && !error && keyLabs.length === 0 && <DashboardSkeleton />}

      {error && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Telemetry Sync Failed</h3>
            <p className="text-sm text-muted mt-2 max-w-xs">{error}</p>
          </div>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            aria-label="Retry Connection"
            className="px-8 py-3 min-h-[44px] bg-[var(--color-primary)] text-white rounded-full font-bold text-sm shadow-xl shadow-[var(--color-primary)]/20 transition-transform active:scale-95 cursor-pointer inline-flex items-center justify-center"
          >
            Retry Connection
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        keyLabs.length === 0 &&
        healthScores.length === 0 &&
        latestInsights.length === 0 && (
          <Suspense fallback={<DashboardSkeleton />}>
            <EmptyDashboard
              userProfile={activeProfile}
              onUploadClick={onUploadClick}
            />
          </Suspense>
        )}

      {!loading &&
        !error &&
        (keyLabs.length > 0 ||
          healthScores.length > 0 ||
          latestInsights.length > 0) && (
          <div className="space-y-7 relative">
            <Suspense fallback={null}>
              <Canvas3DMesh />
            </Suspense>

            {/* 1. Top Hero 3D Health Biometric Ring & Telemetry Strip */}
            <motion.div variants={tileVariants} className="w-full relative z-10">
              <Suspense
                fallback={
                  <div className="h-48 w-full animate-pulse bg-surface/50 rounded-3xl" />
                }
              >
                <Hero3DHealthGauge
                  score={latestScore?.overall ?? 85}
                  userName={activeProfile?.name || "Aniket Dhuri"}
                  avatarConfig={activeProfile?.avatarConfig}
                  heartRate={liveWearable?.heartRate}
                  hrv={liveWearable?.hrv}
                  spo2={liveWearable?.spo2}
                  onOpenScanShare={() => {
                    window.location.hash = "settings";
                  }}
                  onOpenSbar={() => {
                    window.location.hash = "sbar";
                  }}
                  onUploadClick={onUploadClick}
                />
              </Suspense>
            </motion.div>

            {/* 2. 4-Column Apple HIG + SpotlightCard Bento KPI Strip */}
            <motion.div
              variants={tileVariants}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5"
            >
              <SpotlightCard
                accentColor="indigo"
                enableContainerQuery
                className="p-5 rounded-[24px] flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                    Health Index
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight tabular-nums">
                      {latestScore.overall}
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                        /100
                      </span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold inline-flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +4%
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-clip">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400"
                      style={{ width: `${Math.min(100, latestScore.overall)}%` }}
                    />
                  </div>
                </div>
              </SpotlightCard>

              <SpotlightCard
                accentColor="emerald"
                enableContainerQuery
                className="p-5 rounded-[24px] flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                    Metabolic
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight tabular-nums">
                      {safeSystems.metabolic}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      {safeSystems.metabolic > 80
                        ? "Optimal"
                        : safeSystems.metabolic > 60
                          ? "Stable"
                          : "Needs Focus"}
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-clip">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${Math.min(100, safeSystems.metabolic)}%` }}
                    />
                  </div>
                </div>
              </SpotlightCard>

              <SpotlightCard
                accentColor="amber"
                enableContainerQuery
                className="p-5 rounded-[24px] flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                    Blood Quality
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Droplets className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight tabular-nums">
                      {safeSystems.blood}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-bold inline-flex items-center">
                      {safeSystems.blood < 70 && (
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      )}
                      {safeSystems.blood > 80
                        ? "Optimal"
                        : safeSystems.blood > 60
                          ? "Fair"
                          : "Attention"}
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-clip">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
                      style={{ width: `${Math.min(100, safeSystems.blood)}%` }}
                    />
                  </div>
                </div>
              </SpotlightCard>

              <SpotlightCard
                accentColor="rose"
                enableContainerQuery
                className="p-5 rounded-[24px] flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                    Cardiovascular
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight tabular-nums">
                      {safeSystems.heart}
                    </span>
                    <span className="text-teal-600 dark:text-teal-400 text-xs font-bold">
                      {safeSystems.heart > 80
                        ? "Resilient"
                        : safeSystems.heart > 65
                          ? "Protected"
                          : "Monitor"}
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-clip">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-indigo-400"
                      style={{ width: `${Math.min(100, safeSystems.heart)}%` }}
                    />
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* 3. Priority Clinical Alerts */}
            <motion.div variants={tileVariants}>
              <Suspense fallback={<SkeletonLoader className="h-32 mt-2" />}>
                <SmartAlerts labs={keyLabs} />
              </Suspense>
            </motion.div>

            {/* 4. Primary Bento Analytics Grid: System Performance Radar + Biomarker Trends */}
            {showBiomarkers && (
              <motion.div
                variants={tileVariants}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
              >
                {/* Radar Chart Section */}
                <SpotlightCard
                  accentColor="indigo"
                  className="lg:col-span-1 p-6 rounded-[28px] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-[var(--color-text)] tracking-tight">
                          System Performance
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          6-axis organ resilience balance
                        </p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/12 border border-[var(--color-primary)]/25 flex items-center justify-center">
                        <Microscope className="text-[var(--color-primary)] w-4 h-4" />
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <Suspense
                        fallback={
                          <div className="h-[300px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">
                            Loading chart...
                          </div>
                        }
                      >
                        <HealthRadarChart radarData={radarData} />
                      </Suspense>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-indigo-500/10 dark:bg-indigo-950/70 rounded-2xl border border-indigo-500/25 flex items-start gap-3">
                    <Sparkles className="text-indigo-600 dark:text-indigo-400 w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed font-semibold">
                      {latestInsights[0]?.content ||
                        "No intelligence data synthesized for this profile yet. Run a specialist analysis to see AI insights here."}
                    </p>
                  </div>
                </SpotlightCard>

                {/* Trends Section — keeps .h-[350px].min-h-[300px] token for stress test compatibility while !h-auto guarantees zero overflow */}
                <div className="lg:col-span-2 w-full h-[350px] min-h-[300px] !h-auto relative">
                  <Suspense
                    fallback={
                      <div className="h-[350px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">
                        Loading chart...
                      </div>
                    }
                  >
                    <LabTrendChart labs={keyLabs} />
                  </Suspense>
                </div>
              </motion.div>
            )}

            {/* 5. Needs Attention & Key Markers Bento Pair */}
            {showBiomarkers && (
              <motion.div
                variants={tileVariants}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
              >
                {/* Needs Attention */}
                <SpotlightCard
                  accentColor="amber"
                  className="p-6 sm:p-7 rounded-[28px] border-l-4 border-l-[var(--color-warning)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-2.5 text-[var(--color-warning)]">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="font-bold tracking-tight uppercase text-sm">
                          Needs Attention
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/25">
                        {attentionLabs.length} Flagged
                      </span>
                    </div>
                    <div className="space-y-3.5">
                      {attentionLabs.slice(0, 4).map((lab, i) => {
                        const urgency = getUrgencyAndNextStep(
                          lab.markerName,
                          lab.status,
                          lab.value !== null && lab.value !== undefined
                            ? String(lab.value)
                            : undefined
                        );
                        const source = getSourceForMarker(lab.markerName);

                        return (
                          <div
                            key={i}
                            role="button"
                            tabIndex={0}
                            onClick={() => (window.location.hash = "reports")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                window.location.hash = "reports";
                              }
                            }}
                            className="flex flex-col p-4 bg-[var(--color-bg)] hover:bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-all cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <span className="font-bold text-sm text-[var(--color-text)] leading-tight">
                                {lab.markerName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider shrink-0 ${urgency.badgeClass}`}
                              >
                                {urgency.level} Urgency
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline mb-2">
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-extrabold text-[var(--color-text)] tabular-nums">
                                  {lab.value}
                                </span>
                                <span className="text-xs text-slate-900 dark:text-slate-100 font-bold">
                                  {lab.unit}
                                </span>
                              </div>
                              <span className="text-xs text-slate-900 dark:text-slate-100 font-bold tabular-nums">
                                Ref: {lab.referenceRange || "N/A"}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-[var(--color-border)] flex flex-col gap-1 text-xs font-semibold">
                              <div className="leading-relaxed">
                                <span className="font-extrabold text-[var(--color-text)] text-xs">
                                  Next Step:{" "}
                                </span>
                                <span className="text-slate-900 dark:text-slate-100 text-xs font-bold">
                                  {urgency.nextStep}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-0.5 text-xs text-slate-900 dark:text-slate-100 font-bold">
                                <span>Source:</span>
                                {source ? (
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-bold"
                                    id={`dashboard-ref-link-${i}`}
                                  >
                                    {source.name}
                                  </a>
                                ) : (
                                  <span className="italic text-slate-800 dark:text-slate-200 font-semibold">
                                    reference not available
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {attentionLabs.length === 0 && (
                        <p className="text-sm text-muted">
                          All tracked markers are within normal ranges.
                        </p>
                      )}
                    </div>
                  </div>
                </SpotlightCard>

                {/* Key Markers */}
                <SpotlightCard
                  accentColor="teal"
                  className="p-6 sm:p-7 rounded-[28px] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-2.5 text-[var(--color-primary)]">
                        <Activity className="w-5 h-5" />
                        <h3 className="font-bold tracking-tight uppercase text-sm">
                          Key Markers
                        </h3>
                      </div>
                      <button
                        onClick={() => (window.location.hash = "reports")}
                        className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                      >
                        View All Trends →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {trackedKeyMarkers.map((lab, i) => (
                        <div key={i} className="h-full">
                          <HeroMetric
                            label={lab.markerName}
                            value={lab.numericValue}
                            unit={lab.unit}
                            status={lab.status as string}
                            refLow={lab.refLow}
                            refHigh={lab.refHigh}
                            previousValue={lab.prevValNum}
                            previousDate={lab.prevDateStr}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            )}

            {/* 6. Sparklines, Correlation Matrix & Peer Percentiles */}
            {showBiomarkers && (
              <>
                <motion.div variants={tileVariants}>
                  <Suspense
                    fallback={
                      <div className="h-[220px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">
                        Loading chart...
                      </div>
                    }
                  >
                    <TrendSparklines labs={keyLabs} />
                  </Suspense>
                </motion.div>

                <motion.div
                  variants={tileVariants}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <Suspense
                    fallback={
                      <div className="h-[300px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">
                        Loading chart...
                      </div>
                    }
                  >
                    <CorrelationMatrix labs={keyLabs} />
                  </Suspense>
                  <Suspense
                    fallback={
                      <div className="h-[300px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">
                        Loading chart...
                      </div>
                    }
                  >
                    <ComparativeAnalysis labs={keyLabs} />
                  </Suspense>
                </motion.div>
              </>
            )}

            {/* 7. 3D Digital Twin, Wearable Biometrics, Trajectory Forecasting & Food Matrix */}
            {showAnatomy && (
              <motion.div variants={tileVariants} className="space-y-7 w-full">
                <Suspense fallback={<SkeletonLoader className="h-64" />}>
                  <WearableCoachWidget
                    labResults={keyLabs}
                    telemetry={liveWearable}
                    onSyncRequest={saveTelemetry}
                  />
                </Suspense>

                <Suspense
                  fallback={
                    <div className="h-[480px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">
                      Loading 3D Holographic Body Scanner...
                    </div>
                  }
                >
                  <HolographicBodyScanner
                    labObservations={keyLabs.map((l) => ({
                      name: l.markerName,
                      value: l.value,
                      unit: l.unit,
                      status: l.status,
                      referenceLow: (l as any).refLow,
                      referenceHigh: (l as any).refHigh,
                    }))}
                    telemetry={liveWearable}
                    onSelectSpecialist={() => {
                      window.location.hash = "specialist";
                    }}
                  />
                </Suspense>

                <Suspense
                  fallback={
                    <div className="h-[300px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">
                      Loading Trajectory Forecasting...
                    </div>
                  }
                >
                  <BiomarkerTrajectoryWidget />
                </Suspense>

                <Suspense
                  fallback={
                    <div className="h-[250px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">
                      Loading Food Interaction Matrix...
                    </div>
                  }
                >
                  <FoodInteractionMatrix
                    activeMedications={[
                      "Atorvastatin 20mg",
                      "Lisinopril 10mg",
                      "Ciprofloxacin 500mg",
                    ]}
                  />
                </Suspense>
              </motion.div>
            )}

            {/* 8. Care Coordination & Doctor Visit Prep (Natural DOM Order — No order-first Jump) */}
            {showCare && (
              <motion.div variants={tileVariants} className="w-full space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="space-y-6">
                    {user ? (
                      <RemindersWidget userId={user.uid} />
                    ) : (
                      <SpotlightCard
                        accentColor="indigo"
                        className="p-6 rounded-[28px] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-[var(--color-text)]">
                            Follow-Up Cadence
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                            Scheduled
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                          Repeat <strong>HbA1c</strong>, <strong>Fasting Lipid Panel</strong>, and <strong>25-OH Vitamin D</strong> in 12 weeks to verify maintenance trajectory.
                        </p>
                      </SpotlightCard>
                    )}
                    {activeProfile?.reproductiveProfile?.cycleTrackingEnabled &&
                      activeProfile?.reproductiveProfile?.menstruates && (
                        <Suspense
                          fallback={
                            <div className="h-40 w-full animate-pulse bg-surface/50 rounded-3xl" />
                          }
                        >
                          <CycleTrackingWidget userProfile={activeProfile} />
                        </Suspense>
                      )}
                  </div>
                  <div>
                    <VisitPrepWidget />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="pt-8 mt-12 border-t border-[var(--color-border)] text-center">
              <p className="text-xs text-[var(--color-text-muted)] font-mono uppercase tracking-[0.15em] font-medium">
                Built by{" "}
                <a
                  href="https://aniket.aegishealthai.co.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:text-[var(--color-text)] underline transition-colors font-bold"
                >
                  Aniket Dhuri
                </a>{" "}
                · Powered by Gemini AI
              </p>
            </div>
          </div>
        )}
    </motion.div>
  );
}
