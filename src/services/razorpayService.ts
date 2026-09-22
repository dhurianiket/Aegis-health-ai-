export interface PaymentOrder {
  orderId: string;
  amount: number; // Amount in INR (Rupees), e.g. 299 for ₹299
  currency: string;
  planId: 'b2c_monthly' | 'b2c_quarterly' | 'b2b_clinic_monthly' | 'b2b_clinic_quarterly';
  planName: string;
}

export interface PaymentSuccessResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  planId: string;
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Dynamically loads the Razorpay Checkout SDK script into the DOM.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Initiates Razorpay payment checkout modal for B2C & B2B subscription plans.
 * Fails closed: Never simulates success if script is blocked or gateway rejects.
 */
export async function initiateRazorpayPayment(
  order: PaymentOrder,
  userInfo: { name?: string; email?: string; phone?: string },
  onSuccess: (result: PaymentSuccessResult) => void,
  onError: (errorMsg: string) => void
): Promise<void> {
  const isScriptLoaded = await loadRazorpayScript();

  if (!isScriptLoaded) {
    console.error('[Razorpay] SDK script blocked or offline.');
    onError('Unable to load payment gateway. Please check your network connection or ad-blocker.');
    return;
  }

  const razorpayKey =
    (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_aegis_health_ai';

  const options = {
    key: razorpayKey,
    amount: Math.round(order.amount * 100), // Converted to paise for Razorpay API (e.g., 299 INR -> 29900 paise)
    currency: order.currency || 'INR',
    name: 'Aegis Health AI',
    description: `Subscription: ${order.planName}`,
    image: '/favicon.ico',
    order_id: order.orderId,
    prefill: {
      name: userInfo.name || '',
      email: userInfo.email || '',
      contact: userInfo.phone || '',
    },
    theme: {
      color: '#0d9488', // Teal theme
    },
    handler: function (response: any) {
      if (!response?.razorpay_payment_id || !response?.razorpay_signature) {
        console.error('[Razorpay] Missing payment credentials from checkout handler:', response);
        onError('Payment verification failed: Incomplete payment response from gateway.');
        return;
      }

      onSuccess({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id || order.orderId,
        razorpay_signature: response.razorpay_signature,
        planId: order.planId,
      });
    },
    modal: {
      ondismiss: function () {
        onError('Payment checkout closed by user.');
      },
    },
  };

  try {
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  } catch (err: any) {
    console.error('[Razorpay] Checkout modal invocation error:', err);
    onError('Payment gateway initialization failed. Please try again.');
  }
}
