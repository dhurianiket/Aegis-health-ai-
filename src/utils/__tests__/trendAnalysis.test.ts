import { describe, it, expect } from 'vitest';
import { computeTrend } from '../trendAnalysis';
import { LabObservation } from '../../types/health';

describe('trendAnalysis - computeTrend', () => {
  it('returns null when empty array is passed', () => {
    const result = computeTrend([], 'hba1c');
    expect(result).toBeNull();
  });

  it('returns null when an array with a single observation is passed', () => {
    const obs: LabObservation = {

      testName: 'hba1c',
      valueCanonical: 5.5,
      unitCanonical: '%',
      collectedAt: new Date('2023-01-01T00:00:00Z').toISOString(),
      flag: null,
      reportId: "",

    };
    const result = computeTrend([obs], 'hba1c');
    expect(result).toBeNull();
  });

  it('returns a trend summary when multiple valid observations are passed', () => {
    const obs1: LabObservation = {

      testName: 'hba1c',
      valueCanonical: 5.5,
      unitCanonical: '%',
      collectedAt: new Date('2023-01-01T00:00:00Z').toISOString(),
      flag: null,
      reportId: "",

    };
    const obs2: LabObservation = {

      testName: 'hba1c',
      valueCanonical: 6.0,
      unitCanonical: '%',
      collectedAt: new Date('2023-06-01T00:00:00Z').toISOString(),
      flag: null,
      reportId: "",

    };
    const result = computeTrend([obs1, obs2], 'hba1c');

    expect(result).not.toBeNull();
    expect(result?.testName).toBe('hba1c');
    expect(result?.firstValue).toBe(5.5);
    expect(result?.lastValue).toBe(6.0);
    expect(result?.delta).toBe(0.5);
    expect(result?.dataPointCount).toBe(2);
    expect(result?.direction).toBe('increasing');
    expect(result?.durationMonths).toBe(5);
  });

  it('returns null when observations are present but not for the specific testName', () => {
    const obs1: LabObservation = {

      testName: 'glucose',
      valueCanonical: 100,
      unitCanonical: 'mg/dL',
      collectedAt: new Date('2023-01-01T00:00:00Z').toISOString(),
      flag: null,
      reportId: "",

    };
    const obs2: LabObservation = {

      testName: 'glucose',
      valueCanonical: 105,
      unitCanonical: 'mg/dL',
      collectedAt: new Date('2023-06-01T00:00:00Z').toISOString(),
      flag: null,
      reportId: "",

    };

    const result = computeTrend([obs1, obs2], 'hba1c');
    expect(result).toBeNull();
  });

  it('returns null when observations are present but missing collectedAt or valueCanonical', () => {
    const obs1: LabObservation = {

      testName: 'hba1c',
      valueCanonical: undefined, // Missing valueCanonical
      unitCanonical: '%',
      collectedAt: new Date('2023-01-01T00:00:00Z').toISOString(),
      flag: null,
      reportId: "",

    } as unknown as LabObservation; // Type cast to allow undefined for testing

    const obs2: LabObservation = {

      testName: 'hba1c',
      valueCanonical: 6.0,
      unitCanonical: '%',
      collectedAt: undefined, // Missing collectedAt

    } as unknown as LabObservation;

    const obs3: LabObservation = {

      testName: 'hba1c',
      valueCanonical: null, // Missing valueCanonical (null)
      unitCanonical: '%',
      collectedAt: new Date('2023-06-01T00:00:00Z').toISOString(),
      flag: null,
      reportId: "",

    } as unknown as LabObservation;

    const result = computeTrend([obs1, obs2, obs3], 'hba1c');
    expect(result).toBeNull();
  });
});
