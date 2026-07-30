import React, { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import AlertBanner from "../ui/AlertBanner";
import { BellRing } from "lucide-react";
import { useAlerts } from "../../context/AlertsContext";

export default function SmartAlerts({ labs }: { labs?: any[] }) {
  const { dismissedIds, dismissAlert } = useAlerts();

  const visibleAlerts = useMemo(() => {
    if (!labs) return [];
    // Only looking at the latest report (history[0]) since it's already sorted by Date
    const alerts: any[] = [];
    labs.forEach((lab: any) => {
      const isHigh = lab.status === 'high' || lab.status === 'abnormal';
      const isLow = lab.status === 'low';
      if (isHigh || isLow) {
        alerts.push({
          id: `alert-${lab.markerName}`,
          type: isHigh ? 'critical' : 'warning',
          title: `Abnormal Level: ${lab.markerName}`,
          message: `Your recent test shows a ${isHigh ? 'High' : 'Low'} value of ${lab.value} ${lab.unit}. Ref: ${lab.referenceRange}`,
          actionLabel: 'View details',
          date: lab.date
        });
      }
    });
    return alerts.filter((a) => !dismissedIds.has(a.id)).slice(0, 3);
  }, [labs, dismissedIds]);

  const handleAction = (id: string) => {
    window.location.hash = "reports";
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="w-full mb-8 min-h-[250px]">
      <div className="flex items-center gap-2 mb-4 px-2">
        <BellRing className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-bold text-[var(--color-text)] tracking-tight">
          Priority Alerts
        </h3>
        <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
