/**
 * fhirService.ts — HL7 FHIR R4 Standardized Exporter & Schema Mappings
 * Converts internal patient profiles, lab reports, biomarker telemetry, and SBAR clinical notes
 * into valid HL7 FHIR R4 JSON bundles compatible with EHRs and the Ayushman Bharat Digital Mission (ABDM).
 */

import {
  FhirBundle,
  FhirPatient,
  FhirObservation,
  FhirDiagnosticReport,
  FhirDocumentReference,
  FhirResource,
  FhirValidationResult,
  FhirValidationIssue,
  FhirCoding,
} from '../types/fhir';

export * from '../types/fhir';

// Legacy Type Aliases for 100% backward compatibility
export type FHIRResource = FhirResource;
export type FHIRBundle = FhirBundle;

/**
 * Standard LOINC clinical dictionary covering 40+ vital biomarkers across
 * Metabolic, Lipid, Hepatic, Renal, Hematology, Electrolytes, Thyroid, Vitamins, and Cardiac panels.
 */
export interface LoincMapping {
  code: string;
  display: string;
  system: string;
  defaultUnit: string;
  category: 'laboratory' | 'vital-signs' | 'exam';
  panel: string;
}

export const LOINC_DICTIONARY: Record<string, LoincMapping> = {
  // Glycemic & Diabetes
  hba1c: { code: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood', system: 'http://loinc.org', defaultUnit: '%', category: 'laboratory', panel: 'Diabetes' },
  glucose_fasting: { code: '2345-7', display: 'Glucose [Mass/volume] in Serum or Plasma --Fasting', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Metabolic' },
  glucose_random: { code: '2339-0', display: 'Glucose [Mass/volume] in Blood', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Metabolic' },
  glucose_pp: { code: '1521-4', display: 'Glucose [Mass/volume] in Serum or Plasma --2 hours post meal', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Metabolic' },
  insulin_fasting: { code: '24357-6', display: 'Insulin [Units/volume] in Serum or Plasma --Fasting', system: 'http://loinc.org', defaultUnit: 'uIU/mL', category: 'laboratory', panel: 'Diabetes' },

  // Renal Function
  creatinine: { code: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Renal' },
  egfr: { code: '33914-3', display: 'Glomerular filtration rate/1.73 sq M.predicted', system: 'http://loinc.org', defaultUnit: 'mL/min/1.73m2', category: 'laboratory', panel: 'Renal' },
  bun: { code: '3094-0', display: 'Urea nitrogen [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Renal' },
  uric_acid: { code: '3084-1', display: 'Uric acid [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Renal' },
  microalbumin_urine: { code: '14957-5', display: 'Microalbumin [Mass/volume] in Urine', system: 'http://loinc.org', defaultUnit: 'mg/L', category: 'laboratory', panel: 'Renal' },

  // Lipid Panel
  total_cholesterol: { code: '2093-3', display: 'Cholesterol [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Lipid' },
  hdl_cholesterol: { code: '2085-9', display: 'Cholesterol in HDL [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Lipid' },
  ldl_cholesterol: { code: '2089-1', display: 'Cholesterol in LDL [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Lipid' },
  triglycerides: { code: '2571-8', display: 'Triglyceride [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Lipid' },
  vldl_cholesterol: { code: '13457-7', display: 'Cholesterol in VLDL [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Lipid' },
  non_hdl_cholesterol: { code: '43396-1', display: 'Non-HDL Cholesterol [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Lipid' },

  // Liver Function Panel (LFT)
  alt: { code: '1742-6', display: 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'U/L', category: 'laboratory', panel: 'Hepatic' },
  ast: { code: '1920-8', display: 'Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'U/L', category: 'laboratory', panel: 'Hepatic' },
  alp: { code: '6768-6', display: 'Alkaline phosphatase [Enzymatic activity/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'U/L', category: 'laboratory', panel: 'Hepatic' },
  total_bilirubin: { code: '1975-2', display: 'Bilirubin.total [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Hepatic' },
  direct_bilirubin: { code: '1968-7', display: 'Bilirubin.direct [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Hepatic' },
  total_protein: { code: '2885-2', display: 'Protein [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'g/dL', category: 'laboratory', panel: 'Hepatic' },
  albumin: { code: '1751-7', display: 'Albumin [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'g/dL', category: 'laboratory', panel: 'Hepatic' },
  globulin: { code: '2334-1', display: 'Globulin [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'g/dL', category: 'laboratory', panel: 'Hepatic' },
  ggt: { code: '2324-2', display: 'Gamma glutamyl transferase [Enzymatic activity/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'U/L', category: 'laboratory', panel: 'Hepatic' },

  // Complete Blood Count (CBC)
  hemoglobin: { code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood', system: 'http://loinc.org', defaultUnit: 'g/dL', category: 'laboratory', panel: 'Hematology' },
  hematocrit: { code: '4544-3', display: 'Hematocrit [Volume Fraction] of Blood', system: 'http://loinc.org', defaultUnit: '%', category: 'laboratory', panel: 'Hematology' },
  wbc: { code: '6690-2', display: 'Leukocytes [#/volume] in Blood by Automated count', system: 'http://loinc.org', defaultUnit: '10*3/uL', category: 'laboratory', panel: 'Hematology' },
  rbc: { code: '789-8', display: 'Erythrocytes [#/volume] in Blood by Automated count', system: 'http://loinc.org', defaultUnit: '10*6/uL', category: 'laboratory', panel: 'Hematology' },
  platelets: { code: '777-3', display: 'Platelets [#/volume] in Blood by Automated count', system: 'http://loinc.org', defaultUnit: '10*3/uL', category: 'laboratory', panel: 'Hematology' },
  mcv: { code: '787-2', display: 'MCV [Entitic volume] by Automated count', system: 'http://loinc.org', defaultUnit: 'fL', category: 'laboratory', panel: 'Hematology' },
  mch: { code: '785-6', display: 'MCH [Entitic mass] by Automated count', system: 'http://loinc.org', defaultUnit: 'pg', category: 'laboratory', panel: 'Hematology' },
  mchc: { code: '786-4', display: 'MCHC [Mass/volume] by Automated count', system: 'http://loinc.org', defaultUnit: 'g/dL', category: 'laboratory', panel: 'Hematology' },
  rdw: { code: '21000-5', display: 'Erythrocyte distribution width [Entitic volume] by Automated count', system: 'http://loinc.org', defaultUnit: '%', category: 'laboratory', panel: 'Hematology' },
  neutrophils: { code: '751-8', display: 'Neutrophils [#/volume] in Blood by Automated count', system: 'http://loinc.org', defaultUnit: '%', category: 'laboratory', panel: 'Hematology' },
  lymphocytes: { code: '731-0', display: 'Lymphocytes [#/volume] in Blood by Automated count', system: 'http://loinc.org', defaultUnit: '%', category: 'laboratory', panel: 'Hematology' },
  monocytes: { code: '742-7', display: 'Monocytes [#/volume] in Blood by Automated count', system: 'http://loinc.org', defaultUnit: '%', category: 'laboratory', panel: 'Hematology' },
  eosinophils: { code: '711-2', display: 'Eosinophils [#/volume] in Blood by Automated count', system: 'http://loinc.org', defaultUnit: '%', category: 'laboratory', panel: 'Hematology' },
  basophils: { code: '704-7', display: 'Basophils [#/volume] in Blood by Automated count', system: 'http://loinc.org', defaultUnit: '%', category: 'laboratory', panel: 'Hematology' },
  esr: { code: '30341-2', display: 'Erythrocyte sedimentation rate by Westergren method', system: 'http://loinc.org', defaultUnit: 'mm/h', category: 'laboratory', panel: 'Hematology' },

  // Electrolytes & Minerals
  sodium: { code: '2951-2', display: 'Sodium [Moles/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mmol/L', category: 'laboratory', panel: 'Electrolytes' },
  potassium: { code: '2823-3', display: 'Potassium [Moles/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mmol/L', category: 'laboratory', panel: 'Electrolytes' },
  chloride: { code: '2075-0', display: 'Chloride [Moles/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mmol/L', category: 'laboratory', panel: 'Electrolytes' },
  bicarbonate: { code: '2028-9', display: 'Carbon dioxide, total [Moles/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mmol/L', category: 'laboratory', panel: 'Electrolytes' },
  calcium: { code: '17861-6', display: 'Calcium [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Electrolytes' },
  magnesium: { code: '19123-9', display: 'Magnesium [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Electrolytes' },
  phosphorus: { code: '2777-1', display: 'Phosphate [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'mg/dL', category: 'laboratory', panel: 'Electrolytes' },

  // Thyroid Panel
  tsh: { code: '3016-3', display: 'Thyrotropin [Units/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'uIU/mL', category: 'laboratory', panel: 'Thyroid' },
  free_t3: { code: '3051-0', display: 'Triiodothyronine.free [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'pg/mL', category: 'laboratory', panel: 'Thyroid' },
  free_t4: { code: '3024-7', display: 'Thyroxine.free [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'ng/dL', category: 'laboratory', panel: 'Thyroid' },
  total_t3: { code: '3053-6', display: 'Triiodothyronine [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'ng/dL', category: 'laboratory', panel: 'Thyroid' },
  total_t4: { code: '3026-2', display: 'Thyroxine [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'ug/dL', category: 'laboratory', panel: 'Thyroid' },

  // Vitamins, Iron & Inflammatory Markers
  vitamin_d: { code: '1989-3', display: '25-hydroxyvitamin D3 [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'ng/mL', category: 'laboratory', panel: 'Vitamins' },
  vitamin_b12: { code: '1971-1', display: 'Cobalamin (Vitamin B12) [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'pg/mL', category: 'laboratory', panel: 'Vitamins' },
  ferritin: { code: '2276-4', display: 'Ferritin [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'ng/mL', category: 'laboratory', panel: 'Iron' },
  serum_iron: { code: '2498-4', display: 'Iron [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'ug/dL', category: 'laboratory', panel: 'Iron' },
  tibc: { code: '2500-7', display: 'Iron binding capacity [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'ug/dL', category: 'laboratory', panel: 'Iron' },
  hs_crp: { code: '30522-7', display: 'C reactive protein [Mass/volume] in Serum or Plasma by High sensitivity method', system: 'http://loinc.org', defaultUnit: 'mg/L', category: 'laboratory', panel: 'Inflammation' },

  // Cardiac & Coagulation
  troponin_i: { code: '10839-9', display: 'Troponin I.cardiac [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'ng/mL', category: 'laboratory', panel: 'Cardiac' },
  bnp: { code: '33762-6', display: 'Natriuretic peptide B [Mass/volume] in Blood', system: 'http://loinc.org', defaultUnit: 'pg/mL', category: 'laboratory', panel: 'Cardiac' },
  d_dimer: { code: '48065-7', display: 'Fibrin D-dimer DDU [Mass/volume] in Platelet poor plasma', system: 'http://loinc.org', defaultUnit: 'ug/mL', category: 'laboratory', panel: 'Coagulation' },
  inr: { code: '6301-6', display: 'INR in Platelet poor plasma by Coagulation assay', system: 'http://loinc.org', defaultUnit: '', category: 'laboratory', panel: 'Coagulation' },
  psa: { code: '2857-1', display: 'Prostate specific Ag [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', defaultUnit: 'ng/mL', category: 'laboratory', panel: 'Oncology' },

  // Vital Signs
  heart_rate: { code: '8867-4', display: 'Heart rate', system: 'http://loinc.org', defaultUnit: '/min', category: 'vital-signs', panel: 'Vitals' },
  blood_pressure_systolic: { code: '8480-6', display: 'Systolic blood pressure', system: 'http://loinc.org', defaultUnit: 'mm[Hg]', category: 'vital-signs', panel: 'Vitals' },
  blood_pressure_diastolic: { code: '8462-4', display: 'Diastolic blood pressure', system: 'http://loinc.org', defaultUnit: 'mm[Hg]', category: 'vital-signs', panel: 'Vitals' },
  spo2: { code: '2708-6', display: 'Oxygen saturation in Arterial blood by Pulse oximetry', system: 'http://loinc.org', defaultUnit: '%', category: 'vital-signs', panel: 'Vitals' },
  body_temperature: { code: '8310-5', display: 'Body temperature', system: 'http://loinc.org', defaultUnit: 'Cel', category: 'vital-signs', panel: 'Vitals' },
  respiratory_rate: { code: '9279-1', display: 'Respiratory rate', system: 'http://loinc.org', defaultUnit: '/min', category: 'vital-signs', panel: 'Vitals' },
  body_weight: { code: '29463-7', display: 'Body weight', system: 'http://loinc.org', defaultUnit: 'kg', category: 'vital-signs', panel: 'Vitals' },
  body_height: { code: '8302-2', display: 'Body height', system: 'http://loinc.org', defaultUnit: 'cm', category: 'vital-signs', panel: 'Vitals' },
  bmi: { code: '39156-5', display: 'Body mass index (BMI) [Ratio]', system: 'http://loinc.org', defaultUnit: 'kg/m2', category: 'vital-signs', panel: 'Vitals' },
};

/**
 * Normalizes test name and looks up canonical LOINC code and metadata
 */
export function lookupLoincCode(testName: string): LoincMapping {
  if (!testName) {
    return {
      code: '29463-7',
      display: 'General Laboratory Test',
      system: 'http://loinc.org',
      defaultUnit: '',
      category: 'laboratory',
      panel: 'General',
    };
  }

  const clean = testName.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);

  // 1. Check exact key match
  const underscoreClean = clean.replace(/\s+/g, '_');
  if (LOINC_DICTIONARY[underscoreClean]) {
    return LOINC_DICTIONARY[underscoreClean];
  }

  // 2. Keyword heuristic matching (ordered by specificity)
  if (clean.includes('hba1c') || clean.includes('glycated') || clean.includes('a1c')) return LOINC_DICTIONARY.hba1c;
  if (clean.includes('fasting') && (clean.includes('glucose') || clean.includes('sugar'))) return LOINC_DICTIONARY.glucose_fasting;
  if ((clean.includes('post') || clean.includes('pp')) && (clean.includes('glucose') || clean.includes('sugar'))) return LOINC_DICTIONARY.glucose_pp;
  if (clean.includes('glucose') || clean.includes('sugar')) return LOINC_DICTIONARY.glucose_random;
  if (clean.includes('creatinine') || clean.includes('creat')) return LOINC_DICTIONARY.creatinine;
  if (clean.includes('egfr') || clean.includes('gfr')) return LOINC_DICTIONARY.egfr;
  if (words.includes('bun') || clean.includes('blood urea nitrogen') || clean.includes('urea nitrogen')) return LOINC_DICTIONARY.bun;
  if (clean.includes('uric')) return LOINC_DICTIONARY.uric_acid;
  if (clean.includes('lipid') || clean.includes('cholesterol')) {
    if (clean.includes('hdl') && !clean.includes('non')) return LOINC_DICTIONARY.hdl_cholesterol;
    if (clean.includes('ldl')) return LOINC_DICTIONARY.ldl_cholesterol;
    if (clean.includes('vldl')) return LOINC_DICTIONARY.vldl_cholesterol;
    if (clean.includes('non hdl')) return LOINC_DICTIONARY.non_hdl_cholesterol;
    if (clean.includes('triglyceride')) return LOINC_DICTIONARY.triglycerides;
    return LOINC_DICTIONARY.total_cholesterol;
  }
  if (clean.includes('triglyceride')) return LOINC_DICTIONARY.triglycerides;
  if (words.includes('alt') || words.includes('sgpt') || clean.includes('alanine aminotransferase')) return LOINC_DICTIONARY.alt;
  if (words.includes('ast') || words.includes('sgot') || clean.includes('aspartate aminotransferase')) return LOINC_DICTIONARY.ast;
  if (words.includes('alp') || clean.includes('alkaline phosphatase')) return LOINC_DICTIONARY.alp;
  if (clean.includes('bilirubin')) {
    if (clean.includes('direct') || clean.includes('conjugated')) return LOINC_DICTIONARY.direct_bilirubin;
    return LOINC_DICTIONARY.total_bilirubin;
  }
  if (words.includes('albumin')) return LOINC_DICTIONARY.albumin;
  if (words.includes('globulin')) return LOINC_DICTIONARY.globulin;
  if (clean.includes('total protein') || words.includes('protein')) return LOINC_DICTIONARY.total_protein;
  if (words.includes('ggt')) return LOINC_DICTIONARY.ggt;
  if (clean.includes('hemoglobin') || words.includes('hb')) return LOINC_DICTIONARY.hemoglobin;
  if (clean.includes('hematocrit') || words.includes('hct') || words.includes('pcv')) return LOINC_DICTIONARY.hematocrit;
  if (words.includes('wbc') || clean.includes('leukocyte') || clean.includes('white blood')) return LOINC_DICTIONARY.wbc;
  if (words.includes('rbc') || clean.includes('erythrocyte') || clean.includes('red blood')) return LOINC_DICTIONARY.rbc;
  if (clean.includes('platelet')) return LOINC_DICTIONARY.platelets;
  if (words.includes('mcv')) return LOINC_DICTIONARY.mcv;
  if (words.includes('mchc')) return LOINC_DICTIONARY.mchc;
  if (words.includes('mch')) return LOINC_DICTIONARY.mch;
  if (words.includes('rdw')) return LOINC_DICTIONARY.rdw;
  if (clean.includes('neutrophil')) return LOINC_DICTIONARY.neutrophils;
  if (clean.includes('lymphocyte')) return LOINC_DICTIONARY.lymphocytes;
  if (clean.includes('monocyte')) return LOINC_DICTIONARY.monocytes;
  if (clean.includes('eosinophil')) return LOINC_DICTIONARY.eosinophils;
  if (clean.includes('basophil')) return LOINC_DICTIONARY.basophils;
  if (words.includes('esr') || clean.includes('sedimentation')) return LOINC_DICTIONARY.esr;
  if (clean.includes('sodium') || words.includes('na')) return LOINC_DICTIONARY.sodium;
  if (clean.includes('potassium') || words.includes('k')) return LOINC_DICTIONARY.potassium;
  if (clean.includes('chloride') || words.includes('cl')) return LOINC_DICTIONARY.chloride;
  if (clean.includes('calcium') || words.includes('ca')) return LOINC_DICTIONARY.calcium;
  if (clean.includes('magnesium') || words.includes('mg')) return LOINC_DICTIONARY.magnesium;
  if (clean.includes('phosphorus') || clean.includes('phosphate')) return LOINC_DICTIONARY.phosphorus;
  if (words.includes('tsh') || clean.includes('thyrotropin')) return LOINC_DICTIONARY.tsh;
  if (clean.includes('free t3') || words.includes('ft3')) return LOINC_DICTIONARY.free_t3;
  if (clean.includes('free t4') || words.includes('ft4')) return LOINC_DICTIONARY.free_t4;
  if (words.includes('t3')) return LOINC_DICTIONARY.total_t3;
  if (words.includes('t4')) return LOINC_DICTIONARY.total_t4;
  if (clean.includes('vitamin d') || clean.includes('25 oh') || words.includes('d3')) return LOINC_DICTIONARY.vitamin_d;
  if (clean.includes('vitamin b12') || words.includes('b12') || clean.includes('cobalamin')) return LOINC_DICTIONARY.vitamin_b12;
  if (clean.includes('ferritin')) return LOINC_DICTIONARY.ferritin;
  if (words.includes('iron') && !clean.includes('binding')) return LOINC_DICTIONARY.serum_iron;
  if (words.includes('tibc') || clean.includes('binding capacity')) return LOINC_DICTIONARY.tibc;
  if (words.includes('crp') || clean.includes('c-reactive') || clean.includes('c reactive')) return LOINC_DICTIONARY.hs_crp;
  if (clean.includes('troponin')) return LOINC_DICTIONARY.troponin_i;
  if (words.includes('bnp')) return LOINC_DICTIONARY.bnp;
  if (clean.includes('d dimer') || clean.includes('d-dimer')) return LOINC_DICTIONARY.d_dimer;
  if (words.includes('inr')) return LOINC_DICTIONARY.inr;
  if (words.includes('psa')) return LOINC_DICTIONARY.psa;
  if (clean.includes('heart rate') || clean.includes('pulse')) return LOINC_DICTIONARY.heart_rate;
  if (words.includes('spo2') || clean.includes('oxygen')) return LOINC_DICTIONARY.spo2;
  if (clean.includes('temperature')) return LOINC_DICTIONARY.body_temperature;
  if (clean.includes('weight')) return LOINC_DICTIONARY.body_weight;
  if (clean.includes('height')) return LOINC_DICTIONARY.body_height;
  if (words.includes('bmi')) return LOINC_DICTIONARY.bmi;

  // 3. Substring key matching for longer multi-word keys
  for (const [key, mapping] of Object.entries(LOINC_DICTIONARY)) {
    const keyClean = key.replace(/_/g, ' ');
    if (keyClean.length > 4 && (clean.includes(keyClean) || keyClean.includes(clean))) {
      return mapping;
    }
  }

  // Fallback
  return {
    code: '29463-7',
    display: testName,
    system: 'http://loinc.org',
    defaultUnit: '',
    category: 'laboratory',
    panel: 'General',
  };
}

/**
 * Maps a patient profile entity to a standard HL7 FHIR R4 Patient Resource
 */
export function mapProfileToPatient(profile: {
  id?: string;
  userId?: string;
  name?: string;
  fullName?: string;
  gender?: string;
  birthDate?: string;
  dob?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  bloodType?: string;
}): FhirPatient {
  const patientId = profile.id || profile.userId || `patient-${Date.now()}`;
  const displayName = profile.name || profile.fullName || 'Anonymous Patient';

  const genderRaw = (profile.gender || 'unknown').toLowerCase();
  const validGender: 'male' | 'female' | 'other' | 'unknown' =
    genderRaw === 'male' || genderRaw === 'female' || genderRaw === 'other' ? genderRaw : 'unknown';

  const telecomList = [];
  if (profile.email) {
    telecomList.push({ system: 'email' as const, value: profile.email, use: 'home' as const });
  }
  if (profile.phone || profile.mobile) {
    telecomList.push({ system: 'phone' as const, value: profile.phone || profile.mobile, use: 'mobile' as const });
  }

  const patient: FhirPatient = {
    resourceType: 'Patient',
    id: patientId,
    meta: {
      profile: [
        'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient',
        'http://hl7.org/fhir/StructureDefinition/Patient',
      ],
      lastUpdated: new Date().toISOString(),
    },
    active: true,
    identifier: [
      {
        system: 'https://healthid.abdm.gov.in',
        value: profile.id || profile.userId || patientId,
      },
    ],
    name: [
      {
        use: 'official',
        text: displayName,
      },
    ],
    gender: validGender,
    birthDate: profile.birthDate || profile.dob || '1990-01-01',
    telecom: telecomList.length > 0 ? telecomList : undefined,
    address: profile.address
      ? [
          {
            use: 'home',
            text: profile.address,
          },
        ]
      : undefined,
  };

  return patient;
}

/**
 * Maps a single lab result/biomarker into an HL7 FHIR R4 Observation Resource
 */
export function mapLabToObservation(
  biomarker: {
    id?: string;
    name?: string;
    markerName?: string;
    testName?: string;
    value: number | string;
    numericValue?: number | null;
    numeric_value?: number | null;
    valueCanonical?: number | string | null;
    unit?: string;
    unitCanonical?: string;
    referenceRange?: string | { low?: number; high?: number } | null;
    referenceLow?: number | null;
    referenceHigh?: number | null;
    category?: string;
    loincCode?: string;
    interpretation?: 'normal' | 'abnormal' | 'critical' | 'high' | 'low' | string;
    status?: string;
    date?: string;
  },
  patientRef: string
): FhirObservation {
  const obsId = biomarker.id || `obs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const testName = biomarker.name || biomarker.markerName || biomarker.testName || 'Lab Observation';
  const loinc = biomarker.loincCode
    ? { code: biomarker.loincCode, display: testName, system: 'http://loinc.org', defaultUnit: biomarker.unit || '', category: 'laboratory' as const, panel: 'General' }
    : lookupLoincCode(testName);

  // Parse numeric value if present
  let numVal: number | undefined;
  if (typeof biomarker.value === 'number') {
    numVal = biomarker.value;
  } else if (biomarker.numericValue !== undefined && biomarker.numericValue !== null) {
    numVal = biomarker.numericValue;
  } else if (biomarker.numeric_value !== undefined && biomarker.numeric_value !== null) {
    numVal = biomarker.numeric_value;
  } else if (typeof biomarker.value === 'string') {
    const parsed = parseFloat(biomarker.value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(parsed)) numVal = parsed;
  }

  const unit = biomarker.unitCanonical || biomarker.unit || loinc.defaultUnit || '';

  // Parse reference range
  let refRange: any[] | undefined;
  if (biomarker.referenceLow !== undefined && biomarker.referenceLow !== null && biomarker.referenceHigh !== undefined && biomarker.referenceHigh !== null) {
    refRange = [
      {
        low: { value: biomarker.referenceLow, unit, system: 'http://unitsofmeasure.org' },
        high: { value: biomarker.referenceHigh, unit, system: 'http://unitsofmeasure.org' },
      },
    ];
  } else if (typeof biomarker.referenceRange === 'string' && biomarker.referenceRange.trim().length > 0) {
    refRange = [{ text: biomarker.referenceRange }];
  }

  // Parse interpretation
  const rawInterp = (biomarker.interpretation || biomarker.status || '').toLowerCase();
  let interpCode: string = 'N';
  let interpDisplay: string = 'Normal';

  if (rawInterp.includes('crit') || rawInterp.includes('panic')) {
    interpCode = 'AA';
    interpDisplay = 'Critical Abnormal';
  } else if (rawInterp === 'high' || rawInterp === 'h') {
    interpCode = 'H';
    interpDisplay = 'High';
  } else if (rawInterp === 'low' || rawInterp === 'l') {
    interpCode = 'L';
    interpDisplay = 'Low';
  } else if (rawInterp === 'abnormal' || rawInterp === 'a') {
    interpCode = 'A';
    interpDisplay = 'Abnormal';
  }

  const subjectRef = patientRef.startsWith('Patient/') ? patientRef : `Patient/${patientRef}`;

  const observation: FhirObservation = {
    resourceType: 'Observation',
    id: obsId,
    meta: {
      profile: [
        'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation',
        'http://hl7.org/fhir/StructureDefinition/Observation',
      ],
      lastUpdated: new Date().toISOString(),
    },
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: biomarker.category || loinc.category || 'laboratory',
            display: (biomarker.category || loinc.category || 'Laboratory').toUpperCase(),
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: loinc.system || 'http://loinc.org',
          code: loinc.code,
          display: loinc.display || testName,
        },
      ],
      text: testName,
    },
    subject: {
      reference: subjectRef,
    },
    effectiveDateTime: biomarker.date || new Date().toISOString(),
    valueQuantity:
      numVal !== undefined
        ? {
            value: numVal,
            unit,
            system: 'http://unitsofmeasure.org',
          }
        : undefined,
    valueString: numVal === undefined && typeof biomarker.value === 'string' ? biomarker.value : undefined,
    interpretation: rawInterp
      ? [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: interpCode,
                display: interpDisplay,
              },
            ],
          },
        ]
      : undefined,
    referenceRange: refRange,
  };

  return observation;
}

/**
 * Maps a lab report document and child observations into an HL7 FHIR R4 DiagnosticReport
 */
export function mapReportToDiagnosticReport(
  report: {
    id: string;
    title?: string;
    fileName?: string;
    date?: string;
    extractedDate?: string;
    uploadedAt?: string;
    hospitalName?: string;
    doctorName?: string;
    summary?: string;
    conclusion?: string;
  },
  observations: FhirObservation[],
  patientRef: string
): FhirDiagnosticReport {
  const diagId = `diag-${report.id.replace(/^diag-/, '')}`;
  const subjectRef = patientRef.startsWith('Patient/') ? patientRef : `Patient/${patientRef}`;
  const reportTitle = report.title || report.fileName || 'Diagnostic Laboratory Report';

  const diagnosticReport: FhirDiagnosticReport = {
    resourceType: 'DiagnosticReport',
    id: diagId,
    meta: {
      profile: [
        'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord',
        'http://hl7.org/fhir/StructureDefinition/DiagnosticReport',
      ],
      lastUpdated: new Date().toISOString(),
    },
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
            code: 'LAB',
            display: 'Laboratory',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '11502-2',
          display: 'Laboratory report',
        },
      ],
      text: reportTitle,
    },
    subject: {
      reference: subjectRef,
    },
    effectiveDateTime: report.date || report.extractedDate || report.uploadedAt || new Date().toISOString(),
    issued: new Date().toISOString(),
    performer: report.hospitalName
      ? [
          {
            display: report.hospitalName,
          },
        ]
      : undefined,
    resultsInterpreter: report.doctorName
      ? [
          {
            display: report.doctorName,
          },
        ]
      : undefined,
    result: observations.map((obs) => ({
      reference: `Observation/${obs.id}`,
      display: obs.code.text || obs.code.coding?.[0]?.display,
    })),
    conclusion: report.conclusion || report.summary || 'Clinical diagnostic panel processed by Aegis Health AI.',
  };

  return diagnosticReport;
}

/**
 * Maps an SBAR clinical summary or clinical handover note to an HL7 FHIR R4 DocumentReference
 */
export function mapSbarToDocumentReference(
  sbar:
    | string
    | {
        situation?: string;
        background?: string;
        assessment?: string | string[];
        recommendation?: string | string[];
        title?: string;
      },
  patientRef: string,
  date?: string
): FhirDocumentReference {
  const docRefId = `docref-sbar-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const subjectRef = patientRef.startsWith('Patient/') ? patientRef : `Patient/${patientRef}`;

  let fullNarrative = '';
  if (typeof sbar === 'string') {
    fullNarrative = sbar;
  } else if (sbar && typeof sbar === 'object') {
    const situation = sbar.situation ? `### Situation\n${sbar.situation}\n\n` : '';
    const background = sbar.background ? `### Background\n${sbar.background}\n\n` : '';
    const assessment = sbar.assessment
      ? `### Assessment\n${Array.isArray(sbar.assessment) ? sbar.assessment.join('\n- ') : sbar.assessment}\n\n`
      : '';
    const recommendation = sbar.recommendation
      ? `### Recommendation\n${Array.isArray(sbar.recommendation) ? sbar.recommendation.join('\n- ') : sbar.recommendation}`
      : '';
    fullNarrative = `${situation}${background}${assessment}${recommendation}`.trim();
  }

  // Base64 encode for FHIR attachment
  let base64Content = '';
  try {
    if (typeof window !== 'undefined' && window.btoa) {
      base64Content = window.btoa(unescape(encodeURIComponent(fullNarrative)));
    } else {
      base64Content = Buffer.from(fullNarrative).toString('base64');
    }
  } catch {
    base64Content = '';
  }

  const docReference: FhirDocumentReference = {
    resourceType: 'DocumentReference',
    id: docRefId,
    meta: {
      profile: [
        'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentReference',
        'http://hl7.org/fhir/StructureDefinition/DocumentReference',
      ],
      lastUpdated: new Date().toISOString(),
    },
    status: 'current',
    docStatus: 'final',
    type: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '34133-9',
          display: 'Summarization of episode note',
        },
      ],
      text: 'SBAR Clinical Handover Note',
    },
    category: [
      {
        coding: [
          {
            system: 'http://loinc.org',
            code: '11506-3',
            display: 'Progress note',
          },
        ],
      },
    ],
    subject: {
      reference: subjectRef,
    },
    date: date || new Date().toISOString(),
    description: 'Structured SBAR (Situation-Background-Assessment-Recommendation) clinical handover record.',
    content: [
      {
        attachment: {
          contentType: 'text/markdown',
          language: 'en',
          title: 'SBAR Clinical Handover',
          data: base64Content,
          creation: date || new Date().toISOString(),
        },
        format: {
          system: 'http://ihe.net/fhir/ValueSet/formatcode',
          code: 'urn:ihe:pcc:sbar:2026',
          display: 'SBAR Handover Specification',
        },
      },
    ],
  };

  return docReference;
}

/**
 * Exports complete clinical state (Patient, DiagnosticReports, Observations, SBAR Notes) into a unified FHIR R4 Bundle
 */
export function exportToFhirBundle(
  patient: any,
  labReports: any[] = [],
  notes?: string | any
): FhirBundle {
  const patientResource = mapProfileToPatient(patient);
  const patientId = patientResource.id;

  const entries: Array<{ fullUrl: string; resource: FhirResource }> = [
    {
      fullUrl: `urn:uuid:${patientResource.id}`,
      resource: patientResource,
    },
  ];

  // Process all lab reports and nested biomarkers
  labReports.forEach((rep) => {
    if (!rep) return;
    const rawBiomarkers =
      rep.biomarkers ||
      rep.extractedData?.observations ||
      rep.extractedData?.lab_values ||
      rep.labValues ||
      [];

    const observations: FhirObservation[] = rawBiomarkers.map((b: any) =>
      mapLabToObservation(b, patientId)
    );

    const diagnosticReport = mapReportToDiagnosticReport(
      {
        id: rep.id || `rep-${Date.now()}`,
        title: rep.title || rep.fileName,
        date: rep.date || rep.extractedDate || rep.uploadedAt,
        hospitalName: rep.hospitalName,
        doctorName: rep.doctorName,
        summary: rep.summary || rep.extractedData?.summary,
      },
      observations,
      patientId
    );

    entries.push({
      fullUrl: `urn:uuid:${diagnosticReport.id}`,
      resource: diagnosticReport,
    });

    observations.forEach((obs) => {
      entries.push({
        fullUrl: `urn:uuid:${obs.id}`,
        resource: obs,
      });
    });
  });

  // Process SBAR handover note if provided
  if (notes) {
    const sbarDocRef = mapSbarToDocumentReference(notes, patientId);
    entries.push({
      fullUrl: `urn:uuid:${sbarDocRef.id}`,
      resource: sbarDocRef,
    });
  }

  const bundle: FhirBundle = {
    resourceType: 'Bundle',
    id: `bundle-${Date.now()}`,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Bundle'],
      lastUpdated: new Date().toISOString(),
    },
    type: 'collection',
    timestamp: new Date().toISOString(),
    total: entries.length,
    entry: entries,
  };

  return bundle;
}

/**
 * Validates a FHIR R4 Bundle against core HL7 and ABDM conformance invariants
 */
export function validateFhirBundle(bundle: FhirBundle): FhirValidationResult {
  const issues: FhirValidationIssue[] = [];
  const resourceTypes: Record<string, number> = {};

  if (!bundle || bundle.resourceType !== 'Bundle') {
    return {
      isValid: false,
      resourceCount: 0,
      resourceTypes: {},
      issues: [
        {
          severity: 'error',
          code: 'invalid-bundle',
          diagnostics: 'Root object must have resourceType: "Bundle"',
        },
      ],
      validatedAt: new Date().toISOString(),
    };
  }

  if (!bundle.type) {
    issues.push({
      severity: 'error',
      code: 'missing-bundle-type',
      diagnostics: 'Bundle must specify a valid FHIR bundle type (e.g. collection, document, transaction)',
    });
  }

  if (!Array.isArray(bundle.entry)) {
    issues.push({
      severity: 'error',
      code: 'missing-entries',
      diagnostics: 'Bundle must contain an entry array',
    });
  } else {
    bundle.entry.forEach((entry, index) => {
      if (!entry.resource) {
        issues.push({
          severity: 'error',
          code: 'missing-entry-resource',
          diagnostics: `Bundle entry [${index}] is missing a resource object`,
          location: [`Bundle.entry[${index}]`],
        });
        return;
      }

      const res = entry.resource;
      const type = res.resourceType;
      resourceTypes[type] = (resourceTypes[type] || 0) + 1;

      if (!res.id) {
        issues.push({
          severity: 'warning',
          code: 'missing-resource-id',
          diagnostics: `Resource ${type} at entry [${index}] lacks a unique id`,
          location: [`Bundle.entry[${index}].resource`],
        });
      }

      // Type-specific validations
      if (type === 'Observation') {
        const obs = res as FhirObservation;
        if (!obs.code || !obs.code.coding || obs.code.coding.length === 0) {
          issues.push({
            severity: 'error',
            code: 'missing-observation-code',
            diagnostics: `Observation ${obs.id || index} is missing code/coding`,
            location: [`Bundle.entry[${index}].resource.code`],
          });
        }
        if (!obs.status) {
          issues.push({
            severity: 'error',
            code: 'missing-observation-status',
            diagnostics: `Observation ${obs.id || index} is missing status`,
            location: [`Bundle.entry[${index}].resource.status`],
          });
        }
      }

      if (type === 'DiagnosticReport') {
        const diag = res as FhirDiagnosticReport;
        if (!diag.status) {
          issues.push({
            severity: 'error',
            code: 'missing-report-status',
            diagnostics: `DiagnosticReport ${diag.id || index} is missing status`,
          });
        }
        if (!diag.code) {
          issues.push({
            severity: 'error',
            code: 'missing-report-code',
            diagnostics: `DiagnosticReport ${diag.id || index} is missing code`,
          });
        }
      }
    });
  }

  const hasPatient = (resourceTypes['Patient'] || 0) > 0;
  if (!hasPatient && bundle.entry && bundle.entry.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'no-patient-resource',
      diagnostics: 'Clinical health record bundles should ideally include a subject Patient resource.',
    });
  }

  const isValid = issues.filter((i) => i.severity === 'error').length === 0;

  return {
    isValid,
    resourceCount: bundle.entry ? bundle.entry.length : 0,
    resourceTypes,
    issues,
    validatedAt: new Date().toISOString(),
  };
}

/**
 * Triggers a browser download of a FHIR R4 Bundle in JSON format
 */
export function downloadFhirJson(bundle: FhirBundle, filename?: string): void {
  const finalFilename = filename || `fhir_bundle_${Date.now()}.json`;
  const jsonStr = JSON.stringify(bundle, null, 2);

  if (typeof window === 'undefined' || !window.document) {
    return;
  }

  const blob = new Blob([jsonStr], { type: 'application/fhir+json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = finalFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------------------------
// Backward Compatibility Aliases for Existing Components & Tests
// ----------------------------------------------------------------------

export function convertToFHIRPatient(profile: {
  id?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
}): FhirPatient {
  return mapProfileToPatient(profile);
}

export function convertToFHIRObservation(
  biomarker: {
    name: string;
    value: number | string;
    unit?: string;
    referenceRange?: string;
    category?: string;
    loincCode?: string;
    interpretation?: 'normal' | 'abnormal' | 'critical';
  },
  patientId: string
): FhirObservation {
  return mapLabToObservation(biomarker, patientId);
}

export function convertReportToFHIRBundle(
  report: {
    id: string;
    title: string;
    date: string;
    category?: string;
    biomarkers?: Array<{
      name: string;
      value: number | string;
      unit?: string;
      referenceRange?: string;
      category?: string;
      loincCode?: string;
      interpretation?: 'normal' | 'abnormal' | 'critical';
    }>;
    summary?: string;
  },
  patient: { id?: string; name?: string; email?: string }
): FhirBundle {
  return exportToFhirBundle(patient, [report]);
}

export function downloadFHIRBundle(bundle: FhirBundle, filename: string = 'fhir_report_bundle.json'): void {
  downloadFhirJson(bundle, filename);
}
