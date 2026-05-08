import React, { useState, useEffect, useMemo } from 'react';
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
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Heart,
  Droplets,
  Microscope,
  Stethoscope,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import LabTrendChart from './LabTrendChart';
import SmartAlerts from './SmartAlerts';
import CorrelationMatrix from './CorrelationMatrix';
import ComparativeAnalysis from './ComparativeAnalysis';
import TrendSparklines from './TrendSparklines';
import ShareReport from '../Export/ShareReport';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { getHealthScores, getLatestInsights, getLabHistory } from '../../lib/firebase/firestore';

export default function Dashboard() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [healthScores, setHealthScores] = useState<any[]>([]);
  const [latestInsights, setLatestInsights] = useState<any[]>([]);
  const [keyLabs, setKeyLabs] = useState<any[]>([]);

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
          getLabHistory(user.uid, undefined, activeProfile?.id)
        ]);
        setHealthScores(scores || []);
        setLatestInsights(insights || []);
        setKeyLabs(labs || []);
      } catch (error) {
        console.error('Dashboard fetch failed:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, activeProfile]);

  const latestScore = healthScores[0] || { overall: 85, systems: { metabolic: 85, heart: 70, liver: 92, kidney: 88, blood: 65, inflammation: 78 } };
  
  const radarData = useMemo(() => [
    { subject: 'Metabolic', A: latestScore.systems.metabolic, fullMark: 100 },
    { subject: 'Heart Risk', A: latestScore.systems.heart, fullMark: 100 },
    { subject: 'Liver Health', A: latestScore.systems.liver, fullMark: 100 },
    { subject: 'Kidney Health', A: latestScore.systems.kidney, fullMark: 100 },
    { subject: 'Blood Health', A: latestScore.systems.blood, fullMark: 100 },
    { subject: 'Inflammation', A: latestScore.systems.inflammation, fullMark: 100 },
  ], [latestScore.systems]);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 min-h-[60vh] gap-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
          />
          <Heart className="w-6 h-6 text-indigo-400 animate-pulse" />
        </div>
        <p className="text-sm font-medium text-slate-400 animate-pulse">Analyzing health telemetry...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8 pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Health Overview</h2>
          <p className="text-sm text-slate-400 mt-1">AI-driven analysis of your medical telemetry</p>
        </div>
        <ShareReport />
      </motion.div>

      <motion.div variants={itemVariants}>
        <SmartAlerts labs={keyLabs} />
      </motion.div>

      {/* Top Banner Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Health Index</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-white">{latestScore.overall}<span className="text-sm opacity-40 ml-1">/100</span></span>
              <span className="text-emerald-400 text-xs font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +4%
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Metabolic</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-white">{latestScore.systems.metabolic}</span>
              <span className="text-emerald-400 text-xs font-bold">
                {latestScore.systems.metabolic > 80 ? 'Optimal' : latestScore.systems.metabolic > 60 ? 'Stable' : 'Needs Focus'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Droplets className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Blood Quality</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-white">{latestScore.systems.blood}</span>
              <span className="text-amber-400 text-xs font-bold flex items-center">
                {latestScore.systems.blood < 70 && <AlertTriangle className="w-3 h-3 mr-1" />}
                {latestScore.systems.blood > 80 ? 'Optimal' : latestScore.systems.blood > 60 ? 'Fair' : 'Attention'}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Radar Chart Section */}
        <div className="lg:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-white tracking-tight">System Performance</h3>
            <Microscope className="text-slate-500 w-5 h-5" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }} />
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
              {latestInsights[0]?.content || "No intelligence data synthesized for this profile yet. Run a specialist analysis to see AI insights here."}
            </p>
          </div>
        </div>

        {/* Trends Section */}
        <div className="lg:col-span-2">
          <LabTrendChart labs={keyLabs} />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <TrendSparklines labs={keyLabs} />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CorrelationMatrix labs={keyLabs} />
        <ComparativeAnalysis labs={keyLabs} />
      </motion.div>

      {/* Action Required & Intelligence Feed */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl border-l-4 border-l-amber-500/50">
          <div className="flex items-center gap-3 mb-6 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold tracking-tight uppercase text-sm">Action Required</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all cursor-pointer group">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Hematology Consultation</p>
                  <p className="text-[10px] text-slate-500 italic">Discussion of low MCV/MCH patterns</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-500 group-hover:translate-x-1" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all cursor-pointer group">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Follow-up Blood Panel</p>
                  <p className="text-[10px] text-slate-500 italic">Scheduled: June 15, 2026</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-500/20 overflow-hidden relative border border-white/20">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-6 h-6 text-indigo-200" />
              <h3 className="font-bold text-lg uppercase tracking-tight">Intelligence Feed</h3>
            </div>
            <p className="text-indigo-100/90 leading-relaxed text-sm mb-8 font-light italic">
              "Your cardiovascular trajectory is highly positive. Lipid panel markers are nearing the 95th percentile for your age group after the recent dietary shift."
            </p>
            <button className="flex items-center gap-3 bg-white text-indigo-600 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
              View Strategy Roadmap <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-40"></div>
          <div className="absolute right-12 top-12 w-32 h-32 bg-purple-400 rounded-full blur-[60px] opacity-20"></div>
        </div>
      </motion.div>
    </motion.div>
  );
}
