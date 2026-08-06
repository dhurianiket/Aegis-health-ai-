import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  subscribeToWearableTelemetry,
  extractBiometricSamples,
  parseRawTelemetryStream,
  generateMockTelemetry,
  CLINICAL_BOUNDS,
} from './wearableService';
import { WearableBiometrics } from '../types/wearables';

describe('Empirical Stress Tests: Wearable Telemetry & Biometrics', () => {
  describe('High-Frequency Subscriptions & Concurrency Stress', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('handles high-frequency 1ms interval streams across 100 concurrent subscribers', { timeout: 15000 }, () => {
      const subscriberCount = 100;
      const callbacks = Array.from({ length: subscriberCount }, () => vi.fn());
      const unsubscribers: (() => void)[] = [];

      // Subscribe 100 concurrent clients at 1ms intervals
      const startTime = performance.now();
      for (let i = 0; i < subscriberCount; i++) {
        const unsubscribe = subscribeToWearableTelemetry(
          `concurrent-user-${i}`,
          callbacks[i],
          { intervalMs: 1, mockNoiseFactor: 0.2 }
        );
        unsubscribers.push(unsubscribe);
      }
      const setupTime = performance.now() - startTime;

      // Initial immediate emission: every callback invoked once
      for (let i = 0; i < subscriberCount; i++) {
        expect(callbacks[i]).toHaveBeenCalledTimes(1);
        const initialData = callbacks[i].mock.calls[0][0];
        expect(initialData.userId).toBe(`concurrent-user-${i}`);
        expect(initialData.heartRate).toBeGreaterThanOrEqual(CLINICAL_BOUNDS.HEART_RATE.min);
        expect(initialData.heartRate).toBeLessThanOrEqual(CLINICAL_BOUNDS.HEART_RATE.max);
      }

      // Fast forward 100ms (100 interval ticks)
      const tickStartTime = performance.now();
      vi.advanceTimersByTime(100);
      const tickDuration = performance.now() - tickStartTime;

      // Each subscriber must have received 1 initial + 100 periodic = 101 emissions
      // Total emissions across all 100 subscribers = 10,100
      let totalEmissions = 0;
      for (let i = 0; i < subscriberCount; i++) {
        expect(callbacks[i]).toHaveBeenCalledTimes(101);
        totalEmissions += callbacks[i].mock.calls.length;
      }
      expect(totalEmissions).toBe(10100);

      // Verify timers count equal to subscriber count
      expect(vi.getTimerCount()).toBe(subscriberCount);

      // Cleanup all subscriptions
      unsubscribers.forEach((unsub) => unsub());
      expect(vi.getTimerCount()).toBe(0);

      console.log(`[STRESS METRICS] 100 Subscribers Setup: ${setupTime.toFixed(2)}ms | 10,100 Emissions Tick: ${tickDuration.toFixed(2)}ms`);
    });

    it('maintains data isolation and bound integrity across 50 concurrent subscribers running 5,050 updates', { timeout: 15000 }, () => {
      const subscriberCount = 50;
      const callbackCountPerSubscriber: number[] = new Array(subscriberCount).fill(0);
      const unsubscribers: (() => void)[] = [];

      for (let i = 0; i < subscriberCount; i++) {
        const unsub = subscribeToWearableTelemetry(
          `stress-sub-${i}`,
          (data) => {
            callbackCountPerSubscriber[i]++;
            // Verify data attributes strictly per subscriber
            expect(data.userId).toBe(`stress-sub-${i}`);
            expect(data.heartRate).toBeGreaterThanOrEqual(30);
            expect(data.heartRate).toBeLessThanOrEqual(220);
          },
          { intervalMs: 1 }
        );
        unsubscribers.push(unsub);
      }

      // Advance by 100ms -> 1 initial + 100 updates = 101 calls per sub = 5,050 total calls
      vi.advanceTimersByTime(100);

      for (let i = 0; i < subscriberCount; i++) {
        expect(callbackCountPerSubscriber[i]).toBe(101);
      }

      unsubscribers.forEach((u) => u());
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('Repeated Subscribe / Unsubscribe Cycles & Memory / Timer Leak Safety', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('cleans up all interval timers without lingering timers across 1,000 rapid subscribe/unsubscribe cycles', () => {
      expect(vi.getTimerCount()).toBe(0);

      const cycleCount = 1000;
      const callback = vi.fn();

      for (let i = 0; i < cycleCount; i++) {
        const unsub = subscribeToWearableTelemetry(`leak-test-user-${i}`, callback, { intervalMs: 10 });
        // Immediately unsubscribe
        unsub();
      }

      // Verify timer count is exactly 0 after all unsubscribes
      expect(vi.getTimerCount()).toBe(0);

      // Callback should have been called 1,000 times for initial immediate emission only
      expect(callback).toHaveBeenCalledTimes(cycleCount);

      // Advance timers by 10,000 seconds to verify no lingering timers fire
      vi.advanceTimersByTime(10000000);
      expect(callback).toHaveBeenCalledTimes(cycleCount);
    });

    it('handles idempotent multiple unsubscribe calls safely without errors or side-effects', () => {
      const callback = vi.fn();
      const unsub = subscribeToWearableTelemetry('user-idempotent', callback, { intervalMs: 500 });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(1);

      // Unsubscribe 1st time
      unsub();
      expect(vi.getTimerCount()).toBe(0);

      // Call unsubscribe 2nd, 3rd, 10th time (idempotency check)
      expect(() => {
        unsub();
        unsub();
        unsub();
      }).not.toThrow();

      expect(vi.getTimerCount()).toBe(0);

      vi.advanceTimersByTime(5000);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('correctly handles partial unsubscriptions in a mixed active/inactive subscriber pool', () => {
      const activeCallback = vi.fn();
      const inactiveCallback = vi.fn();

      const unsubsActive: (() => void)[] = [];
      const unsubsInactive: (() => void)[] = [];

      // Create 50 active subscribers and 50 inactive subscribers
      for (let i = 0; i < 50; i++) {
        unsubsActive.push(subscribeToWearableTelemetry(`active-${i}`, activeCallback, { intervalMs: 100 }));
        unsubsInactive.push(subscribeToWearableTelemetry(`inactive-${i}`, inactiveCallback, { intervalMs: 100 }));
      }

      expect(vi.getTimerCount()).toBe(100);
      expect(activeCallback).toHaveBeenCalledTimes(50);
      expect(inactiveCallback).toHaveBeenCalledTimes(50);

      // Unsubscribe all inactive subscribers
      unsubsInactive.forEach((unsub) => unsub());
      expect(vi.getTimerCount()).toBe(50);

      // Fast forward 500ms (5 ticks)
      vi.advanceTimersByTime(500);

      // Active callback receives 50 initial + (50 subscribers * 5 ticks) = 300 calls
      expect(activeCallback).toHaveBeenCalledTimes(300);

      // Inactive callback remains at 50 initial calls
      expect(inactiveCallback).toHaveBeenCalledTimes(50);

      // Clean up remaining active subscriptions
      unsubsActive.forEach((unsub) => unsub());
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('extractBiometricSamples & Robustness under Partial / Missing Metrics', () => {
    it('extracts complete biometric samples array for standard telemetry', () => {
      const telemetry = generateMockTelemetry('user-standard');
      const samples = extractBiometricSamples(telemetry);

      expect(samples).toHaveLength(5);
      expect(samples[0]).toEqual({
        metric: 'heartRate',
        value: telemetry.heartRate,
        timestamp: telemetry.timestamp,
        unit: 'bpm',
      });
      expect(samples[1]).toEqual({
        metric: 'rhr',
        value: telemetry.rhr,
        timestamp: telemetry.timestamp,
        unit: 'bpm',
      });
      expect(samples[2]).toEqual({
        metric: 'hrv',
        value: telemetry.hrv,
        timestamp: telemetry.timestamp,
        unit: 'ms',
      });
      expect(samples[3]).toEqual({
        metric: 'spo2',
        value: telemetry.spo2,
        timestamp: telemetry.timestamp,
        unit: '%',
      });
      expect(samples[4]).toEqual({
        metric: 'steps',
        value: telemetry.steps,
        timestamp: telemetry.timestamp,
        unit: 'steps',
      });
    });

    it('evaluates extractBiometricSamples when given a sanitized telemetry from parseRawTelemetryStream with partial input', () => {
      // Missing most metrics in raw stream input
      const partialRawInput = {
        userId: 'user-partial-raw',
        heartRate: 88,
      };

      const parsedTelemetry = parseRawTelemetryStream(partialRawInput);
      const samples = extractBiometricSamples(parsedTelemetry);

      expect(samples).toHaveLength(5);

      // Missing metrics get populated with safe clinical bounds defaults via parseRawTelemetryStream
      const hrSample = samples.find((s) => s.metric === 'heartRate');
      const rhrSample = samples.find((s) => s.metric === 'rhr');
      const hrvSample = samples.find((s) => s.metric === 'hrv');
      const spo2Sample = samples.find((s) => s.metric === 'spo2');
      const stepsSample = samples.find((s) => s.metric === 'steps');

      expect(hrSample?.value).toBe(88);
      expect(rhrSample?.value).toBe(CLINICAL_BOUNDS.RHR.default); // 65
      expect(hrvSample?.value).toBe(CLINICAL_BOUNDS.HRV.default); // 50
      expect(spo2Sample?.value).toBe(CLINICAL_BOUNDS.SPO2.default); // 98
      expect(stepsSample?.value).toBe(CLINICAL_BOUNDS.STEPS.default); // 0
    });

    it('empirically checks extractBiometricSamples direct invocation with raw partial objects (missing keys)', () => {
      // Testing direct invocation with partial object cast to WearableBiometrics
      const rawPartialObj = {
        userId: 'user-raw-partial',
        timestamp: '2026-08-06T10:00:00.000Z',
        heartRate: 75,
        // rhr, hrv, spo2, steps omitted
      } as unknown as WearableBiometrics;

      const samples = extractBiometricSamples(rawPartialObj);

      expect(samples).toHaveLength(5);
      expect(samples.find((s) => s.metric === 'heartRate')?.value).toBe(75);
      expect(samples.find((s) => s.metric === 'rhr')?.value).toBeUndefined();
      expect(samples.find((s) => s.metric === 'hrv')?.value).toBeUndefined();
      expect(samples.find((s) => s.metric === 'spo2')?.value).toBeUndefined();
      expect(samples.find((s) => s.metric === 'steps')?.value).toBeUndefined();
    });

    it('empirically documents runtime exceptions when null or undefined is passed to extractBiometricSamples', () => {
      // Expect TypeError when biometrics is null or undefined
      expect(() => extractBiometricSamples(null as unknown as WearableBiometrics)).toThrow(TypeError);
      expect(() => extractBiometricSamples(undefined as unknown as WearableBiometrics)).toThrow(TypeError);
    });

    it('handles numeric edge cases (NaN, Infinity, negative values) in partial biometrics', () => {
      const EdgeBiometrics = {
        userId: 'user-edge',
        timestamp: '2026-08-06T10:00:00.000Z',
        heartRate: NaN,
        rhr: -50,
        hrv: Infinity,
        spo2: null as any,
        steps: '1000' as any,
      } as unknown as WearableBiometrics;

      const samples = extractBiometricSamples(EdgeBiometrics);

      expect(samples).toHaveLength(5);
      expect(Number.isNaN(samples.find((s) => s.metric === 'heartRate')?.value)).toBe(true);
      expect(samples.find((s) => s.metric === 'rhr')?.value).toBe(-50);
      expect(samples.find((s) => s.metric === 'hrv')?.value).toBe(Infinity);
      expect(samples.find((s) => s.metric === 'spo2')?.value).toBeNull();
      expect(samples.find((s) => s.metric === 'steps')?.value).toBe('1000');
    });
  });
});
