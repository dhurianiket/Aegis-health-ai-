import React from "react";
import InfoPageLayout from "./InfoPageLayout";
import { motion } from "motion/react";
import { Heart, Sparkles, Star, Users, Award, ShieldAlert, Mail, MapPin, Github, Linkedin, ExternalLink, ShieldCheck, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function AboutUs() {
  const values = [
    {
      icon: "❤️",
      title: "Family First",
      desc: "Our platform is built with deep empathy. We want your grandmother, your parents, and your kids to understand what their numbers mean without feeling fear or anxiety.",
    },
    {
      icon: "🇮🇳",
      title: "Indian Context Alignment",
      desc: "From vitamin deficiencies to traditional dietary patterns (vegetarian diets, grains like ragi and jowar, fasting periods, endemic viral seasons like Dengue), we tailor explanations specifically for Indian households.",
    },
    {
      icon: "🔒",
      title: "Absolute Privacy",
      desc: "We treat your diagnostics as a sacred secret. Your records live in locked, user-specific directories and are never shared, sold, or used to train third-party systems.",
    },
    {
      icon: "🎯",
      title: "Clarity over Complexity",
      desc: "We translate high-order chemical notations and medical jargon into plain, patient-focused, and comfortable language. Medical literacy is a fundamental right.",
    },
  ];

  return (
    <InfoPageLayout activePath="/about">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 bg-gradient-to-b from-[#0A192F] via-[#0D2444] to-[#0A192F] text-center border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-widest rounded-full uppercase mb-4"
          >
            Our Mission & Leadership
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 font-sans"
          >
            Decoding Health with Empathy and Engineering
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Meet the founder and legal enterprise behind Aegis Health AI—making blood tests and clinical records understandable for everyday families across India.
          </motion.p>
        </div>
      </section>

      {/* Founder & Core Leadership Verification Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Founder Profile & Third-Party Verification Card */}
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#0F2A4A] to-[#0A192F] border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
              
              <div className="flex flex-col items-center text-center mb-6">
                <img
                  src="https://lh3.googleusercontent.com/d/11-MtBvMJRl6OpfL60wypuMn-LCw2jC50"
                  alt="Aniket Rajesh Dhuri — Founder & CEO of Aegis Health AI"
                  className="w-36 h-36 rounded-full object-cover object-[center_35%] border-2 border-emerald-400/50 shadow-lg mb-4 bg-slate-800"
                />
                <h3 className="text-2xl font-bold text-white">Aniket Rajesh Dhuri</h3>
                <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 mt-1">
                  Founder, CEO & Lead AI Systems Architect
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
                    Founder Portfolio & Living CV
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>

              {/* Government Registration Block */}
              <div className="bg-[#0A192F]/80 border border-white/10 rounded-2xl p-4 text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  Registered Indian Enterprise
                </div>
                <p><strong>Legal Name:</strong> AEGIS HEALTH AI</p>
                <p><strong>Govt. of India MSME Udyam:</strong> <span className="font-mono text-white">UDYAM-MH-33-0782403</span></p>
                <p><strong>NIC Classification:</strong> 62011 (Health Informatics & AI Engineering)</p>
                <p><strong>Registered Office:</strong> Flat 301, Padu Niwas, Ganesh Nagar, Dombivli West, Thane, Maharashtra 421202</p>
              </div>
            </motion.div>
          </div>

          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">The Motivation</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">A Note From Our Founder</h2>
            <p className="text-slate-300 font-light text-base leading-relaxed">
              Have you ever received a lab report in your family and spent hours googling abbreviations like <em>MCV</em>, <em>Neutrophils</em>, or <em>eGFR</em>, only to end up in complete panic? 
            </p>
            <p className="text-slate-300 font-light text-base leading-relaxed">
              In India, millions of diagnostic tests are run every single morning. Yet, most families walk away with pieces of paper covered in clinical codes, reference brackets, and intimidating bold numbers without any patient-friendly explanation. Translating this clinical jargon is a fundamental gap that leaves families anxious while they wait to consult their busy physicians.
            </p>
            <p className="text-slate-300 font-light text-base leading-relaxed">
              I built <strong>Aegis Health AI</strong> to tackle this exact problem. By combining Google Gemini multimodal intelligence with a strict zero-ad, offline-ready security posture, we give families a warm, accurate clinical translator. Aegis transforms raw lab values into high-context health summaries, 30-60-90 day biomarker trajectories, 3D organ scores, and physician-ready SBAR consultation sheets before your appointment starts.
            </p>
            <p className="text-slate-200 font-medium italic text-base">
              "We believe information is medicine. When people understand their own markers, they have better conversations with their doctors and lead healthier lives."
            </p>

            {/* The Aegis Standard */}
            <div className="bg-[#0F2A4A]/60 border border-white/10 rounded-2xl p-6 mt-6">
              <h3 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                The Aegis Clinical & Engineering Standard
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 leading-relaxed font-light">
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-medium font-mono">✓</span>
                  <span><strong>Empathetic Translation:</strong> Explains complex medical items warmly without alarms or panic.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-medium font-mono">✓</span>
                  <span><strong>Zero Commercial Adverts:</strong> No sponsored links, pharmaceutical promotions, or tracking scripts.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-medium font-mono">✓</span>
                  <span><strong>Sovereign Control:</strong> Instant, self-contained data wiping and FHIR R4 export at any time.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-medium font-mono">✓</span>
                  <span><strong>India Grounded:</strong> Aligned with ICMR, RSSDI, ABDM, and DPDP Act 2023 standards.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-[#0D2444]/40 py-24 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Values that Guide Us</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Our actions, software updates, and user safeguards are all shaped by these solid principles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((v, idx) => (
              <div 
                key={idx}
                className="bg-[#0F2A4A] border border-white/5 rounded-2xl p-6 md:p-8 hover:border-emerald-500/20 transition-all flex gap-4"
              >
                <span className="text-3xl shrink-0">{v.icon}</span>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2 tracking-wide">{v.title}</h3>
                  <p className="text-slate-300 font-light text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public Contact & Verification Callout */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <div className="bg-[#0F2A4A]/50 border border-white/5 rounded-3xl p-8 md:p-12">
          <Star className="w-8 h-8 text-emerald-400 mx-auto mb-6 animate-pulse" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Direct Communication & Verification</h2>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed font-light mb-8">
            Aegis Health AI is an independent Indian health technology enterprise (Govt. of India MSME UDYAM-MH-33-0782403), not affiliated with Aegis Health Ai Ltd (UK) or aegishealth.com.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 text-sm">
            <a href="mailto:founder@aegishealthai.co.in" className="flex items-center justify-center gap-2 text-slate-200 hover:text-emerald-400 bg-[#0A192F] py-3 px-6 rounded-xl border border-white/10 transition-colors">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium">founder@aegishealthai.co.in</span>
            </a>
            <a href="mailto:support@aegishealthai.co.in" className="flex items-center justify-center gap-2 text-slate-200 hover:text-emerald-400 bg-[#0A192F] py-3 px-6 rounded-xl border border-white/10 transition-colors">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium">support@aegishealthai.co.in</span>
            </a>
            <div className="flex items-center justify-center gap-2 text-slate-300 bg-[#0A192F] py-3 px-6 rounded-xl border border-white/10">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-xs">Dombivli West, Maharashtra, India</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="relative overflow-hidden py-24 px-6 bg-[#0F2A4A] border-t border-white/5 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Explore the Live Product Workspace</h2>
          <p className="text-slate-300 text-sm max-w-xl mb-8 leading-relaxed font-light">
            Launch our live clinical dashboard with pre-loaded sample patient telemetry—no login required—or sign in to upload your own lab reports.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard"
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-[#0A192F] font-extrabold uppercase text-xs tracking-widest rounded-full transition-all"
            >
              Launch Live Product Workspace
            </Link>
            <Link 
              to="/how-it-works.html"
              className="px-8 py-3.5 bg-[#0A192F] hover:bg-[#0E2444] text-white border border-white/10 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
}
