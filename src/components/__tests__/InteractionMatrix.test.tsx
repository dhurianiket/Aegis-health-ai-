import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FoodInteractionMatrix } from '../Medications/FoodInteractionMatrix';
import InteractionMatrix from '../Medications/InteractionMatrix';
import { Medication, DrugInteraction } from '../../types/health';
import { LabBiomarker } from '../../services/drugLabEngine';

describe('Milestone 3 (R3): Visual Drug-Lab & Food Interaction Safety Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMedications: Medication[] = [
    {
      id: 'med-1',
      genericName: 'Atorvastatin',
      brandName: 'Lipitor',
      dosage: '20mg',
      frequency: 'Once daily',
      rxcui: '83367',
    },
    {
      id: 'med-2',
      genericName: 'Lisinopril',
      brandName: 'Zestril',
      dosage: '10mg',
      frequency: 'Once daily',
      rxcui: '29046',
    },
    {
      id: 'med-3',
      genericName: 'Ciprofloxacin',
      brandName: 'Cipro',
      dosage: '500mg',
      frequency: 'Twice daily',
      rxcui: '2551',
    },
  ];

  const mockInteractions: DrugInteraction[] = [
    {
      id: 'inter-1',
      drugA: 'Atorvastatin',
      drugB: 'Lisinopril',
      rxcuiA: '83367',
      rxcuiB: '29046',
      severity: 'moderate',
      title: 'Potential Hypotensive or Muscle Fatigue Risk',
      description: 'Concurrent administration may cause slight elevation in muscle ache reports.',
      plainSummary: 'Monitor blood pressure and notify doctor if muscle cramps occur.',
      clinicalMechanism: 'Dual hemodynamic and metabolic pathway interaction.',
      recommendedAction: 'Routine lipid and BP monitoring.',
    },
  ];

  const mockBiomarkers: LabBiomarker[] = [
    {
      testName: 'Potassium',
      value: '5.8',
      unit: 'mEq/L',
      status: 'high',
      referenceRange: '3.5 - 5.0 mEq/L',
    },
    {
      testName: 'ALT (SGPT)',
      value: '28',
      unit: 'U/L',
      status: 'normal',
      referenceRange: '7 - 56 U/L',
    },
  ];

  describe('FoodInteractionMatrix', () => {
    it('renders food contraindications with glowing severity lighting badges and mechanism', () => {
      const { container } = render(
        <FoodInteractionMatrix
          activeMedications={['Atorvastatin 20mg', 'Lisinopril 10mg', 'Ciprofloxacin 500mg']}
        />
      );

      expect(screen.getByText(/Food-Drug Contraindication Matrix/i)).toBeDefined();
      expect(screen.getByText('Atorvastatin 20mg')).toBeDefined();
      expect(screen.getByText('Grapefruit & Grapefruit Juice')).toBeDefined();

      // Check glowing severity badge
      const criticalBadges = container.querySelectorAll('.glow-rose-3d');
      expect(criticalBadges.length).toBeGreaterThanOrEqual(1);

      // Check dietary spacing chips
      expect(screen.getAllByText(/Dietary Spacing/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/2-3 hr Window/i).length).toBeGreaterThanOrEqual(1);
    });

    it('filters interactions by food category', () => {
      render(
        <FoodInteractionMatrix
          activeMedications={['Atorvastatin 20mg', 'Lisinopril 10mg', 'Ciprofloxacin 500mg']}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Citrus' } });

      expect(screen.getByText('Grapefruit & Grapefruit Juice')).toBeDefined();
    });

    it('displays empty state safely when no medications are provided', () => {
      render(<FoodInteractionMatrix activeMedications={[]} />);
      expect(screen.getByText(/No Active Food-Drug Contraindications/i)).toBeDefined();
    });
  });

  describe('InteractionMatrix', () => {
    it('renders the interactive Drug-Drug matrix with RxCUI badges and mobile stacked cards', () => {
      const { container } = render(
        <InteractionMatrix
          medications={mockMedications}
          interactions={mockInteractions}
          labBiomarkers={mockBiomarkers}
        />
      );

      expect(screen.getByText(/Integrated Regimen & Biomarker Safety Engine/i)).toBeDefined();
      expect(screen.getByText(/Drug-Drug Matrix/i)).toBeDefined();

      // Desktop table grid medication names
      expect(screen.getAllByText(/Atorvastatin/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Lisinopril/i).length).toBeGreaterThanOrEqual(1);

      // Mobile stacked cards container (md:hidden block)
      const mobileSection = container.querySelector('.md\\:hidden');
      expect(mobileSection).toBeDefined();
      expect(screen.getByText(/Drug-Drug Pairings \(Mobile View\)/i)).toBeDefined();
    });

    it('switches between Drug-Drug, Drug-Lab, and Integrated Overview view modes', () => {
      render(
        <InteractionMatrix
          medications={mockMedications}
          interactions={mockInteractions}
          labBiomarkers={mockBiomarkers}
        />
      );

      const drugLabTab = screen.getByRole('button', { name: /Drug-Lab Matrix/i });
      fireEvent.click(drugLabTab);

      expect(screen.getByText(/Drug-Lab Pairings \(Mobile View\)/i)).toBeDefined();
      expect(screen.getAllByText(/Potassium/i).length).toBeGreaterThanOrEqual(1);

      const overviewTab = screen.getByRole('button', { name: /Integrated Overview/i });
      fireEvent.click(overviewTab);

      expect(screen.getAllByText(/Critical Alerts/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Moderate Warnings/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Safe Pairings/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
