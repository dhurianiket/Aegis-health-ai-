import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useProfile } from "./ProfileContext";
import { getLabHistory, getMedications } from "../lib/firebase/firestore";
import { HealthAlert } from "../types/alerts";
import { getConsolidatedAlerts } from "../services/alertService";
import { LabResult, Medication } from "../types/medical";

interface AlertsContextType {
  alerts: HealthAlert[];
  dismissedIds: Set<string>;
  dismissAlert: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
  refreshAlerts: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("dismissedAlerts");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "dismissedAlerts",
      JSON.stringify(Array.from(dismissedIds)),
    );
  }, [dismissedIds]);

  const refreshAlerts = async () => {
    if (!user || !activeProfile) {
      setAlerts([]);
      return;
    }

    try {
      // Use local variables to avoid closure issues if activeProfile changes during fetch
      const currentUid = user.uid;
      const currentProfileId = activeProfile.id;

      const [labs, meds] = await Promise.all([
        getLabHistory(currentUid, undefined, currentProfileId),
        getMedications(currentUid, currentProfileId)
      ]);

      const labsData = labs || [];
      const medsData = meds || [];

      const generatedAlerts = getConsolidatedAlerts(labsData, medsData as Medication[]);

      // Feature 4.1: Clear notifications older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filteredAlerts = generatedAlerts.filter(
        (alert) => new Date(alert.createdAt) > thirtyDaysAgo,
      );

      setAlerts(filteredAlerts);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

  useEffect(() => {
    refreshAlerts();
  }, [user, activeProfile]);

  const dismissAlert = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = alerts.map((a) => a.id);
    setDismissedIds((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const unreadCount = alerts.filter((a) => !dismissedIds.has(a.id)).length;

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        dismissedIds,
        dismissAlert,
        markAllAsRead,
        unreadCount,
        refreshAlerts,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error("useAlerts must be used within an AlertsProvider");
  }
  return context;
}
