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
}
