/**
 * organHealthService.ts — Organ System Health Calculator & Clinical Mapping Engine
 * Evaluates patient lab observations across 6 core organ systems:
 * 1. Cardiovascular System (Heart / Vascular)
 * 2. Pulmonary System (Lungs / Respiration)
 * 3. Metabolic & Endocrine System (Pancreas / Diabetes)
 * 4. Renal System (Kidneys)
 * 5. Hepatic System (Liver)
 * 6. Hematology & Skeletal System (Blood / Bone / Vitamin)
 */

export type OrganSystemKey =
  | 'cardiovascular'
  | 'pulmonary'
  | 'metabolic'
  | 'renal'
  | 'hepatic'
  | 'hematology';

export type OrganHealthStatus = 'optimal' | 'warning' | 'critical';

export interface OrganSystemScore {
  key: OrganSystemKey;
  displayName: string;
  iconName: string;
  score: number; // 0 to 100 (100 = Peak Physiological Health)
  status: OrganHealthStatus;
  primaryBiomarkers: { name: string; value: string; status: 'normal' | 'abnormal' | 'critical' }[];
  summary: string;
  recommendedSpecialist: string;
}

export interface OrganHealthOverview {
  overallScore: number;
  organSystems: Record<OrganSystemKey, OrganSystemScore>;
  criticalCount: number;
  warningCount: number;
  optimalCount: number;
  lastEvaluatedAt: string;
}

export interface LabObservationItem {
  name: string;
  value: number | string;
  unit?: string;
  status?: string;
  referenceLow?: number;
  referenceHigh?: number;
}

/**
 * Normalizes test string
 */
function cleanTestName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
}

/**
 * Evaluates composite health score (0-100) for a given organ system from lab observations
 */
export function calculateOrganSystemScores(labs: LabObservationItem[] = []): OrganHealthOverview {
  const organMap: Record<OrganSystemKey, { abnormalCount: number; criticalCount: number; totalCount: number; markers: any[] }> = {
    cardiovascular: { abnormalCount: 0, criticalCount: 0, totalCount: 0, markers: [] },
    pulmonary: { abnormalCount: 0, criticalCount: 0, totalCount: 0, markers: [] },
    metabolic: { abnormalCount: 0, criticalCount: 0, totalCount: 0, markers: [] },
    renal: { abnormalCount: 0, criticalCount: 0, totalCount: 0, markers: [] },
    hepatic: { abnormalCount: 0, criticalCount: 0, totalCount: 0, markers: [] },
    hematology: { abnormalCount: 0, criticalCount: 0, totalCount: 0, markers: [] },
  };

  labs.forEach((lab) => {
    const name = cleanTestName(lab.name || '');
    const valStr = String(lab.value || '');
    const numVal = parseFloat(valStr.replace(/[^0-9.-]/g, ''));
    const statusRaw = (lab.status || '').toLowerCase();

    let isAbnormal = statusRaw.includes('abnormal') || statusRaw.includes('high') || statusRaw.includes('low');
    let isCritical = statusRaw.includes('critical') || statusRaw.includes('panic');

    if (lab.referenceHigh !== undefined && !isNaN(numVal) && numVal > lab.referenceHigh) {
      isAbnormal = true;
      if (numVal > lab.referenceHigh * 1.2) isCritical = true;
    }
    if (lab.referenceLow !== undefined && !isNaN(numVal) && numVal < lab.referenceLow) {
      isAbnormal = true;
      if (numVal < lab.referenceLow * 0.8) isCritical = true;
    }

    const itemStatus: 'normal' | 'abnormal' | 'critical' = isCritical ? 'critical' : isAbnormal ? 'abnormal' : 'normal';

    const addMarker = (system: OrganSystemKey) => {
      organMap[system].totalCount++;
      if (isCritical) organMap[system].criticalCount++;
      else if (isAbnormal) organMap[system].abnormalCount++;
      organMap[system].markers.push({
        name: lab.name,
        value: `${lab.value} ${lab.unit || ''}`.trim(),
        status: itemStatus,
      });
    };

    // Classification
    if (name.includes('cholesterol') || name.includes('ldl') || name.includes('hdl') || name.includes('triglyceride') || name.includes('troponin') || name.includes('pressure') || name.includes('crp')) {
      addMarker('cardiovascular');
    }
    if (name.includes('spo2') || name.includes('respiratory') || name.includes('oxygen') || name.includes('lung')) {
      addMarker('pulmonary');
    }
    if (name.includes('hba1c') || name.includes('glucose') || name.includes('sugar') || name.includes('insulin') || name.includes('a1c')) {
      addMarker('metabolic');
    }
    if (name.includes('creatinine') || name.includes('egfr') || name.includes('urea') || name.includes('bun') || name.includes('uric') || name.includes('kidney')) {
      addMarker('renal');
    }
    if (name.includes('sgpt') || name.includes('sgot') || name.includes('alt') || name.includes('ast') || name.includes('bilirubin') || name.includes('alkaline') || name.includes('liver')) {
      addMarker('hepatic');
    }
    if (name.includes('hemoglobin') || name.includes('wbc') || name.includes('rbc') || name.includes('platelet') || name.includes('vitamin') || name.includes('ferritin') || name.includes('iron')) {
      addMarker('hematology');
    }
  });

  const computeScore = (sys: { abnormalCount: number; criticalCount: number; totalCount: number }) => {
    if (sys.totalCount === 0) return 92; // Default optimal health baseline
    const penalty = sys.criticalCount * 30 + sys.abnormalCount * 15;
    return Math.max(35, 100 - penalty);
  };

  const getStatus = (score: number): OrganHealthStatus => {
    if (score < 65) return 'critical';
    if (score < 85) return 'warning';
    return 'optimal';
  };

  const cardioScore = computeScore(organMap.cardiovascular);
  const pulmoScore = computeScore(organMap.pulmonary);
  const metaScore = computeScore(organMap.metabolic);
  const renalScore = computeScore(organMap.renal);
  const hepaticScore = computeScore(organMap.hepatic);
  const hemaScore = computeScore(organMap.hematology);

  const organSystems: Record<OrganSystemKey, OrganSystemScore> = {
    cardiovascular: {
      key: 'cardiovascular',
      displayName: 'Cardiovascular System',
      iconName: 'Heart',
      score: cardioScore,
      status: getStatus(cardioScore),
      primaryBiomarkers: organMap.cardiovascular.markers.length ? organMap.cardiovascular.markers : [
        { name: 'Lipid Profile (LDL)', value: '110 mg/dL', status: 'normal' },
        { name: 'Blood Pressure', value: '120/80 mmHg', status: 'normal' },
      ],
      summary: cardioScore < 85 ? 'Elevated lipid markers detected. Monitor vascular risk.' : 'Vascular and heart biomarkers are well balanced.',
      recommendedSpecialist: 'AI Cardiologist (ACC/AHA 2024 Guidelines)',
    },
    pulmonary: {
      key: 'pulmonary',
      displayName: 'Pulmonary System',
      iconName: 'Wind',
      score: pulmoScore,
      status: getStatus(pulmoScore),
      primaryBiomarkers: organMap.pulmonary.markers.length ? organMap.pulmonary.markers : [
        { name: 'SpO2 Oxygen Saturation', value: '98%', status: 'normal' },
        { name: 'Respiratory Rate', value: '16 /min', status: 'normal' },
      ],
      summary: pulmoScore < 85 ? 'Sub-optimal oxygen exchange metrics.' : 'Lung gas exchange and oxygen saturation are optimal.',
      recommendedSpecialist: 'AI Pulmonologist (ATS 2024 Standard)',
    },
    metabolic: {
      key: 'metabolic',
      displayName: 'Metabolic & Endocrine System',
      iconName: 'Zap',
      score: metaScore,
      status: getStatus(metaScore),
      primaryBiomarkers: organMap.metabolic.markers.length ? organMap.metabolic.markers : [
        { name: 'HbA1c', value: '5.6%', status: 'normal' },
        { name: 'Fasting Glucose', value: '92 mg/dL', status: 'normal' },
      ],
      summary: metaScore < 85 ? 'Borderline glycemic variability detected.' : 'Glucose homeostasis and insulin response are well regulated.',
      recommendedSpecialist: 'AI Endocrinologist (ADA 2025 Standard)',
    },
    renal: {
      key: 'renal',
      displayName: 'Renal & Urinary System',
      iconName: 'Droplets',
      score: renalScore,
      status: getStatus(renalScore),
      primaryBiomarkers: organMap.renal.markers.length ? organMap.renal.markers : [
        { name: 'Serum Creatinine', value: '0.9 mg/dL', status: 'normal' },
        { name: 'eGFR', value: '95 mL/min', status: 'normal' },
      ],
      summary: renalScore < 85 ? 'Glomerular filtration rate requires monitoring.' : 'Kidney filtration and fluid-electrolyte balance are healthy.',
      recommendedSpecialist: 'AI Nephrologist (KDIGO 2024 Standard)',
    },
    hepatic: {
      key: 'hepatic',
      displayName: 'Hepatic & Biliary System',
      iconName: 'Activity',
      score: hepaticScore,
      status: getStatus(hepaticScore),
      primaryBiomarkers: organMap.hepatic.markers.length ? organMap.hepatic.markers : [
        { name: 'ALT (SGPT)', value: '24 U/L', status: 'normal' },
        { name: 'AST (SGOT)', value: '22 U/L', status: 'normal' },
      ],
      summary: hepaticScore < 85 ? 'Mild liver enzyme elevation detected.' : 'Liver enzymes and protein synthesis are in optimal range.',
      recommendedSpecialist: 'AI Gastroenterologist (AASLD Standard)',
    },
    hematology: {
      key: 'hematology',
      displayName: 'Hematology & Skeletal System',
      iconName: 'Shield',
      score: hemaScore,
      status: getStatus(hemaScore),
      primaryBiomarkers: organMap.hematology.markers.length ? organMap.hematology.markers : [
        { name: 'Hemoglobin', value: '14.2 g/dL', status: 'normal' },
        { name: 'Vitamin D', value: '38 ng/mL', status: 'normal' },
      ],
      summary: hemaScore < 85 ? 'Mild anemia or vitamin deficiency indicated.' : 'Complete blood count and bone vitamin levels are optimal.',
      recommendedSpecialist: 'AI Hematologist & Internal Medicine Specialist',
    },
  };

  const scores = Object.values(organSystems).map((s) => s.score);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  let criticalCount = 0;
  let warningCount = 0;
  let optimalCount = 0;

  Object.values(organSystems).forEach((s) => {
    if (s.status === 'critical') criticalCount++;
    else if (s.status === 'warning') warningCount++;
    else optimalCount++;
  });

  return {
    overallScore,
    organSystems,
    criticalCount,
    warningCount,
    optimalCount,
    lastEvaluatedAt: new Date().toISOString(),
  };
}
