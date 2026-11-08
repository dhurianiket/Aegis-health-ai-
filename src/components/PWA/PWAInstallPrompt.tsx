import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, Share, PlusSquare, Smartphone, Check } from "lucide-react";
import { isStandalone, isIOS } from "../../lib/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSAL_KEY = "aegis_pwa_install_dismissed_until";
const DISMISS_DURATION_DAYS = 7;

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);
  const isIosDevice = isIOS();

  useEffect(() => {
    // 1. If already installed as standalone PWA, never show
    if (isStandalone()) {
      return;
    }

    // 2. Check if dismissed within the last 7 days
    const dismissedUntil = localStorage.getItem(DISMISSAL_KEY);
    const isDismissed = dismissedUntil && Date.now() < parseInt(dismissedUntil, 10);

    // 3. Android / Chrome / Chromium event handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissed) {
        setShowBanner(true);
      }
    };

    // 4. App installed handler
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setShowIOSGuide(false);
      setDeferredPrompt(null);
    };

    // 5. Explicit trigger from Settings or Navigation
    const handleManualTrigger = () => {
      if (isIosDevice) {
        setShowIOSGuide(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt().then(() => {
          setDeferredPrompt(null);
        }).catch((err) => {
          console.warn("[PWA] Prompt error:", err);
          setShowBanner(true);
        });
      } else {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("aegis:trigger-pwa-install", handleManualTrigger);

    // 6. On iOS Safari, display the banner after a gentle delay if not dismissed
    if (isIosDevice && !isDismissed) {
      const iosTimer = setTimeout(() => {
        setShowBanner(true);
      }, 4000);
      return () => {
        clearTimeout(iosTimer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
        window.removeEventListener("aegis:trigger-pwa-install", handleManualTrigger);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("aegis:trigger-pwa-install", handleManualTrigger);
    };
  }, [isIosDevice, deferredPrompt]);

  const handleInstallClick = async () => {
    if (isIosDevice) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback: If prompt already consumed or not ready, guide user
      setShowIOSGuide(false);
      setShowBanner(false);
      alert("To install Aegis Health AI: Tap your browser's menu (⋮) and select 'Install app' or 'Add to Home screen'.");
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn("[PWA] Installation prompt failed:", err);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    // Suppress for 7 days
    const expiry = Date.now() + DISMISS_DURATION_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSAL_KEY, expiry.toString());
  };

  if (installed || (!showBanner && !showIOSGuide)) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Card Banner */}
      <AnimatePresence>
        {showBanner && !showIOSGuide && (
          <motion.aside
            role="region"
            aria-label="Install mobile application"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#0c1319]/95 dark:bg-[#0c1319]/95 backdrop-blur-xl border border-teal-500/30 rounded-2xl p-4 shadow-2xl shadow-teal-950/40"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0f766e] to-[#014d52] p-2 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/40 border border-teal-400/20">
                <Smartphone className="w-6 h-6 text-white" aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white tracking-tight">
                    Get Aegis Mobile App
                  </h4>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 rounded border border-teal-500/30">
                    Free
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                  Install for 1-tap full-screen access, instant lab uploads & offline biomarker review.
                </p>

                <div className="flex items-center gap-2.5 mt-3">
                  <button
                    onClick={handleInstallClick}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium shadow-md shadow-teal-900/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    Install App
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                aria-label="Dismiss app install banner"
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors absolute top-3 right-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* iOS Safari Instruction Sheet */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ios-install-title"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="w-full max-w-sm bg-[#0c1319] border border-teal-500/30 rounded-3xl p-5 shadow-2xl text-white relative"
            >
              <button
                onClick={handleDismiss}
                aria-label="Close installation guide"
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f766e] to-[#014d52] flex items-center justify-center p-2 border border-teal-400/20">
                  <Smartphone className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <h3 id="ios-install-title" className="text-base font-semibold">
                    Install Aegis on iPhone
                  </h3>
                  <p className="text-xs text-slate-400">Add to your Home Screen in 2 steps</p>
                </div>
              </div>

              <ol className="space-y-3.5 my-5 text-xs text-slate-200">
                <li className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div className="flex-1 pt-0.5">
                    <span>Tap the <strong>Share</strong> button at the bottom of Safari:</span>
                    <div className="mt-1.5 flex items-center gap-1.5 text-teal-400 font-medium">
                      <Share className="w-4 h-4" /> <span>Share icon</span>
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div className="flex-1 pt-0.5">
                    <span>Scroll down and tap <strong>Add to Home Screen</strong>:</span>
                    <div className="mt-1.5 flex items-center gap-1.5 text-teal-400 font-medium">
                      <PlusSquare className="w-4 h-4" /> <span>Add to Home Screen</span>
                    </div>
                  </div>
                </li>
              </ol>

              <button
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-teal-900/30"
              >
                <Check className="w-4 h-4" />
                Got it, thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
