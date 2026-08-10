import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getHealthSyncState,
  saveHealthSyncState,
  syncAppleHealth,
  syncGoogleHealth,
  parseAppleHealthExport,
  parseGoogleHealthExport,
} from '../healthSyncService';

vi.mock('../../lib/firebase/firestore', () => ({
  saveWearableTelemetry: vi.fn().mockResolvedValue('test-doc-id'),
}));

describe('healthSyncService Integration Test Suite', () => {
  const TEST_USER = 'user-sync-test-999';

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('1. Initializes default sync state for new user', () => {
    const state = getHealthSyncState(TEST_USER);
    expect(state.appleHealth.connected).toBe(false);
    expect(state.googleHealth.connected).toBe(false);
    expect(state.appleHealth.recordsCount).toBe(0);
    expect(state.googleHealth.recordsCount).toBe(0);
  });

  it('2. Saves and persists provider sync updates', () => {
    saveHealthSyncState(TEST_USER, 'apple', {
      connected: true,
      recordsCount: 42,
      lastSynced: '2026-08-10T12:00:00Z',
    });

    const state = getHealthSyncState(TEST_USER);
    expect(state.appleHealth.connected).toBe(true);
    expect(state.appleHealth.recordsCount).toBe(42);
    expect(state.appleHealth.lastSynced).toBe('2026-08-10T12:00:00Z');
    expect(state.googleHealth.connected).toBe(false);
  });

  it('3. Executes Apple Health sync and generates valid biometrics', async () => {
    const result = await syncAppleHealth(TEST_USER);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('apple');
    expect(result.biometrics).not.toBeNull();
    expect(result.biometrics?.heartRate).toBeGreaterThanOrEqual(30);
    expect(result.biometrics?.heartRate).toBeLessThanOrEqual(220);
    expect(result.biometrics?.steps).toBeGreaterThan(0);

    const state = getHealthSyncState(TEST_USER);
    expect(state.appleHealth.connected).toBe(true);
    expect(state.appleHealth.recordsCount).toBeGreaterThan(0);
  });

  it('4. Executes Google Health Connect sync and generates valid biometrics', async () => {
    const result = await syncGoogleHealth(TEST_USER);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('google');
    expect(result.biometrics).not.toBeNull();
    expect(result.biometrics?.spo2).toBeGreaterThanOrEqual(90);
    expect(result.biometrics?.sleep.totalMinutes).toBeGreaterThan(0);

    const state = getHealthSyncState(TEST_USER);
    expect(state.googleHealth.connected).toBe(true);
  });

  it('5. Parses Apple Health XML export content into structured telemetry', () => {
    const sampleXml = `
      <HealthData>
        <Record type="HKQuantityTypeIdentifierHeartRate" value="74" />
        <Record type="HKQuantityTypeIdentifierRestingHeartRate" value="61" />
        <Record type="HKQuantityTypeIdentifierHeartRateVariabilitySDNN" value="56" />
        <Record type="HKQuantityTypeIdentifierOxygenSaturation" value="0.99" />
        <Record type="HKQuantityTypeIdentifierStepCount" value="8420" />
      </HealthData>
    `;

    const parsed = parseAppleHealthExport(sampleXml, TEST_USER);
    expect(parsed.heartRate).toBe(74);
    expect(parsed.rhr).toBe(61);
    expect(parsed.hrv).toBe(56);
    expect(parsed.spo2).toBe(99);
    expect(parsed.steps).toBe(8420);
  });

  it('6. Parses Google Health JSON export content into structured telemetry', () => {
    const sampleJson = JSON.stringify({
      heartRate: 72,
      restingHeartRate: 63,
      heartRateVariability: 50,
      spo2: 98,
      steps: 9150,
      sleep: { totalMinutes: 480, deepMinutes: 120, remMinutes: 110, lightMinutes: 250 },
    });

    const parsed = parseGoogleHealthExport(sampleJson, TEST_USER);
    expect(parsed.heartRate).toBe(72);
    expect(parsed.rhr).toBe(63);
    expect(parsed.hrv).toBe(50);
    expect(parsed.spo2).toBe(98);
    expect(parsed.steps).toBe(9150);
    expect(parsed.sleep.sleepScore).toBeGreaterThan(50);
  });
});
