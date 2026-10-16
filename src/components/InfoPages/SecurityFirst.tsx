import React from "react";
import InfoPageLayout, { useInfoPageLogin } from "./InfoPageLayout";
import { motion } from "motion/react";
import { Lock, ShieldCheck, Trash2, EyeOff, AlertOctagon, Mail, Settings, Sparkles, Server, FileCode2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SpotlightCard } from "../ui/SpotlightCard";
import { DecryptedText } from "../ui/DecryptedText";

function SecurityFirstContent() {
  const { openLoginModal } = useInfoPageLogin();

  const pillars = [
    {
      icon: <Lock className="w-6 h-6 text-emerald-400" />,
      badge: "Firestore Path Sandboxing",
      title: "Zero-Knowledge Family Vaults",
      desc: "Every uploaded diagnostic report and normalized FHIR R4 biomarker is isolated inside your cryptographically enforced user path (users/{userId}/*). Cross-tenant reads are impossible at the database rule layer.",
    },
    {
      icon: <Server className="w-6 h-6 text-emerald-400" />,
      badge: "Serverless Cloud Proxy",
      title: "Shielded Vertex AI Tunnels",
      desc: "Aegis routes all multimodal OCR and multi-agent reasoning through authenticated Google Cloud Functions. API credentials and service account keys never touch the client browser.",
    },
    {
      icon: <EyeOff className="w-6 h-6 text-emerald-400" />,
      badge: "EXIF & PII Minimization",
      title: "Minimal Parameter Extraction",
      desc: "Before storage and parsing, client-side pre-processors strip camera EXIF GPS metadata. Our Gemini vision parser extracts strictly clinical biomarkers, ignoring extraneous billing or administrative text.",
    },
  ];

  const pledges = [
    {
      title: "We never sell or broker your health telemetry",
      desc: "We never share, lease, trade, or monetize your diagnostic markers with insurance underwriters, data brokers, or pharmaceutical marketers.",
    },
    {
      title: "We never serve advertisements or tracking pixels",
      desc: "Zero third-party ad networks, behavioral retargeting scripts, or commercial sponsorship banners ever load inside your clinical workspace.",
    },
    {
      title: "We never train public AI models on your files",
      desc: "Your personal lab PDFs and biomarker timelines are processed under strict enterprise zero-data-retention / no-training policies.",
    },
    {
      title: "We never retain records after deletion",
      desc: "Triggering account deletion executes an immediate, atomic cascade across Firestore collections and Cloud Storage buckets with zero shadow copies.",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6 bg-gradient-to-b from-[#0A192F] via-[#0D2444] to-[#0A192F] text-center border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 font-sans space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-widest rounded-full uppercase"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <DecryptedText text="DPDP ACT 2023 • ZERO-KNOWLEDGE ISOLATION" animateOn="view" speed={35} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight"
          >
            Your Health Data. <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Sovereign &amp; Isolated.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-200 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Engineered from day one with Google Cloud cryptographic isolation, India DPDP Act 2023 compliance, and instant 1-click right-to-erasure controls.
          </motion.p>
        </div>
      </section>

      {/* Security Architecture Pillars */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-2">
            Defense-in-Depth Architecture
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">How We Protect Your Clinical Vault</h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto font-light">Three deterministic security layers protecting every blood test and family profile</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((item, idx) => (
            <SpotlightCard
              key={idx}
              spotlightColor="rgba(16, 185, 129, 0.18)"
              className="bg-[#0F2A4A]/90 border border-white/10 rounded-3xl p-8 hover:border-emerald-500/30 transition-all flex flex-col gap-5 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {item.badge}
                </span>
              </div>
              <div>
                <h3 className="text-white font-extrabold text-xl mb-3 tracking-tight">{item.title}</h3>
                <p className="text-sm text-slate-300 font-light leading-relaxed">{item.desc}</p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* DPDP Act India Alignment & Live Rule Verification */}
      <section className="bg-[#0D2444]/50 py-24 px-6 border-y border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Content */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">Regulatory Governance</span>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">Aligned with India's DPDP Act, 2023</h2>
            <p className="text-slate-200 font-light text-base leading-relaxed">
              Aegis Health AI is architected in full compliance with India's <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and ABDM health data standards. As the Data Principal, you retain unconditional authority over your records:
            </p>
            <ul className="space-y-4 text-sm text-slate-200 font-light leading-relaxed">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Explicit Opt-In Consent Ledger:</strong> No diagnostic document is parsed or stored until you grant explicit, timestamped consent recorded in your isolated consent ledger (<code className="text-emerald-300 font-mono">consents/initial_consent</code>).
                </p>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Purpose Limitation &amp; Minimization:</strong> We extract only structured biomarker quantities required to render longitudinal health charts and SBAR doctor summaries.
                </p>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Unconditional Right to Erasure &amp; Portability:</strong> Export your complete longitudinal record in HL7 FHIR R4 JSON format or execute a permanent database purge at any time.
                </p>
              </li>
            </ul>
          </div>

          {/* Graphics Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-[#0F2A4A] border border-emerald-500/30 rounded-3xl p-7 space-y-4 relative shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs uppercase tracking-widest font-mono text-emerald-300 font-bold flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-emerald-400" />
                  DPDP &amp; FIRESTORE AUDIT STATUS
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  VERIFIED
                </span>
              </div>
              <div className="bg-[#0A192F] p-4 rounded-xl border border-white/10 flex justify-between items-center">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Explicit Consent Gate</span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono">ENFORCED</span>
              </div>
              <div className="bg-[#0A192F] p-4 rounded-xl border border-white/10 flex justify-between items-center">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Tenant Isolation (UID)</span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono">STRICT MATCH</span>
              </div>
              <div className="bg-[#0A192F] p-4 rounded-xl border border-white/10 flex justify-between items-center">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Encryption (At-Rest / Transit)</span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono">AES-256 / TLS 1.3</span>
              </div>
              <div className="bg-[#06101E] p-4 rounded-xl border border-white/10 font-mono text-[11px] text-slate-300 leading-relaxed">
                <div className="text-emerald-400 mb-1">// firestore.rules — Zero Cross-Tenant Access</div>
                <code>allow read, write: if request.auth.uid == userId;</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Absolutely What We NEVER Do */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-rose-950/30 via-[#0F2A4A]/60 to-[#0A192F] border border-rose-500/25 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-3 text-rose-400 font-bold tracking-wider text-xs uppercase font-mono mb-4">
            <AlertOctagon className="w-5 h-5" />
            <span>NON-NEGOTIABLE PRIVACY CHARTER</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-4">What We Never Do</h2>
          <p className="text-slate-300 text-sm md:text-base mb-10 leading-relaxed max-w-3xl font-light">
            To earn and protect your family's trust, Aegis Health AI enforces four hard architectural prohibitions:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-300">
            {pledges.map((p, idx) => (
              <div key={idx} className="space-y-2 bg-[#0A192F]/70 p-6 rounded-2xl border border-rose-500/20">
                <h4 className="text-white font-bold text-base leading-snug flex items-center gap-2">
                  <span className="text-rose-400 font-extrabold select-none">✕</span>
                  {p.title}
                </h4>
                <p className="text-slate-300 font-light leading-relaxed text-xs md:text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Direct Erasure Walkthrough */}
      <section className="py-24 px-6 bg-[#0E1F35]/40 border-t border-white/10 font-sans">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Trash2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">1-Click Data Erasure &amp; Audit Protocol</h2>
            <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed">
              Your health data belongs exclusively to you. You can permanently purge your entire vault at any moment without contacting support.
            </p>
          </div>

          <div className="bg-[#0F2A4A] border border-white/10 rounded-3xl p-6 md:p-10 space-y-8 shadow-xl">
            <div>
              <h3 className="text-white font-bold text-base md:text-lg mb-3 flex items-center gap-2 uppercase tracking-wide text-emerald-400 font-mono">
                <Settings className="w-4 h-4" /> Option 1: Instant Self-Service Vault Purge
              </h3>
              <ol className="list-decimal pl-6 text-xs md:text-sm text-slate-200 space-y-2.5 font-light leading-relaxed">
                <li>Sign in and open the <strong>Settings &amp; Data Governance</strong> panel inside the dashboard.</li>
                <li>Navigate to <strong>DPDP Act 2023 Data Controls</strong>.</li>
                <li>Click <strong>Delete My Profile &amp; Health Vault</strong> and confirm.</li>
                <li>Our Cloud Functions trigger an immediate atomic deletion across your profile, uploaded lab reports, normalized biomarkers, specialist insights, and chat history.</li>
              </ol>
            </div>

            <div className="pt-6 border-t border-white/10">
              <h3 className="text-white font-bold text-base md:text-lg mb-3 flex items-center gap-2 uppercase tracking-wide text-emerald-400 font-mono">
                <Mail className="w-4 h-4" /> Option 2: Direct Data Protection Officer (DPO) Request
              </h3>
              <p className="text-xs md:text-sm text-slate-200 font-light leading-relaxed">
                You may also request a formal deletion certificate by emailing{" "}
                <a href="mailto:support@aegishealthai.co.in" className="text-emerald-300 underline font-semibold">
                  support@aegishealthai.co.in
                </a>{" "}
                with the subject line <strong>DPDP Data Erasure Request</strong>. All requests are fulfilled and verified within <strong>72 hours</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="relative overflow-hidden py-24 px-6 bg-[#0F2A4A] border-t border-white/10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-6" />
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">Decode Your Lab Reports with Complete Peace of Mind</h2>
          <p className="text-slate-200 text-sm md:text-base max-w-xl mb-8 leading-relaxed font-light">
            Experience zero-knowledge clinical intelligence. Sign in with our Reviewer Demo account or your own Email ID.
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
              className="px-8 py-3.5 bg-[#0A192F] hover:bg-[#0E2444] text-white border border-white/15 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2"
            >
              <span>Launch Live Workspace</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function SecurityFirst() {
  return (
    <InfoPageLayout activePath="/security">
      <SecurityFirstContent />
    </InfoPageLayout>
  );
}
