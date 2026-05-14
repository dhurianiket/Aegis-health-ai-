import { describe, it, expect, vi } from 'vitest';
import { getPatientContext } from '../src/services/ai/contextService';
import { getMedications, getDocuments } from '../src/lib/firebase/firestore';

vi.mock('../src/lib/firebase/firestore', () => ({
  getLabHistory: vi.fn().mockResolvedValue([]),
  getMedications: vi.fn(),
  getLatestInsights: vi.fn().mockResolvedValue([]),
  getDocuments: vi.fn(),
}));

describe('ContextService Medication Deduplication', () => {
  it('prefers manual medications over extracted ones', async () => {
    (getMedications as any).mockResolvedValueOnce([
      { name: 'Metformin', dosage: '500mg', source: 'manual', status: 'active' }
    ]);
    
    (getDocuments as any).mockResolvedValueOnce([
      { 
        extractedData: {
          medications: [
            { name: 'Metformin', dosage: '1000mg' }, // conflicting extracted
            'Lisinopril'
          ]
        }
      }
    ]);

    const context = await getPatientContext('user123', null as any);
    
    expect(context.medications).toHaveLength(2);
    // Metformin from manual should win
    const metformin = context.medications.find((m: any) => m.name === 'Metformin');
    expect(metformin).toBeDefined();
    expect(metformin?.dosage).toBe('500mg');
  });
});
