import { describe, it, expect } from 'vitest';
import { checkMedicationInteractions } from '../medicationCheckService';
import { MedicationStatus } from '../../types/medical';

describe('MedicationCheckService', () => {
  it('should detect duplicate therapy in the same class (Statins)', () => {
    const meds = [
      {
        id: '1',
        name: 'Atorvastatin',
        status: MedicationStatus.ACTIVE,
      },
      {
        id: '2',
        name: 'Simvastatin',
        status: MedicationStatus.ACTIVE,
      }
    ];

    const alerts = checkMedicationInteractions(meds as any);
    expect(alerts.some(a => a.title === 'Duplicate Therapy Detected')).toBe(true);
  });

  it('should detect critical drug interactions (Warfarin + NSAID)', () => {
    const meds = [
      {
        id: '1',
        name: 'Warfarin',
        status: MedicationStatus.ACTIVE,
      },
      {
        id: '2',
        name: 'Ibuprofen',
        status: MedicationStatus.ACTIVE,
      }
    ];

    const alerts = checkMedicationInteractions(meds as any);
    expect(alerts.some(a => a.severity === 'critical' && a.title === 'Potential Drug Interaction')).toBe(true);
  });

  it('should not detect interactions for inactive medications', () => {
    const meds = [
      {
        id: '1',
        name: 'Warfarin',
        status: MedicationStatus.ACTIVE,
      },
      {
        id: '2',
        name: 'Ibuprofen',
        status: MedicationStatus.DISCONTINUED,
      }
    ];

    const alerts = checkMedicationInteractions(meds as any);
    expect(alerts.length).toBe(0);
  });
});
