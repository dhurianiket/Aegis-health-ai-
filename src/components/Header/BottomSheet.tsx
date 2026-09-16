import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: "none" }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 md:hidden pointer-events-auto"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", pointerEvents: "none" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg)]/95 backdrop-blur-2xl rounded-t-[32px] z-50 md:hidden border-t border-white/20 dark:border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.3)] pb-safe pointer-events-auto overscroll-contain max-h-[85dvh] overflow-y-auto"
          >
            <div className="flex justify-center p-3 cursor-grab" onClick={onClose}>
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
            </div>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="absolute top-3.5 right-4 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:scale-90 transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 pt-2">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
