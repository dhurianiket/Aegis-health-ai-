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
}
