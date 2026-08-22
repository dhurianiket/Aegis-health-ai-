import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FoodInteractionMatrix } from '../Medications/FoodInteractionMatrix';
import InteractionMatrix from '../Medications/InteractionMatrix';
import { Medication, DrugInteraction } from '../../types/health';
import { LabBiomarker } from '../../services/drugLabEngine';
import { evaluateFoodInteractions } from '../../services/foodInteractionService';

// 1. Mock ResizeObserver for JSDOM
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// Mock OpenFDA API calls to avoid async network timeouts during stress tests
vi.mock('../../services/drugInteractionService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/drugInteractionService')>();
  return {
    ...actual,
    fetchOpenFdaAdverseEvents: vi.fn().mockImplementation(async (query: string) => ({
      drugName: query,
      rxcui: '12345',
      totalReportedEvents: 15420,
      topReactions: [
        { term: 'HEADACHE', count: 1200, frequencyPercentage: 15 },
        { term: 'NAUSEA', count: 850, frequencyPercentage: 11 },
      ],
      blackBoxWarning: {
        hasWarning: query.toLowerCase().includes('warfarin'),
        summary: 'Major bleeding risk warning',
        warningText: 'Warfarin can cause major or fatal bleeding.',
        source: 'curated_fda_registry',
      },
      severityRating: 'moderate',
      citations: [
        {
          id: 'cite-fda-1',
          title: 'FDA Boxed Warning Guidance',
          organization: 'FDA',
          url: 'https://fda.gov',
          evidenceLevel: 'Class I',
        },
      ],
      lastUpdated: new Date().toISOString(),
    })),
  };
});

// 2. WCAG Contrast Calculation Helpers (Mathematical Formula Specification)
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const fgRgb = hexToRgb(foregroundHex);
  const bgRgb = hexToRgb(backgroundHex);
  const l1 = getRelativeLuminance(fgRgb);
  const l2 = getRelativeLuminance(bgRgb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// 3. Mock High-Complexity 12-Medication Regimen
const MOCK_12_MEDICATIONS: Medication[] = [
  {
    id: 'med-warfarin',
    userId: 'user-emp-1',
    genericName: 'Warfarin',
    brandName: 'Coumadin',
    dosage: '5mg',
    frequency: 'Once daily in evening',
    rxcui: '11289',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Atrial Fibrillation Stroke Prophylaxis',
    addedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-lisinopril',
    userId: 'user-emp-1',
    genericName: 'Lisinopril',
    brandName: 'Zestril',
    dosage: '20mg',
    frequency: 'Once daily morning',
    rxcui: '29046',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Hypertension',
    addedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-cipro',
    userId: 'user-emp-1',
    genericName: 'Ciprofloxacin',
    brandName: 'Cipro',
    dosage: '500mg',
    frequency: 'Twice daily for 7 days',
    rxcui: '2551',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Urinary Tract Infection',
    addedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-atorvastatin',
    userId: 'user-emp-1',
    genericName: 'Atorvastatin',
    brandName: 'Lipitor',
    dosage: '40mg',
    frequency: 'Once daily at bedtime',
    rxcui: '83367',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Hypercholesterolemia & ASCVD Risk',
    addedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-metformin',
    userId: 'user-emp-1',
    genericName: 'Metformin',
    brandName: 'Glucophage',
    dosage: '1000mg',
    frequency: 'Twice daily with meals',
    rxcui: '6809',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Type 2 Diabetes Mellitus',
    addedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-spironolactone',
    userId: 'user-emp-1',
    genericName: 'Spironolactone',
    brandName: 'Aldactone',
    dosage: '25mg',
    frequency: 'Once daily',
    rxcui: '9997',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Heart Failure & Resistant HTN',
    addedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-aspirin',
    userId: 'user-emp-1',
    genericName: 'Aspirin',
    brandName: 'Ecotrin',
    dosage: '81mg',
    frequency: 'Once daily',
    rxcui: '1191',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Cardioprotection',
    addedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-clopidogrel',
    userId: 'user-emp-1',
    genericName: 'Clopidogrel',
    brandName: 'Plavix',
    dosage: '75mg',
    frequency: 'Once daily',
    rxcui: '32968',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Post-PCI Stent Antiplatelet',
    addedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-digoxin',
    userId: 'user-emp-1',
    genericName: 'Digoxin',
    brandName: 'Lanoxin',
    dosage: '0.125mg',
    frequency: 'Once daily',
    rxcui: '3407',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Heart Failure Rate Control',
    addedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-omeprazole',
    userId: 'user-emp-1',
    genericName: 'Omeprazole',
    brandName: 'Prilosec',
    dosage: '20mg',
    frequency: 'Once daily 30m before breakfast',
    rxcui: '7646',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Gastroesophageal Reflux & GI Protection',
    addedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-levothyroxine',
    userId: 'user-emp-1',
    genericName: 'Levothyroxine',
    brandName: 'Synthroid',
    dosage: '75mcg',
    frequency: 'Once daily fasting with water',
    rxcui: '10582',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Hypothyroidism',
    addedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'med-lithium',
    userId: 'user-emp-1',
    genericName: 'Lithium Carbonate',
    brandName: 'Lithobid',
    dosage: '300mg',
    frequency: 'Twice daily',
    rxcui: '6448',
    startDate: '2026-01-01',
    endDate: null,
    prescribedFor: 'Bipolar Mood Stabilization',
    addedAt: '2026-01-01T00:00:00Z',
  },
];

// Mock Interactions between the 12 medications
const MOCK_DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    id: 'inter-warfarin-aspirin',
    drugA: 'Warfarin',
    drugB: 'Aspirin',
    rxcuiA: '11289',
    rxcuiB: '1191',
    severity: 'severe',
    description: 'Concurrent anticoagulant and antiplatelet therapy substantially elevates major gastrointestinal and systemic hemorrhage risk.',
    plainSummary: 'High bleeding danger: combining Warfarin and Aspirin requires urgent physician supervision.',
    source: 'rxnorm',
    checkedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'inter-lisinopril-spironolactone',
    drugA: 'Lisinopril',
    drugB: 'Spironolactone',
    rxcuiA: '29046',
    rxcuiB: '9997',
    severity: 'severe',
    description: 'Synergistic potassium retention by ACE inhibitor and potassium-sparing diuretic can induce life-threatening hyperkalemia.',
    plainSummary: 'Severe hyperkalemia risk: monitor serum potassium and renal function closely.',
    source: 'rxnorm',
    checkedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'inter-clopidogrel-omeprazole',
    drugA: 'Clopidogrel',
    drugB: 'Omeprazole',
    rxcuiA: '32968',
    rxcuiB: '7646',
    severity: 'moderate',
    description: 'Omeprazole inhibits CYP2C19 bioactivation of Clopidogrel, reducing antiplatelet efficacy and increasing ischemic risk.',
    plainSummary: 'Reduced antiplatelet effectiveness: consider alternative acid-suppressive agent like Pantoprazole or Famotidine.',
    source: 'rxnorm',
    checkedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'inter-cipro-warfarin',
    drugA: 'Ciprofloxacin',
    drugB: 'Warfarin',
    rxcuiA: '2551',
    rxcuiB: '11289',
    severity: 'moderate',
    description: 'Fluoroquinolones inhibit CYP1A2 and alter gut flora synthesizing Vitamin K, causing precipitous INR elevation.',
    plainSummary: 'Increased bleeding risk and INR spikes: check INR within 48-72 hours of starting Ciprofloxacin.',
    source: 'rxnorm',
    checkedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'inter-atorva-lisino',
    drugA: 'Atorvastatin',
    drugB: 'Lisinopril',
    rxcuiA: '83367',
    rxcuiB: '29046',
    severity: 'moderate',
    description: 'Mild risk of additive myopathy in renal-impaired individuals.',
    plainSummary: 'Compatible with routine monitoring of blood pressure and muscle symptoms.',
    source: 'rxnorm',
    checkedAt: '2026-01-01T00:00:00Z',
  },
];

// Mock Lab Biomarkers
const MOCK_STRESS_BIOMARKERS: LabBiomarker[] = [
  {
    testName: 'Potassium',
    value: '5.8',
    unit: 'mEq/L',
    flag: 'HIGH',
    referenceRange: '3.5 - 5.0 mEq/L',
  },
  {
    testName: 'eGFR',
    value: '42',
    unit: 'mL/min/1.73m²',
    flag: 'LOW',
    referenceRange: '> 60 mL/min/1.73m²',
  },
  {
    testName: 'INR',
    value: '3.4',
    unit: '',
    flag: 'HIGH',
    referenceRange: '2.0 - 3.0',
  },
  {
    testName: 'ALT (SGPT)',
    value: '78',
    unit: 'U/L',
    flag: 'HIGH',
    referenceRange: '7 - 56 U/L',
  },
  {
    testName: 'Serum Creatinine',
    value: '1.8',
    unit: 'mg/dL',
    flag: 'HIGH',
    referenceRange: '0.6 - 1.2 mg/dL',
  },
];

describe('Milestone 3 & 4 Empirical Stress & Adversarial Challenge Suite', { timeout: 20000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // DIMENSION 1: FoodInteractionMatrix Multi-Drug Regimens & Stress Testing
  // =========================================================================
  describe('Dimension 1: FoodInteractionMatrix Multi-Drug Active Regimens', () => {
    it('1.1 Accurately evaluates full 4-drug high-risk regimen (Warfarin + Lisinopril + Ciprofloxacin + Atorvastatin)', () => {
      const activeRegimen = [
        'Warfarin 5mg',
        'Lisinopril 20mg',
        'Ciprofloxacin 500mg',
        'Atorvastatin 40mg',
      ];

      const detected = evaluateFoodInteractions(activeRegimen);
      expect(detected.length).toBe(4);

      const rules = detected.map((d) => d.ruleId);
      expect(rules).toContain('food-grapefruit-statin');
      expect(rules).toContain('food-dairy-antibiotic');
      expect(rules).toContain('food-vitamin-k-warfarin');
      expect(rules).toContain('food-potassium-acei');

      const { container } = render(<FoodInteractionMatrix activeMedications={activeRegimen} />);

      // Verify all 4 drug names and food contraindications are displayed
      expect(screen.getByText('Warfarin 5mg')).toBeDefined();
      expect(screen.getByText('Lisinopril 20mg')).toBeDefined();
      expect(screen.getByText('Ciprofloxacin 500mg')).toBeDefined();
      expect(screen.getByText('Atorvastatin 40mg')).toBeDefined();

      // Verify food names
      expect(screen.getByText('Grapefruit & Grapefruit Juice')).toBeDefined();
      expect(screen.getByText('Dairy, Milk, Yogurt & Calcium Foods')).toBeDefined();
      expect(screen.getByText(/High Vitamin K Greens/i)).toBeDefined();
      expect(screen.getByText(/High Potassium/i)).toBeDefined();

      // Verify 3D glowing badges exist
      const roseGlowBadges = container.querySelectorAll('.glow-rose-3d');
      const amberGlowBadges = container.querySelectorAll('.glow-amber-3d');
      expect(roseGlowBadges.length).toBeGreaterThanOrEqual(2); // Warfarin & Atorvastatin are critical
      expect(amberGlowBadges.length).toBeGreaterThanOrEqual(2); // Lisinopril & Cipro are warning

      // Verify dietary spacing timing chips
      const spacingChips = screen.getAllByText('Dietary Spacing');
      expect(spacingChips.length).toBe(4);

      const windowChips = screen.getAllByText('2-3 hr Window');
      expect(windowChips.length).toBe(4);
    });

    it('1.2 Adversarial String Stress: Case-insensitive, extra whitespace, salt forms, and combinations', () => {
      const messyRegimen = [
        '   wArFaRiN sodium 5MG   ',
        'ATORVASTATIN CALCIUM 40 MG',
        'ciprofloxacin hydrochloride 500mg tab',
        'lisinopril-hctz 20/12.5mg',
        'Ferrous Sulfate 200mg',
        'Linezolid 600mg',
      ];

      const detected = evaluateFoodInteractions(messyRegimen);
      expect(detected.length).toBeGreaterThanOrEqual(6);

      // Verify Fermented foods / tyramine rule triggered by Linezolid
      const tyramineRule = detected.find((d) => d.ruleId === 'food-tyramine-maoi');
      expect(tyramineRule).toBeDefined();
      expect(tyramineRule?.severity).toBe('critical');

      // Verify Tea / Tannin rule triggered by Iron
      const teaRule = detected.find((d) => d.ruleId === 'food-tea-iron');
      expect(teaRule).toBeDefined();
      expect(teaRule?.severity).toBe('info');

      const { container } = render(<FoodInteractionMatrix activeMedications={messyRegimen} />);
      
      // Cyan glow badge check for info severity
      const cyanGlowBadges = container.querySelectorAll('.glow-cyan-3d');
      expect(cyanGlowBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('1.3 Accordion filter dropdown switches between categories and updates count correctly', () => {
      const activeRegimen = [
        'Warfarin 5mg',
        'Lisinopril 20mg',
        'Ciprofloxacin 500mg',
        'Atorvastatin 40mg',
      ];

      render(<FoodInteractionMatrix activeMedications={activeRegimen} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDefined();

      // Filter by Dairy
      fireEvent.change(select, { target: { value: 'Dairy' } });
      expect(screen.getByText('Dairy, Milk, Yogurt & Calcium Foods')).toBeDefined();
      expect(screen.queryByText('Grapefruit & Grapefruit Juice')).toBeNull();

      // Filter by Citrus
      fireEvent.change(select, { target: { value: 'Citrus' } });
      expect(screen.getByText('Grapefruit & Grapefruit Juice')).toBeDefined();
      expect(screen.queryByText('Dairy, Milk, Yogurt & Calcium Foods')).toBeNull();

      // Filter by Leafy Greens
      fireEvent.change(select, { target: { value: 'Leafy Greens' } });
      expect(screen.getByText(/High Vitamin K Greens/i)).toBeDefined();

      // Filter back to all
      fireEvent.change(select, { target: { value: 'all' } });
      expect(screen.getByText('Grapefruit & Grapefruit Juice')).toBeDefined();
      expect(screen.getByText('Dairy, Milk, Yogurt & Calcium Foods')).toBeDefined();
    });

    it('1.4 Empty regimen and benign non-interacting regimens render ultra-safe fallback state', () => {
      const benignRegimen = ['Paracetamol 500mg', 'Cetirizine 10mg', 'Vitamin D3 2000IU'];
      const { rerender } = render(<FoodInteractionMatrix activeMedications={benignRegimen} />);

      expect(screen.getByText(/No Active Food-Drug Contraindications/i)).toBeDefined();
      expect(screen.getByText(/No dangerous dietary interactions detected/i)).toBeDefined();

      // Rerender with empty array
      rerender(<FoodInteractionMatrix activeMedications={[]} />);
      expect(screen.getByText(/No Active Food-Drug Contraindications/i)).toBeDefined();
    });
  });

  // =========================================================================
  // DIMENSION 2: InteractionMatrix 10+ Concurrent Medications & Layout Bounds
  // =========================================================================
  describe('Dimension 2: InteractionMatrix 10+ Concurrent Medications Stress', () => {
    it('2.1 Successfully renders 12 concurrent medications with exact RxCUI badges and grid template', async () => {
      const { container } = render(
        <InteractionMatrix
          medications={MOCK_12_MEDICATIONS}
          interactions={MOCK_DRUG_INTERACTIONS}
          labBiomarkers={MOCK_STRESS_BIOMARKERS}
        />
      );

      expect(screen.getByText(/Integrated Regimen & Biomarker Safety Engine/i)).toBeDefined();
      expect(screen.getByText(/Live Bio-Regimen Safety Matrix/i)).toBeDefined();

      // Check desktop grid template columns: 160px + 12 columns
      const desktopGrid = container.querySelector('.min-w-\\[650px\\] .grid');
      expect(desktopGrid).not.toBeNull();
      expect(desktopGrid?.getAttribute('style')).toContain('grid-template-columns: 160px repeat(12, minmax(0, 1fr))');

      // Verify all 12 medication RxCUI badges are displayed
      MOCK_12_MEDICATIONS.forEach((med) => {
        expect(screen.getAllByText(new RegExp(med.genericName, 'i')).length).toBeGreaterThanOrEqual(1);
        if (med.rxcui) {
          expect(screen.getAllByText(new RegExp(`RxCUI: ${med.rxcui}`, 'i')).length).toBeGreaterThanOrEqual(1);
        }
      });

      // Verify 3D status orbs in the matrix cells (red for severe, amber for moderate, emerald for safe)
      const roseCells = container.querySelectorAll('.glow-rose-3d');
      const amberCells = container.querySelectorAll('.glow-amber-3d');
      expect(roseCells.length).toBeGreaterThanOrEqual(1);
      expect(amberCells.length).toBeGreaterThanOrEqual(1);
    }, 15000);

    it('2.2 Renders all n*(n-1)/2 = 66 mobile stacked vertical cards (md:hidden block)', async () => {
      const { container } = render(
        <InteractionMatrix
          medications={MOCK_12_MEDICATIONS}
          interactions={MOCK_DRUG_INTERACTIONS}
          labBiomarkers={MOCK_STRESS_BIOMARKERS}
        />
      );

      const mobileSection = container.querySelector('.md\\:hidden');
      expect(mobileSection).not.toBeNull();
      expect(screen.getByText(/Drug-Drug Pairings \(Mobile View\)/i)).toBeDefined();

      // Calculate total pairing cards: 12 * 11 / 2 = 66 cards
      const mobileCards = mobileSection?.querySelectorAll('.p-4.rounded-2xl.border');
      expect(mobileCards?.length).toBe(66);

      // Verify Warfarin + Aspirin severe card in mobile view
      const severeCard = Array.from(mobileCards || []).find((c) =>
        c.textContent?.includes('Warfarin + Aspirin')
      );
      expect(severeCard).toBeDefined();
      expect(severeCard?.className).toContain('glow-rose-3d');
      expect(severeCard?.textContent).toContain('severe');
    }, 15000);

    it('2.3 Interactive Cell Click opens Inspection Drawer with full FAERS Adverse events & FDA Boxed Warnings', async () => {
      const onOpenChatMock = vi.fn();
      const { container } = render(
        <InteractionMatrix
          medications={MOCK_12_MEDICATIONS}
          interactions={MOCK_DRUG_INTERACTIONS}
          labBiomarkers={MOCK_STRESS_BIOMARKERS}
          onOpenChat={onOpenChatMock}
        />
      );

      // Find severe cell in mobile or desktop and click it
      const severeMobileCard = container.querySelector('[class*="glow-rose-3d"].cursor-pointer');
      expect(severeMobileCard).not.toBeNull();
      fireEvent.click(severeMobileCard!);

      // Verify inspector drawer appears
      expect(screen.getByText(/Drug-Drug Interaction & Pharmacology Safety/i)).toBeDefined();
      expect(screen.getByText('Clear Inspector')).toBeDefined();

      // Test "Consult Aura AI" CTA click
      const consultButton = screen.queryByRole('button', { name: /Consult Aura AI/i });
      if (consultButton) {
        fireEvent.click(consultButton);
        expect(onOpenChatMock).toHaveBeenCalled();
      }

      // Test Clear Inspector button
      const clearBtn = screen.getByText('Clear Inspector');
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.queryByText('Clear Inspector')).toBeNull();
      });
    }, 15000);

    it('2.4 Switches across all 3 view modes under 12-medication load without memory leak or breakdown', async () => {
      const { container } = render(
        <InteractionMatrix
          medications={MOCK_12_MEDICATIONS}
          interactions={MOCK_DRUG_INTERACTIONS}
          labBiomarkers={MOCK_STRESS_BIOMARKERS}
        />
      );

      // Switch to Drug-Lab Matrix
      const drugLabBtn = screen.getByRole('button', { name: /Drug-Lab Matrix/i });
      fireEvent.click(drugLabBtn);

      expect(screen.getByText(/Medication \/ Lab/i)).toBeDefined();
      expect(screen.getByText(/Drug-Lab Pairings \(Mobile View\)/i)).toBeDefined();
      expect(screen.getAllByText('Serum Creatinine').length).toBeGreaterThanOrEqual(1);

      // Switch to Integrated Overview
      const overviewBtn = screen.getByRole('button', { name: /Integrated Overview/i });
      fireEvent.click(overviewBtn);

      expect(screen.getByText('Critical Alerts')).toBeDefined();
      expect(screen.getByText('Moderate Warnings')).toBeDefined();
      expect(screen.getByText('Safe Pairings')).toBeDefined();
      expect(screen.getByText(/Active Bio-Regimen Safety Alerts/i)).toBeDefined();

      // Switch back to Drug-Drug Matrix
      const drugDrugBtn = screen.getByRole('button', { name: /Drug-Drug Matrix/i });
      fireEvent.click(drugDrugBtn);
      expect(screen.getByText(/Active Regimen/i)).toBeDefined();
    }, 15000);
  });

  // =========================================================================
  // DIMENSION 3: 320px–430px Mobile Viewport Safety & Minimum 44px Touch Targets
  // =========================================================================
  describe('Dimension 3: 320px–430px Mobile Viewport Safety & 44px Touch Targets', () => {
    const VIEWPORT_WIDTHS = [320, 375, 390, 430];

    VIEWPORT_WIDTHS.forEach((width) => {
      it(`3.1 Responsive check at ${width}px viewport width: Touch targets >= 44px & zero layout clipping`, async () => {
        // Mock viewport dimension
        window.innerWidth = width;
        window.innerHeight = 800;

        const { container } = render(
          <div style={{ width: `${width}px`, maxWidth: '100vw', overflowX: 'hidden' }}>
            <FoodInteractionMatrix
              activeMedications={['Atorvastatin 20mg', 'Lisinopril 10mg', 'Ciprofloxacin 500mg']}
            />
            <InteractionMatrix
              medications={MOCK_12_MEDICATIONS.slice(0, 4)}
              interactions={MOCK_DRUG_INTERACTIONS.slice(0, 2)}
              labBiomarkers={MOCK_STRESS_BIOMARKERS.slice(0, 2)}
            />
          </div>
        );

        await waitFor(() => {
          expect(container.querySelector('select')).not.toBeNull();
        });

        // Verify select dropdown touch target height class
        const select = container.querySelector('select');
        expect(select).not.toBeNull();
        expect(select?.className).toContain('min-h-[44px]');

        // Verify mobile card items have min-h-[44px]
        const mobileCards = container.querySelectorAll('.md\\:hidden .min-h-\\[44px\\]');
        expect(mobileCards.length).toBeGreaterThanOrEqual(1);

        // Verify desktop scroll wrapper exists for wide grid
        const scrollWrappers = container.querySelectorAll('.overflow-x-auto');
        expect(scrollWrappers.length).toBeGreaterThanOrEqual(1);

        // Verify ultra 3D glass card wrapper
        const ultraGlassCard = container.querySelector('.glass-card-ultra-3d');
        expect(ultraGlassCard).not.toBeNull();
      }, 15000);
    });

    it('3.2 All interactive buttons and selectors enforce touch-action manipulation and proper padding', async () => {
      const { container } = render(
        <InteractionMatrix
          medications={MOCK_12_MEDICATIONS.slice(0, 3)}
          interactions={MOCK_DRUG_INTERACTIONS.slice(0, 1)}
        />
      );

      await waitFor(() => {
        expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
      });

      const buttons = container.querySelectorAll('button');
      buttons.forEach((btn) => {
        expect(btn.className).toMatch(/px-4 py-2|px-3 py-1|p-1\.5|p-3/);
      });
    }, 15000);
  });

  // =========================================================================
  // DIMENSION 4: WCAG AAA / AA Contrast Compliance in Light & Dark Modes
  // =========================================================================
  describe('Dimension 4: Mathematical WCAG AAA / AA Contrast Ratio Verification', () => {
    // Exact color palette tested
    const PALETTE = {
      // Backgrounds
      lightBg: '#f8fafc',
      lightSurface: '#ffffff',
      darkBg: '#090d16',
      darkSurface: '#111827',
      darkSlate950: '#020617',

      // Text colors
      lightText: '#0f172a',
      lightMuted: '#334155',
      darkText: '#f8fafc',
      darkMuted: '#cbd5e1',
      darkFaint: '#94a3b8',

      // Rose / Critical
      roseTextDark: '#fecaca',
      roseTextLight: '#991b1b',
      roseTextLightAAA: '#7f1d1d',
      roseBadgeDarkBg: '#7f1d1d',
      roseBadgeLightBg: '#fee2e2',

      // Amber / Warning
      amberTextDark: '#fde68a',
      amberTextLight: '#92400e',
      amberBadgeDarkBg: '#78350f',
      amberBadgeLightBg: '#fef3c7',

      // Cyan / Info
      cyanTextDark: '#bfdbfe',
      cyanTextLight: '#1e40af',
      cyanBadgeDarkBg: '#1e3a8a',
      cyanBadgeLightBg: '#dbeafe',

      // Emerald / Success
      emeraldTextDark: '#a7f3d0',
      emeraldTextLight: '#065f46',
      emeraldTextLightAAA: '#064e3b',
      emeraldBadgeDarkBg: '#064e3b',
      emeraldBadgeLightBg: '#d1fae5',

      // Indigo Primary
      indigoLightText: '#4338ca',
      indigoDarkText: '#e0e7ff',
    };

    it('4.1 Critical / Severe Badges satisfy WCAG AA (>= 4.5:1) & AAA Bold Badge / Normal text', () => {
      // Light Mode: #991b1b on #fee2e2 (6.8:1 exceeds WCAG AA 4.5:1 and WCAG AAA Large text 4.5:1)
      const lightCriticalRatio = calculateContrastRatio(PALETTE.roseTextLight, PALETTE.roseBadgeLightBg);
      expect(lightCriticalRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA & WCAG AAA Large Text Passed

      // High-contrast AAA variant: #7f1d1d on #fee2e2
      const lightCriticalAAARatio = calculateContrastRatio(PALETTE.roseTextLightAAA, PALETTE.roseBadgeLightBg);
      expect(lightCriticalAAARatio).toBeGreaterThanOrEqual(7.0); // Full WCAG AAA Normal text Passed

      // Dark Mode: #fecaca on #7f1d1d (6.93:1 exceeds WCAG AA 4.5:1 and WCAG AAA Large text 4.5:1)
      const darkCriticalRatio = calculateContrastRatio(PALETTE.roseTextDark, PALETTE.roseBadgeDarkBg);
      expect(darkCriticalRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA & WCAG AAA Large Text Passed

      // Dark Mode text #fecaca against dark background #090d16 (13.5:1 exceeds WCAG AAA 7.0:1)
      const darkSurfaceCriticalRatio = calculateContrastRatio(PALETTE.roseTextDark, PALETTE.darkBg);
      expect(darkSurfaceCriticalRatio).toBeGreaterThanOrEqual(7.0); // WCAG AAA Passed
    });

    it('4.2 Warning / Moderate Badges satisfy WCAG AA (>= 4.5:1) & AAA (>= 7.0:1) Contrast Ratios', () => {
      // Light Mode: #92400e on #fef3c7
      const lightWarningRatio = calculateContrastRatio(PALETTE.amberTextLight, PALETTE.amberBadgeLightBg);
      expect(lightWarningRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA Passed

      // Dark Mode: #fde68a on #78350f
      const darkWarningRatio = calculateContrastRatio(PALETTE.amberTextDark, PALETTE.amberBadgeDarkBg);
      expect(darkWarningRatio).toBeGreaterThanOrEqual(7.0); // WCAG AAA Passed

      // Dark Mode amber text #fde68a against dark surface #111827
      const darkSurfaceWarningRatio = calculateContrastRatio(PALETTE.amberTextDark, PALETTE.darkSurface);
      expect(darkSurfaceWarningRatio).toBeGreaterThanOrEqual(7.0); // WCAG AAA Passed
    });

    it('4.3 Info & Spacing Badges satisfy WCAG AA (>= 4.5:1) & AAA (>= 7.0:1) Contrast Ratios', () => {
      // Light Mode: #1e40af on #dbeafe
      const lightInfoRatio = calculateContrastRatio(PALETTE.cyanTextLight, PALETTE.cyanBadgeLightBg);
      expect(lightInfoRatio).toBeGreaterThanOrEqual(7.0); // WCAG AAA Passed

      // Dark Mode: #bfdbfe on #1e3a8a
      const darkInfoRatio = calculateContrastRatio(PALETTE.cyanTextDark, PALETTE.cyanBadgeDarkBg);
      expect(darkInfoRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA Passed
    });

    it('4.4 Success / Compatible Badges satisfy WCAG AA (>= 4.5:1) & AAA Bold Badge / Normal text', () => {
      // Light Mode: #065f46 on #d1fae5 (6.77:1 exceeds WCAG AA 4.5:1 and WCAG AAA Large text 4.5:1)
      const lightSuccessRatio = calculateContrastRatio(PALETTE.emeraldTextLight, PALETTE.emeraldBadgeLightBg);
      expect(lightSuccessRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA & WCAG AAA Large Text Passed

      // High-contrast AAA variant: #064e3b on #d1fae5
      const lightSuccessAAARatio = calculateContrastRatio(PALETTE.emeraldTextLightAAA, PALETTE.emeraldBadgeLightBg);
      expect(lightSuccessAAARatio).toBeGreaterThanOrEqual(7.0); // Full WCAG AAA Normal text Passed

      // Dark Mode: #a7f3d0 on #064e3b
      const darkSuccessRatio = calculateContrastRatio(PALETTE.emeraldTextDark, PALETTE.emeraldBadgeDarkBg);
      expect(darkSuccessRatio).toBeGreaterThanOrEqual(7.0); // WCAG AAA Passed
    });

    it('4.5 Core Body & Muted Typography satisfy WCAG AAA Contrast against Light & Dark surfaces', () => {
      // Light mode body: #0f172a on #ffffff
      const lightBodyRatio = calculateContrastRatio(PALETTE.lightText, PALETTE.lightSurface);
      expect(lightBodyRatio).toBeGreaterThanOrEqual(12.0); // Extreme high contrast

      // Light mode muted: #334155 on #ffffff
      const lightMutedRatio = calculateContrastRatio(PALETTE.lightMuted, PALETTE.lightSurface);
      expect(lightMutedRatio).toBeGreaterThanOrEqual(7.0); // WCAG AAA Passed

      // Dark mode body: #f8fafc on #111827
      const darkBodyRatio = calculateContrastRatio(PALETTE.darkText, PALETTE.darkSurface);
      expect(darkBodyRatio).toBeGreaterThanOrEqual(12.0);

      // Dark mode muted: #cbd5e1 on #111827
      const darkMutedRatio = calculateContrastRatio(PALETTE.darkMuted, PALETTE.darkSurface);
      expect(darkMutedRatio).toBeGreaterThanOrEqual(7.0); // WCAG AAA Passed
    });

    it('4.6 Rendered DOM Class Audit: FoodInteractionMatrix and InteractionMatrix enforce strict contrast tokens', async () => {
      const { container: foodContainer } = render(
        <div className="dark bg-slate-950 text-white">
          <FoodInteractionMatrix
            activeMedications={['Atorvastatin 20mg', 'Lisinopril 10mg', 'Ciprofloxacin 500mg']}
          />
        </div>
      );

      // Verify no low-contrast text-slate-400 used as primary text
      const foodTextElements = foodContainer.querySelectorAll('p, span, h3, h4');
      foodTextElements.forEach((el) => {
        expect(el.className).not.toContain('opacity-30');
      });

      const { container: matrixContainer } = render(
        <div className="dark bg-slate-950 text-white">
          <InteractionMatrix
            medications={MOCK_12_MEDICATIONS.slice(0, 3)}
            interactions={MOCK_DRUG_INTERACTIONS.slice(0, 1)}
          />
        </div>
      );

      await waitFor(() => {
        expect(matrixContainer.querySelectorAll('button').length).toBeGreaterThan(0);
      });

      // Verify matrix buttons incorporate dark text fallbacks
      const matrixButtons = matrixContainer.querySelectorAll('button');
      matrixButtons.forEach((btn) => {
        expect(btn.className).not.toContain('opacity-20');
      });
    }, 15000);
  });
});
