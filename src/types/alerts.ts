export interface HealthAlert {
  id: string;
  severity: 'critical' | 'high' | 'moderate' | 'normal';
  type: 'lab_value' | 'medication' | 'appointment' | 'goal';
  title: string;
  description: string;
  actionUrl?: string;
  createdAt: Date;
  reviewedAt?: Date;
  read: boolean;
}

export interface AlertThreshold {
  biomarker: string;
  minNormal?: number;
  maxNormal?: number;
  criticalMin?: number;
  criticalMax?: number;
}
