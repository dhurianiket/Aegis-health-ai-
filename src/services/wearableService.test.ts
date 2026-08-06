import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateMockTelemetry,
  parseRawTelemetryStream,
  calculateSleepScore,
  subscribeToWearableTelemetry,
  connectWebBluetooth,
  extractBiometricSamples,
  CLINICAL_BOUNDS,
} from './wearableService';
import { WearableBiometrics } from '../types/wearables';

describe('wearableService', () => {
  describe('Clinical Bounds and Telemetry Data Model Validation', () => {
    it('defines correct clinical bounds for wearable metrics', () => {
      expect(CLINICAL_BOUNDS.RHR).toEqual({ min: 30, max: 220, default: 65 });
      expect(CLINICAL_BOUNDS.HRV).toEqual({ min: 5, max: 250, default: 50 });
      expect(CLINICAL_BOUNDS.SPO2).toEqual({ min: 70, max: 100, default: 98 });
      expect(CLINICAL_BOUNDS.STEPS.min).toBe(0);
      expect(CLINICAL_BOUNDS.HEART_RATE).toEqual({ min: 30, max: 220, default: 72 });
    });

    it('extracts biometric samples cleanly into structured array', () => {
      const telemetry = generateMockTelemetry('user-101');
      const samples = extractBiometricSamples(telemetry);

      expect(samples).toHaveLength(5);
      expect(samples.map((s) => s.metric)).toEqual(['heartRate', 'rhr', 'hrv', 'spo2', 'steps']);
      expect(samples.find((s) => s.metric === 'spo2')?.unit).toBe('%');
      expect(samples.find((s) => s.metric === 'hrv')?.unit).toBe('ms');
      expect(samples.find((s) => s.metric === 'steps')?.unit).toBe('steps');
    });
  });

  describe('generateMockTelemetry', () => {
    it('generates valid mock telemetry with realistic bounds compliance', () => {
      const userId = 'patient-test-1';
      const telemetry = generateMockTelemetry(userId);

      expect(telemetry.userId).toBe(userId);
      expect(telemetry.id).toBeDefined();
      expect(typeof telemetry.timestamp).toBe('string');
      expect(new Date(telemetry.timestamp).getTime()).not.toBeNaN();

      // Clinical bounds verification
      expect(telemetry.heartRate).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.HEART_RATE.min);
      expect(telemetry.heartRate).toBeLessThanOrEqual(CLINICAL_BOUNDS.HEART_RATE.max);

      expect(telemetry.rhr).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.RHR.min);
      expect(telemetry.rhr).toBeLessThanOrEqual(CLINICAL_BOUNDS.RHR.max);

      expect(telemetry.hrv).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.HRV.min);
      expect(telemetry.hrv).toBeLessThanOrEqual(CLINICAL_BOUNDS.HRV.max);

      expect(telemetry.spo2).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.SPO2.min);
      expect(telemetry.spo2).toBeLessThanOrEqual(CLINICAL_BOUNDS.SPO2.max);

      expect(telemetry.steps).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.STEPS.min);

      expect(telemetry.sleep).toBeDefined();
      expect(telemetry.sleep.sleepScore).toBeGreaterThanOrEqual(0);
      expect(telemetry.sleep.sleepScore).toBeLessThanOrEqual(100);
      expect(telemetry.connectionStatus).toBe('connected');
    });

    it('respects overrides and clamps values out of clinical bounds', () => {
      const overrides: Partial<WearableBiometrics> = {
        rhr: 15, // below min (30)
        hrv: 300, // above max (250)
        spo2: 50, // below min (70)
        steps: -500, // below min (0)
        connectionStatus: 'syncing',
      };

      const result = generateMockTelemetry('user-override', overrides);

      expect(result.rhr).toBe(30);
      expect(result.hrv).toBe(250);
      expect(result.spo2).toBe(70);
      expect(result.steps).toBe(0);
      expect(result.connectionStatus).toBe('syncing');
    });
  });

  describe('parseRawTelemetryStream', () => {
    it('parses valid telemetry payload object properly', () => {
      const raw = {
        id: 'raw-123',
        userId: 'user-456',
        timestamp: '2026-08-06T10:00:00.000Z',
        heartRate: 78,
        rhr: 60,
        hrv: 65,
        spo2: 99,
        steps: 8200,
        sleep: {
          totalMinutes: 480,
          deepMinutes: 110,
          remMinutes: 110,
          lightMinutes: 260,
          sleepScore: 92,
        },
        connectionStatus: 'connected',
      };

      const parsed = parseRawTelemetryStream(raw);

      expect(parsed.id).toBe('raw-123');
      expect(parsed.userId).toBe('user-456');
      expect(parsed.timestamp).toBe('2026-08-06T10:00:00.000Z');
      expect(parsed.heartRate).toBe(78);
      expect(parsed.rhr).toBe(60);
      expect(parsed.hrv).toBe(65);
      expect(parsed.spo2).toBe(99);
      expect(parsed.steps).toBe(8200);
      expect(parsed.sleep.sleepScore).toBe(92);
      expect(parsed.connectionStatus).toBe('connected');
    });

    it('parses JSON string payload', () => {
      const rawStr = JSON.stringify({
        userId: 'json-user',
        heartRate: 82,
        rhr: 64,
        hrv: 52,
        spo2: 97,
        steps: 3400,
      });

      const parsed = parseRawTelemetryStream(rawStr);

      expect(parsed.userId).toBe('json-user');
      expect(parsed.heartRate).toBe(82);
      expect(parsed.rhr).toBe(64);
      expect(parsed.hrv).toBe(52);
      expect(parsed.spo2).toBe(97);
      expect(parsed.steps).toBe(3400);
    });

    it('handles snake_case attributes correctly', () => {
      const raw = {
        user_id: 'snake_user',
        resting_heart_rate: 62,
        heart_rate_variability: 48,
        connection_status: 'disconnected',
      };

      const parsed = parseRawTelemetryStream(raw);

      expect(parsed.userId).toBe('snake_user');
      expect(parsed.rhr).toBe(62);
      expect(parsed.hrv).toBe(48);
      expect(parsed.connectionStatus).toBe('disconnected');
    });

    it('sanitizes out-of-bound or malformed values safely', () => {
      const malformed = {
        userId: 'user-malformed',
        rhr: 999, // exceeds 220 -> 220
        hrv: -10, // below 5 -> 5
        spo2: 120, // exceeds 100 -> 100
        steps: -50, // below 0 -> 0
        heartRate: 'invalid_number', // NaN -> default 72
        connectionStatus: 'invalid_status', // -> default 'connected'
      };

      const parsed = parseRawTelemetryStream(malformed);

      expect(parsed.rhr).toBe(220);
      expect(parsed.hrv).toBe(5);
      expect(parsed.spo2).toBe(100);
      expect(parsed.steps).toBe(0);
      expect(parsed.heartRate).toBe(72);
      expect(parsed.connectionStatus).toBe('connected');
    });

    it('handles empty, null, undefined, primitive, and invalid JSON without throwing', () => {
      const inputs = [null, undefined, {}, [], 42, 'invalid { json', true];

      for (const input of inputs) {
        expect(() => {
          const res = parseRawTelemetryStream(input);
          expect(res.userId).toBeDefined();
          expect(res.rhr).toBeGreaterThanOrEqual(30);
          expect(res.hrv).toBeGreaterThanOrEqual(5);
          expect(res.spo2).toBeGreaterThanOrEqual(70);
          expect(res.steps).toBeGreaterThanOrEqual(0);
        }).not.toThrow();
      }
    });
  });

  describe('calculateSleepScore', () => {
    it('calculates near 100 score under optimal sleep conditions (7-9h, ~20-25% deep/REM)', () => {
      const optimalSleep = {
        totalMinutes: 480, // 8 hours
        deepMinutes: 110, // ~23%
        remMinutes: 110, // ~23%
        lightMinutes: 260,
      };

      const score = calculateSleepScore(optimalSleep);
      expect(score).toBe(100);
    });

    it('calculates sub-optimal score for reduced sleep duration and ratios', () => {
      const subOptimalSleep = {
        totalMinutes: 360, // 6 hours
        deepMinutes: 60, // ~16.7%
        remMinutes: 60, // ~16.7%
        lightMinutes: 240,
      };

      const score = calculateSleepScore(subOptimalSleep);
      expect(score).toBeGreaterThanOrEqual(75);
      expect(score).toBeLessThan(95);
    });

    it('calculates low score for severely sleep-deprived conditions', () => {
      const sleepDeprived = {
        totalMinutes: 180, // 3 hours
        deepMinutes: 15, // ~8.3%
        remMinutes: 15, // ~8.3%
        lightMinutes: 150,
      };

      const score = calculateSleepScore(sleepDeprived);
      expect(score).toBeLessThan(50);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('handles edge cases (0 minutes, negative duration, NaN, null)', () => {
      expect(calculateSleepScore({ totalMinutes: 0, deepMinutes: 0, remMinutes: 0, lightMinutes: 0 })).toBe(0);
      expect(calculateSleepScore({ totalMinutes: -100, deepMinutes: 10, remMinutes: 10, lightMinutes: 0 })).toBe(0);
      expect(calculateSleepScore({ totalMinutes: NaN, deepMinutes: 10, remMinutes: 10, lightMinutes: 0 })).toBe(0);
      expect(calculateSleepScore(null as any)).toBe(0);
      expect(calculateSleepScore(undefined as any)).toBe(0);
    });
  });

  describe('subscribeToWearableTelemetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('subscribes and emits immediate initial reading then periodic telemetry updates', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToWearableTelemetry('user-sub-1', callback, { intervalMs: 2000 });

      // Initial immediate emission
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].userId).toBe('user-sub-1');

      // Advance by 2 seconds -> second call
      vi.advanceTimersByTime(2000);
      expect(callback).toHaveBeenCalledTimes(2);

      // Advance by another 4 seconds -> 2 more calls (4 total)
      vi.advanceTimersByTime(4000);
      expect(callback).toHaveBeenCalledTimes(4);

      // Cleanup
      unsubscribe();

      // Advancing further after unsubscribe does not invoke callback
      vi.advanceTimersByTime(5000);
      expect(callback).toHaveBeenCalledTimes(4);
    });
  });

  describe('connectWebBluetooth', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns "unsupported" when navigator.bluetooth is unavailable', async () => {
      // In default Node/JSDOM environment, navigator.bluetooth is undefined
      const state = await connectWebBluetooth();
      expect(state).toBe('unsupported');
    });

    it('returns "connected" when Web Bluetooth API connects successfully', async () => {
      const mockGattConnect = vi.fn().mockResolvedValue({});
      const mockRequestDevice = vi.fn().mockResolvedValue({
        gatt: { connect: mockGattConnect },
      });

      const originalBluetooth = (navigator as any).bluetooth;

      Object.defineProperty(navigator, 'bluetooth', {
        value: {
          requestDevice: mockRequestDevice,
          getAvailability: vi.fn().mockResolvedValue(true),
        },
        configurable: true,
        writable: true,
      });

      const state = await connectWebBluetooth();
      expect(state).toBe('connected');

      // Restore navigator.bluetooth
      if (originalBluetooth) {
        Object.defineProperty(navigator, 'bluetooth', { value: originalBluetooth, configurable: true });
      } else {
        delete (navigator as any).bluetooth;
      }
    });

    it('returns "disconnected" when Bluetooth device connection is rejected or cancelled', async () => {
      const mockRequestDevice = vi.fn().mockRejectedValue(new Error('User cancelled'));

      Object.defineProperty(navigator, 'bluetooth', {
        value: {
          requestDevice: mockRequestDevice,
          getAvailability: vi.fn().mockResolvedValue(true),
        },
        configurable: true,
        writable: true,
      });

      const state = await connectWebBluetooth();
      expect(state).toBe('disconnected');

      delete (navigator as any).bluetooth;
    });
  });
});
