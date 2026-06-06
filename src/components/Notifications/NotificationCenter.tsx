import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HealthAlert } from "../../types/alerts";
import AlertBanner from "../ui/AlertBanner";
import { Bell, X } from "lucide-react";

interface NotificationCenterProps {
  alerts: HealthAlert[];
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
  onAction: (id: string) => void;
  onClose: () => void;
}

export default function NotificationCenter({
  alerts,
  dismissedIds,
  onDismiss,
  onAction,
  onClose,
}: NotificationCenterProps) {
  const visibleAlerts = useMemo(() => {
    return alerts.filter((a) => !dismissedIds.has(a.id));
  }, [alerts, dismissedIds]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md h-full bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Bell className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Notifications</h2>
            {visibleAlerts.length > 0 && (
              <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {visibleAlerts.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {visibleAlerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium tracking-tight">
                  You're all caught up!
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  No new notifications.
                </p>
              </motion.div>
            ) : (
              visibleAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, margin: 0 }}
                >
                  <AlertBanner
                    alert={alert}
                    onDismiss={onDismiss}
                    onAction={onAction}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
