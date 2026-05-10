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
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <div className="flex flex-col items-center">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-white/10 mb-4">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          >
            <ShieldCheck size={64} className="text-teal-400" strokeWidth={1.5} />
          </motion.div>
        </div>
        
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="text-white font-bold text-3xl tracking-[0.3em]">
            AEGIS
          </h1>
          <h2 className="text-teal-400 text-sm tracking-[0.5em] mt-1">
            HEALTH AI
          </h2>
        </motion.div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-teal-400"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-12 text-slate-500 text-xs tracking-widest text-center px-4">
        Your health telemetry, understood.
      </div>
    </div>
  );
}
