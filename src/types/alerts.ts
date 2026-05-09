export type AlertSeverity = 'critical' | 'high' | 'moderate' | 'normal';
export type AlertType = 'lab_value' | 'medication' | 'appointment' | 'goal' | 'system';

export interface HealthAlert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  actionUrl?: string;
  createdAt: string | Date;
  reviewedAt?: string | Date;
  read: boolean;
}

export interface AlertThreshold {
  biomarker: string;
  minNormal?: number;
  maxNormal?: number;
  criticalMax?: number;
  criticalMin?: number;
}

export interface AlertContextType {
  alerts: HealthAlert[];
  dismissedIds: Set<string>;
  dismissAlert: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
  refreshAlerts: () => Promise<void>;
}
