import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  ChevronRight,
  Filter,
} from "lucide-react";
import { HealthAlert } from "../../types/alerts";
import { useAlerts } from "../../context/AlertsContext";

interface NotificationDropdownProps {
  onClose: () => void;
}

type NotificationCategory = "all" | "critical" | "reminders" | "updates";

export default function NotificationDropdown({
  onClose,
}: NotificationDropdownProps) {
  const { alerts, markAllAsRead, dismissAlert, unreadCount } = useAlerts();
  const [activeCategory, setActiveCategory] =
    useState<NotificationCategory>("all");

  const filteredAlerts = alerts.filter((alert) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "critical")
      return alert.severity === "critical" || alert.severity === "high";
    if (activeCategory === "reminders")
      return alert.type === "appointment" || alert.type === "medication";
    if (activeCategory === "updates")
      return alert.type === "lab_value" || alert.type === "goal";
    return true;
  });

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "critical":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "reminders":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "updates":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 mt-3 w-80 md:w-96 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-black/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white tracking-tight text-lg">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                {unreadCount} New
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 uppercase tracking-widest transition-colors"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="p-1 text-slate-500 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-current rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              "all",
              "critical",
              "reminders",
              "updates",
            ] as NotificationCategory[]
          ).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                  : "bg-white/5 text-slate-500 border-transparent hover:border-white/10 hover:text-slate-300"
              } capitalize flex items-center gap-2`}
            >
              {getCategoryIcon(cat)}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 px-6 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-slate-400 font-bold">All clear!</p>
              <p className="text-slate-500 text-xs mt-1">
                No notifications in this category.
              </p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group p-4 rounded-2xl mb-1 flex gap-4 transition-all hover:bg-white/5 relative ${!alert.read ? "bg-indigo-500/5" : ""}`}
              >
                {!alert.read && (
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                )}

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    alert.severity === "critical"
                      ? "bg-red-500/20 text-red-400"
                      : alert.severity === "high"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-indigo-500/20 text-indigo-400"
                  }`}
                >
                  {alert.type === "medication" ? (
                    <Clock className="w-5 h-5" />
                  ) : alert.type === "appointment" ? (
                    <Calendar className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p
                      className={`text-sm font-bold truncate ${!alert.read ? "text-white" : "text-slate-400"}`}
                    >
                      {alert.title}
                    </p>
                    <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap pt-0.5">
                      {new Date(alert.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() =>
                        alert.actionUrl &&
                        window.open(alert.actionUrl, "_blank")
                      }
                      className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1"
                    >
                      View Details <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-[10px] font-black text-slate-600 hover:text-red-400 uppercase tracking-widest"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <button
          onClick={onClose}
          className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-indigo-500/20"
        >
          View All Activity
        </button>
      </div>
    </motion.div>
  );
}

function Calendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}
