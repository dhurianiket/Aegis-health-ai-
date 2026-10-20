import React from "react";
import InfoPageLayout, { useInfoPageLogin } from "./InfoPageLayout";
import { motion } from "motion/react";
import { Sparkles, Star, Award, Mail, MapPin, Github, Linkedin, ExternalLink, ShieldCheck, Building2, Cloud, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SpotlightCard } from "../ui/SpotlightCard";
import { DecryptedText } from "../ui/DecryptedText";
import { CountUp } from "../ui/CountUp";

function AboutUsContent() {
  const { openLoginModal } = useInfoPageLogin();

  const values = [
    {
      icon: "❤️",
      badge: "Patient-Centric Empathy",
      title: "Family First Clinical Literacy",
      desc: "Our platform is engineered with deep empathy. Whether it is your grandmother's thyroid panel or your parents' lipid profile, Aegis translates clinical telemetry into calm, reassuring explanations without medical panic.",
    },
    {
      icon: "🇮🇳",
      badge: "ICMR & RSSDI Grounded",
      title: "Indian Context Alignment",
      desc: "From widespread Vitamin D3 and B12 deficiencies to traditional Indian dietary staples (millets like ragi, jowar, bajra, vegetarian protein sources) and seasonal endemic patterns (Dengue platelet monitoring), every insight is tailored for Indian households.",
    },
    {
      icon: "🔒",
      badge: "DPDP Act 2023 Compliant",
      title: "Zero-Knowledge Sovereignty",
      desc: "We treat family medical records as sacred. Your diagnostics reside in cryptographically isolated Firestore vaults (users/{userId}/*) and are never shared, sold, or used to train external foundation models.",
    },
    {
      icon: "🧬",
      badge: "HL7 FHIR R4 Standard",
      title: "Clinical Precision over Hype",
      desc: "We combine Google Vertex AI and Gemini 2.5 Flash multimodal vision with deterministic LOINC/FHIR R4 schemas, SBAR physician handovers, and drug-lab contraindication checks.",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6 bg-gradient-to-b from-[#0A192F] via-[#0D2444] to-[#0A192F] text-center border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-widest rounded-full uppercase"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <DecryptedText text="REGISTERED INDIAN HEALTH-TECH ENTERPRISE" animateOn="view" speed={35} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight font-sans"
          >
            Decoding Health with <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Empathy &amp; Engineering</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-200 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Meet the founder, engineering philosophy, and registered enterprise behind Aegis Health AI—building sovereign clinical intelligence for families across India.
          </motion.p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <button
              onClick={openLoginModal}
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-[#0A192F] font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(52,211,153,0.35)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" /> Account Sign In
            </button>
            <Link
              to="/dashboard"
              className="px-7 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
            >
              Explore Live Workspace <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Founder & Core Leadership Verification Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Founder Profile & Third-Party Verification Card */}
          <div className="lg:col-span-5">
            <SpotlightCard
              spotlightColor="rgba(16, 185, 129, 0.2)"
              className="bg-gradient-to-br from-[#0F2A4A] to-[#0A192F] border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col items-center text-center mb-6">
                <img
                  src="https://lh3.googleusercontent.com/d/11-MtBvMJRl6OpfL60wypuMn-LCw2jC50"
                  alt="Aniket Rajesh Dhuri — Founder & CEO of Aegis Health AI"
                  className="w-36 h-36 rounded-full object-cover object-[center_35%] border-2 border-emerald-400/60 shadow-[0_0_30px_rgba(52,211,153,0.25)] mb-4 bg-slate-800"
                />
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono uppercase tracking-widest text-emerald-300 mb-2">
                  Verified Founder Identity
                </span>
                <h3 className="text-2xl font-black text-white">Aniket Rajesh Dhuri</h3>
                <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 mt-1">
                  Founder, CEO &amp; Lead AI Systems Architect
                </p>
                <p className="text-xs text-slate-300 mt-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Dombivli West, Thane, Maharashtra 421202, India
                </p>
              </div>

              {/* Active Third-Party Verification Links */}
              <div className="space-y-3 border-t border-white/10 pt-5 mb-6">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 block">
                  Verified Third-Party Public Profiles
                </span>
                <a
                  href="https://www.linkedin.com/in/aniket-dhuri-273094225"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/40 text-sm text-white transition-all"
                >
                  <span className="flex items-center gap-2.5 font-medium">
                    <Linkedin className="w-4 h-4 text-emerald-400" />
                    LinkedIn — Aniket Dhuri
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="https://github.com/dhurianiket/Aegis-health-ai-"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/40 text-sm text-white transition-all"
                >
                  <span className="flex items-center gap-2.5 font-medium">
                    <Github className="w-4 h-4 text-emerald-400" />
                    GitHub — dhurianiket/Aegis-health-ai-
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="https://aniket.aegishealthai.co.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/40 text-sm text-white transition-all"
                >
                  <span className="flex items-center gap-2.5 font-medium">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Founder Portfolio &amp; Living CV
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>

              {/* Government Registration Block */}
              <div className="bg-[#0A192F]/90 border border-white/10 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  Registered Indian Enterprise
                </div>
                <p><strong className="text-white">Legal Entity:</strong> AEGIS HEALTH AI</p>
                <p><strong className="text-white">Govt. of India MSME Udyam:</strong> <span className="font-mono text-emerald-300 font-bold">UDYAM-MH-33-0782403</span></p>
                <p><strong className="text-white">NIC Classification:</strong> 62011 (Health Informatics &amp; AI Systems Engineering)</p>
                <p><strong className="text-white">Registered Office:</strong> Dombivli West, Thane, Maharashtra 421202, India</p>
              </div>
            </SpotlightCard>
          </div>

          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">The Origin Story</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">A Note From Our Founder</h2>
            <p className="text-slate-200 font-light text-base leading-relaxed">
              Have you ever received a diagnostic blood report in your family and spent hours searching abbreviations like <code className="text-emerald-300 font-mono">RDW-CV</code>, <code className="text-emerald-300 font-mono">hs-CRP</code>, or <code className="text-emerald-300 font-mono">eGFR</code>, only to end up in unnecessary anxiety?
            </p>
            <p className="text-slate-200 font-light text-base leading-relaxed">
              Across India, millions of pathology tests are run every morning. Yet most families walk away with dense PDF sheets filled with bolded numbers and laboratory reference brackets—without any plain-language context on how their markers have shifted over the last 90 days or what questions they should ask their physician.
            </p>
            <p className="text-slate-200 font-light text-base leading-relaxed">
              I engineered <strong className="text-white">Aegis Health AI</strong> on <strong className="text-emerald-300">Google Cloud, Vertex AI (Gemini 2.5 Flash &amp; Pro), and Firebase</strong> to bridge this exact clinical communication gap. Aegis transforms raw diagnostic PDFs and prescription scans into HL7 FHIR R4 structured biomarkers, 10-specialist polyclinic insights, 3D anatomical readiness scores, and single-page SBAR doctor handover briefs—all inside a zero-knowledge, DPDP Act 2023 isolated vault.
            </p>
            <blockquote className="border-l-2 border-emerald-400 pl-4 py-1 text-slate-100 font-medium italic text-base bg-emerald-500/5 rounded-r-xl">
              "Information is preventative medicine. When families understand their longitudinal biomarkers clearly, they have calmer, higher-trust consultations with their doctors."
            </blockquote>

            {/* Cloud Ecosystem Recognition */}
            <div className="bg-[#0F2A4A]/70 border border-emerald-500/25 rounded-2xl p-6 mt-6">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm uppercase tracking-wider mb-3">
                <Cloud className="w-5 h-5 text-emerald-400" />
                Cloud Startup Ecosystem &amp; Infrastructure Backing
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Backed by leading global cloud startup programs to deliver low-latency multimodal vision parsing and enterprise-grade encryption at zero cost to patients:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#0A192F] border border-white/10 rounded-xl p-3.5 text-center">
                  <div className="text-xs font-bold text-emerald-400 font-mono">Google Cloud</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Vertex AI &amp; Gemini 2.5</div>
                </div>
                <div className="bg-[#0A192F] border border-white/10 rounded-xl p-3.5 text-center">
                  <div className="text-xs font-bold text-teal-300 font-mono">AWS Activate</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Approved Startup Member</div>
                </div>
                <div className="bg-[#0A192F] border border-white/10 rounded-xl p-3.5 text-center">
                  <div className="text-xs font-bold text-cyan-300 font-mono">Microsoft Azure</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Founders Hub Member</div>
                </div>
              </div>
            </div>

            {/* The Aegis Standard */}
            <div className="bg-[#0F2A4A]/60 border border-white/10 rounded-2xl p-6 mt-6">
              <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase text-emerald-400 flex items-center gap-2 font-mono">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                The Aegis Clinical &amp; Engineering Charter
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-200 leading-relaxed">
                <li className="flex gap-2.5 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Empathetic Translation:</strong> Contextualizes out-of-range markers calmly without diagnostic alarmism.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Commercial Adverts:</strong> No pharma sponsorships, upsells, or third-party ad trackers.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Sovereign Data Control:</strong> Instant 1-click right-to-erasure cascade and full HL7 FHIR R4 export.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>India Grounded:</strong> Aligned with ICMR, RSSDI, ABDM, and DPDP Act 2023 governance.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-[#0D2444]/40 py-24 px-6 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-2">
              Architectural &amp; Ethical Pillars
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Values That Guide Our Engineering</h2>
            <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">Every model prompt, security rule, and UI interaction is governed by four foundational principles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((v, idx) => (
              <SpotlightCard
                key={idx}
                spotlightColor="rgba(16, 185, 129, 0.16)"
                className="bg-[#0F2A4A]/90 border border-white/10 rounded-3xl p-7 md:p-8 hover:border-emerald-500/30 transition-all flex gap-5"
              >
                <span className="text-4xl shrink-0">{v.icon}</span>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block mb-2">
                    {v.badge}
                  </span>
                  <h3 className="text-white font-extrabold text-xl mb-2 tracking-tight">{v.title}</h3>
                  <p className="text-slate-300 font-light text-sm leading-relaxed">{v.desc}</p>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* Public Contact & Verification Callout */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <div className="bg-gradient-to-br from-[#0F2A4A] to-[#0A192F] border border-emerald-500/25 rounded-3xl p-8 md:p-12 shadow-2xl">
          <Star className="w-8 h-8 text-emerald-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Direct Enterprise Verification &amp; Contact</h2>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed font-light mb-8">
            <strong className="text-white">Aegis Health AI</strong> is an independent Indian health technology enterprise registered with the Government of India (<span className="font-mono text-emerald-300">MSME UDYAM-MH-33-0782403</span>), headquartered in Dombivli West, Maharashtra. We are unaffiliated with Aegis Health Ai Ltd (UK) or aegishealth.com.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 text-sm">
            <a href="mailto:founder@aegishealthai.co.in" className="flex items-center justify-center gap-2 text-slate-200 hover:text-emerald-400 bg-[#0A192F] py-3 px-6 rounded-xl border border-white/10 hover:border-emerald-400/40 transition-colors">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold">founder@aegishealthai.co.in</span>
            </a>
            <a href="mailto:support@aegishealthai.co.in" className="flex items-center justify-center gap-2 text-slate-200 hover:text-emerald-400 bg-[#0A192F] py-3 px-6 rounded-xl border border-white/10 hover:border-emerald-400/40 transition-colors">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold">support@aegishealthai.co.in</span>
            </a>
            <div className="flex items-center justify-center gap-2 text-slate-300 bg-[#0A192F] py-3 px-6 rounded-xl border border-white/10">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-xs">Dombivli West, Thane, Maharashtra 421202</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="relative overflow-hidden py-24 px-6 bg-[#0F2A4A] border-t border-white/10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-6" />
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">Explore the Live Product Workspace</h2>
          <p className="text-slate-200 text-sm md:text-base max-w-xl mb-8 leading-relaxed font-light">
            Explore the live demonstration workspace directly, or sign in to synchronize personal clinical records.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={openLoginModal}
              className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-[#0A192F] font-black uppercase text-xs tracking-widest rounded-full transition-all shadow-[0_0_25px_rgba(52,211,153,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Account Sign-In</span>
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

export default function AboutUs() {
  return (
    <InfoPageLayout activePath="/about">
      <AboutUsContent />
    </InfoPageLayout>
  );
}
