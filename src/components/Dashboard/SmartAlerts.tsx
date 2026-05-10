import React, { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAlerts } from "../../context/AlertsContext";
import AlertBanner from "../ui/AlertBanner";
import { BellRing } from "lucide-react";
import { LabResult } from "../../types/medical";

interface SmartAlertsProps {
  labs?: LabResult[];
}

export default function SmartAlerts({ labs }: SmartAlertsProps) {
  const { alerts, dismissedIds, dismissAlert } = useAlerts();

  const visibleAlerts = useMemo(() => {
    return alerts.filter((a) => !dismissedIds.has(a.id)).slice(0, 3);
  }, [alerts, dismissedIds]);

  const handleAction = (id: string) => {
    // Navigate to details or open modal
    console.log("Action taken for alert", id);
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="w-full mb-8">
      <div className="flex items-center gap-2 mb-4 px-2">
        <BellRing className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-bold text-white tracking-tight">
          Priority Alerts
        </h3>
        <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {visibleAlerts.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {visibleAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.95,
                height: 0,
                marginTop: 0,
                marginBottom: 0,
              }}
            >
              <AlertBanner
                alert={alert}
                onDismiss={dismissAlert}
                onAction={handleAction}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
