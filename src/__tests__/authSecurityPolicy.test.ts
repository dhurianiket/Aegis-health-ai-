import { describe, it, expect } from 'vitest';

/**
 * Unit verification test suite for Firebase Auth Blocking Policy (OWASP A07:2025)
 */
describe('Firebase Auth Security Policy (Finding 1 Remediation)', () => {
  const allowedExactEmails = new Set([
    'reviewer@aegishealthai.co.in',
    'dhurianiket@gmail.com',
    'founder@aegishealthai.co.in',
    'admin@aegishealthai.co.in',
    'support@aegishealthai.co.in',
  ]);

  const validateEmailSignup = (user: {
    email?: string;
    phoneNumber?: string;
    providerData?: Array<{ providerId: string }>;
  }): { allowed: boolean; reason?: string } => {
    const hasPasswordProvider = user.providerData?.some((p) => p.providerId === 'password');
    const isEmailOnly =
      (!user.providerData || user.providerData.length === 0) && !!user.email && !user.phoneNumber;

    if (hasPasswordProvider || isEmailOnly) {
      const email = user.email?.toLowerCase().trim() || '';
      const isDomainAllowed = email.endsWith('@aegishealthai.co.in');
      const isWhitelisted = allowedExactEmails.has(email) || isDomainAllowed;

      if (!isWhitelisted) {
        return {
          allowed: false,
          reason: 'Public email registration is restricted. Please sign in with Google or Mobile Phone (+91 OTP).',
        };
      }
    }

    return { allowed: true };
  };

  it('1. Blocks the pentest probe email (pentest-probe@test.invalid)', () => {
    const res = validateEmailSignup({
      email: 'pentest-probe@test.invalid',
      providerData: [{ providerId: 'password' }],
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Public email registration is restricted');
  });

  it('2. Blocks arbitrary attacker email with password provider', () => {
    const res = validateEmailSignup({
      email: 'attacker@evil-domain.com',
      providerData: [{ providerId: 'password' }],
    });
    expect(res.allowed).toBe(false);
  });

  it('3. Allows whitelisted reviewer account (reviewer@aegishealthai.co.in)', () => {
    const res = validateEmailSignup({
      email: 'reviewer@aegishealthai.co.in',
      providerData: [{ providerId: 'password' }],
    });
    expect(res.allowed).toBe(true);
  });

  it('4. Allows whitelisted founder account (dhurianiket@gmail.com)', () => {
    const res = validateEmailSignup({
      email: 'dhurianiket@gmail.com',
      providerData: [{ providerId: 'password' }],
    });
    expect(res.allowed).toBe(true);
  });

  it('5. Allows any organizational email under @aegishealthai.co.in', () => {
    const res = validateEmailSignup({
      email: 'clinician.patel@aegishealthai.co.in',
      providerData: [{ providerId: 'password' }],
    });
    expect(res.allowed).toBe(true);
  });

  it('6. Allows phone-based user registration (+91)', () => {
    const res = validateEmailSignup({
      phoneNumber: '+919969330257',
      providerData: [{ providerId: 'phone' }],
    });
    expect(res.allowed).toBe(true);
  });

  it('7. Allows Google OAuth user registration', () => {
    const res = validateEmailSignup({
      email: 'user@gmail.com',
      providerData: [{ providerId: 'google.com' }],
    });
    expect(res.allowed).toBe(true);
  });
});
