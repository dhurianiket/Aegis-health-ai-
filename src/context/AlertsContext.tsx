import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useProfile } from './ProfileContext';
import { getLabHistory, getMedications } from '../lib/firebase/firestore';
import { HealthAlert } from '../types/alerts';
import { getConsolidatedAlerts } from '../services/alertService';
import { LabResult, Medication } from '../types/medical';

interface AlertsContextType {
  alerts: HealthAlert[];
  dismissedIds: Set<string>;
  dismissAlert: (id: string) => void;
  unreadCount: number;
  refreshAlerts: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const refreshAlerts = async () => {
    if (!user || !activeProfile) {
      setAlerts([]);
      return;
    }
    
    try {
      const labs = await getLabHistory(user.uid, undefined, activeProfile.id) || [];
      const meds = await getMedications(user.uid, activeProfile.id) || [];
      
      const generatedAlerts = getConsolidatedAlerts(labs, meds as Medication[]);
      setAlerts(generatedAlerts);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

  useEffect(() => {
    refreshAlerts();
  }, [user, activeProfile]);

  const dismissAlert = (id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const unreadCount = alerts.filter(a => !dismissedIds.has(a.id)).length;

  return (
    <AlertsContext.Provider value={{ alerts, dismissedIds, dismissAlert, unreadCount, refreshAlerts }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
}
