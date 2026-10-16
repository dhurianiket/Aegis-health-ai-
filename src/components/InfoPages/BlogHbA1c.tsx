import React, { useState } from "react";
import InfoPageLayout, { useInfoPageLogin } from "./InfoPageLayout";
import { Sparkles, Calendar, Clock, User, MessageCircle, AlertCircle, Activity, Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SpotlightCard } from "../ui/SpotlightCard";
import { DecryptedText } from "../ui/DecryptedText";

function BlogHbA1cContent() {
  const { openLoginModal } = useInfoPageLogin();
  const [selectedHba1c, setSelectedHba1c] = useState<number>(5.8);

  // Nathan Formula: eAG (mg/dL) = 28.7 * A1C - 46.7
  const estimatedAvgGlucose = Math.round(28.7 * selectedHba1c - 46.7);
  const getHba1cStatus = (val: number) => {
    if (val < 5.7) {
      return {
        label: "Optimal / Normal Glycemic Control",
        color: "text-emerald-400",
        bg: "bg-emerald-500/15 border-emerald-500/40",
        advice: "Your 90-day glycated hemoglobin is within the healthy non-diabetic reference bracket (< 5.7%). Maintain balanced whole-grain nutrition and regular physical movement.",
      };
    }
    if (val <= 6.4) {
      return {
        label: "Borderline / Prediabetes Range (ICMR / ADA)",
        color: "text-amber-400",
        bg: "bg-amber-500/15 border-amber-500/40",
        advice: "Indicates early insulin resistance. Replacing high-glycemic refined carbs (white rice, maida) with fiber-rich Indian millets (jowar, ragi, bajra) plus a 15-minute post-meal walk frequently restores normal levels.",
      };
    }
    return {
      label: "Diabetic Threshold — Physician Review Recommended",
      color: "text-rose-400",
      bg: "bg-rose-500/15 border-rose-500/40",
      advice: "An HbA1c ≥ 6.5% warrants a structured consultation with your primary care physician or endocrinologist to align nutrition, movement, and personalized clinical targets.",
    };
  };

  const currentStatus = getHba1cStatus(selectedHba1c);

  const tableData = [
    {
      range: "Below 5.7%",
      eag: "< 117 mg/dL",
      category: "Normal",
      categoryColor: "text-emerald-400 font-bold",
      cardColor: "border-emerald-500/20 bg-emerald-500/5",
      meaning: "Your average blood glucose over the past 90 days is well-regulated with minimal excess glycation on red blood cell hemoglobin.",
    },
    {
      range: "5.7% to 6.4%",
      eag: "117 – 137 mg/dL",
      category: "Prediabetes",
      categoryColor: "text-amber-400 font-bold",
      cardColor: "border-amber-500/20 bg-amber-500/5",
      meaning: "Early metabolic warning sign. Highly reversible through targeted culinary swaps, sleep hygiene, and post-prandial walking.",
    },
    {
      range: "6.5% and Above",
      eag: "≥ 140 mg/dL",
      category: "Diabetes",
      categoryColor: "text-rose-400 font-bold",
      cardColor: "border-rose-500/20 bg-rose-500/5",
      meaning: "Sustained elevation in 90-day blood glucose. Partner with your physician using an SBAR summary to establish a tailored care plan.",
    },
  ];

  return (
    <>
      <main className="flex-1 bg-[#0A192F] py-16 px-4 md:px-6 font-sans">
        <article className="max-w-4xl mx-auto bg-[#0F2A4A]/60 border border-white/10 rounded-3xl p-6 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <header className="mb-10 text-center md:text-left border-b border-white/10 pb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-widest rounded-full uppercase mb-4">
              <Activity className="w-3.5 h-3.5" />
              <DecryptedText text="CLINICAL BIOMARKER DEEP-DIVE • LOINC 4548-4" animateOn="view" speed={35} />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
              What Does Your <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">HbA1c Blood Report</span> Mean?
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-400 text-xs md:text-sm font-mono">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <User className="w-4 h-4 text-emerald-400" /> By Aniket Rajesh Dhuri
              </span>
              <span className="hidden md:inline">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" /> Grounded in ICMR &amp; RSSDI Guidelines
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> 6 Min Read
              </span>
            </div>
          </header>

          {/* Interactive HbA1c & eAG Converter Widget */}
          <SpotlightCard
            spotlightColor="rgba(16, 185, 129, 0.18)"
            className="mb-10 bg-[#0A192F]/90 border border-emerald-500/30 rounded-2xl p-6 md:p-8 shadow-xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                  Interactive Clinical Translator
                </span>
                <h2 className="text-xl font-extrabold text-white">
                  HbA1c to Estimated Average Glucose (eAG) Explorer
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {[5.3, 5.8, 6.2, 6.9].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSelectedHba1c(preset)}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedHba1c === preset
                        ? "bg-emerald-400 text-slate-950"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <input
                type="range"
                min={4.5}
                max={9.0}
                step={0.1}
                value={selectedHba1c}
                onChange={(e) => setSelectedHba1c(parseFloat(e.target.value))}
                aria-label="Select HbA1c percentage"
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
                <span>4.5% (Normal)</span>
                <span>5.7% (Prediabetes Cutoff)</span>
                <span>6.5% (Diabetes Cutoff)</span>
                <span>9.0%</span>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${currentStatus.bg} grid grid-cols-1 md:grid-cols-12 gap-4 items-center`}>
              <div className="md:col-span-5 flex items-center gap-5 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 block">Selected HbA1c</span>
                  <span className={`text-3xl font-black font-mono ${currentStatus.color}`}>{selectedHba1c.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 block">90-Day Avg Glucose (eAG)</span>
                  <span className="text-2xl font-black font-mono text-white">{estimatedAvgGlucose} <span className="text-xs font-normal text-slate-300">mg/dL</span></span>
                </div>
              </div>
              <div className="md:col-span-7">
                <div className={`text-xs font-mono font-bold uppercase tracking-wider mb-1 ${currentStatus.color}`}>
                  {currentStatus.label}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {currentStatus.advice}
                </p>
              </div>
            </div>
          </SpotlightCard>

          {/* Content */}
          <section className="space-y-6 text-slate-200 font-light text-base leading-relaxed font-sans">
            <p>
              When you receive a diagnostic pathology pack, seeing a marker labeled <strong className="text-white">HbA1c (Glycated Hemoglobin)</strong> with a percentage like <code className="text-emerald-400 font-mono">5.8%</code> or <code className="text-emerald-400 font-mono">6.5%</code> can immediately trigger anxiety. While finger-prick glucometer readings reflect blood sugar at a single moment in time, the HbA1c test captures your longitudinal metabolic baseline.
            </p>
            <p>
              In plain clinical language, <strong className="text-white">HbA1c measures your average blood glucose concentration over the preceding 90 to 120 days.</strong>
            </p>
            <p>
              Inside your bloodstream, red blood cells carry oxygen using a protein called hemoglobin. Circulating glucose naturally binds (glycates) to hemoglobin proportional to your blood sugar levels. Because red blood cells have an average lifespan of ~90–120 days, measuring the percentage of glycated hemoglobin reveals your true 3-month glycemic trajectory—unaffected by a single meal the night before your test.
            </p>

            {/* Ranges Table (Table-to-Card Responsive Pattern) */}
            <div className="py-6">
              <h3 className="text-white font-bold text-lg mb-4 tracking-wide uppercase text-emerald-400 font-mono">
                Clinical Reference Brackets (ICMR / RSSDI / ADA)
              </h3>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto border border-white/10 rounded-2xl">
                <table className="w-full text-left text-sm" aria-label="HbA1c Reference Ranges">
                  <thead>
                    <tr className="bg-[#0D2444] text-white border-b border-white/10 font-bold uppercase tracking-wider text-xs font-mono">
                      <th className="py-4 px-6">HbA1c Level (%)</th>
                      <th className="py-4 px-6">Est. Avg Glucose (eAG)</th>
                      <th className="py-4 px-6">Classification</th>
                      <th className="py-4 px-6">Plain-Language Clinical Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-light">
                    {tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-white whitespace-nowrap">{row.range}</td>
                        <td className="py-4 px-6 font-mono text-slate-300 whitespace-nowrap">{row.eag}</td>
                        <td className="py-4 px-6"><span className={row.categoryColor}>{row.category}</span></td>
                        <td className="py-4 px-6 leading-relaxed whitespace-normal break-words">{row.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Table-to-Cards View */}
              <div className="block md:hidden space-y-4">
                {tableData.map((row, idx) => (
                  <div key={idx} className={`border rounded-2xl p-5 space-y-3 whitespace-normal break-words ${row.cardColor}`}>
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-xs uppercase font-bold tracking-widest text-slate-400">HbA1c Range</span>
                      <span className="font-mono font-extrabold text-white">{row.range} ({row.eag})</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Classification</span>
                      <span className={row.categoryColor}>{row.category}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold tracking-widest text-slate-400 block mb-1">Plain-Language Meaning</span>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">{row.meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* India-specific Note Box */}
            <div className="border border-amber-500/30 rounded-2xl p-6 bg-amber-500/10 my-8">
              <p className="text-sm font-light text-amber-100 leading-relaxed">
                🇮🇳 <strong className="font-bold text-amber-300">Essential Clinical Context for Indian Households:</strong> Always evaluate HbA1c alongside your Complete Blood Count (CBC). In India, iron-deficiency anemia (low Hemoglobin/MCV) or hemoglobinopathies (such as beta-thalassemia trait) alter red blood cell turnover and can falsely elevate or lower HbA1c readings. Aegis Health AI's Endocrinology and Hematology agents automatically cross-check your CBC and HbA1c panels together.
              </p>
            </div>

            {/* Socratic Questions to Ask Doctor */}
            <div className="bg-[#0A192F]/90 border border-emerald-500/25 rounded-2xl p-6 md:p-8 my-8 font-sans">
              <h4 className="text-white font-bold text-base md:text-lg mb-4 flex items-center gap-2 text-emerald-400">
                <MessageCircle className="w-5 h-5 text-emerald-400" /> SBAR Questions to Bring to Your Physician
              </h4>
              <p className="text-xs md:text-sm font-light text-slate-300 mb-4 leading-relaxed">
                When Aegis generates your SBAR Doctor Handover PDF, it includes tailored questions like these for your next consultation:
              </p>
              <ol className="list-decimal pl-5 text-xs md:text-sm text-slate-200 space-y-3 leading-relaxed font-light">
                <li>"Given my age and lipid profile, what is my optimal 90-day HbA1c target percentage?"</li>
                <li>"Can we initiate a 12-week structured dietary intervention—replacing refined carbohydrates with low-GI millets and post-meal walking—before considering pharmacotherapy?"</li>
                <li>"Could my current Hemoglobin or MCV levels be influencing the accuracy of this HbA1c reading?"</li>
                <li>"Should we also check Fasting Insulin (HOMA-IR) or a Lipid Profile (Triglyceride-to-HDL ratio) to evaluate overall metabolic sensitivity?"</li>
              </ol>
            </div>
          </section>

          {/* Disclaimer section */}
          <footer className="mt-12 pt-6 border-t border-rose-500/20 text-xs text-slate-300 leading-relaxed font-sans relative">
            <div className="flex gap-2.5 items-start bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>
                <strong>Medical Disclaimer:</strong> This clinical guide is for health literacy and doctor visit preparation only. It does not constitute medical diagnosis or treatment advice. Always consult a qualified physician before altering diet or medication regimens.
              </p>
            </div>
          </footer>
        </article>
      </main>

      {/* Support CTA Strip */}
      <section className="relative overflow-hidden py-24 px-6 bg-[#0F2A4A] border-t border-white/10 text-center">
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">Track Your Longitudinal HbA1c Trajectory</h2>
          <p className="text-slate-200 text-sm md:text-base max-w-xl mb-8 leading-relaxed font-light">
            Sign in with our 1-click Reviewer account (which includes a real 3-report HbA1c reduction timeline from 6.3% → 5.8%) or upload your own lab PDF.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={openLoginModal}
              className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-[#0A192F] font-black uppercase text-xs tracking-widest rounded-full transition-all shadow-[0_0_25px_rgba(52,211,153,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Email / Reviewer Sign-In</span>
            </button>
            <Link 
              to="/dashboard"
              className="px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2"
            >
              <span>Launch Live Workspace</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>
            <Link 
              to="/blog-cbc.html"
              className="px-8 py-3.5 bg-[#0A192F] hover:bg-[#0E2444] text-slate-200 border border-white/10 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all"
            >
              Read CBC Guide
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function BlogHbA1c() {
  return (
    <InfoPageLayout activePath="/blog-hba1c">
      <BlogHbA1cContent />
    </InfoPageLayout>
  );
}
