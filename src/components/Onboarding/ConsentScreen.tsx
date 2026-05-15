import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, AlertCircle, Check, Loader2 } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase/config";
import { logAuditEvent } from "../../lib/auditLogger";

interface ConsentScreenProps {
  userId: string;
  onConsentGranted: () => void;
  onConsentChecked: (exists: boolean) => void;
  onClose?: () => void;
}

const steps = [
  {
    id: "data_storage",
    title: "Secure Storage",
    icon: (
      <Shield
        size={32}
        className="text-[var(--color-primary)]"
        strokeWidth={1.5}
      />
    ),
    desc: "Your health records are encrypted and stored in your private vault using Firebase. We never share your data with unauthorized third parties.",
    checkboxLabel: "I agree to store my health data securely",
  },
  {
    id: "ai_processing",
    title: "AI Interoperability",
    icon: (
      <Sparkles
        size={32}
        className="text-[var(--color-primary)]"
        strokeWidth={1.5}
      />
    ),
    desc: "Aegis uses Google Gemini AI to extract and structure data from your PDF lab reports. This allows us to track trends and provide insights over time.",
    checkboxLabel: "I agree to automated processing of my records",
  },
  {
    id: "informational_only",
    title: "Not Medical Advice",
    icon: (
      <AlertCircle
        size={32}
        className="text-[var(--color-critical)]"
        strokeWidth={1.5}
      />
    ),
    desc: "The insights provided are for informational purposes only. Do not use this application to make diagnostic or treatment decisions.",
    checkboxLabel: "I understand this is not a diagnostic tool",
  },
];

export default function ConsentScreen({
  userId,
  onConsentGranted,
  onConsentChecked,
  onClose,
}: ConsentScreenProps) {
  const [loading, setLoading] = useState(true); // Don't render until consent is checked
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [agreements, setAgreements] = useState<Record<string, boolean>>({
    data_storage: false,
    ai_processing: false,
    informational_only: false,
  });

  useEffect(() => {
    let isMounted = true;

    if (localStorage.getItem("aegis_consent_granted") === "true") {
      onConsentChecked(true);
      return;
    }

    async function checkConsent() {
      try {
        const consentsRef = collection(db, "users", userId, "consents");
        const q = query(consentsRef, where("type", "==", "initial_consent"));
        const querySnapshot = await getDocs(q);

        if (isMounted) {
          if (!querySnapshot.empty) {
            localStorage.setItem("aegis_consent_granted", "true");
            onConsentChecked(true);
          } else {
            onConsentChecked(false);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error checking consent:", error);
        if (isMounted) {
          onConsentChecked(false);
          setLoading(false);
        }
      }
    }
    checkConsent();
    return () => { isMounted = false; };
  }, [userId, onConsentChecked]);

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      if (submitting) return;
      setSubmitting(true);
      
      // Safety timeout: auto-proceed after 4 seconds as a fallback
      const safetyTimeout = setTimeout(() => {
        console.warn("Consent save timed out, proceeding anyway.");
        setSubmitting(false);
        onConsentGranted();
      }, 4000);

      try {
        const consentsRef = collection(db, "users", userId, "consents");
        await addDoc(consentsRef, {
          type: "initial_consent",
          grantedAt: serverTimestamp(),
          textVersion: "v2.0",
          items: Object.keys(agreements),
        });

        localStorage.setItem("aegis_consent_granted", "true");
        logAuditEvent(userId, "GRANT_CONSENT", "initial_consent_v2.0");
        clearTimeout(safetyTimeout);
        onConsentGranted();
      } catch (error) {
        console.error("Error saving consent:", error);
        clearTimeout(safetyTimeout);
        // Still proceed even if DB write fails to keep user in app
        onConsentGranted();
      } finally {
        setSubmitting(false);
      }
    }
  };

  const currentStepData = steps[step];
  const isCurrentChecked = agreements[currentStepData.id];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
        className="glass-card max-w-sm w-full overflow-hidden flex flex-col min-h-[480px] bg-theme pb-8 relative"
      >
        <div className="flex-1 px-8 pt-12 pb-6 relative flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center max-w-[280px]"
            >
              <div className="mb-8 w-16 h-16 rounded-[20px] bg-surface flex items-center justify-center">
                {currentStepData.icon}
              </div>
              <h2
                id="consent-title"
                className="text-2xl font-semibold tracking-tight mb-3"
              >
                {currentStepData.title}
              </h2>
              <p className="text-[15px] leading-relaxed text-muted mb-10">
                {currentStepData.desc}
              </p>

              <button
                onClick={() =>
                  setAgreements((prev) => ({
                    ...prev,
                    [currentStepData.id]: !prev[currentStepData.id],
                  }))
                }
                className={`w-full flex items-center gap-4 p-4 rounded-[16px] text-left transition-colors border ${isCurrentChecked ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20 ring-1 ring-[var(--color-primary)]/20" : "bg-surface border-surface hover:bg-surface/80"}`}
              >
                <div
                  className={`w-6 h-6 rounded-full border flex flex-shrink-0 items-center justify-center transition-colors ${isCurrentChecked ? "bg-[var(--color-primary)] border-transparent" : "bg-transparent border-muted"}`}
                >
                  {isCurrentChecked && (
                    <Check size={14} className="text-white" strokeWidth={3} />
                  )}
                </div>
                <span
                  className={`text-[15px] font-medium leading-tight ${isCurrentChecked ? "text-[var(--color-primary)]" : "text-theme"}`}
                >
                  {currentStepData.checkboxLabel}
                </span>
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-8 mt-auto flex flex-col items-center">
          <button
            onClick={handleNext}
            disabled={!isCurrentChecked || submitting}
            className="w-full h-14 rounded-full bg-[var(--color-primary)] text-white font-semibold text-base transition-opacity disabled:opacity-30 disabled:cursor-not-allowed mb-6 flex justify-center items-center"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step === steps.length - 1 ? (
              "Complete Setup"
            ) : (
              "Continue"
            )}
          </button>

          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-[var(--color-primary)]" : "bg-surface border border-surface"}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
