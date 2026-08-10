import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Building2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initiateRazorpayPayment, PaymentOrder } from '../../services/razorpayService';
import { updateUserSubscription } from '../../services/usageService';
import { redeemCoupon } from '../../services/couponService';
import { useAuth } from '../../context/AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId?: string;
  onSubscriptionSuccess?: () => void;
}

export default function PricingModal({
  isOpen,
  onClose,
  currentPlanId = 'free',
  onSubscriptionSuccess,
}: PricingModalProps) {
  const { user } = useAuth();
  const userId = user?.uid || 'demo-user-id';

  const [billingCycle, setBillingCycle] = useState<'b2c' | 'b2b'>('b2c');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');

  if (!isOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsProcessing(true);
    setStatusMessage(null);

    const result = await redeemCoupon(couponCode, userId, user?.email || undefined);

    setIsProcessing(false);
    setStatusMessage(result.message);

    if (result.success) {
      setCouponCode('');
      if (onSubscriptionSuccess) onSubscriptionSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const handleSelectPlan = async (
    planId: 'b2c_monthly' | 'b2c_quarterly' | 'b2b_clinic_monthly' | 'b2b_clinic_quarterly',
    planName: string,
    amountInInr: number
  ) => {
    setIsProcessing(true);
    setStatusMessage(null);

    const order: PaymentOrder = {
      orderId: `order_${planId}_${Date.now()}`,
      amount: amountInInr,
      currency: 'INR',
      planId,
      planName,
    };

    await initiateRazorpayPayment(
      order,
      {
        name: user?.displayName || 'Aegis Subscriber',
        email: user?.email || '',
      },
      async (result) => {
        // Calculate subscription expiration (1 month or 3 months)
        const monthsToAdd = planId.includes('quarterly') ? 3 : 1;
        const expDate = new Date();
        expDate.setMonth(expDate.getMonth() + monthsToAdd);

        await updateUserSubscription(userId, {
          planId,
          planName,
          status: 'active',
          scansUsedThisMonth: 0,
          monthlyScanLimit: Infinity,
          expiresAt: expDate.toISOString(),
          paymentId: result.razorpay_payment_id,
        });

        setIsProcessing(false);
        setStatusMessage(`Successfully upgraded to ${planName}! Unlimited access activated.`);

        if (onSubscriptionSuccess) onSubscriptionSuccess();
        setTimeout(() => {
          onClose();
        }, 1800);
      },
      (errorMsg) => {
        setIsProcessing(false);
        setStatusMessage(errorMsg);
      }
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[36px] shadow-2xl p-6 md:p-10 my-8 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-[var(--color-bg)] hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Special India Launch Offers
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text)] mb-3">
              Unlock Aegis Health Intelligence
            </h2>
            <p className="text-[var(--color-text-muted)] text-sm md:text-base leading-relaxed">
              Choose the plan built for your personal health or clinical practice. Affordable India-first pricing with instant UPI checkout.
            </p>

            {/* B2C vs B2B Category Switcher */}
            <div className="inline-flex p-1.5 mt-6 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl">
              <button
                onClick={() => setBillingCycle('b2c')}
                className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                  billingCycle === 'b2c'
                    ? 'bg-teal-500 text-slate-950 shadow-md'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                Consumer Plans (B2C)
              </button>
              <button
                onClick={() => setBillingCycle('b2b')}
                className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                  billingCycle === 'b2b'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                Doctors & Clinics (B2B)
              </button>
            </div>
          </div>

          {/* Coupon Code Redemption Input Bar */}
          <form onSubmit={handleApplyCoupon} className="max-w-md mx-auto mb-8">
            <div className="flex items-center gap-2 p-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl focus-within:border-teal-500 transition-colors">
              <Sparkles className="w-4 h-4 text-teal-400 ml-3 shrink-0" />
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Have a promo code? (e.g. AEGIS100)"
                className="w-full bg-transparent border-none text-xs md:text-sm font-semibold text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none px-2"
              />
              <button
                type="submit"
                disabled={isProcessing || !couponCode.trim()}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shrink-0"
              >
                Apply
              </button>
            </div>
          </form>

          {/* Feedback message */}
          {statusMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm font-bold text-center">
              {statusMessage}
            </div>
          )}

          {/* B2C Consumer Plans */}
          {billingCycle === 'b2c' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Plan ₹99 */}
              <div className="relative bg-[var(--color-bg)] border border-[var(--color-border)] p-6 md:p-8 rounded-3xl flex flex-col justify-between hover:border-teal-500/50 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                      Standard Monthly
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--color-text)] mb-2">Aegis Pro Monthly</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-[var(--color-text)]">₹99</span>
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">/ month</span>
                  </div>

                  <ul className="space-y-3 mb-8 text-sm text-[var(--color-text-muted)]">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      <strong className="text-[var(--color-text)]">Unlimited</strong> Report OCR Scans & Vision Analysis
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      <strong className="text-[var(--color-text)]">24/7 Aura AI</strong> Health Coach
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      Apple Health & Google Health Sync
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      Up to 5 Family Profiles
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan('b2c_monthly', 'Aegis Pro Monthly', 99)}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing Payment...' : 'Subscribe for ₹99/mo'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quarterly Plan ₹149 (50% OFF) */}
              <div className="relative bg-[var(--color-bg)] border-2 border-teal-500 p-6 md:p-8 rounded-3xl flex flex-col justify-between shadow-xl shadow-teal-500/10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-md">
                  🔥 50% OFF SPECIAL OFFER
                </div>

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Best Value (3 Months)
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--color-text)] mb-2">Aegis Pro Quarterly</h3>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-black text-emerald-400">₹149</span>
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">/ 3 months</span>
                    <span className="text-xs font-bold text-slate-500 line-through">₹297</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-400 mb-6">Effective ₹49.67 / month</p>

                  <ul className="space-y-3 mb-8 text-sm text-[var(--color-text-muted)]">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <strong className="text-[var(--color-text)]">Everything in Monthly Pro</strong>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <strong className="text-[var(--color-text)]">50% Savings</strong> compared to monthly
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      Priority Gemini 3.6 Flash Processing
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      Export HD PDF Lab Comparison Reports
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan('b2c_quarterly', 'Aegis Pro Quarterly', 149)}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing Payment...' : 'Get 3 Months for ₹149'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* B2B Doctor & Clinic Pro Plans */}
          {billingCycle === 'b2b' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* B2B Monthly ₹999 */}
              <div className="relative bg-[var(--color-bg)] border border-[var(--color-border)] p-6 md:p-8 rounded-3xl flex flex-col justify-between hover:border-indigo-500/50 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                      Practitioner OPD
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--color-text)] mb-2">Clinic Pro Monthly</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-[var(--color-text)]">₹999</span>
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">/ month</span>
                  </div>

                  <ul className="space-y-3 mb-8 text-sm text-[var(--color-text-muted)]">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      <strong className="text-[var(--color-text)]">Automated SBAR Handover Reports</strong> for Doctors
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      <strong className="text-[var(--color-text)]">Drug-Lab Contraindication Matrix</strong>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      FHIR R4 JSON & CSV Record Export
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      Multi-Patient Specialist Lounge
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan('b2b_clinic_monthly', 'Clinic Pro Monthly', 999)}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing Payment...' : 'Activate Clinic Pro (₹999/mo)'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* B2B Quarterly ₹2,499 */}
              <div className="relative bg-[var(--color-bg)] border-2 border-indigo-500 p-6 md:p-8 rounded-3xl flex flex-col justify-between shadow-xl shadow-indigo-500/10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-xs uppercase tracking-widest shadow-md">
                  SAVINGS OF ₹498
                </div>

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                      Polyclinic & Hospital OPD
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--color-text)] mb-2">Clinic Pro Quarterly</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-black text-indigo-400">₹2,499</span>
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">/ 3 months</span>
                    <span className="text-xs font-bold text-slate-500 line-through">₹2,997</span>
                  </div>

                  <ul className="space-y-3 mb-8 text-sm text-[var(--color-text-muted)]">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      <strong className="text-[var(--color-text)]">Everything in Clinic Monthly</strong>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      Unlimited Patient Scans & SBAR Summaries
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      Priority Gemini 3.1 Pro Inference
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      Dedicated EHR Data Pipeline Support
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan('b2b_clinic_quarterly', 'Clinic Pro Quarterly', 2499)}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing Payment...' : 'Subscribe for ₹2,499 / 3 mos'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Secure Payment Footer */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> 256-Bit Encrypted Razorpay & UPI Checkout
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-[var(--color-text)]">UPI / GPay / PhonePe / Paytm / Cards</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
