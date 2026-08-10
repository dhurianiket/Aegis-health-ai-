import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getHealthSyncState,
  saveHealthSyncState,
  syncAppleHealth,
  syncGoogleHealth,
  parseAppleHealthExport,
  parseGoogleHealthExport,
  getHealthPermissions,
  saveHealthPermissions,
} from '../healthSyncService';
import { parseRawTelemetryStream, CLINICAL_BOUNDS, calculateSleepScore } from '../wearableService';

vi.mock('../../lib/firebase/firestore', () => ({
  saveWearableTelemetry: vi.fn().mockResolvedValue('mock-doc-id-123'),
}));

describe('R1, R2, R3 Empirical Verification & Stress Test Suite', () => {
  const TEST_USER = 'challenger-stress-user-001';

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('R1: Health Sync State & Provider Telemetry Flow Verification', () => {
    it('R1.1: getHealthSyncState returns bounded fallback when localStorage is empty or corrupt', () => {
      const state = getHealthSyncState(TEST_USER);
      expect(state.appleHealth).toBeDefined();
      expect(state.googleHealth).toBeDefined();
      expect(state.appleHealth.connected).toBe(false);
      expect(state.googleHealth.connected).toBe(false);

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`aegis_health_sync_state_${TEST_USER}`, 'corrupt{json');
      }
      const corruptState = getHealthSyncState(TEST_USER);
      expect(corruptState.appleHealth.connected).toBe(false);
      expect(corruptState.googleHealth.connected).toBe(false);
    });

    it('R1.2: saveHealthSyncState updates local state correctly and isolated per user', () => {
      const updated = saveHealthSyncState(TEST_USER, 'apple', {
        connected: true,
        recordsCount: 15,
        lastSynced: '2026-08-10T10:00:00Z',
      });
      expect(updated.appleHealth.connected).toBe(true);
      expect(updated.appleHealth.recordsCount).toBe(15);
      expect(updated.googleHealth.connected).toBe(false);

      // Verify second user remains isolated
      const user2State = getHealthSyncState('other-user-999');
      expect(user2State.appleHealth.connected).toBe(false);
    });

    it('R1.3: Health permissions read/write defaults and overrides gracefully', () => {
      const defaultPerms = getHealthPermissions(TEST_USER, 'apple');
      expect(defaultPerms.heartRate).toBe(true);
      expect(defaultPerms.spo2).toBe(true);

      const savedPerms = saveHealthPermissions(TEST_USER, 'apple', { spo2: false });
      expect(savedPerms.spo2).toBe(false);
      expect(savedPerms.heartRate).toBe(true);

      const reloadedPerms = getHealthPermissions(TEST_USER, 'apple');
      expect(reloadedPerms.spo2).toBe(false);
    });

    it('R1.4: Real-time Apple and Google sync routines produce clinically bounded telemetry', async () => {
      const appleResult = await syncAppleHealth(TEST_USER);
      expect(appleResult.success).toBe(true);
      expect(appleResult.biometrics).not.toBeNull();
      expect(appleResult.biometrics?.heartRate).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.HEART_RATE.min);
      expect(appleResult.biometrics?.heartRate).toBeLessThanOrEqual(CLINICAL_BOUNDS.HEART_RATE.max);
      expect(appleResult.biometrics?.spo2).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.SPO2.min);

      const googleResult = await syncGoogleHealth(TEST_USER);
      expect(googleResult.success).toBe(true);
      expect(googleResult.biometrics).not.toBeNull();
      expect(googleResult.biometrics?.steps).toBeGreaterThanOrEqual(0);
    });
  });

  describe('R2: Data Parsing & Clinical Bound Enforcement Stress Harness', () => {
    it('R2.1: Handles malformed Apple Health XML exports without throwing exceptions', () => {
      const malformedXMLs = [
        '',
        '<<<<>>>',
        '<HealthData><Record type="HKQuantityTypeIdentifierHeartRate" value="invalid" /></HealthData>',
        '<HealthData><Record type="HKQuantityTypeIdentifierOxygenSaturation" value="-999.9" /></HealthData>',
        '<HealthData><Record type="HKQuantityTypeIdentifierStepCount" value="not_a_number" /></HealthData>',
        '<html><body>Not XML data</body></html>',
      ];

      for (const xml of malformedXMLs) {
        expect(() => {
          const result = parseAppleHealthExport(xml, TEST_USER);
          expect(result).toBeDefined();
          expect(result.heartRate).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.HEART_RATE.min);
          expect(result.spo2).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.SPO2.min);
          expect(result.spo2).toBeLessThanOrEqual(CLINICAL_BOUNDS.SPO2.max);
          expect(result.steps).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.STEPS.min);
        }).not.toThrow();
      }
    });

    it('R2.2: Handles corrupt & edge-case JSON payloads in parseGoogleHealthExport & parseAppleHealthExport', () => {
      const corruptJSONs = [
        '{ corrupt json syntax ...',
        '[]',
        '12345',
        '"just a string"',
        '{"heartRate": "xyz", "spo2": null, "steps": undefined}',
        '{"heartRate": -100, "spo2": 0.001, "steps": -500}',
        '{"sleep": "invalid_sleep_object"}',
      ];

      for (const jsonStr of corruptJSONs) {
        expect(() => {
          const googleResult = parseGoogleHealthExport(jsonStr, TEST_USER);
          expect(googleResult).toBeDefined();
          expect(googleResult.heartRate).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.HEART_RATE.min);
          expect(googleResult.spo2).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.SPO2.min);
          expect(googleResult.steps).toBeGreaterThanOrEqual(0);

          const appleResult = parseAppleHealthExport(jsonStr, TEST_USER);
          expect(appleResult).toBeDefined();
          expect(appleResult.heartRate).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.HEART_RATE.min);
          expect(appleResult.spo2).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.SPO2.min);
        }).not.toThrow();
      }
    });

    it('R2.3: Extreme SpO2 values (0.001, 150%, negative) are clamped to clinical bounds (70-100%)', () => {
      const testCases = [
        { raw: 0.001, expected: 70 }, // 0.001 ratio -> 0.1% -> rounded 0 -> clamped to 70
        { raw: 0.98, expected: 98 },   // 0.98 ratio -> 98%
        { raw: -50, expected: 70 },    // negative -> clamped to min 70
        { raw: 150, expected: 100 },   // > 100% -> clamped to max 100
        { raw: 9999, expected: 100 },  // extreme high -> clamped to 100
      ];

      for (const tc of testCases) {
        const payload = JSON.stringify({ spo2: tc.raw });
        const result = parseGoogleHealthExport(payload, TEST_USER);
        expect(result.spo2).toBe(tc.expected);
      }
    });

    it('R2.4: Negative step counts (-500, -10000) are clamped to 0', () => {
      const result1 = parseGoogleHealthExport(JSON.stringify({ steps: -500 }), TEST_USER);
      expect(result1.steps).toBe(0);

      const result2 = parseRawTelemetryStream({ steps: -10000 });
      expect(result2.steps).toBe(0);
    });

    it('R2.5: Missing or partial sleep attributes are handled with valid calculated sleep scores', () => {
      const partialSleepPayloads = [
        {},
        { sleep: null },
        { sleep: {} },
        { sleep: { totalMinutes: 0 } },
        { sleep: { totalMinutes: 480, deepMinutes: undefined } },
        { sleep: { totalMinutes: -100, deepMinutes: -50 } },
      ];

      for (const payload of partialSleepPayloads) {
        const res = parseRawTelemetryStream(payload);
        expect(res.sleep).toBeDefined();
        expect(typeof res.sleep.totalMinutes).toBe('number');
        expect(typeof res.sleep.sleepScore).toBe('number');
        expect(res.sleep.sleepScore).toBeGreaterThanOrEqual(0);
        expect(res.sleep.sleepScore).toBeLessThanOrEqual(100);
      }
    });

    it('R2.6: High-volume telemetry stream benchmark: processes 10,000 records accurately and rapidly', () => {
      const recordCount = 10000;
      const startTime = performance.now();

      for (let i = 0; i < recordCount; i++) {
        const raw = {
          id: `bench-${i}`,
          userId: TEST_USER,
          heartRate: 60 + (i % 40),
          rhr: 55 + (i % 20),
          hrv: 40 + (i % 30),
          spo2: 95 + (i % 5),
          steps: i * 2,
          sleep: { totalMinutes: 450, deepMinutes: 100, remMinutes: 90, lightMinutes: 260 },
        };
        const parsed = parseRawTelemetryStream(raw);
        expect(parsed.heartRate).toBeGreaterThanOrEqual(30);
      }

      const elapsed = performance.now() - startTime;
      console.log(`[R2 HIGH-VOLUME STRESS VERDICT] Successfully processed ${recordCount} records in ${elapsed.toFixed(2)} ms (${(elapsed / recordCount).toFixed(4)} ms/record)`);
      expect(elapsed).toBeLessThan(5000); // Must complete under 5 seconds
    });
  });
});
