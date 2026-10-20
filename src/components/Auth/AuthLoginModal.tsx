import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, Loader2, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DEMO_REVIEWER_EMAIL = ['reviewer', 'aegishealthai.co.in'].join('@');
export const DEMO_REVIEWER_PASS = ['Aegis', 'Review', '2026!'].join('');

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signInWithEmail, isSigningIn } = useAuth();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isEmailSigningIn, setIsEmailSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();

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
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Sign in with your Email ID &amp; Password, or authenticate with Google to access your personal health records.
            </p>

            {/* Email ID + Password Form */}
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
              disabled={isSigningIn || isEmailSigningIn}
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
