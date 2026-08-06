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
