import React from 'react';
import { SpecialistId } from '../../types/ai';
import { Droplets, ShieldCheck, ArrowRight, Clock, Building2, Sparkles } from 'lucide-react';
import { LAB_PARTNERS, LabPackage, LAB_PACKAGES_CATALOG } from '../../services/integrations/labBookingService';

export interface SpecialistLabBookingTriggerProps {
  specialistId: SpecialistId;
  specialistName: string;
  onBookTest: (packageId: string, recommendedBiomarkers: string[]) => void;
  className?: string;
}

interface SpecialistPanelConfig {
  packageId: string;
  panelTitle: string;
  guidelineSnippet: string;
  biomarkers: string[];
  partnerId: 'thyrocare' | 'tata_1mg' | 'redcliffe' | 'healthians';
  fastingInfo: string;
}

const SPECIALIST_PANEL_MAP: Record<SpecialistId, SpecialistPanelConfig> = {
  cardiologist: {
    packageId: 'pkg-cardiac-lipid-apob',
    panelTitle: 'Advanced Cardiac Risk & Apolipoprotein Panel',
    guidelineSnippet: 'AHA & CSI Guidelines recommend ApoB and fasting lipid fractions to evaluate atherogenic plaque burden.',
    biomarkers: ['ApoB', 'Lipid Profile', 'hs-CRP', 'Total Cholesterol', 'Triglycerides'],
    partnerId: 'tata_1mg',
    fastingInfo: '12-hour overnight fasting required',
  },
  endocrinologist: {
    packageId: 'pkg-diabetes-comprehensive',
    panelTitle: 'Diabetic Glycemic & Renal Microalbumin Panel',
    guidelineSnippet: 'RSSDI & ADA 2026 standards recommend quarterly HbA1c surveillance and early renal microalbumin assessment.',
    biomarkers: ['HbA1c', 'Glucose Fasting', 'Average Blood Glucose', 'eGFR', 'Microalbumin'],
    partnerId: 'thyrocare',
    fastingInfo: '8-hour fasting required',
  },
  nephrologist: {
    packageId: 'pkg-diabetes-comprehensive',
    panelTitle: 'Renal Function & Microvascular Strain Panel',
    guidelineSnippet: 'KDIGO & ICMR advise tracking serum creatinine, eGFR, and urinary albumin to safeguard glomerular filtration.',
    biomarkers: ['Serum Creatinine', 'eGFR', 'Urine Microalbumin', 'Fasting Blood Glucose'],
    partnerId: 'thyrocare',
    fastingInfo: 'Fasting recommended',
  },
  gastroenterologist: {
    packageId: 'pkg-aarogyam-c',
    panelTitle: 'Hepatic Function & Comprehensive Metabolic Dossier',
    guidelineSnippet: 'ISG guidelines advise assessing hepatic transaminases and metabolic enzymes for MASLD and digestive screening.',
    biomarkers: ['SGOT/AST', 'SGPT/ALT', 'Bilirubin Total', 'Alkaline Phosphatase', 'Albumin'],
    partnerId: 'thyrocare',
    fastingInfo: '10-hour fasting required',
  },
  neurologist: {
    packageId: 'pkg-aarogyam-c',
    panelTitle: 'Neuro-Metabolic & Micronutrient Deficiency Panel',
    guidelineSnippet: 'Screening for essential neuro-cofactor deficiencies (Vitamin B12 & D3) and vascular stroke risk factors.',
    biomarkers: ['Vitamin B12', 'Vitamin D', 'Lipid Profile', 'Electrolytes', 'HbA1c'],
    partnerId: 'thyrocare',
    fastingInfo: '10-hour fasting required',
  },
  pulmonologist: {
    packageId: 'pkg-cbc-hemogram',
    panelTitle: 'Complete Hemogram (CBC) & Oxygenation Baseline',
    guidelineSnippet: 'GOLD & ICMR guidelines highlight complete blood counts for oxygen-carrying capacity and infection markers.',
    biomarkers: ['Hemoglobin', 'RBC', 'WBC Total', 'Platelet Count', 'Neutrophils'],
    partnerId: 'thyrocare',
    fastingInfo: 'No fasting required',
  },
  oncologist: {
    packageId: 'pkg-redcliffe-full-body',
    panelTitle: 'Redcliffe Smart Full Body & Organ Shield (86 Parameters)',
    guidelineSnippet: 'Comprehensive baseline screening across hematologic and major organ systems per NCG India protocols.',
    biomarkers: ['Complete Hemogram', 'LFT', 'KFT', 'Lipid Profile', 'Vitamin D Total'],
    partnerId: 'redcliffe',
    fastingInfo: '10-hour fasting required',
  },
  psychiatrist: {
    packageId: 'pkg-aarogyam-c',
    panelTitle: 'Neuro-Endocrine & Vitamin Deficiency Dossier',
    guidelineSnippet: 'Evaluating metabolic and endocrine contributors (Vitamin D, B12, Thyroid) associated with mood and sleep.',
    biomarkers: ['Vitamin B12', 'Vitamin D', 'TSH', 'HbA1c', 'Complete Hemogram'],
    partnerId: 'thyrocare',
    fastingInfo: '10-hour fasting required',
  },
  dermatologist: {
    packageId: 'pkg-aarogyam-c',
    panelTitle: 'Dermal Biomarker, Vitamin & Iron Panel',
    guidelineSnippet: 'Checking iron reserves, thyroid hormone levels, and essential vitamins vital for hair and skin integrity.',
    biomarkers: ['Serum Iron', 'Ferritin', 'TSH', 'Vitamin D', 'Complete Blood Count'],
    partnerId: 'thyrocare',
    fastingInfo: '10-hour fasting required',
  },
  orthopedist: {
    packageId: 'pkg-aarogyam-c',
    panelTitle: 'Bone Health & Musculoskeletal Mineral Panel',
    guidelineSnippet: 'IOA & AAOS protocols emphasize Vitamin D3, calcium balance, and inflammatory markers for joint wellness.',
    biomarkers: ['Vitamin D Total', 'Calcium', 'Uric Acid', 'Complete Blood Count', 'ESR'],
    partnerId: 'thyrocare',
    fastingInfo: '10-hour fasting required',
  },
};

export const SpecialistLabBookingTrigger: React.FC<SpecialistLabBookingTriggerProps> = ({
  specialistId,
  specialistName,
  onBookTest,
  className = '',
}) => {
  const config = SPECIALIST_PANEL_MAP[specialistId] || SPECIALIST_PANEL_MAP.cardiologist;
  const pkg = LAB_PACKAGES_CATALOG.find((p) => p.id === config.packageId) || LAB_PACKAGES_CATALOG[0];
  const partner = LAB_PARTNERS[config.partnerId] || LAB_PARTNERS.thyrocare;

  return (
    <div
      data-testid="specialist-lab-booking-trigger"
      className={`rounded-2xl border border-teal-500/25 bg-gradient-to-br from-teal-500/5 via-surface/40 to-emerald-500/5 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-teal-500/40 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Left Section: Context & Details */}
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Droplets className="w-3 h-3 text-teal-400" />
              <span>Recommended Diagnostic Panel</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface/80 text-muted border border-surface">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{partner.name}</span>
            </span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-theme flex items-center gap-1.5">
              <span>{config.panelTitle}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </h4>
            <p className="text-[12px] text-muted leading-relaxed mt-0.5">
              {config.guidelineSnippet}
            </p>
          </div>

          {/* Biomarkers pill cloud */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-muted mr-1">Includes:</span>
            {config.biomarkers.map((bm) => (
              <span
                key={bm}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface text-theme border border-surface/80"
              >
                {bm}
              </span>
            ))}
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              +{pkg.parameterCount} Tests Total
            </span>
          </div>

          {/* Logistics chips */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{config.fastingInfo}</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{partner.accreditation}</span>
            </span>
          </div>
        </div>

        {/* Right Section: Pricing & Action Button */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 sm:pl-3 sm:border-l border-surface/80 shrink-0">
          <div className="text-left sm:text-right">
            <div className="flex items-baseline gap-1.5 sm:justify-end">
              <span className="text-base font-black text-theme font-mono">₹{pkg.aegisPrice}</span>
              <span className="text-xs text-muted line-through">₹{pkg.mrp}</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold">
              Free Home Collection
            </div>
          </div>

          <button
            type="button"
            onClick={() => onBookTest(pkg.id, config.biomarkers)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/20 transition-all hover:shadow-lg hover:shadow-teal-500/30 active:scale-[0.98]"
          >
            <span>Book Home Draw</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecialistLabBookingTrigger;
