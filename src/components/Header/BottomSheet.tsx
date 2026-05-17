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
            className="fixed inset-0 bg-black/60 z-50 md:hidden pointer-events-auto"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", pointerEvents: "none" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg)] rounded-t-3xl z-50 md:hidden border-t border-[var(--color-border)] pb-safe pointer-events-auto"
          >
            <div className="flex justify-center p-3" onClick={onClose}>
              <div className="w-12 h-1.5 bg-[var(--color-border)] rounded-full" />
            </div>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="absolute top-4 right-4 p-2 rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)]"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
