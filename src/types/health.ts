import { HealthAlert } from './alerts';

export interface LabValue {
  id: string;
  name: string;
  value: number;
  unit: string;
  normalRange: { min: number; max: number };
  referenceRange?: string;
  date: Date;
  doctorNotes?: string;
  flagged: boolean;
  severity: 'normal' | 'low' | 'high' | 'critical';
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  indications: string[];
  sideEffects?: string[];
  warnings?: string[];
  active: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  date: Date;
  doctorName?: string;
  location?: string;
  notes?: string;
}

export interface HealthProfile {
  id: string;
  userId: string;
  name: string;
  dob: Date;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  medications: Medication[];
  labValues: LabValue[];
  appointments: Appointment[];
  healthScore: number;
  lastUpdated: Date;
}

export interface HealthInsight {
  id: string;
  type: 'trend' | 'correlation' | 'alert' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  recommendation?: string;
  specialist?: string;
}
