import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
  Heart,
  Droplets,
  Microscope,
  Stethoscope,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import {
  getHealthScores,
  getLatestInsights,
  getLabHistory,
  getDocuments,
} from "../../lib/firebase/firestore";
import {
  Specialty,
  MedicalDocument,
  LabResult,
  Medication,
  UserProfile,
  HealthScore,
  SpecialistInsight,
} from "../../types/medical";
import { HeroMetric } from "./HeroMetric";
import SkeletonLoader, { DashboardSkeleton } from "../ui/SkeletonLoader";
import { Sparkles, MessageSquare } from "lucide-react";
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
const WearableCoachWidget = React.lazy(() => import('../AIHelper/WearableCoachWidget'));

const CycleTrackingWidget = lazy(() => import("./CycleTrackingWidget"));

/**
 * Dashboard - The primary clinical analytics view.
 *
 * Aggregates health scores, latest AI-synthesized insights, and key laboratory data
 * into a high-density, interactive interface.
 *
 * @component
 * @example
 * return (
 *   <Dashboard onOpenChat={() => {}} />
 * )
 */
import RemindersWidget from "./RemindersWidget";
import FeedbackWidget from "./FeedbackWidget";
import VisitPrepWidget from "./VisitPrepWidget";

const aggregateLabs = (docs: MedicalDocument[]): any[] => {
  const labMap = new Map<string, any[]>();
  docs.forEach(doc => {
    const labValues = doc.extractedData?.lab_values || [];
    const observations = doc.extractedData?.observations || [];
    const allExtractedLabs = [...(Array.isArray(labValues) ? labValues : []), ...(Array.isArray(observations) ? observations : [])];

    allExtractedLabs.forEach((lab: any) => {
       const rawName = lab.marker || lab.name || lab.label || lab.markerName;
       if (!rawName) return;
       const normalizedName = rawName.toLowerCase().trim();
       
       const entry = {
          ...lab,
          marker: rawName,
          date: lab.date || lab.collection_date || doc.date || (typeof doc.createdAt === 'string' ? doc.createdAt : (doc.createdAt as any)?.toDate?.()?.toISOString()) || new Date().toISOString(),
          docId: doc.id
       };
       if (!labMap.has(normalizedName)) labMap.set(normalizedName, []);
       labMap.get(normalizedName)!.push(entry);
    });
  });
  
  const aggregatedLabs: any[] = [];
  labMap.forEach((vals, normalizedMarker) => {
     const decorated = vals.map(val => ({
       val,
       time: parseSafeTimestamp(val.date)?.getTime() || 0
     }));
     decorated.sort((a, b) => b.time - a.time);
     for (let i = 0; i < decorated.length; i++) {
       vals[i] = decorated[i].val;
     }
     const latest = vals[0];
     const previous = vals.length > 1 ? vals[1] : null;
     let trend = 'stable';
     if (previous && !isNaN(parseFloat(String(latest.value || latest.display_value).replace(/[^0-9.-]/g, ''))) && !isNaN(parseFloat(String(previous.value || previous.display_value).replace(/[^0-9.-]/g, '')))) {
        const latestNum = parseFloat(String(latest.value || latest.display_value).replace(/[^0-9.-]/g, ''));
        const previousNum = parseFloat(String(previous.value || previous.display_value).replace(/[^0-9.-]/g, ''));
        const diff = latestNum - previousNum;
        if (diff > 0) trend = 'up';
        else if (diff < 0) trend = 'down';
     }
     aggregatedLabs.push({
        markerName: latest.marker || latest.name || latest.label || latest.markerName || normalizedMarker,
        value: latest.value || latest.display_value,
        unit: latest.unit,
        status: latest.status?.toLowerCase() || 'normal',
        referenceRange: latest.reference_range || latest.referenceRange,
        date: latest.date,
        trend,
        docId: latest.docId,
        history: vals
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
  const [loading, setLoading] = useState(true); // change from false to true
  const [error, setError] = useState<string | null>(null);
  const [healthScores, setHealthScores] = useState<HealthScore[]>([]);
  const [latestInsights, setLatestInsights] = useState<SpecialistInsight[]>([]);
  const [keyLabs, setKeyLabs] = useState<LabResult[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Real-time Firestore-backed wearable telemetry (AGENTS.md Rule 3)
  const { telemetry: liveWearable, saveTelemetry } = useWearableTelemetry();

  const [retryCount, setRetryCount] = useState(0);

  const safeFormatDate = (d: any) => {
    if (!d) return "N/A";
    const dateObj = parseSafeTimestamp(d);
    return !dateObj || isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleDateString();
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      if (!authResolved) return;
      if (!user) {
        setLoading(false);
        setIsSyncing(false);
        return;
      }
      
      setIsSyncing(true);
      setLoading(true);
      try {
        // Fetch in parallel, but handle rejections individually so one failure doesn't block the rest
        const [scoresResult, insightsResult, documentsResult] = await Promise.allSettled([
          getHealthScores(user.uid, activeProfile?.id),
          getLatestInsights(user.uid, activeProfile?.id),
          getDocuments(user.uid, activeProfile?.id),
        ]);
        
        if (scoresResult.status === 'rejected') console.error("Failed to fetch scores:", scoresResult.reason);
        if (insightsResult.status === 'rejected') console.error("Failed to fetch insights:", insightsResult.reason);
        if (documentsResult.status === 'rejected') console.error("Failed to load documents:", documentsResult.reason);
        
        const allFailed = scoresResult.status === 'rejected' && insightsResult.status === 'rejected' && documentsResult.status === 'rejected';
        
        const scores = scoresResult.status === 'fulfilled' ? scoresResult.value : [];
        const insights = insightsResult.status === 'fulfilled' ? insightsResult.value : [];
        const documents = documentsResult.status === 'fulfilled' ? documentsResult.value : [];
        
        const docs = (documents || []) as MedicalDocument[];
        const aggregatedLabs = aggregateLabs(docs);
        
        if (isMounted) {
          setHealthScores((scores as HealthScore[]) || []);
          setLatestInsights((insights as SpecialistInsight[]) || []);
          setKeyLabs(aggregatedLabs);
          setError(allFailed ? "Failed to load health telemetry. Please check your connection." : null);
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
    return () => { isMounted = false; };
  }, [user, activeProfile, retryCount, authResolved]);

  const defaultSystems = useMemo(() => ({
    metabolic: 85,
    heart: 70,
    liver: 92,
    kidney: 88,
    blood: 65,
    inflammation: 78,
  }), []);

  const latestScore =
    healthScores[0] ||
    ({
      overall: 85,
      systems: defaultSystems,
    } as HealthScore);

  const safeSystems = useMemo(() => ({
    metabolic: latestScore?.systems?.metabolic ?? defaultSystems.metabolic,
    heart: latestScore?.systems?.heart ?? defaultSystems.heart,
    liver: latestScore?.systems?.liver ?? defaultSystems.liver,
    kidney: latestScore?.systems?.kidney ?? defaultSystems.kidney,
    blood: latestScore?.systems?.blood ?? defaultSystems.blood,
    inflammation: latestScore?.systems?.inflammation ?? defaultSystems.inflammation,
  }), [latestScore?.systems, defaultSystems]);

  const radarData = useMemo(
    () => [
      { subject: "Metabolic", A: safeSystems.metabolic, fullMark: 100 },
      { subject: "Heart Risk", A: safeSystems.heart, fullMark: 100 },
      { subject: "Liver Health", A: safeSystems.liver, fullMark: 100 },
      {
        subject: "Kidney Health",
        A: safeSystems.kidney,
        fullMark: 100,
      },
      { subject: "Blood Health", A: safeSystems.blood, fullMark: 100 },
      {
        subject: "Inflammation",
        A: safeSystems.inflammation,
        fullMark: 100,
      },
    ],
    [safeSystems],
  );

  const attentionLabs = useMemo(() => {
    return keyLabs.filter(l => l && l.status && ['high', 'abnormal', 'low', 'critical'].includes(String(l.status).toLowerCase().trim()));
  }, [keyLabs]);

  const trackedKeyMarkers = useMemo(() => {
    const trackedNames = ['hba1c', 'hemoglobin', 'ldl', 'hdl', 'uric acid', 'crp', 'vitamin d', 'egfr'];
    return keyLabs.filter(l => l && l.markerName && trackedNames.includes(String(l.markerName).toLowerCase().trim()));
  }, [keyLabs]);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.065, delayChildren: 0.1 },
    },
  };

  const tileVariants: any = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      className="space-y-8 pb-20 pointer-events-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={tileVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2"
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            Health Overview
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            AI-driven analysis of your medical telemetry
          </p>
        </div>
        <Suspense fallback={<div className="w-10 h-10 rounded-full animate-pulse bg-white/5" />}>
          <ShareReport />
        </Suspense>
      </motion.div>

      {loading && !error && keyLabs.length === 0 && (
        <DashboardSkeleton />
      )}

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
            onClick={() => setRetryCount(c => c + 1)}
            className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-full font-bold text-sm shadow-xl shadow-[var(--color-primary)]/20 transition-transform active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      )}

      {!loading && !error && keyLabs.length === 0 && healthScores.length === 0 && latestInsights.length === 0 && (
        <Suspense fallback={<DashboardSkeleton />}>
          <EmptyDashboard userProfile={activeProfile} onUploadClick={onUploadClick} />
        </Suspense>
      )}

      {!loading && !error && (keyLabs.length > 0 || healthScores.length > 0 || latestInsights.length > 0) && (
        <div className="flex flex-col lg:flex-none">
          <motion.div variants={tileVariants} className="order-first lg:order-none w-full mb-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-6">
                 {user && <RemindersWidget userId={user.uid} />}
                 {activeProfile?.reproductiveProfile?.cycleTrackingEnabled && activeProfile?.reproductiveProfile?.menstruates && (
                    <Suspense fallback={<div className="h-40 w-full animate-pulse bg-surface/50 rounded-3xl" />}>
                      <CycleTrackingWidget userProfile={activeProfile} />
                    </Suspense>
                 )}
               </div>
               <div>
                  <VisitPrepWidget />
               </div>
            </div>
          </motion.div>

          <motion.div variants={tileVariants}>
            <Suspense fallback={<SkeletonLoader className="h-64 mt-4" />}>
              <SmartAlerts labs={keyLabs} />
            </Suspense>
          </motion.div>

          <motion.div variants={tileVariants} className="mt-6 mb-6">
            <Suspense fallback={<SkeletonLoader className="h-64 mt-4" />}>
              <WearableCoachWidget
                labResults={keyLabs}
                telemetry={liveWearable ?? undefined}
                onSyncRequest={saveTelemetry}
              />
            </Suspense>
          </motion.div>

          {/* Top Banner Stats */}
      <motion.div
        variants={tileVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider mb-1">
              Health Index
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[var(--color-text)] tracking-tight">
                {latestScore.overall}
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-1">/100</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> +4%
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider mb-1">
              Metabolic
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[var(--color-text)] tracking-tight">
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
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Droplets className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider mb-1">
              Blood Quality
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[var(--color-text)] tracking-tight">
                {safeSystems.blood}
              </span>
              <span className="text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center">
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
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={tileVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Radar Chart Section */}
        <div className="lg:col-span-1 bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-[32px] shadow-md dark:shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-[var(--color-text)] tracking-tight">
              System Performance
            </h3>
            <Microscope className="text-[var(--color-primary)] w-5 h-5" />
          </div>
          <div className="h-[300px] w-full">
            <Suspense fallback={<div className="h-[300px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">Loading chart...</div>}>
              <HealthRadarChart radarData={radarData} />
            </Suspense>
          </div>
          <div className="mt-4 p-4 bg-indigo-500/10 dark:bg-indigo-950/50 rounded-2xl border border-indigo-500/20 flex items-start gap-4">
            <ShieldCheck className="text-indigo-600 dark:text-indigo-400 w-5 h-5 shrink-0" />
            <p className="text-xs text-indigo-950 dark:text-indigo-100 leading-relaxed font-semibold">
              {latestInsights[0]?.content ||
                "No intelligence data synthesized for this profile yet. Run a specialist analysis to see AI insights here."}
            </p>
          </div>
        </div>

        {/* Trends Section */}
        <div className="lg:col-span-2 w-full h-[350px] min-h-[300px] relative">
          <Suspense fallback={<div className="h-[300px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">Loading chart...</div>}>
            <LabTrendChart labs={keyLabs} />
          </Suspense>
        </div>
      </motion.div>

          <motion.div variants={tileVariants}>
            <Suspense fallback={<div className="h-[300px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">Loading chart...</div>}>
              <TrendSparklines labs={keyLabs} />
            </Suspense>
          </motion.div>

          <motion.div
            variants={tileVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
          >
        <Suspense fallback={<div className="h-[300px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">Loading chart...</div>}>
          <CorrelationMatrix labs={keyLabs} />
        </Suspense>
        <Suspense fallback={<div className="h-[300px] w-full animate-pulse bg-surface/50 rounded-3xl flex items-center justify-center text-muted">Loading chart...</div>}>
          <ComparativeAnalysis labs={keyLabs} />
        </Suspense>
      </motion.div>

          {/* Key Markers & Action Required */}
          <motion.div
            variants={tileVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Needs Attention */}
            <div className="bg-[var(--color-surface)] backdrop-blur-xl p-8 rounded-[40px] border border-[var(--color-border)] shadow-md dark:shadow-2xl border-l-4 border-l-[var(--color-warning)]">
              <div className="flex items-center gap-3 mb-6 text-[var(--color-warning)]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold tracking-tight uppercase text-sm">
                  Needs Attention
                </h3>
              </div>
              <div className="space-y-4">
                {attentionLabs.slice(0, 5).map((lab, i) => {
                  const urgency = getUrgencyAndNextStep(lab.markerName, lab.status, lab.value !== null && lab.value !== undefined ? String(lab.value) : undefined);
                  const source = getSourceForMarker(lab.markerName);

                  return (
                    <div key={i} onClick={() => window.location.hash = "reports"} className="flex flex-col p-4 bg-[var(--color-bg)] hover:bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-all cursor-pointer group">
                       <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="font-bold text-sm text-[var(--color-text)] leading-tight">{lab.markerName}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider shrink-0 ${urgency.badgeClass}`}>
                             {urgency.level} Urgency
                          </span>
                       </div>
                       <div className="flex justify-between items-baseline mb-2">
                          <div className="flex items-baseline gap-1">
                             <span className="text-xl font-extrabold text-[var(--color-text)]">{lab.value}</span>
                             <span className="text-xs text-slate-800 dark:text-slate-200 font-bold">{lab.unit}</span>
                          </div>
                          <span className="text-xs text-slate-800 dark:text-slate-200 font-bold">
                             Ref: {lab.referenceRange || 'N/A'}
                          </span>
                       </div>
                       <div className="mt-2 pt-2 border-t border-[var(--color-border)]/20 flex flex-col gap-1 text-xs font-medium">
                         <div className="leading-relaxed">
                           <span className="font-extrabold text-[var(--color-text)] text-xs">Next Step: </span>
                           <span className="text-slate-900 dark:text-slate-100 text-xs font-bold">{urgency.nextStep}</span>
                         </div>
                         <div className="flex items-center justify-between mt-1 text-xs text-slate-800 dark:text-slate-200 font-semibold">
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
                             <span className="italic text-slate-600 dark:text-slate-300 font-medium">reference not available</span>
                           )}
                         </div>
                       </div>
                    </div>
                  );
                })}
                {attentionLabs.length === 0 && (
                  <p className="text-sm text-muted">All tracked markers are within normal ranges.</p>
                )}
              </div>
            </div>

            {/* Key Markers */}
            <div className="bg-[var(--color-surface)] backdrop-blur-xl p-8 rounded-[40px] border border-[var(--color-border)] shadow-md dark:shadow-2xl">
               <div className="flex items-center gap-3 mb-6 text-[var(--color-primary)]">
                  <Activity className="w-5 h-5" />
                  <h3 className="font-bold tracking-tight uppercase text-sm">Key Markers</h3>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  {trackedKeyMarkers.map((lab, i) => {
                     const valRaw = parseFloat(String(lab.value).replace(/[^0-9.-]/g, ''));
                     const numericValue = isNaN(valRaw) ? 0 : valRaw;
                     
                     let prevValNum = numericValue;
                     let prevDateStr = "N/A";
                     if ((lab as any).history && (lab as any).history.length > 1) {
                         const prev = (lab as any).history[1];
                         const prevValRaw = parseFloat(String(prev.value || prev.display_value).replace(/[^0-9.-]/g, ''));
                         prevValNum = isNaN(prevValRaw) ? numericValue : prevValRaw;
                         const d = parseSafeTimestamp(prev.date);
                         if (d && !isNaN(d.getTime())) {
                             prevDateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                         }
                     }

                     let refLow: number | undefined = undefined;
                     let refHigh: number | undefined = undefined;
                     if (lab.referenceRange) {
                         const rangeMatch = String(lab.referenceRange).match(/([0-9.]+)\s*-\s*([0-9.]+)/);
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

                     return (
                     <div key={i} className="rounded-2xl border border-surface bg-surface/50 overflow-hidden [&_>_div]:p-4">
                        <HeroMetric
                           label={lab.markerName}
                           value={numericValue}
                           unit={lab.unit}
                           status={lab.status as string}
                           refLow={refLow}
                           refHigh={refHigh}
                           previousValue={prevValNum}
                           previousDate={prevDateStr}
                        />
                     </div>
                  )})}
               </div>
               <div className="mt-6 border-t border-surface pt-4 text-center">
                  <button onClick={() => window.location.hash = "reports"} className="text-xs font-semibold text-theme hover:underline">View All Trends →</button>
               </div>
            </div>
          </motion.div>

          <div className="pt-8 mt-12 border-t border-[var(--color-border)] text-center">
        <p className="text-xs text-[var(--color-text-muted)] font-mono uppercase tracking-[0.15em] font-medium">
          Built by <a href="https://aniket.aegishealthai.co.in/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:text-[var(--color-text)] underline transition-colors font-bold">Aniket Dhuri</a> · Powered by Gemini AI
        </p>
      </div>
        </div>
      )}
      <FeedbackWidget />
    </motion.div>
  );
}
