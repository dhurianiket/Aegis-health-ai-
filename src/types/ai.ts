import {
  UserProfile,
  LabResult,
  Medication,
  SpecialistInsight,
} from "./medical";
import { HealthAlert } from "./alerts";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  profileId: string;
  messages: ChatMessage[];
  lastUpdated: Date;
  title?: string;
}

export type SpecialistId = 
  | 'cardiologist'
  | 'endocrinologist'
  | 'neurologist'
  | 'gastroenterologist'
  | 'pulmonologist'
  | 'nephrologist'
  | 'psychiatrist'
  | 'dermatologist'
  | 'orthopedist'
  | 'oncologist';

export interface SpecialistProfile {
  id: SpecialistId;
  name: string;
  displayName: string;
  specialty: string;
  description: string;
  expertise: string[];
  guidelines: string[];
  systemPrompt: string;
}

import { WearableBiometrics } from "./wearables";

export interface SpecialistConsultation {
  specialistId: SpecialistId | string;
  specialistName: string;
  lastUpdated: string;
  summary: string;
  lastUserQuery?: string;
  lastAssessment?: string;
  activeReferrals?: string[];
}

export interface ClinicalReferral {
  id: string;
  fromAgent: string;
  toSpecialist: SpecialistId;
  reason: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'dismissed';
}

export interface CoachSessionSummary {
  lastInteractionDate: string;
  recentTopics: string[];
  lastTriageNote?: string;
}

export interface PatientContext {
  profile: UserProfile;
  labHistory: LabResult[];
  medications: Medication[];
  recentInsights: SpecialistInsight[];
  alerts: HealthAlert[];
  reportedSymptoms?: string[];
  knownConditions?: string[];
  demographics?: {
    age: string;
    gender: string;
  };
  extraContext?: string;
  wearableTelemetry?: WearableBiometrics;
  specialistConsultations?: SpecialistConsultation[];
  activeReferrals?: ClinicalReferral[];
  coachSummary?: CoachSessionSummary;
}
