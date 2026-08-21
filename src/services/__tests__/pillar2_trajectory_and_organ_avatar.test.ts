import { describe, it, expect } from 'vitest';
import { computeBiomarkerTrajectory } from '../biomarkerTrajectoryService';
import { calculateOrganSystemScores } from '../organHealthService';

describe('Pillar 2: 30-60-90 Day Risk Trajectory Engine', () => {
  it('should compute linear & EMA trend slopes and project values for +30d, +60d, +90d', () => {
    const mockTrajectoryInput = {
      testName: 'HbA1c',
      unit: '%',
      referenceLow: 4.0,
      referenceHigh: 5.7,
      history: [
        { date: '2026-01-01', value: 5.2 },
        { date: '2026-04-01', value: 5.7 },
        { date: '2026-07-01', value: 6.2 },
      ],
    };

    const trajectory = computeBiomarkerTrajectory(mockTrajectoryInput);
    expect(trajectory).toBeDefined();
    expect(trajectory.currentValue).toBe(6.2);
    expect(trajectory.slopePerDay).toBeGreaterThan(0);
    expect(trajectory.forecasts.d30.projectedValue).toBeGreaterThan(6.2);
    expect(trajectory.forecasts.d60.projectedValue).toBeGreaterThan(trajectory.forecasts.d30.projectedValue);
    expect(trajectory.forecasts.d90.projectedValue).toBeGreaterThan(trajectory.forecasts.d60.projectedValue);
    expect(trajectory.overallRisk).toBe('borderline');
    expect(trajectory.mitigationActions.length).toBeGreaterThan(0);
  });

  it('should return stable trajectory for flat historical biomarker values', () => {
    const mockFlatInput = {
      testName: 'Creatinine',
      unit: 'mg/dL',
      referenceLow: 0.6,
      referenceHigh: 1.2,
      history: [
        { date: '2026-01-01', value: 0.9 },
        { date: '2026-04-01', value: 0.9 },
        { date: '2026-07-01', value: 0.9 },
      ],
    };

    const trajectory = computeBiomarkerTrajectory(mockFlatInput);
    expect(trajectory.direction).toBe('stable');
    expect(trajectory.overallRisk).toBe('optimal');
  });
});

describe('Pillar 2: Interactive 3D Organ System Health Avatar', () => {
  it('should evaluate organ system health scores across 6 core physiological systems', () => {
    const mockObservations = [
      { name: 'LDL Cholesterol', value: 145, unit: 'mg/dL', status: 'abnormal', referenceHigh: 100 },
      { name: 'HbA1c', value: 6.8, unit: '%', status: 'critical', referenceHigh: 5.7 },
      { name: 'eGFR', value: 95, unit: 'mL/min', status: 'normal', referenceLow: 60 },
      { name: 'ALT SGPT', value: 22, unit: 'U/L', status: 'normal', referenceHigh: 40 },
      { name: 'Hemoglobin', value: 14.5, unit: 'g/dL', status: 'normal', referenceLow: 12.0 },
    ];

    const overview = calculateOrganSystemScores(mockObservations);
    expect(overview).toBeDefined();

    const { organSystems } = overview;
    expect(organSystems.cardiovascular).toBeDefined();
    expect(organSystems.pulmonary).toBeDefined();
    expect(organSystems.metabolic).toBeDefined();
    expect(organSystems.renal).toBeDefined();
    expect(organSystems.hepatic).toBeDefined();
    expect(organSystems.hematology).toBeDefined();

    expect(organSystems.metabolic.status).toBe('warning');
    expect(organSystems.cardiovascular.status).toBe('warning');
    expect(organSystems.renal.status).toBe('optimal');
    expect(overview.overallScore).toBeLessThan(100);
  });
});
