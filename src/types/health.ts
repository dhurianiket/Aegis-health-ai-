export interface LabValue {
  id: string;
  markerName: string;
  value: number;
  unit: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  date: string;
  referenceRange?: string;
  category?: string;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  status: 'active' | 'discontinued' | 'on-hold';
  startDate: string;
  endDate?: string;
  indications: string[];
  sideEffects?: string[];
  warnings?: string[];
  instructions?: string;
}

export interface HealthProfile {
  id: string;
  userId: string;
  name: string;
  dob: string;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  healthScore: number;
  lastUpdated: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  location?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
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
  createdAt: string;
}
