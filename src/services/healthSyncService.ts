import { WearableBiometrics, SleepArchitecture } from '../types/wearables';
import { saveWearableTelemetry } from '../lib/firebase/firestore';
import { parseRawTelemetryStream, CLINICAL_BOUNDS, calculateSleepScore } from './wearableService';

export type HealthProvider = 'apple' | 'google';

export interface HealthProviderConfig {
  connected: boolean;
  lastSynced: string | null;
  recordsCount: number;
  autoSync: boolean;
}

export interface HealthSyncState {
  appleHealth: HealthProviderConfig;
  googleHealth: HealthProviderConfig;
}

export interface SyncResult {
  success: boolean;
  recordsSynced: number;
  biometrics: WearableBiometrics | null;
  timestamp: string;
  provider: HealthProvider;
  error?: string;
}

const STORAGE_KEY_PREFIX = 'aegis_health_sync_state';

const DEFAULT_CONFIG: HealthProviderConfig = {
  connected: false,
  lastSynced: null,
  recordsCount: 0,
  autoSync: true,
};

/**
 * Retrieves the current synchronization config for Apple Health and Google Health Connect for a given user.
 */
export function getHealthSyncState(userId: string): HealthSyncState {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          appleHealth: { ...DEFAULT_CONFIG, ...(parsed.appleHealth || {}) },
          googleHealth: { ...DEFAULT_CONFIG, ...(parsed.googleHealth || {}) },
        };
      }
    }
  } catch {
    // Fallback if localStorage unavailable
  }

  return {
    appleHealth: { ...DEFAULT_CONFIG },
    googleHealth: { ...DEFAULT_CONFIG },
  };
}

/**
 * Persists updated provider sync configuration to local storage.
 */
export function saveHealthSyncState(
  userId: string,
  provider: HealthProvider,
  updates: Partial<HealthProviderConfig>
): HealthSyncState {
  const currentState = getHealthSyncState(userId);
  const targetKey = provider === 'apple' ? 'appleHealth' : 'googleHealth';

  const updatedState: HealthSyncState = {
    ...currentState,
    [targetKey]: {
      ...currentState[targetKey],
      ...updates,
    },
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        `${STORAGE_KEY_PREFIX}_${userId}`,
        JSON.stringify(updatedState)
      );
    }
  } catch {
    // Fail gracefully
  }

  return updatedState;
}

/**
 * Simulates real-time Apple Health (HealthKit) sync, generating realistic telemetry
 * from Apple Watch / iOS HealthKit API payloads.
 */
export async function syncAppleHealth(userId: string): Promise<SyncResult> {
  const timestamp = new Date().toISOString();
  try {
    // Generate realistic Apple Health telemetry with tight clinical parameters
    const rawAppleData = {
      id: `apple-health-${Date.now()}`,
      userId,
      timestamp,
      heartRate: Math.round(68 + (Math.random() - 0.5) * 4),
      restingHeartRate: Math.round(60 + (Math.random() - 0.5) * 2),
      heartRateVariability: Math.round(58 + (Math.random() - 0.5) * 6),
      spo2: Math.min(100, Math.max(97, Math.round(98 + (Math.random() - 0.5) * 2))),
      steps: Math.floor(7800 + Math.random() * 400),
      sleep: {
        totalMinutes: 465,
        deepMinutes: 115,
        remMinutes: 105,
        lightMinutes: 245,
      },
      source: 'Apple Health (HealthKit)',
    };

    const biometrics = parseRawTelemetryStream(rawAppleData);

    // Save to Firestore reactive subcollection
    if (userId && userId !== 'demo-user-id' && userId !== 'unknown_user') {
      try {
        await saveWearableTelemetry(userId, biometrics);
      } catch (err: any) {
        console.warn('[Apple Health Sync] Firestore sync fallback:', err.message);
      }
    }

    const state = getHealthSyncState(userId);
    const newRecordsCount = (state.appleHealth.recordsCount || 0) + 5;

    saveHealthSyncState(userId, 'apple', {
      connected: true,
      lastSynced: timestamp,
      recordsCount: newRecordsCount,
    });

    return {
      success: true,
      recordsSynced: 5,
      biometrics,
      timestamp,
      provider: 'apple',
    };
  } catch (err: any) {
    return {
      success: false,
      recordsSynced: 0,
      biometrics: null,
      timestamp,
      provider: 'apple',
      error: err.message || 'Failed to sync with Apple Health',
    };
  }
}

/**
 * Simulates real-time Google Health Connect / Google Fit REST sync.
 */
export async function syncGoogleHealth(userId: string): Promise<SyncResult> {
  const timestamp = new Date().toISOString();
  try {
    const rawGoogleData = {
      id: `google-health-${Date.now()}`,
      userId,
      timestamp,
      heartRate: Math.round(71 + (Math.random() - 0.5) * 5),
      restingHeartRate: Math.round(63 + (Math.random() - 0.5) * 3),
      heartRateVariability: Math.round(52 + (Math.random() - 0.5) * 5),
      spo2: Math.min(100, Math.max(96, Math.round(98 + (Math.random() - 0.5) * 2))),
      steps: Math.floor(8200 + Math.random() * 500),
      sleep: {
        totalMinutes: 480,
        deepMinutes: 120,
        remMinutes: 100,
        lightMinutes: 260,
      },
      source: 'Google Health Connect',
    };

    const biometrics = parseRawTelemetryStream(rawGoogleData);

    if (userId && userId !== 'demo-user-id' && userId !== 'unknown_user') {
      try {
        await saveWearableTelemetry(userId, biometrics);
      } catch (err: any) {
        console.warn('[Google Health Sync] Firestore sync fallback:', err.message);
      }
    }

    const state = getHealthSyncState(userId);
    const newRecordsCount = (state.googleHealth.recordsCount || 0) + 5;

    saveHealthSyncState(userId, 'google', {
      connected: true,
      lastSynced: timestamp,
      recordsCount: newRecordsCount,
    });

    return {
      success: true,
      recordsSynced: 5,
      biometrics,
      timestamp,
      provider: 'google',
    };
  } catch (err: any) {
    return {
      success: false,
      recordsSynced: 0,
      biometrics: null,
      timestamp,
      provider: 'google',
      error: err.message || 'Failed to sync with Google Health Connect',
    };
  }
}

/**
 * Parses Apple Health export XML or JSON format into structured WearableBiometrics entity.
 */
export function parseAppleHealthExport(fileContent: string, userId: string): WearableBiometrics {
  let heartRate: number = CLINICAL_BOUNDS.HEART_RATE.default;
  let rhr: number = CLINICAL_BOUNDS.RHR.default;
  let hrv: number = CLINICAL_BOUNDS.HRV.default;
  let spo2: number = CLINICAL_BOUNDS.SPO2.default;
  let steps: number = 0;

  let totalMinutes = 450;
  let deepMinutes = 100;
  let remMinutes = 95;
  let lightMinutes = 255;

  if (fileContent.trim().startsWith('<') || fileContent.includes('HealthData')) {
    // XML Export Parsing
    const hrMatch = fileContent.match(/HKQuantityTypeIdentifierHeartRate"[\s\S]*?value="([0-9.]+)"/);
    if (hrMatch) heartRate = parseFloat(hrMatch[1]);

    const rhrMatch = fileContent.match(/HKQuantityTypeIdentifierRestingHeartRate"[\s\S]*?value="([0-9.]+)"/);
    if (rhrMatch) rhr = parseFloat(rhrMatch[1]);

    const hrvMatch = fileContent.match(/HKQuantityTypeIdentifierHeartRateVariabilitySDNN"[\s\S]*?value="([0-9.]+)"/);
    if (hrvMatch) hrv = parseFloat(hrvMatch[1]);

    const spo2Match = fileContent.match(/HKQuantityTypeIdentifierOxygenSaturation"[\s\S]*?value="([0-9.]+)"/);
    if (spo2Match) {
      const parsedVal = parseFloat(spo2Match[1]);
      spo2 = parsedVal <= 1 ? parsedVal * 100 : parsedVal;
    }

    const stepMatch = fileContent.match(/HKQuantityTypeIdentifierStepCount"[\s\S]*?value="([0-9.]+)"/);
    if (stepMatch) steps = parseInt(stepMatch[1], 10);
  } else {
    // JSON Format Parsing
    try {
      const obj = JSON.parse(fileContent);
      if (obj.heartRate) heartRate = Number(obj.heartRate);
      if (obj.rhr || obj.restingHeartRate) rhr = Number(obj.rhr || obj.restingHeartRate);
      if (obj.hrv || obj.heartRateVariability) hrv = Number(obj.hrv || obj.heartRateVariability);
      if (obj.spo2) spo2 = Number(obj.spo2);
      if (obj.steps) steps = Number(obj.steps);
      if (obj.sleep) {
        totalMinutes = Number(obj.sleep.totalMinutes || totalMinutes);
        deepMinutes = Number(obj.sleep.deepMinutes || deepMinutes);
        remMinutes = Number(obj.sleep.remMinutes || remMinutes);
        lightMinutes = Number(obj.sleep.lightMinutes || lightMinutes);
      }
    } catch {
      // Return default bounded telemetry if JSON parsing fails
    }
  }

  const sleepScore = calculateSleepScore({ totalMinutes, deepMinutes, remMinutes, lightMinutes });
  const sleep: SleepArchitecture = { totalMinutes, deepMinutes, remMinutes, lightMinutes, sleepScore };

  const biometrics = parseRawTelemetryStream({
    id: `apple-export-${Date.now()}`,
    userId,
    timestamp: new Date().toISOString(),
    heartRate,
    rhr,
    hrv,
    spo2,
    steps,
    sleep,
    connectionStatus: 'connected',
  });

  // Save to Firestore and sync state
  if (userId && userId !== 'demo-user-id' && userId !== 'unknown_user') {
    try {
      saveWearableTelemetry(userId, biometrics);
    } catch {}
  }

  const currentState = getHealthSyncState(userId);
  saveHealthSyncState(userId, 'apple', {
    connected: true,
    lastSynced: new Date().toISOString(),
    recordsCount: (currentState.appleHealth.recordsCount || 0) + 5,
  });

  return biometrics;
}

/**
 * Parses Google Health Connect / Google Fit export JSON payload.
 */
export function parseGoogleHealthExport(jsonContent: string, userId: string): WearableBiometrics {
  let rawObj: any = {};
  try {
    rawObj = JSON.parse(jsonContent);
  } catch {
    rawObj = {};
  }

  const biometrics = parseRawTelemetryStream({
    id: `google-export-${Date.now()}`,
    userId,
    timestamp: new Date().toISOString(),
    heartRate: rawObj.heartRate ?? rawObj.heart_rate ?? rawObj.bpm ?? 70,
    rhr: rawObj.rhr ?? rawObj.restingHeartRate ?? 62,
    hrv: rawObj.hrv ?? rawObj.heartRateVariability ?? 54,
    spo2: rawObj.spo2 ?? rawObj.oxygenSaturation ?? 98,
    steps: rawObj.steps ?? rawObj.stepCount ?? 6500,
    sleep: rawObj.sleep ?? { totalMinutes: 480, deepMinutes: 110, remMinutes: 105, lightMinutes: 265 },
    connectionStatus: 'connected',
  });

  // Save to Firestore and sync state
  if (userId && userId !== 'demo-user-id' && userId !== 'unknown_user') {
    try {
      saveWearableTelemetry(userId, biometrics);
    } catch {}
  }

  const currentState = getHealthSyncState(userId);
  saveHealthSyncState(userId, 'google', {
    connected: true,
    lastSynced: new Date().toISOString(),
    recordsCount: (currentState.googleHealth.recordsCount || 0) + 5,
  });

  return biometrics;
}
