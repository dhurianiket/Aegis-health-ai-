import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms' | null;
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  if (!isOpen || !type) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0A192F]/80 backdrop-blur-md" 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0f2a4a] border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              {type === 'privacy' ? 'Privacy Policy' : 'Terms & Medical Disclaimer'}
            </h3>
          </div>

          <div className="text-slate-300 leading-relaxed font-light space-y-4">
            {type === 'privacy' ? (
              <p>
                We process health documents using secure enterprise AI APIs. Data is encrypted via Firebase. You retain full ownership and can delete your uploaded reports and account at any time. We do not sell your health data.
              </p>
            ) : (
              <p>
                Aegis Health AI is a technology platform, not a healthcare provider. The AI-generated summaries (including SBAAR reports and AI Specialist interactions) are for informational purposes only and do not replace professional medical advice.
              </p>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold border border-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
