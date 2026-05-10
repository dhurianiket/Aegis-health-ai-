import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WifiOff, Wifi, AlertTriangle } from "lucide-react";

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(isOffline || showStatus) && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-3 rounded-full border shadow-2xl backdrop-blur-xl ${
            isOffline
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff className="w-5 h-5 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight">
                  Offline Mode
                </span>
                <span className="text-[10px] uppercase font-black tracking-widest opacity-70">
                  Accessing cached data
                </span>
              </div>
            </>
          ) : (
            <>
              <Wifi className="w-5 h-5" />
              <span className="text-sm font-bold tracking-tight">
                Connection Restored
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
