import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
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
import LabTrendChart from "./LabTrendChart";
import SmartAlerts from "./SmartAlerts";
import CorrelationMatrix from "./CorrelationMatrix";
import ComparativeAnalysis from "./ComparativeAnalysis";
import TrendSparklines from "./TrendSparklines";
import ShareReport from "../Export/ShareReport";
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
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [healthScores, setHealthScores] = useState<HealthScore[]>([]);
  const [latestInsights, setLatestInsights] = useState<SpecialistInsight[]>([]);
  const [keyLabs, setKeyLabs] = useState<LabResult[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [scores, insights, labs] = await Promise.all([
          getHealthScores(user.uid, activeProfile?.id),
          getLatestInsights(user.uid, activeProfile?.id),
          getLabHistory(user.uid, undefined, activeProfile?.id),
        ]);
        setHealthScores((scores as HealthScore[]) || []);
        setLatestInsights((insights as SpecialistInsight[]) || []);
        setKeyLabs((labs as LabResult[]) || []);
      } catch (error) {
        console.error("Dashboard fetch failed:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, activeProfile]);

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

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (
    keyLabs.length === 0 &&
    healthScores.length === 0 &&
    latestInsights.length === 0
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6"
      >
        <div className="w-20 h-20 rounded-3xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <Activity className="w-10 h-10 text-[var(--color-primary)]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">No reports yet</h2>
          <p className="text-sm text-white/50 max-w-xs">
            Upload your first lab report and Aegis will start tracking your
            health trends automatically.
          </p>
        </div>
        <button
          onClick={onUploadClick}
          className="px-6 py-3 rounded-full bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors duration-200"
        >
          Upload first report
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-8 pb-20"
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
        <ShareReport />
      </motion.div>
      <motion.div variants={tileVariants}>
        <SmartAlerts labs={keyLabs} />
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
          <LabTrendChart labs={keyLabs} />
        </div>
      </motion.div>

      <motion.div variants={tileVariants}>
        <TrendSparklines labs={keyLabs} />
      </motion.div>

      <motion.div
        variants={tileVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        <CorrelationMatrix labs={keyLabs} />
        <ComparativeAnalysis labs={keyLabs} />
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
                <MessageSquare className="w-4 h-4" /> Ask AURA AI
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
    </motion.div>
  );
}
