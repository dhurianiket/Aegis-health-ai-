import React, { useState } from "react";
import InfoPageLayout, { useInfoPageLogin } from "./InfoPageLayout";
import { Sparkles, Calendar, Clock, User, MessageCircle, AlertCircle, Stethoscope, Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SpotlightCard } from "../ui/SpotlightCard";
import { DecryptedText } from "../ui/DecryptedText";

function BlogCBCContent() {
  const { openLoginModal } = useInfoPageLogin();
  const [activeMarkerIdx, setActiveMarkerIdx] = useState(0);

  const componentsData = [
    {
      name: "Hemoglobin (Hb / Hgb)",
      loinc: "LOINC 718-7",
      refRange: "Male: 13.5–17.5 g/dL | Female: 12.0–15.5 g/dL",
      desc: "The iron-containing metalloprotein inside red blood cells that binds oxygen in the lungs and delivers it to every organ and muscle.",
      low: "Indicates anemia (most commonly iron-deficiency or B12/folate deficiency in India), presenting as fatigue, cold hands, or exertional breathlessness.",
      high: "Frequently reflects hemoconcentration from mild dehydration, high-altitude adaptation, or smoking.",
      indianPearl: "Combining Hemoglobin with MCV (Mean Corpuscular Volume) helps doctors distinguish microcytic iron deficiency (low MCV) from macrocytic Vitamin B12 deficiency (high MCV).",
      color: "border-rose-500/20 bg-rose-500/5",
    },
    {
      name: "Red Blood Cells (RBC) & MCV",
      loinc: "LOINC 789-8 / 787-2",
      refRange: "RBC: 4.2–5.9 ×10⁶/µL | MCV: 80–100 fL",
      desc: "Microscopic biconcave discs that circulate for ~120 days transporting oxygen and carbon dioxide across tissues.",
      low: "Suggests nutritional anemia (iron, B12, folate) or chronic inflammation.",
      high: "Can occur with dehydration or compensatory erythrocytosis; high RBC count with low MCV can also be seen in beta-thalassemia trait.",
      indianPearl: "In Indian populations, a borderline-low Hemoglobin with an elevated RBC count and very low MCV (< 72 fL) is a classic pattern doctors screen for beta-thalassemia carrier status.",
      color: "border-red-500/20 bg-red-500/5",
    },
    {
      name: "White Blood Cells (WBC / TLC)",
      loinc: "LOINC 6690-2",
      refRange: "4,000 – 11,000 cells/µL (4.0–11.0 ×10³/µL)",
      desc: "Your immune system's primary cellular defense force—comprising Neutrophils, Lymphocytes, Monocytes, Eosinophils, and Basophils.",
      low: "Leukopenia—frequently seen transiently during viral infections (dengue, influenza, typhoid) or vitamin deficiencies.",
      high: "Leukocytosis—indicates active immune mobilization against bacterial infection, systemic inflammation, or physiological stress.",
      indianPearl: "Elevated Eosinophils (Eosinophilia > 6%) on a CBC differential in India often points toward seasonal allergic rhinitis, dust mite sensitivity, or tropical parasitic exposure.",
      color: "border-cyan-500/20 bg-cyan-500/5",
    },
    {
      name: "Platelets (Thrombocytes / PLT)",
      loinc: "LOINC 777-3",
      refRange: "150,000 – 450,000 /µL (1.5 – 4.5 Lakh/cumm)",
      desc: "Cytoplasmic cell fragments that adhere and aggregate at sites of vascular injury to initiate primary blood clotting.",
      low: "Thrombocytopenia—can cause easy bruising or petechiae; commonly triggered in India by seasonal viral fevers such as Dengue or malaria.",
      high: "Reactive thrombocytosis—often a secondary response to iron-deficiency anemia, tissue recovery, or acute inflammation.",
      indianPearl: "During monsoon viral fevers, tracking serial platelet velocity (rate of change over 24–48 hours) alongside Hematocrit (HCT) is far more informative to clinicians than a single isolated reading.",
      color: "border-indigo-500/20 bg-indigo-500/5",
    },
    {
      name: "Hematocrit (HCT / PCV) & RDW-CV",
      loinc: "LOINC 4544-3 / 788-0",
      refRange: "HCT: 36%–50% | RDW-CV: 11.5%–14.5%",
      desc: "HCT measures the volume percentage of red blood cells in whole blood; RDW-CV measures variation in red cell size (anisocytosis).",
      low: "Low HCT parallels anemia or hemodilution.",
      high: "Elevated HCT (> 48–50%) often signals dehydration or plasma leakage; elevated RDW-CV is one of the earliest markers of mixed iron/B12 deficiency.",
      indianPearl: "RDW-CV often rises weeks before Hemoglobin drops below the reference bracket—making it a powerful early-warning marker for nutritional depletion.",
      color: "border-emerald-500/20 bg-emerald-500/5",
    },
  ];

  const activeMarker = componentsData[activeMarkerIdx];

  return (
    <>
      <main className="flex-1 bg-[#0A192F] py-16 px-4 md:px-6 font-sans">
        <article className="max-w-4xl mx-auto bg-[#0F2A4A]/60 border border-white/10 rounded-3xl p-6 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <header className="mb-10 text-center md:text-left border-b border-white/10 pb-8 font-sans">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-widest rounded-full uppercase mb-4">
              <Stethoscope className="w-3.5 h-3.5" />
              <DecryptedText text="HEMATOLOGY CLINICAL GUIDE • HL7 FHIR PANEL" animateOn="view" speed={35} />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
              Understanding Your <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Complete Blood Count (CBC)</span> Report
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-400 text-xs md:text-sm font-mono">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <User className="w-4 h-4 text-emerald-400" /> By Aniket Rajesh Dhuri
              </span>
              <span className="hidden md:inline">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" /> Grounded in ICMR Hematology Standards
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> 6 Min Read
              </span>
            </div>
          </header>

          {/* Interactive CBC Marker Inspector */}
          <SpotlightCard
            spotlightColor="rgba(16, 185, 129, 0.18)"
            className="mb-10 bg-[#0A192F]/90 border border-emerald-500/30 rounded-2xl p-6 md:p-8 shadow-xl"
          >
            <div className="mb-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                Interactive Hematology Inspector
              </span>
              <h2 className="text-xl font-extrabold text-white">
                Click Any CBC Parameter to Inspect Reference Brackets &amp; Clinical Context
              </h2>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {componentsData.map((m, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveMarkerIdx(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeMarkerIdx === idx
                      ? "bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-[#0F2A4A]/90 border border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-lg font-black text-white">{activeMarker.name}</h3>
                  <span className="text-xs font-mono text-emerald-300">Typical Adult Range: {activeMarker.refRange}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                  {activeMarker.loinc}
                </span>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed">{activeMarker.desc}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <span className="font-mono font-bold uppercase text-amber-300 block mb-1">↓ Below Reference Range</span>
                  <p className="text-slate-200 leading-relaxed">{activeMarker.low}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
                  <span className="font-mono font-bold uppercase text-cyan-300 block mb-1">↑ Above Reference Range</span>
                  <p className="text-slate-200 leading-relaxed">{activeMarker.high}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-100">
                <strong className="text-emerald-300 font-mono uppercase">🇮🇳 Indian Clinical Pearl: </strong>
                {activeMarker.indianPearl}
              </div>
            </div>
          </SpotlightCard>

          {/* Content */}
          <section className="space-y-6 text-slate-200 font-light text-base leading-relaxed font-sans">
            <p>
              When you visit a clinic for an annual wellness check-up or fever evaluation, the first diagnostic panel ordered is almost always a <strong className="text-white">Complete Blood Count (CBC)</strong>. Rather than viewing it as an intimidating wall of abbreviations (<code className="text-emerald-300 font-mono">MCV</code>, <code className="text-emerald-300 font-mono">MCHC</code>, <code className="text-emerald-300 font-mono">RDW-CV</code>, <code className="text-emerald-300 font-mono">ANC</code>), think of a CBC as a quantitative census of the three primary cell lineages circulating in your bloodstream.
            </p>

            {/* Core Components Table (Table-to-Card Pattern) */}
            <div className="py-6">
              <h3 className="text-white font-bold text-lg mb-4 tracking-wide uppercase text-emerald-400 font-mono">
                Complete CBC Reference Matrix
              </h3>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto border border-white/10 rounded-2xl">
                <table className="w-full text-left text-sm" aria-label="CBC Major Components">
                  <thead>
                    <tr className="bg-[#0D2444] text-white border-b border-white/10 font-bold uppercase tracking-wider text-xs font-mono">
                      <th className="py-4 px-5">Biomarker</th>
                      <th className="py-4 px-5">Physiological Function</th>
                      <th className="py-4 px-5">Lower Level Context</th>
                      <th className="py-4 px-5">Higher Level Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-light">
                    {componentsData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-5 font-bold text-white whitespace-nowrap">
                          {row.name}
                          <span className="block text-[10px] font-mono text-emerald-400 mt-0.5">{row.loinc}</span>
                        </td>
                        <td className="py-4 px-5 max-w-xs">{row.desc}</td>
                        <td className="py-4 px-5 text-slate-300 max-w-xs">{row.low}</td>
                        <td className="py-4 px-5 text-slate-300 max-w-xs">{row.high}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Table-to-Cards View */}
              <div className="block md:hidden space-y-4">
                {componentsData.map((row, idx) => (
                  <div key={idx} className={`border rounded-2xl p-5 space-y-3 whitespace-normal break-words ${row.color}`}>
                    <div className="border-b border-white/10 pb-2">
                      <span className="text-xs uppercase font-bold tracking-widest text-[#0A192F] bg-emerald-400 px-2 py-0.5 rounded-full font-mono inline-block mb-1">
                        {row.loinc}
                      </span>
                      <h4 className="text-white font-bold text-base">{row.name}</h4>
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Biological Function</span>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">{row.desc}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <div className="bg-[#0A192F]/60 p-3 rounded-lg border border-white/5">
                        <span className="text-xs uppercase font-bold tracking-widest text-amber-400 block mb-0.5">If levels are low</span>
                        <p className="text-xs text-slate-200 leading-relaxed">{row.low}</p>
                      </div>
                      <div className="bg-[#0A192F]/60 p-3 rounded-lg border border-white/5">
                        <span className="text-xs uppercase font-bold tracking-widest text-cyan-400 block mb-0.5">If levels are high</span>
                        <p className="text-xs text-slate-200 leading-relaxed">{row.high}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Socratic Questions */}
            <div className="bg-[#0A192F]/90 border border-emerald-500/25 rounded-2xl p-6 md:p-8 my-8 font-sans">
              <h4 className="text-white font-bold text-base md:text-lg mb-4 flex items-center gap-2 text-emerald-400">
                <MessageCircle className="w-5 h-5 text-emerald-400" /> SBAR Questions to Ask Your Physician
              </h4>
              <p className="text-xs md:text-sm font-light text-slate-300 mb-4 leading-relaxed">
                Bring these structured questions from your Aegis SBAR report to your next primary care consultation:
              </p>
              <ol className="list-decimal pl-5 text-xs md:text-sm text-slate-200 space-y-3 leading-relaxed font-light">
                <li>"Looking at my Hemoglobin alongside MCV and RDW-CV, does my profile suggest iron depletion, Vitamin B12 deficiency, or healthy red cell turnover?"</li>
                <li>"Should we order a Serum Ferritin, TIBC, or Vitamin B12 test to pinpoint the root cause of borderline anemia?"</li>
                <li>"Does my WBC differential (Neutrophil-to-Lymphocyte ratio or Eosinophil percentage) point toward a viral recovery or seasonal allergy?"</li>
                <li>"How does today's CBC compare against my baseline from 6 months ago?"</li>
              </ol>
            </div>
          </section>

          {/* Medical Disclaimer */}
          <footer className="mt-12 pt-6 border-t border-rose-500/20 text-xs text-slate-300 leading-relaxed font-sans relative">
            <div className="flex gap-2.5 items-start bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>
                <strong>Medical Disclaimer:</strong> Aegis Health AI is an informational clinical literacy platform and does not diagnose, treat, or replace a licensed physician. Reference ranges vary by laboratory analyzer, age, and biological sex.
              </p>
            </div>
          </footer>
        </article>
      </main>

      {/* Interactive Support CTA Strip */}
      <section className="relative overflow-hidden py-24 px-6 bg-[#0F2A4A] border-t border-white/10 text-center">
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">Decode Your CBC &amp; Hematology Report Instantly</h2>
          <p className="text-slate-200 text-sm md:text-base max-w-xl mb-8 leading-relaxed font-light">
            Explore our interactive demo or upload your CBC PDF into our isolated Google Cloud workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={openLoginModal}
              className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-[#0A192F] font-black uppercase text-xs tracking-widest rounded-full transition-all shadow-[0_0_25px_rgba(52,211,153,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <Link 
              to="/dashboard"
              className="px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2"
            >
              <span>Launch Live Workspace</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>
            <Link 
              to="/blog-hba1c.html"
              className="px-8 py-3.5 bg-[#0A192F] hover:bg-[#0E2444] text-slate-200 border border-white/10 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all"
            >
              Read HbA1c Guide
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function BlogCBC() {
  return (
    <InfoPageLayout activePath="/blog-cbc">
      <BlogCBCContent />
    </InfoPageLayout>
  );
}
