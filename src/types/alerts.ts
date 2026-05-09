export type AlertSeverity = 'critical' | 'high' | 'moderate' | 'normal';
export type AlertType = 'lab_value' | 'medication' | 'appointment' | 'goal' | 'system';

export interface HealthAlert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  actionUrl?: string;
  createdAt: string;
  reviewedAt?: string;
  read: boolean;
}

export interface AlertContextType {
  alerts: HealthAlert[];
  dismissedIds: Set<string>;
  dismissAlert: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
  refreshAlerts: () => Promise<void>;
}
