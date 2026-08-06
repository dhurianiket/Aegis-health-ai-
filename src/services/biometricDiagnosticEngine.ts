/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WearableBiometrics } from '../types/wearables';
import { LabResult, MedicalDocument } from '../types/medical';

export interface MetabolicAdaptation {
  ruleId: string;
  condition: string;
  action: string;
  targetZone: string;
  postMealWalkNudge: boolean;
  evidence: string;
}

export interface RecoveryOverride {
  active: boolean;
  reason: string;
  strainReductionPercent: number;
  recommendedRhrCeiling: number;
  evidence: string;
}

export interface ActivityFilter {
  restrictedActivities: string[];
  recommendedActivities: string[];
  anatomicalTarget: string;
  evidence: string;
}

export interface SafetyTriageAlert {
  severity: 'urgent' | 'warning' | 'info';
  metric: string;
  message: string;
  source: string;
  timestamp: string;
}

export interface BiometricDiagnosticCorrelation {
  metabolicAdaptations: MetabolicAdaptation[];
  recoveryOverrides: RecoveryOverride[];
  activityFilters: ActivityFilter[];
  safetyAlerts: SafetyTriageAlert[];
  readinessScore: number;
  summaryMarkdown: string;
}

/**
 * Normalizes imaging findings input (strings or MedicalDocument instances) into an array of search strings.
 */
function normalizeImagingTexts(imagingFindings?: string[] | MedicalDocument[]): string[] {
  if (!imagingFindings || imagingFindings.length === 0) {
    return [];
  }
  const texts: string[] = [];
  for (const item of imagingFindings) {
    if (typeof item === 'string') {
      texts.push(item);
    } else if (item && typeof item === 'object') {
      const doc = item as MedicalDocument;
      if (typeof doc.extractedData === 'string') {
        texts.push(doc.extractedData);
      } else if (doc.extractedData && typeof doc.extractedData === 'object') {
        const data = doc.extractedData as Record<string, unknown>;
        if (data.findings) texts.push(String(data.findings));
        if (data.summary) texts.push(String(data.summary));
        if (data.text) texts.push(String(data.text));
        if (data.impression) texts.push(String(data.impression));
        try {
          texts.push(JSON.stringify(data));
        } catch {
          // ignore circular json errors if any
        }
      }
      if (doc.fileName) texts.push(doc.fileName);
      if (doc.tags && Array.isArray(doc.tags)) texts.push(doc.tags.join(' '));
    }
  }
  return texts;
}

/**
 * Computes the composite readiness score (0-100) taking sleep score, HRV vs 50ms baseline,
 * RHR vs 65bpm baseline, hs-CRP/Ferritin strain penalties, and hypoxia/tachycardia penalties.
 */
function calculateCompositeReadinessScore(
  telemetry: WearableBiometrics,
  hasInflammatoryStrain: boolean,
  hasLowFerritin: boolean,
  hasHypoxia: boolean,
  hasTachycardia: boolean
): number {
  // 1. Sleep score component (max 35 pts)
  const sleepScore = telemetry?.sleep?.sleepScore ?? 80;
  const sleepContribution = (Math.max(0, Math.min(100, sleepScore)) / 100) * 35;

  // 2. HRV component vs 50ms baseline (max 35 pts)
  const hrv = telemetry?.hrv ?? 50;
  const hrvContribution = Math.min(35, (Math.max(0, hrv) / 50) * 35);

  // 3. RHR component vs 65bpm baseline (max 30 pts)
  const rhr = telemetry?.rhr ?? telemetry?.heartRate ?? 65;
  const rhrDelta = Math.max(0, rhr - 65);
  const rhrContribution = Math.max(0, 30 - rhrDelta * 1.5);

  let score = sleepContribution + hrvContribution + rhrContribution;

  // 4. Clinical Strain Penalties
  if (hasInflammatoryStrain) score -= 15;
  if (hasLowFerritin) score -= 15;

  // 5. Urgent Safety Penalties
  if (hasHypoxia) score -= 25;
  if (hasTachycardia) score -= 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Evaluates wearable biometric telemetry alongside lab results and diagnostic imaging findings
 * to produce cross-correlated metabolic adaptations, recovery overrides, activity filters,
 * safety triage alerts, a dynamic readiness score, and summary markdown.
 */
export function evaluateBiometricDiagnosticCorrelation(
  telemetry: WearableBiometrics,
  labResults: LabResult[] = [],
  imagingFindings?: string[] | MedicalDocument[]
): BiometricDiagnosticCorrelation {
  const metabolicAdaptations: MetabolicAdaptation[] = [];
  const recoveryOverrides: RecoveryOverride[] = [];
  const activityFilters: ActivityFilter[] = [];
  const safetyAlerts: SafetyTriageAlert[] = [];

  let hasInflammatoryStrain = false;
  let hasLowFerritin = false;

  // --------------------------------------------------------------------------
  // 1. Bloodwork + Exercise Adaptations & Recovery Overrides
  // --------------------------------------------------------------------------
  if (Array.isArray(labResults)) {
    for (const lab of labResults) {
      if (!lab || !lab.markerName) continue;
      const markerLower = lab.markerName.toLowerCase().trim();
      const val = lab.value ?? lab.numeric_value;
      if (val === undefined || val === null || isNaN(val)) continue;

      // Helper for formatting unit string nicely
      const unitStr = lab.unit
        ? (lab.unit.trim().startsWith('%') ? '%' : ` ${lab.unit.trim()}`)
        : '';

      // HbA1c / Glucose Rule: HbA1c > 6.5% OR Glucose > 100 mg/dL (or Fasting Glucose > 100)
      if (markerLower.includes('hba1c') || markerLower.includes('a1c')) {
        if (val > 6.5) {
          metabolicAdaptations.push({
            ruleId: 'METABOLIC_HBA1C_ELEVATED',
            condition: `HbA1c elevated (${val}%)`,
            action: 'Incorporate post-meal 15-min walk nudges and recommend Zone 2 aerobic cardio (60-70% max HR).',
            targetZone: 'Zone 2 (60-70% max HR)',
            postMealWalkNudge: true,
            evidence: `[Source: Lab Report] ${lab.markerName}: ${val}${unitStr || '%'} (threshold > 6.5%)`,
          });
        }
      } else if (markerLower.includes('glucose') || markerLower.includes('fbs')) {
        if (val > 100) {
          metabolicAdaptations.push({
            ruleId: 'METABOLIC_GLUCOSE_ELEVATED',
            condition: `Glucose elevated (${val} mg/dL)`,
            action: 'Incorporate post-meal 15-min walk nudges and recommend Zone 2 aerobic cardio (60-70% max HR).',
            targetZone: 'Zone 2 (60-70% max HR)',
            postMealWalkNudge: true,
            evidence: `[Source: Lab Report] ${lab.markerName}: ${val}${unitStr || ' mg/dL'} (threshold > 100 mg/dL)`,
          });
        }
      }

      // Inflammatory / Iron Rule: Ferritin < 30 ng/mL OR hs-CRP > 3.0 mg/L (or CRP > 3.0)
      if (markerLower.includes('ferritin')) {
        if (val < 30) {
          hasLowFerritin = true;
          recoveryOverrides.push({
            active: true,
            reason: `Low iron storage detected (${lab.markerName}: ${val}${unitStr || ' ng/mL'})`,
            strainReductionPercent: 40,
            recommendedRhrCeiling: telemetry?.rhr ? Math.min(110, telemetry.rhr + 20) : 110,
            evidence: `[Source: Lab Report] ${lab.markerName}: ${val}${unitStr || ' ng/mL'} (threshold < 30 ng/mL)`,
          });
        }
      } else if (markerLower.includes('crp') || markerLower.includes('c-reactive')) {
        if (val > 3.0) {
          hasInflammatoryStrain = true;
          recoveryOverrides.push({
            active: true,
            reason: `Elevated systemic inflammation detected (${lab.markerName}: ${val}${unitStr || ' mg/L'})`,
            strainReductionPercent: 40,
            recommendedRhrCeiling: telemetry?.rhr ? Math.min(110, telemetry.rhr + 20) : 110,
            evidence: `[Source: Lab Report] ${lab.markerName}: ${val}${unitStr || ' mg/L'} (threshold > 3.0 mg/L)`,
          });
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. Imaging + Activity Filtering
  // --------------------------------------------------------------------------
  const imagingTexts = normalizeImagingTexts(imagingFindings);
  const combinedImagingText = imagingTexts.join(' ').toLowerCase();

  // Spine / Disc Rule: "herniated disc", "disc herniation", "spinal stenosis", "L4-L5", "L5-S1", "spondylolisthesis"
  const spineTerms = ['herniated disc', 'disc herniation', 'spinal stenosis', 'l4-l5', 'l5-s1', 'spondylolisthesis'];
  const matchedSpineTerm = spineTerms.find((term) => combinedImagingText.includes(term));

  if (matchedSpineTerm) {
    activityFilters.push({
      restrictedActivities: ['high-impact plyometrics', 'running', 'heavy squatting'],
      recommendedActivities: ['low-impact swimming', 'cycling', 'elliptical'],
      anatomicalTarget: 'Lumbar Spine / Intervertebral Discs',
      evidence: `[Source: Imaging Finding] Imaging indicates spinal pathomorphology ("${matchedSpineTerm}")`,
    });
  }

  // Joint / Cartilage Rule: "cartilage degeneration", "osteoarthritis", "joint space narrowing", "meniscal tear", "patellofemoral"
  const jointTerms = ['cartilage degeneration', 'osteoarthritis', 'joint space narrowing', 'meniscal tear', 'patellofemoral'];
  const matchedJointTerm = jointTerms.find((term) => combinedImagingText.includes(term));

  if (matchedJointTerm) {
    activityFilters.push({
      restrictedActivities: ['high-impact running', 'jumping'],
      recommendedActivities: ['swimming', 'water aerobics', 'recumbent bike'],
      anatomicalTarget: 'Articular Joint Cartilage / Lower Extremity Joints',
      evidence: `[Source: Imaging Finding] Imaging indicates joint degeneration criteria ("${matchedJointTerm}")`,
    });
  }

  // --------------------------------------------------------------------------
  // 3. Clinical Triage Safety Alerts
  // --------------------------------------------------------------------------
  const rhrVal = telemetry?.rhr ?? telemetry?.heartRate ?? 0;
  const hasTachycardia = rhrVal > 100;
  const timestamp = telemetry?.timestamp || new Date().toISOString();

  if (hasTachycardia) {
    safetyAlerts.push({
      severity: 'urgent',
      metric: 'Resting Heart Rate',
      message: `Resting heart rate of ${rhrVal} bpm exceeds safe physiological threshold (> 100 bpm). Rest immediately and seek medical evaluation.`,
      source: '[Source: Wearable HR/Steps]',
      timestamp,
    });
  }

  const spo2Val = telemetry?.spo2 ?? 0;
  const hasHypoxia = spo2Val > 0 && spo2Val < 92;

  if (hasHypoxia) {
    safetyAlerts.push({
      severity: 'urgent',
      metric: 'Blood Oxygenation (SpO2)',
      message: `Blood oxygenation level of ${spo2Val}% is below sub-normal threshold (< 92%). Instructing rest and medical follow-up.`,
      source: '[Source: Wearable HR/Steps]',
      timestamp,
    });
  }

  // --------------------------------------------------------------------------
  // 4. Dynamic Readiness Score Calculation
  // --------------------------------------------------------------------------
  const readinessScore = calculateCompositeReadinessScore(
    telemetry,
    hasInflammatoryStrain,
    hasLowFerritin,
    hasHypoxia,
    hasTachycardia
  );

  // --------------------------------------------------------------------------
  // 5. Formatted Summary Markdown
  // --------------------------------------------------------------------------
  const summaryMarkdownLines: string[] = [
    `# Biometric-Diagnostic Cross-Correlation Summary`,
    ``,
    `### Dynamic Readiness Score: **${readinessScore}/100**`,
    ``,
    `---`,
    ``,
    `### ⌚ Wearable Biometrics \`[Source: Wearable HR/Steps]\``,
    `- **Heart Rate**: ${telemetry?.heartRate ?? 'N/A'} bpm | **Resting HR**: ${telemetry?.rhr ?? 'N/A'} bpm`,
    `- **HRV**: ${telemetry?.hrv ?? 'N/A'} ms | **SpO2**: ${telemetry?.spo2 ?? 'N/A'}%`,
    `- **Sleep Score**: ${telemetry?.sleep?.sleepScore ?? 'N/A'}/100`,
    ``,
    `---`,
    ``,
    `### 🧪 Metabolic Adaptations \`[Source: Lab Report]\``,
    metabolicAdaptations.length > 0
      ? metabolicAdaptations.map((m) => `- **${m.condition}**: ${m.action} (Target: ${m.targetZone}) ${m.evidence}`).join('\n')
      : '_No metabolic adaptations required based on current lab results._',
    ``,
    `---`,
    ``,
    `### 🛡️ Recovery Overrides \`[Source: Lab Report]\``,
    recoveryOverrides.length > 0
      ? recoveryOverrides.map((r) => `- **Active Override**: ${r.reason}. Reduce workout strain by ${r.strainReductionPercent}%. Recommended RHR Ceiling: ${r.recommendedRhrCeiling} bpm. ${r.evidence}`).join('\n')
      : '_No active recovery overrides._',
    ``,
    `---`,
    ``,
    `### 🏋️ Activity Filters & Restrictions \`[Source: Imaging Finding]\``,
    activityFilters.length > 0
      ? activityFilters.map((a) => `- **Target (${a.anatomicalTarget})**: Restricted: ${a.restrictedActivities.join(', ')} | Recommended: ${a.recommendedActivities.join(', ')}. ${a.evidence}`).join('\n')
      : '_No imaging-based activity restrictions._',
    ``,
    `---`,
    ``,
    `### 🚨 Safety & Triage Alerts \`[Source: Wearable HR/Steps]\``,
    safetyAlerts.length > 0
      ? safetyAlerts.map((s) => `- **[${s.severity.toUpperCase()}] ${s.metric}**: ${s.message} ${s.source}`).join('\n')
      : '_No urgent safety alerts detected._',
  ];

  const summaryMarkdown = summaryMarkdownLines.join('\n');

  return {
    metabolicAdaptations,
    recoveryOverrides,
    activityFilters,
    safetyAlerts,
    readinessScore,
    summaryMarkdown,
  };
}
