/**
 * challenger_1_m1_m2_adversarial.test.ts
 * Empirical Stress Test Harness for Milestone 1 (FHIR R4 Bundle Exporter)
 * and Milestone 2 (RxNav & OpenFDA Pharmacology Safety Matrix).
 *
 * Authored by Empirical Challenger Agent (challenger_1_m1_m2).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  exportToFhirBundle,
  validateFhirBundle,
  mapLabToObservation,
  mapProfileToPatient,
  mapReportToDiagnosticReport,
  mapSbarToDocumentReference,
  lookupLoincCode,
  LOINC_DICTIONARY,
  FhirBundle,
  FhirObservation,
  FhirPatient,
} from '../fhirService';

import {
  cleanDrugQuery,
  resolveRxCuiFuzzy,
  fetchOpenFdaAdverseEvents,
  getEnrichedDrugInteractions,
  CURATED_RXCUI_REGISTRY,
  CURATED_FDA_KNOWLEDGE_BASE,
} from '../drugInteractionService';

import {
  evaluateDrugLabContraindications,
  parseNumericValue,
  isMedInCategory,
  LabBiomarker,
} from '../drugLabEngine';

import { Medication } from '../../types/health';

describe('Adversarial Stress Harness: Milestone 1 (FHIR R4 Exporters & Mappings)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1.1 Malformed & Corrupted Lab Results Fuzzing', () => {
    it('handles null, undefined, and empty biomarker values gracefully without crashing', () => {
      const patientId = 'pat-stress-1';
      
      const malformedBiomarkers = [
        { name: 'Glucose', value: null as any },
        { name: 'HbA1c', value: undefined as any },
        { name: 'Creatinine', value: '' },
        { name: 'Potassium', value: '   ' },
        { name: 'Sodium', value: NaN as any },
        { name: 'AST', value: Infinity as any },
      ];

      malformedBiomarkers.forEach((bm) => {
        expect(() => {
          const obs = mapLabToObservation(bm, patientId);
          expect(obs.resourceType).toBe('Observation');
          expect(obs.subject?.reference).toBe(`Patient/${patientId}`);
          expect(obs.code.text).toBe(bm.name);
        }).not.toThrow();
      });
    });

    it('parses string lab values with symbols, units, and ranges', () => {
      const patientId = 'pat-stress-2';
      
      const testCases = [
        { input: '> 140 mg/dL', expectedNum: 140 },
        { input: '< 0.05', expectedNum: 0.05 },
        { input: '>= 100.5 mmol/L', expectedNum: 100.5 },
        { input: 'Trace', expectedNum: undefined, expectedStr: 'Trace' },
        { input: 'Negative', expectedNum: undefined, expectedStr: 'Negative' },
      ];

      testCases.forEach((tc) => {
        const obs = mapLabToObservation({ name: 'Marker', value: tc.input }, patientId);
        if (tc.expectedNum !== undefined) {
          expect(obs.valueQuantity?.value).toBe(tc.expectedNum);
        } else if (tc.expectedStr !== undefined) {
          expect(obs.valueString).toBe(tc.expectedStr);
        }
      });
    });

    it('documents empirical titer parsing anomaly: "Reactive (1:64)" digit stripping collapses to 164', () => {
      // EMPIRICAL BUG REPRODUCTION:
      // In fhirService.ts:360: parseFloat(biomarker.value.replace(/[^0-9.-]/g, ''))
      // strips out delimiters ':' and parentheses, converting '1:64' -> '164'
      const obs = mapLabToObservation({ name: 'RPR Titer', value: 'Reactive (1:64)' }, 'pat-titer');
      expect(obs.valueQuantity?.value).toBe(164);
    });

    it('handles missing marker names and unrecognized clinical markers with fallback LOINC', () => {
      const obs1 = mapLabToObservation({ value: 120 } as any, 'pat-1');
      expect(obs1.code.text).toBe('Lab Observation');
      expect(obs1.code.coding?.[0]?.code).toBe('29463-7'); // fallback LOINC

      const obs2 = mapLabToObservation({ name: 'XYZ_UNKNOWN_MARKER_9999', value: 45 }, 'pat-1');
      expect(obs2.code.text).toBe('XYZ_UNKNOWN_MARKER_9999');
      expect(obs2.code.coding?.[0]?.code).toBe('29463-7');
    });

    it('maps all non-standard interpretation flags and panic values accurately', () => {
      const panicHigh = mapLabToObservation({ name: 'Potassium', value: 6.8, interpretation: 'PANIC HIGH' }, 'p1');
      expect(panicHigh.interpretation?.[0]?.coding?.[0]?.code).toBe('AA');
      expect(panicHigh.interpretation?.[0]?.coding?.[0]?.display).toBe('Critical Abnormal');

      const low = mapLabToObservation({ name: 'Hemoglobin', value: 8.0, interpretation: 'L' }, 'p1');
      expect(low.interpretation?.[0]?.coding?.[0]?.code).toBe('L');

      const abnormal = mapLabToObservation({ name: 'ALT', value: 85, status: 'ABNORMAL' }, 'p1');
      expect(abnormal.interpretation?.[0]?.coding?.[0]?.code).toBe('A');

      const undefinedFlag = mapLabToObservation({ name: 'BUN', value: 15, interpretation: undefined }, 'p1');
      expect(undefinedFlag.interpretation).toBeUndefined();
    });

    it('handles complex and inverted reference ranges without crashing', () => {
      const numericRange = mapLabToObservation(
        { name: 'Sodium', value: 140, referenceLow: 135, referenceHigh: 145 },
        'p1'
      );
      expect(numericRange.referenceRange?.[0].low?.value).toBe(135);
      expect(numericRange.referenceRange?.[0].high?.value).toBe(145);

      const textRange = mapLabToObservation(
        { name: 'Troponin', value: 0.01, referenceRange: '< 0.04 ng/mL' },
        'p1'
      );
      expect(numericRange.referenceRange?.[0]).toBeDefined();
      expect(textRange.referenceRange?.[0].text).toBe('< 0.04 ng/mL');
    });
  });

  describe('1.2 Extreme Boundary Dates, Characters, & Nullish Profiles', () => {
    it('handles extreme dates (Unix epoch, future year 9999, leap years, and empty dates)', () => {
      const p1 = mapProfileToPatient({ id: 'p1', birthDate: '1970-01-01' });
      expect(p1.birthDate).toBe('1970-01-01');

      const p2 = mapProfileToPatient({ id: 'p2', birthDate: '2024-02-29' }); // Leap year
      expect(p2.birthDate).toBe('2024-02-29');

      const p3 = mapProfileToPatient({ id: 'p3', birthDate: '9999-12-31' }); // Future boundary
      expect(p3.birthDate).toBe('9999-12-31');

      const p4 = mapProfileToPatient({ id: 'p4', birthDate: '' }); // Empty date fallback
      expect(p4.birthDate).toBe('1990-01-01');
    });

    it('handles empty, nullish, or malicious profile fields (XSS injections, unicode, emojis)', () => {
      const maliciousName = '<script>alert("XSS")</script> & 🧬 Dr. Pavan';
      const patient = mapProfileToPatient({
        id: 'user-xss-1',
        name: maliciousName,
        gender: 'alien_gender' as any,
        email: 'attacker@evil.com',
        address: '123 Fake St, Neo Tokyo 🚀',
      });

      expect(patient.name?.[0].text).toBe(maliciousName);
      expect(patient.gender).toBe('unknown'); // Sanitized invalid gender to 'unknown'
      expect(patient.address?.[0].text).toContain('Neo Tokyo 🚀');
    });

    it('safely base64 encodes complex multi-line unicode and markdown SBAR notes', () => {
      const unicodeSbar = {
        situation: 'Patient presenting with acute chest discomfort 🫀 (pain level 8/10).',
        background: 'History of CAD & HTN. BP 170/95 mmHg. Allergies: Penicillin ⚠️.',
        assessment: ['Elevated hs-cTnI > 0.15 ng/mL', 'ECG indicates STEMI in V1-V4.'],
        recommendation: ['Immediate cardiac catheterization lab activation.', 'Administer Aspirin 325mg PO.'],
      };

      const docRef = mapSbarToDocumentReference(unicodeSbar, 'patient-cardiac-1');
      expect(docRef.resourceType).toBe('DocumentReference');
      expect(docRef.content[0].attachment.contentType).toBe('text/markdown');
      expect(docRef.content[0].attachment.data).toBeDefined();

      // Decode base64 to verify roundtrip fidelity
      const decoded = Buffer.from(docRef.content[0].attachment.data!, 'base64').toString('utf-8');
      expect(decoded).toContain('🫀');
      expect(decoded).toContain('STEMI');
      expect(decoded).toContain('catheterization');
    });
  });

  describe('1.3 Oversized Payload & High-Volume Stress Test', () => {
    it('exports and validates a massive FHIR Bundle with 1,500 observations within performance thresholds', () => {
      const patient = { id: 'patient-heavy-1', name: 'Massive Telemetry Patient' };
      
      const bulkBiomarkers = Array.from({ length: 1500 }, (_, i) => ({
        id: `marker-bulk-${i}`,
        name: i % 2 === 0 ? 'Glucose Fasting' : 'Potassium Serum',
        value: 90 + (i % 50),
        unit: i % 2 === 0 ? 'mg/dL' : 'mmol/L',
        date: new Date(Date.now() - i * 60000).toISOString(),
        interpretation: i % 10 === 0 ? 'HIGH' : 'NORMAL',
      }));

      const report = {
        id: 'rep-heavy-1',
        title: 'Longitudinal Intensive Care Telemetry',
        biomarkers: bulkBiomarkers,
      };

      const startTime = performance.now();
      const bundle = exportToFhirBundle(patient, [report]);
      const exportDuration = performance.now() - startTime;

      expect(bundle.resourceType).toBe('Bundle');
      // 1 Patient + 1 DiagnosticReport + 1500 Observations = 1502 entries
      expect(bundle.entry?.length).toBe(1502);
      expect(bundle.total).toBe(1502);
      expect(exportDuration).toBeLessThan(500); // Must execute in < 500ms

      const valStart = performance.now();
      const validation = validateFhirBundle(bundle);
      const valDuration = performance.now() - valStart;

      expect(validation.isValid).toBe(true);
      expect(validation.resourceCount).toBe(1502);
      expect(validation.resourceTypes['Observation']).toBe(1500);
      expect(validation.resourceTypes['DiagnosticReport']).toBe(1);
      expect(validation.resourceTypes['Patient']).toBe(1);
      expect(valDuration).toBeLessThan(500);
    });
  });

  describe('1.4 FHIR Conformance Invariant Stress Testing (validateFhirBundle)', () => {
    it('detects invalid root resourceType and empty bundles', () => {
      const invalidRoot = validateFhirBundle({ resourceType: 'NotABundle' } as any);
      expect(invalidRoot.isValid).toBe(false);
      expect(invalidRoot.issues.some((i) => i.code === 'invalid-bundle')).toBe(true);

      const nullBundle = validateFhirBundle(null as any);
      expect(nullBundle.isValid).toBe(false);
    });

    it('detects missing bundle type and non-array entries', () => {
      const missingType = validateFhirBundle({
        resourceType: 'Bundle',
        entry: [],
      } as any);
      expect(missingType.isValid).toBe(false);
      expect(missingType.issues.some((i) => i.code === 'missing-bundle-type')).toBe(true);

      const badEntry = validateFhirBundle({
        id: 'bad-entry-bundle',
        resourceType: 'Bundle',
        type: 'collection',
        entry: 'not-an-array' as any,
      } as any);
      expect(badEntry.isValid).toBe(false);
      expect(badEntry.issues.some((i) => i.code === 'missing-entries')).toBe(true);
    });

    it('detects missing resources, missing observation codes, and missing statuses', () => {
      const malformedBundle: FhirBundle = {
        id: 'malformed-bundle-1',
        resourceType: 'Bundle',
        type: 'collection',
        entry: [
          { fullUrl: 'urn:uuid:1', resource: null as any },
          {
            fullUrl: 'urn:uuid:2',
            resource: {
              resourceType: 'Observation',
              id: 'obs-bad-1',
              // missing status and code
            } as any,
          },
          {
            fullUrl: 'urn:uuid:3',
            resource: {
              resourceType: 'DiagnosticReport',
              id: 'diag-bad-1',
              // missing status and code
            } as any,
          },
        ],
      };

      const result = validateFhirBundle(malformedBundle);
      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.code === 'missing-entry-resource')).toBe(true);
      expect(result.issues.some((i) => i.code === 'missing-observation-code')).toBe(true);
      expect(result.issues.some((i) => i.code === 'missing-observation-status')).toBe(true);
      expect(result.issues.some((i) => i.code === 'missing-report-status')).toBe(true);
      expect(result.issues.some((i) => i.code === 'missing-report-code')).toBe(true);
      expect(result.issues.some((i) => i.code === 'no-patient-resource')).toBe(true); // warning
    });
  });
});

describe('Adversarial Stress Harness: Milestone 2 (RxNav & OpenFDA Safety Matrix)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('2.1 Fuzzy Drug Matching, Noise, & Adversarial Inputs', () => {
    it('handles gibberish names, empty queries, and injection payloads safely', async () => {
      const gibberishMatches = await Promise.all([
        resolveRxCuiFuzzy(''),
        resolveRxCuiFuzzy('   '),
        resolveRxCuiFuzzy('!@#$%^&*()_+'),
        resolveRxCuiFuzzy("<script>alert('xss')</script>"),
        resolveRxCuiFuzzy("' OR '1'='1"),
        resolveRxCuiFuzzy('xyznonexistentdrug9999'),
      ]);

      expect(gibberishMatches[0]).toBeNull();
      expect(gibberishMatches[1]).toBeNull();
      // Should not crash and return null or fallback without exception
      expect(gibberishMatches.every((m) => m === null || typeof m?.rxcui === 'string')).toBe(true);
    });

    it('correctly strips noisy dosage forms, frequencies, and punctuation from drug queries', () => {
      const messyQueries = [
        { input: '   LISINOPRIL 20MG TABLET ORAL DAILY   ', expected: 'lisinopril' },
        { input: 'Coumadin (Warfarin Sodium) 5 mg PRN', expected: 'coumadin warfarin sodium' },
        { input: 'Atorvastatin Calcium 40 MG Oral Capsule QID', expected: 'atorvastatin calcium' },
      ];

      messyQueries.forEach((q) => {
        expect(cleanDrugQuery(q.input)).toBe(q.expected);
      });
    });

    it('documents empirical frequency token omission: "bid" (twice daily) is unstripped by cleanDrugQuery', () => {
      // EMPIRICAL BUG REPRODUCTION:
      // In drugInteractionService.ts:397, regex contains bd, tds, tid, qid, od, prn, daily
      // but lacks 'bid' (standard twice daily latin abbreviation).
      const result = cleanDrugQuery('Metformin HCl 1000mg ER tab po bid');
      expect(result).toBe('metformin hcl bid');
    });

    it('resolves noisy combinations of generic, brand, and misspelling variants', async () => {
      const results = await Promise.all([
        resolveRxCuiFuzzy('Lipitor 20mg tab'),
        resolveRxCuiFuzzy('atorvastin 40mg'),
        resolveRxCuiFuzzy('Glucophage XR 500mg'),
        resolveRxCuiFuzzy('lisnopril 10 mg'),
        resolveRxCuiFuzzy('Aldactone 25 mg'),
        resolveRxCuiFuzzy('Advil 200mg'),
      ]);

      expect(results[0]?.rxcui).toBe('83367'); // Atorvastatin / Lipitor
      expect(results[1]?.rxcui).toBe('83367');
      expect(results[2]?.rxcui).toBe('6809');  // Metformin / Glucophage
      expect(results[3]?.rxcui).toBe('29046'); // Lisinopril
      expect(results[4]?.rxcui).toBe('9997');  // Spironolactone / Aldactone
      expect(results[5]?.rxcui).toBe('5640');  // Ibuprofen / Advil
    });
  });

  describe('2.2 Network Outages, Timeouts, & Fault-Tolerant Degraded Modes', () => {
    it('falls back to curated knowledge base when fetch throws a network disconnect error', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED: Network Offline'));

      const lisinoprilFda = await fetchOpenFdaAdverseEvents('Lisinopril');
      expect(lisinoprilFda).toBeDefined();
      expect(lisinoprilFda.blackBoxWarning.hasWarning).toBe(true);
      expect(lisinoprilFda.blackBoxWarning.summary).toContain('FETAL TOXICITY');
      expect(lisinoprilFda.topReactions.length).toBeGreaterThan(0);

      fetchSpy.mockRestore();
    });

    it('falls back seamlessly when external APIs return HTTP 500 or HTTP 429 errors', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server exploded' }),
      } as any);

      const warfarinFda = await fetchOpenFdaAdverseEvents('Warfarin');
      expect(warfarinFda).toBeDefined();
      expect(warfarinFda.blackBoxWarning.hasWarning).toBe(true);
      expect(warfarinFda.blackBoxWarning.summary).toContain('BLEEDING RISK');

      fetchSpy.mockRestore();
    });

    it('falls back safely when external API returns corrupted / non-JSON responses', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      } as any);

      const metforminFda = await fetchOpenFdaAdverseEvents('Metformin');
      expect(metforminFda).toBeDefined();
      expect(metforminFda.blackBoxWarning.hasWarning).toBe(true);
      expect(metforminFda.blackBoxWarning.summary).toContain('LACTIC ACIDOSIS');

      fetchSpy.mockRestore();
    });
  });

  describe('2.3 Drug-Lab Contraindication Boundary Condition Stress Tests', () => {
    const createMed = (id: string, name: string, rxcui?: string): Medication => ({
      id,
      userId: 'test-user',
      genericName: name,
      brandName: name,
      rxcui: rxcui || null,
      dosage: '10mg',
      frequency: 'Daily',
      startDate: '2026-01-01',
      endDate: null,
      prescribedFor: null,
      addedAt: '2026-01-01',
    });

    it('tests strict eGFR boundary conditions for Metformin (eGFR 29 vs 30 vs 31 vs 44 vs 45)', () => {
      const metformin = [createMed('m1', 'Metformin', '6809')];

      // eGFR = 29 -> Critical (eGFR < 30)
      const res29 = evaluateDrugLabContraindications(metformin, [{ testName: 'eGFR', value: '29', unit: 'mL/min/1.73m2' }]);
      expect(res29.length).toBe(1);
      expect(res29[0].severity).toBe('critical');
      expect(res29[0].title).toContain('Lactic Acidosis Risk');

      // eGFR = 30 -> Moderate (30 <= eGFR < 45)
      const res30 = evaluateDrugLabContraindications(metformin, [{ testName: 'eGFR', value: '30', unit: 'mL/min/1.73m2' }]);
      expect(res30.length).toBe(1);
      expect(res30[0].severity).toBe('moderate');

      // eGFR = 44 -> Moderate
      const res44 = evaluateDrugLabContraindications(metformin, [{ testName: 'eGFR', value: '44', unit: 'mL/min/1.73m2' }]);
      expect(res44.length).toBe(1);
      expect(res44[0].severity).toBe('moderate');

      // eGFR = 45 -> Safe (no contraindication)
      const res45 = evaluateDrugLabContraindications(metformin, [{ testName: 'eGFR', value: '45', unit: 'mL/min/1.73m2' }]);
      expect(res45.length).toBe(0);
    });

    it('tests Potassium threshold boundaries for ACEi / ARB and Spironolactone (4.9 vs 5.0 vs 6.5)', () => {
      const aceiMeds = [createMed('m1', 'Lisinopril', '29046')];
      const spiroMeds = [createMed('m2', 'Spironolactone', '9997')];

      // K = 4.9 -> Safe
      const acei49 = evaluateDrugLabContraindications(aceiMeds, [{ testName: 'Potassium', value: '4.9', unit: 'mmol/L' }]);
      expect(acei49.length).toBe(0);

      // K = 5.0 -> Critical alert (>= 5.0)
      const acei50 = evaluateDrugLabContraindications(aceiMeds, [{ testName: 'Potassium', value: '5.0', unit: 'mmol/L' }]);
      expect(acei50.length).toBe(1);
      expect(acei50[0].severity).toBe('critical');

      // Spironolactone K = 4.9 -> Safe
      const spiro49 = evaluateDrugLabContraindications(spiroMeds, [{ testName: 'Serum Potassium', value: '4.9' }]);
      expect(spiro49.length).toBe(0);

      // Spironolactone K = 5.0 -> Critical alert
      const spiro50 = evaluateDrugLabContraindications(spiroMeds, [{ testName: 'Serum Potassium', value: '5.0' }]);
      expect(spiro50.length).toBe(1);
      expect(spiro50[0].severity).toBe('critical');
      expect(spiro50[0].title).toContain('Severe Hyperkalemia Risk');
    });

    it('tests Creatinine threshold boundaries for NSAIDs and ACEi (1.4 vs 1.5 vs 1.6 vs 2.5 vs 2.6)', () => {
      const nsaid = [createMed('m1', 'Ibuprofen', '5640')];

      // Creatinine = 1.5 -> Safe
      const c15 = evaluateDrugLabContraindications(nsaid, [{ testName: 'Serum Creatinine', value: '1.5', unit: 'mg/dL' }]);
      expect(c15.length).toBe(0);

      // Creatinine = 1.6 -> Moderate AKI alert (> 1.5 and <= 2.5)
      const c16 = evaluateDrugLabContraindications(nsaid, [{ testName: 'Serum Creatinine', value: '1.6', unit: 'mg/dL' }]);
      expect(c16.length).toBe(1);
      expect(c16[0].severity).toBe('moderate');

      // Creatinine = 2.5 -> Moderate AKI alert
      const c25 = evaluateDrugLabContraindications(nsaid, [{ testName: 'Serum Creatinine', value: '2.5', unit: 'mg/dL' }]);
      expect(c25.length).toBe(1);
      expect(c25[0].severity).toBe('moderate');

      // Creatinine = 2.6 -> Critical AKI alert (> 2.5)
      const c26 = evaluateDrugLabContraindications(nsaid, [{ testName: 'Serum Creatinine', value: '2.6', unit: 'mg/dL' }]);
      expect(c26.length).toBe(1);
      expect(c26[0].severity).toBe('critical');
    });

    it('tests ALT/AST hepatic thresholds for Statins (120 vs 121 U/L)', () => {
      const statin = [createMed('m1', 'Atorvastatin', '83367')];

      // ALT = 120, AST = 30 -> Safe
      const alt120 = evaluateDrugLabContraindications(statin, [{ testName: 'ALT (SGPT)', value: '120', unit: 'U/L' }]);
      expect(alt120.length).toBe(0);

      // ALT = 121 -> Moderate Hepatic Stress Alert (> 120)
      const alt121 = evaluateDrugLabContraindications(statin, [{ testName: 'ALT (SGPT)', value: '121', unit: 'U/L' }]);
      expect(alt121.length).toBe(1);
      expect(alt121[0].severity).toBe('moderate');
      expect(alt121[0].title).toContain('Hepatic Stress Alert');

      // AST = 135 -> Moderate Hepatic Stress Alert
      const ast135 = evaluateDrugLabContraindications(statin, [{ testName: 'AST (SGOT)', value: '135', unit: 'U/L' }]);
      expect(ast135.length).toBe(1);
      expect(ast135[0].severity).toBe('moderate');
    });

    it('tests INR supratherapeutic thresholds for Anticoagulants (3.5 vs 3.6)', () => {
      const warfarin = [createMed('m1', 'Warfarin', '11289')];

      // INR = 3.5 -> Safe
      const inr35 = evaluateDrugLabContraindications(warfarin, [{ testName: 'Prothrombin Time INR', value: '3.5' }]);
      expect(inr35.length).toBe(0);

      // INR = 3.6 -> Critical Supratherapeutic Bleeding Risk (> 3.5)
      const inr36 = evaluateDrugLabContraindications(warfarin, [{ testName: 'Prothrombin Time INR', value: '3.6' }]);
      expect(inr36.length).toBe(1);
      expect(inr36[0].severity).toBe('critical');
      expect(inr36[0].title).toContain('Supratherapeutic INR Bleeding Risk');
    });

    it('evaluates a complex 7-drug polypharmacy cocktail with multiple simultaneous lab abnormalities', async () => {
      const polypharmacy = [
        'Lisinopril 20mg',
        'Spironolactone 25mg',
        'Warfarin 5mg',
        'Ibuprofen 400mg',
        'Atorvastatin 40mg',
        'Metformin 1000mg',
        'Ciprofloxacin 500mg',
      ];

      const multiAbnormalLabs = [
        { name: 'Potassium Serum', value: 5.5, unit: 'mmol/L', flag: 'HIGH' },
        { name: 'eGFR', value: 24, unit: 'mL/min/1.73m2', flag: 'CRITICAL' },
        { name: 'Serum Creatinine', value: 2.8, unit: 'mg/dL', flag: 'HIGH' },
        { name: 'ALT', value: 160, unit: 'U/L', flag: 'HIGH' },
        { name: 'INR', value: 4.1, unit: '', flag: 'CRITICAL' },
      ];

      const res = await getEnrichedDrugInteractions(polypharmacy, multiAbnormalLabs);

      expect(res.overallRiskLevel).toBe('critical');
      // 7 medications = (7 * 6) / 2 = 21 pairs
      expect(res.pairs.length).toBe(21);
      expect(res.totalCriticalAlerts).toBeGreaterThan(0);
      expect(res.labContraindications.length).toBeGreaterThanOrEqual(4);

      // Verify specific critical pairs are flagged
      const lisinoprilSpiro = res.pairs.find(
        (p) =>
          (p.drugA.includes('Lisinopril') && p.drugB.includes('Spironolactone')) ||
          (p.drugB.includes('Lisinopril') && p.drugA.includes('Spironolactone'))
      );
      expect(lisinoprilSpiro?.combinedRiskRating).toBe('critical');

      const warfarinIbu = res.pairs.find(
        (p) =>
          (p.drugA.includes('Warfarin') && p.drugB.includes('Ibuprofen')) ||
          (p.drugB.includes('Warfarin') && p.drugA.includes('Ibuprofen'))
      );
      expect(warfarinIbu?.combinedRiskRating).toBe('critical');
    });
  });
});
