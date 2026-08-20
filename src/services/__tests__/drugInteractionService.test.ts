import { describe, it, expect, beforeEach } from 'vitest';
import {
  cleanDrugQuery,
  resolveRxCuiFuzzy,
  fetchOpenFdaAdverseEvents,
  getEnrichedDrugInteractions,
  CURATED_RXCUI_REGISTRY,
  CURATED_FDA_KNOWLEDGE_BASE,
} from '../drugInteractionService';

describe('Enhanced RxNav & OpenFDA Pharmacology Safety Matrix Suite', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('Query Normalization & Token Stripping', () => {
    it('strips dosages, forms, and clinical frequency tokens', () => {
      expect(cleanDrugQuery('Lisinopril 10mg tab')).toBe('lisinopril');
      expect(cleanDrugQuery('Metformin 500 mg oral tablet daily')).toBe('metformin');
      expect(cleanDrugQuery('Glucophage XR 1000mg PO')).toBe('glucophage');
      expect(cleanDrugQuery('Spironolactone 25mcg BD')).toBe('spironolactone');
      expect(cleanDrugQuery('Lipitor (atorvastatin calcium) 20mg')).toBe('lipitor atorvastatin calcium');
    });
  });

  describe('RxNav Approximate Fuzzy Resolution', () => {
    it('resolves exact generic drug names to canonical RxCUIs', async () => {
      const match = await resolveRxCuiFuzzy('lisinopril');
      expect(match).not.toBeNull();
      expect(match?.rxcui).toBe('29046');
      expect(match?.name.toLowerCase()).toContain('lisinopril');
    });

    it('resolves brand trade names to active ingredient RxCUIs', async () => {
      const lipitor = await resolveRxCuiFuzzy('Lipitor');
      expect(lipitor?.rxcui).toBe('83367');

      const glucophage = await resolveRxCuiFuzzy('Glucophage');
      expect(glucophage?.rxcui).toBe('6809');

      const coumadin = await resolveRxCuiFuzzy('Coumadin');
      expect(coumadin?.rxcui).toBe('11289');
    });

    it('resolves misspelled drug names via approximate/curated matching', async () => {
      const misspell1 = await resolveRxCuiFuzzy('lisnopril');
      expect(misspell1?.rxcui).toBe('29046');

      const misspell2 = await resolveRxCuiFuzzy('metformn');
      expect(misspell2?.rxcui).toBe('6809');

      const misspell3 = await resolveRxCuiFuzzy('atorvastin');
      expect(misspell3?.rxcui).toBe('83367');
    });

    it('caches resolved lookups for immediate subsequent retrieval', async () => {
      const first = await resolveRxCuiFuzzy('spironolactone');
      expect(first?.rxcui).toBe('9997');

      const second = await resolveRxCuiFuzzy('spironolactone');
      expect(second?.rxcui).toBe('9997');
      expect(second?.name).toBe(first?.name);
    });
  });

  describe('OpenFDA FAERS Adverse Events & Boxed Warnings Intelligence', () => {
    it('retrieves FDA Boxed Warnings for high-risk medications', async () => {
      const [lisinopril, metformin, warfarin] = await Promise.all([
        fetchOpenFdaAdverseEvents('Lisinopril'),
        fetchOpenFdaAdverseEvents('Metformin'),
        fetchOpenFdaAdverseEvents('Warfarin'),
      ]);

      expect(lisinopril.blackBoxWarning.hasWarning).toBe(true);
      expect(lisinopril.blackBoxWarning.summary).toContain('FETAL TOXICITY');
      expect(lisinopril.topReactions.length).toBeGreaterThan(0);
      expect(lisinopril.topReactions.some((r) => r.term.includes('COUGH') || r.term.includes('HYPERKALEMIA'))).toBe(true);

      expect(metformin.blackBoxWarning.hasWarning).toBe(true);
      expect(metformin.blackBoxWarning.summary).toContain('LACTIC ACIDOSIS');

      expect(warfarin.blackBoxWarning.hasWarning).toBe(true);
      expect(warfarin.blackBoxWarning.summary).toContain('BLEEDING RISK');
    }, 15000);

    it('calculates relative reaction frequencies and parses citations', async () => {
      const summary = await fetchOpenFdaAdverseEvents('29046'); // Lisinopril
      expect(summary.totalReportedEvents).toBeGreaterThan(0);
      expect(summary.topReactions[0].frequencyPercentage).toBeDefined();
      expect(summary.citations.length).toBeGreaterThanOrEqual(1);
      expect(summary.citations[0].organization).toBeDefined();
    });

    it('handles medications without Boxed Warnings gracefully', async () => {
      const amlodipine = await fetchOpenFdaAdverseEvents('Amlodipine');
      expect(amlodipine.blackBoxWarning.hasWarning).toBe(false);
      expect(amlodipine.topReactions.length).toBeGreaterThan(0);
      expect(amlodipine.topReactions.some((r) => r.term.includes('EDEMA') || r.term.includes('DIZZINESS'))).toBe(true);
    });
  });

  describe('Enriched Multi-Drug Safety Matrix Engine', () => {
    it('detects critical drug-drug interactions (Lisinopril + Spironolactone -> Hyperkalemia)', async () => {
      const res = await getEnrichedDrugInteractions(['Lisinopril 10mg', 'Spironolactone 25mg']);
      expect(res.overallRiskLevel).toBe('critical');
      expect(res.totalCriticalAlerts).toBeGreaterThanOrEqual(1);

      const pair = res.pairs.find(
        (p) =>
          (p.drugA.toLowerCase().includes('lisinopril') && p.drugB.toLowerCase().includes('spironolactone')) ||
          (p.drugB.toLowerCase().includes('lisinopril') && p.drugA.toLowerCase().includes('spironolactone'))
      );
      expect(pair).toBeDefined();
      expect(pair?.combinedRiskRating).toBe('critical');
      expect(pair?.clinicalRationale).toContain('HYPERKALEMIA');
      expect(pair?.recommendations.length).toBeGreaterThan(0);
    });

    it('detects critical bleeding risks (Warfarin + Ibuprofen)', async () => {
      const res = await getEnrichedDrugInteractions(['Warfarin 5mg', 'Ibuprofen 400mg']);
      expect(res.overallRiskLevel).toBe('critical');
      const pair = res.pairs.find(
        (p) =>
          (p.drugA.toLowerCase().includes('warfarin') && p.drugB.toLowerCase().includes('ibuprofen')) ||
          (p.drugB.toLowerCase().includes('warfarin') && p.drugA.toLowerCase().includes('ibuprofen'))
      );
      expect(pair?.combinedRiskRating).toBe('critical');
      expect(pair?.clinicalRationale).toContain('HEMORRHAGE');
    });

    it('integrates lab biomarkers for cross-contraindication evaluation', async () => {
      const res = await getEnrichedDrugInteractions(
        ['Lisinopril 10mg'],
        [{ name: 'Potassium Serum', value: 5.6, unit: 'mmol/L', flag: 'HIGH' }]
      );
      expect(res.labContraindications.length).toBeGreaterThanOrEqual(1);
      expect(res.overallRiskLevel).toBe('critical');
      expect(res.labContraindications[0].biomarkerName).toBe('Potassium');
    });
  });
});
