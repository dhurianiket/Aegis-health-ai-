import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Activity, Brain, Lock, ArrowRight, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'motion/react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { signIn, isSigningIn } = useAuth();

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A192F] text-white selection:bg-[#20C997]/30 font-sans flex flex-col">
      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#20C997]/20 to-blue-500/20 border border-[#20C997]/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#20C997]" strokeWidth={1.5} />
          </div>
          <span className="font-bold text-xl tracking-[0.2em] text-[#20C997]">AEGIS</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </button>
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="px-5 py-2.5 bg-[#20C997]/10 hover:bg-[#20C997]/20 border border-[#20C997]/30 text-[#20C997] rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-[#20C997]/10 flex items-center gap-2 disabled:opacity-50"
          >
            {isSigningIn ? "Securely connecting..." : "Get Started"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-24">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#20C997]/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-8 max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#20C997] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#20C997]"></span>
              </span>
              <span className="text-xs font-medium text-slate-300 tracking-wider">CLINICAL INTELLIGENCE ONLINE</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400">
              Your Health, <br />
              <span className="text-[#20C997]">Protected and Deciphered.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-light">
              Transform chaotic medical lab results into a clear, visual journey. 
              Aegis Health AI uses clinical-grade intelligence to track your trends and safeguard your future.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="px-8 py-4 bg-[#20C997] hover:bg-[#20C997]/90 text-navy-900 text-[#0A192F] rounded-full text-base font-bold transition-all shadow-[0_0_40px_-10px_#20C997] hover:shadow-[0_0_60px_-15px_#20C997] hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Get Started for Free <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full text-base font-semibold transition-all backdrop-blur-md flex items-center justify-center disabled:opacity-50"
              >
                Sign In
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative lg:h-[600px] flex items-center justify-center perspective-1000"
          >
            {/* Abstract visual representing decoding data */}
            <div className="relative w-full max-w-[500px] aspect-square rounded-[40px] bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#20C997]/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#20C997]" />
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                </div>
              </div>
              
              <div className="space-y-4 flex-1">
                <div className="h-4 w-1/3 bg-slate-700/50 rounded-full animate-pulse" />
                <div className="h-8 w-3/4 bg-slate-600/50 rounded-lg animate-pulse delay-75" />
                <div className="h-4 w-1/2 bg-slate-700/50 rounded-full animate-pulse delay-150" />
                
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex items-end items-center gap-4 h-32">
                    <div className="w-1/4 h-1/3 bg-slate-700/50 rounded-t-md" />
                    <div className="w-1/4 h-2/3 bg-slate-600/50 rounded-t-md" />
                    <div className="w-1/4 h-full bg-[#20C997]/60 rounded-t-md relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#20C997] rounded-full shadow-[0_0_10px_#20C997]" />
                    </div>
                    <div className="w-1/4 h-4/5 bg-slate-600/50 rounded-t-md" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-[#0f2342] border-t border-white/5 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">The Core Intelligence</h2>
            <p className="text-slate-400 font-light text-lg">
              We replace confusion with clarity. Aegis translates medical jargon into a secure, cohesive narrative.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Report Extraction</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">
                Upload a PDF, get the truth. Instant extraction of complex blood markers into plain language.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#20C997]/20 flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-[#20C997]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Medical Trend Analysis</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">
                See the big picture. Visual graphs showing exactly how your markers move over months or years.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Medication Insights</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">
                Understand the 'why' behind your prescriptions and how they interact with your lab results.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Document Vault</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">
                Encrypted, clinical-grade storage for your entire medical history. Your data, safely guarded.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-[#0A192F] relative border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ShieldCheck className="w-16 h-16 text-[#20C997] mx-auto mb-8 opacity-80" strokeWidth={1} />
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Clinical Clarity. <br className="hidden md:block"/>Absolute Privacy.</h2>
          <p className="text-xl text-slate-400 font-light leading-relaxed mb-12">
            Your health data is your most sensitive asset. Aegis uses bank-grade encryption 
            and privacy-first AI to ensure your data stays yours. We decode it, you own it.
          </p>
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="px-8 py-4 bg-white text-navy-900 text-[#0A192F] rounded-full text-base font-bold transition-all shadow-xl hover:scale-105 flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
          >
            Join Aegis Securely
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 font-light">
        <p>&copy; 2026 Aegis Health AI. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-[#20C997] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#20C997] transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-[#20C997] transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}
