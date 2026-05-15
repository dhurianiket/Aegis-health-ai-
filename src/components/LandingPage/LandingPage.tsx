import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Activity, TrendingUp, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import { ErrorBoundary } from '../ErrorBoundary';

// ----------------------------------------------------------------------
// MOCK DATA
// ----------------------------------------------------------------------
const BENTO_LABS = [
  { id: 'hb', label: 'Hemoglobin', value: '14.2 g/dL', status: 'normal', desc: 'Optimal oxygen transport. Keep it up.', trend: 'stable', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  { id: 'hba1c', label: 'HbA1c', value: '5.8%', status: 'borderline', desc: 'Slightly elevated. Monitor dietary sugar.', trend: 'up', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { id: 'vitd', label: 'Vitamin D', value: '18 ng/mL', status: 'abnormal', desc: 'Deficient level. Supplementation recommended.', trend: 'down', icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
  { id: 'crp', label: 'CRP', value: '3.5 mg/L', status: 'borderline', desc: 'Slight systemic inflammation detected.', trend: 'up', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
];

const CHAOS_TEXT = [
  "WBC 12.5 H", "RBC 4.2", "HGB 12.1", "HCT 36.5", "MCV 85.0", 
  "MCH 28.5", "MCHC 33.5", "RDW 14.2", "PLT 150", "MPV 9.5 L",
  "ALT 85 H", "AST 65 H", "ALP 120", "BILIRUBIN 1.2", "ALBUMIN 4.5",
  "GLUCOSE 110 H", "BUN 15", "CREATININE 0.9", "SODIUM 140", "POTASSIUM 4.2",
  "CHLORIDE 100", "CO2 25", "CALCIUM 9.5", "PROTEIN 7.0", "GLOBULIN 2.5",
];

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function LandingPage() {
  const { signIn, isSigningIn } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

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

  const coreBlur = useTransform(heroProgress, [0, 0.8], [20, 0]);
  const coreScale = useTransform(heroProgress, [0, 0.8], [0.9, 1.1]);

  // Sticky Scroll Story (Chaos to Clarity)
  const stickyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: stickyRaw } = useScroll({
    target: stickyRef,
    offset: ["start start", "end end"]
  });
  const stickyProgress = useSpring(stickyRaw, { stiffness: 60, damping: 20 });

  // Phase 1: Chaos Texts (Leaves early)
  const chaosOpacity = useTransform(stickyProgress, [0, 0.3], [1, 0]);
  
  // Phase 2: BRIDGE (Fills the dead zone)
  const bridgeOpacity = useTransform(stickyProgress, [0.15, 0.25, 0.4, 0.5], [0, 1, 1, 0]);
  const bridgeScale = useTransform(stickyProgress, [0.15, 0.25], [0.8, 1]);

  // Phase 3: Shield (Health Core)
  const shieldOpacity = useTransform(stickyProgress, [0.35, 0.45], [0, 1]);
  const shieldY = useTransform(stickyProgress, [0.45, 0.6], ["0%", "-35%"]);

  // Phase 4: Dashboard Cards / Insights (The Reveal)
  const insightOpacity = useTransform(stickyProgress, [0.45, 0.6, 1], [0, 1, 1]);
  const insightY = useTransform(stickyProgress, [0.45, 0.6, 1], [50, 0, 0]);

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
            </div>
          </div>
        </nav>

        {/* 1. HERO SECTION */}
        <div ref={heroRef} className="relative min-h-screen flex items-center pt-24 pb-12">
          {/* Background subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center w-full relative z-10">
            {/* Left Content */}
            <div className="max-w-2xl">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]"
              >
                Turn lab reports <br className="hidden md:block" />
                <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">into clarity.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="text-lg md:text-xl text-slate-400 mb-10 font-light max-w-lg leading-relaxed"
              >
                Understand what is normal, what needs attention, and what changed over time. Your personal clinical AI assistant.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#0A192F] rounded-full font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
                >
                  {isSigningIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "START FOR FREE"}
                </button>
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold border border-white/10 tracking-wide transition-all flex items-center justify-center gap-2"
                >
                  VIEW DEMO <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>

            {/* Right Content: Floating Health Core */}
            <div className="relative h-[400px] md:h-[600px] flex items-center justify-center pointer-events-none origin-center">
              <motion.div 
                className="absolute w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/30 flex items-center justify-center will-change-[transform,filter]"
                style={{
                  filter: useTransform(coreBlur, v => `blur(${v}px)`),
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

        <div ref={stickyRef} className="relative w-full h-[300vh]">
          <div className="sticky top-0 h-[100dvh] w-full flex items-center justify-center overflow-hidden">
            
            <div className="absolute inset-0 bg-[#0A192F] pointer-events-none -z-20" />

            {/* Cinematic Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F] via-transparent to-[#0A192F] z-50 pointer-events-none" />

            {/* LAYER 1: Raw Report Blur (Chaos) */}
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none will-change-[opacity]"
              style={{ 
                opacity: chaosOpacity, 
              }}
            >
              <div className="text-center opacity-40 font-mono text-sm md:text-lg tracking-widest text-emerald-500/50 filter blur-[2px]">
                <p>MCHC 33.5 RDW 14.2 PLT 150</p>
                <p>GLUCOSE 110 H BUN 15</p>
                <p>CHOLESTEROL TOTAL: 240 mg/dL</p>
              </div>
            </motion.div>

            {/* LAYER 2: BRIDGE (Fills the dead zone) */}
            <motion.div 
              style={{ opacity: bridgeOpacity, scale: bridgeScale }}
              className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
            >
              <h2 className="text-2xl md:text-4xl font-light tracking-widest text-emerald-400 animate-pulse text-center px-4">
                DECODING CLINICAL DATA...
              </h2>
            </motion.div>

            {/* LAYER 3: The Shield/Health Core */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none will-change-[transform,opacity,filter]"
              style={{ 
                opacity: shieldOpacity,
                y: shieldY,
              }}
            >
              <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-20 h-20 md:w-24 md:h-24 text-emerald-400" strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* LAYER 4: The Dashboard Cards / Insights */}
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center z-40 mt-32 md:mt-40 pointer-events-none px-4 w-full max-w-md mx-auto"
              style={{ 
                opacity: insightOpacity, 
                y: insightY,
              }}
            >
              <div className="flex flex-col gap-4 w-full">
                {/* Emerald Card */}
                <div className="p-5 rounded-2xl bg-[#0A192F]/80 backdrop-blur-md border border-emerald-500/30 flex items-start gap-4 shadow-lg">
                  <Activity className="text-emerald-400 mt-1 shrink-0" />
                  <div>
                    <h3 className="text-emerald-400 font-medium">Hemoglobin Optimal</h3>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">Levels are perfectly balanced, ensuring optimal oxygen flow.</p>
                  </div>
                </div>

                {/* Amber Card */}
                <div className="p-5 rounded-2xl bg-[#0A192F]/80 backdrop-blur-md border border-amber-500/30 flex items-start gap-4 shadow-lg">
                  <AlertCircle className="text-amber-400 mt-1 shrink-0" />
                  <div>
                    <h3 className="text-amber-400 font-medium">HbA1c Borderline</h3>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">Slightly elevated. Monitor dietary sugar and activity.</p>
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
                        <h4 className={`text-3xl font-bold tracking-tight ${lab.color}`}>{lab.value}</h4>
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

            <div className="mt-24 text-center">
              <div className="mb-16 inline-grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto border-t border-b border-white/5 py-12">
                <div className="px-4">
                  <h4 className="text-white font-bold mb-2">HIPAA Ready</h4>
                  <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-tighter">Your data is stored with enterprise-grade encryption and privacy controls.</p>
                </div>
                <div className="px-4 border-y md:border-y-0 md:border-x border-white/5">
                  <h4 className="text-white font-bold mb-2">Clinical Precision</h4>
                  <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-tighter">Powered by high-context clinical models with 99.8% extraction accuracy.</p>
                </div>
                <div className="px-4">
                  <h4 className="text-white font-bold mb-2">Zero Data Sale</h4>
                  <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-tighter">We never sell your health information to insurers or third parties. Period.</p>
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
          <footer className="mt-32 pb-12 border-t border-white/5 pt-12">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                <p className="text-xs text-slate-500 tracking-wide uppercase mb-1">
                  &copy; {new Date().getFullYear()} Aegis Health AI. All rights reserved.
                </p>
                <p className="text-[10px] text-slate-600 tracking-[0.2em] font-mono">
                  VERSION 1.6.0 / SECURE ENCRYPTION ACTIVE
                </p>
              </div>

              <div className="text-center md:text-right">
                <p className="text-xs text-slate-400 tracking-wide mb-2 flex items-center justify-center md:justify-end gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  Developed by <span className="text-white font-medium">Aniket Dhuri</span>
                </p>
                <p className="text-[10px] text-slate-500 flex items-center justify-center md:justify-end gap-1 font-medium italic">
                  Powered by <span className="text-slate-300">Gemini AI Studio</span>
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                </p>
              </div>
            </div>
          </footer>
        </div>

      </div>
    </ErrorBoundary>
  );
}
