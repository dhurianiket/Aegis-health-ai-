import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useProfile } from "./ProfileContext";
// import { getAppointments } from '../lib/firebase/firestore'; // Optional if implemented
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
      // Mocked data for now. In a real app, query appointments from Firestore:
      // const appts = await getAppointments(user.uid, activeProfile.id);
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
