import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { signIn, isSigningIn, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-[100dvh] bg-[#0A192F] flex flex-col items-center justify-center p-6 relative overflow-hidden pointer-events-auto">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0f2a4a] border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center relative z-10"
      >
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <ShieldCheck className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
        <p className="text-slate-400 mb-8 font-light leading-relaxed">Sign in with Google to securely access your health intelligence dashboard.</p>
        
        <button
          onClick={() => signIn()}
          disabled={isSigningIn}
          className="w-full py-4 px-6 bg-white text-[#0A192F] hover:bg-emerald-50 rounded-xl font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          {isSigningIn ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </>
          )}
        </button>

        <div className="mt-8 text-center">
            <button 
              onClick={() => navigate(-1)} 
              disabled={isSigningIn}
              className="text-slate-400 hover:text-white transition-colors text-sm underline decoration-white/20 underline-offset-4"
            >
              Go back
            </button>
        </div>
      </motion.div>
    </div>
  );
}
