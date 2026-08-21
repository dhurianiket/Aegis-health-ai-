/**
 * snomedService.ts — SNOMED CT (Systematized Nomenclature of Medicine -- Clinical Terms) Mapper
 * Aligned with National Resource Center for EHR Standards (NRCeS India) and HL7 FHIR R4 specs.
 * Provides canonical SNOMED CT concept codes for clinical conditions, lab findings, and medications.
 */

export interface SnomedConcept {
  conceptId: string;
  term: string;
  semanticTag: 'finding' | 'disorder' | 'substance' | 'body-structure' | 'procedure';
  category: string;
}

export const SNOMED_DICTIONARY: Record<string, SnomedConcept> = {
  // Glycemic & Diabetes
  hba1c: { conceptId: '43150009', term: 'Hemoglobin A1c measurement', semanticTag: 'procedure', category: 'Diabetes' },
  glucose_fasting: { conceptId: '166898000', term: 'Fasting blood glucose measurement', semanticTag: 'procedure', category: 'Metabolic' },
  diabetes_t2: { conceptId: '44054006', term: 'Type 2 diabetes mellitus', semanticTag: 'disorder', category: 'Endocrine' },
  hyperglycemia: { conceptId: '80394007', term: 'Hyperglycemia', semanticTag: 'disorder', category: 'Metabolic' },

  // Cardiovascular & Renal
  hypertension: { conceptId: '38341003', term: 'Essential hypertension', semanticTag: 'disorder', category: 'Cardiovascular' },
  hypercholesterolemia: { conceptId: '271649006', term: 'Hypercholesterolemia', semanticTag: 'disorder', category: 'Cardiovascular' },
  creatinine: { conceptId: '70901006', term: 'Serum creatinine test', semanticTag: 'procedure', category: 'Renal' },
  ckd: { conceptId: '709044004', term: 'Chronic kidney disease', semanticTag: 'disorder', category: 'Renal' },

  // Hematology & Anemia
  anemia: { conceptId: '271737000', term: 'Anemia', semanticTag: 'disorder', category: 'Hematology' },
  hemoglobin: { conceptId: '38082009', term: 'Hemoglobin measurement', semanticTag: 'procedure', category: 'Hematology' },
  vitamin_d_deficiency: { conceptId: '34713006', term: 'Vitamin D deficiency', semanticTag: 'disorder', category: 'Nutrition' },

  // Hepatic & Thyroid
  fatty_liver: { conceptId: '197321007', term: 'Non-alcoholic fatty liver disease', semanticTag: 'disorder', category: 'Hepatic' },
  hypothyroidism: { conceptId: '40930008', term: 'Hypothyroidism', semanticTag: 'disorder', category: 'Thyroid' },
  tsh: { conceptId: '166162002', term: 'Thyroid stimulating hormone measurement', semanticTag: 'procedure', category: 'Thyroid' },
};

/**
 * Retrieves the SNOMED CT coding object for a given key, formatted for FHIR CodeableConcepts.
 */
export function getSnomedCoding(key: string) {
  const concept = SNOMED_DICTIONARY[key.toLowerCase()];
  if (!concept) {
    return {
      system: 'http://snomed.info/sct',
      code: '404684003',
      display: 'Clinical finding (finding)',
    };
  }
  return {
    system: 'http://snomed.info/sct',
    code: concept.conceptId,
    display: `${concept.term} (${concept.semanticTag})`,
  };
}

/**
 * Maps a list of clinical condition keys or lab finding names into an array of FHIR CodeableConcepts with SNOMED CT.
 */
export function mapToSnomedCodeableConcepts(items: string[]) {
  return items.map((item) => ({
    coding: [getSnomedCoding(item)],
    text: item,
  }));
}
