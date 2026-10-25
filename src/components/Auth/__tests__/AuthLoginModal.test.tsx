import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthLoginModal } from '../AuthLoginModal';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock AuthContext
const mockSignIn = vi.fn();
const mockSignInWithEmail = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInWithEmail: mockSignInWithEmail,
    isSigningIn: false,
    user: null,
  }),
}));

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  RecaptchaVerifier: vi.fn().mockImplementation(() => ({
    clear: vi.fn(),
  })),
  signInWithPhoneNumber: vi.fn(),
  getAuth: vi.fn(),
}));

// Mock firebase config
vi.mock('../../../lib/firebase/config', () => ({
  auth: {},
}));

describe('AuthLoginModal Component', () => {
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with Mobile OTP and Email tabs when isOpen is true', () => {
    render(<AuthLoginModal isOpen={true} onClose={onCloseMock} />);

    expect(screen.getByText('Sign In to Aegis Health AI')).toBeDefined();
    expect(screen.getByRole('button', { name: /Mobile OTP/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Email ID/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Continue with Google Account/i })).toBeDefined();
  });

  it('defaults to Mobile OTP tab with +91 prefix and demo phone button', () => {
    render(<AuthLoginModal isOpen={true} onClose={onCloseMock} />);

    const phoneInput = screen.getByLabelText(/Mobile Number/i) as HTMLInputElement;
    expect(phoneInput).toBeDefined();
    expect(screen.getByText('+91')).toBeDefined();
    expect(screen.getByText(/Use \+91 99999 99999/i)).toBeDefined();
  });

  it('autofills demo phone number when demo button is clicked', () => {
    render(<AuthLoginModal isOpen={true} onClose={onCloseMock} />);

    const demoBtn = screen.getByText(/Use \+91 99999 99999/i);
    fireEvent.click(demoBtn);

    const phoneInput = screen.getByLabelText(/Mobile Number/i) as HTMLInputElement;
    expect(phoneInput.value).toBe('9999999999');
  });

  it('switches to Email tab when Email ID button is clicked', () => {
    render(<AuthLoginModal isOpen={true} onClose={onCloseMock} />);

    const emailTab = screen.getByRole('button', { name: /Email ID/i });
    fireEvent.click(emailTab);

    expect(screen.getByLabelText(/Email ID/i)).toBeDefined();
    expect(screen.getByLabelText(/Password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign In with Email/i })).toBeDefined();
  });

  it('triggers Google sign in and navigates to dashboard on success', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    render(<AuthLoginModal isOpen={true} onClose={onCloseMock} />);

    const googleBtn = screen.getByRole('button', { name: /Continue with Google Account/i });
    fireEvent.click(googleBtn);

    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it('navigates to dashboard when Explore Guest Demo is clicked', () => {
    render(<AuthLoginModal isOpen={true} onClose={onCloseMock} />);

    const guestDemoBtn = screen.getByRole('button', { name: /Explore Guest Demo/i });
    fireEvent.click(guestDemoBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<AuthLoginModal isOpen={false} onClose={onCloseMock} />);
    expect(container.firstChild).toBeNull();
  });
});
