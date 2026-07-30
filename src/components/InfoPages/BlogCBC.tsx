import React from "react";
import InfoPageLayout from "./InfoPageLayout";
import { motion } from "motion/react";
import { Sparkles, Calendar, Clock, User, Heart, MessageCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function BlogCBC() {
  const componentsData = [
    {
      name: "Red Blood Cells (RBC)",
      desc: "These are delivery vehicles that carry vital oxygen from your lungs to the rest of your tissues, keeping you active and energetic.",
      low: "May suggest anemia or minor blood loss, which can make you feel tired, cold, or short of breath.",
      high: "Often indicates simple dehydration—meaning your body needs more water.",
      color: "border-red-500/10 bg-red-500/5",
    },
    {
      name: "Hemoglobin (Hb/Hgb)",
      desc: "An iron-rich protein inside your red blood cells that actually binds onto and transports oxygen.",
      low: "Suggests iron-deficiency anemia—highly common in India, causing feeling cold, low stamina, or pale skin.",
      high: "Can happen with mild dehydration or when staying at higher altitudes where oxygen is thinner.",
      color: "border-rose-500/10 bg-rose-500/5",
    },
    {
      name: "White Blood Cells (WBC)",
      desc: "These are your body's natural defense team, working hard to protect you and fight off standard germs or infections.",
      low: "Could mean a standard viral fever has temporarily depleted your defenders, or suggest nutritional gaps.",
      high: "Often suggests your immune system is actively fighting an infection (fever/cold) or responding to temporary stress.",
      color: "border-blue-500/10 bg-blue-500/5",
    },
    {
      name: "Platelets (PLT)",
      desc: "Special tiny cell fragments that join together to form solid seals to stop bleeding when you get a cut or scratch.",
      low: "Can increase easy bruising. In India, seasonal viral conditions like Dengue are well-known to temporarily lower platelets.",
      high: "Can indicate that your tissue is healing after inflammation, physical injury, or mild blood loss.",
      color: "border-indigo-500/10 bg-indigo-500/5",
    },
    {
      name: "Hematocrit (HCT)",
      desc: "The actual percentage of your total blood volume that is composed of active red blood cells.",
      low: "Usually aligns with anemia profiles or having significant fluid reserves in the body.",
      high: "Frequently indicates simple dehydration, as there is less fluid in your vessels, making blood cells look concentrated.",
      color: "border-cyan-500/10 bg-cyan-500/5",
    },
  ];

  return (
    <InfoPageLayout activePath="/blog-cbc">
      <main className="flex-1 bg-[#0A192F] py-16 px-4 md:px-6 font-sans">
        <article className="max-w-4xl mx-auto bg-[#0F2A4A]/50 border border-white/5 rounded-3xl p-6 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <header className="mb-10 text-center md:text-left border-b border-white/5 pb-8 font-sans">
            <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-widest rounded-full uppercase mb-4">
              Blood Test Guide
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Understanding Your Complete Blood Count (CBC) Report
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-400 text-xs md:text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <User className="w-4 h-4 text-emerald-400" /> By Aniket Dhuri
              </span>
              <span className="hidden md:inline">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" /> May 27, 2026
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> 6 Min Read
              </span>
            </div>
          </header>

          {/* Content */}
          <section className="space-y-6 text-slate-300 font-light text-base leading-relaxed font-sans">
            <p>
              When you go for a general health check-up, one of the first panels your doctor will order is a <strong className="text-white">Complete Blood Count (CBC)</strong>. It acts as a general baseline indicator, giving a quick overview of your overall physical health.
            </p>
            <p>
              Instead of looking at it as a complicated clinical wall of numbers, you can think of it as a team progress report of your body's main cells. It helps doctors quickly analyze for highly treatable issues like anemia, minor infections, or other daily wellness factors.
            </p>

            {/* Core Components Table (AGENTS.md Rule I compliance: Table-to-Card Pattern) */}
            <div className="py-6">
              <h3 className="text-white font-bold text-lg mb-4 tracking-wide uppercase text-emerald-400">The Five Main Components of Your CBC</h3>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto border border-white/5 rounded-2xl">
                <table className="w-full text-left text-sm" aria-label="CBC Major Components">
                  <thead>
                    <tr className="bg-[#0D2444] text-white border-b border-white/10 font-bold uppercase tracking-wider text-xs">
                      <th className="py-4 px-6">Component</th>
                      <th className="py-4 px-6">What it does in the body</th>
                      <th className="py-4 px-6">Lower Level Meaning</th>
                      <th className="py-4 px-6">Higher Level Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-light">
                    {componentsData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 font-bold text-white whitespace-nowrap">{row.name}</td>
                        <td className="py-4 px-6 max-w-xs">{row.desc}</td>
                        <td className="py-4 px-6 text-slate-300 max-w-xs">{row.low}</td>
                        <td className="py-4 px-6 text-slate-300 max-w-xs">{row.high}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Table-to-Cards View */}
              <div className="block md:hidden space-y-4">
                {componentsData.map((row, idx) => (
                  <div key={idx} className={`border rounded-2xl p-5 space-y-3 whitespace-normal break-words ${row.color}`}>
                    <div className="border-b border-white/5 pb-2">
                      <span className="text-xs uppercase font-bold tracking-widest text-[#0A192F] bg-emerald-400 px-2 py-0.5 rounded-full font-mono inline-block mb-1">
                        Marker
                      </span>
                      <h4 className="text-white font-bold text-base">{row.name}</h4>
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Biological Function</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{row.desc}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <div className="bg-[#0A192F]/50 p-3 rounded-lg border border-white/5">
                        <span className="text-xs uppercase font-bold tracking-widest text-amber-400 block mb-0.5">If levels are low</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{row.low}</p>
                      </div>
                      <div className="bg-[#0A192F]/50 p-3 rounded-lg border border-white/5">
                        <span className="text-xs uppercase font-bold tracking-widest text-cyan-400 block mb-0.5">If levels are high</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{row.high}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note Box */}
            <div className="border border-blue-500/20 rounded-2xl p-6 bg-blue-500/5 my-8">
              <p className="text-sm font-light text-blue-200 leading-relaxed">
                ⚠️ <strong className="font-bold text-blue-300">An Important Note on Reference Ranges:</strong> Standard blood ranges vary slightly based on your age, sex, other medical indicators, and the custom reference machinery utilized by the lab performing your extraction. Having a parameter value slightly outside index thresholds is frequently fully benign, which is why a professional clinician's personal review is completely essential.
              </p>
            </div>

            <h3 className="text-white font-bold text-lg pt-4 tracking-wide">Why Do Doctors Request a CBC?</h3>
            <p>
              Your white and red blood counts react dynamically to shifts inside your body. Frequently, your doctor will order this diagnostic package to check for:
            </p>
            <ul className="list-disc pl-6 space-y-3 font-sans">
              <li>
                <strong className="text-white">Tiredness and Fatigue:</strong> If you find yourself constantly exhausted, a CBC helps check if your Red Blood Cells and Hemoglobin levels are healthy.
              </li>
              <li>
                <strong className="text-white">Checking for Infections:</strong> If you are running a temperature, a higher White Blood Cell count helps doctors understand that your immune system is actively defending your body.
              </li>
              <li>
                <strong className="text-white">Easy Bruising or Bleeding:</strong> Looking at your Platelets can tell doctors if your blood is clotting normally.
              </li>
              <li>
                <strong className="text-white">General Wellness:</strong> Often, a CBC is simply part of a standard annual physical check-up to ensure your body is in balance.
              </li>
            </ul>

            {/* Socratic Questions */}
            <div className="bg-[#0F2A4A] border border-white/10 rounded-2xl p-6 md:p-8 my-8 font-sans">
              <h4 className="text-white font-bold text-base md:text-lg mb-4 flex items-center gap-2 text-emerald-400">
                <MessageCircle className="w-5 h-5 text-emerald-400" /> 📝 Simple Questions to Ask Your Doctor
              </h4>
              <p className="text-xs md:text-sm font-light text-slate-300 mb-4 leading-relaxed">
                Instead of searching individual metrics online, you can use these simple questions to guide your next family doctor consult:
              </p>
              <ol className="list-decimal pl-5 text-xs md:text-sm text-slate-300 space-y-3 leading-relaxed font-light">
                <li>"Are my red blood cells and hemoglobin parameters in a healthy range, or do they suggest minor anemia?"</li>
                <li>"If my Hb levels are slightly low, what simple iron-dense local foods do you recommend I incorporate?"</li>
                <li>"Is my white blood count normal, or does it suggest my body is actively managing a minor fever?"</li>
                <li>"Do any of my results suggest I might be mildly dehydrated or lacking some common vitamins?"</li>
                <li>"Are there regular tracking guidelines we should follow, or does everything look stable on this cycle?"</li>
              </ol>
            </div>

            <h3 className="text-white font-bold text-lg pt-4 tracking-wide font-sans">How Aegis Helps You Track Trends</h3>
            <p>
              While a single isolated hematology report provides a helpful snapshot today, what truly matters is the trend line over a period of time. Watching your Hemoglobin levels steadily improve after adding iron-rich foods, or seeing your platelets recover after a fever, is incredibly reassuring.
            </p>
            <p>
              Aegis makes it easy to track your CBC results over time securely. By plotting your history chronologically, you can see trends, monitor stable levels, and feel more confident and informed during your doctor visits.
            </p>
          </section>

          {/* Medical Disclaimer */}
          <footer className="mt-12 pt-6 border-t border-red-500/20 text-xs text-slate-300 leading-relaxed font-sans relative">
            <div className="flex gap-2 items-start bg-red-500/5 border border-red-500/10 rounded-xl p-4">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p>
                <strong>Medical Disclaimer:</strong> Aegis Health AI is for informational purposes only. It does not diagnose, treat, or replace an active partnership with a professional healthcare provider. All reference levels mentioned represent standard guidelines for general health awareness. Never modify therapeutic dosages or make clinical decisions without direct guidance from your doctor.
              </p>
            </div>
          </footer>
        </article>
      </main>

      {/* Interactive Support CTA Strip */}
      <section className="relative overflow-hidden py-24 px-6 bg-[#0F2A4A] border-t border-white/5 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Decode Your Hematology Report Instantly</h2>
          <p className="text-slate-300 text-sm max-w-xl mb-8 leading-relaxed font-light">
            Upload your CBC testing sheet safely in our secure sandbox interface. Empower your family with clear explanations in plain language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard"
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-[#0A192F] font-extrabold uppercase text-xs tracking-widest rounded-full transition-all"
            >
              Try Aegis Sandbox
            </Link>
            <Link 
              to="/blog-hba1c.html"
              className="px-8 py-3.5 bg-[#0A192F] hover:bg-[#0E2444] text-white border border-white/10 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all"
            >
              Read HbA1c Guide
            </Link>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
}
