import { describe, it, expect } from 'vitest';
import {
  evaluateBiometricDiagnosticCorrelation,
} from '../biometricDiagnosticEngine';
import { WearableBiometrics } from '../../types/wearables';
import { LabResult, MedicalDocument } from '../../types/medical';

describe('BiometricDiagnosticEngine Comprehensive Empirical Stress & Vulnerability Suite', () => {
  const validTelemetry: WearableBiometrics = {
    id: 'wearable_stress_01',
    userId: 'user_stress',
    timestamp: '2026-08-06T10:00:00Z',
    heartRate: 72,
    rhr: 65,
    hrv: 50,
    spo2: 98,
    steps: 10000,
    sleep: {
      totalMinutes: 480,
      deepMinutes: 90,
      remMinutes: 110,
      lightMinutes: 280,
      sleepScore: 80,
    },
    connectionStatus: 'connected',
  };

  // =========================================================================
  // SECTION 1: Imaging Findings Payload Stress & Vulnerability Tests
  // =========================================================================
  describe('1. Unstructured & Messy Imaging Findings Payload Handling', () => {
    it('should process unstructured OCR raw text with noise, mixed cases, and illegible handwriting notes', () => {
      const messyOcr = [
        `IMAGING REPORT (SCAN DATE: 2026-07-20)
        [??? illegible handwriting] patient complains of severe L4-L5 pain.
        FINDINGS: IMPRESSION shows L4-L5 disc herniation with severe canal narrowing.
        Note: [blur] rule out L5-S1 involvement as well...
        Signed, Dr. J. Doe, MD **** CONFIDENTIAL ****`,
      ];
      const result = evaluateBiometricDiagnosticCorrelation(validTelemetry, [], messyOcr);
      expect(result.activityFilters).toHaveLength(1);
      expect(result.activityFilters[0].anatomicalTarget).toContain('Spine');
    });

    it('should process huge unstructured OCR text payloads (1MB string) without memory/perf collapse', () => {
      const hugeText = 'L4-L5 disc herniation '.repeat(50000);
      const result = evaluateBiometricDiagnosticCorrelation(validTelemetry, [], [hugeText]);
      expect(result.activityFilters).toHaveLength(1);
    });

    it('should handle MedicalDocument with missing, null, or corrupted extractedData fields', () => {
      const corruptDocs: MedicalDocument[] = [
        {
          id: 'doc_01',
          userId: 'u1',
          type: 'imaging_report',
          date: '2026-08-01',
          fileName: 'scan.pdf',
          isProcessed: true,
          createdAt: '2026-08-01',
          extractedData: null,
        },
        {
          id: 'doc_02',
          userId: 'u1',
          type: 'imaging_report',
          date: '2026-08-01',
          fileName: 'scan2.pdf',
          isProcessed: true,
          createdAt: '2026-08-01',
          extractedData: 12345 as any,
        },
        {
          id: 'doc_03',
          userId: 'u1',
          type: 'imaging_report',
          date: '2026-08-01',
          fileName: 'scan3.pdf',
          isProcessed: true,
          createdAt: '2026-08-01',
          extractedData: { findings: null, summary: undefined, text: 999, impression: true },
        },
      ];

      const result = evaluateBiometricDiagnosticCorrelation(validTelemetry, [], corruptDocs);
      expect(result).toBeDefined();
    });

    it('should handle MedicalDocument with circular references in extractedData gracefully', () => {
      const circularObj: any = { findings: 'herniated disc L4-L5' };
      circularObj.self = circularObj;

      const doc: MedicalDocument = {
        id: 'doc_circ',
        userId: 'u1',
        type: 'imaging_report',
        date: '2026-08-01',
        fileName: 'circular.pdf',
        isProcessed: true,
        createdAt: '2026-08-01',
        extractedData: circularObj,
      };

      const result = evaluateBiometricDiagnosticCorrelation(validTelemetry, [], [doc]);
      expect(result.activityFilters).toHaveLength(1);
    });

    it('should handle imaging findings array containing null, undefined, numbers, or boolean primitives', () => {
      const messyList: any[] = [
        null,
        undefined,
        123,
        true,
        'Knee X-ray shows severe osteoarthritis',
        { randomField: 'no extracted data' },
      ];

      const result = evaluateBiometricDiagnosticCorrelation(validTelemetry, [], messyList);
      expect(result.activityFilters).toHaveLength(1);
      expect(result.activityFilters[0].anatomicalTarget).toContain('Joint');
    });

    it('VULNERABILITY DETECTED: Non-array object passed as imagingFindings throws TypeError: imagingFindings is not iterable', () => {
      const nonArrayObject: any = { findings: 'L4-L5 disc herniation' };
      expect(() => {
        evaluateBiometricDiagnosticCorrelation(validTelemetry, [], nonArrayObject);
      }).toThrow(TypeError);
    });

    it('VULNERABILITY DETECTED: Raw string passed directly as imagingFindings breaks character-by-character', () => {
      const directString: any = 'Lumbar MRI report shows L4-L5 disc herniation';
      const result = evaluateBiometricDiagnosticCorrelation(validTelemetry, [], directString);
      // Because 'normalizeImagingTexts' loops characters instead of recognizing string, matching fails!
      expect(result.activityFilters).toHaveLength(0);
    });
  });

  // =========================================================================
  // SECTION 2: Lab Results Payload Stress & Vulnerability Tests
  // =========================================================================
  describe('2. Lab Results Payload Corruption & Malformed Inputs', () => {
    it('should handle empty lab array []', () => {
      const result = evaluateBiometricDiagnosticCorrelation(validTelemetry, []);
      expect(result.metabolicAdaptations).toHaveLength(0);
      expect(result.recoveryOverrides).toHaveLength(0);
    });

    it('should handle null or undefined labResults parameter', () => {
      const resNull = evaluateBiometricDiagnosticCorrelation(validTelemetry, null as any);
      expect(resNull.metabolicAdaptations).toHaveLength(0);

      const resUndef = evaluateBiometricDiagnosticCorrelation(validTelemetry, undefined as any);
      expect(resUndef.metabolicAdaptations).toHaveLength(0);
    });

    it('should handle lab objects with missing value, null value, undefined value, or NaN', () => {
      const corruptLabs: any[] = [
        { id: '1', markerName: 'HbA1c', value: null },
        { id: '2', markerName: 'Glucose', value: undefined, numeric_value: undefined },
        { id: '3', markerName: 'Ferritin', value: NaN },
        { id: '4', markerName: 'hs-CRP', value: 'INVALID_NUMERIC' },
        { id: '5', markerName: 'Glucose' },
      ];

      const result = evaluateBiometricDiagnosticCorrelation(validTelemetry, corruptLabs);
      expect(result.metabolicAdaptations).toHaveLength(0);
      expect(result.recoveryOverrides).toHaveLength(0);
    });

    it('VULNERABILITY DETECTED: Non-string markerName (number) throws lab.markerName.toLowerCase is not a function', () => {
      const nonStringMarkerLabs: any[] = [
        { id: '1', markerName: 12345, value: 150 },
      ];
      expect(() => {
        evaluateBiometricDiagnosticCorrelation(validTelemetry, nonStringMarkerLabs);
      }).toThrow(TypeError);
    });

    it('VULNERABILITY DETECTED: Non-string unit (number) throws lab.unit.trim is not a function', () => {
      const nonStringUnitLabs: any[] = [
        { id: '1', markerName: 'HbA1c', value: 7.2, unit: 100 },
      ];
      expect(() => {
        evaluateBiometricDiagnosticCorrelation(validTelemetry, nonStringUnitLabs);
      }).toThrow(TypeError);
    });

    it('VULNERABILITY DETECTED: Empty string lab value "" evaluates to 0, triggering false Low Ferritin override', () => {
      const emptyStringValLab: LabResult[] = [
        {
          id: 'ferritin_empty',
          userId: 'u1',
          docId: 'd1',
          date: '2026-08-01',
          markerName: 'Ferritin',
          value: '' as any,
          unit: 'ng/mL',
          status: 'normal',
        },
      ];

      const result = evaluateBiometricDiagnosticCorrelation(validTelemetry, emptyStringValLab);
      expect(result.recoveryOverrides).toHaveLength(1);
      expect(result.recoveryOverrides[0].reason).toContain('Low iron storage detected');
    });
  });

  // =========================================================================
  // SECTION 3: Telemetry Out-of-Bounds & Vulnerability Tests
  // =========================================================================
  describe('3. Out-of-Bounds & Nullable Telemetry Payload Handling', () => {
    it('should handle null or undefined telemetry gracefully', () => {
      const resultNull = evaluateBiometricDiagnosticCorrelation(null as any, []);
      expect(resultNull.readinessScore).toBeDefined();

      const resultUndef = evaluateBiometricDiagnosticCorrelation(undefined as any, []);
      expect(resultUndef.readinessScore).toBeDefined();
    });

    it('should handle numeric extreme out-of-bounds RHR values (-100, 0, 999, Infinity, -Infinity)', () => {
      const extremeValues = [-100, 0, 999, Infinity, -Infinity];

      for (const val of extremeValues) {
        const tele: any = { ...validTelemetry, rhr: val, heartRate: val };
        const result = evaluateBiometricDiagnosticCorrelation(tele, []);
        expect(result.readinessScore).toBeGreaterThanOrEqual(0);
        expect(result.readinessScore).toBeLessThanOrEqual(100);
      }
    });

    it('VULNERABILITY DETECTED: NaN RHR propagates NaN into composite readiness score', () => {
      const nanRhrTelemetry: any = { ...validTelemetry, rhr: NaN };
      const result = evaluateBiometricDiagnosticCorrelation(nanRhrTelemetry, []);
      expect(Number.isNaN(result.readinessScore)).toBe(true);
      expect(result.summaryMarkdown).toContain('Dynamic Readiness Score: **NaN/100**');
    });

    it('VULNERABILITY DETECTED: NaN HRV propagates NaN into composite readiness score', () => {
      const nanHrvTelemetry: any = { ...validTelemetry, hrv: NaN };
      const result = evaluateBiometricDiagnosticCorrelation(nanHrvTelemetry, []);
      expect(Number.isNaN(result.readinessScore)).toBe(true);
      expect(result.summaryMarkdown).toContain('Dynamic Readiness Score: **NaN/100**');
    });

    it('VULNERABILITY DETECTED: NaN sleepScore propagates NaN into composite readiness score', () => {
      const nanSleepTelemetry: any = {
        ...validTelemetry,
        sleep: { sleepScore: NaN },
      };
      const result = evaluateBiometricDiagnosticCorrelation(nanSleepTelemetry, []);
      expect(Number.isNaN(result.readinessScore)).toBe(true);
      expect(result.summaryMarkdown).toContain('Dynamic Readiness Score: **NaN/100**');
    });

    it('VULNERABILITY DETECTED: Negative RHR generates negative recommended RHR ceiling in recovery override', () => {
      const negRhrTelemetry: any = { ...validTelemetry, rhr: -50 };
      const lowFerritinLab: LabResult[] = [
        {
          id: '1',
          userId: 'u1',
          docId: 'd1',
          date: '2026-08-01',
          markerName: 'Ferritin',
          value: 15,
          unit: 'ng/mL',
          status: 'abnormal',
        },
      ];

      const result = evaluateBiometricDiagnosticCorrelation(negRhrTelemetry, lowFerritinLab);
      expect(result.recoveryOverrides).toHaveLength(1);
      expect(result.recoveryOverrides[0].recommendedRhrCeiling).toBe(-30);
    });
  });
});
