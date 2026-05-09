export type ChatRole = 'user' | 'assistant' | 'system';

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
  profile: any;
  labHistory: any[];
  medications: any[];
  recentInsights: any[];
  alerts: any[];
}
