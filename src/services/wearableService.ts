import {
  WearableBiometrics,
  SleepArchitecture,
  TelemetryStreamConfig,
  BluetoothConnectionState,
  BiometricSample,
} from '../types/wearables';

export const CLINICAL_BOUNDS = {
  RHR: { min: 30, max: 220, default: 65 },
  HRV: { min: 5, max: 250, default: 50 },
  SPO2: { min: 70, max: 100, default: 98 },
  STEPS: { min: 0, max: 1000000, default: 0 },
  HEART_RATE: { min: 30, max: 220, default: 72 },
} as const;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function sanitizeNumber(value: unknown, min: number, max: number, defaultValue: number): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return clamp(value, min, max);
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return clamp(parsed, min, max);
    }
  }
  return defaultValue;
}

/**
 * Calculates a 0-100 sleep score based on deep sleep ratio (~20-25%), REM ratio (~20-25%),
 * and total sleep duration (7-9 hours optimal).
 */
export function calculateSleepScore(sleep: Omit<SleepArchitecture, 'sleepScore'>): number {
  if (!sleep || typeof sleep.totalMinutes !== 'number' || isNaN(sleep.totalMinutes) || sleep.totalMinutes <= 0) {
    return 0;
  }

  const total = sleep.totalMinutes;
  const deep = typeof sleep.deepMinutes === 'number' && !isNaN(sleep.deepMinutes) ? Math.max(0, sleep.deepMinutes) : 0;
  const rem = typeof sleep.remMinutes === 'number' && !isNaN(sleep.remMinutes) ? Math.max(0, sleep.remMinutes) : 0;

  // 1. Duration Score (40 points max)
  // Optimal: 7 to 9 hours (420 to 540 minutes)
  let durationScore = 0;
  if (total >= 420 && total <= 540) {
    durationScore = 40;
  } else if (total < 420) {
    durationScore = (total / 420) * 40;
  } else {
    // Oversleeping (>9 hours) slight penalty
    const overMinutes = total - 540;
    durationScore = Math.max(30, 40 - (overMinutes / 60) * 5);
  }

  // 2. Deep Sleep Ratio Score (30 points max)
  // Target: 20-25% of total sleep duration
  const deepRatio = deep / total;
  let deepScore = 0;
  if (deepRatio >= 0.20 && deepRatio <= 0.25) {
    deepScore = 30;
  } else if (deepRatio < 0.20) {
    deepScore = (deepRatio / 0.20) * 30;
  } else {
    deepScore = 30;
  }

  // 3. REM Sleep Ratio Score (30 points max)
  // Target: 20-25% of total sleep duration
  const remRatio = rem / total;
  let remScore = 0;
  if (remRatio >= 0.20 && remRatio <= 0.25) {
    remScore = 30;
  } else if (remRatio < 0.20) {
    remScore = (remRatio / 0.20) * 30;
  } else {
    remScore = 30;
  }

  const calculated = Math.round(durationScore + deepScore + remScore);
  return clamp(calculated, 0, 100);
}

/**
 * Generates realistic time-series wearable telemetry with bounded random noise or specific overrides.
 */
export function generateMockTelemetry(
  userId: string,
  overrides?: Partial<WearableBiometrics>
): WearableBiometrics {
  const now = new Date().toISOString();
  const id = `telemetry-${Date.now()}-${crypto.randomUUID()}`;

  // Realistic baseline values with slight random fluctuations
  const hrNoise = (Math.random() - 0.5) * 6;
  const rhrNoise = (Math.random() - 0.5) * 4;
  const hrvNoise = (Math.random() - 0.5) * 8;
  const spo2Noise = Math.floor((Math.random() - 0.5) * 2);
  const stepsAdd = Math.floor(Math.random() * 50);

  const rawTotalMinutes = 480;
  const rawDeepMinutes = 110;
  const rawRemMinutes = 110;
  const rawLightMinutes = 260;

  const baseSleep: SleepArchitecture = {
    totalMinutes: rawTotalMinutes,
    deepMinutes: rawDeepMinutes,
    remMinutes: rawRemMinutes,
    lightMinutes: rawLightMinutes,
    sleepScore: calculateSleepScore({
      totalMinutes: rawTotalMinutes,
      deepMinutes: rawDeepMinutes,
      remMinutes: rawRemMinutes,
      lightMinutes: rawLightMinutes,
    }),
  };

  const rawObj: Partial<WearableBiometrics> = {
    id,
    userId,
    timestamp: now,
    heartRate: Math.round(72 + hrNoise),
    rhr: Math.round(62 + rhrNoise),
    hrv: Math.round(55 + hrvNoise),
    spo2: 98 + spo2Noise,
    steps: 4500 + stepsAdd,
    sleep: baseSleep,
    connectionStatus: 'connected',
    ...overrides,
  };

  // Ensure sleep architecture in overrides maintains valid sleepScore if sleep is overridden without sleepScore
  let finalSleep: SleepArchitecture = rawObj.sleep ?? baseSleep;
  if (overrides?.sleep) {
    const sleepWithoutScore = {
      totalMinutes: overrides.sleep.totalMinutes ?? baseSleep.totalMinutes,
      deepMinutes: overrides.sleep.deepMinutes ?? baseSleep.deepMinutes,
      remMinutes: overrides.sleep.remMinutes ?? baseSleep.remMinutes,
      lightMinutes: overrides.sleep.lightMinutes ?? baseSleep.lightMinutes,
    };
    const score = typeof overrides.sleep.sleepScore === 'number'
      ? clamp(overrides.sleep.sleepScore, 0, 100)
      : calculateSleepScore(sleepWithoutScore);

    finalSleep = {
      ...sleepWithoutScore,
      sleepScore: score,
    };
  }

  return {
    id: rawObj.id || id,
    userId: rawObj.userId || userId,
    timestamp: rawObj.timestamp || now,
    heartRate: sanitizeNumber(rawObj.heartRate, CLINICAL_BOUNDS.HEART_RATE.min, CLINICAL_BOUNDS.HEART_RATE.max, CLINICAL_BOUNDS.HEART_RATE.default),
    rhr: sanitizeNumber(rawObj.rhr, CLINICAL_BOUNDS.RHR.min, CLINICAL_BOUNDS.RHR.max, CLINICAL_BOUNDS.RHR.default),
    hrv: sanitizeNumber(rawObj.hrv, CLINICAL_BOUNDS.HRV.min, CLINICAL_BOUNDS.HRV.max, CLINICAL_BOUNDS.HRV.default),
    spo2: sanitizeNumber(rawObj.spo2, CLINICAL_BOUNDS.SPO2.min, CLINICAL_BOUNDS.SPO2.max, CLINICAL_BOUNDS.SPO2.default),
    steps: sanitizeNumber(rawObj.steps, CLINICAL_BOUNDS.STEPS.min, CLINICAL_BOUNDS.STEPS.max, CLINICAL_BOUNDS.STEPS.default),
    sleep: finalSleep,
    connectionStatus: rawObj.connectionStatus && ['connected', 'disconnected', 'syncing'].includes(rawObj.connectionStatus)
      ? rawObj.connectionStatus
      : 'connected',
  };
}

/**
 * Safely parses raw telemetry objects (from Web Bluetooth or API streams),
 * sanitizes values within clinical bounds (RHR 30-220, HRV 5-250, SPO2 70-100, Steps >= 0),
 * and injects default fallbacks for missing/malformed attributes.
 */
export function parseRawTelemetryStream(rawData: unknown): WearableBiometrics {
  let parsed: Record<string, unknown> = {};

  if (typeof rawData === 'string') {
    try {
      const obj = JSON.parse(rawData);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        parsed = obj as Record<string, unknown>;
      }
    } catch {
      parsed = {};
    }
  } else if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    parsed = rawData as Record<string, unknown>;
  }

  const id = typeof parsed.id === 'string' && parsed.id.trim()
    ? parsed.id.trim()
    : `telemetry-raw-${Date.now()}`;

  const userId = typeof parsed.userId === 'string' && parsed.userId.trim()
    ? parsed.userId.trim()
    : typeof parsed.user_id === 'string' && parsed.user_id.trim()
      ? parsed.user_id.trim()
      : 'unknown_user';

  let timestamp = new Date().toISOString();
  if (typeof parsed.timestamp === 'string' && !isNaN(Date.parse(parsed.timestamp))) {
    timestamp = parsed.timestamp;
  }

  const heartRate = sanitizeNumber(
    parsed.heartRate ?? parsed.heart_rate,
    CLINICAL_BOUNDS.HEART_RATE.min,
    CLINICAL_BOUNDS.HEART_RATE.max,
    CLINICAL_BOUNDS.HEART_RATE.default
  );

  const rhr = sanitizeNumber(
    parsed.rhr ?? parsed.restingHeartRate ?? parsed.resting_heart_rate,
    CLINICAL_BOUNDS.RHR.min,
    CLINICAL_BOUNDS.RHR.max,
    CLINICAL_BOUNDS.RHR.default
  );

  const hrv = sanitizeNumber(
    parsed.hrv ?? parsed.heartRateVariability ?? parsed.heart_rate_variability,
    CLINICAL_BOUNDS.HRV.min,
    CLINICAL_BOUNDS.HRV.max,
    CLINICAL_BOUNDS.HRV.default
  );

  const spo2 = sanitizeNumber(
    parsed.spo2 ?? parsed.oximetry,
    CLINICAL_BOUNDS.SPO2.min,
    CLINICAL_BOUNDS.SPO2.max,
    CLINICAL_BOUNDS.SPO2.default
  );

  const steps = sanitizeNumber(
    parsed.steps,
    CLINICAL_BOUNDS.STEPS.min,
    CLINICAL_BOUNDS.STEPS.max,
    CLINICAL_BOUNDS.STEPS.default
  );

  // Parse sleep architecture
  const rawSleep = (parsed.sleep && typeof parsed.sleep === 'object' && !Array.isArray(parsed.sleep))
    ? (parsed.sleep as Record<string, unknown>)
    : {};

  const totalMinutes = sanitizeNumber(rawSleep.totalMinutes ?? rawSleep.total_minutes, 0, 1440, 480);
  const deepMinutes = sanitizeNumber(rawSleep.deepMinutes ?? rawSleep.deep_minutes, 0, 1440, 100);
  const remMinutes = sanitizeNumber(rawSleep.remMinutes ?? rawSleep.rem_minutes, 0, 1440, 100);
  const lightMinutes = sanitizeNumber(rawSleep.lightMinutes ?? rawSleep.light_minutes, 0, 1440, 280);

  const sleepScoreInput = rawSleep.sleepScore ?? rawSleep.sleep_score;
  const sleepScore = typeof sleepScoreInput === 'number' && !isNaN(sleepScoreInput)
    ? clamp(sleepScoreInput, 0, 100)
    : calculateSleepScore({ totalMinutes, deepMinutes, remMinutes, lightMinutes });

  const sleep: SleepArchitecture = {
    totalMinutes,
    deepMinutes,
    remMinutes,
    lightMinutes,
    sleepScore,
  };

  const rawStatus = parsed.connectionStatus ?? parsed.connection_status;
  const connectionStatus = typeof rawStatus === 'string' && ['connected', 'disconnected', 'syncing'].includes(rawStatus)
    ? (rawStatus as 'connected' | 'disconnected' | 'syncing')
    : 'connected';

  return {
    id,
    userId,
    timestamp,
    heartRate,
    rhr,
    hrv,
    spo2,
    steps,
    sleep,
    connectionStatus,
  };
}

/**
 * Subscribes to periodic simulated telemetry updates with cleanup un-subscriber callback.
 */
export function subscribeToWearableTelemetry(
  userId: string,
  callback: (data: WearableBiometrics) => void,
  config?: Partial<TelemetryStreamConfig>
): () => void {
  const streamConfig: TelemetryStreamConfig = {
    intervalMs: config?.intervalMs ?? 1000,
    enableBluetooth: config?.enableBluetooth ?? false,
    mockNoiseFactor: config?.mockNoiseFactor ?? 0.1,
  };

  // Immediate emission of initial reading
  const initialTelemetry = generateMockTelemetry(userId);
  callback(initialTelemetry);

  const timerId = setInterval(() => {
    const noise = (Math.random() - 0.5) * 10 * streamConfig.mockNoiseFactor;
    const update = generateMockTelemetry(userId, {
      heartRate: Math.round(72 + noise),
    });
    callback(update);
  }, streamConfig.intervalMs);

  return () => {
    clearInterval(timerId);
  };
}

/**
 * Web Bluetooth connection helper with fallback detection when `navigator.bluetooth` is unavailable.
 */
export async function connectWebBluetooth(): Promise<BluetoothConnectionState> {
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  if (
    !nav ||
    !nav.bluetooth ||
    typeof nav.bluetooth.requestDevice !== 'function'
  ) {
    return 'unsupported';
  }

  try {
    const isAvailable = typeof nav.bluetooth.getAvailability === 'function'
      ? await nav.bluetooth.getAvailability()
      : true;

    if (!isAvailable) {
      return 'unsupported';
    }

    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['heart_rate', 'health_thermometer', 'battery_service'],
    });

    if (device && device.gatt) {
      await device.gatt.connect();
      return 'connected';
    }

    return 'disconnected';
  } catch {
    return 'disconnected';
  }
}

/**
 * Converts a WearableBiometrics entity into distinct individual BiometricSample records.
 */
export function extractBiometricSamples(biometrics: WearableBiometrics): BiometricSample[] {
  return [
    { metric: 'heartRate', value: biometrics.heartRate, timestamp: biometrics.timestamp, unit: 'bpm' },
    { metric: 'rhr', value: biometrics.rhr, timestamp: biometrics.timestamp, unit: 'bpm' },
    { metric: 'hrv', value: biometrics.hrv, timestamp: biometrics.timestamp, unit: 'ms' },
    { metric: 'spo2', value: biometrics.spo2, timestamp: biometrics.timestamp, unit: '%' },
    { metric: 'steps', value: biometrics.steps, timestamp: biometrics.timestamp, unit: 'steps' },
  ];
}

const LOCAL_STORAGE_PREFIX = 'aegis_wearable_telemetry';

/**
 * Persists the latest WearableBiometrics snapshot to localStorage keyed by userId.
 * Enables offline-first fallback and session continuity between page loads.
 * Silently handles environments where localStorage is unavailable (SSR, private browsing).
 */
export function persistTelemetryToLocal(biometrics: WearableBiometrics): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = `${LOCAL_STORAGE_PREFIX}_${biometrics.userId}`;
      window.localStorage.setItem(key, JSON.stringify(biometrics));
    }
  } catch {
    // localStorage may be blocked in some environments — fail silently
  }
}

/**
 * Loads the most recently persisted WearableBiometrics snapshot from localStorage for the given userId.
 * Returns null if nothing is persisted or if the stored data is corrupt.
 */
export function loadPersistedTelemetry(userId: string): WearableBiometrics | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = `${LOCAL_STORAGE_PREFIX}_${userId}`;
      const raw = window.localStorage.getItem(key);
      if (raw) {
        return parseRawTelemetryStream(raw);
      }
    }
  } catch {
    // localStorage may be blocked — fail silently
  }
  return null;
}

/**
 * Clears the persisted telemetry snapshot for the given userId from localStorage.
 */
export function clearPersistedTelemetry(userId: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = `${LOCAL_STORAGE_PREFIX}_${userId}`;
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
