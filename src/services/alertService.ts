import { LabResult, Medication } from '../types/medical';
import { HealthAlert, AlertThreshold } from '../types/alerts';
import { checkMedicationInteractions } from './medicationCheckService';

const DEFAULT_THRESHOLDS: Record<string, AlertThreshold> = {
  'HbA1c': { biomarker: 'HbA1c', minNormal: 4.0, maxNormal: 5.6, criticalMax: 7.0 },
  'Glucose': { biomarker: 'Glucose', minNormal: 70, maxNormal: 99, criticalMin: 54, criticalMax: 180 },
  'Creatinine': { biomarker: 'Creatinine', minNormal: 0.74, maxNormal: 1.35, criticalMax: 2.0 },
  'LDL': { biomarker: 'LDL', maxNormal: 99, criticalMax: 160 },
  'HDL': { biomarker: 'HDL', minNormal: 40, criticalMin: 30 },
  'ALT': { biomarker: 'ALT', minNormal: 7, maxNormal: 55, criticalMax: 100 },
};

export const checkLabResultForAlerts = (result: LabResult): HealthAlert | null => {
  const threshold = DEFAULT_THRESHOLDS[result.markerName];
  if (!threshold) return null;

  const value = result.value;
  let severity: HealthAlert['severity'] = 'normal';
  let title = '';
  let description = '';

  if (threshold.criticalMax !== undefined && value >= threshold.criticalMax) {
    severity = 'critical';
    title = `Critical High ${result.markerName}`;
    description = `Your ${result.markerName} value is ${value} ${result.unit}, which is critically high (Normal: <${threshold.maxNormal}). Please consult a doctor immediately.`;
  } else if (threshold.criticalMin !== undefined && value <= threshold.criticalMin) {
    severity = 'critical';
    title = `Critical Low ${result.markerName}`;
    description = `Your ${result.markerName} value is ${value} ${result.unit}, which is critically low (Normal: >${threshold.minNormal}). Please consult a doctor immediately.`;
  } else if (threshold.maxNormal !== undefined && value > threshold.maxNormal) {
    severity = 'high';
    title = `Elevated ${result.markerName}`;
    description = `Your ${result.markerName} is elevated at ${value} ${result.unit} (Normal range upper limit: ${threshold.maxNormal}). Monitor this closely.`;
  } else if (threshold.minNormal !== undefined && value < threshold.minNormal) {
    severity = 'high';
    title = `Low ${result.markerName}`;
    description = `Your ${result.markerName} is low at ${value} ${result.unit} (Normal range lower limit: ${threshold.minNormal}). Monitor this closely.`;
  }

  if (severity !== 'normal') {
    return {
      id: crypto.randomUUID(),
      severity,
      type: 'lab_value',
      title,
      description,
      createdAt: new Date().toISOString(),
      read: false,
    };
  }
  return null;
};

export const getConsolidatedAlerts = (labs: LabResult[], meds: Medication[]): HealthAlert[] => {
  const alerts: HealthAlert[] = [];
  
  // 1. Lab alerts
  labs.forEach(lab => {
    // Only check the most recent labs? We'll assume the list is already filtered or we just check all and maybe user dismissed them
    const alert = checkLabResultForAlerts(lab);
    if (alert) {
      alerts.push(alert);
    }
  });

  // 2. Medication interactions
  const medAlerts = checkMedicationInteractions(meds);
  alerts.push(...medAlerts);

  // Sort by severity (critical > high > moderate > normal) and date
  const severityScore = { critical: 4, high: 3, moderate: 2, normal: 1 };
  
  return alerts.sort((a, b) => {
    if (severityScore[a.severity] !== severityScore[b.severity]) {
      return severityScore[b.severity] - severityScore[a.severity];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

