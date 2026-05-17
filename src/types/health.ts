export interface LabValue {
  id: string;
  markerName: string;
  value: number;
  unit: string;
  status: "normal" | "low" | "high" | "critical";
  date: string;
  referenceRange?: string;
  category?: string;
  notes?: string;
}

export interface Medication {
  id: string;
  userId: string;
  genericName: string;
  brandName: string | null;
  rxcui: string | null;       // RxNorm concept identifier
  dosage: string | null;      // e.g., "500mg"
  frequency: string | null;   // e.g., "Twice daily"
  startDate: string | null;
  endDate: string | null;     // null means currently active
  prescribedFor: string | null;
  addedAt: string;
}

export interface DrugInteraction {
  id: string;
  drugA: string;
  drugB: string;
  rxcuiA: string;
  rxcuiB: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  plainSummary: string;       // Generated from explainInteraction()
  source: 'rxnorm';           // Always 'rxnorm'
  checkedAt: string;
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
  status: "scheduled" | "completed" | "cancelled";
}

export interface HealthInsight {
  id: string;
  type: "trend" | "correlation" | "alert" | "recommendation";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  evidence: string[];
  recommendation?: string;
  specialist?: string;
  createdAt: string;
}

export interface LabObservation {
  testName: string;
  valueCanonical: number | null;
  unitCanonical: string | null;
  flag: "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | null;
  collectedAt: string; // ISO date string
  reportId: string;
}

export interface LabReminder {
  id: string;
  userId: string;
  testName: string;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  reason: string;  // e.g., "HbA1c was HIGH - recheck in 90 days"
  status: 'pending' | 'snoozed' | 'completed' | 'dismissed';
  createdAt: string;
  sourceReportId: string | null;
  snoozedUntil: string | null;
}
