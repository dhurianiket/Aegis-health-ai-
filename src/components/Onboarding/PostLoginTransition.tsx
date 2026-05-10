import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PostLoginTransitionProps {
  onComplete: () => void;
}

export default function PostLoginTransition({ onComplete }: PostLoginTransitionProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 600);
    const t2 = setTimeout(() => setPhase(3), 1200);
    const t3 = setTimeout(() => onComplete(), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-white/10 mb-4">
                <ShieldCheck size={64} className="text-teal-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-white font-bold text-3xl tracking-[0.3em]">
                AEGIS
              </h1>
            </motion.div>

            <AnimatePresence>
              {phase >= 2 && (
                <motion.div
                  className="flex flex-col items-center mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-white text-lg">Welcome back</p>
                  <motion.div
                    className="h-[2px] bg-teal-400 mt-3"
                    initial={{ width: 0 }}
                    animate={{ width: 120 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
