import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Activity, ArrowRight, Brain, Droplets, Heart, ShieldCheck, Sparkles, Stethoscope, Zap } from 'lucide-react';
import { TiltSurface3D } from './TiltSurface3D';

type SpecialistCategory = 'all' | 'cardiometabolic' | 'organ' | 'preventive';

interface SpecialistShowcaseItem {
  id: string;
  title: string;
  category: Exclude<SpecialistCategory, 'all'>;
  guidelines: string;
  sampleQuestion: string;
  sbarSummary: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: Array<{ id: SpecialistCategory; label: string }> = [
  { id: 'all', label: 'All 10 Specialists' },
  { id: 'cardiometabolic', label: 'Cardiometabolic' },
  { id: 'organ', label: 'Organ Systems' },
  { id: 'preventive', label: 'Preventive & Mind' },
];

const SPECIALISTS: SpecialistShowcaseItem[] = [
  {
    id: 'cardio',
    title: 'AI Cardiologist',
    category: 'cardiometabolic',
    guidelines: 'IHCI/ICMR & ACC/AHA',
    sampleQuestion: 'My LDL fell from 148 to 112 mg/dL, while resting HR averages 64 bpm. What should I ask at follow-up?',
    sbarSummary: 'Summarizes LDL velocity, hs-CRP trend, and statin tolerance against South Asian CSI lipid targets (<100 mg/dL) for your physician visit.',
    icon: Heart,
  },
  {
    id: 'endo',
    title: 'AI Endocrinologist',
    category: 'cardiometabolic',
    guidelines: 'RSSDI & ADA 2025',
    sampleQuestion: 'HbA1c dropped from 6.4% to 5.8% with post-dinner glucose spikes. Should we review evening timing?',
    sbarSummary: 'Maps fasting vs post-prandial glycemic swings with Metformin timing notes and RSSDI/ADA lifestyle follow-up questions.',
    icon: Zap,
  },
  {
    id: 'neuro',
    title: 'AI Neurologist',
    category: 'preventive',
    guidelines: 'ICMR & AAN 2024',
    sampleQuestion: 'Vitamin B12 is 190 pg/mL alongside tingling in feet. Could peripheral neuropathy workup help?',
    sbarSummary: 'Flags borderline-low B12, folate, and TSH patterns to structure focused sensory symptom history before OPD consultation.',
    icon: Brain,
  },
  {
    id: 'gastro',
    title: 'AI Gastroenterologist',
    category: 'organ',
    guidelines: 'ISG & ACG/AGA',
    sampleQuestion: 'ALT is 68 U/L with mild fatty liver on ultrasound. Which metabolic markers matter most?',
    sbarSummary: 'Correlates LFT ratios (AST/ALT), fasting triglycerides, and glycemic index to highlight MASLD discussion points.',
    icon: Droplets,
  },
  {
    id: 'pulmo',
    title: 'AI Pulmonologist',
    category: 'organ',
    guidelines: 'ICMR & GOLD 2025',
    sampleQuestion: 'Mumbai AQI reached 185 today and nocturnal SpO2 dipped to 94%. How should I adjust outdoor walks?',
    sbarSummary: 'Combines local Google Air Quality PM2.5 telemetry with overnight SpO2 baseline and eosinophil counts.',
    icon: Activity,
  },
  {
    id: 'nephro',
    title: 'AI Nephrologist',
    category: 'organ',
    guidelines: 'ICMR & KDIGO 2024',
    sampleQuestion: 'Serum creatinine is 1.18 mg/dL and Potassium is 5.2 mEq/L on ACE inhibitor therapy.',
    sbarSummary: 'Cross-checks eGFR trajectory with electrolyte alerts and medication interactions for timely physician electrolyte review.',
    icon: Droplets,
  },
  {
    id: 'psych',
    title: 'AI Psychiatrist',
    category: 'preventive',
    guidelines: 'Tele-MANAS & APA',
    sampleQuestion: 'Sleep efficiency fell below 72% with elevated morning heart rate and low Vitamin D.',
    sbarSummary: 'Separates sleep architecture disruptions and micronutrient confounders (TSH, Ferritin, Vit D) into clear prep notes.',
    icon: Sparkles,
  },
  {
    id: 'derm',
    title: 'AI Dermatologist',
    category: 'preventive',
    guidelines: 'IADVL & AAD',
    sampleQuestion: 'Persistent telogen hair shedding alongside Ferritin 16 ng/mL and subclinical hypothyroidism.',
    sbarSummary: 'Links iron stores, thyroid panel, and androgen/metabolic cues to prepare targeted dermatology consultation questions.',
    icon: ShieldCheck,
  },
  {
    id: 'ortho',
    title: 'AI Orthopedist',
    category: 'organ',
    guidelines: 'IOA/ICMR & AAOS',
    sampleQuestion: '25-OH Vitamin D is 18 ng/mL with elevated alkaline phosphatase and morning knee stiffness.',
    sbarSummary: 'Normalizes nmol/L vs ng/mL bone mineral labs and organizes calcium, uric acid, and inflammatory markers for OPD review.',
    icon: Stethoscope,
  },
  {
    id: 'onco',
    title: 'AI Oncologist',
    category: 'preventive',
    guidelines: 'NCG India & NCCN',
    sampleQuestion: 'Help me organize serial CEA, CBC neutrophil ratios, and radiology dates for tumor board review.',
    sbarSummary: 'Compiles chronological biopsy, imaging, and CBC trend summaries strictly for caregiver & specialist handover clarity.',
    icon: Activity,
  },
];

export interface SpecialistShowcaseSectionProps {
  isAuthenticated: boolean;
  onRequireSignIn: () => void;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const SpecialistShowcaseSection: React.FC<SpecialistShowcaseSectionProps> = ({
  isAuthenticated,
  onRequireSignIn,
}) => {
  const [category, setCategory] = useState<SpecialistCategory>('all');
  const [selectedId, setSelectedId] = useState<string>('endo');
  const prefersReducedMotion = useReducedMotion();

  const visibleSpecialists = useMemo(
    () => (category === 'all' ? SPECIALISTS : SPECIALISTS.filter((item) => item.category === category)),
    [category],
  );

  const selectedSpecialist =
    SPECIALISTS.find((item) => item.id === selectedId) ?? visibleSpecialists[0] ?? SPECIALISTS[0];

  const SelectedIcon = selectedSpecialist.icon;

  return (
    <section id="specialists" className="mt-24 pt-20 border-t border-white/10">
      <div className="text-center mb-10 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-[0.16em] text-teal-300 bg-teal-500/10 border border-teal-400/25 mb-4">
          <Stethoscope className="w-3.5 h-3.5" /> Interactive Polyclinic Consensus
        </span>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
          Consult the Specialists.
        </h2>
        <p className="text-base md:text-lg text-slate-300 font-light leading-relaxed">
          Explore our 10 guideline-grounded virtual specialty lenses. Select a specialty below to preview how Aegis structures your labs into SBAR Doctor Visit Prep.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8" role="tablist" aria-label="Filter AI specialist domains">
        {CATEGORIES.map((tab) => {
          const isActive = category === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setCategory(tab.id);
                const nextList =
                  tab.id === 'all' ? SPECIALISTS : SPECIALISTS.filter((item) => item.category === tab.id);
                if (!nextList.some((item) => item.id === selectedId) && nextList[0]) {
                  setSelectedId(nextList[0].id);
                }
              }}
              className={`relative px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-colors duration-150 active:scale-[0.97] cursor-pointer ${
                isActive ? 'text-slate-950' : 'text-slate-300 hover:text-white bg-white/[0.04] border border-white/10'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="specialist-tab-pill"
                  transition={{ type: 'spring', duration: 0.35, bounce: 0.12 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.35)]"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Specialist Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
        {visibleSpecialists.map((spec) => {
          const Icon = spec.icon;
          const isSelected = spec.id === selectedSpecialist.id;
          return (
            <button
              key={spec.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedId(spec.id)}
              className={`p-5 rounded-2xl border text-center flex flex-col items-center transition-[transform,border-color,background-color] duration-200 active:scale-[0.97] cursor-pointer ${
                isSelected
                  ? 'bg-teal-500/15 border-teal-400/55 shadow-[0_12px_32px_rgba(20,184,166,0.18)]'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3.5 border ${
                  isSelected
                    ? 'bg-teal-400/20 border-teal-400/45 text-teal-200'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide mb-2">{spec.title}</h3>
              <span className="mt-auto text-[11px] font-mono text-teal-300 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-400/20">
                {spec.guidelines}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Consultation Preview Card */}
      <TiltSurface3D glowColor="rgba(45, 212, 191, 0.16)" className="rounded-3xl p-6 md:p-7">
        <motion.div
          key={selectedSpecialist.id}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(6px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
        >
          <div className="space-y-2.5 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/35 text-xs font-bold text-teal-200">
                <SelectedIcon className="w-3.5 h-3.5" />
                {selectedSpecialist.title}
              </span>
              <span className="text-xs font-mono text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                Guideline Basis: {selectedSpecialist.guidelines}
              </span>
            </div>
            <p className="text-sm text-white font-medium italic">
              &ldquo;{selectedSpecialist.sampleQuestion}&rdquo;
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {selectedSpecialist.sbarSummary}
            </p>
          </div>

          <Link
            to="/dashboard"
            onClick={(e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                onRequireSignIn();
              }
            }}
            className="shrink-0 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-transform duration-150 active:scale-[0.97]"
          >
            <span>Open in Polyclinic Lounge</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </TiltSurface3D>
    </section>
  );
};

export default SpecialistShowcaseSection;
