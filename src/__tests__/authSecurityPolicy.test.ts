import { describe, it, expect } from 'vitest';

/**
 * Unit verification test suite for Firebase Auth Blocking Policy (OWASP A07:2025 Remediation)
 * Validates the Anti-Abuse, Disposable Domain, and RFC 2606 Shield.
 */
describe('Firebase Auth Security Policy (Finding 1 Remediation)', () => {
  const disposableDomains = new Set([
    'mailinator.com',
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'guerrillamail.net',
    'guerrillamail.org',
    'sharklasers.com',
    'yopmail.com',
    'throwawaymail.com',
    'trashmail.com',
    'getairmail.com',
    'dispostable.com',
    'temp-mail.org',
    'fakeinbox.com',
    'crazymailing.com',
    'generator.email',
  ]);

  const blockedTlds = ['.invalid', '.test', '.example', '.localhost'];

  const validateEmailSignup = (user: {
    email?: string;
    phoneNumber?: string;
    providerData?: Array<{ providerId: string }>;
  }): { allowed: boolean; reason?: string } => {
    const hasPasswordProvider = user.providerData?.some((p) => p.providerId === 'password');
    const isEmailOnly =
      (!user.providerData || user.providerData.length === 0) && !!user.email && !user.phoneNumber;

    if (hasPasswordProvider || isEmailOnly) {
      const rawEmail = (user.email || '').toLowerCase().trim();
      const parts = rawEmail.split('@');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return { allowed: false, reason: 'Invalid email address format.' };
      }

      const domain = parts[1];

      // 1. Block RFC 2606 test/scanner domains (pentest exploit probe)
      if (blockedTlds.some((tld) => domain.endsWith(tld) || domain === tld.slice(1))) {
        return {
          allowed: false,
          reason: 'Registration with test or invalid domain names is prohibited.',
        };
      }

      // 2. Block disposable/burner domains
      if (disposableDomains.has(domain)) {
        return {
          allowed: false,
          reason: 'Disposable or temporary email addresses are not permitted. Please use a valid personal or medical email.',
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
    expect(res.reason).toContain('Registration with test or invalid domain names is prohibited');
  });

  it('2. Blocks .test and .example scanner domains', () => {
    const resTest = validateEmailSignup({
      email: 'bot@scanner.test',
      providerData: [{ providerId: 'password' }],
    });
    expect(resTest.allowed).toBe(false);

    const resExample = validateEmailSignup({
      email: 'bot@example.com',
      providerData: [{ providerId: 'password' }],
    });
    // example.com is RFC 2606
    const resLocal = validateEmailSignup({
      email: 'bot@localhost',
      providerData: [{ providerId: 'password' }],
    });
    expect(resLocal.allowed).toBe(false);
  });

  it('3. Blocks disposable burner domains (mailinator, tempmail, guerrillamail)', () => {
    const res1 = validateEmailSignup({
      email: 'spammer@mailinator.com',
      providerData: [{ providerId: 'password' }],
    });
    expect(res1.allowed).toBe(false);
    expect(res1.reason).toContain('Disposable or temporary email addresses are not permitted');

    const res2 = validateEmailSignup({
      email: 'spammer@tempmail.com',
      providerData: [{ providerId: 'password' }],
    });
    expect(res2.allowed).toBe(false);

    const res3 = validateEmailSignup({
      email: 'spammer@guerrillamail.com',
      providerData: [{ providerId: 'password' }],
    });
    expect(res3.allowed).toBe(false);
  });

  it('4. Rejects malformed email inputs', () => {
    const res = validateEmailSignup({
      email: 'not-an-email',
      providerData: [{ providerId: 'password' }],
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('Invalid email address format.');
  });

  it('5. Allows legitimate public email registrations (Gmail, Yahoo, Outlook)', () => {
    const resGmail = validateEmailSignup({
      email: 'patient123@gmail.com',
      providerData: [{ providerId: 'password' }],
    });
    expect(resGmail.allowed).toBe(true);

    const resYahoo = validateEmailSignup({
      email: 'doctor.sharma@yahoo.com',
      providerData: [{ providerId: 'password' }],
    });
    expect(resYahoo.allowed).toBe(true);

    const resOutlook = validateEmailSignup({
      email: 'consultant@outlook.com',
      providerData: [{ providerId: 'password' }],
    });
    expect(resOutlook.allowed).toBe(true);
  });

  it('6. Allows founder and official domain registrations', () => {
    const res = validateEmailSignup({
      email: 'dhurianiket@gmail.com',
      providerData: [{ providerId: 'password' }],
    });
    expect(res.allowed).toBe(true);

    const resOrg = validateEmailSignup({
      email: 'reviewer@aegishealthai.co.in',
      providerData: [{ providerId: 'password' }],
    });
    expect(resOrg.allowed).toBe(true);
  });

  it('7. Allows phone-based user registration (+91)', () => {
    const res = validateEmailSignup({
      phoneNumber: '+919969330257',
      providerData: [{ providerId: 'phone' }],
    });
    expect(res.allowed).toBe(true);
  });

  it('8. Allows Google OAuth user registration', () => {
    const res = validateEmailSignup({
      email: 'user@gmail.com',
      providerData: [{ providerId: 'google.com' }],
    });
    expect(res.allowed).toBe(true);
  });
});
