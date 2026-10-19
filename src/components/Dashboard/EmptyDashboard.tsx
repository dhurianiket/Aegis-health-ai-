import React from "react";
import { motion } from "motion/react";
import {
  Upload,
  Target,
  ArrowRight,
  ShieldCheck,
  Zap,
  Droplets,
  ChartArea,
  Sparkles,
} from "lucide-react";
import { UserProfile } from "../../types/medical";
import { SpotlightCard } from "../ui/SpotlightCard";
import { ProceduralAvatar } from "../Avatars/ProceduralAvatar";
import { AURA_AVATAR_DEFINITION } from "../../data/avatars/avatarPresets";

export default function EmptyDashboard({
  userProfile,
  onUploadClick,
}: {
  userProfile?: UserProfile | null;
  onUploadClick?: () => void;
}) {
  const firstName = userProfile?.name?.split(" ")[0] || "User";

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <SpotlightCard
          accentColor="teal"
          className="p-7 sm:p-10 rounded-[28px] shadow-md dark:shadow-2xl relative"
        >
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-primary)]/12 border border-[var(--color-primary)]/25 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> Welcome to Clinical Intelligence
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-muted">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>FHIR R4 &amp; ABDM Ready</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text)] leading-tight">
                  Welcome to Aegis, {firstName}.<br />
                  <span className="text-[var(--color-text-muted)] font-semibold">
                    Let&apos;s set up your health profile.
                  </span>
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Upload any laboratory PDF or clinical image to synthesize longitudinal biomarker trajectories, 3D organ risk mapping, and specialist guidance.
                </p>
              </div>

              <div className="w-20 h-20 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] p-1.5 flex items-center justify-center shadow-inner shrink-0 self-start md:self-center">
                <ProceduralAvatar
                  definition={AURA_AVATAR_DEFINITION}
                  expression="happy"
                  size={68}
                />
              </div>
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={onUploadClick}
                aria-label="Upload Report"
                className="aegis-spotlight-card flex flex-col items-start p-5 bg-[var(--color-bg)] hover:bg-[var(--color-primary)]/10 border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 rounded-[20px] transition-all group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <h3 className="font-bold text-sm mb-1 text-[var(--color-text)]">
                  Upload Report
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  PDFs or images of test results
                </p>
              </button>

              <button
                onClick={() => {
                  window.location.hash = "profile";
                }}
                aria-label="Complete Profile"
                className="aegis-spotlight-card flex flex-col items-start p-5 bg-[var(--color-bg)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-emerald-500/40 rounded-[20px] transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="font-bold text-sm mb-1 text-[var(--color-text)]">
                  Complete Profile
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Customize avatar, history &amp; goals
                </p>
              </button>

              <button
                onClick={() => {
                  window.location.hash = "specialist";
                }}
                aria-label="Try AURA AI"
                className="aegis-spotlight-card flex flex-col items-start p-5 bg-[var(--color-bg)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-indigo-500/40 rounded-[20px] transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="font-bold text-sm mb-1 text-[var(--color-text)]">
                  Consult 10 AI Guides
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Explore specialist health personas
                </p>
              </button>
            </div>

            <div className="pt-2">
              <motion.button
                onClick={onUploadClick}
                aria-label="Upload first report to unlock AI insights"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-7 py-3.5 bg-[var(--color-primary)] text-white rounded-full font-bold text-sm shadow-xl shadow-[var(--color-primary)]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] focus-visible:ring-[var(--color-primary)]"
              >
                Upload first report to unlock AI insights{" "}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* Preview Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4 pt-2"
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <ChartArea className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
              Bento Telemetry Architecture Preview
            </h3>
          </div>
          <div className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface)] px-3 py-1 rounded-full border border-[var(--color-border)]">
            Awaiting First Lab Report
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-75">
          <SpotlightCard accentColor="indigo" className="p-5 rounded-[22px] flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Health Index
              </p>
              <p className="text-lg font-extrabold text-theme tabular-nums">
                Multi-System Score
              </p>
            </div>
          </SpotlightCard>

          <SpotlightCard accentColor="emerald" className="p-5 rounded-[22px] flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Metabolic &amp; Lipids
              </p>
              <p className="text-lg font-extrabold text-theme tabular-nums">
                HbA1c &amp; LDL Trends
              </p>
            </div>
          </SpotlightCard>

          <SpotlightCard accentColor="amber" className="p-5 rounded-[22px] flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Hematology
              </p>
              <p className="text-lg font-extrabold text-theme tabular-nums">
                CBC &amp; Micronutrients
              </p>
            </div>
          </SpotlightCard>
        </div>
      </motion.div>
    </div>
  );
}
