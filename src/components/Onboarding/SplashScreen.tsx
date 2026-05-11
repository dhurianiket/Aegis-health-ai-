import React from "react";
import { ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0d0d]">
      <div className="flex flex-col items-center animate-in fade-in duration-700">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-white/10 mb-6 shadow-2xl shadow-teal-500/5">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
          >
            <ShieldCheck size={68} className="text-teal-400" strokeWidth={1.2} />
          </motion.div>
        </div>
        
        <div className="flex flex-col items-center text-center">
          <h1 className="text-white font-bold text-3xl tracking-[0.3em] ml-[0.3em]">
            AEGIS
          </h1>
          <h2 className="text-teal-400/80 text-xs tracking-[0.5em] mt-2 font-medium">
            HEALTH SYSTEMS
          </h2>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-teal-400/60"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <span className="text-[10px] text-teal-400/30 uppercase tracking-[0.2em] font-medium">Initializing neural link...</span>
        </div>
      </div>

      <div className="fixed bottom-12 text-slate-600 text-[10px] uppercase tracking-[0.2em] font-medium animate-pulse">
        Encrypted Session Active
      </div>
    </div>
  );
}
