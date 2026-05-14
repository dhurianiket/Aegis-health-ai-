import React, { useRef, useState } from 'react';
import { ShieldCheck, ArrowRight, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

// A jagged path representing chaos, and a smooth path representing the Shield
const chaosPath = "M4 12 l4 -8 l3 10 l4 -12 l5 14 l-6 4 l-4 -10 l-3 8 Z";
const shieldPath = "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10";

// Floating medical jargon for Phase 1
const FLOATING_TEXTS = [
  "ERYTHROCYTES 5.8", "LDL-C 160 mg/dL", "A1C 5.9 % HIGH", "TSH 4.2 L", "CREATININE 1.1",
  "ALT 45 U/L", "AST 40 U/L", "GLOBULIN 3.5 g/dL", "HGB 14.1", "HCT 42.0",
];

export default function LandingPage() {
  const { signIn, isSigningIn } = useAuth();
  
  // The main scroll container
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth progress to remove jitter
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });

  // --- Phase 1 & 2: Chaos Text ---
  // Scale down and blur out between 0.3 and 0.5
  const chaosOpacity = useTransform(smoothProgress, [0, 0.2, 0.4], [1, 1, 0]);
  const chaosScale = useTransform(smoothProgress, [0, 0.4], [1, 0.5]);
  const chaosBlur = useTransform(smoothProgress, [0.2, 0.4], [0, 20]);

  // --- Phase 1 Copy ---
  const copy1Opacity = useTransform(smoothProgress, [0, 0.15, 0.25], [1, 1, 0]);
  const copy1Y = useTransform(smoothProgress, [0.15, 0.25], [0, -30]);

  // --- Phase 2 Copy ---
  const copy2Opacity = useTransform(smoothProgress, [0.3, 0.45, 0.55], [0, 1, 0]);
  const copy2Y = useTransform(smoothProgress, [0.3, 0.45, 0.55], [30, 0, -30]);

  // --- General Glow ---
  const glowOpacity = useTransform(smoothProgress, [0.3, 0.6], [0, 1]);

  // --- Morphing Object (Center) ---
  // Switch between chaos SVG and shield SVG visually using pathLength or opacity crossing
  const objectScale = useTransform(smoothProgress, [0, 0.4, 0.6], [1, 1.2, 0.8]);
  const objectX = useTransform(smoothProgress, [0.6, 0.8], ["0%", "-30%"]); // Move left for Phase 3
  // On mobile, maybe don't move X, move Y instead. We'll use a responsive approach below.

  const chaosShapeOpacity = useTransform(smoothProgress, [0.3, 0.5], [1, 0]);
  const shieldShapeOpacity = useTransform(smoothProgress, [0.4, 0.6], [0, 1]);

  // --- Phase 3: Dashboard Reveal ---
  const dashboardOpacity = useTransform(smoothProgress, [0.65, 0.85], [0, 1]);
  const dashboardX = useTransform(smoothProgress, [0.65, 0.85], [100, 0]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-[#0A192F] text-white selection:bg-[#20C997]/30 min-h-screen font-sans">
      
      {/* Absolute Navbar */}
      <nav className="fixed w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-50 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#20C997]" strokeWidth={2} />
          <span className="font-bold text-lg tracking-[0.2em] text-[#20C997]">AEGIS</span>
        </div>
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full text-xs font-semibold tracking-wide transition-all backdrop-blur-md disabled:opacity-50"
        >
          {isSigningIn ? "CONNECTING..." : "SIGN IN"}
        </button>
      </nav>

      {/* Cinematic 400vh Scroll Container */}
      <div ref={containerRef} className="relative w-full h-[400vh]">
        
        {/* Sticky Viewport */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
          
          {/* Global Light Source */}
          <motion.div 
            style={{ opacity: glowOpacity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#20C997]/10 to-[#64FFDA]/10 rounded-full blur-[120px] pointer-events-none -z-10" 
          />

          {/* Phase 1: Chaotic Text Background */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ 
              opacity: chaosOpacity, 
              scale: chaosScale,
              filter: useTransform(chaosBlur, v => `blur(${v}px)`)
            }}
          >
            {FLOATING_TEXTS.map((txt, i) => (
              <motion.div
                key={i}
                className="absolute font-mono text-slate-400/30 text-xl md:text-3xl font-bold tracking-tighter whitespace-nowrap"
                style={{
                  top: `${10 + (i * 8)}%`,
                  left: `${(i % 3) * 30}%`,
                  x: useTransform(smoothProgress, [0, 0.4], [0, i % 2 === 0 ? 100 : -100]),
                  y: useTransform(smoothProgress, [0, 0.4], [0, i % 2 !== 0 ? 50 : -50]),
                }}
              >
                {txt}
              </motion.div>
            ))}
          </motion.div>

          {/* Phase 1 Copy */}
          <motion.div 
            className="absolute text-center px-6 w-full max-w-4xl z-20"
            style={{ opacity: copy1Opacity, y: copy1Y }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Your health data is <br/><span className="text-slate-500 font-mono tracking-tighter">a foreign language.</span>
            </h1>
          </motion.div>

          {/* Phase 2 Copy */}
          <motion.div 
            className="absolute text-center px-6 w-full max-w-4xl z-20 pointer-events-none"
            style={{ opacity: copy2Opacity, y: copy2Y }}
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
              Aegis translates chaos <span className="text-[#20C997]">into clarity.</span>
            </h2>
          </motion.div>

          {/* Morphing Central Object */}
          <motion.div 
            className="absolute z-10 w-64 h-64 md:w-96 md:h-96 flex items-center justify-center"
            style={{ 
              scale: objectScale,
              x: objectX,
            }}
          >
            {/* Chaotic Shape */}
            <motion.svg 
              viewBox="0 0 24 24" 
              className="absolute w-32 h-32 text-slate-500 drop-shadow-2xl"
              fill="none" stroke="currentColor" strokeWidth="0.5"
              style={{ opacity: chaosShapeOpacity }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            >
              <path d={chaosPath} />
              <path d="M2 10 l4 4 l-2 6 l8 -4 l6 8 l2 -10 l-6 -2 Z" strokeDasharray="2 2" />
              <path d="M12 2 l4 8 l6 -2 l-4 6 l2 8 l-8 -4 l-6 6 Z" strokeOpacity={0.5} />
            </motion.svg>

            {/* Pristine Shield */}
            <motion.svg 
              viewBox="0 0 24 24" 
              className="absolute w-32 h-32 text-[#20C997] drop-shadow-[0_0_30px_rgba(32,201,151,0.5)]"
              fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: shieldShapeOpacity }}
            >
              <path d={shieldPath} />
            </motion.svg>
          </motion.div>

          {/* Phase 3: The Bento Dashboard Reveal */}
          <motion.div
            className="absolute right-0 w-full md:w-1/2 h-full flex flex-col justify-center p-6 md:p-12 z-20 max-w-2xl"
            style={{ 
              opacity: dashboardOpacity,
              x: dashboardX,
              pointerEvents: useTransform(smoothProgress, v => v > 0.6 ? "auto" : "none") as any
            }}
          >
            <div className="grid grid-cols-1 gap-4">
              
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#10B981]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <h3 className="font-semibold text-white tracking-wide">Kidney Function</h3>
                  <span className="ml-auto px-2 py-1 rounded-md bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold tracking-wider">OPTIMAL</span>
                </div>
                {/* Animated bar */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#10B981]"
                    style={{ width: useTransform(smoothProgress, [0.7, 0.8], ["0%", "85%"]) }}
                  />
                </div>
                <div className="mt-3 text-slate-400 text-xs font-light">eGFR 112 • Creatinine 0.8</div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#F59E0B]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <h3 className="font-semibold text-white tracking-wide">Lipid Panel</h3>
                  <span className="ml-auto px-2 py-1 rounded-md bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-bold tracking-wider">BORDERLINE</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{ width: useTransform(smoothProgress, [0.75, 0.85], ["0%", "60%"]) }}
                  />
                </div>
                <div className="mt-3 text-slate-400 text-xs font-light">LDL-C 125 mg/dL • Up 10% from last year</div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#EF4444]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#EF4444]/20 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                  </div>
                  <h3 className="font-semibold text-white tracking-wide">Vitamin D</h3>
                  <span className="ml-auto px-2 py-1 rounded-md bg-[#EF4444]/20 text-[#EF4444] text-[10px] font-bold tracking-wider">DEFICIENT</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    style={{ width: useTransform(smoothProgress, [0.8, 0.9], ["0%", "15%"]) }}
                  />
                </div>
                <div className="mt-3 text-[#EF4444] text-xs font-medium">18 ng/mL • Action required</div>
              </div>

              <div className="mt-8 flex flex-col items-start gap-4">
                <h3 className="text-2xl font-bold tracking-tight">Decoded. Secure. Yours.</h3>
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-8 py-4 rounded-full bg-[#20C997] text-[#0A192F] font-bold text-sm tracking-wide flex items-center gap-2 hover:bg-[#64FFDA] transition-colors shadow-[0_0_20px_rgba(32,201,151,0.4)] hover:shadow-[0_0_40px_rgba(100,255,218,0.6)]"
                >
                  ENTER THE VAULT <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
      
    </div>
  );
}

