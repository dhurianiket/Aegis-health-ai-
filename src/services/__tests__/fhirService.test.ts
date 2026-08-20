import { describe, it, expect, vi } from 'vitest';
import {
  LOINC_DICTIONARY,
  lookupLoincCode,
  mapProfileToPatient,
  mapLabToObservation,
  mapReportToDiagnosticReport,
  mapSbarToDocumentReference,
  exportToFhirBundle,
  validateFhirBundle,
  downloadFhirJson,
  convertToFHIRPatient,
  convertToFHIRObservation,
  convertReportToFHIRBundle,
} from '../fhirService';

describe('FHIR R4 Service Suite', () => {
  describe('LOINC Dictionary & Terminology Resolver', () => {
    it('contains 40+ standard biomarker definitions', () => {
      const keys = Object.keys(LOINC_DICTIONARY);
      expect(keys.length).toBeGreaterThanOrEqual(40);
      expect(LOINC_DICTIONARY.hba1c.code).toBe('4548-4');
      expect(LOINC_DICTIONARY.creatinine.code).toBe('2160-0');
      expect(LOINC_DICTIONARY.total_cholesterol.code).toBe('2093-3');
      expect(LOINC_DICTIONARY.alt.code).toBe('1742-6');
      expect(LOINC_DICTIONARY.potassium.code).toBe('2823-3');
    });

    it('fuzzy resolves test names to canonical LOINC codes', () => {
      expect(lookupLoincCode('HbA1c (Glycated Hemoglobin)').code).toBe('4548-4');
      expect(lookupLoincCode('Fasting Blood Sugar').code).toBe('2345-7');
      expect(lookupLoincCode('Serum Creatinine').code).toBe('2160-0');
      expect(lookupLoincCode('eGFR (Estimated GFR)').code).toBe('33914-3');
      expect(lookupLoincCode('Lipid Panel - HDL Cholesterol').code).toBe('2085-9');
      expect(lookupLoincCode('SGPT / ALT Enzymatic').code).toBe('1742-6');
      expect(lookupLoincCode('Complete Blood Count Hemoglobin').code).toBe('718-7');
      expect(lookupLoincCode('Potassium Serum').code).toBe('2823-3');
      expect(lookupLoincCode('Thyroid Stimulating Hormone (TSH)').code).toBe('3016-3');
      expect(lookupLoincCode('Vitamin D, 25-Hydroxy').code).toBe('1989-3');
      expect(lookupLoincCode('Unknown Exotic Biomarker').code).toBe('29463-7');
    });
  });

  describe('Resource Mappings (Patient, Observation, DiagnosticReport, DocumentReference)', () => {
    it('maps user profile to valid HL7 FHIR Patient', () => {
      const patient = mapProfileToPatient({
        id: 'usr-999',
        fullName: 'Aniket Dhuri',
        gender: 'Male',
        dob: '1992-05-15',
        email: 'dhurianiket@gmail.com',
        phone: '+91 98765 43210',
        address: 'Powai, Mumbai',
      });

      expect(patient.resourceType).toBe('Patient');
      expect(patient.id).toBe('usr-999');
      expect(patient.name?.[0].text).toBe('Aniket Dhuri');
      expect(patient.gender).toBe('male');
      expect(patient.birthDate).toBe('1992-05-15');
      expect(patient.telecom?.length).toBe(2);
      expect(patient.meta?.profile).toContain('https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient');
    });

    it('maps lab result to valid HL7 FHIR Observation with interpretation and ranges', () => {
      const obs = mapLabToObservation(
        {
          name: 'Serum Potassium',
          value: 5.4,
          unit: 'mmol/L',
          referenceLow: 3.5,
          referenceHigh: 5.0,
          interpretation: 'high',
        },
        'usr-999'
      );

      expect(obs.resourceType).toBe('Observation');
      expect(obs.code.coding?.[0].code).toBe('2823-3');
      expect(obs.subject?.reference).toBe('Patient/usr-999');
      expect(obs.valueQuantity?.value).toBe(5.4);
      expect(obs.valueQuantity?.unit).toBe('mmol/L');
      expect(obs.interpretation?.[0].coding?.[0].code).toBe('H');
      expect(obs.referenceRange?.[0].low?.value).toBe(3.5);
      expect(obs.referenceRange?.[0].high?.value).toBe(5.0);
    });

    it('maps critical lab result to AA interpretation', () => {
      const obs = mapLabToObservation(
        {
          name: 'Fasting Blood Glucose',
          value: 380,
          unit: 'mg/dL',
          interpretation: 'critical',
        },
        'usr-999'
      );
      expect(obs.interpretation?.[0].coding?.[0].code).toBe('AA');
    });

    it('maps lab report and child observations into DiagnosticReport', () => {
      const obs1 = mapLabToObservation({ name: 'HbA1c', value: 6.2, unit: '%' }, 'usr-999');
      const obs2 = mapLabToObservation({ name: 'eGFR', value: 88, unit: 'mL/min' }, 'usr-999');

      const diag = mapReportToDiagnosticReport(
        {
          id: 'rep-101',
          title: 'Comprehensive Metabolic Panel',
          hospitalName: 'Suburban Diagnostics',
          doctorName: 'Dr. Sharma',
          summary: 'Metabolic markers within acceptable target range.',
        },
        [obs1, obs2],
        'usr-999'
      );

      expect(diag.resourceType).toBe('DiagnosticReport');
      expect(diag.id).toBe('diag-rep-101');
      expect(diag.subject?.reference).toBe('Patient/usr-999');
      expect(diag.result?.length).toBe(2);
      expect(diag.performer?.[0].display).toBe('Suburban Diagnostics');
      expect(diag.resultsInterpreter?.[0].display).toBe('Dr. Sharma');
    });

    it('maps SBAR clinical handover to FHIR DocumentReference with LOINC 34133-9', () => {
      const sbarNote = {
        situation: 'Patient presenting with elevated HbA1c and hypertension.',
        background: 'T2D diagnosed 2021, on Metformin 500mg BD.',
        assessment: ['HbA1c elevated at 7.8%', 'Blood pressure 142/88 mmHg'],
        recommendation: ['Titrate Metformin to 1000mg BD', 'Initiate Lisinopril 5mg OD'],
      };

      const docRef = mapSbarToDocumentReference(sbarNote, 'usr-999');

      expect(docRef.resourceType).toBe('DocumentReference');
      expect(docRef.type?.coding?.[0].code).toBe('34133-9');
      expect(docRef.category?.[0].coding?.[0].code).toBe('11506-3');
      expect(docRef.content?.[0].attachment.contentType).toBe('text/markdown');
      expect(docRef.content?.[0].attachment.data).toBeTruthy();
    });
  });

  describe('Bundle Generation & Conformance Validation', () => {
    it('creates a complete multi-resource FHIR R4 Bundle and validates with zero errors', () => {
      const bundle = exportToFhirBundle(
        { id: 'usr-999', name: 'Aniket Dhuri', email: 'dhurianiket@gmail.com' },
        [
          {
            id: 'rep-01',
            title: 'Lipid Panel',
            biomarkers: [
              { name: 'Total Cholesterol', value: 210, unit: 'mg/dL', interpretation: 'high' },
              { name: 'HDL Cholesterol', value: 45, unit: 'mg/dL', interpretation: 'normal' },
              { name: 'Triglycerides', value: 160, unit: 'mg/dL', interpretation: 'high' },
            ],
          },
        ],
        { situation: 'Routine wellness check', background: 'Healthy adult', assessment: 'Borderline lipids', recommendation: 'Dietary modifications' }
      );

      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('collection');
      // Patient (1) + DiagnosticReport (1) + Observations (3) + SBAR DocumentReference (1) = 6
      expect(bundle.entry.length).toBe(6);

      const validation = validateFhirBundle(bundle);
      expect(validation.isValid).toBe(true);
      expect(validation.issues.filter((i) => i.severity === 'error').length).toBe(0);
      expect(validation.resourceTypes['Patient']).toBe(1);
      expect(validation.resourceTypes['DiagnosticReport']).toBe(1);
      expect(validation.resourceTypes['Observation']).toBe(3);
      expect(validation.resourceTypes['DocumentReference']).toBe(1);
    });

    it('detects invalid bundles and missing mandatory elements', () => {
      const invalidBundle: any = {
        resourceType: 'NotABundle',
      };
      const val1 = validateFhirBundle(invalidBundle);
      expect(val1.isValid).toBe(false);
      expect(val1.issues[0].code).toBe('invalid-bundle');

      const emptyBundle: any = {
        resourceType: 'Bundle',
        type: 'collection',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-bad',
              // missing code and status
            },
          },
        ],
      };
      const val2 = validateFhirBundle(emptyBundle);
      expect(val2.isValid).toBe(false);
      expect(val2.issues.some((i) => i.code === 'missing-observation-code')).toBe(true);
    });
  });

  describe('Backward Compatibility Aliases', () => {
    it('maintains legacy convertToFHIRPatient, convertToFHIRObservation, and convertReportToFHIRBundle signatures', () => {
      const pat = convertToFHIRPatient({ id: 'p1', name: 'Test' });
      expect(pat.resourceType).toBe('Patient');

      const obs = convertToFHIRObservation({ name: 'Glucose', value: 100 }, 'p1');
      expect(obs.resourceType).toBe('Observation');

      const bundle = convertReportToFHIRBundle(
        { id: 'r1', title: 'Panel', date: '2026-08-20', biomarkers: [{ name: 'HbA1c', value: 5.5 }] },
        { id: 'p1', name: 'Test' }
      );
      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.entry.length).toBe(3); // Patient + DiagnosticReport + Observation
    });
  });

  describe('Download Helper', () => {
    it('handles downloadFhirJson in browser/DOM mock environment safely', () => {
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const bundle = exportToFhirBundle({ id: 'p1', name: 'Test' });
      expect(() => downloadFhirJson(bundle, 'test_export.json')).not.toThrow();
    });
  });
});
