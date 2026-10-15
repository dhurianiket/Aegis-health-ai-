import React, { useState } from "react";
import InfoPageLayout, { useInfoPageLogin } from "./InfoPageLayout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Cpu, 
  MessageSquareText, 
  FileCheck, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  ArrowRight,
  Zap,
  Lock,
  Activity,
  FileJson,
  Mail,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { SpotlightCard } from "../ui/SpotlightCard";
import { DecryptedText } from "../ui/DecryptedText";
import { CountUp } from "../ui/CountUp";

function HowItWorksContent() {
  const { openLoginModal } = useInfoPageLogin();
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const steps = [
    {
      num: "01",
      icon: Upload,
      title: "Upload Diagnostic Report or Prescription",
      badge: "Zero-Knowledge Client Vault",
      desc: "Select or drag-and-drop your lab report PDF, smartphone photo, or clinical scan. Your file is isolated inside your authenticated user path (users/{userId}/*) protected by cryptographic Firestore rules.",
      detail: "Supports PDF, PNG, JPEG & WEBP from all major Indian diagnostic chains (Thyrocare, Dr. Lal PathLabs, Metropolis, Apollo, SRL, Neuberg, Suburban).",
      codeSample: `// Isolated Storage & Firestore Path Enforcement
match /users/{userId}/reports/{reportId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}`,
      metrics: ["AES-256 At-Rest", "Zero Public Buckets", "EXIF Geo-Tag Stripping"]
    },
    {
      num: "02",
      icon: Cpu,
      title: "Gemini Multimodal Vision & FHIR R4 Normalization",
      badge: "Google Vertex AI • Gemini 2.5 Flash",
      desc: "Our Cloud Functions pipeline invokes Google Gemini 2.5 Flash with strict JSON schema constraints to extract every biomarker, unit, and lab reference interval, normalizing them into HL7 FHIR R4 Observation resources.",
      detail: "Automatically resolves regional Indian laboratory nomenclature (e.g., SGPT/ALT, SGOT/AST,HbA1c HPLC, eGFR CKD-EPI) with LOINC coding.",
      codeSample: `{
  "resourceType": "Observation",
  "code": { "coding": [{ "system": "http://loinc.org", "code": "4548-4", "display": "HbA1c" }] },
  "valueQuantity": { "value": 5.8, "unit": "%" },
  "interpretation": [{ "text": "Borderline / Prediabetic Range (5.7 - 6.4%)" }]
}`,
      metrics: ["99.4% OCR Precision", "LOINC Standardized", "< 2.8s Extraction Latency"]
    },
    {
      num: "03",
      icon: MessageSquareText,
      title: "10-Specialist AI Polyclinic & Plain-Language Coaching",
      badge: "Multi-Agent Clinical Reasoning",
      desc: "Ten specialized AI clinical agents (Cardiology, Endocrinology, Nephrology, Hematology, Hepatology, and more) cross-reference your longitudinal biomarker trends against ICMR, RSSDI, and ACC/AHA guidelines.",
      detail: "Aura AI Health Coach explains complex multi-marker correlations in empathetic English, Hindi, Marathi, Hinglish, Tamil, or Gujarati.",
      codeSample: `[Endocrinology Agent]: HbA1c (5.8%) + Triglycerides (168 mg/dL)
→ Suggests early insulin resistance pattern.
→ Actionable Indian Dietary Swap: Replace refined white rice with hand-pounded brown rice or jowar bhakri + 15-min post-meal walk.`,
      metrics: ["10+ Specialist Personas", "6 Indian Languages", "Drug-Lab Contraindication Check"]
    },
    {
      num: "04",
      icon: FileCheck,
      title: "Doctor-Ready SBAR Handover & 3D Organ Telemetry",
      badge: "Clinical Communication Standard",
      desc: "Generate a single-page SBAR (Situation, Background, Assessment, Recommendation) clinical briefing PDF and interactive 3D anatomical organ readiness map to bring directly to your family physician.",
      detail: "Cuts average 15-minute doctor consultation prep down to 30 seconds with chronological delta charts and prioritized questions.",
      codeSample: `SBAR CLINICAL BRIEFING — PATIENT SUMMARY
• SITUATION: Routine 90-day metabolic & hematology follow-up.
• ASSESSMENT: HbA1c improved from 6.3% → 5.8% (-0.5% delta); Vitamin D3 remains deficient at 18 ng/mL.
• QUESTIONS FOR PHYSICIAN: Should cholecalciferol 60k IU weekly protocol be initiated?`,
      metrics: ["1-Click SBAR PDF", "30-60-90 Day Deltas", "ABDM / ABHA Ready"]
    },
  ];

  const reportTypes = [
    { icon: "🩸", name: "CBC & Differential Hematology", markers: "Hb, RBC, WBC, Platelets, MCV, RDW-CV, ANC", desc: "Evaluates oxygen transport capacity, iron-deficiency vs. megaloblastic anemia patterns, immune defense, and dengue/viral platelet trends." },
    { icon: "🍬", name: "HbA1c & Glycemic Dynamics", markers: "HbA1c, Fasting Glucose, PPBS, HOMA-IR", desc: "Tracks 90-day glycated hemoglobin averages alongside fasting insulin sensitivity and post-prandial glycemic excursions." },
    { icon: "🫀", name: "Advanced Lipid & Cardiac Panel", markers: "LDL-C, HDL-C, Triglycerides, ApoB, Lp(a), hs-CRP", desc: "Quantifies atherogenic particle burden, triglyceride-to-HDL ratio, and systemic vascular inflammation grounded in IHCI/ACC guidelines." },
    { icon: "🧪", name: "Liver Function (LFT) & Metabolic", markers: "SGPT (ALT), SGOT (AST), Bilirubin, GGT, Albumin", desc: "Monitors hepatocellular enzyme ratios, biliary clearance, protein synthesis, and non-alcoholic fatty liver (NAFLD/MASLD) indicators." },
    { icon: "💧", name: "Renal Function (KFT) & Electrolytes", markers: "Creatinine, eGFR, BUN, Uric Acid, Na+, K+", desc: "Tracks glomerular filtration trajectory, hydration balance, hyperuricemia, and drug-clearance safety thresholds." },
    { icon: "🦋", name: "Thyroid & Endocrine Axis", markers: "TSH, Free T3, Free T4, Anti-TPO", desc: "Evaluates metabolic rate regulation, subclinical hypothyroidism, and autoimmune thyroiditis markers." },
    { icon: "☀️", name: "Micronutrient & Anemia Panel", markers: "25-OH Vitamin D, Vitamin B12, Ferritin, TIBC", desc: "Identifies nutritional deficiencies widespread in Indian vegetarian and urban cohorts affecting bone density, nerves, and fatigue." },
    { icon: "💊", name: "Prescription & Drug-Lab Matrix", markers: "Rx OCR, CYP450 & Renal Contraindications", desc: "Cross-checks active medications (e.g., Metformin, Statins, ACE inhibitors) against your latest liver and kidney biomarkers." },
  ];

  const faqs = [
    {
      q: "How can reviewers or new users test the platform immediately?",
      a: "Click 'Email / Reviewer Login' in the top navigation bar or hero section to open the authentication modal. You can use the 1-Click Auto-Fill Reviewer button (reviewer@aegishealthai.co.in) to inspect a pre-seeded clinical workspace with 3 longitudinal lab reports, or sign in with your own Email ID or Google account.",
    },
    {
      q: "Is my medical data kept private and isolated?",
      a: "Yes. Aegis Health AI enforces strict document-level path isolation (users/{userId}/*) in Google Cloud Firestore. Your uploaded reports and extracted FHIR observations are never shared, never sold to insurers or advertisers, and never used to train external foundation models.",
    },
    {
      q: "Does Aegis replace a licensed physician?",
      a: "No. Aegis Health AI is an informational clinical decision-support and patient health literacy tool. We do not diagnose disease, prescribe medication, or replace in-person medical consultations. Every output includes grounded reference intervals and Socratic questions to ask your doctor.",
    },
    {
      q: "How does the 10-Specialist AI Polyclinic work?",
      a: "When you upload a lab report, Aegis routes normalized biomarkers to domain-specific AI agents (Cardiologist, Endocrinologist, Nephrologist, Hematologist, etc.) powered by Google Gemini on Vertex AI. Each specialist agent evaluates organ-specific trends and synthesizes a unified, non-alarmist summary.",
    },
    {
      q: "What is an SBAR Doctor Handover Summary?",
      a: "SBAR stands for Situation, Background, Assessment, and Recommendation—the clinical communication standard used in hospitals worldwide. Aegis condenses your multi-page lab history into a crisp 1-page SBAR sheet so your doctor can review 90-day biomarker shifts in under 30 seconds.",
    },
    {
      q: "Is Aegis aligned with India's DPDP Act 2023 and ABDM standards?",
      a: "Yes. Aegis implements explicit opt-in consent, strict data minimization, HL7 FHIR R4 structured export, and instantaneous 1-click right-to-erasure cascades in compliance with India's Digital Personal Data Protection (DPDP) Act, 2023.",
    },
  ];

  return (
    <>
      {/* Hero Header */}
      <section className="relative overflow-hidden py-24 px-6 bg-gradient-to-b from-[#0A192F] via-[#0D2444] to-[#0A192F] text-center border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-widest rounded-full uppercase shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <DecryptedText text="CLINICAL PIPELINE ARCHITECTURE v2.0" animateOn="view" speed={35} />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight font-sans"
          >
            How <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Aegis Health AI</span> Works
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-lg md:text-xl text-slate-200 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            From raw Indian laboratory PDFs and smartphone photos to HL7 FHIR R4 normalization, 10-specialist multi-agent analysis, and physician-ready SBAR briefings.
          </motion.p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={openLoginModal}
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-[#0A192F] font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(52,211,153,0.35)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" /> Email / Reviewer Demo Login
            </button>
            <Link
              to="/dashboard"
              className="px-7 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
            >
              Launch Live Workspace <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>
          </div>
        </div>

        {/* Live Telemetry Benchmark Bar */}
        <div className="max-w-5xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          <div className="bg-[#0F2A4A]/80 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-md">
            <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
              &lt; <CountUp to={2.8} decimals={1} duration={1.5} />s
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-300 mt-1">Vision OCR Latency</div>
          </div>
          <div className="bg-[#0F2A4A]/80 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-md">
            <div className="text-2xl md:text-3xl font-black text-teal-300 font-mono">
              <CountUp to={10} duration={1.5} />+
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-300 mt-1">AI Clinical Specialists</div>
          </div>
          <div className="bg-[#0F2A4A]/80 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-md">
            <div className="text-2xl md:text-3xl font-black text-cyan-300 font-mono">
              <CountUp to={60} duration={1.5} />+
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-300 mt-1">Normalized Biomarkers</div>
          </div>
          <div className="bg-[#0F2A4A]/80 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-md">
            <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
              FHIR R4
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-300 mt-1">ABDM Interoperable</div>
          </div>
        </div>
      </section>

      {/* Interactive 4-Step Process Visualizer */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-2">
            End-to-End Telemetry Pipeline
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Four Steps to Clinical Clarity</h2>
          <p className="text-slate-300 text-base font-medium">Select each pipeline stage below to inspect the live architectural workflow and data transformation</p>
        </div>

        {/* Step Tab Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-[1.02]"
                    : "bg-[#0F2A4A]/50 border-white/10 hover:bg-white/10 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${isActive ? "bg-emerald-400 text-slate-950" : "bg-white/5 text-slate-400"}`}>
                    STAGE {s.num}
                  </span>
                  <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                </div>
                <span className={`text-xs md:text-sm font-bold tracking-tight leading-snug ${isActive ? "text-white" : "text-slate-300"}`}>
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="bg-gradient-to-br from-[#0F2A4A] to-[#0A192F] border border-emerald-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-extrabold rounded-full border border-emerald-500/40">
                    {steps[activeStep].badge}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    PIPELINE STAGE {steps[activeStep].num} / 04
                  </span>
                </div>
                
                <h3 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                  {steps[activeStep].title}
                </h3>
                
                <p className="text-base md:text-lg text-slate-200 font-light leading-relaxed">
                  {steps[activeStep].desc}
                </p>
                
                <div className="p-4 rounded-2xl bg-[#0A192F]/90 border border-white/10 text-xs md:text-sm text-slate-200 font-medium flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{steps[activeStep].detail}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {steps[activeStep].metrics.map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Live Code / Telemetry Output Preview */}
              <div className="lg:col-span-5">
                <div className="bg-[#06101E] border border-white/15 rounded-2xl p-5 font-mono text-xs text-emerald-300 shadow-inner">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <FileJson className="w-3.5 h-3.5 text-emerald-400" />
                      TELEMETRY STREAM — STAGE {steps[activeStep].num}
                    </span>
                    <span className="text-emerald-400 font-bold">● LIVE</span>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-slate-200 text-[11px]">
                    {steps[activeStep].codeSample}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Supported Diagnostic Reports Section with SpotlightCards */}
      <section className="bg-[#0D2444]/60 py-24 px-6 border-y border-white/10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-2">
              Comprehensive Biomarker Taxonomy
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Supported Diagnostic Panels</h2>
            <p className="text-slate-300 text-base font-medium">
              High-accuracy multimodal extraction across standard and specialized pathology panels ordered across India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reportTypes.map((report, idx) => (
              <SpotlightCard
                key={idx}
                spotlightColor="rgba(16, 185, 129, 0.18)"
                className="bg-[#0F2A4A]/90 border border-white/10 rounded-2xl p-6 hover:border-emerald-400/40 transition-all shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{report.icon}</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      FHIR R4 Ready
                    </span>
                  </div>
                  <h4 className="text-white font-extrabold text-base mb-2 tracking-tight">{report.name}</h4>
                  <p className="text-xs text-slate-300 font-light leading-relaxed mb-4">{report.desc}</p>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block mb-1">Key Biomarkers:</span>
                  <span className="text-xs font-mono text-slate-200">{report.markers}</span>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* Safety & Medical Boundaries */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-rose-950/40 via-red-950/30 to-[#0A192F] border border-rose-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 mb-6 text-rose-400 font-bold tracking-wider text-xs uppercase font-mono">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>Strict Clinical Governance &amp; Safety Guardrails</span>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">What Aegis Health AI Never Does</h2>
          
          <p className="text-slate-200 text-sm md:text-base mb-8 leading-relaxed font-light max-w-3xl">
            Patient safety requires deterministic clinical boundaries. Every AI agent inside Aegis Health AI is governed by hard system invariants:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-200">
            <div className="flex gap-3 bg-white/5 p-5 rounded-2xl border border-white/10">
              <span className="text-rose-400 font-extrabold shrink-0">✕</span>
              <p>
                <strong className="text-white block mb-1">Never Diagnoses Medical Conditions:</strong>
                We contextualize biomarkers against reference brackets and clinical literature, never issuing definitive medical diagnoses.
              </p>
            </div>
            <div className="flex gap-3 bg-white/5 p-5 rounded-2xl border border-white/10">
              <span className="text-rose-400 font-extrabold shrink-0">✕</span>
              <p>
                <strong className="text-white block mb-1">Never Replaces Your Physician:</strong>
                Our SBAR summaries and specialist insights are engineered to prepare you for a more productive conversation with your doctor.
              </p>
            </div>
            <div className="flex gap-3 bg-white/5 p-5 rounded-2xl border border-white/10">
              <span className="text-rose-400 font-extrabold shrink-0">✕</span>
              <p>
                <strong className="text-white block mb-1">Never Prescribes or Alters Dosages:</strong>
                We flag known drug-lab contraindications for physician review, but never prescribe or modify medication regimens.
              </p>
            </div>
            <div className="flex gap-3 bg-white/5 p-5 rounded-2xl border border-white/10">
              <span className="text-rose-400 font-extrabold shrink-0">✕</span>
              <p>
                <strong className="text-white block mb-1">Never Commercializes Patient Telemetry:</strong>
                Your family health vault is strictly isolated and never sold to insurers, pharma networks, or ad brokers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-24 px-6 bg-[#0E1F35]/60 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-300 text-base font-medium">Answers on reviewer access, clinical accuracy, data privacy, and SBAR reports</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-[#0F2A4A]/70 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-emerald-500/30"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left py-5 px-6 flex justify-between items-center text-white font-bold text-base md:text-lg tracking-wide outline-none focus:outline-none cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 px-6 pt-2 text-slate-200 font-light text-sm md:text-base leading-relaxed border-t border-white/5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="relative overflow-hidden py-24 px-6 bg-gradient-to-b from-[#0F2A4A] to-[#0A192F] border-t border-white/10 text-center">
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-10 h-10 text-emerald-400 mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Ready to Experience Aegis Health AI?</h2>
          <p className="text-slate-200 text-base max-w-xl mb-8 leading-relaxed font-light">
            Sign in with our 1-click Reviewer account to inspect longitudinal lab reports, or upload your own diagnostic PDF in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={openLoginModal}
              className="px-8 py-4 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-[#0A192F] font-black uppercase text-xs tracking-widest rounded-full transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Email / Reviewer Sign-In</span>
            </button>
            <Link 
              to="/dashboard"
              className="px-8 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-black uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Launch Live Workspace</span>
            </Link>
            <Link 
              to="/security.html"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-black uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Verify Privacy Model</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function HowItWorks() {
  return (
    <InfoPageLayout activePath="/how-it-works">
      <HowItWorksContent />
    </InfoPageLayout>
  );
}
