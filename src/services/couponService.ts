import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { updateUserSubscription } from './usageService';

export interface CouponData {
  code: string;
  discountType: 'free_month';
  durationMonths: number;
  maxRedemptions: number;
  currentRedemptions: number;
  expiresAt: string; // e.g. 2026-12-31T23:59:59Z
  active: boolean;
}

export interface RedeemCouponResult {
  success: boolean;
  message: string;
  planName?: string;
  expiresAt?: string;
}

const DEFAULT_LAUNCH_COUPON: CouponData = {
  code: 'AEGIS100',
  discountType: 'free_month',
  durationMonths: 1,
  maxRedemptions: 100,
  currentRedemptions: 0,
  expiresAt: '2026-12-31T23:59:59Z',
  active: true,
};

const LOCAL_COUPONS_PREFIX = 'aegis_coupon_redemptions';

/**
 * Validates and redeems a promotional coupon code for a given user.
 */
export async function redeemCoupon(
  code: string,
  userId: string,
  userEmail?: string
): Promise<RedeemCouponResult> {
  const normalizedCode = (code || '').trim().toUpperCase();

  // 1. Admin email master access check (even if no code is typed)
  if (userEmail && userEmail.toLowerCase() === 'dhurianiket@gmail.com') {
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 5); // 5 Years Master Access

    await updateUserSubscription(userId, {
      planId: 'b2b_clinic_quarterly',
      planName: 'Master Admin Access',
      status: 'active',
      scansUsedThisMonth: 0,
      monthlyScanLimit: Infinity,
      expiresAt: expDate.toISOString(),
    });

    return {
      success: true,
      message: 'Master Admin Access activated for dhurianiket@gmail.com!',
      planName: 'Master Admin Access',
      expiresAt: expDate.toISOString(),
    };
  }

  if (!normalizedCode) {
    return { success: false, message: 'Please enter a valid coupon code.' };
  }

  // Check AEGIS100 launch coupon
  if (normalizedCode === 'AEGIS100' || normalizedCode === 'LAUNCH100' || normalizedCode === 'FREE100') {
    // 1. Check local redemption history to prevent double claiming
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const claimed = window.localStorage.getItem(`${LOCAL_COUPONS_PREFIX}_${userId}_${normalizedCode}`);
        if (claimed) {
          return {
            success: false,
            message: 'You have already redeemed this launch coupon code.',
          };
        }
      }
    } catch {}

    // 2. Fetch or initialize Firestore coupon document
    const couponRef = doc(db, `coupons/${normalizedCode}`);
    let currentClaims = 0;

    try {
      const snap = await getDoc(couponRef);
      if (snap.exists()) {
        const data = snap.data();
        currentClaims = data.currentRedemptions || 0;
        if (currentClaims >= DEFAULT_LAUNCH_COUPON.maxRedemptions) {
          return {
            success: false,
            message: `Coupon code ${normalizedCode} has reached its maximum limit of 100 users.`,
          };
        }
      } else {
        // Initialize doc
        await setDoc(couponRef, {
          ...DEFAULT_LAUNCH_COUPON,
          code: normalizedCode,
          createdAt: serverTimestamp(),
        });
      }

      // Increment redemption counter in Firestore
      await updateDoc(couponRef, {
        currentRedemptions: increment(1),
        lastRedeemedAt: serverTimestamp(),
      });
    } catch (e: any) {
      console.warn('[Coupon] Firestore count update fallback:', e.message);
    }

    // 3. Activate 1 Month Full Pro Access
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + 1);

    await updateUserSubscription(userId, {
      planId: 'b2c_monthly',
      planName: 'Launch Special 1-Month Pro Free',
      status: 'active',
      scansUsedThisMonth: 0,
      monthlyScanLimit: Infinity,
      expiresAt: expDate.toISOString(),
      paymentId: `coupon_${normalizedCode}_${Date.now()}`,
    });

    // Mark claimed in local storage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`${LOCAL_COUPONS_PREFIX}_${userId}_${normalizedCode}`, 'true');
      }
    } catch {}

    return {
      success: true,
      message: `Coupon AEGIS100 applied! 1 Month of Full Aegis Pro Access activated for free. (${currentClaims + 1}/100 slots claimed)`,
      planName: 'Launch Special 1-Month Pro Free',
      expiresAt: expDate.toISOString(),
    };
  }

  return {
    success: false,
    message: 'Invalid coupon code. Please try code "AEGIS100".',
  };
}
