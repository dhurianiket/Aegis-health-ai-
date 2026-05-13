import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
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
import SkeletonLoader, { DashboardSkeleton } from "../ui/SkeletonLoader";
import { Sparkles, MessageSquare } from "lucide-react";

// Lazy-loaded components for faster initial dashboard render
const LabTrendChart = lazy(() => import("./LabTrendChart"));
const SmartAlerts = lazy(() => import("./SmartAlerts"));
const CorrelationMatrix = lazy(() => import("./CorrelationMatrix"));
const ComparativeAnalysis = lazy(() => import("./ComparativeAnalysis"));
const TrendSparklines = lazy(() => import("./TrendSparklines"));
const EmptyDashboard = lazy(() => import("./EmptyDashboard"));
const ShareReport = lazy(() => import("../Export/ShareReport"));

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

  const [retryCount, setRetryCount] = useState(0);

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
        // Fetch in parallel but don't block the whole UI if possible
        // We'll show partial data as it arrives or just show the layout
        const [scores, insights, labs] = await Promise.all([
          getHealthScores(user.uid, activeProfile?.id),
          getLatestInsights(user.uid, activeProfile?.id),
          getLabHistory(user.uid, undefined, activeProfile?.id),
        ]);
        
        if (isMounted) {
          setHealthScores((scores as HealthScore[]) || []);
          setLatestInsights((insights as SpecialistInsight[]) || []);
          setKeyLabs((labs as LabResult[]) || []);
          setError(null);
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

  const latestScore =
    healthScores[0] ||
    ({
      overall: 85,
      systems: {
        metabolic: 85,
        heart: 70,
        liver: 92,
        kidney: 88,
        blood: 65,
        inflammation: 78,
      },
    } as HealthScore);

  const radarData = useMemo(
    () => [
      { subject: "Metabolic", A: latestScore.systems.metabolic, fullMark: 100 },
      { subject: "Heart Risk", A: latestScore.systems.heart, fullMark: 100 },
      { subject: "Liver Health", A: latestScore.systems.liver, fullMark: 100 },
      {
        subject: "Kidney Health",
        A: latestScore.systems.kidney,
        fullMark: 100,
      },
      { subject: "Blood Health", A: latestScore.systems.blood, fullMark: 100 },
      {
        subject: "Inflammation",
        A: latestScore.systems.inflammation,
        fullMark: 100,
      },
    ],
    [latestScore.systems],
  );

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
        <>
          <motion.div variants={tileVariants}>
            <Suspense fallback={<SkeletonLoader className="h-64 mt-4" />}>
              <SmartAlerts labs={keyLabs} />
            </Suspense>
          </motion.div>

          {/* Top Banner Stats */}
      <motion.div
        variants={tileVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div
          whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.04)" }}
          className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-3xl shadow-2xl flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-widest mb-1">
              Health Index
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-[var(--color-text)]">
                {latestScore.overall}
                <span className="text-sm opacity-40 ml-1">/100</span>
              </span>
              <span className="text-emerald-400 text-xs font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +4%
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.04)" }}
          className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-3xl shadow-2xl flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-widest mb-1">
              Metabolic
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-[var(--color-text)]">
                {latestScore.systems.metabolic}
              </span>
              <span className="text-emerald-400 text-xs font-bold">
                {latestScore.systems.metabolic > 80
                  ? "Optimal"
                  : latestScore.systems.metabolic > 60
                    ? "Stable"
                    : "Needs Focus"}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.04)" }}
          className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-3xl shadow-2xl flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Droplets className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-widest mb-1">
              Blood Quality
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-[var(--color-text)]">
                {latestScore.systems.blood}
              </span>
              <span className="text-amber-400 text-xs font-bold flex items-center">
                {latestScore.systems.blood < 70 && (
                  <AlertTriangle className="w-3 h-3 mr-1" />
                )}
                {latestScore.systems.blood > 80
                  ? "Optimal"
                  : latestScore.systems.blood > 60
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
        <div className="lg:col-span-1 bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-[32px] shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-[var(--color-text)] tracking-tight">
              System Performance
            </h3>
            <Microscope className="text-slate-500 w-5 h-5" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 600 }}
                />
                <Radar
                  name="Health"
                  dataKey="A"
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-start gap-4">
            <ShieldCheck className="text-indigo-400 w-5 h-5 shrink-0" />
            <p className="text-xs text-indigo-100/80 leading-relaxed font-normal">
              {latestInsights[0]?.content ||
                "No intelligence data synthesized for this profile yet. Run a specialist analysis to see AI insights here."}
            </p>
          </div>
        </div>

        {/* Trends Section */}
        <div className="lg:col-span-2">
          <Suspense fallback={<SkeletonLoader className="h-[400px]" />}>
            <LabTrendChart labs={keyLabs} />
          </Suspense>
        </div>
      </motion.div>

      <motion.div variants={tileVariants}>
        <Suspense fallback={<SkeletonLoader className="h-64" />}>
          <TrendSparklines labs={keyLabs} />
        </Suspense>
      </motion.div>

      <motion.div
        variants={tileVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        <Suspense fallback={<SkeletonLoader className="h-[400px]" />}>
          <CorrelationMatrix labs={keyLabs} />
        </Suspense>
        <Suspense fallback={<SkeletonLoader className="h-[400px]" />}>
          <ComparativeAnalysis labs={keyLabs} />
        </Suspense>
      </motion.div>

      {/* Action Required & Intelligence Feed */}
      <motion.div
        variants={tileVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        <div className="bg-[var(--color-surface)] backdrop-blur-xl p-8 rounded-[40px] border border-[var(--color-border)] shadow-2xl border-l-4 border-l-[var(--color-warning)]">
          <div className="flex items-center gap-3 mb-6 text-[var(--color-warning)]">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold tracking-tight uppercase text-sm">
              Action Required
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[var(--color-bg)] hover:bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-all cursor-pointer group">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-[var(--color-warning)]">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--color-text)]">
                    Hematology Consultation
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] italic">
                    Discussion of low MCV/MCH patterns
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-warning)] group-hover:translate-x-1" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--color-bg)] hover:bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-all cursor-pointer group">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)]">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--color-text)]">
                    Follow-up Blood Panel
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] italic">
                    Scheduled: June 15, 2026
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-primary)]/10 p-8 rounded-[40px] text-[var(--color-text)] shadow-2xl overflow-hidden relative border border-[var(--color-border)]">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-6 h-6 text-[var(--color-primary)]" />
              <h3 className="font-bold text-lg uppercase tracking-tight">
                Intelligence Feed
              </h3>
            </div>
            <p className="text-[var(--color-text-muted)] leading-relaxed text-sm mb-8 font-light italic">
              "Your cardiovascular trajectory is highly positive. Lipid panel
              markers are nearing the 95th percentile for your age group after
              the recent dietary shift."
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onOpenChat}
                className="flex items-center gap-3 bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                <MessageSquare className="w-4 h-4" /> Ask Aura AI
              </button>
              <button className="flex items-center gap-3 bg-[var(--color-surface)] text-[var(--color-text)] px-6 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border border-[var(--color-border)]">
                View Roadmap <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[var(--color-primary)] rounded-full blur-[80px] opacity-[0.15]"></div>
          <div className="absolute right-12 top-12 w-32 h-32 bg-purple-400 rounded-full blur-[60px] opacity-10"></div>
        </div>
      </motion.div>

      <div className="pt-8 mt-12 border-t border-[var(--color-border)] opacity-40 text-center">
        <p className="text-[10px] text-[var(--color-text-faint)] font-mono uppercase tracking-[0.15em]">
          Built by <span className="text-[var(--color-text-muted)]">Aniket Dhuri</span> · Powered by Gemini AI
        </p>
      </div>
    </>
    )}
    </motion.div>
  );
}
