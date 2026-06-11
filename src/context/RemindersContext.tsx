import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useProfile } from "./ProfileContext";
import { Appointment } from "../types/health";
import { checkAppointmentsForReminders } from "../services/reminderService";
import { HealthAlert } from "../types/alerts";

interface RemindersContextType {
  reminders: HealthAlert[];
  refreshReminders: () => Promise<void>;
}

const RemindersContext = createContext<RemindersContextType | undefined>(
  undefined,
);

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [reminders, setReminders] = useState<HealthAlert[]>([]);

  const refreshReminders = async () => {
    if (!user || !activeProfile) {
      setReminders([]);
      return;
    }

    try {
      // TODO: Implement getAppointments from Firestore when ready
      // Mocked data for now.
      const appts: Appointment[] = [];
      const generatedReminders = checkAppointmentsForReminders(appts);
      setReminders(generatedReminders);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    }
  };

  useEffect(() => {
    refreshReminders();
  }, [user, activeProfile]);

  return (
    <RemindersContext.Provider value={{ reminders, refreshReminders }}>
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(RemindersContext);
  if (context === undefined) {
    throw new Error("useReminders must be used within a RemindersProvider");
  }
  return context;
}
