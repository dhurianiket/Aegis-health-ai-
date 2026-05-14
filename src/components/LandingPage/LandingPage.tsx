import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Activity, Brain, Lock, ArrowRight, FileText, ChevronRight, FileDigit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'motion/react';

// --- Framer Motion Variants ---
const springTransition = { type: "spring", stiffness: 100, damping: 20 };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      ...springTransition
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springTransition
  }
};

// --- Subcomponents ---

// Bento Card with Radial Hover
const BentoCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden rounded-[32px] bg-white/5 border border-white/10 group backdrop-blur-sm ${className || ''}`}
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(32,201,151,0.1), transparent 40%)`
        }}
      />
      <div className="relative z-10 h-full p-8 flex flex-col">
          {children}
      </div>
    </div>
  );
}

// SVG Logo Draw Path
const AnimatedShield = () => {
  return (
    <div className="relative w-32 h-32 md:w-48 md:h-48 mb-8 mx-auto flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[#20C997]/20 blur-[60px] rounded-full" />
      
      <svg 
        viewBox="0 0 24 24" 
        className="w-full h-full text-[#20C997] relative z-10"
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <motion.path 
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" 
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* ECG pulse inside the shield */}
        <motion.path
          d="M8 12h2l1.5 -3l2 7l1.5 -4h1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
          strokeWidth="1.5"
          className="text-[#64FFDA]"
        />
      </svg>
    </div>
  );
};

export default function LandingPage() {
  const { signIn, isSigningIn } = useAuth();
  
  // Custom scroll mapping for hero section
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  
  // Custom blur cannot be directly animated via framer-motion built-ins easily via useTransform without template string, 
  // so we'll use a template rendering approach in the style prop.
  const blurValue = useTransform(scrollY, [0, 400], [0, 10]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error(error);
    }
  };

  // Chaos To Clarity Scroll Logic
  const chaosRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: chaosRef,
    offset: ["start start", "end end"]
  });

  // Smooth the scroll progress for visual transitions
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });
  
  // Fade out dense text, fade in UI graph based on scroll depth in the ChaosToClarity section
  const chaosTextOpacity = useTransform(smoothProgress, [0, 0.4, 0.6], [1, 1, 0]);
  const graphOpacity = useTransform(smoothProgress, [0.4, 0.6, 1], [0, 1, 1]);
  const graphScale = useTransform(smoothProgress, [0.4, 0.6, 1], [0.95, 1, 1]);
  
  const textBlurValue = useTransform(smoothProgress, [0, 0.4, 0.6], [0, 0, 8]);
  const graphBlurValue = useTransform(smoothProgress, [0.4, 0.6, 1], [8, 0, 0]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A192F] to-[#020C1B] text-white selection:bg-[#20C997]/30 font-sans flex flex-col overflow-x-hidden">
      
      {/* Navbar - Fixed but subtle */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...springTransition }}
        className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-50 absolute top-0 left-0 right-0"
      >
        <div className="flex items-center gap-3 group cursor-default">
          <ShieldCheck className="w-5 h-5 text-[#20C997] transition-transform duration-500 group-hover:rotate-12" strokeWidth={2} />
          <span className="font-semibold text-sm tracking-[0.2em] text-[#20C997]">AEGIS</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="text-xs font-semibold tracking-wide text-slate-300 hover:text-white transition-colors"
          >
            SIGN IN
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.main 
        style={{ 
          y: heroY, 
          opacity: heroOpacity,
          filter: useTransform(blurValue, v => `blur(${v}px)`)
        }}
        className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-12 px-6 top-0"
      >
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center flex flex-col items-center"
        >
          <AnimatedShield />
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 mb-6 leading-[1.1]"
          >
            Your Health,<br className="hidden md:block"/> Protected and Deciphered.
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Transform chaotic medical lab results into a clear, visual journey. 
            Aegis Health AI uses clinical-grade intelligence to track your trends and safeguard your future.
          </motion.p>
          
          <motion.div variants={itemVariants}>
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="relative px-8 py-4 bg-[#20C997] hover:bg-[#64FFDA] text-[#0A192F] rounded-full text-sm font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(32,201,151,0.4)] hover:shadow-[0_0_40px_rgba(100,255,218,0.6)] flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 rounded-full border border-white/20 scale-105 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 pointer-events-none animate-pulse" />
              GET STARTED FOR FREE 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </motion.main>

      {/* The Showcase: Chaos To Clarity */}
      {/* The container is 300vh tall to allow for plenty of scrolling while the content stays sticky */}
      <section ref={chaosRef} className="relative w-full h-[300vh] bg-[#0A192F]">
        <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
          <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* LEFT: Visual Transformation */}
            <div className="relative h-[400px] md:h-[500px] w-full max-w-md mx-auto lg:mx-0 rounded-[32px] overflow-hidden bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl perspective-1000">
              
              {/* State 1: The Chaos (Raw PDF Simulation) */}
              <motion.div 
                style={{ 
                  opacity: chaosTextOpacity,
                  filter: useTransform(textBlurValue, v => `blur(${v}px)`)
                }}
                className="absolute inset-0 p-8 flex flex-col font-mono text-[10px] md:text-xs text-slate-500 tracking-tighter leading-tight pointer-events-none"
              >
                <div className="flex justify-between border-b border-slate-700 pb-2 mb-4">
                  <span>CLINICAL_LAB_REPORT_FINAL_01.PDF</span>
                  <span>PAGE 1/1</span>
                </div>
                <div className="opacity-80 space-y-1">
                  <p>HGB 13.2 g/dL [12.0 - 15.5] NORMAL</p>
                  <p className="text-red-400/80">LDL-C 145 mg/dL {'>'} 100 HIGH - FLGD</p>
                  <p>HDL-C 45 mg/dL [{'>'} 40] NORMAL</p>
                  <p>WBC 6.5 k/uL [4.0 - 11.0] NORMAL</p>
                  <p>PLT 250 k/uL [150 - 450] NORMAL</p>
                  <p className="text-red-400/80 mt-4">GLUC 112 mg/dL [70 - 99] HIGH - PREDIABETIC RANGE</p>
                  <p>A1C 5.6 % [{'<'} 5.7] BORDERLINE</p>
                  <p>TSH 2.1 mIU/L [0.4 - 4.0] NORMAL</p>
                  <br />
                  <p className="blur-[1px]">RX: ATORVASTATIN 20MG PO DAILY</p>
                  <p className="blur-[1px]">DX: HYPERLIPIDEMIA (ESSENTIAL)</p>
                  <p className="blur-[2px]">NOTE: PT ADVISED ON DIET AND EXERCISE. F/U 6 MOS MIN. CARDIO R-EVAL NEEDED IF CHL REMAINS ELEVATED PREV 130 NOW 145.</p>
                  <br />
                  <p className="blur-[2px]">SODIUM 140 mmol/L [136 - 145] NORMAL</p>
                  <p className="blur-[2px]">POTASSIUM 4.2 mmol/L [3.5 - 5.1] NORMAL</p>
                  <p className="blur-[2px]">CHLORIDE 102 mmol/L [98 - 107] NORMAL</p>
                </div>
              </motion.div>

              {/* State 2: The Clarity (Clean UI Animation) */}
              <motion.div 
                style={{ 
                  opacity: graphOpacity, 
                  scale: graphScale,
                  filter: useTransform(graphBlurValue, v => `blur(${v}px)`)
                }}
                className="absolute inset-0 bg-[#0A192F] p-8 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-xl tracking-tight">Lipid Panel</h3>
                    <p className="text-[#20C997] text-sm font-medium">Clear Action Plan</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#20C997]/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[#20C997]" />
                  </div>
                </div>

                <div className="space-y-6 mt-8">
                  {/* Mock Chart element */}
                  <div className="relative h-32 w-full bg-slate-800/50 rounded-xl overflow-hidden flex items-end px-4 gap-2 pb-2">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between py-4 opacity-10 pointer-events-none">
                      <div className="border-b border-white w-full" />
                      <div className="border-b border-white w-full" />
                      <div className="border-b border-white w-full" />
                    </div>
                    {/* Bars */}
                    <motion.div className="w-1/4 bg-[#20C997] rounded-t-md relative group transform origin-bottom" style={{ height: "40%" }} />
                    <motion.div className="w-1/4 bg-[#20C997] rounded-t-md relative group transform origin-bottom" style={{ height: "65%" }} />
                    <motion.div className="w-1/4 bg-red-400 rounded-t-md relative group transform origin-bottom border-t-2 border-red-300 shadow-[0_0_15px_rgba(248,113,113,0.5)]" style={{ height: "85%" }} />
                  </div>

                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-medium">LDL Cholesterol</span>
                      <span className="text-red-400 font-bold">145 mg/dL</span>
                    </div>
                    <p className="text-slate-400 text-xs">Trending upwards. Your AI Assistant recommends reviewing statin dosage with your provider.</p>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* RIGHT: Scrolling Content / Storytelling */}
            <div className="flex flex-col justify-center h-full max-w-xl mx-auto lg:mx-0">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: false, margin: "-100px" }}
                 transition={{ ...springTransition }}
                 className="mb-16"
               >
                 <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-300 tracking-widest">
                  <FileText className="w-4 h-4 text-[#64FFDA]" /> EXTRACTION
                 </div>
                 <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">Read between the lines.</h2>
                 <p className="text-lg text-slate-400 font-light">Upload a raw clinical PDF, get the truth. Aegis instantly parses complex blood markers and presents clinically accurate language that actually makes sense to you.</p>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: false, margin: "-100px" }}
                 transition={{ ...springTransition, delay: 0.1 }}
                 className="mb-16"
               >
                 <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-300 tracking-widest">
                  <Activity className="w-4 h-4 text-[#20C997]" /> TRENDS
                 </div>
                 <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">See the big picture.</h2>
                 <p className="text-lg text-slate-400 font-light">Health isn't a single snapshot. Aegis connects the dots across months or years, mapping out visual graphs showing exactly how your markers are moving.</p>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: false, margin: "-100px" }}
                 transition={{ ...springTransition, delay: 0.2 }}
               >
                 <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-300 tracking-widest">
                  <Brain className="w-4 h-4 text-purple-400" /> INSIGHTS
                 </div>
                 <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">Understand the 'why'.</h2>
                 <p className="text-lg text-slate-400 font-light">Learn how your active prescriptions interact with your lab results. Aegis spots contraindications and provides clinical context for every medication you take.</p>
               </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-32 px-6 w-full max-w-7xl mx-auto z-10 relative">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Engineered for absolute trust.</h2>
          <p className="text-slate-400 font-light text-lg">Every feature is designed with clinical precision and uncompromising security.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          
          {/* Large Card 1 */}
          <BentoCard className="md:col-span-2 md:row-span-2 bg-[#0A192F]/80">
            <div className="flex-1">
              <Lock className="w-10 h-10 text-amber-400 mb-6" />
              <h3 className="text-3xl font-bold tracking-tight mb-4 text-white">Secure Document Vault</h3>
              <p className="text-slate-400 font-light text-lg max-w-sm">Encrypted, clinical-grade Firebase storage. Your entire medical history is backed by zero-trust architecture. You own it.</p>
            </div>
            <div className="mt-8 flex gap-3 overflow-hidden opacity-50 select-none">
                {/* Mock encrypted blocks */}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-24 h-12 bg-white/5 rounded-md border border-dashed border-white/20 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                    AES-256
                  </div>
                ))}
            </div>
          </BentoCard>

          {/* Small Card 1 */}
          <BentoCard>
            <ShieldCheck className="w-8 h-8 text-[#20C997] mb-6" />
            <h3 className="text-xl font-bold tracking-tight mb-2 text-white">Physician Ready</h3>
            <p className="text-slate-400 font-light text-sm">Generate SBAR summaries instantly. Hand over your exact clinical state to a new specialist in 60 seconds.</p>
          </BentoCard>

          {/* Small Card 2 */}
          <BentoCard>
            <FileDigit className="w-8 h-8 text-[#64FFDA] mb-6" />
            <h3 className="text-xl font-bold tracking-tight mb-2 text-white">AI Normalization</h3>
            <p className="text-slate-400 font-light text-sm">Different labs use different units (mg/dL vs mmol/L). Aegis normalizes everything into a unified timeline automatically.</p>
          </BentoCard>
        </div>
      </section>

      {/* Final CTA & Trust Footer */}
      <footer className="relative bg-[#020C1B] w-full pt-32 pb-12 px-6 border-t border-white/5 text-center flex flex-col items-center justify-center">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-[#20C997]/10 blur-[100px] pointer-events-none" />

        <ShieldCheck className="w-12 h-12 text-[#20C997] mx-auto mb-6 opacity-80" strokeWidth={1.5} />
        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Clinical Clarity. <br className="hidden md:block"/>Absolute Privacy.</h2>
        <p className="text-lg text-slate-400 font-light leading-relaxed mb-10 max-w-xl mx-auto">
          Your health data is your most sensitive asset. Ready to finally understand it?
        </p>
        
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="px-8 py-4 bg-white hover:bg-slate-200 text-[#0A192F] rounded-full text-sm font-bold tracking-wide transition-all hover:scale-105 flex items-center gap-2 mx-auto disabled:opacity-50"
        >
          {isSigningIn ? "AUTHORIZING..." : "JOIN AEGIS SECURELY"}
        </button>

        <div className="w-full max-w-5xl mx-auto mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-slate-600 font-light tracking-wide">
          <p>&copy; {new Date().getFullYear()} Aegis Health AI. All rights strictly reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
