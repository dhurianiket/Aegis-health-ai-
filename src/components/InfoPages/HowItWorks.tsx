import React, { useState } from "react";
import InfoPageLayout from "./InfoPageLayout";
import { motion, AnimatePresence } from "motion/react";
import { Check, ClipboardList, ShieldCheck, Heart, Sparkles, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const steps = [
    {
      num: "01",
      title: "Upload your report securely",
      desc: "Simply select or drag-and-drop your lab report PDF or image file into our platform. Your upload is fully protected under secure private encryption.",
    },
    {
      num: "02",
      title: "Aegis reads the values",
      desc: "Our smart platform identifies standard lab indicators (like blood sugar patterns, red blood cells, or cholesterol metrics) and double-checks them against standard healthy ranges.",
    },
    {
      num: "03",
      title: "Get explanation in plain language",
      desc: "Our friendly ChatCoach breaks down what each abbreviation means, translating clinical jargon into simple, comforting, and easily understandable terms for your family.",
    },
    {
      num: "04",
      title: "Share a doctor-ready summary",
      desc: "Easily download a structured, professional summary of your key insights and trends (SBAR). Take it directly to your doctor to have a much more meaningful and focused conversation.",
    },
  ];

  const reportTypes = [
    { icon: "🩸", name: "CBC (Complete Blood Count)", desc: "Checks your active blood health, including your red blood cells, white blood cells, and platelets." },
    { icon: "🧪", name: "LFT (Liver Function Tests)", desc: "Monitors how well your liver is filtering waste and maintaining chemical balances." },
    { icon: "💧", name: "KFT (Kidney Function Tests)", desc: "Measures how efficiently your kidneys cleanse and balances essential electrolytes." },
    { icon: "🧬", name: "Lipid Profile (Cholesterol)", desc: "Analyzes cholesterol levels, containing healthy HDL and LDL trends, to review cardiovascular health." },
    { icon: "🦋", name: "Thyroid Tests", desc: "Checks T3, T4, and TSH levels to ensure your body's energy regulation is balanced." },
    { icon: "🍬", name: "HbA1c & Diabetes Panel", desc: "Evaluates average blood sugar numbers over the last 90 days alongside fasting and post-meal sugar levels." },
    { icon: "☀️", name: "Vitamin D & B12 Levels", desc: "Tracks vital essential nutrients, especially important for traditional Indian vegetarian or modern urban diets." },
  ];

  const faqs = [
    {
      q: "Is my data safe with Aegis?",
      a: "Yes, completely. Aegis is built with a secure, user-locked privacy setup (using Firebase security rules). Your uploads are saved only in your isolated private folder, which is completely hidden from third parties. We never sell your health details, and you can delete your files instantly at any time.",
    },
    {
      q: "Does Aegis replace my doctor?",
      a: "No. Aegis does not replace your family doctor or specialist. Our goal is to make you feel more confident and prepared for your doctor appointments by explaining technical terms before your visit. You should always trust your physician for clinical diagnosis and treatment plans.",
    },
    {
      q: "What reports can I upload?",
      a: "Aegis supports standard clinical lab reports commonly ordered in India. This includes Complete Blood Count (CBC), Liver Function (LFT), Kidney Function (KFT), Lipid Profile, Thyroid, Vitamin D3, Vitamin B12, and HbA1c panels.",
    },
    {
      q: "Is Aegis free to use?",
      a: "Yes. We keep Aegis accessible for Indian families to translate and understand standard report values without subscription walls, helping everyone build better health literacy at home.",
    },
    {
      q: "What is ChatCoach?",
      a: "ChatCoach is our secure, friendly conversational tool. It lets you ask questions about your report in simple language (including Hinglish, Hindi, Marathi, or Gujarati) and explains complicated blood markers calmly without causing panic.",
    },
    {
      q: "How does trend tracking work?",
      a: "If you upload reports chronologically over time, Aegis connects the data points to show you if your levels are improving, stable, or rising. Seeing your health trends visually plotted on a timeline helps you and your doctor understand if your dietary or lifestyle adjustments are working.",
    },
    {
      q: "What is an SBAR summary?",
      a: "SBAR is a standardized, clean format (Situation, Background, Assessment, Recommendation) that doctors and clinics use to communicate with each other. Aegis generates this clean summary of your health reports so you can show it to your doctor, saving them time and making your consult more efficient.",
    },
    {
      q: "Is Aegis compliant with Indian data laws?",
      a: "Yes. We are fully committed to protecting your privacy in line with India's Digital Personal Data Protection (DPDP) Act, 2023. You are in complete control of your data, and we support immediate, permanent account deletion cascades with a single click.",
    },
  ];

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <InfoPageLayout activePath="/how-it-works">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 bg-gradient-to-b from-[#0A192F] via-[#0D2444] to-[#0A192F] text-center border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-widest rounded-full uppercase mb-4"
          >
            Our Process
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 font-sans"
          >
            How Aegis Health AI Works
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Simply upload your clinical lab report, get a clear and friendly explanation in plain language, and prepare for your next doctor visit with confidence.
          </motion.p>
        </div>
      </section>

      {/* Step Walkthrough */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Four Simple Steps to Clarity</h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">We guide you through your reports with total clarity, safety, and respect for your privacy</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className="bg-[#0F2A4A] border border-white/5 rounded-2xl p-6 relative hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-4xl font-black text-emerald-500/30 font-mono block mb-4">{step.num}</span>
                <h3 className="text-lg font-bold text-white mb-3 tracking-wide">{step.title}</h3>
                <p className="text-sm text-slate-300 font-light leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Supported Diagnostic Reports Section */}
      <section className="bg-[#0D2444]/40 py-24 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Supported Report Types</h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">We understand the standard primary care diagnostic tests ordered across clinics in India</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {reportTypes.map((report, idx) => (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className="bg-[#0F2A4A]/60 border border-white/5 rounded-xl p-5 hover:border-emerald-500/20 transition-all cursor-default"
              >
                <div className="text-2xl mb-3">{report.icon}</div>
                <h4 className="text-white font-bold text-sm mb-2 tracking-wide uppercase text-emerald-400">{report.name}</h4>
                <p className="text-xs text-slate-300 font-light leading-relaxed">{report.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Absolute Medical Boundaries / Safety */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-red-950/20 border border-red-500/20 rounded-3xl p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 mb-6 text-red-400 font-bold tracking-wider text-xs">
            <AlertTriangle className="w-5 h-5" />
            <span>SAFETY BOUNDARIES</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">What Aegis Health AI Does Not Do</h2>
          <p className="text-slate-300 text-sm mb-8 leading-relaxed max-w-3xl">
            We believe in absolute safety and ethical medical translation first. Aegis is built strictly for general health education, not medical treatment:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300 font-light">
            <div className="flex gap-3">
              <span className="text-red-400 font-bold shrink-0">❌</span>
              <p>
                <strong>Aegis does not diagnose disease:</strong> We explain what your biomarker numbers mean, but we will never give a clinical diagnosis or try to name an illness.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-red-400 font-bold shrink-0">❌</span>
              <p>
                <strong>Aegis does not replace your doctor:</strong> We do not offer telemedicine or make decisions for you. Always let a real doctor make the final decisions about your health care.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-red-400 font-bold shrink-0">❌</span>
              <p>
                <strong>Aegis does not give treatment advice:</strong> You will never receive medicine prescriptions, chemical dosages, or direct treatment recommendations here.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-red-400 font-bold shrink-0">❌</span>
              <p>
                <strong>Aegis does not keep your files permanently:</strong> All uploaded files and analysis records are securely stored or can be wiped permanently by you at any time.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-24 px-6 bg-[#0E1F35]/40 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Plain, transparent answers about your reports, privacy, and safety</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-[#0F2A4A] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left py-5 px-6 flex justify-between items-center text-white font-bold text-sm md:text-base tracking-wide select-none outline-none focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
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
                        <div className="pb-6 px-6 pt-1 text-slate-300 font-light font-sans text-xs md:text-sm leading-relaxed border-t border-white/5">
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
      <section className="relative overflow-hidden py-24 px-6 bg-[#0F2A4A] border-t border-white/5 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Decrypt Your Diagnostics Privately</h2>
          <p className="text-slate-300 text-sm max-w-xl mb-8 leading-relaxed font-light">
            Paste testing parameters or upload a lab file. Start understanding what your medical levels indicate immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard"
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-[#0A192F] font-extrabold uppercase text-xs tracking-widest rounded-full transition-all shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            >
              Launch Sandbox Portal
            </Link>
            <Link 
              to="/security.html"
              className="px-8 py-3.5 bg-[#0A192F] hover:bg-[#0E2444] text-white border border-white/10 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all"
            >
              Verify Data Policies
            </Link>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
}
