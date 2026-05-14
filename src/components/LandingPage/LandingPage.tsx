import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Activity, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';

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
  const [isMobile, setIsMobile] = useState(false);

  // Reactive Glow
  const mouseX = useMotionValue(-1000); // Start off-screen
  const mouseY = useMotionValue(-1000);
  const smoothX = useSpring(mouseX, { stiffness: 200, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  // The main scroll container
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smoother progress with slightly less stiffness for cinematic feel
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.5 });

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
  const objectScale = useTransform(smoothProgress, [0, 0.4, 0.6], [1, 1.2, 0.8]);
  const objectXTransform = useTransform(smoothProgress, [0.6, 0.8], ["0%", "-28vw"]);
  const objectYTransform = useTransform(smoothProgress, [0.6, 0.8], ["0%", "-30vh"]);

  const chaosShapeOpacity = useTransform(smoothProgress, [0.3, 0.5], [1, 0]);
  const shieldShapeOpacity = useTransform(smoothProgress, [0.4, 0.6], [0, 1]);

  // --- Phase 3: Dashboard Reveal ---
  const dashboardOpacity = useTransform(smoothProgress, [0.65, 0.85], [0, 1]);
  const dashboardXTransform = useTransform(smoothProgress, [0.65, 0.85], [100, 0]);
  const dashboardYTransform = useTransform(smoothProgress, [0.65, 0.85], [100, 0]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div 
      className="bg-[#0A192F] text-white selection:bg-[#20C997]/30 min-h-screen font-sans relative"
      onPointerMove={handlePointerMove}
    >
      
      {/* Interactive Reactive Glow */}
      {!isMobile && (
        <motion.div
          className="pointer-events-none fixed top-0 left-0 w-[400px] h-[400px] bg-[#20C997]/15 rounded-full blur-[80px] z-0 mix-blend-screen"
          style={{
            x: smoothX,
            y: smoothY,
            translateX: "-50%",
            translateY: "-50%",
          }}
        />
      )}

      {/* Absolute Navbar */}
      <nav className="fixed w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-50 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-[#20C997]" strokeWidth={2} />
          <span className="font-bold border-l border-white/20 pl-3 text-sm md:text-lg tracking-[0.2em] text-[#20C997]">AEGIS</span>
        </div>
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full text-xs font-semibold tracking-wide transition-all backdrop-blur-md disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
        >
          {isSigningIn ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#20C997]" />
              CONNECTING
            </>
          ) : (
            "SIGN IN"
          )}
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
                className="absolute font-mono text-slate-400/20 text-xl md:text-3xl font-bold tracking-tighter whitespace-nowrap"
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
            className="absolute text-center px-6 w-full max-w-5xl z-20"
            style={{ opacity: copy1Opacity, y: copy1Y }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
              Your health data is <br/><span className="text-slate-500 font-mono tracking-tighter">a foreign language.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mt-4 max-w-2xl mx-auto font-light">
              Raw lab reports are messy, confusing, and hard to read.
            </p>
          </motion.div>

          {/* Phase 2 Copy */}
          <motion.div 
            className="absolute text-center px-6 w-full max-w-5xl z-20 pointer-events-none"
            style={{ opacity: copy2Opacity, y: copy2Y }}
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
              Upload. Extract. <br className="md:hidden" /><span className="text-[#20C997]">Understand.</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-400 mt-4 max-w-2xl mx-auto font-light">
              Aegis Health AI translates clinical chaos into a clear, visual story of your health over time.
            </p>
          </motion.div>

          {/* Morphing Central Object */}
          <motion.div 
            className="absolute z-10 flex items-center justify-center w-64 h-64 md:w-96 md:h-96"
            style={{ 
              scale: objectScale,
              x: isMobile ? 0 : objectXTransform,
              y: isMobile ? objectYTransform : 0,
            }}
          >
            {/* Chaotic Shape */}
            <motion.svg 
              viewBox="0 0 24 24" 
              className="absolute w-40 h-40 md:w-64 md:h-64 text-slate-500 drop-shadow-2xl"
              fill="none" stroke="currentColor" strokeWidth="0.5"
              style={{ opacity: chaosShapeOpacity }}
              animate={{ rotate: 360, scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            >
              <path d={chaosPath} />
              <path d="M2 10 l4 4 l-2 6 l8 -4 l6 8 l2 -10 l-6 -2 Z" strokeDasharray="1 3" strokeOpacity={0.7} />
              <path d="M12 2 l4 8 l6 -2 l-4 6 l2 8 l-8 -4 l-6 6 Z" strokeOpacity={0.5} strokeDasharray="4 4" />
            </motion.svg>

            {/* Pristine Shield with Heartbeat */}
            <motion.svg 
              viewBox="0 0 24 24" 
              className="absolute w-40 h-40 md:w-64 md:h-64 text-[#20C997] drop-shadow-[0_0_40px_rgba(32,201,151,0.6)]"
              fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: shieldShapeOpacity }}
            >
              <path d={shieldPath} />
              <motion.path 
                d="M7 12h2.5l1.5 -3.5l2 7l1.5 -3.5h2.5"
                stroke="#64FFDA" 
                strokeWidth="1.2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3, 
                  times: [0, 0.4, 0.7, 1],
                  ease: "easeInOut" 
                }}
              />
            </motion.svg>
          </motion.div>

          {/* Phase 3: The Bento Dashboard Reveal */}
          <motion.div
            className="absolute w-full md:w-1/2 h-[100dvh] flex flex-col justify-end md:justify-center p-4 pb-20 md:pb-6 md:p-12 z-20 max-w-2xl right-0"
            style={{ 
              opacity: dashboardOpacity,
              x: isMobile ? 0 : dashboardXTransform,
              y: isMobile ? dashboardYTransform : 0,
              pointerEvents: useTransform(smoothProgress, v => v > 0.6 ? "auto" : "none") as any
            }}
          >
            <div className="grid grid-cols-1 gap-2 md:gap-4 overflow-y-auto no-scrollbar max-h-full py-4 mt-16 md:mt-0 pointer-events-auto">
              
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden group shrink-0">
                <div className="absolute inset-0 bg-[#10B981]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <h3 className="font-semibold text-white tracking-wide">Kidney Function</h3>
                  <span className="ml-auto px-2 py-1 rounded-md bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold tracking-wider">NORMAL</span>
                </div>
                {/* Animated bar */}
                <div className="h-2 w-full bg-[#0A192F] rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="h-full bg-[#10B981]"
                    style={{ width: useTransform(smoothProgress, [0.7, 0.8], ["0%", "85%"]) }}
                  />
                </div>
                <div className="mt-3 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-light">eGFR 112 • Creatinine 0.8</span>
                  <Activity className="w-3 h-3 text-[#10B981] opacity-50" />
                </div>
                <p className="mt-2 text-xs text-slate-500 font-light leading-relaxed">
                  Your kidney function is within the healthy range. Keep staying hydrated to maintain these optimal levels.
                </p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden group shrink-0">
                <div className="absolute inset-0 bg-[#F59E0B]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <h3 className="font-semibold text-white tracking-wide">Lipid Panel</h3>
                  <span className="ml-auto px-2 py-1 rounded-md bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-bold tracking-wider">BORDERLINE</span>
                </div>
                <div className="h-2 w-full bg-[#0A192F] rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#F59E0B] to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{ width: useTransform(smoothProgress, [0.75, 0.85], ["0%", "60%"]) }}
                  />
                </div>
                <div className="mt-3 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-light text-[#F59E0B]">LDL-C 125 mg/dL</span>
                  <TrendingUp className="w-3 h-3 text-[#F59E0B]" />
                </div>
                <p className="mt-2 text-xs text-slate-500 font-light leading-relaxed">
                  Your 'bad' cholesterol is slightly elevated and trending upward. Consider discussing dietary changes with your doctor.
                </p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden group shrink-0">
                <div className="absolute inset-0 bg-[#EF4444]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#EF4444]/20 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                  </div>
                  <h3 className="font-semibold text-white tracking-wide">Vitamin D</h3>
                  <span className="ml-auto px-2 py-1 rounded-md bg-[#EF4444]/20 text-[#EF4444] text-[10px] font-bold tracking-wider">ABNORMAL</span>
                </div>
                <div className="h-2 w-full bg-[#0A192F] rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#EF4444] to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    style={{ width: useTransform(smoothProgress, [0.8, 0.9], ["0%", "15%"]) }}
                  />
                </div>
                <div className="mt-3 flex justify-between items-center text-xs">
                  <span className="text-[#EF4444] font-medium">18 ng/mL</span>
                  <AlertCircle className="w-3 h-3 text-[#EF4444]" />
                </div>
                <p className="mt-2 text-xs text-slate-500 font-light leading-relaxed">
                  Your levels indicate a deficiency. Supplementation may be needed to support immune function and bone health.
                </p>
              </div>

              <div className="mt-4 md:mt-8 flex flex-col items-center md:items-start gap-3 md:gap-4 text-center md:text-left shrink-0 pb-4">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Your report, visualized.</h3>
                <p className="text-sm md:text-base text-slate-400 max-w-md font-light leading-relaxed">
                  Instantly see what is normal, borderline, and abnormal, with clear human explanations and long-term trend tracking.
                </p>
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-6 py-3 md:px-8 md:py-4 mt-2 rounded-full bg-[#20C997] text-[#0A192F] font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-[#64FFDA] transition-colors shadow-[0_0_20px_rgba(32,201,151,0.4)] hover:shadow-[0_0_40px_rgba(100,255,218,0.6)] w-full md:w-auto min-w-[220px] pointer-events-auto"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>ENTER THE VAULT <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
      
      {/* Detail Section & Footer appending after 400vh cinematic scroll */}
      <div className="w-full flex-shrink-0 bg-[#0A192F] relative z-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                Your Personal <br/><span className="text-[#20C997]">Clinical Assistant.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Aegis Health AI empowers you to take control of your medical data. 
                Simply upload your lab reports and let our advanced AI extract, 
                normalize, and analyze your vital biomarkers over time.
              </p>
              
              <ul className="space-y-4 mb-10">
                {[
                  "Intelligent PDF Lab Report Extraction",
                  "Longitudinal Biomarker Tracking",
                  "Actionable Clinical Insights",
                  "Strictly Private & Secure"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-300">
                    <ShieldCheck className="w-5 h-5 text-[#20C997]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-sm tracking-wide hover:bg-white/10 transition-all flex items-center gap-2 group"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#20C997]" />
                  ) : (
                    <>CONNECT NOW <ArrowRight className="w-4 h-4 text-[#20C997] group-hover:translate-x-1 transition-transform" /></>
                  )}
              </button>
            </div>

            {/* Developer Card */}
            <div className="relative rounded-3xl bg-gradient-to-br from-white/10 to-transparent p-[1px]">
              <div className="bg-[#0A192F] rounded-[23px] p-10 h-full w-full relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#20C997] to-[#64FFDA] p-[2px] mb-6 shadow-[0_0_30px_rgba(32,201,151,0.3)]">
                  <div className="w-full h-full rounded-full bg-[#0A192F] flex items-center justify-center font-mono font-bold text-2xl text-[#20C997]">
                    AD
                  </div>
                </div>
                <h3 className="text-xl text-slate-400 mb-2 font-light tracking-wide">Architected & Engineered by</h3>
                <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Aniket Dhuri</h2>
                <div className="w-12 h-1 bg-[#20C997]/50 rounded-full mb-6" />
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm text-center">
                  Aegis AI was developed to bridge the gap between complex clinical data
                  and personal health awareness, bringing clarity through advanced AI engineering.
                </p>
              </div>
            </div>

          </div>

        </div>
        
        {/* Simple bottom footer */}
        <div className="border-t border-white/5 py-8 text-center text-xs tracking-wider text-slate-600">
          &copy; {new Date().getFullYear()} AEGIS HEALTH AI. ALL RIGHTS RESERVED.
        </div>
      </div>

    </div>
  );
}
