import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import PricingModal from '../PricingModal';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123', email: 'test@aegishealth.ai', displayName: 'Test User' },
  }),
}));

vi.mock('../../../services/razorpayService', () => ({
  initiateRazorpayPayment: vi.fn().mockImplementation((order, userInfo, onSuccess) => {
    onSuccess({
      razorpay_payment_id: 'pay_mock_123',
      razorpay_order_id: order.orderId,
      razorpay_signature: 'sig_mock_123',
      planId: order.planId,
    });
  }),
}));

vi.mock('../../../services/usageService', () => ({
  updateUserSubscription: vi.fn().mockResolvedValue({
    planId: 'b2c_monthly',
    planName: 'Aegis Pro Monthly',
    status: 'active',
  }),
}));

describe('PricingModal Component Test Suite', () => {
  it('1. Does not render when isOpen is false', () => {
    const { container } = render(<PricingModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('2. Renders B2C pricing plans correctly when isOpen is true', () => {
    render(<PricingModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Unlock Aegis Health Intelligence')).not.toBeNull();
    expect(screen.getByText('₹99')).not.toBeNull();
    expect(screen.getByText('₹149')).not.toBeNull();
  });

  it('3. Toggles to B2B Doctor & Clinic Pro plans', () => {
    render(<PricingModal isOpen={true} onClose={vi.fn()} />);
    const b2bTab = screen.getByText(/Doctors & Clinics/i);
    fireEvent.click(b2bTab);

    expect(screen.getByText('Clinic Pro Monthly')).not.toBeNull();
    expect(screen.getByText('₹999')).not.toBeNull();
    expect(screen.getByText('₹2,499')).not.toBeNull();
  });

  it('4. Triggers plan checkout handler on click', async () => {
    const onSuccessMock = vi.fn();
    render(<PricingModal isOpen={true} onClose={vi.fn()} onSubscriptionSuccess={onSuccessMock} />);

    const subscribeBtn = screen.getByRole('button', { name: /Subscribe for ₹99\/mo/i });
    fireEvent.click(subscribeBtn);

    const successMessage = await screen.findByText(/Successfully upgraded/i);
    expect(successMessage).not.toBeNull();
  });
});
