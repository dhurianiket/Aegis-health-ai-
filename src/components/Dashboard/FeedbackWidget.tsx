import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const formId = import.meta.env.VITE_FEEDBACK_FORM_ID;

  if (!formId) return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-[var(--color-primary)] text-white shadow-xl shadow-[var(--color-primary)]/20 hover:scale-105 transition-transform z-40 flex items-center justify-center"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <h3 className="font-bold text-sm">Beta Feedback</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="w-full h-[450px]">
              <iframe 
                src={`https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true`} 
                width="100%" 
                height="100%" 
                frameBorder={0} 
                marginHeight={0} 
                marginWidth={0}
                title="Feedback Form"
              >Loading…</iframe>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
