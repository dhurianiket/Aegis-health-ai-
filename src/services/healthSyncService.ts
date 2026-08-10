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

export interface HealthPermissions {
  heartRate: boolean;
  hrv: boolean;
  spo2: boolean;
  steps: boolean;
  sleep: boolean;
}

export const DEFAULT_PERMISSIONS: HealthPermissions = {
  heartRate: true,
  hrv: true,
  spo2: true,
  steps: true,
  sleep: true,
};

export function getHealthPermissions(userId: string, provider: HealthProvider): HealthPermissions {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`aegis_health_permissions_${provider}_${userId}`);
      if (raw) return { ...DEFAULT_PERMISSIONS, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_PERMISSIONS };
}

export function saveHealthPermissions(
  userId: string,
  provider: HealthProvider,
  permissions: Partial<HealthPermissions>
): HealthPermissions {
  const current = getHealthPermissions(userId, provider);
  const updated = { ...current, ...permissions };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        `aegis_health_permissions_${provider}_${userId}`,
        JSON.stringify(updated)
      );
    }
  } catch {}
  return updated;
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

  if (fileContent.trim().startsWith('<') || fileContent.includes('HealthData') || fileContent.includes('HKQuantityTypeIdentifier')) {
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
      spo2 = parsedVal <= 1 ? Math.round(parsedVal * 100) : Math.round(parsedVal);
    }

    const stepMatch = fileContent.match(/HKQuantityTypeIdentifierStepCount"[\s\S]*?value="([0-9.]+)"/);
    if (stepMatch) steps = parseInt(stepMatch[1], 10);

    const sleepMatches = fileContent.match(/HKCategoryTypeIdentifierSleepAnalysis"[\s\S]*?value="([A-Za-z0-9.]+)"/g);
    if (sleepMatches && sleepMatches.length > 0) {
      totalMinutes = Math.min(600, sleepMatches.length * 30);
      deepMinutes = Math.round(totalMinutes * 0.25);
      remMinutes = Math.round(totalMinutes * 0.22);
      lightMinutes = totalMinutes - deepMinutes - remMinutes;
    }
  } else {
    // JSON Format Parsing
    try {
      const obj = JSON.parse(fileContent);
      if (obj.heartRate ?? obj.heart_rate ?? obj.bpm) heartRate = Number(obj.heartRate ?? obj.heart_rate ?? obj.bpm);
      if (obj.rhr ?? obj.restingHeartRate ?? obj.resting_heart_rate) rhr = Number(obj.rhr ?? obj.restingHeartRate ?? obj.resting_heart_rate);
      if (obj.hrv ?? obj.heartRateVariability ?? obj.heart_rate_variability) hrv = Number(obj.hrv ?? obj.heartRateVariability ?? obj.heart_rate_variability);
      if (obj.spo2 ?? obj.oxygenSaturation ?? obj.oxygen_saturation) {
        const val = Number(obj.spo2 ?? obj.oxygenSaturation ?? obj.oxygen_saturation);
        spo2 = val <= 1 ? Math.round(val * 100) : Math.round(val);
      }
      if (obj.steps ?? obj.stepCount ?? obj.step_count) steps = Number(obj.steps ?? obj.stepCount ?? obj.step_count);
      if (obj.sleep) {
        totalMinutes = Number(obj.sleep.totalMinutes ?? obj.sleep.total_minutes ?? totalMinutes);
        deepMinutes = Number(obj.sleep.deepMinutes ?? obj.sleep.deep_minutes ?? deepMinutes);
        remMinutes = Number(obj.sleep.remMinutes ?? obj.sleep.rem_minutes ?? remMinutes);
        lightMinutes = Number(obj.sleep.lightMinutes ?? obj.sleep.light_minutes ?? lightMinutes);
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

  let rawSpo2 = rawObj.spo2 ?? rawObj.oxygenSaturation ?? rawObj.oxygen_saturation ?? rawObj.blood_oxygen ?? 98;
  if (typeof rawSpo2 === 'number' && rawSpo2 <= 1) {
    rawSpo2 = Math.round(rawSpo2 * 100);
  }

  const heartRate = rawObj.heartRate ?? rawObj.heart_rate ?? rawObj.bpm ?? rawObj.hr ?? 70;
  const rhr = rawObj.rhr ?? rawObj.restingHeartRate ?? rawObj.resting_heart_rate ?? 62;
  const hrv = rawObj.hrv ?? rawObj.heartRateVariability ?? rawObj.heart_rate_variability ?? rawObj.rmssd ?? 54;
  const steps = rawObj.steps ?? rawObj.stepCount ?? rawObj.step_count ?? rawObj.daily_steps ?? 6500;

  const rawSleep = rawObj.sleep ?? rawObj.sleep_architecture ?? {};
  const totalMinutes = Number(rawSleep.totalMinutes ?? rawSleep.total_minutes ?? 480);
  const deepMinutes = Number(rawSleep.deepMinutes ?? rawSleep.deep_minutes ?? 110);
  const remMinutes = Number(rawSleep.remMinutes ?? rawSleep.rem_minutes ?? 105);
  const lightMinutes = Number(rawSleep.lightMinutes ?? rawSleep.light_minutes ?? 265);
  const sleepScore = calculateSleepScore({ totalMinutes, deepMinutes, remMinutes, lightMinutes });
  const sleep: SleepArchitecture = { totalMinutes, deepMinutes, remMinutes, lightMinutes, sleepScore };

  const biometrics = parseRawTelemetryStream({
    id: `google-export-${Date.now()}`,
    userId,
    timestamp: new Date().toISOString(),
    heartRate,
    rhr,
    hrv,
    spo2: rawSpo2,
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
  saveHealthSyncState(userId, 'google', {
    connected: true,
    lastSynced: new Date().toISOString(),
    recordsCount: (currentState.googleHealth.recordsCount || 0) + 5,
  });

  return biometrics;
}

