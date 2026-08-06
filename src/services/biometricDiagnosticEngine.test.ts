import { describe, it, expect } from 'vitest';
import {
  evaluateBiometricDiagnosticCorrelation,
  MetabolicAdaptation,
  RecoveryOverride,
  ActivityFilter,
  SafetyTriageAlert,
  BiometricDiagnosticCorrelation,
} from './biometricDiagnosticEngine';
import { WearableBiometrics } from '../types/wearables';
import { LabResult, LabStatus, MedicalDocument } from '../types/medical';

describe('Biometric-Diagnostic Cross-Correlation Matrix Engine', () => {
  const baseTelemetry: WearableBiometrics = {
    id: 'wearable_001',
    userId: 'user_123',
    timestamp: '2026-08-06T10:00:00Z',
    heartRate: 72,
    rhr: 62,
    hrv: 55,
    spo2: 98,
    steps: 8500,
    sleep: {
      totalMinutes: 480,
      deepMinutes: 90,
      remMinutes: 110,
      lightMinutes: 280,
      sleepScore: 85,
    },
    connectionStatus: 'connected',
  };

  const createMockLab = (markerName: string, value: number, unit: string = ''): LabResult => ({
    id: `lab_${markerName.toLowerCase().replace(/\s+/g, '_')}`,
    userId: 'user_123',
    docId: 'doc_lab_01',
    date: '2026-08-01',
    markerName,
    value,
    unit,
    status: LabStatus.NORMAL,
  });

  describe('Bloodwork + Exercise Adaptations (Metabolic Adaptations)', () => {
    it('should generate metabolic adaptations for elevated HbA1c (> 6.5%)', () => {
      const labs = [createMockLab('HbA1c', 6.8, '%')];
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs);

      expect(result.metabolicAdaptations).toHaveLength(1);
      const adaptation = result.metabolicAdaptations[0];
      expect(adaptation.ruleId).toBe('METABOLIC_HBA1C_ELEVATED');
      expect(adaptation.postMealWalkNudge).toBe(true);
      expect(adaptation.targetZone).toContain('Zone 2');
      expect(adaptation.evidence).toContain('[Source: Lab Report]');
      expect(adaptation.evidence).toContain('HbA1c: 6.8%');
    });

    it('should generate metabolic adaptations for elevated Glucose (> 100 mg/dL)', () => {
      const labs = [createMockLab('Fasting Glucose', 115, 'mg/dL')];
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs);

      expect(result.metabolicAdaptations).toHaveLength(1);
      const adaptation = result.metabolicAdaptations[0];
      expect(adaptation.ruleId).toBe('METABOLIC_GLUCOSE_ELEVATED');
      expect(adaptation.postMealWalkNudge).toBe(true);
      expect(adaptation.targetZone).toContain('Zone 2');
      expect(adaptation.evidence).toContain('[Source: Lab Report]');
      expect(adaptation.evidence).toContain('Fasting Glucose: 115 mg/dL');
    });

    it('should generate multiple metabolic adaptations if both HbA1c and Glucose are elevated', () => {
      const labs = [
        createMockLab('HbA1c', 7.2, '%'),
        createMockLab('Glucose', 130, 'mg/dL'),
      ];
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs);

      expect(result.metabolicAdaptations).toHaveLength(2);
      expect(result.metabolicAdaptations.map((a) => a.ruleId)).toEqual([
        'METABOLIC_HBA1C_ELEVATED',
        'METABOLIC_GLUCOSE_ELEVATED',
      ]);
    });
  });

  describe('Inflammatory / Iron Rule (Recovery Overrides)', () => {
    it('should trigger recovery override for low Ferritin (< 30 ng/mL)', () => {
      const labs = [createMockLab('Ferritin', 22, 'ng/mL')];
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs);

      expect(result.recoveryOverrides).toHaveLength(1);
      const override = result.recoveryOverrides[0];
      expect(override.active).toBe(true);
      expect(override.strainReductionPercent).toBeGreaterThanOrEqual(30);
      expect(override.strainReductionPercent).toBeLessThanOrEqual(50);
      expect(override.recommendedRhrCeiling).toBeLessThanOrEqual(110);
      expect(override.evidence).toContain('[Source: Lab Report]');
      expect(override.evidence).toContain('Ferritin: 22 ng/mL');
    });

    it('should trigger recovery override for high hs-CRP (> 3.0 mg/L)', () => {
      const labs = [createMockLab('hs-CRP', 4.5, 'mg/L')];
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs);

      expect(result.recoveryOverrides).toHaveLength(1);
      const override = result.recoveryOverrides[0];
      expect(override.active).toBe(true);
      expect(override.reason).toContain('Elevated systemic inflammation');
      expect(override.evidence).toContain('hs-CRP: 4.5 mg/L');
    });
  });

  describe('Imaging + Activity Filtering', () => {
    it('should apply spine activity filter for MRI findings with disc herniation / L4-L5', () => {
      const imaging = ['Lumbar MRI report indicates L4-L5 disc herniation and spinal stenosis'];
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, [], imaging);

      expect(result.activityFilters).toHaveLength(1);
      const filter = result.activityFilters[0];
      expect(filter.anatomicalTarget).toContain('Spine');
      expect(filter.restrictedActivities).toContain('running');
      expect(filter.restrictedActivities).toContain('heavy squatting');
      expect(filter.recommendedActivities).toContain('low-impact swimming');
      expect(filter.evidence).toContain('[Source: Imaging Finding]');
    });

    it('should apply joint activity filter for X-ray findings with osteoarthritis / cartilage degeneration', () => {
      const imaging = ['Knee X-ray reveals severe osteoarthritis and joint space narrowing'];
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, [], imaging);

      expect(result.activityFilters).toHaveLength(1);
      const filter = result.activityFilters[0];
      expect(filter.anatomicalTarget).toContain('Joint');
      expect(filter.restrictedActivities).toContain('high-impact running');
      expect(filter.recommendedActivities).toContain('swimming');
      expect(filter.evidence).toContain('[Source: Imaging Finding]');
    });

    it('should support MedicalDocument array as imaging findings input', () => {
      const doc: MedicalDocument = {
        id: 'doc_img_01',
        userId: 'user_123',
        type: 'imaging_report',
        date: '2026-08-01',
        fileName: 'lumbar_mri.pdf',
        isProcessed: true,
        createdAt: '2026-08-01',
        extractedData: {
          findings: 'L5-S1 herniated disc with mild spondylolisthesis',
        },
      };
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, [], [doc]);

      expect(result.activityFilters).toHaveLength(1);
      expect(result.activityFilters[0].evidence).toContain('[Source: Imaging Finding]');
    });

    it('should apply both spine and joint filters if imaging findings contain both criteria', () => {
      const imaging = [
        'Lumbar MRI shows L4-L5 disc herniation',
        'Knee X-ray shows bilateral osteoarthritis',
      ];
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, [], imaging);

      expect(result.activityFilters).toHaveLength(2);
    });
  });

  describe('Clinical Triage Safety Alerts', () => {
    it('should trigger urgent triage alert for Tachycardia (RHR > 100 bpm)', () => {
      const tachyTelemetry: WearableBiometrics = {
        ...baseTelemetry,
        rhr: 108,
        heartRate: 110,
      };
      const result = evaluateBiometricDiagnosticCorrelation(tachyTelemetry, []);

      expect(result.safetyAlerts).toHaveLength(1);
      const alert = result.safetyAlerts[0];
      expect(alert.severity).toBe('urgent');
      expect(alert.metric).toBe('Resting Heart Rate');
      expect(alert.message).toContain('exceeds safe physiological threshold');
      expect(alert.source).toBe('[Source: Wearable HR/Steps]');
    });

    it('should trigger urgent triage alert for Hypoxia (SPO2 < 92%)', () => {
      const hypoxiaTelemetry: WearableBiometrics = {
        ...baseTelemetry,
        spo2: 89,
      };
      const result = evaluateBiometricDiagnosticCorrelation(hypoxiaTelemetry, []);

      expect(result.safetyAlerts).toHaveLength(1);
      const alert = result.safetyAlerts[0];
      expect(alert.severity).toBe('urgent');
      expect(alert.metric).toBe('Blood Oxygenation (SpO2)');
      expect(alert.message).toContain('below sub-normal threshold');
      expect(alert.source).toBe('[Source: Wearable HR/Steps]');
    });

    it('should trigger both Tachycardia and Hypoxia alerts simultaneously if both conditions are met', () => {
      const criticalTelemetry: WearableBiometrics = {
        ...baseTelemetry,
        rhr: 112,
        spo2: 88,
      };
      const result = evaluateBiometricDiagnosticCorrelation(criticalTelemetry, []);

      expect(result.safetyAlerts).toHaveLength(2);
      expect(result.safetyAlerts.map((s) => s.metric)).toEqual([
        'Resting Heart Rate',
        'Blood Oxygenation (SpO2)',
      ]);
    });
  });

  describe('Dynamic Readiness Score Calculation', () => {
    it('should calculate high readiness score (> 85) for healthy biometrics and normal labs', () => {
      const healthyLabs = [
        createMockLab('HbA1c', 5.4, '%'),
        createMockLab('Ferritin', 80, 'ng/mL'),
        createMockLab('hs-CRP', 0.8, 'mg/L'),
      ];
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, healthyLabs);

      expect(result.readinessScore).toBeGreaterThanOrEqual(85);
      expect(result.readinessScore).toBeLessThanOrEqual(100);
    });

    it('should penalize readiness score heavily for clinical strain and hypoxia', () => {
      const strainedTelemetry: WearableBiometrics = {
        ...baseTelemetry,
        rhr: 82,
        hrv: 25,
        spo2: 90,
        sleep: {
          totalMinutes: 300,
          deepMinutes: 30,
          remMinutes: 40,
          lightMinutes: 230,
          sleepScore: 50,
        },
      };
      const strainedLabs = [
        createMockLab('Ferritin', 18, 'ng/mL'),
        createMockLab('hs-CRP', 5.2, 'mg/L'),
      ];
      const result = evaluateBiometricDiagnosticCorrelation(strainedTelemetry, strainedLabs);

      expect(result.readinessScore).toBeLessThan(40);
    });
  });

  describe('Boundary Values & Edge Cases', () => {
    it('should handle boundary values for hs-CRP (3.0 vs 3.1)', () => {
      const labs30 = [createMockLab('hs-CRP', 3.0, 'mg/L')];
      const result30 = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs30);
      expect(result30.recoveryOverrides).toHaveLength(0);

      const labs31 = [createMockLab('hs-CRP', 3.1, 'mg/L')];
      const result31 = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs31);
      expect(result31.recoveryOverrides).toHaveLength(1);
    });

    it('should handle boundary values for HbA1c (6.5 vs 6.6)', () => {
      const labs65 = [createMockLab('HbA1c', 6.5, '%')];
      const result65 = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs65);
      expect(result65.metabolicAdaptations).toHaveLength(0);

      const labs66 = [createMockLab('HbA1c', 6.6, '%')];
      const result66 = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs66);
      expect(result66.metabolicAdaptations).toHaveLength(1);
    });

    it('should handle boundary values for Fasting Glucose (100 vs 101)', () => {
      const labs100 = [createMockLab('Glucose', 100, 'mg/dL')];
      const result100 = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs100);
      expect(result100.metabolicAdaptations).toHaveLength(0);

      const labs101 = [createMockLab('Glucose', 101, 'mg/dL')];
      const result101 = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs101);
      expect(result101.metabolicAdaptations).toHaveLength(1);
    });

    it('should handle boundary values for SPO2 (92 vs 91)', () => {
      const tele92 = { ...baseTelemetry, spo2: 92 };
      const res92 = evaluateBiometricDiagnosticCorrelation(tele92, []);
      expect(res92.safetyAlerts.filter((s) => s.metric.includes('SpO2'))).toHaveLength(0);

      const tele91 = { ...baseTelemetry, spo2: 91 };
      const res91 = evaluateBiometricDiagnosticCorrelation(tele91, []);
      expect(res91.safetyAlerts.filter((s) => s.metric.includes('SpO2'))).toHaveLength(1);
    });

    it('should handle boundary values for RHR (100 vs 101)', () => {
      const tele100 = { ...baseTelemetry, rhr: 100, heartRate: 100 };
      const res100 = evaluateBiometricDiagnosticCorrelation(tele100, []);
      expect(res100.safetyAlerts.filter((s) => s.metric.includes('Resting'))).toHaveLength(0);

      const tele101 = { ...baseTelemetry, rhr: 101, heartRate: 101 };
      const res101 = evaluateBiometricDiagnosticCorrelation(tele101, []);
      expect(res101.safetyAlerts.filter((s) => s.metric.includes('Resting'))).toHaveLength(1);
    });

    it('should handle empty lab results array gracefully', () => {
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, []);
      expect(result.metabolicAdaptations).toHaveLength(0);
      expect(result.recoveryOverrides).toHaveLength(0);
      expect(result.safetyAlerts).toHaveLength(0);
      expect(result.readinessScore).toBeGreaterThan(0);
    });

    it('should handle empty or undefined imaging findings gracefully', () => {
      const resUndef = evaluateBiometricDiagnosticCorrelation(baseTelemetry, [], undefined);
      expect(resUndef.activityFilters).toHaveLength(0);

      const resEmpty = evaluateBiometricDiagnosticCorrelation(baseTelemetry, [], []);
      expect(resEmpty.activityFilters).toHaveLength(0);
    });
  });

  describe('Formatted Summary Markdown', () => {
    it('should contain explicit source tags in summaryMarkdown', () => {
      const labs = [createMockLab('HbA1c', 6.9, '%')];
      const imaging = ['Lumbar MRI: L4-L5 herniated disc'];
      const result = evaluateBiometricDiagnosticCorrelation(baseTelemetry, labs, imaging);

      expect(result.summaryMarkdown).toContain('[Source: Wearable HR/Steps]');
      expect(result.summaryMarkdown).toContain('[Source: Lab Report]');
      expect(result.summaryMarkdown).toContain('[Source: Imaging Finding]');
      expect(result.summaryMarkdown).toContain('Dynamic Readiness Score');
    });
  });
});
