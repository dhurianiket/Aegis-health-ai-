import React, { useState } from 'react';
import { ShieldCheck, Mail, Sparkles, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DEMO_REVIEWER_EMAIL = ['reviewer', 'aegishealthai.co.in'].join('@');
export const DEMO_REVIEWER_PASS = ['Aegis', 'Review', '2026!'].join('');

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signInWithEmail, isSigningIn } = useAuth();
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isEmailSigningIn, setIsEmailSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    try {
      await signIn();
      onClose();
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      setLoginError(error?.message || 'Google sign-in failed.');
    }
  };

  const handleEmailFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please enter both your Email ID and Password.');
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

  const handleReviewerLogin = async () => {
    setLoginEmail(DEMO_REVIEWER_EMAIL);
    setLoginPassword(DEMO_REVIEWER_PASS);
    setLoginError(null);
    setIsEmailSigningIn(true);
    try {
      if (signInWithEmail) {
        await signInWithEmail(DEMO_REVIEWER_EMAIL, DEMO_REVIEWER_PASS);
      }
      onClose();
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      setLoginError(error?.message || 'Reviewer login failed.');
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
              Sign in with your Email ID &amp; Password, launch the pre-seeded Reviewer account with 1 click, or authenticate via Google.
            </p>

            {/* Official Reviewer Demo Credentials Box */}
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-[#0A192F]/90 border border-emerald-500/35 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Official Reviewer Access
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Pre-Loaded Lab Data
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono text-slate-200 mb-3 bg-[#0A192F]/80 p-2.5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email ID:</span>
                  <span className="text-emerald-300 select-all font-bold">{DEMO_REVIEWER_EMAIL}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Access Code:</span>
                  <span className="text-emerald-300 select-all font-bold">{DEMO_REVIEWER_PASS}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReviewerLogin}
                disabled={isEmailSigningIn || isSigningIn}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.3)] cursor-pointer"
              >
                {isEmailSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Authenticating Reviewer...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> 1-Click Auto-Fill &amp; Login as Reviewer
                  </>
                )}
              </button>
            </div>

            {/* Email ID + Password Form */}
            <form onSubmit={handleEmailFormSubmit} className="space-y-3.5 mb-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Email ID
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={DEMO_REVIEWER_EMAIL}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isEmailSigningIn || isSigningIn}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isEmailSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Sign In with Email ID
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-1.5 items-center mb-4">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Or Google OAuth 2.0
              </span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || isEmailSigningIn}
              className="w-full py-2.5 px-6 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Connecting to Google...
                </>
              ) : (
                <>Continue with Google Account</>
              )}
            </button>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Firebase Auth • DPDP Act 2023 • Isolated Vault</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default AuthLoginModal;
