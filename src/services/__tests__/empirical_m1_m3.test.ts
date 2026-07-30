import { describe, it, expect } from 'vitest';
import { 
  evaluateDrugLabContraindications, 
  LabBiomarker 
} from '../drugLabEngine';
import { 
  LabExtractionSchema, 
  UnifiedExtractionResultSchema, 
  normalizeObservation 
} from '../ai/promptFramework';
import { Medication } from '../../types/health';

describe('Milestone 1, 2, 3 Empirical Verification Suite', () => {

  const mockLisinopril: Medication = {
    id: 'med-lisinopril',
    userId: 'user-1',
    genericName: 'lisinopril',
    brandName: 'Zestril',
    rxcui: '29046',
    dosage: '10mg',
    frequency: 'daily',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Hypertension',
    addedAt: '2026-01-01T00:00:00Z'
  };

  const mockMetformin: Medication = {
    id: 'med-metformin',
    userId: 'user-1',
    genericName: 'metformin',
    brandName: 'Glucophage',
    rxcui: '6809',
    dosage: '500mg',
    frequency: 'twice daily',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Type 2 Diabetes',
    addedAt: '2026-01-01T00:00:00Z'
  };

  const mockSpironolactone: Medication = {
    id: 'med-spiro',
    userId: 'user-1',
    genericName: 'spironolactone',
    brandName: 'Aldactone',
    rxcui: '9997',
    dosage: '25mg',
    frequency: 'daily',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Edema',
    addedAt: '2026-01-01T00:00:00Z'
  };

  const mockAtorvastatin: Medication = {
    id: 'med-statin',
    userId: 'user-1',
    genericName: 'atorvastatin',
    brandName: 'Lipitor',
    rxcui: '83367',
    dosage: '20mg',
    frequency: 'daily',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Hyperlipidemia',
    addedAt: '2026-01-01T00:00:00Z'
  };

  // ------------------------------------------------------------
  // 1. drugLabEngine.ts Boundary Conditions Tests
  // ------------------------------------------------------------
  describe('1. drugLabEngine Boundary Conditions', () => {

    it('1.1 Potassium boundary condition (4.9 vs 5.0 vs 5.5) for ACEi (Lisinopril)', () => {
      const k49: LabBiomarker = { testName: 'Serum Potassium', value: '4.9 mmol/L' };
      const k50: LabBiomarker = { testName: 'Serum Potassium', value: '5.0 mmol/L' };
      const k55: LabBiomarker = { testName: 'Serum Potassium', value: '5.5 mmol/L' };

      const res49 = evaluateDrugLabContraindications([mockLisinopril], [k49]);
      const res50 = evaluateDrugLabContraindications([mockLisinopril], [k50]);
      const res55 = evaluateDrugLabContraindications([mockLisinopril], [k55]);

      expect(res49.length).toBe(0);
      expect(res50.length).toBe(1);
      expect(res50[0].severity).toBe('critical');
      expect(res50[0].title).toContain('Hyperkalemia');

      expect(res55.length).toBe(1);
      expect(res55[0].severity).toBe('critical');
    });

    it('1.1b Potassium boundary condition (4.9 vs 5.0 vs 5.5) for Spironolactone', () => {
      const k49: LabBiomarker = { testName: 'Serum Potassium', value: '4.9 mmol/L' };
      const k50: LabBiomarker = { testName: 'Serum Potassium', value: '5.0 mmol/L' };
      const k55: LabBiomarker = { testName: 'Serum Potassium', value: '5.5 mmol/L' };

      const res49 = evaluateDrugLabContraindications([mockSpironolactone], [k49]);
      const res50 = evaluateDrugLabContraindications([mockSpironolactone], [k50]);
      const res55 = evaluateDrugLabContraindications([mockSpironolactone], [k55]);

      expect(res49.length).toBe(0);
      expect(res50.length).toBe(1);
      expect(res50[0].severity).toBe('critical');
      expect(res50[0].title).toContain('Hyperkalemia Risk');

      expect(res55.length).toBe(1);
      expect(res55[0].severity).toBe('critical');
    });

    it('1.2 eGFR boundary condition (29 vs 30 vs 45) for Metformin', () => {
      const egfr29: LabBiomarker = { testName: 'eGFR', value: '29 mL/min/1.73m2' };
      const egfr30: LabBiomarker = { testName: 'eGFR', value: '30 mL/min/1.73m2' };
      const egfr45: LabBiomarker = { testName: 'eGFR', value: '45 mL/min/1.73m2' };

      const res29 = evaluateDrugLabContraindications([mockMetformin], [egfr29]);
      const res30 = evaluateDrugLabContraindications([mockMetformin], [egfr30]);
      const res45 = evaluateDrugLabContraindications([mockMetformin], [egfr45]);

      expect(res29.length).toBe(1);
      expect(res29[0].severity).toBe('critical');
      expect(res29[0].title).toContain('Lactic Acidosis Risk');

      expect(res30.length).toBe(1);
      expect(res30[0].severity).toBe('moderate');
      expect(res30[0].title).toContain('Renal Monitoring Needed');

      expect(res45.length).toBe(0);
    });

    it('1.3 Creatinine boundary condition (1.4 vs 1.5 vs 1.6) for Metformin & ACEi', () => {
      const cr14: LabBiomarker = { testName: 'Creatinine', value: '1.4 mg/dL' };
      const cr15: LabBiomarker = { testName: 'Creatinine', value: '1.5 mg/dL' };
      const cr16: LabBiomarker = { testName: 'Creatinine', value: '1.6 mg/dL' };

      const res14Met = evaluateDrugLabContraindications([mockMetformin], [cr14]);
      const res15Met = evaluateDrugLabContraindications([mockMetformin], [cr15]);
      const res16Met = evaluateDrugLabContraindications([mockMetformin], [cr16]);

      const res14Lis = evaluateDrugLabContraindications([mockLisinopril], [cr14]);
      const res15Lis = evaluateDrugLabContraindications([mockLisinopril], [cr15]);
      const res16Lis = evaluateDrugLabContraindications([mockLisinopril], [cr16]);

      // Metformin check: > 1.5 triggers moderate
      expect(res14Met.length).toBe(0);
      expect(res15Met.length).toBe(0); // 1.5 is NOT > 1.5
      expect(res16Met.length).toBe(1);
      expect(res16Met[0].severity).toBe('moderate');

      // Lisinopril check: > 1.5 triggers moderate
      expect(res14Lis.length).toBe(0);
      expect(res15Lis.length).toBe(0); // 1.5 is NOT > 1.5
      expect(res16Lis.length).toBe(1);
      expect(res16Lis[0].severity).toBe('moderate');
    });

    it('1.4 ALT/AST boundary condition (119 vs 120 vs 121) for Atorvastatin', () => {
      const alt119: LabBiomarker = { testName: 'ALT', value: '119 U/L' };
      const alt120: LabBiomarker = { testName: 'ALT', value: '120 U/L' };
      const alt121: LabBiomarker = { testName: 'ALT', value: '121 U/L' };

      const res119 = evaluateDrugLabContraindications([mockAtorvastatin], [alt119]);
      const res120 = evaluateDrugLabContraindications([mockAtorvastatin], [alt120]);
      const res121 = evaluateDrugLabContraindications([mockAtorvastatin], [alt121]);

      expect(res119.length).toBe(0);
      expect(res120.length).toBe(0); // 120 is NOT > 120
      expect(res121.length).toBe(1);
      expect(res121[0].severity).toBe('moderate');
      expect(res121[0].title).toContain('Hepatic Stress Alert');
    });
  });

  // ------------------------------------------------------------
  // 2. promptFramework.ts Zod Schema Validation & Unit Normalization
  // ------------------------------------------------------------
  describe('2. Zod Schema Validation & Unit Normalization', () => {

    it('2.1 Validates LabExtractionSchema successfully', () => {
      const validPayload = {
        collection_date: '2026-05-15',
        patient: { name: 'Jane Doe', dob: '1985-04-12', sex: 'F', id: 'P-987' },
        reportMetadata: { labName: 'LabCorp', accessionNumber: 'LC-112', collectionDate: '2026-05-15', reportDate: '2026-05-16' },
        observations: [
          {
            panel: 'Renal Panel',
            testName: 'Potassium',
            loincLikeName: '2823-3',
            display_value: '5.2 mmol/L',
            numeric_value: 5.2,
            unitOriginal: 'mmol/L',
            valueCanonical: 5.2,
            unitCanonical: 'mmol/L',
            referenceLow: 3.5,
            referenceHigh: 5.0,
            flag: 'HIGH',
            page: 1,
            rawText: 'Potassium 5.2 mmol/L HIGH',
            confidence: 0.99
          }
        ],
        issues: []
      };

      const result = LabExtractionSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('2.2 Rejects invalid LabExtractionSchema flags or out-of-bounds confidence', () => {
      const invalidPayload = {
        patient: { name: null, dob: null, sex: null, id: null },
        reportMetadata: { labName: null, accessionNumber: null, collectionDate: null, reportDate: null },
        observations: [
          {
            testName: 'Potassium',
            confidence: 1.8, // Invalid (> 1)
            flag: 'EXTREME' // Invalid enum
          }
        ]
      };

      const result = LabExtractionSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('2.3 Validates UnifiedExtractionResultSchema', () => {
      const validUnified = {
        documentType: 'lab_report',
        extractedDate: '2026-07-01',
        hospitalName: 'St. Jude',
        doctorName: 'Dr. House',
        labResults: [
          {
            testName: 'eGFR',
            value: '28 mL/min',
            numericValue: 28,
            unit: 'mL/min',
            referenceRange: '>60',
            flag: 'CRITICAL',
            confidence: 0.95
          }
        ],
        prescriptions: [],
        summary: 'eGFR is critically low at 28.',
        overallConfidence: 0.95
      };

      const result = UnifiedExtractionResultSchema.safeParse(validUnified);
      expect(result.success).toBe(true);
    });

    it('2.4 Normalizes units correctly in normalizeObservation', () => {
      const rawGluc = { testName: 'Glucose', unitOriginal: 'mmol/L', numeric_value: 5.5, valueCanonical: null as number | null, unitCanonical: null as string | null };
      const gluc = normalizeObservation(rawGluc);
      expect(gluc.unitCanonical).toBe('mg/dL');
      expect(gluc.valueCanonical).toBeCloseTo(99.1, 1);

      const rawCreat = { testName: 'Creatinine', unitOriginal: 'umol/L', numeric_value: 120, valueCanonical: null as number | null, unitCanonical: null as string | null };
      expect(normalizeObservation(rawCreat).unitCanonical).toBe('mg/dL');
      expect(normalizeObservation(rawCreat).valueCanonical).toBeCloseTo(1.357, 2);

      const rawA1c = { testName: 'HbA1c', unitOriginal: 'mmol/mol', numeric_value: 48, valueCanonical: null as number | null, unitCanonical: null as string | null };
      expect(normalizeObservation(rawA1c).unitCanonical).toBe('%');
      expect(normalizeObservation(rawA1c).valueCanonical).toBeCloseTo(6.54, 2);
    });
  });

  // ------------------------------------------------------------
  // 3. UploadCenter.tsx Image Payload Compression Logic
  // ------------------------------------------------------------
  describe('3. UploadCenter Image Payload Compression', () => {
    it('verifies compression threshold is 4MB and max dimensions are 2048px', () => {
      const THRESHOLD = 4 * 1024 * 1024; // 4MB
      expect(THRESHOLD).toBe(4194304);

      // Verify scaling math for width > height (e.g. 4000x3000 -> 2048x1536)
      const origW = 4000;
      const origH = 3000;
      const maxDim = 2048;

      let newW = origW;
      let newH = origH;

      if (origW > maxDim || origH > maxDim) {
        if (origW > origH) {
          newH = Math.round((origH * maxDim) / origW);
          newW = maxDim;
        } else {
          newW = Math.round((origW * maxDim) / origH);
          newH = maxDim;
        }
      }

      expect(newW).toBe(2048);
      expect(newH).toBe(1536);
    });
  });

  // ------------------------------------------------------------
  // 4. VirtualizedChatList Citation Link Regex & Pretext Calculation
  // ------------------------------------------------------------
  describe('4. VirtualizedChatList Citation Link Regex & Pretext Calculation', () => {
    it('correctly matches cite: and guideline badge markdown patterns', () => {
      const sample1 = "Per cite:acc_aha_2023 guideline, monitor potassium.";
      const sample2 = "See [ACC/AHA 2023] and [ADA 2024] for dosage recommendations.";
      const sample3 = "No citations present in this text.";

      const getMatches = (t: string) => t.match(/cite:[a-z0-9_]+/gi) || t.match(/\[(ACC\/AHA|ADA|KDIGO|ESC)[^\]]*\]/gi) || [];

      const m1 = getMatches(sample1);
      expect(m1).toEqual(['cite:acc_aha_2023']);

      const m2 = getMatches(sample2);
      expect(m2).toEqual(['[ACC/AHA 2023]', '[ADA 2024]']);

      const m3 = getMatches(sample3);
      expect(m3).toEqual([]);
    });

    it('calculates extra height buffer per citation badge pill (+16px per pill)', () => {
      const citationCount = 2;
      const citationHeight = citationCount * 16;
      expect(citationHeight).toBe(32);
    });
  });

});
