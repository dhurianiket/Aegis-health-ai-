export type BluetoothConnectionState = 'connected' | 'disconnected' | 'syncing' | 'unsupported';

export interface SleepArchitecture {
  totalMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  lightMinutes: number;
  sleepScore: number;
}

export interface WearableBiometrics {
  id: string;
  userId: string;
  timestamp: string;
  heartRate: number;
  rhr: number;
  hrv: number;
  spo2: number;
  steps: number;
  sleep: SleepArchitecture;
  connectionStatus: 'connected' | 'disconnected' | 'syncing';
}

export interface TelemetryStreamConfig {
  intervalMs: number;
  enableBluetooth: boolean;
  mockNoiseFactor: number;
}

export interface BiometricSample {
  metric: 'heartRate' | 'rhr' | 'hrv' | 'spo2' | 'steps';
  value: number;
  timestamp: string;
  unit: string;
}

/**
 * BiometricPoint — a single time-series data point for trend charting.
 */
export interface BiometricPoint {
  timestamp: string;
  value: number;
  metric: string;
  unit: string;
}

/**
 * DailyWearableSummary — aggregated daily view of wearable data for a user.
 * Includes averages, totals, sleep architecture, and connection metadata.
 */
export interface DailyWearableSummary {
  userId: string;
  date: string; // ISO date string e.g. "2026-08-06"
  avgHeartRate: number;
  avgRhr: number;
  avgHrv: number;
  avgSpo2: number;
  totalSteps: number;
  sleep: SleepArchitecture;
  readinessScore: number;
  connectionStatus: 'connected' | 'disconnected' | 'syncing' | 'unsupported';
  sampleCount: number;
}

/**
 * BiometricDiagnosticInsight — a structured AI-generated health insight
 * combining wearable telemetry and clinical diagnostic context.
 */
export interface BiometricDiagnosticInsight {
  insightId: string;
  userId: string;
  generatedAt: string;
  readinessScore: number;
  headline: string;
  bodyMarkdown: string;
  sources: Array<{
    label: string;
    citationTag: string;
  }>;
  safetyLevel: 'safe' | 'caution' | 'urgent';
  actionItems: string[];
}
