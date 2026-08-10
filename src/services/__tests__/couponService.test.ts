import { describe, it, expect, vi } from 'vitest';
import { redeemCoupon } from '../couponService';

vi.mock('../../lib/firebase/config', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ currentRedemptions: 5, maxRedemptions: 100 }),
  }),
  setDoc: vi.fn().mockResolvedValue(true),
  updateDoc: vi.fn().mockResolvedValue(true),
  increment: vi.fn((n) => n),
  serverTimestamp: vi.fn(() => 'TIMESTAMP'),
}));

vi.mock('../usageService', () => ({
  updateUserSubscription: vi.fn().mockImplementation((userId, updates) =>
    Promise.resolve({ planId: updates.planId, planName: updates.planName, status: 'active' })
  ),
}));

describe('Coupon Service Test Suite', () => {
  it('1. Rejects empty or whitespace coupon code', async () => {
    const res = await redeemCoupon('   ', 'user1');
    expect(res.success).toBe(false);
    expect(res.message).toContain('valid coupon code');
  });

  it('2. Grants Master Admin Access for dhurianiket@gmail.com', async () => {
    const res = await redeemCoupon('', 'adminUser', 'dhurianiket@gmail.com');
    expect(res.success).toBe(true);
    expect(res.planName).toBe('Master Admin Access');
    expect(res.message).toContain('Master Admin Access activated');
  });

  it('3. Successfully redeems AEGIS100 coupon code for 1 Month Free Pro access', async () => {
    const res = await redeemCoupon('AEGIS100', 'testUser99', 'user@example.com');
    expect(res.success).toBe(true);
    expect(res.planName).toBe('Launch Special 1-Month Pro Free');
    expect(res.message).toContain('AEGIS100 applied');
  });

  it('4. Rejects invalid coupon code', async () => {
    const res = await redeemCoupon('INVALID_CODE', 'user1');
    expect(res.success).toBe(false);
    expect(res.message).toContain('Invalid coupon code');
  });
});
