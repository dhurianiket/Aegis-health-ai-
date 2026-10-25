import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Unlink,
  Link2,
  Sparkles,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth, googleProvider, functions } from '../../lib/firebase/config';
import {
  linkWithPopup,
  unlink,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  ConfirmationResult,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

export const IdentityLinkingCard: React.FC = () => {
  const { user } = useAuth();

  // State
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phone linking state
  const [isPhoneFormOpen, setIsPhoneFormOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const currentUser = auth.currentUser || user;

  // Derive linked providers
  const providers = currentUser?.providerData || [];
  const isGoogleLinked = providers.some((p) => p.providerId === 'google.com');
  const isPhoneLinked = providers.some((p) => p.providerId === 'phone') || !!currentUser?.phoneNumber;
  const isEmailPasswordLinked = providers.some((p) => p.providerId === 'password');
  const linkedCount = providers.length || (currentUser ? 1 : 0);

  // Founder detection
  const isFounderAccount =
    currentUser?.email?.toLowerCase() === 'dhurianiket@gmail.com' ||
    currentUser?.phoneNumber === '+919969330257';

  // Cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore cleanup errors
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  /**
   * Link Google OAuth Account
   */
  const handleLinkGoogle = async () => {
    if (!currentUser) return;
    clearMessages();
    setLoadingAction('google');
    try {
      await linkWithPopup(currentUser, googleProvider);
      try {
        if (currentUser.reload) await currentUser.reload();
      } catch {
        // ignore
      }
      setSuccessMessage('Successfully linked your Google account! You can now sign in with Google or Phone.');
    } catch (err: any) {
      console.error('[IdentityLinking] Google link error:', err);
      if (err.code === 'auth/credential-already-in-use') {
        setErrorMessage(
          'This Google account is already registered to another Aegis profile. To access it, please sign out and log in with Google.'
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google Sign-In popup was closed before linking completed.');
      } else {
        setErrorMessage(err.message || 'Failed to link Google account.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  /**
   * One-Click Founder Phone Link via Cloud Function
   */
  const handleFounderQuickLink = async () => {
    if (!currentUser) return;
    clearMessages();
    setLoadingAction('founder-phone');
    try {
      const linkFounderFn = httpsCallable(functions, 'linkFounderPhoneNumber');
      const res: any = await linkFounderFn();
      if (res.data?.success) {
        setSuccessMessage(
          `Founder mobile number +91 99693 30257 successfully linked to ${currentUser.email}! Both credentials now unlock your Aegis workspace.`
        );
        // Refresh token & user state to reflect provider update
        try {
          if (currentUser.reload) await currentUser.reload();
          await currentUser.getIdToken(true);
        } catch {
          // ignore background token refresh
        }
      }
    } catch (err: any) {
      console.error('[IdentityLinking] Founder link error:', err);
      setErrorMessage(
        err.message || 'Failed to link founder phone number automatically. You can use the standard SMS OTP link below.'
      );
    } finally {
      setLoadingAction(null);
    }
  };

  /**
   * Request Phone OTP for Account Linking
   */
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    clearMessages();

    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoadingAction('send-phone-otp');
    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'settings-link-recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // invisible execution
          },
          'expired-callback': () => {
            setErrorMessage('reCAPTCHA expired. Please try sending OTP again.');
          },
        });
        await recaptchaVerifierRef.current.render();
      }

      const fullE164 = `+91${cleanDigits}`;
      // Use signInWithPhoneNumber to acquire verificationId
      const result = await signInWithPhoneNumber(auth, fullE164, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setCountdown(30);
      setSuccessMessage(`OTP sent successfully to +91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}. Enter the 6-digit code below.`);
    } catch (err: any) {
      console.error('[IdentityLinking] Phone OTP error:', err);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }
      if (err.code === 'auth/invalid-phone-number') {
        setErrorMessage('Invalid phone number format. Please check the 10 digits.');
      } else if (err.code === 'auth/quota-exceeded') {
        setErrorMessage('SMS quota exceeded for today. Please try again later.');
      } else {
        setErrorMessage(err.message || 'Failed to dispatch SMS verification OTP.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  /**
   * Verify OTP and Link Phone Credential
   */
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !confirmationResult) return;
    clearMessages();

    const cleanCode = otpCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoadingAction('verify-phone-otp');
    try {
      const phoneCredential = PhoneAuthProvider.credential(confirmationResult.verificationId, cleanCode);
      await linkWithCredential(currentUser, phoneCredential);
      try {
        if (currentUser.reload) await currentUser.reload();
      } catch {
        // ignore
      }

      setSuccessMessage('Mobile phone successfully verified and linked to your account!');
      setIsPhoneFormOpen(false);
      setConfirmationResult(null);
      setOtpCode('');
      setPhoneNumber('');
    } catch (err: any) {
      console.error('[IdentityLinking] OTP verification link error:', err);
      if (err.code === 'auth/credential-already-in-use') {
        setErrorMessage(
          'This phone number is already linked to another Aegis profile. Please sign in directly with this mobile number.'
        );
      } else if (err.code === 'auth/invalid-verification-code') {
        setErrorMessage('Incorrect verification code. Please check your SMS and try again.');
      } else if (err.code === 'auth/code-expired') {
        setErrorMessage('Verification code has expired. Please request a new OTP.');
      } else {
        setErrorMessage(err.message || 'Failed to verify and link phone number.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  /**
   * Unlink a provider (safe only if at least 1 remains)
   */
  const handleUnlink = async (providerId: string, label: string) => {
    if (!currentUser) return;
    if (linkedCount <= 1) {
      alert('You cannot unlink your only login method. Please link an alternative method first.');
      return;
    }

    if (!window.confirm(`Are you sure you want to unlink your ${label}? You will no longer be able to sign in using it.`)) {
      return;
    }

    clearMessages();
    setLoadingAction(`unlink-${providerId}`);
    try {
      await unlink(currentUser, providerId);
      try {
        if (currentUser.reload) await currentUser.reload();
      } catch {
        // ignore
      }
      setSuccessMessage(`Successfully unlinked ${label}.`);
    } catch (err: any) {
      console.error('[IdentityLinking] Unlink error:', err);
      setErrorMessage(err.message || `Failed to unlink ${label}.`);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!currentUser) return null;

  return (
    <section
      aria-label="Account Identity and Linked Login Methods"
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 sm:p-6 shadow-xs"
    >
      <div id="settings-link-recaptcha-container" />

      {/* Card Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)]">
                Linked Login Identities &amp; Security
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Multi-Factor Ready
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Sign in seamlessly using either your verified Mobile Phone (+91 OTP) or Google Account. Both credentials securely access the exact same health records.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Identity Methods List */}
      <div className="space-y-3.5">
        {/* ── 1. Google Account ── */}
        <div className="p-4 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[var(--color-text)]">Google Account</span>
                {isGoogleLinked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <CheckCircle2 className="w-3 h-3" /> Linked &amp; Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 font-mono">
                {currentUser.email || 'No email associated'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {isGoogleLinked ? (
              linkedCount > 1 ? (
                <button
                  type="button"
                  onClick={() => handleUnlink('google.com', 'Google Account')}
                  disabled={loadingAction === 'unlink-google.com'}
                  className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] hover:border-rose-500/40 text-xs font-semibold text-[var(--color-text-muted)] hover:text-rose-500 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loadingAction === 'unlink-google.com' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5" />
                  )}
                  Unlink
                </button>
              ) : (
                <span className="text-[11px] text-[var(--color-text-faint)] font-medium">Primary Login</span>
              )
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={loadingAction === 'google'}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {loadingAction === 'google' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Link Google Account
              </button>
            )}
          </div>
        </div>

        {/* ── 2. Mobile Phone Number (+91) ── */}
        <div className="p-4 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] flex flex-col justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[var(--color-text)]">Mobile Phone (+91 OTP)</span>
                  {isPhoneLinked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      <CheckCircle2 className="w-3 h-3" /> Linked &amp; Verified
                    </span>
                  )}
                  {isFounderAccount && isPhoneLinked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                      <Sparkles className="w-3 h-3" /> Founder Primary Line
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 font-mono">
                  {currentUser.phoneNumber || 'No mobile number linked'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
              {isPhoneLinked ? (
                linkedCount > 1 ? (
                  <button
                    type="button"
                    onClick={() => handleUnlink('phone', 'Mobile Phone')}
                    disabled={loadingAction === 'unlink-phone'}
                    className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] hover:border-rose-500/40 text-xs font-semibold text-[var(--color-text-muted)] hover:text-rose-500 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loadingAction === 'unlink-phone' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Unlink className="w-3.5 h-3.5" />
                    )}
                    Unlink
                  </button>
                ) : (
                  <span className="text-[11px] text-[var(--color-text-faint)] font-medium">Primary Login</span>
                )
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Founder Fast-Link Button */}
                  {currentUser.email?.toLowerCase() === 'dhurianiket@gmail.com' && (
                    <button
                      type="button"
                      onClick={handleFounderQuickLink}
                      disabled={loadingAction === 'founder-phone'}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {loadingAction === 'founder-phone' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-slate-950" />
                      )}
                      ⚡ Link Founder Phone (+91 99693 30257)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsPhoneFormOpen(!isPhoneFormOpen)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-xs"
                  >
                    <Phone className="w-4 h-4" />
                    {isPhoneFormOpen ? 'Cancel' : 'Link Mobile Number'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Inline Phone OTP Form */}
          {isPhoneFormOpen && !isPhoneLinked && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-3">
              {!confirmationResult ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                  <label htmlFor="settings-link-phone" className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Enter Indian Mobile Number (+91)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-mono font-bold text-[var(--color-text)] shrink-0">
                      🇮🇳 +91
                    </div>
                    <input
                      id="settings-link-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9969330257"
                      maxLength={10}
                      required
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] font-mono placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={loadingAction === 'send-phone-otp' || phoneNumber.length !== 10}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 shadow-xs"
                    >
                      {loadingAction === 'send-phone-otp' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                      Send OTP
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                  <label htmlFor="settings-link-otp" className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Enter 6-Digit SMS Verification Code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="settings-link-otp"
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      autoFocus
                      required
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center text-lg tracking-[0.35em] font-mono font-bold text-[var(--color-text)] focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={loadingAction === 'verify-phone-otp' || otpCode.length !== 6}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 shadow-xs"
                    >
                      {loadingAction === 'verify-phone-otp' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Verify &amp; Link
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-1">
                    <span>Didn't receive SMS?</span>
                    {countdown > 0 ? (
                      <span className="font-mono text-emerald-500">Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendPhoneOtp}
                        className="text-emerald-500 hover:text-emerald-400 font-bold underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default IdentityLinkingCard;
