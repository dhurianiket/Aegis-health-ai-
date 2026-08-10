import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseAppleHealthExport,
  parseGoogleHealthExport,
  getHealthSyncState,
  saveHealthSyncState,
  syncAppleHealth,
  syncGoogleHealth,
} from '../healthSyncService';
import {
  CLINICAL_BOUNDS,
  calculateSleepScore,
  parseRawTelemetryStream,
  generateMockTelemetry,
} from '../wearableService';

vi.mock('../../lib/firebase/firestore', () => ({
  saveWearableTelemetry: vi.fn().mockResolvedValue('mock-doc-id'),
}));

describe('Challenger 2 Empirical Verification: Export Parsers, Bounds, Sleep Score & Badge Transitions', () => {
  const TEST_USER = 'challenger-2-test-user';

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  // ==========================================
  // 1. APPLE HEALTH XML EXPORT PARSING
  // ==========================================
  describe('Apple Health XML Export Parsing', () => {
    it('1.1 parses valid Apple Health XML with standard record structures', () => {
      const xml = `
        <HealthData>
          <ExportDate value="2026-08-10 10:00:00 +0000"/>
          <Record type="HKQuantityTypeIdentifierHeartRate" unit="count/min" value="76"/>
          <Record type="HKQuantityTypeIdentifierRestingHeartRate" unit="count/min" value="64"/>
          <Record type="HKQuantityTypeIdentifierHeartRateVariabilitySDNN" unit="ms" value="58"/>
          <Record type="HKQuantityTypeIdentifierOxygenSaturation" unit="%" value="0.98"/>
          <Record type="HKQuantityTypeIdentifierStepCount" unit="count" value="10500"/>
        </HealthData>
      `;

      const result = parseAppleHealthExport(xml, TEST_USER);
      expect(result.heartRate).toBe(76);
      expect(result.rhr).toBe(64);
      expect(result.hrv).toBe(58);
      expect(result.spo2).toBe(98);
      expect(result.steps).toBe(10500);
      expect(result.connectionStatus).toBe('connected');
    });

    it('1.2 scales SpO2 correctly in XML exports (<= 1 mapped to percentage)', () => {
      const xmlFraction = `
        <HealthData>
          <Record type="HKQuantityTypeIdentifierOxygenSaturation" value="0.97"/>
        </HealthData>
      `;
      const resultFraction = parseAppleHealthExport(xmlFraction, TEST_USER);
      expect(resultFraction.spo2).toBe(97);

      const xmlPercentage = `
        <HealthData>
          <Record type="HKQuantityTypeIdentifierOxygenSaturation" value="97"/>
        </HealthData>
      `;
      const resultPercentage = parseAppleHealthExport(xmlPercentage, TEST_USER);
      expect(resultPercentage.spo2).toBe(97);

      const xmlOne = `
        <HealthData>
          <Record type="HKQuantityTypeIdentifierOxygenSaturation" value="1.0"/>
        </HealthData>
      `;
      const resultOne = parseAppleHealthExport(xmlOne, TEST_USER);
      expect(resultOne.spo2).toBe(100);
    });

    it('1.3 parses Apple Health sleep analysis records (HKCategoryTypeIdentifierSleepAnalysis)', () => {
      const xmlWithSleep = `
        <HealthData>
          <Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisAsleep"/>
          <Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisAsleep"/>
          <Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisAsleep"/>
          <Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisAsleep"/>
        </HealthData>
      `;

      const result = parseAppleHealthExport(xmlWithSleep, TEST_USER);
      // 4 records * 30 min = 120 total minutes
      expect(result.sleep.totalMinutes).toBe(120);
      expect(result.sleep.deepMinutes).toBe(30); // 25% of 120
      expect(result.sleep.remMinutes).toBe(26);  // 22% of 120 rounded
      expect(result.sleep.lightMinutes).toBe(64); // remainder
      expect(result.sleep.sleepScore).toBeGreaterThan(0);
    });

    it('1.4 handles empty string or whitespace XML gracefully', () => {
      const resultEmpty = parseAppleHealthExport('', TEST_USER);
      expect(resultEmpty.heartRate).toBe(CLINICAL_BOUNDS.HEART_RATE.default);
      expect(resultEmpty.rhr).toBe(CLINICAL_BOUNDS.RHR.default);
      expect(resultEmpty.hrv).toBe(CLINICAL_BOUNDS.HRV.default);
      expect(resultEmpty.spo2).toBe(CLINICAL_BOUNDS.SPO2.default);
      expect(resultEmpty.steps).toBe(CLINICAL_BOUNDS.STEPS.default);

      const resultWhitespace = parseAppleHealthExport('   \n  \t  ', TEST_USER);
      expect(resultWhitespace.heartRate).toBe(CLINICAL_BOUNDS.HEART_RATE.default);
    });

    it('1.5 handles malformed XML or XML with missing biometric records', () => {
      const xmlPartial = `
        <HealthData>
          <Record type="HKQuantityTypeIdentifierHeartRate" value="88"/>
          <!-- Missing RHR, HRV, SPO2, Steps -->
        </HealthData>
      `;

      const result = parseAppleHealthExport(xmlPartial, TEST_USER);
      expect(result.heartRate).toBe(88);
      expect(result.rhr).toBe(CLINICAL_BOUNDS.RHR.default);
      expect(result.hrv).toBe(CLINICAL_BOUNDS.HRV.default);
      expect(result.spo2).toBe(CLINICAL_BOUNDS.SPO2.default);
      expect(result.steps).toBe(CLINICAL_BOUNDS.STEPS.default);
    });

    it('1.6 tests attribute ordering vulnerability (value attribute placed BEFORE type attribute)', () => {
      const xmlReversedAttrs = `
        <HealthData>
          <Record value="82" type="HKQuantityTypeIdentifierHeartRate"/>
        </HealthData>
      `;
      const result = parseAppleHealthExport(xmlReversedAttrs, TEST_USER);
      // Regex /HKQuantityTypeIdentifierHeartRate"[\s\S]*?value="([0-9.]+)"/ requires type before value.
      // If value comes before type, match fails and defaults to 72.
      expect(result.heartRate).toBe(CLINICAL_BOUNDS.HEART_RATE.default); // 72 default
    });
  });

  // ==========================================
  // 2. GOOGLE HEALTH CONNECT JSON EXPORT PARSING
  // ==========================================
  describe('Google Health Connect JSON Export Parsing', () => {
    it('2.1 parses standard camelCase Google Health export JSON', () => {
      const json = JSON.stringify({
        heartRate: 75,
        restingHeartRate: 60,
        heartRateVariability: 65,
        oxygenSaturation: 0.98,
        stepCount: 12000,
        sleep: {
          totalMinutes: 480,
          deepMinutes: 120,
          remMinutes: 100,
          lightMinutes: 260,
        },
      });

      const result = parseGoogleHealthExport(json, TEST_USER);
      expect(result.heartRate).toBe(75);
      expect(result.rhr).toBe(60);
      expect(result.hrv).toBe(65);
      expect(result.spo2).toBe(98);
      expect(result.steps).toBe(12000);
      expect(result.sleep.totalMinutes).toBe(480);
      expect(result.sleep.deepMinutes).toBe(120);
      expect(result.sleep.remMinutes).toBe(100);
      expect(result.sleep.lightMinutes).toBe(260);
      expect(result.sleep.sleepScore).toBeGreaterThan(80);
    });

    it('2.2 parses snake_case and shorthand property keys in Google export JSON', () => {
      const json = JSON.stringify({
        heart_rate: 71,
        resting_heart_rate: 59,
        heart_rate_variability: 70,
        oxygen_saturation: 99,
        step_count: 8900,
        sleep_architecture: {
          total_minutes: 500,
          deep_minutes: 130,
          rem_minutes: 110,
          light_minutes: 260,
        },
      });

      const result = parseGoogleHealthExport(json, TEST_USER);
      expect(result.heartRate).toBe(71);
      expect(result.rhr).toBe(59);
      expect(result.hrv).toBe(70);
      expect(result.spo2).toBe(99);
      expect(result.steps).toBe(8900);
      expect(result.sleep.totalMinutes).toBe(500);
    });

    it('2.3 handles invalid or malformed JSON payloads without crashing', () => {
      const invalidJson = '{ bad json syntax: true, ... ';
      const result = parseGoogleHealthExport(invalidJson, TEST_USER);
      expect(result.heartRate).toBe(70);
      expect(result.rhr).toBe(62);
      expect(result.hrv).toBe(54);
      expect(result.spo2).toBe(98);
      expect(result.steps).toBe(6500);
    });

    it('2.4 handles fractional vs percentage SpO2 values in Google export JSON', () => {
      const jsonFraction = JSON.stringify({ spo2: 0.96 });
      const resFraction = parseGoogleHealthExport(jsonFraction, TEST_USER);
      expect(resFraction.spo2).toBe(96);

      const jsonPercent = JSON.stringify({ spo2: 96 });
      const resPercent = parseGoogleHealthExport(jsonPercent, TEST_USER);
      expect(resPercent.spo2).toBe(96);
    });

    it('2.5 handles string SpO2 values in Google export JSON (edge case: typeof check)', () => {
      // In parseGoogleHealthExport: typeof rawSpo2 === 'number' && rawSpo2 <= 1
      // If passed as string "0.95", typeof is 'string'. So rawSpo2 is "0.95".
      // Then parseRawTelemetryStream -> sanitizeNumber("0.95", 70, 100, 98) -> parseFloat("0.95") = 0.95 -> clamped to 70!
      const jsonStringSpo2 = JSON.stringify({ spo2: '0.95' });
      const resStringSpo2 = parseGoogleHealthExport(jsonStringSpo2, TEST_USER);
      expect(resStringSpo2.spo2).toBe(70); // Clamped to 70 min bound because string "0.95" skipped number scaling!
    });
  });

  // ==========================================
  // 3. CLINICAL BOUNDS & CLAMPING VERIFICATION
  // ==========================================
  describe('Clinical Clamping (CLINICAL_BOUNDS)', () => {
    it('3.1 verifies CLINICAL_BOUNDS values contract', () => {
      expect(CLINICAL_BOUNDS.HEART_RATE).toEqual({ min: 30, max: 220, default: 72 });
      expect(CLINICAL_BOUNDS.RHR).toEqual({ min: 30, max: 220, default: 65 });
      expect(CLINICAL_BOUNDS.HRV).toEqual({ min: 5, max: 250, default: 50 });
      expect(CLINICAL_BOUNDS.SPO2).toEqual({ min: 70, max: 100, default: 98 });
      expect(CLINICAL_BOUNDS.STEPS).toEqual({ min: 0, max: 1000000, default: 0 });
    });

    it('3.2 clamps extreme under-flow biometric values to minimum clinical bounds', () => {
      const underflow = parseRawTelemetryStream({
        heartRate: 10,
        rhr: 15,
        hrv: 1,
        spo2: 40,
        steps: -500,
      });

      expect(underflow.heartRate).toBe(CLINICAL_BOUNDS.HEART_RATE.min); // 30
      expect(underflow.rhr).toBe(CLINICAL_BOUNDS.RHR.min);              // 30
      expect(underflow.hrv).toBe(CLINICAL_BOUNDS.HRV.min);              // 5
      expect(underflow.spo2).toBe(CLINICAL_BOUNDS.SPO2.min);            // 70
      expect(underflow.steps).toBe(CLINICAL_BOUNDS.STEPS.min);          // 0
    });

    it('3.3 clamps extreme over-flow biometric values to maximum clinical bounds', () => {
      const overflow = parseRawTelemetryStream({
        heartRate: 280,
        rhr: 300,
        hrv: 400,
        spo2: 120,
        steps: 2500000,
      });

      expect(overflow.heartRate).toBe(CLINICAL_BOUNDS.HEART_RATE.max); // 220
      expect(overflow.rhr).toBe(CLINICAL_BOUNDS.RHR.max);              // 220
      expect(overflow.hrv).toBe(CLINICAL_BOUNDS.HRV.max);              // 250
      expect(overflow.spo2).toBe(CLINICAL_BOUNDS.SPO2.max);            // 100
      expect(overflow.steps).toBe(CLINICAL_BOUNDS.STEPS.max);          // 1000000
    });

    it('3.4 injects default fallbacks for invalid non-numeric inputs (NaN, null, undefined, text)', () => {
      const invalidData = parseRawTelemetryStream({
        heartRate: 'invalid_hr',
        rhr: null,
        hrv: undefined,
        spo2: NaN,
        steps: {},
      });

      expect(invalidData.heartRate).toBe(CLINICAL_BOUNDS.HEART_RATE.default); // 72
      expect(invalidData.rhr).toBe(CLINICAL_BOUNDS.RHR.default);              // 65
      expect(invalidData.hrv).toBe(CLINICAL_BOUNDS.HRV.default);              // 50
      expect(invalidData.spo2).toBe(CLINICAL_BOUNDS.SPO2.default);            // 98
      expect(invalidData.steps).toBe(CLINICAL_BOUNDS.STEPS.default);          // 0
    });
  });

  // ==========================================
  // 4. SLEEP SCORE CALCULATIONS
  // ==========================================
  describe('Sleep Score Calculations (calculateSleepScore)', () => {
    it('4.1 calculates 100 score for optimal 8-hour sleep with ~25% deep and ~25% REM', () => {
      const score = calculateSleepScore({
        totalMinutes: 480, // 8 hours (40 pts)
        deepMinutes: 120,  // 25% (30 pts)
        remMinutes: 120,   // 25% (30 pts)
        lightMinutes: 240,
      });
      expect(score).toBe(100);
    });

    it('4.2 returns 0 score for zero or negative total sleep minutes', () => {
      expect(calculateSleepScore({ totalMinutes: 0, deepMinutes: 0, remMinutes: 0, lightMinutes: 0 })).toBe(0);
      expect(calculateSleepScore({ totalMinutes: -120, deepMinutes: 0, remMinutes: 0, lightMinutes: 0 })).toBe(0);
      expect(calculateSleepScore({ totalMinutes: NaN, deepMinutes: 0, remMinutes: 0, lightMinutes: 0 })).toBe(0);
    });

    it('4.3 penalizes short sleep duration (<7 hours)', () => {
      const shortSleepScore = calculateSleepScore({
        totalMinutes: 210, // 3.5 hours -> (210/420)*40 = 20 pts
        deepMinutes: 42,   // 20% -> 30 pts
        remMinutes: 42,    // 20% -> 30 pts
        lightMinutes: 126,
      });
      expect(shortSleepScore).toBe(80); // 20 + 30 + 30
    });

    it('4.4 applies slight penalty for oversleeping (>9 hours)', () => {
      const longSleepScore = calculateSleepScore({
        totalMinutes: 720, // 12 hours (540 optimal + 180 over -> 40 - (180/60)*5 = 25, clamped max(30, 25) = 30 pts)
        deepMinutes: 180,  // 25% -> 30 pts
        remMinutes: 180,   // 25% -> 30 pts
        lightMinutes: 360,
      });
      expect(longSleepScore).toBe(90); // 30 + 30 + 30
    });

    it('4.5 handles missing or zero deep/REM sleep gracefully', () => {
      const scoreNoDeepRem = calculateSleepScore({
        totalMinutes: 480, // 40 pts duration
        deepMinutes: 0,    // 0 pts deep
        remMinutes: 0,     // 0 pts rem
        lightMinutes: 480,
      });
      expect(scoreNoDeepRem).toBe(40);
    });

    it('4.6 caps deep/REM scores at 30 pts even if ratios exceed 25%', () => {
      const scoreHighRatios = calculateSleepScore({
        totalMinutes: 480,
        deepMinutes: 300, // 62.5% deep (>25%)
        remMinutes: 180,  // 37.5% rem (>25%)
        lightMinutes: 0,
      });
      expect(scoreHighRatios).toBe(100);
    });
  });

  // ==========================================
  // 5. BADGE STATE TRANSITIONS
  // ==========================================
  describe('Badge State Transitions', () => {
    it('5.1 verifies default initial badge status is "Available" (connected: false)', () => {
      const initialState = getHealthSyncState(TEST_USER);
      expect(initialState.appleHealth.connected).toBe(false);
      expect(initialState.googleHealth.connected).toBe(false);

      const appleBadge = initialState.appleHealth.connected
        ? 'Connected (Live HealthKit)'
        : 'Available';
      const googleBadge = initialState.googleHealth.connected
        ? 'Connected (Live Health Connect)'
        : 'Available';

      expect(appleBadge).toBe('Available');
      expect(googleBadge).toBe('Available');
    });

    it('5.2 verifies Apple status transitions to "Connected (Live HealthKit)" on sync or export import', async () => {
      // 1. Initial
      let state = getHealthSyncState(TEST_USER);
      expect(state.appleHealth.connected).toBe(false);

      // 2. Perform Apple export parse
      const xml = '<HealthData><Record type="HKQuantityTypeIdentifierHeartRate" value="72"/></HealthData>';
      parseAppleHealthExport(xml, TEST_USER);

      // 3. Verify state transition
      state = getHealthSyncState(TEST_USER);
      expect(state.appleHealth.connected).toBe(true);

      const appleBadge = state.appleHealth.connected
        ? 'Connected (Live HealthKit)'
        : 'Available';
      expect(appleBadge).toBe('Connected (Live HealthKit)');
    });

    it('5.3 verifies Google status transitions to "Connected (Live Health Connect)" on sync or export import', async () => {
      // 1. Initial
      let state = getHealthSyncState(TEST_USER);
      expect(state.googleHealth.connected).toBe(false);

      // 2. Perform Google sync
      await syncGoogleHealth(TEST_USER);

      // 3. Verify state transition
      state = getHealthSyncState(TEST_USER);
      expect(state.googleHealth.connected).toBe(true);

      const googleBadge = state.googleHealth.connected
        ? 'Connected (Live Health Connect)'
        : 'Available';
      expect(googleBadge).toBe('Connected (Live Health Connect)');
    });

    it('5.4 verifies explicit state saving persists across reads', () => {
      saveHealthSyncState(TEST_USER, 'apple', {
        connected: true,
        lastSynced: '2026-08-10T15:00:00Z',
        recordsCount: 15,
      });

      const state = getHealthSyncState(TEST_USER);
      expect(state.appleHealth.connected).toBe(true);
      expect(state.appleHealth.lastSynced).toBe('2026-08-10T15:00:00Z');
      expect(state.appleHealth.recordsCount).toBe(15);
    });
  });
});
