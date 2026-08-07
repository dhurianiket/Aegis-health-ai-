import React, { useState } from "react";
import InfoPageLayout from "./InfoPageLayout";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, 
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
  FileSpreadsheet,
  Stethoscope
} from "lucide-react";
import { Link } from "react-router-dom";

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const steps = [
    {
      num: "01",
      icon: Upload,
      title: "Upload Your Report Securely",
      badge: "Zero-Knowledge Encryption",
      desc: "Select or drop your lab report PDF or scanned image. Your document is processed within a sandboxed isolated user vault protected by client-side security rules.",
      detail: "Supports PDF, PNG, JPEG & WEBP from major Indian laboratories (Apollo, Dr. Lal PathLabs, SRL, Metropolis, Suburban, Max Healthcare)."
    },
    {
      num: "02",
      icon: Cpu,
      title: "AI Reads & Normalizes Biomarkers",
      badge: "Gemini 3.6 Multimodal Vision",
      desc: "Our high-precision clinical vision parser extracts lab parameters (like HbA1c, hs-CRP, Lipid Profiles, RDW-CV) and grounds them against standard reference ranges.",
      detail: "Automatically maps lab abbreviations (e.g. TSH, SGPT, eGFR, WBC) to standardized medical taxonomies with grounded source references."
    },
    {
      num: "03",
      icon: MessageSquareText,
      title: "Translates Into Plain Language",
      badge: "Aura AI Health Assistant",
      desc: "Our intelligent ChatCoach translates medical jargon into clear, reassuring explanation for you and your family—without overwhelming medical complexity.",
      detail: "Supports multi-lingual queries (English, Hinglish, Hindi, Marathi, Gujarati) to make family health literacy seamless."
    },
    {
      num: "04",
      icon: FileCheck,
      title: "Generates Doctor-Ready SBAR Summary",
      badge: "Clinical Communication Standard",
      desc: "Instantly export a structured SBAR (Situation, Background, Assessment, Recommendation) briefing paper to hand directly to your primary care physician.",
      detail: "Empowers focused, time-efficient doctor consults with concise trend histories and flagged markers."
    },
  ];

  const reportTypes = [
    { icon: "🩸", name: "CBC (Complete Blood Count)", desc: "Analyzes red blood cells, white blood cells, hemoglobin, hematocrit, and platelet counts." },
    { icon: "🧪", name: "LFT (Liver Function Tests)", desc: "Monitors SGPT, SGOT, Bilirubin, Albumin, and Alkaline Phosphatase waste filtration." },
    { icon: "💧", name: "KFT (Kidney Function Tests)", desc: "Measures Serum Creatinine, Blood Urea Nitrogen (BUN), Uric Acid, and eGFR rates." },
    { icon: "🧬", name: "Lipid Profile (Cholesterol)", desc: "Tracks Total Cholesterol, HDL, LDL, VLDL, and Triglyceride cardiovascular risks." },
    { icon: "🦋", name: "Thyroid Profile (T3, T4, TSH)", desc: "Evaluates metabolic energy regulation and thyroid stimulating hormone baselines." },
    { icon: "🍬", name: "HbA1c & Diabetes Panel", desc: "Tracks average 90-day glycemic control alongside Fasting & Post-Prandial glucose." },
    { icon: "☀️", name: "Vitamin D3 & B12 Levels", desc: "Monitors essential micronutrients crucial for bone density, nerve health, and energy." },
    { icon: "⚡", name: "Cardiac & Inflammatory (hs-CRP)", desc: "Detects high-sensitivity C-Reactive Protein and systemic inflammation markers." },
  ];

  const faqs = [
    {
      q: "Is my medical data kept private and secure?",
      a: "Yes, completely. Aegis Health AI uses isolated Firestore path sandboxing (users/{userId}/*) protected by strict client security rules. Your uploaded documents and parsed telemetry are accessible only by your authenticated Google account and can be wiped permanently with one click.",
    },
    {
      q: "Does Aegis replace a real doctor?",
      a: "No. Aegis Health AI is designed strictly for general health education, literacy, and doctor visit preparation. We do not provide clinical diagnoses, prescribe medications, or offer telemedicine. Always consult a licensed healthcare professional for medical advice.",
    },
    {
      q: "What file formats and lab reports are supported?",
      a: "Aegis accepts digital PDFs and high-resolution images (PNG, JPEG, WEBP) of standard diagnostic lab reports including CBC, LFT, KFT, Lipid Profile, Thyroid, Vitamin D3/B12, and HbA1c panels.",
    },
    {
      q: "How does the Doctor-Ready SBAR Summary work?",
      a: "SBAR (Situation, Background, Assessment, Recommendation) is the global gold standard framework used by clinical teams. Aegis distills your uploaded reports into a crisp, single-page summary highlighting out-of-range markers so your physician can make faster, informed decisions.",
    },
    {
      q: "Can I use Aegis for family members?",
      a: "Yes! Aegis supports multi-profile health tracking, allowing you to manage health records for parents, spouses, and children in one secure workspace.",
    },
    {
      q: "Is Aegis compliant with Indian data privacy regulations?",
      a: "Yes. Aegis strictly complies with India's Digital Personal Data Protection (DPDP) Act, 2023. You retain 100% ownership of your data and can execute instant, permanent deletion cascades whenever desired.",
    },
  ];

  return (
    <InfoPageLayout activePath="/how-it-works">
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
            <span>Interactive Workflow Blueprint</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight font-sans"
          >
            How Aegis Health AI Works
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-200 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            From complex clinical lab reports to crystal-clear plain explanations and doctor-ready summaries—in four seamless steps.
          </motion.p>
        </div>
      </section>

      {/* Interactive 4-Step Process Visualizer */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Four Steps to Health Clarity</h2>
          <p className="text-slate-300 text-base font-medium">Click through each phase below to see how Aegis processes your diagnostic telemetry</p>
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
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-[1.02]"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-mono font-extrabold ${isActive ? "text-emerald-400" : "text-slate-400"}`}>{s.num}</span>
                  <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
                </div>
                <span className={`text-xs md:text-sm font-bold tracking-tight ${isActive ? "text-white" : "text-slate-300"}`}>{s.title}</span>
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
            transition={{ duration: 0.3 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/15 rounded-[36px] p-8 md:p-12 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              {React.createElement(steps[activeStep].icon, { className: "w-64 h-64 text-emerald-400" })}
            </div>
            
            <div className="max-w-3xl relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-extrabold rounded-full border border-emerald-500/40">
                  {steps[activeStep].badge}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Step {steps[activeStep].num} of 04</span>
              </div>
              
              <h3 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                {steps[activeStep].title}
              </h3>
              
              <p className="text-base md:text-lg text-slate-100 font-medium leading-relaxed">
                {steps[activeStep].desc}
              </p>
              
              <div className="p-4 rounded-2xl bg-[#0A192F]/80 border border-white/10 text-xs md:text-sm text-slate-200 font-medium flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{steps[activeStep].detail}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Supported Diagnostic Reports Section */}
      <section className="bg-[#0D2444]/60 py-24 px-6 border-y border-white/10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Supported Lab Diagnostics</h2>
            <p className="text-slate-300 text-base font-medium">Full clinical parsing support for major primary care laboratory panels ordered across India</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reportTypes.map((report, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-400/40 transition-all shadow-md"
              >
                <div className="text-3xl mb-4">{report.icon}</div>
                <h4 className="text-emerald-400 font-extrabold text-sm mb-2 uppercase tracking-wide">{report.name}</h4>
                <p className="text-xs md:text-sm text-slate-200 font-medium leading-relaxed">{report.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety & Medical Boundaries */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-rose-950/40 via-red-950/30 to-[#0A192F] border border-rose-500/30 rounded-[36px] p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 mb-6 text-rose-400 font-bold tracking-wider text-xs uppercase">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>Strict Clinical Boundaries & Guardrails</span>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">What Aegis Health AI Does Not Do</h2>
          
          <p className="text-slate-200 text-sm md:text-base mb-8 leading-relaxed font-medium max-w-3xl">
            We operate under absolute transparency and patient safety invariants. Aegis Health AI is built exclusively for general health literacy and doctor consult preparation:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-200 font-medium">
            <div className="flex gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-rose-400 font-extrabold shrink-0">✕</span>
              <p>
                <strong className="text-white">Does Not Diagnose Disease:</strong> We parse biomarker numbers against reference ranges, but never diagnose medical conditions.
              </p>
            </div>
            <div className="flex gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-rose-400 font-extrabold shrink-0">✕</span>
              <p>
                <strong className="text-white">Does Not Replace Your Physician:</strong> We do not provide medical advice or substitute for in-person doctor appointments.
              </p>
            </div>
            <div className="flex gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-rose-400 font-extrabold shrink-0">✕</span>
              <p>
                <strong className="text-white">Does Not Prescribe Treatments:</strong> You will never receive prescription dosages or chemical treatment plans.
              </p>
            </div>
            <div className="flex gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-rose-400 font-extrabold shrink-0">✕</span>
              <p>
                <strong className="text-white">Does Not Sell Personal Data:</strong> Your data remains private in your isolated vault and is never commercialized.
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
            <p className="text-slate-300 text-base font-medium">Transparent answers regarding report safety, encryption, and physician summaries</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-emerald-500/30"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left py-5 px-6 flex justify-between items-center text-white font-bold text-base md:text-lg tracking-wide outline-none focus:outline-none"
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
                        <div className="pb-6 px-6 pt-2 text-slate-200 font-medium text-sm md:text-base leading-relaxed border-t border-white/5">
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
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Ready to Translate Your Lab Reports?</h2>
          <p className="text-slate-200 text-base max-w-xl mb-8 leading-relaxed font-medium">
            Upload your latest diagnostic report or connect wearable biometrics in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard"
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#0A192F] font-black uppercase text-xs tracking-widest rounded-full transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/security.html"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-black uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Verify Privacy Model</span>
            </Link>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
}
