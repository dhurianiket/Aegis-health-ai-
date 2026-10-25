import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IdentityLinkingCard from '../IdentityLinkingCard';

const mockLinkWithPopup = vi.fn().mockResolvedValue({ user: {} });
const mockUnlink = vi.fn().mockResolvedValue({});
const mockHttpsCallable = vi.fn();

let mockCurrentUser: any = {
  uid: 'founder-uid-123',
  email: 'dhurianiket@gmail.com',
  phoneNumber: null,
  providerData: [
    { providerId: 'google.com', email: 'dhurianiket@gmail.com' },
  ],
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
};

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
  }),
}));

vi.mock('../../../lib/firebase/config', () => ({
  auth: {
    get currentUser() {
      return mockCurrentUser;
    },
  },
  googleProvider: { providerId: 'google.com' },
  functions: {},
}));

vi.mock('firebase/auth', () => ({
  linkWithPopup: (...args: any[]) => mockLinkWithPopup(...args),
  unlink: (...args: any[]) => mockUnlink(...args),
  RecaptchaVerifier: vi.fn().mockImplementation(() => ({
    render: vi.fn().mockResolvedValue(1),
    clear: vi.fn(),
  })),
  signInWithPhoneNumber: vi.fn().mockResolvedValue({
    verificationId: 'mock-verification-id',
  }),
  PhoneAuthProvider: {
    credential: vi.fn().mockReturnValue({ providerId: 'phone' }),
  },
  linkWithCredential: vi.fn().mockResolvedValue({}),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: any[]) => mockHttpsCallable(...args),
}));

describe('IdentityLinkingCard Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = {
      uid: 'founder-uid-123',
      email: 'dhurianiket@gmail.com',
      phoneNumber: null,
      providerData: [
        { providerId: 'google.com', email: 'dhurianiket@gmail.com' },
      ],
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    };
  });

  it('1. Renders linked Google account with verified badge', () => {
    render(<IdentityLinkingCard />);

    expect(screen.getByText('Linked Login Identities & Security')).toBeDefined();
    expect(screen.getByText('dhurianiket@gmail.com')).toBeDefined();
    expect(screen.getByText('Linked & Verified')).toBeDefined();
  });

  it('2. Shows founder quick-link button when founder email is active', () => {
    render(<IdentityLinkingCard />);

    const founderButton = screen.getByRole('button', {
      name: /Link Founder Phone \(\+91 99693 30257\)/i,
    });
    expect(founderButton).toBeDefined();
  });

  it('3. Successfully invokes linkFounderPhoneNumber Cloud Function on 1-click trigger', async () => {
    const mockCallableFn = vi.fn().mockResolvedValue({
      data: { success: true, phoneNumber: '+919969330257' },
    });
    mockHttpsCallable.mockReturnValue(mockCallableFn);

    render(<IdentityLinkingCard />);

    const founderButton = screen.getByRole('button', {
      name: /Link Founder Phone \(\+91 99693 30257\)/i,
    });
    fireEvent.click(founderButton);

    await waitFor(() => {
      expect(mockHttpsCallable).toHaveBeenCalledWith({}, 'linkFounderPhoneNumber');
      expect(mockCallableFn).toHaveBeenCalled();
      expect(screen.getByText(/Founder mobile number \+91 99693 30257 successfully linked/i)).toBeDefined();
    });
  });

  it('4. Allows phone-authenticated user to link Google Account', async () => {
    mockCurrentUser = {
      uid: 'phone-user-456',
      email: null,
      phoneNumber: '+919969330257',
      providerData: [
        { providerId: 'phone', phoneNumber: '+919969330257' },
      ],
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    };

    render(<IdentityLinkingCard />);

    expect(screen.getByText('+919969330257')).toBeDefined();
    const linkGoogleButton = screen.getByRole('button', {
      name: /Link Google Account/i,
    });
    expect(linkGoogleButton).toBeDefined();

    fireEvent.click(linkGoogleButton);

    await waitFor(() => {
      expect(mockLinkWithPopup).toHaveBeenCalledWith(
        expect.objectContaining({ uid: 'phone-user-456' }),
        expect.objectContaining({ providerId: 'google.com' })
      );
    });
  });

  it('5. Allows unlinking a secondary provider when multiple providers exist', async () => {
    window.confirm = vi.fn().mockReturnValue(true);

    mockCurrentUser = {
      uid: 'multi-user-789',
      email: 'test@aegishealthai.co.in',
      phoneNumber: '+919876543210',
      providerData: [
        { providerId: 'google.com', email: 'test@aegishealthai.co.in' },
        { providerId: 'phone', phoneNumber: '+919876543210' },
      ],
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    };

    render(<IdentityLinkingCard />);

    const unlinkButtons = screen.getAllByRole('button', { name: /Unlink/i });
    expect(unlinkButtons.length).toBeGreaterThan(0);

    fireEvent.click(unlinkButtons[0]);

    await waitFor(() => {
      expect(mockUnlink).toHaveBeenCalled();
    });
  });
});
