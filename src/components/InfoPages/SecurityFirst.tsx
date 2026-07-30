import React from "react";
import InfoPageLayout from "./InfoPageLayout";
import { motion } from "motion/react";
import { Lock, ShieldCheck, Database, Trash2, EyeOff, AlertOctagon, Mail, Settings, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function SecurityFirst() {
  const pillars = [
    {
      icon: <Lock className="w-6 h-6 text-emerald-400" />,
      title: "Private family workspaces",
      desc: "Every lab report you upload and its parsed details are stored inside your own private, secure folder. No one else can see or access your family's personal files.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: "Shielded app tunnels",
      desc: "Aegis connects to our AI translation backend using safe, hidden servers. We never expose raw API keys or credentials in the browser, keeping all communication lines highly secure.",
    },
    {
      icon: <EyeOff className="w-6 h-6 text-emerald-400" />,
      title: "Minimal parameter reading",
      desc: "Our platform is made to look only for standard blood and biomarker values. It ignores other private texts on your documents, processing only the essential metrics needed to explain your report.",
    },
  ];

  const pledges = [
    {
      title: "We never sell or share your health data",
      desc: "We do not share, lease, trade, or sell your health metrics to insurance companies, advertising agencies, or pharmaceutical businesses.",
    },
    {
      title: "We never display advertisement banners",
      desc: "No annoying pop-up ads, target campaigns, or marketing tracking scripts infect your dashboard or clean reading workspace.",
    },
    {
      title: "We never use your data to train AI models",
      desc: "Your personal diagnostic values and uploaded report files are never used to train or improve external machine-learning models.",
    },
    {
      title: "We never keep files longer than needed",
      desc: "We do not keep permanent records for inactive accounts. You can wipe your data instantly, and we auto-delete temporary files quickly.",
    },
  ];

  return (
    <InfoPageLayout activePath="/security">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 bg-gradient-to-b from-[#0A192F] via-[#0D2444] to-[#0A192F] text-center border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 font-sans">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-widest rounded-full uppercase mb-4"
          >
            Data Protection
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6"
          >
            Your Health Data. Fully Yours.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Aegis is built from the ground up to keep your personal health information private, safe, and completely under your control.
          </motion.p>
        </div>
      </section>

      {/* Security Architecture Pillars */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">How We Keep Your Information Safe</h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto font-light">Simple, robust protections built to give you and your family ultimate peace of mind</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pillars.map((item, idx) => (
            <div 
              key={idx}
              className="bg-[#0F2A4A] border border-white/5 rounded-2xl p-8 hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.03)] transition-all flex flex-col gap-6"
            >
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-3 tracking-wide">{item.title}</h3>
                <p className="text-sm text-slate-300 font-light leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DPDP Act India Alignment */}
      <section className="bg-[#0D2444]/40 py-24 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Content */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">Regulatory Commitment</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">Aligned with India's Privacy Safeguards</h2>
            <p className="text-slate-300 font-light text-base leading-relaxed">
              Aegis is built in full alignment with India's <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>. We make sure you have complete authority over your information through simple, direct choices:
            </p>
            <ul className="space-y-4 text-sm text-slate-300 font-light leading-relaxed">
              <li className="flex gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <p>
                  <strong>Active Opt-In Consent:</strong> We will never read or process any file until you accept and click our clear opt-in consent box.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <p>
                  <strong>Only What's Necessary:</strong> We collect only the bare parameters required to construct your health trend charts. We never ask for intrusive background documents.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <p>
                  <strong>Your Right to Seek Erase:</strong> You have the absolute right to view past analyses, request direct logs, or trigger permanent data-wipes instantly.
                </p>
              </li>
            </ul>
          </div>

          {/* Graphics Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-[#0F2A4A] border border-white/10 rounded-2xl p-8 space-y-4 relative">
              <span className="text-xs uppercase tracking-widest font-mono text-slate-400 block mb-2">🇮🇳 DPDP SAFETY REGISTER</span>
              <div className="bg-[#0A192F] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Active Consent</span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono">STATUS: OPT-IN</span>
              </div>
              <div className="bg-[#0A192F] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Instant Purging</span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono">STATUS: AVAILABLE</span>
              </div>
              <div className="bg-[#0A192F] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Minimization</span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono">STATUS: ENFORCED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Absolutely What We NEVER Do */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="bg-red-950/10 border border-red-500/15 rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-3 text-red-400 font-bold tracking-wider text-xs uppercase mb-6">
            <AlertOctagon className="w-5 h-5" />
            <span>OUR PLEDGE TO YOU</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">What We NEVER Do</h2>
          <p className="text-slate-300 text-sm mb-10 leading-relaxed max-w-3xl font-light">
            To earn your trust and keep your family's confidence, we follow four absolute, non-negotiable architectural rules:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-300">
            {pledges.map((p, idx) => (
              <div key={idx} className="space-y-2 border-l border-red-500/20 pl-4">
                <h4 className="text-white font-bold text-base leading-snug flex items-center gap-1.5">
                  <span className="text-red-400 font-normal select-none">❌</span>
                  {p.title}
                </h4>
                <p className="text-slate-400 font-light leading-relaxed text-xs md:text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Direct Erasure Walkthrough */}
      <section className="py-24 px-6 bg-[#0E1F35]/30 border-t border-white/5 font-sans">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Trash2 className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-white mb-3">Delete Your Records Instantly</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto font-light leading-relaxed">
              Your health data is yours to keep, and yours to delete. We make it simple and direct to completely erase your footprint at any time.
            </p>
          </div>

          <div className="bg-[#0F2A4A] border border-white/5 rounded-2xl p-6 md:p-10 space-y-8">
            <div>
              <h3 className="text-white font-bold text-base md:text-lg mb-3 flex items-center gap-2 uppercase tracking-wide text-emerald-400">
                <Settings className="w-4 h-4" /> Option 1: Self-Service Dashboard Deletion
              </h3>
              <ol className="list-decimal pl-6 text-xs md:text-sm text-slate-300 space-y-2.5 font-light leading-relaxed">
                <li>Open your <strong>Settings</strong> tab side-panel inside the application dashboard.</li>
                <li>Scroll down to the <strong>Data Controls & Privacy Settings</strong> section.</li>
                <li>Click the <strong>Delete My Profile and Data</strong> button.</li>
                <li>Confirm your choice. The system will instantly execute a full database delete cascade, purging your profile, saved documents, chat logs, and trend files instantly with zero cache residue.</li>
              </ol>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h3 className="text-white font-bold text-base md:text-lg mb-3 flex items-center gap-2 uppercase tracking-wide text-emerald-400">
                <Mail className="w-4 h-4" /> Option 2: Email Deletion Inquiry
              </h3>
              <p className="text-xs md:text-sm text-slate-300 font-light leading-relaxed">
                If you prefer a manual removal audit, send an email to:{" "}
                <a href="mailto:support@aegishealthai.co.in" className="text-emerald-300 underline font-semibold">
                  support@aegishealthai.co.in
                </a>{" "}
                with the subject line: <strong>Data Deletion Request</strong>. We will verify and process your account termination audit manually within <strong>72 hours</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="relative overflow-hidden py-24 px-6 bg-[#0F2A4A] border-t border-white/5 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Start Decrypting with Peace of Mind</h2>
          <p className="text-slate-300 text-sm max-w-xl mb-8 leading-relaxed font-light">
            Understand your diagnostic levels under complete, user-locked privacy. Zero ads, zero corporate model training pools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard"
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-[#0A192F] font-extrabold uppercase text-xs tracking-widest rounded-full transition-all"
            >
              Launch Sandbox
            </Link>
            <Link 
              to="/how-it-works.html"
              className="px-8 py-3.5 bg-[#0A192F] hover:bg-[#0E2444] text-white border border-white/10 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
}
