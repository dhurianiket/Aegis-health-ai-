import { describe, it, expect } from 'vitest';
import {
  evaluateBiometricDiagnosticCorrelation,
} from './biometricDiagnosticEngine';
import { WearableBiometrics } from '../types/wearables';
import { LabResult, LabStatus, MedicalDocument } from '../types/medical';

describe('Biometric Diagnostic Engine - Empirical Stress & Boundary Test Suite', () => {
  const defaultTelemetry: WearableBiometrics = {
    id: 'wearable_stress_01',
    userId: 'user_stress_1',
    timestamp: '2026-08-06T10:00:00Z',
    heartRate: 70,
    rhr: 65,
    hrv: 50,
    spo2: 98,
    steps: 5000,
    sleep: {
      totalMinutes: 420,
      deepMinutes: 60,
      remMinutes: 90,
      lightMinutes: 270,
      sleepScore: 80,
    },
    connectionStatus: 'connected',
  };

  const createLab = (markerName: any, value: any, unit: string = ''): LabResult => ({
    id: `lab_${String(markerName).toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    userId: 'user_stress_1',
    docId: 'doc_stress_01',
    date: '2026-08-06',
    markerName,
    value,
    unit,
    status: LabStatus.NORMAL,
  });

  describe('1. Multi-Morbidity Clinical Stress Scenario', () => {
    it('should correctly process combined diabetes + low ferritin + L4-L5 herniation + knee cartilage degeneration + tachycardia + hypoxia', () => {
      const multiMorbidityTelemetry: WearableBiometrics = {
        ...defaultTelemetry,
        heartRate: 112,
        rhr: 108, // Tachycardia (>100 bpm)
        spo2: 88, // Hypoxia (<92%)
        hrv: 18,  // Very low HRV
        sleep: {
          totalMinutes: 240,
          deepMinutes: 20,
          remMinutes: 30,
          lightMinutes: 190,
          sleepScore: 35,
        },
      };

      const multiMorbidityLabs: LabResult[] = [
        createLab('HbA1c', 7.8, '%'),            // Elevated HbA1c (>6.5%)
        createLab('Fasting Glucose', 145, 'mg/dL'),// Elevated Glucose (>100 mg/dL)
        createLab('Serum Ferritin', 14, 'ng/mL'), // Low Ferritin (<30 ng/mL)
        createLab('hs-CRP', 6.2, 'mg/L'),          // High hs-CRP (>3.0 mg/L)
      ];

      const multiMorbidityImaging: string[] = [
        'Lumbar spine MRI reveals L4-L5 disc herniation with severe spinal stenosis',
        'Bilateral knee X-ray demonstrates significant cartilage degeneration and joint space narrowing',
      ];

      const result = evaluateBiometricDiagnosticCorrelation(
        multiMorbidityTelemetry,
        multiMorbidityLabs,
        multiMorbidityImaging
      );

      // Verify Metabolic Adaptations (both HbA1c and Glucose)
      expect(result.metabolicAdaptations).toHaveLength(2);
      const ruleIds = result.metabolicAdaptations.map((m) => m.ruleId);
      expect(ruleIds).toContain('METABOLIC_HBA1C_ELEVATED');
      expect(ruleIds).toContain('METABOLIC_GLUCOSE_ELEVATED');

      // Verify Recovery Overrides (Low Ferritin + hs-CRP)
      expect(result.recoveryOverrides).toHaveLength(2);
      expect(result.recoveryOverrides.every((r) => r.active)).toBe(true);

      // Verify Activity Filters (Spine + Joint)
      expect(result.activityFilters).toHaveLength(2);
      const targets = result.activityFilters.map((a) => a.anatomicalTarget);
      expect(targets.some((t) => t.includes('Lumbar Spine'))).toBe(true);
      expect(targets.some((t) => t.includes('Articular Joint Cartilage'))).toBe(true);

      // Verify Safety Triage Alerts (Tachycardia + Hypoxia)
      expect(result.safetyAlerts).toHaveLength(2);
      const alertMetrics = result.safetyAlerts.map((s) => s.metric);
      expect(alertMetrics).toContain('Resting Heart Rate');
      expect(alertMetrics).toContain('Blood Oxygenation (SpO2)');

      // Verify Composite Readiness Score calculation floor
      // Sleep: (35/100)*35 = 12.25
      // HRV: (18/50)*35 = 12.6
      // RHR: max(0, 30 - (108-65)*1.5) = 0
      // Subtotal = 24.85
      // Penalties: hs-CRP (-15), Ferritin (-15), Hypoxia (-25), Tachycardia (-15) -> Total Penalties = -70
      // Net = 24.85 - 70 = -45.15 => Math.max(0, ...) = 0
      expect(result.readinessScore).toBe(0);

      // Verify markdown content completeness
      expect(result.summaryMarkdown).toContain('Dynamic Readiness Score: **0/100**');
      expect(result.summaryMarkdown).toContain('[Source: Wearable HR/Steps]');
      expect(result.summaryMarkdown).toContain('[Source: Lab Report]');
      expect(result.summaryMarkdown).toContain('[Source: Imaging Finding]');
    });
  });

  describe('2. Exact Boundary Value Cutoff Matrix', () => {
    describe('hs-CRP (Threshold > 3.0 mg/L)', () => {
      it('hs-CRP = 2.9 (Below cutoff - No override)', () => {
        const res = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [createLab('hs-CRP', 2.9, 'mg/L')]);
        expect(res.recoveryOverrides.filter((r) => r.reason.includes('inflammation'))).toHaveLength(0);
      });

      it('hs-CRP = 3.0 (Exact threshold - No override because code uses val > 3.0)', () => {
        const res = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [createLab('hs-CRP', 3.0, 'mg/L')]);
        expect(res.recoveryOverrides.filter((r) => r.reason.includes('inflammation'))).toHaveLength(0);
      });

      it('hs-CRP = 3.1 (Above cutoff - Triggers override)', () => {
        const res = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [createLab('hs-CRP', 3.1, 'mg/L')]);
        expect(res.recoveryOverrides.filter((r) => r.reason.includes('inflammation'))).toHaveLength(1);
      });
    });

    describe('HbA1c (Threshold > 6.5%)', () => {
      it('HbA1c = 6.4% (Below cutoff - No adaptation)', () => {
        const res = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [createLab('HbA1c', 6.4, '%')]);
        expect(res.metabolicAdaptations.filter((m) => m.ruleId === 'METABOLIC_HBA1C_ELEVATED')).toHaveLength(0);
      });

      it('HbA1c = 6.5% (Exact ADA diabetic threshold - No adaptation because code uses val > 6.5)', () => {
        const res = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [createLab('HbA1c', 6.5, '%')]);
        expect(res.metabolicAdaptations.filter((m) => m.ruleId === 'METABOLIC_HBA1C_ELEVATED')).toHaveLength(0);
      });

      it('HbA1c = 6.6% (Above cutoff - Triggers adaptation)', () => {
        const res = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [createLab('HbA1c', 6.6, '%')]);
        expect(res.metabolicAdaptations.filter((m) => m.ruleId === 'METABOLIC_HBA1C_ELEVATED')).toHaveLength(1);
      });
    });

    describe('SPO2 (Threshold < 92%)', () => {
      it('SPO2 = 93% (Above cutoff - Safe)', () => {
        const res = evaluateBiometricDiagnosticCorrelation({ ...defaultTelemetry, spo2: 93 }, []);
        expect(res.safetyAlerts.filter((s) => s.metric.includes('SpO2'))).toHaveLength(0);
      });

      it('SPO2 = 92% (Exact threshold - Safe because code uses spo2 < 92)', () => {
        const res = evaluateBiometricDiagnosticCorrelation({ ...defaultTelemetry, spo2: 92 }, []);
        expect(res.safetyAlerts.filter((s) => s.metric.includes('SpO2'))).toHaveLength(0);
      });

      it('SPO2 = 91% (Below cutoff - Triggers Hypoxia alert)', () => {
        const res = evaluateBiometricDiagnosticCorrelation({ ...defaultTelemetry, spo2: 91 }, []);
        expect(res.safetyAlerts.filter((s) => s.metric.includes('SpO2'))).toHaveLength(1);
      });
    });

    describe('RHR (Threshold > 100 bpm)', () => {
      it('RHR = 99 bpm (Below cutoff - Safe)', () => {
        const res = evaluateBiometricDiagnosticCorrelation({ ...defaultTelemetry, rhr: 99, heartRate: 99 }, []);
        expect(res.safetyAlerts.filter((s) => s.metric.includes('Resting'))).toHaveLength(0);
      });

      it('RHR = 100 bpm (Exact threshold - Safe because code uses rhr > 100)', () => {
        const res = evaluateBiometricDiagnosticCorrelation({ ...defaultTelemetry, rhr: 100, heartRate: 100 }, []);
        expect(res.safetyAlerts.filter((s) => s.metric.includes('Resting'))).toHaveLength(0);
      });

      it('RHR = 101 bpm (Above cutoff - Triggers Tachycardia alert)', () => {
        const res = evaluateBiometricDiagnosticCorrelation({ ...defaultTelemetry, rhr: 101, heartRate: 101 }, []);
        expect(res.safetyAlerts.filter((s) => s.metric.includes('Resting'))).toHaveLength(1);
      });
    });

    describe('Glucose (Threshold > 100 mg/dL)', () => {
      it('Glucose = 100 mg/dL (Exact cutoff - No adaptation)', () => {
        const res = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [createLab('Fasting Glucose', 100, 'mg/dL')]);
        expect(res.metabolicAdaptations.filter((m) => m.ruleId === 'METABOLIC_GLUCOSE_ELEVATED')).toHaveLength(0);
      });

      it('Glucose = 101 mg/dL (Above cutoff - Triggers adaptation)', () => {
        const res = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [createLab('Fasting Glucose', 101, 'mg/dL')]);
        expect(res.metabolicAdaptations.filter((m) => m.ruleId === 'METABOLIC_GLUCOSE_ELEVATED')).toHaveLength(1);
      });
    });

    describe('Ferritin (Threshold < 30 ng/mL)', () => {
      it('Ferritin = 30 ng/mL (Exact cutoff - No override)', () => {
        const res = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [createLab('Ferritin', 30, 'ng/mL')]);
        expect(res.recoveryOverrides.filter((r) => r.reason.includes('iron'))).toHaveLength(0);
      });

      it('Ferritin = 29 ng/mL (Below cutoff - Triggers override)', () => {
        const res = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [createLab('Ferritin', 29, 'ng/mL')]);
        expect(res.recoveryOverrides.filter((r) => r.reason.includes('iron'))).toHaveLength(1);
      });
    });
  });

  describe('3. Robustness & Malformed Data Stress Testing', () => {
    it('FAILURE MODE 1: String type coercion bug on telemetry.rhr in recommendedRhrCeiling calculation', () => {
      // When telemetry.rhr is a string e.g. "40", telemetry.rhr + 20 in JS becomes "4020" instead of 60.
      const stringRhrTelemetry = {
        ...defaultTelemetry,
        rhr: '40' as any,
      };

      const labs = [createLab('Ferritin', 20, 'ng/mL')];
      const result = evaluateBiometricDiagnosticCorrelation(stringRhrTelemetry, labs);

      const override = result.recoveryOverrides[0];
      // Expected logically for rhr=40: Math.min(110, 40 + 20) = 60 bpm.
      // Actual behavior in current code: Math.min(110, "40" + 20) = Math.min(110, "4020") = 110.
      expect(override.recommendedRhrCeiling).toBe(110); // Demonstrating string coercion behavior
    });

    it('FAILURE MODE 2: Non-string markerName causes uncaught TypeError exception', () => {
      const malformedLab = {
        id: 'lab_invalid',
        userId: 'user_123',
        docId: 'doc_1',
        date: '2026-08-01',
        markerName: 12345 as any, // non-string
        value: 8.0,
        unit: '%',
        status: LabStatus.NORMAL,
      };

      expect(() => {
        evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [malformedLab]);
      }).toThrow(TypeError);
    });

    it('FAILURE MODE 3: Single compound lab marker name matching skipped by if-else chain', () => {
      // A lab marker named "hs-CRP and Ferritin Panel" matches 'ferritin' after checking 'hba1c' and 'glucose',
      // but because of `else if`, it processes 'ferritin' and SKIPS 'hs-CRP'!
      const compoundLab = createLab('hs-CRP and Ferritin Panel', 10, 'mg/L');
      const result = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, [compoundLab]);

      // Only ferritin is checked, hs-CRP is skipped because it's an else-if chain!
      expect(result.recoveryOverrides).toHaveLength(1);
      expect(result.recoveryOverrides[0].reason).toContain('Low iron storage');
    });

    it('FAILURE MODE 4: Multiple lab results produce duplicate overrides and summary lines', () => {
      const duplicateLabs = [
        createLab('Ferritin', 15, 'ng/mL'),
        createLab('Serum Ferritin', 18, 'ng/mL'),
        createLab('Ferritin Level', 22, 'ng/mL'),
      ];

      const result = evaluateBiometricDiagnosticCorrelation(defaultTelemetry, duplicateLabs);

      // Produces 3 identical active overrides in recoveryOverrides
      expect(result.recoveryOverrides).toHaveLength(3);
    });
  });
});
