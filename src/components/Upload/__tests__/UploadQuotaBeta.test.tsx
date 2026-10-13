import { describe, it, expect, vi } from 'vitest';
import { checkCanUploadReport, getUserSubscription } from '../../../services/usageService';

vi.mock('../../../lib/firebase/config', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => false,
  }),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  collectionGroup: vi.fn(),
  increment: vi.fn((n) => n),
  serverTimestamp: vi.fn(() => 'TIMESTAMP'),
}));

describe('Upload Quota & Paywall Exemption in Early Access Beta', () => {
  it('guarantees registered free users receive an unlimited monthly scan limit', async () => {
    const sub = await getUserSubscription('test_user_beta');
    expect(sub.monthlyScanLimit).toBe(Infinity);
    expect(sub.planName).toBe('Early Access Beta');
  });

  it('ensures checkCanUploadReport never blocks report processing with a paywall error', async () => {
    const result = await checkCanUploadReport('test_user_beta');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
  });

  it('allows consecutive uploads even if multiple scans have already been processed', async () => {
    // Simulate user with existing scans
    const mockStorage: Record<string, string> = {
      aegis_user_sub_consecutive_user: JSON.stringify({
        planId: 'free',
        planName: 'Early Access Beta',
        status: 'active',
        scansUsedThisMonth: 42,
        monthlyScanLimit: Infinity,
        expiresAt: null,
        updatedAt: new Date().toISOString(),
      }),
    };

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] || null);

    const check1 = await checkCanUploadReport('consecutive_user');
    expect(check1.allowed).toBe(true);
    expect(check1.scansUsed).toBe(42);
    expect(check1.limit).toBe(Infinity);

    vi.restoreAllMocks();
  });

  it('guarantees consecutive calls allow uploads for users exceeding 100 scans', async () => {
    const mockStorage: Record<string, string> = {
      aegis_user_sub_high_volume_user: JSON.stringify({
        planId: 'free',
        planName: 'Early Access Beta',
        status: 'active',
        scansUsedThisMonth: 150,
        monthlyScanLimit: Infinity,
        expiresAt: null,
        updatedAt: new Date().toISOString(),
      }),
    };

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] || null);

    for (let i = 0; i < 5; i++) {
      const res = await checkCanUploadReport('high_volume_user');
      expect(res.allowed).toBe(true);
      expect(res.limit).toBe(Infinity);
    }

    vi.restoreAllMocks();
  });
});
