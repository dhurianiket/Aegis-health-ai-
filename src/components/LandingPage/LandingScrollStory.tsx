import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { Activity, AlertCircle, CheckCircle2, FileText, ShieldCheck, Sparkles } from 'lucide-react';

const CHAOS_FRAGMENTS = [
  { label: 'HbA1c 6.4% H', tone: 'text-amber-300 border-amber-400/25 bg-amber-500/10', pos: 'top-[18%] left-[6%] md:left-[12%]' },
  { label: 'LDL 148 mg/dL', tone: 'text-rose-300 border-rose-400/25 bg-rose-500/10', pos: 'top-[22%] right-[6%] md:right-[14%]' },
  { label: '25-OH Vit D 35 nmol/L', tone: 'text-sky-300 border-sky-400/25 bg-sky-500/10', pos: 'bottom-[24%] left-[5%] md:left-[16%]' },
  { label: 'hs-CRP 4.1 mg/L H', tone: 'text-rose-300 border-rose-400/25 bg-rose-500/10', pos: 'bottom-[20%] right-[6%] md:right-[12%]' },
  { label: 'Metformin SR 500mg', tone: 'text-indigo-300 border-indigo-400/25 bg-indigo-500/10', pos: 'top-[50%] left-[3%] md:left-[8%]' },
  { label: 'TSH 4.8 uIU/mL', tone: 'text-emerald-300 border-emerald-400/25 bg-emerald-500/10', pos: 'top-[48%] right-[3%] md:right-[9%]' },
];

export const LandingScrollStory: React.FC = () => {
  const stickyRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress: stickyRaw } = useScroll({
    target: stickyRef,
    offset: ['start start', 'end end'],
  });

  const stickyProgress = useSpring(stickyRaw, {
    stiffness: 110,
    damping: 28,
    restDelta: 0.001,
  });

  const chaosOpacity = useTransform(stickyProgress, [0, 0.22, 0.34], [1, 1, 0]);
  const chaosScale = useTransform(stickyProgress, [0, 0.34], [1, 1.12]);

  const bridgeOpacity = useTransform(stickyProgress, [0.22, 0.36, 0.5, 0.62], [0, 1, 1, 0]);
  const bridgeScale = useTransform(stickyProgress, [0.22, 0.55], [0.92, 1.04]);

  const shieldOpacity = useTransform(stickyProgress, [0.46, 0.6], [0, 1]);
  const shieldY = useTransform(stickyProgress, [0.62, 0.88], ['0vh', '-26vh']);
  const shieldScale = useTransform(stickyProgress, [0.46, 0.6, 0.88], [0.85, 1, 0.72]);

  const insightOpacity = useTransform(stickyProgress, [0.62, 0.86, 1], [0, 1, 1]);
  const insightY = useTransform(stickyProgress, [0.62, 0.88, 1], ['14vh', '4vh', '4vh']);

  const progressWidth = useTransform(stickyProgress, [0, 1], [0.1, 1]);

  if (prefersReducedMotion) {
    return (
      <section aria-label="Chaos to clarity clinical pipeline" className="w-full relative z-20 bg-[#040B16] border-t border-white/10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-teal-300">
              Clinical Transformation Pipeline
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mt-2">
              From scattered PDF rows to structured clarity.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="aegis-hairline-surface rounded-3xl p-6">
              <span className="text-xs font-mono text-amber-300 uppercase tracking-widest">01 · Unstructured Inputs</span>
              <h3 className="text-lg font-bold text-white mt-2 mb-3">Fragmented Lab PDFs &amp; Scripts</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                HbA1c 6.4%, Vitamin D in nmol/L, and handwritten prescriptions across multiple diagnostic chains.
              </p>
            </div>
            <div className="aegis-hairline-surface rounded-3xl p-6 border-teal-500/30">
              <span className="text-xs font-mono text-teal-300 uppercase tracking-widest">02 · Gemini 4 + Model Armor</span>
              <h3 className="text-lg font-bold text-white mt-2 mb-3">LOINC &amp; Schema Validation</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Model Armor screens prompts in asia-south1 while Gemini 4 Hydrogen &amp; Argon normalize every unit and analyte.
              </p>
            </div>
            <div className="aegis-hairline-surface rounded-3xl p-6 border-emerald-500/30">
              <span className="text-xs font-mono text-emerald-300 uppercase tracking-widest">03 · Validated SBAR &amp; FHIR R4</span>
              <h3 className="text-lg font-bold text-white mt-2 mb-3">Doctor Visit Prep Ready</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Color-coded biomarker trajectories, safety alerts, and Cloud FHIR R4 export ready for consultation.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={stickyRef} aria-label="Chaos to clarity clinical pipeline" className="relative w-full h-[220vh]">
      <div className="sticky top-0 h-[100dvh] w-full flex items-center justify-center overflow-clip transform-gpu">
        <div className="absolute inset-0 bg-[#040B16] pointer-events-none -z-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040B16] via-transparent to-[#040B16] z-40 pointer-events-none" />

        {/* Top Stage Progress Rail */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6 pointer-events-none">
          <div className="aegis-hairline-surface rounded-full px-4 py-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-slate-300">
              <span>01 Raw PDFs</span>
              <span>02 Gemini 4 + Armor</span>
              <span>03 SBAR Vault</span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div
                style={{ scaleX: progressWidth, transformOrigin: 'left center' }}
                className="h-full w-full bg-gradient-to-r from-teal-400 via-sky-400 to-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Phase 1: Scattered Lab Vectors */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ opacity: chaosOpacity, scale: chaosScale }}
        >
          <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center overflow-hidden">
            {CHAOS_FRAGMENTS.map((frag) => (
              <div
                key={frag.label}
                className={`absolute ${frag.pos} px-3.5 py-2 rounded-xl border backdrop-blur-md font-mono text-xs md:text-base font-semibold whitespace-nowrap shadow-lg ${frag.tone}`}
              >
                {frag.label}
              </div>
            ))}
            <div className="text-center px-4 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/15 text-[11px] font-mono uppercase tracking-[0.2em] text-slate-300 mb-3">
                <FileText className="w-3.5 h-3.5 text-teal-300" /> Multi-Chain Lab Ingestion
              </div>
              <p className="font-mono text-base md:text-2xl tracking-[0.22em] text-teal-300 font-bold uppercase">
                Decoding Fragmented Biomarkers
              </p>
            </div>
          </div>
        </motion.div>

        {/* Phase 2: Gemini 4 & Model Armor Engine */}
        <motion.div
          style={{ opacity: bridgeOpacity, scale: bridgeScale }}
          className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none px-4"
        >
          <div className="relative flex flex-col items-center text-center max-w-xl">
            <div className="w-56 h-24 rounded-full bg-teal-500/15 blur-2xl absolute -z-10" />
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/12 border border-teal-400/30 text-[11px] font-mono uppercase tracking-[0.16em] text-teal-200 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" /> Schema Validation · Model Armor
            </span>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Normalizing SI &amp; Conventional Units
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-md">
              LOINC mapping, ICMR reference stratification, and contraindication screening run in parallel before clinical insight generation.
            </p>
          </div>
        </motion.div>

        {/* Phase 3: Elevated Aegis Shield Core */}
        <motion.div
          className="landing-3d-stage absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          style={{ opacity: shieldOpacity, y: shieldY, scale: shieldScale }}
        >
          <div className="landing-3d-preserve relative w-28 h-28 md:w-44 md:h-44 rounded-full bg-[#071325] border border-teal-400/45 flex items-center justify-center shadow-[0_0_50px_rgba(20,184,166,0.28)]">
            <div className="absolute -inset-2 rounded-full border border-teal-400/20 animate-[spin_12s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full border border-dashed border-sky-400/30 animate-[spin_16s_linear_infinite_reverse]" />
            <ShieldCheck className="w-14 h-14 md:w-20 md:h-20 text-teal-300" strokeWidth={1.6} />
          </div>
        </motion.div>

        {/* Phase 4: Structured Clinical Dashboard Cards */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none px-4 w-full max-w-xl mx-auto"
          style={{ opacity: insightOpacity, y: insightY }}
        >
          <div className="flex flex-col gap-3 w-full">
            <div className="aegis-hairline-surface p-4 rounded-2xl border-emerald-500/35 flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-500/12 border border-emerald-500/25 rounded-xl shrink-0">
                <Activity className="text-emerald-300 w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-emerald-300 font-bold text-sm md:text-base">Hemoglobin Optimal · 14.2 g/dL</h3>
                  <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full">Verified</span>
                </div>
                <p className="text-xs md:text-sm text-slate-300 mt-1">
                  Balanced oxygen transport index across 3 serial CBC panels.
                </p>
              </div>
            </div>

            <div className="aegis-hairline-surface p-4 rounded-2xl border-amber-500/35 flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-500/12 border border-amber-500/25 rounded-xl shrink-0">
                <AlertCircle className="text-amber-300 w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-amber-300 font-bold text-sm md:text-base">HbA1c Trajectory · 6.4% → 5.8%</h3>
                  <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full">Improving</span>
                </div>
                <p className="text-xs md:text-sm text-slate-300 mt-1">
                  Downward metabolic trend flagged for 90-day SBAR Doctor Visit Prep.
                </p>
              </div>
            </div>

            <div className="aegis-hairline-surface p-4 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                <span className="text-xs md:text-sm font-semibold text-slate-200">
                  HL7 FHIR R4 Bundle &amp; Multilingual Audio Ready
                </span>
              </div>
              <span className="text-[11px] font-mono text-sky-300 bg-sky-500/10 border border-sky-400/25 px-2.5 py-0.5 rounded-full shrink-0">
                asia-south1
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingScrollStory;
