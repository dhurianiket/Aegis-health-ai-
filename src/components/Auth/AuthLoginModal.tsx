import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Mail,
  Loader2,
  Lock,
  ArrowRight,
  Smartphone,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth } from '../../lib/firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signInWithEmail, isSigningIn } = useAuth();
  const navigate = useNavigate();

  // Authentication method tab
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Email form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isEmailSigningIn, setIsEmailSigningIn] = useState(false);

  // General error banner
  const [loginError, setLoginError] = useState<string | null>(null);

  // Clean up reCAPTCHA verifier safely
  const clearRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {
        // ignore
      }
      recaptchaVerifierRef.current = null;
    }
  };

  // Lazy initialize reCAPTCHA verifier
  const getRecaptchaVerifier = (): RecaptchaVerifier | null => {
    if (typeof window === 'undefined') return null;
    const container = document.getElementById('recaptcha-phone-container');
    if (!container) return null;

    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-phone-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            clearRecaptcha();
          },
        });
      } catch (err) {
        console.warn('[PhoneAuth] RecaptchaVerifier init error:', err);
      }
    }
    return recaptchaVerifierRef.current;
  };

  // Reset states when modal is closed
  useEffect(() => {
    if (!isOpen) {
      clearRecaptcha();
      setPhoneStep('input');
      setOtpCode('');
      setLoginError(null);
    }
  }, [isOpen]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    try {
      if (signIn) {
        await signIn();
      }
      onClose();
      navigate('/dashboard', { replace: true });
    } catch {
      // Handled in AuthContext
    }
  };

  // Handle Send Mobile OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setLoginError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoginError(null);
    setIsSendingOtp(true);

    try {
      const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;
      const appVerifier = getRecaptchaVerifier();
      if (!appVerifier) {
        throw new Error('Verification service not ready. Please try again.');
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setPhoneStep('otp');
      setResendCooldown(30);
    } catch (err: any) {
      console.error('[PhoneAuth] Send OTP error:', err);
      clearRecaptcha();
      if (err?.code === 'auth/invalid-phone-number') {
        setLoginError('Invalid phone number format. Please enter a valid 10-digit mobile number.');
      } else if (err?.code === 'auth/quota-exceeded') {
        setLoginError('SMS quota exceeded for today. Please sign in with Google or Email.');
      } else if (err?.code === 'auth/too-many-requests') {
        setLoginError('Too many attempts. Please wait a few minutes before requesting another OTP.');
      } else {
        setLoginError(err?.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify Mobile OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setLoginError('Please enter the 6-digit verification code.');
      return;
    }
    if (!confirmationResult) {
      setLoginError('Session expired. Please request a new OTP.');
      return;
    }
    setLoginError(null);
    setIsVerifyingOtp(true);

    try {
      await confirmationResult.confirm(otpCode.trim());
      clearRecaptcha();
      onClose();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('[PhoneAuth] Verify OTP error:', err);
      if (err?.code === 'auth/invalid-verification-code') {
        setLoginError('Incorrect OTP code. Please check and re-enter.');
      } else if (err?.code === 'auth/code-expired') {
        setLoginError('OTP code has expired. Please request a new one.');
      } else {
        setLoginError(err?.message || 'Verification failed. Please try again.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Quick fill reviewer demo number
  const handleApplyDemoPhone = () => {
    setPhoneNumber('9999999999');
    setLoginError(null);
  };

  // Handle Email + Password Sign In
  const handleEmailFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both Email ID and Password.');
      return;
    }
    setLoginError(null);
    setIsEmailSigningIn(true);
    try {
      if (signInWithEmail) {
        await signInWithEmail(loginEmail.trim(), loginPassword);
      }
      onClose();
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      setLoginError(
        error?.code === 'auth/invalid-credential'
          ? 'Invalid Email ID or Password. Please verify your credentials.'
          : error?.message || 'Failed to sign in with Email ID.'
      );
    } finally {
      setIsEmailSigningIn(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0F2A4A] border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.75)] relative text-white overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none" />

            {/* Invisible reCAPTCHA container for Phone Auth */}
            <div id="recaptcha-phone-container" />

            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Login Modal"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black tracking-tight text-white">
                  Sign In to Aegis Health AI
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block">
                  Zero-Knowledge Clinical Workspace
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Verify your mobile number via instant OTP, or authenticate with Email &amp; Google to access your sovereign health records.
            </p>

            {/* Authentication Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-2xl border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setLoginError(null);
                }}
                className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMethod === 'phone'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setLoginError(null);
                }}
                className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMethod === 'email'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Email ID
              </button>
            </div>

            {/* TAB 1: Mobile Phone OTP Flow */}
            {authMethod === 'phone' && (
              <>
                {phoneStep === 'input' ? (
                  <form onSubmit={handleSendOtp} className="space-y-3.5 mb-5">
                    <div>
                      <label htmlFor="login-phone" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                        Mobile Number
                      </label>
                      <div className="flex gap-2">
                        <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-sm text-slate-300 font-mono flex items-center gap-1.5 shrink-0">
                          <span className="text-base">🇮🇳</span>
                          <span className="font-bold text-white">+91</span>
                        </div>
                        <input
                          id="login-phone"
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="98765 43210"
                          required
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors font-mono tracking-wider"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                        <span>Reviewer / Demo bypass:</span>
                        <button
                          type="button"
                          onClick={handleApplyDemoPhone}
                          className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer transition-colors"
                        >
                          Use +91 99999 99999
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                        {loginError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingOtp || phoneNumber.length < 10}
                      className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Sending SMS OTP...
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" /> Send Verification OTP
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3.5 mb-5">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">OTP Sent To</span>
                        <span className="font-mono font-bold text-white">+91 {phoneNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneStep('input');
                          setOtpCode('');
                          setLoginError(null);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-bold text-xs cursor-pointer"
                      >
                        Change Number
                      </button>
                    </div>

                    <div>
                      <label htmlFor="login-otp" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                        Enter 6-Digit Verification Code
                      </label>
                      <input
                        id="login-otp"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        autoFocus
                        required
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-white/15 text-lg text-center tracking-[0.4em] font-mono font-black text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-400 transition-colors"
                      />
                    </div>

                    {loginError && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                        {loginError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifyingOtp || otpCode.length < 6}
                      className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" /> Verify &amp; Sign In
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      {resendCooldown > 0 ? (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Resend OTP in {resendCooldown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={isSendingOtp}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> Resend OTP Code
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}

            {/* TAB 2: Email ID + Password Form */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailFormSubmit} className="space-y-3.5 mb-5">
                <div>
                  <label htmlFor="login-email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Email ID
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isEmailSigningIn || isSigningIn}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isEmailSigningIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" /> Sign In with Email
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="relative flex py-1.5 items-center mb-4">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Or Google Account
              </span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || isEmailSigningIn || isSendingOtp || isVerifyingOtp}
              className="w-full py-2.5 px-6 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Connecting to Google...
                </>
              ) : (
                <>Continue with Google Account</>
              )}
            </button>

            {/* Guest Sandbox Option */}
            <div className="mt-5 pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-slate-400">
                Want to evaluate the platform first?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/dashboard');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Explore Guest Demo <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Firebase Auth • DPDP Act 2023 • Sovereign Vault</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthLoginModal;
