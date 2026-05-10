import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Check, Info, AlertCircle, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { logAuditEvent } from '../../lib/auditLogger';

interface ConsentScreenProps {
  userId: string;
  onConsentGranted: () => void;
  onConsentChecked: (exists: boolean) => void;
}

export default function ConsentScreen({ userId, onConsentGranted, onConsentChecked }: ConsentScreenProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreements, setAgreements] = useState({
    data_storage: false,
    ai_processing: false,
    informational_only: false,
  });

  useEffect(() => {
    async function checkConsent() {
      try {
        const consentsRef = collection(db, 'users', userId, 'consents');
        const q = query(consentsRef, where('type', '==', 'initial_consent'));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          onConsentGranted();
        } else {
          onConsentChecked(false);
        }
      } catch (error) {
        console.error('Error checking consent:', error);
        onConsentChecked(false);
      } finally {
        setLoading(false);
      }
    }
    checkConsent();
  }, [userId, onConsentGranted, onConsentChecked]);

  const allAgreed = Object.values(agreements).every(v => v);

  const handleToggle = (key: keyof typeof agreements) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = async () => {
    if (!allAgreed || submitting) return;
    
    setSubmitting(true);
    try {
      const consentsRef = collection(db, 'users', userId, 'consents');
      await addDoc(consentsRef, {
        type: "initial_consent",
        grantedAt: serverTimestamp(),
        textVersion: "v1.0",
        items: Object.keys(agreements).filter(k => agreements[k as keyof typeof agreements])
      });
      
      logAuditEvent(userId, 'GRANT_CONSENT', 'initial_consent_v1.0');
      onConsentGranted();
    } catch (error) {
      console.error('Error saving consent:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-slate-900 border border-white/10 rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-8 text-center border-b border-white/5">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20 rotate-3 group">
              <Shield className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
            </div>
            <h2 id="consent-title" className="text-2xl font-bold text-white tracking-tight">Before you begin</h2>
            <p className="text-slate-400 text-sm mt-2">Please review and accept our data terms.</p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <ConsentItem 
                id="storage"
                checked={agreements.data_storage}
                onToggle={() => handleToggle('data_storage')}
                label="I agree to store my health data securely in Firebase"
                description="Your reports and data are encrypted and stored in your private Aegis vault."
              />
              <ConsentItem 
                id="ai"
                checked={agreements.ai_processing}
                onToggle={() => handleToggle('ai_processing')}
                label="I agree to my lab reports being processed by Google Gemini AI"
                description="We use AI for structured analysis and summarization of your medical documents."
              />
              <ConsentItem 
                id="info"
                checked={agreements.informational_only}
                onToggle={() => handleToggle('informational_only')}
                label="I understand this app provides informational summaries only"
                description="This is not a medical diagnosis tool. Always consult with a licensed professional."
              />
            </div>

            <button
              onClick={handleContinue}
              disabled={!allAgreed || submitting}
              className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${
                allAgreed 
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20' 
                : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <Check className={`w-5 h-5 transition-transform ${allAgreed ? 'scale-100' : 'scale-0'}`} />
                </>
              )}
              {allAgreed && (
                <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000 ease-in-out" />
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-black/20 border-t border-white/5 flex items-center gap-3">
             <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
             <p className="text-[10px] text-slate-500 leading-tight">
               Your privacy is our priority. Aegis Health AI implements HIPAA-aligned safeguards for your data security.
             </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ConsentItem({ id, checked, onToggle, label, description }: { 
  id: string; 
  checked: boolean; 
  onToggle: () => void;
  label: string;
  description: string;
}) {
  return (
    <div 
      className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none group/item ${
        checked 
        ? 'bg-indigo-500/5 border-indigo-500/30 ring-1 ring-indigo-500/30' 
        : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
      onClick={onToggle}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onToggle}
        className="sr-only"
      />
      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-black/20'
      }`}>
        <Check className={`w-4 h-4 text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`} />
      </div>
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm font-bold text-white block cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
