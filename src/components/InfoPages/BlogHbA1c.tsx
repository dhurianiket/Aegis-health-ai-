import React from "react";
import InfoPageLayout from "./InfoPageLayout";
import { motion } from "motion/react";
import { Sparkles, Calendar, Clock, User, MessageCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function BlogHbA1c() {
  const tableData = [
    {
      range: "Below 5.7%",
      category: "Normal",
      categoryColor: "text-emerald-400 font-semibold",
      cardColor: "border-emerald-500/10 bg-emerald-500/5",
      meaning: "Your average blood sugar over the last 3 months is in a highly balanced, healthy reference range.",
    },
    {
      range: "5.7% to 6.4%",
      category: "Prediabetes",
      categoryColor: "text-amber-400 font-semibold",
      cardColor: "border-amber-500/10 bg-amber-500/5",
      meaning: "Your sugar levels are slightly higher than normal. This is an early, friendly warning sign. It suggests you can make simple adjustments to daily diet and hydration to support healthy returns.",
    },
    {
      range: "6.5% and Above",
      category: "Diabetes",
      categoryColor: "text-red-400 font-semibold",
      cardColor: "border-red-500/10 bg-red-500/5",
      meaning: "Your average sugar levels are high. If you see this, it indicates an important moment to work closely with your family physician to design a custom, active nutrition and movement plan.",
    },
  ];

  return (
    <InfoPageLayout activePath="/blog-hba1c">
      <main className="flex-1 bg-[#0A192F] py-16 px-4 md:px-6 font-sans">
        <article className="max-w-4xl mx-auto bg-[#0F2A4A]/50 border border-white/5 rounded-3xl p-6 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <header className="mb-10 text-center md:text-left border-b border-white/5 pb-8">
            <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-widest rounded-full uppercase mb-4">
              Blood Sugar Guide
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              What Does Your HbA1c Blood Report Mean?
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
              When you receive your health diagnostics pack, seeing a specific test labeled <strong className="text-white">HbA1c</strong> with a dry percentage like <code className="text-emerald-400 font-mono">5.8%</code> or <code className="text-emerald-400 font-mono">6.5%</code> can immediately trigger stress. While common finger-prick blood sugar tests reflect sugar parameters at that precise hour, the HbA1c test delivers a far wider, highly stable view.
            </p>
            <p>
              In plain words, <strong className="text-white">HbA1c measures your average blood sugar profile over the course of the preceding 3 months (about 90 days).</strong>
            </p>
            <p>
              This is possible due to a simple biological mechanism: inside our bloodstream travel microscopic delivery vehicles called red blood cells. Glucose in your blood naturally bonds with a key iron-carrying protein in these cells called hemoglobin. Because red blood cells survive on average for 90 days before regenerating, measuring the level of sugar bound to hemoglobin gives a highly stable metrics average. Best of all, it is completely immune to whatever you dined on the evening before the collection!
            </p>

            {/* Ranges Table (AGENTS.md Rule I: Table-to-Card Responsive Pattern) */}
            <div className="py-6">
              <h3 className="text-white font-bold text-lg mb-4 tracking-wide uppercase text-emerald-400">Understanding the HbA1c Ranges</h3>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto border border-white/5 rounded-2xl">
                <table className="w-full text-left text-sm" aria-label="HbA1c Reference Ranges">
                  <thead>
                    <tr className="bg-[#0D2444] text-white border-b border-white/10 font-bold uppercase tracking-wider text-xs">
                      <th className="py-4 px-6">HbA1c Level (%)</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">What this means in plain language</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-light">
                    {tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-white whitespace-nowrap">{row.range}</td>
                        <td className="py-4 px-6"><span className={row.categoryColor}>{row.category}</span></td>
                        <td className="py-4 px-6 leading-relaxed whitespace-normal break-words">{row.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Table-to-Cards View (Rule I compliance) */}
              <div className="block md:hidden space-y-4">
                {tableData.map((row, idx) => (
                  <div key={idx} className={`border rounded-2xl p-5 space-y-3 whitespace-normal break-words ${row.cardColor}`}>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Level Threshold</span>
                      <span className="font-mono font-extrabold text-white">{row.range}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Classification</span>
                      <span className={row.categoryColor}>{row.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Human Explanation</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{row.meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-white font-bold text-lg pt-4 tracking-wide">Key Lessons for Each Reference Range</h3>
            <p>
              Remember, diagnostic values are not ratings, tests of character, or sources of guilt. They simply serve as reliable markers to help your family schedule balanced dietary and active routines:
            </p>
            <ul className="list-disc pl-6 space-y-3 font-sans">
              <li>
                <strong className="text-white">Normal (Below 5.7%):</strong> Indicates healthy homeostasis. To keep this baseline, continue favoring home-cooked balanced diets and standard walking routines.
              </li>
              <li>
                <strong className="text-white">Prediabetes (5.7% to 6.4%):</strong> This is a highly common transitional phase. Many Indian families have successfully managed or completely reversed prediabetic profiles by introducing minor dietary refinements—such as replacing white processed rice and maida with whole local grains like ragi, jowar, or oats, and taking an unhurried, comfortable 15-minute walk after lunch or dinner.
              </li>
              <li>
                <strong className="text-white">Diabetes (6.5% and Above):</strong> Suggests clinical care is recommended. With simple lifestyle refinements, physical habits, and structured guidance from your primary care physician, blood sugar levels can be managed safely to enable a long, happy life.
              </li>
            </ul>

            {/* India-specific Note Box */}
            <div className="border border-amber-500/20 rounded-2xl p-6 bg-amber-500/5 my-8">
              <p className="text-sm font-light text-amber-200 leading-relaxed">
                🇮🇳 <strong className="font-bold text-amber-300">An Essential Perspective for Indian Families:</strong> Always review your HbA1c values alongside your overall blood count. In India, factors such as iron deficiency anemia (which is highly prevalent, especially among women) or certain inherited hemoglobin traits can sometimes make HbA1c readings appear falsely elevated or depleted. A qualified doctor will analyze your total wellness picture—never just a single number!
              </p>
            </div>

            {/* Socratic Questions to Ask Doctor */}
            <div className="bg-[#0F2A4A] border border-white/10 rounded-2xl p-6 md:p-8 my-8 font-sans">
              <h4 className="text-white font-bold text-base md:text-lg mb-4 flex items-center gap-2 text-emerald-400">
                <MessageCircle className="w-5 h-5 text-emerald-400" /> 📝 Simple Questions to Ask Your Doctor
              </h4>
              <p className="text-xs md:text-sm font-light text-slate-300 mb-4 leading-relaxed">
                When you next consult with your family physician to review your reports, you can use these simple, open questions to guide a comfortable discussion:
              </p>
              <ol className="list-decimal pl-5 text-xs md:text-sm text-slate-300 space-y-3 leading-relaxed font-light">
                <li>"Reviewing my current routine and age, what is an optimal HbA1c percentage target for me over the next 90 days?"</li>
                <li>"Could we start with focused culinary adjustments—like incorporating traditional millets and scheduling short, pleasant strolls—first, before considering any therapies?"</li>
                <li>"Are there specific regional foods or traditional pairings you recommend to help minimize sugar surges?"</li>
                <li>"Is it possible that other details, like my blood cell count or anemia, could be affecting this HbA1c result?"</li>
                <li>"When would you recommend we run our next follow-up panel to review our adjustments?"</li>
              </ol>
            </div>

            <h3 className="text-white font-bold text-lg pt-4 tracking-wide">Secure Diagnostics Chronology</h3>
            <p>
              Because biological biomarkers fluctuate slowly across seasons, focusing on a single isolated metric rarely tells the entire story. What truly counts is your trend line over time.
            </p>
            <p>
              Aegis is engineered to make tracking safe and private. By plotting successive HbA1c lab sheets, you can visually inspect whether your indices are steady, improving, or requiring adjustments. Watching your index graph move in a balanced direction is a wonderful, comforting experience!
            </p>
          </section>

          {/* Disclaimer section */}
          <footer className="mt-12 pt-6 border-t border-red-500/20 text-xs text-slate-500 leading-relaxed font-sans relative">
            <div className="flex gap-2 items-start bg-red-500/5 border border-red-500/10 rounded-xl p-4">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p>
                <strong>Medical Disclaimer:</strong> Aegis Health AI is for informational purposes only. It does not diagnose, treat, or replace an active partnership with a professional healthcare provider. All reference levels mentioned represent standard guidelines for general health awareness. Never modify therapeutic dosages or make clinical decisions without direct guidance from your doctor.
              </p>
            </div>
          </footer>
        </article>
      </main>

      {/* Support CTA Strip */}
      <section className="relative overflow-hidden py-24 px-6 bg-[#0F2A4A] border-t border-white/5 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Track Your Blood Sugar Trends Safely</h2>
          <p className="text-slate-300 text-sm max-w-xl mb-8 leading-relaxed font-light">
            Upload your previous lab history to easily visualize, compare, and manage your HbA1c and lipid metrics over time in a secure dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard"
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-[#0A192F] font-extrabold uppercase text-xs tracking-widest rounded-full transition-all"
            >
              Open Aegis Vault
            </Link>
            <Link 
              to="/blog-cbc.html"
              className="px-8 py-3.5 bg-[#0A192F] hover:bg-[#0E2444] text-white border border-white/10 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all"
            >
              Read CBC Guide
            </Link>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
}
