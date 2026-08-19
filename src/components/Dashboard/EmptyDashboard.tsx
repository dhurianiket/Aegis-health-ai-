import React from "react";
import { motion } from "motion/react";
import { Activity, Upload, Pill, Target, ArrowRight, ShieldCheck, Zap, Droplets, ChartArea } from "lucide-react";
import { UserProfile } from "../../types/medical";

export default function EmptyDashboard({
  userProfile,
  onUploadClick,
}: {
  userProfile?: UserProfile | null;
  onUploadClick?: () => void;
}) {
  const firstName = userProfile?.name?.split(" ")[0] || "User";

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-8 md:p-10 rounded-[32px] shadow-md dark:shadow-2xl relative overflow-hidden"
      >
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest">
            <SparklesIcon className="w-4 h-4" /> Welcome
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-text)] leading-tight">
            Welcome to Aegis, {firstName}.<br />
            <span className="text-[var(--color-text-muted)]">Let's set up your health profile.</span>
          </h2>
          
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={onUploadClick} aria-label="Upload Report" className="flex flex-col items-start p-5 bg-[var(--color-bg)] hover:bg-[var(--color-primary)]/10 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 rounded-[20px] transition-all group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
              <Upload className="w-8 h-8 text-[var(--color-primary)] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-sm mb-1 text-[var(--color-text)]">Upload Report</h3>
              <p className="text-xs text-[var(--color-text-muted)]">PDFs or images of test results</p>
            </button>
            <button disabled aria-label="Complete Profile (Coming Soon)" className="flex flex-col items-start p-5 bg-[var(--color-bg)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[20px] transition-all group text-left cursor-not-allowed opacity-70">
              <Target className="w-8 h-8 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-sm mb-1 text-[var(--color-text)]">Complete Profile</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Add medical history & goals</p>
            </button>
            <button disabled aria-label="Try AURA AI (Unlock by uploading a report)" className="flex flex-col items-start p-5 bg-[var(--color-bg)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[20px] transition-all group text-left cursor-not-allowed opacity-70">
              <SparklesIcon className="w-8 h-8 text-indigo-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-sm mb-1 text-[var(--color-text)]">Try AURA AI</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Synthesize insights instantly</p>
            </button>
          </div>

          <div className="pt-4">
             <motion.button
                onClick={onUploadClick}
                aria-label="Upload Report"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full font-bold text-sm shadow-xl shadow-[var(--color-primary)]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] focus-visible:ring-[var(--color-primary)]"
              >
                Upload first report to unlock AI insights <ArrowRight className="w-5 h-5" />
              </motion.button>
          </div>
        </div>
        
        {/* Decorative background blobs */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-[var(--color-primary)] rounded-full blur-[100px] opacity-[0.08] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
      </motion.div>

      {/* Demo Section */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 pt-4"
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <ChartArea className="w-5 h-5 text-[var(--color-text-muted)]" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">What your dashboard will look like</h3>
          </div>
          <div className="text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-surface)] px-3 py-1 rounded-full border border-[var(--color-border)]">Preview Mode</div>
        </div>
        
        <div className="opacity-40 pointer-events-none select-none filter blur-[2px] mb-8" aria-hidden="true">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
             <div className="bg-[var(--color-surface)] p-6 rounded-[24px] border border-[var(--color-border)] flex items-center gap-4">
                <ShieldCheck className="w-10 h-10 text-indigo-400" />
                <div><div className="h-3 w-20 bg-[var(--color-border)] rounded mb-2"></div><div className="h-6 w-12 bg-indigo-500/20 rounded"></div></div>
             </div>
             <div className="bg-[var(--color-surface)] p-6 rounded-[24px] border border-[var(--color-border)] flex items-center gap-4">
                <Zap className="w-10 h-10 text-emerald-400" />
                <div><div className="h-3 w-20 bg-[var(--color-border)] rounded mb-2"></div><div className="h-6 w-12 bg-emerald-500/20 rounded"></div></div>
             </div>
             <div className="bg-[var(--color-surface)] p-6 rounded-[24px] border border-[var(--color-border)] flex items-center gap-4 hidden sm:flex">
                <Droplets className="w-10 h-10 text-amber-400" />
                <div><div className="h-3 w-20 bg-[var(--color-border)] rounded mb-2"></div><div className="h-6 w-12 bg-amber-500/20 rounded"></div></div>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="h-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[24px] p-6">
                <div className="h-4 w-1/3 bg-[var(--color-border)] rounded mb-6"></div>
                <div className="h-40 bg-[var(--color-border)]/30 rounded-xl"></div>
             </div>
             <div className="h-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[24px] p-6">
                <div className="h-4 w-1/4 bg-[var(--color-border)] rounded mb-6"></div>
                <div className="w-full space-y-4">
                   <div className="h-10 bg-[var(--color-border)]/30 rounded-lg"></div>
                   <div className="h-10 bg-[var(--color-border)]/30 rounded-lg"></div>
                   <div className="h-10 bg-[var(--color-border)]/30 rounded-lg"></div>
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3L11.5 7.5L16 9L11.5 10.5L10 15L8.5 10.5L4 9L8.5 7.5L10 3Z" fill="currentColor"/>
    <path d="M19 14L19.75 16.25L22 17L19.75 17.75L19 20L18.25 17.75L16 17L18.25 16.25L19 14Z" fill="currentColor"/>
  </svg>
);
