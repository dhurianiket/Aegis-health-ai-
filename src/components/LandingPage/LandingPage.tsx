import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Activity, TrendingUp, AlertCircle, Loader2, Sparkles, Heart, Brain, Stethoscope, Droplets, Zap, Github, Linkedin, Mail, MapPin } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import { ErrorBoundary } from '../ErrorBoundary';
import LegalModal from './LegalModal';

// ----------------------------------------------------------------------
// MOCK DATA
// ----------------------------------------------------------------------
const BENTO_LABS = [
  { id: 'hb', label: 'Hemoglobin', value: '14.2 g/dL', status: 'normal', desc: 'Optimal oxygen transport. Keep it up.', trend: 'stable', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  { id: 'hba1c', label: 'HbA1c', value: '5.8%', status: 'borderline', desc: 'Slightly elevated. Monitor dietary sugar.', trend: 'up', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { id: 'vitd', label: 'Vitamin D', value: '18 ng/mL', status: 'abnormal', desc: 'Deficient level. Supplementation recommended.', trend: 'down', icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
  { id: 'crp', label: 'CRP', value: '3.5 mg/L', status: 'borderline', desc: 'Slight systemic inflammation detected.', trend: 'up', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
];

const EXPLORE_PAGES = [
  {
    title: "How It Works",
    desc: "Discover how Aegis safely translates raw blood, biochemistry, and scan reports into helpful clinical models step-by-step.",
    href: "/how-it-works.html",
    icon: Brain
  },
  {
    title: "About Us",
    desc: "Learn about our vision, our roots in Dombivli, Maharashtra, and our personal commitment to clinical transparency for Indian families.",
    href: "/about.html",
    icon: Heart
  },
  {
    title: "Security First",
    desc: "Understand our multi-tiered security, DPDP Act 2023 alignment, absolute privacy, and enterprise-grade data isolation protocols.",
    href: "/security.html",
    icon: ShieldCheck
  },
  {
    title: "HbA1c Blood Sugar Guide",
    desc: "Demystify your HbA1c lab values, find out how long-term blood glucose counts work, and learn how to manage home health trends.",
    href: "/blog-hba1c.html",
    icon: Droplets
  },
  {
    title: "CBC Blood Test Explainer",
    desc: "Read our comprehensive Complete Blood Count guide and learn what platelets, red cells, and white cells indicate in plain words.",
    href: "/blog-cbc.html",
    icon: Stethoscope
  },
  {
    title: "Engineering Playbook",
    desc: "Deep dive into our engineering logic, detailing how Aegis structures autonomous multi-specialty agent systems at scale.",
    href: "/engineering-playbook.html",
    icon: Zap
  }
];

const CHAOS_TEXT = [
  "WBC 12.5 H", "RBC 4.2", "HGB 12.1", "HCT 36.5", "MCV 85.0", 
  "MCH 28.5", "MCHC 33.5", "RDW 14.2", "PLT 150", "MPV 9.5 L",
  "ALT 85 H", "AST 65 H", "ALP 120", "BILIRUBIN 1.2", "ALBUMIN 4.5",
  "GLUCOSE 110 H", "BUN 15", "CREATININE 0.9", "SODIUM 140", "POTASSIUM 4.2",
  "CHLORIDE 100", "CO2 25", "CALCIUM 9.5", "PROTEIN 7.0", "GLOBULIN 2.5",
];

const SPECIALISTS_SHOWCASE = [
  { title: "AI Cardiologist", icon: Heart, guidelines: "ACC/AHA 2024" },
  { title: "AI Endocrinologist", icon: Zap, guidelines: "ADA 2025" },
  { title: "AI Neurologist", icon: Brain, guidelines: "AAN 2024" },
  { title: "AI Gastroenterologist", icon: Droplets, guidelines: "ACG/AGA" },
  { title: "AI Pulmonologist", icon: Activity, guidelines: "ATS/ERS" },
  { title: "AI Nephrologist", icon: Droplets, guidelines: "KDIGO" },
  { title: "AI Psychiatrist", icon: Sparkles, guidelines: "APA" },
  { title: "AI Dermatologist", icon: ShieldCheck, guidelines: "AAD" },
  { title: "AI Orthopedist", icon: Stethoscope, guidelines: "AAOS" },
  { title: "AI Oncologist", icon: Activity, guidelines: "NCCN" },
];

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function LandingPage() {
  const { user, loading, signIn, isSigningIn } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    console.log("[LandingPage] Auth State Checked:", { loading, hasUser: !!user });
    if (!loading && user) {
      console.log("[LandingPage] Condition met! Navigating manually to /dashboard...");
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const openLegalModal = (type: 'privacy' | 'terms') => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Hero Scroll
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const coreScale = useTransform(heroProgress, [0, 0.8], [0.9, 1.1]);

  // Sticky Scroll Story (Chaos to Clarity)
  const stickyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: stickyRaw } = useScroll({
    target: stickyRef,
    offset: ["start start", "end end"]
  });
  
  // Smooth the scroll
  const stickyProgress = useSpring(stickyRaw, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Phase 1: Chaos (0 to 25%)
  const chaosOpacity = useTransform(stickyProgress, [0, 0.2, 0.3], [1, 1, 0]);
  const chaosScale = useTransform(stickyProgress, [0, 0.3], [1, 1.2]);

  // Phase 2: Decoding Bridge (20% to 50%)
  const bridgeOpacity = useTransform(stickyProgress, [0.2, 0.35, 0.45, 0.6], [0, 1, 1, 0]);
  const bridgeScale = useTransform(stickyProgress, [0.2, 0.5], [0.8, 1.1]);

  // Phase 3: Shield / Processing Core (45% to End)
  const shieldOpacity = useTransform(stickyProgress, [0.45, 0.6], [0, 1]);
  const shieldY = useTransform(stickyProgress, [0.65, 0.9], ["0vh", "-30vh"]);
  const shieldScale = useTransform(stickyProgress, [0.45, 0.6, 0.9], [0.6, 1, 0.7]);

  // Phase 4: Validated Insights (65% to End)
  const insightOpacity = useTransform(stickyProgress, [0.65, 0.9, 1], [0, 1, 1]);
  const insightY = useTransform(stickyProgress, [0.65, 0.9, 1], ["20vh", "5vh", "5vh"]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="bg-[#0A192F] text-white min-h-screen font-sans selection:bg-emerald-500/30">
        
        {/* Persistent Sticky Navbar */}
        <nav className="fixed w-full z-50 top-0 left-0">
          <div className="absolute inset-0 bg-[#0A192F]/70 backdrop-blur-md border-b border-white/5" />
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 md:gap-3">
              <ShieldCheck className="w-5 h-5 md:w-8 md:h-8 text-emerald-400" strokeWidth={2} />
              <span className="font-bold border-l border-white/20 pl-2 md:pl-3 text-xs md:text-lg tracking-[0.2em] text-emerald-400">
                AEGIS
              </span>
            </div>

            {/* Desktop Center Navigation Links */}
            <div className="hidden lg:flex items-center gap-6">
              <Link to="/how-it-works.html" className="text-xs font-bold tracking-widest text-slate-300 hover:text-emerald-400 transition-colors uppercase">How It Works</Link>
              <Link to="/about.html" className="text-xs font-bold tracking-widest text-slate-300 hover:text-emerald-400 transition-colors uppercase">About Us</Link>
              <Link to="/security.html" className="text-xs font-bold tracking-widest text-slate-300 hover:text-emerald-400 transition-colors uppercase">Security First</Link>
              
              <div className="relative group py-2">
                <button className="flex items-center gap-1 text-xs font-bold tracking-widest text-slate-300 hover:text-emerald-400 transition-colors uppercase focus:outline-none">
                  Articles <span className="text-[10px]">▾</span>
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-52 bg-[#0F2A4A] border border-white/10 rounded-xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link to="/blog-hba1c.html" className="block px-4 py-2 text-[11px] font-semibold tracking-wider text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors uppercase">HbA1c Blood Sugar Guide</Link>
                  <Link to="/blog-cbc.html" className="block px-4 py-2 text-[11px] font-semibold tracking-wider text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors uppercase">CBC Blood Test Explainer</Link>
                  <Link to="/engineering-playbook.html" className="block px-4 py-2 text-[11px] font-semibold tracking-wider text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors uppercase">Engineering Playbook</Link>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="hidden sm:flex px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] md:text-xs font-semibold tracking-wide transition-colors disabled:opacity-50 items-center justify-center gap-2"
              >
                <Activity className="w-3 md:w-4 h-3 md:h-4" />
                <span>UPLOAD</span>
              </button>
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="px-4 md:px-8 py-2 md:py-2.5 bg-white text-[#0A192F] hover:bg-emerald-50 rounded-full text-[10px] md:text-xs font-black tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {isSigningIn ? <Loader2 className="w-3 h-3 animate-spin" /> : "TRY FREE"}
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Menu"
                className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Sliding Navigation Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="lg:hidden w-full bg-[#0A192F] border-b border-white/10 z-40 overflow-hidden shadow-2xl relative"
              >
                <div className="px-6 py-6 flex flex-col gap-4">
                  <Link to="/how-it-works.html" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold tracking-wider text-slate-200 hover:text-emerald-400 transition-colors py-2 border-b border-white/5 uppercase">How It Works</Link>
                  <Link to="/about.html" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold tracking-wider text-slate-200 hover:text-emerald-400 transition-colors py-2 border-b border-white/5 uppercase">About Us</Link>
                  <Link to="/security.html" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold tracking-wider text-slate-200 hover:text-emerald-400 transition-colors py-2 border-b border-white/5 uppercase">Security First</Link>
                  
                  <div className="py-2">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold block mb-2">Articles & Playbooks</span>
                    <div className="pl-4 flex flex-col gap-3">
                      <Link to="/blog-hba1c.html" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold tracking-wider text-slate-300 hover:text-emerald-400 transition-colors uppercase">HbA1c Blood Sugar Guide</Link>
                      <Link to="/blog-cbc.html" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold tracking-wider text-slate-300 hover:text-emerald-400 transition-colors uppercase">CBC Blood Test Explainer</Link>
                      <Link to="/engineering-playbook.html" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold tracking-wider text-slate-300 hover:text-emerald-400 transition-colors uppercase">Engineering Playbook</Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* 1. HERO SECTION */}
        <main id="main-content">
        <div ref={heroRef} className="relative min-h-screen flex items-center pt-24 pb-12">
          {/* Background subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 lg:gap-12 items-center w-full relative z-10 transform-gpu">
            {/* Left Content */}
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                Early Beta – Free for Feedback
              </span>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]"
              >
                Understand your medical reports instantly. <br className="hidden md:block" />
                <span className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]">In plain language.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="text-lg md:text-xl text-slate-400 mb-6 font-light max-w-lg leading-relaxed"
              >
                Upload lab reports or prescriptions. Get a clear, AI-powered summary and ask questions. Built to help Indian families prepare for doctor visits.
              </motion.p>


              <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
               className="text-emerald-300 text-xs md:text-sm font-bold tracking-wide mb-8 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl inline-flex items-start gap-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              >
                <div className="shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <span>
                  Powered by <strong>Google Gemini 2.5</strong> for advanced clinical reasoning and instant lab report extraction.
                </span>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="flex flex-wrap items-center gap-4 md:gap-6 mb-10 text-xs md:text-sm font-medium text-emerald-400/80"
              >
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> DPDP Act 2023 Aligned</div>
                <div className="flex items-center gap-2"><Activity className="w-4 h-4" /> Instant Analysis</div>
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI-Powered</div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-[#0A192F] rounded-full font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex flex-col items-center justify-center"
                >
                  <div className="flex items-center gap-2 text-base">
                    {isSigningIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "START FOR FREE"}
                  </div>
                  <span className="text-[10px] font-semibold opacity-75 mt-0.5 tracking-wider">NO CREDIT CARD REQUIRED</span>
                </button>
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold border border-white/10 tracking-wide transition-all flex items-center justify-center gap-2 relative shadow-lg"
                >
                  VIEW DEMO <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>

            {/* Right Content: Floating Health Core */}
            <div className="relative h-[400px] md:h-[600px] flex items-center justify-center pointer-events-none origin-center mt-24 lg:mt-0">
              <motion.div 
                className="absolute w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/30 flex items-center justify-center will-change-transform"
                style={{
                  scale: coreScale,
                }}
              >
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-emerald-400/20 blur-xl animate-pulse" />
                
                {/* Orbiting Labels */}
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-dashed border-emerald-500/20 rounded-full"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-[#0A192F] text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30 rounded-full">HbA1c</div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 px-3 py-1 bg-[#0A192F] text-amber-400 text-xs font-mono font-bold border border-amber-500/30 rounded-full">Lipids</div>
                </motion.div>
                
                <motion.div 
                  animate={{ rotate: -360 }} 
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-8 border border-white/5 rounded-full"
                >
                  <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-[#0A192F] text-rose-400 text-xs font-mono font-bold border border-rose-500/30 rounded-full">Vit D</div>
                </motion.div>
                
                <ShieldCheck className="absolute w-16 h-16 md:w-24 md:h-24 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* EXPLORE AEGIS PAGES DIRECTORY */}
        <section id="explore" className="w-full relative z-20 bg-[#0A192F] border-t border-b border-white/5 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Resource Center
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                Explore Aegis Pages
              </h2>
              <p className="text-lg text-slate-400 font-light leading-relaxed">
                Deep dive into blood reading guides, platform workflows, and autonomous system engineering.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {EXPLORE_PAGES.map((page, index) => {
                const Icon = page.icon;
                return (
                  <Link
                    key={index}
                    to={page.href}
                    className="rounded-3xl p-8 border border-white/10 bg-white/5 backdrop-blur-sm relative overflow-hidden flex flex-col group hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01]"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-white/5 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors duration-300">
                        LEARN MORE →
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white tracking-wide mb-2 group-hover:text-emerald-400 transition-colors">
                        {page.title}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed font-light">
                        {page.desc}
                      </p>
                    </div>
                    
                    {/* Decorative glow */}
                    <div className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-[40px] opacity-10 bg-emerald-500 pointer-events-none group-hover:opacity-20 transition-opacity duration-300" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <div ref={stickyRef} className="relative w-full h-[250vh]">
          <div className="sticky top-0 h-[100dvh] w-full flex items-center justify-center overflow-clip transform-gpu will-change-transform">
            
            <div className="absolute inset-0 bg-[#0A192F] pointer-events-none -z-20" />

            {/* Cinematic Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F] via-transparent to-[#0A192F] z-50 pointer-events-none" />

            {/* LAYER 1: Raw Report Blur (Chaos) */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none will-change-transform transform-gpu"
              style={{ 
                opacity: chaosOpacity,
                scale: chaosScale,
              }}
            >
              <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center overflow-hidden">
                {/* Floating Scattered Data */}
                <div className="absolute top-[25%] left-[5%] md:left-[15%] text-emerald-500/40 font-mono text-xl md:text-3xl filter blur-[1px] md:blur-[2px] whitespace-nowrap">WBC 12.5 H</div>
                <div className="absolute top-[65%] left-[10%] md:left-[25%] text-rose-500/30 font-mono text-2xl md:text-5xl filter blur-[2px] md:blur-[4px] whitespace-nowrap">RBC 4.2 L</div>
                <div className="absolute top-[20%] right-[5%] md:right-[20%] text-emerald-500/20 font-mono text-lg md:text-2xl whitespace-nowrap">HGB 12.1</div>
                <div className="absolute bottom-[20%] right-[10%] md:right-[25%] text-amber-500/40 font-mono text-3xl md:text-4xl filter blur-[1px] md:blur-[3px] whitespace-nowrap">PLT 150</div>
                <div className="absolute top-[45%] left-[2%] md:left-[10%] text-slate-400/50 font-mono text-lg filter blur-[1px] md:blur-[2px] whitespace-nowrap">MCHC 33.5</div>
                <div className="absolute bottom-[40%] right-[2%] md:right-[15%] text-rose-500/20 font-mono text-xl md:text-3xl filter blur-[2px] md:blur-[5px] whitespace-nowrap">GLUCOSE 110</div>

                {/* Center Core Text */}
                <div className="text-center font-mono text-sm md:text-2xl tracking-[0.3em] md:tracking-[0.5em] text-emerald-400/80 font-bold z-10 filter drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                  READING CLINICAL VECTORS...
                </div>
              </div>
            </motion.div>

            {/* LAYER 2: BRIDGE (Fills the dead zone) */}
            <motion.div 
              style={{ opacity: bridgeOpacity, scale: bridgeScale }}
              className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none will-change-transform transform-gpu"
            >
              <div className="relative flex flex-col items-center">
                <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full scale-150" />
                <h2 className="text-xl md:text-4xl font-light tracking-[0.2em] md:tracking-[0.4em] text-emerald-400 animate-pulse text-center px-4 relative z-10">
                  EXTRACTING INSIGHTS
                </h2>
                <div className="h-0.5 w-32 md:w-48 bg-gradient-to-r from-transparent via-emerald-400 to-transparent mt-4 opacity-50" />
              </div>
            </motion.div>

            {/* LAYER 3: The Shield/Health Core */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none will-change-transform transform-gpu"
              style={{ 
                opacity: shieldOpacity,
                y: shieldY,
                scale: shieldScale,
              }}
            >
              <div className="relative w-32 h-32 md:w-56 md:h-56 rounded-full bg-[#0A192F] border-2 border-emerald-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                <div className="absolute inset-0 rounded-full border border-emerald-400/20 animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-2 rounded-full border border-dashed border-emerald-500/30 animate-[spin_15s_linear_infinite_reverse]" />
                <ShieldCheck className="w-16 h-16 md:w-24 md:h-24 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* LAYER 4: The Dashboard Cards / Insights */}
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none px-4 w-full max-w-lg mx-auto will-change-transform transform-gpu"
              style={{ 
                opacity: insightOpacity, 
                y: insightY,
              }}
            >
              <div className="flex flex-col gap-3 md:gap-4 w-full">
                {/* Emerald Card */}
                <div className="p-4 md:p-5 rounded-2xl bg-[#0A192F]/90 backdrop-blur-xl border border-emerald-500/40 flex items-start gap-3 md:gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform transition-transform hover:scale-[1.02]">
                  <div className="p-2 md:p-3 bg-emerald-500/10 rounded-xl shrink-0">
                    <Activity className="text-emerald-400 w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h3 className="text-emerald-400 font-bold text-sm md:text-base tracking-wide">Hemoglobin Optimal</h3>
                    <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">Levels are perfectly balanced, ensuring optimal oxygen flow across vitals.</p>
                  </div>
                </div>

                {/* Amber Card */}
                <div className="p-4 md:p-5 rounded-2xl bg-[#0A192F]/90 backdrop-blur-xl border border-amber-500/40 flex items-start gap-3 md:gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform transition-transform hover:scale-[1.02]">
                  <div className="p-2 md:p-3 bg-amber-500/10 rounded-xl shrink-0">
                    <AlertCircle className="text-amber-400 w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h3 className="text-amber-400 font-bold text-sm md:text-base tracking-wide">HbA1c Borderline</h3>
                    <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">Slightly elevated relative to baseline. Monitor dietary sugar and activity.</p>
                  </div>
                </div>

                {/* Info Table / List */}
                <div className="p-4 md:p-5 rounded-2xl bg-[#0A192F]/90 backdrop-blur-xl border border-white/10 flex flex-col gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform transition-transform hover:scale-[1.02]">
                  <div className="text-sm font-semibold tracking-wide text-slate-300">CLINICAL VECTORS</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs md:text-sm">
                      <span className="text-slate-400">Total Cholesterol</span>
                      <span className="text-amber-400 font-mono">240 mg/dL ↑</span>
                    </div>
                    <div className="flex justify-between items-center text-xs md:text-sm border-t border-white/5 pt-2">
                      <span className="text-slate-400">Vitamin D</span>
                      <span className="text-rose-400 font-mono">18 ng/mL ↓</span>
                    </div>
                    <div className="flex justify-between items-center text-xs md:text-sm border-t border-white/5 pt-2">
                      <span className="text-slate-400">WBC Count</span>
                      <span className="text-emerald-400 font-mono">6.5 K/uL ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* 3. LAB SUMMARY BENTO GRID */}
        <div className="w-full relative z-20 bg-[#0A192F] border-t border-white/5 pt-16 pb-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                Everything in its right place.
              </h2>
              <p className="text-lg text-slate-400 font-light leading-relaxed">
                Aegis extracts values directly from your PDFs, standardizes the units, and places them into an actionable dashboard.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {BENTO_LABS.map((lab) => {
                const Icon = lab.icon;
                return (
                  <div key={lab.id} className={`rounded-3xl p-6 border ${lab.border} ${lab.bg} backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
                    <div className="flex justify-between items-start mb-12">
                      <div className={`p-3 rounded-2xl bg-white/5 backdrop-blur-md ${lab.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-white/5 ${lab.color}`}>
                        {lab.status}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-slate-400 font-medium mb-1">{lab.label}</p>
                      <div className="flex items-baseline gap-2 mb-3">
                        <h3 className={`text-3xl font-bold tracking-tight ${lab.color}`}>{lab.value}</h3>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed font-light">
                        {lab.desc}
                      </p>
                    </div>

                    {/* Decorative glow */}
                    <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 ${lab.bg.split('/')[0]}`} />
                  </div>
                );
              })}
            </div>

            {/* 4. VIRTUAL POLYCLINIC SECTION */}
            <div className="mt-32 mb-16 border-t border-white/5 pt-24">
              <div className="text-center mb-16 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                  Consult the Specialists.
                </h2>
                <p className="text-lg text-slate-400 font-light leading-relaxed">
                  Don't just read your labs. Discuss them with a virtual polyclinic of AI specialists, each trained on global clinical guidelines.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {SPECIALISTS_SHOWCASE.map((spec, idx) => {
                  const Icon = spec.icon;
                  return (
                    <div key={idx} className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors flex flex-col items-center text-center group">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                        <Icon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-bold text-white tracking-wide mb-2">{spec.title}</h3>
                      <div className="mt-auto pt-2">
                        <span className="text-[10px] font-mono tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 whitespace-nowrap">
                          {spec.guidelines}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-24 text-center">
              <div className="mb-16 inline-grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto border-t border-b border-white/5 py-12">
                <div className="px-4">
                  <h3 className="text-white font-bold mb-2">AES-256 Database Encryption</h3>
                  <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-tighter">Your data is stored with enterprise-grade encryption and privacy controls.</p>
                </div>
                <div className="px-4 border-y md:border-y-0 md:border-x border-white/5">
                  <h3 className="text-white font-bold mb-2">Clinical Precision</h3>
                  <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-tighter">
                    Aegis Health AI uses advanced language models to structure data. It is an educational companion meant for tracking and preparation, not a clinical authority.
                  </p>
                </div>
                <div className="px-4">
                  <h3 className="text-white font-bold mb-2">Zero Data Sale</h3>
                  <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-tighter">We never sell your health information to insurers or third parties. Period.</p>
                </div>
              </div>

            {/* 5. ABOUT THE FOUNDER SECTION */}
            <div className="mt-32 mb-16 max-w-2xl mx-auto">
              <div className="bg-[#0f2a4a] border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-6 relative overflow-hidden">
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                
                <img 
                  src="https://lh3.googleusercontent.com/d/11-MtBvMJRl6OpfL60wypuMn-LCw2jC50" 
                  alt="Aniket Dhuri - Founder & Lead Developer of Aegis Health AI" 
                  className="w-48 h-48 md:w-56 md:h-56 shrink-0 object-cover object-[center_35%] rounded-full border border-slate-100 shadow-sm relative z-10 bg-slate-800"
                />

                <div className="text-center md:text-left relative z-10 w-full flex flex-col md:flex-row items-center md:items-start gap-8 mt-8">
                  <div className="flex flex-col text-left">
                    <h3 className="text-2xl font-bold text-white mb-4">Our Story</h3>
                    <p className="text-slate-300 font-light leading-relaxed mb-4 text-sm md:text-base">
                      Hi, I’m <a href="https://aniket.aegishealthai.co.in/" target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-400/30 hover:decoration-emerald-400 transition-all">Aniket Dhuri, the founder</a> of Aegis Health AI. I’m based in Dombivli, Maharashtra.
                    </p>
                    <p className="text-slate-300 font-light leading-relaxed mb-4 text-sm md:text-base">
                      This project started from a simple, frustrating observation: medical lab reports are written for doctors, not for the patients paying for them. When a family member gets a blood test or a scan, the days spent waiting for a doctor's appointment are often filled with anxiety, frantic Googling, and confusing medical jargon. 
                    </p>
                    <p className="text-slate-300 font-light leading-relaxed mb-8 text-sm md:text-base">
                      I built Aegis Health AI to bridge that gap.
                    </p>

                    <h3 className="text-2xl font-bold text-white mb-4">Our Stage & Vision</h3>
                    <p className="text-slate-300 font-light leading-relaxed mb-4 text-sm md:text-base">
                      We are currently in an early beta stage. This means the platform is live, completely free to use for feedback, and evolving every single day. Our mission isn’t to replace your doctor—nothing ever should. Our goal is to make health information clear, structured, and actionable for every Indian family, giving you the clarity you need to ask your doctor the right questions.
                    </p>
                    <p className="text-slate-300 font-light leading-relaxed mb-4 text-sm md:text-base">
                      We’re just getting started, and your feedback directly shapes the AI tools we build.
                    </p>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-5 w-full mt-4">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        Maharashtra, India
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <a href="https://github.com/dhurianiket/Aegis-health-ai-" target="_blank" rel="noreferrer" aria-label="Visit our GitHub page" className="p-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition-colors border border-white/5">
                          <Github className="w-5 h-5" />
                        </a>
                        <a href="https://www.linkedin.com/in/aniket-dhuri-273094225" target="_blank" rel="noreferrer" aria-label="Visit our LinkedIn page" className="p-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition-colors border border-white/5">
                          <Linkedin className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-emerald-400 font-medium mb-4 tracking-widest text-xs uppercase">Your health, decoded.</p>
              <h3 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight max-w-2xl mx-auto leading-tight">
                Stop guessing. Start knowing.
              </h3>
              <p className="text-lg text-slate-400 mb-10 max-w-lg mx-auto font-light leading-relaxed">
                Drop your first lab report into Aegis and see your health clearly. Premium health intelligence for everyone.
              </p>
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="px-10 py-5 bg-white text-[#0A192F] hover:bg-slate-200 rounded-full font-bold tracking-wide transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] inline-flex items-center gap-2"
              >
                {isSigningIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 text-emerald-500" /> START YOUR JOURNEY</>}
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <footer className="mt-32 pb-12 border-t border-white/5 pt-16 bg-[#0A192F]">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" strokeWidth={2} />
                  <span className="font-bold tracking-[0.2em] text-emerald-400 text-lg">
                    AEGIS
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-light leading-relaxed max-w-xs mx-auto md:mx-0">
                  Premium health intelligence for everyone. Powered by enterprise-grade AI infrastructure.
                </p>
              </div>

              <div className="text-center md:text-left">
                <h4 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Explore Aegis</h4>
                <ul className="space-y-3">
                  <li>
                    <Link to="/how-it-works.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link to="/about.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/security.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      Security First
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog-hba1c.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      HbA1c Sugar Guide
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog-cbc.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      CBC Blood Explainer
                    </Link>
                  </li>
                  <li>
                    <Link to="/engineering-playbook.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      Engineering Playbook
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="text-center md:text-left">
                <h4 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Contact & Support</h4>
                <ul className="space-y-4">
                  <li>
                    <a href="mailto:founder@aegishealthai.co.in" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm flex items-center justify-center md:justify-start gap-3">
                      <Mail className="w-4 h-4 shrink-0" /> founder@aegishealthai.co.in
                    </a>
                  </li>
                  <li>
                    <a href="mailto:support@aegishealthai.co.in" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm flex items-center justify-center md:justify-start gap-3">
                      <Mail className="w-4 h-4 shrink-0" /> support@aegishealthai.co.in
                    </a>
                  </li>
                  <li className="text-slate-400 text-sm flex items-center justify-center md:justify-start gap-3">
                    <MapPin className="w-4 h-4 shrink-0" /> Kalyan/Dombivli, Maharashtra, India
                  </li>
                </ul>
              </div>

              <div className="text-center md:text-right">
                <h4 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Legal</h4>
                <ul className="space-y-4">
                  <li>
                    <Link to="/privacy-policy" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm underline decoration-white/20 underline-offset-4">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms-of-service" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm underline decoration-white/20 underline-offset-4">
                      Terms & Medical Disclaimer
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 mb-8">
              <p className="text-xs text-slate-400 text-center uppercase tracking-widest mb-2 font-semibold">Important Medical Disclaimer (Public Beta)</p>
              <p className="text-[11px] text-slate-500 text-center max-w-4xl mx-auto leading-relaxed">
                Aegis Health AI is currently in public beta. It is an informational tool and does NOT provide medical advice, diagnosis, or treatment. It does not replace professional clinical assessments. Always consult a qualified healthcare provider regarding your health data or any medical condition. If you are experiencing an urgent medical issue, contact emergency services immediately.
              </p>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <p className="text-xs text-slate-400 tracking-wide uppercase mb-1">
                  &copy; {new Date().getFullYear()} Aegis Health AI. All rights reserved.
                </p>
                <p className="text-sm text-slate-400 transition-colors mb-2">
                  Proudly developed in Mumbai, Maharashtra, India.
                </p>
                <p className="text-[10px] text-slate-400 tracking-[0.2em] font-mono mb-2">
                  VERSION 1.7.0 / SECURE ENCRYPTION ACTIVE
                </p>
                <p className="text-[10px] text-slate-500 max-w-md">
                  This site uses only essential session cookies to keep you signed in. We do not use tracking or advertising cookies.
                </p>
              </div>

              <div className="text-center md:text-right">
                <p className="text-[10px] text-slate-400 flex items-center justify-center md:justify-end gap-1.5 font-medium italic">
                  Powered by <span className="text-slate-200">Google Gemini & Firebase</span>
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-8 mb-4 text-center">
              This site is protected by reCAPTCHA and the Google{' '}
              <a className="text-blue-500 hover:underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> and{' '}
              <a className="text-blue-500 hover:underline" href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Terms of Service</a> apply.
            </p>
          </footer>
        </div>
        </main>

        {/* Legal Modal */}
        <LegalModal 
          isOpen={legalModalOpen} 
          onClose={() => setLegalModalOpen(false)} 
          type={legalModalType} 
        />
      </div>
    </ErrorBoundary>
  );
}
