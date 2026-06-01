import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Activity, Loader2, Mail, MapPin, Sparkles, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSpring, useTransform, motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "../ErrorBoundary";

interface InfoPageLayoutProps {
  children: React.ReactNode;
  activePath: string;
}

export default function InfoPageLayout({ children, activePath }: InfoPageLayoutProps) {
  const { signIn, isSigningIn, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [articlesDropdownOpen, setArticlesDropdownOpen] = useState(false);

  const handleLaunchApp = async () => {
    if (user) {
      navigate("/dashboard");
    } else {
      try {
        await signIn();
        navigate("/dashboard");
      } catch (error) {
        console.error("Auth error:", error);
      }
    }
  };

  const isLinkActive = (path: string) => {
    return activePath === path || activePath === path + ".html";
  };

  return (
    <ErrorBoundary>
      <div className="bg-[#0A192F] text-white min-h-screen font-sans selection:bg-emerald-500/30 overflow-x-hidden flex flex-col">
        
        {/* Safety Header / Banner */}
        <div className="bg-emerald-950/80 border-b border-emerald-500/20 text-emerald-300 text-xs py-2 px-4 text-center sticky top-0 z-[60] backdrop-blur">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Aegis Safety Standard:</strong> This platform is an informational translation tool and does not provide clinical diagnoses.
            </span>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="sticky top-[33px] w-full z-50 bg-[#0A192F]/85 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 md:gap-3 group hover:opacity-90 transition-opacity">
              <ShieldCheck className="w-5 h-5 md:w-8 md:h-8 text-emerald-400 group-hover:scale-105 transition-transform" strokeWidth={2} />
              <span className="font-bold border-l border-white/20 pl-2 md:pl-3 text-xs md:text-lg tracking-[0.2em] text-emerald-400 font-sans">
                AEGIS
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-8">
              <Link 
                to="/how-it-works.html" 
                className={`text-xs font-bold tracking-widest transition-colors uppercase ${
                  isLinkActive("/how-it-works") ? "text-emerald-400" : "text-slate-300 hover:text-emerald-400"
                }`}
              >
                How It Works
              </Link>
              <Link 
                to="/about.html" 
                className={`text-xs font-bold tracking-widest transition-colors uppercase ${
                  isLinkActive("/about") ? "text-emerald-400" : "text-slate-300 hover:text-emerald-400"
                }`}
              >
                About Us
              </Link>
              <Link 
                to="/security.html" 
                className={`text-xs font-bold tracking-widest transition-colors uppercase ${
                  isLinkActive("/security") ? "text-emerald-400" : "text-slate-300 hover:text-emerald-400"
                }`}
              >
                Security First
              </Link>
              
              {/* Desktop Articles Dropdown */}
              <div 
                className="relative py-2"
                onMouseEnter={() => setArticlesDropdownOpen(true)}
                onMouseLeave={() => setArticlesDropdownOpen(false)}
              >
                <button 
                  className={`flex items-center gap-1 text-xs font-bold tracking-widest transition-colors uppercase focus:outline-none ${
                    isLinkActive("/blog-hba1c") || isLinkActive("/blog-cbc") || isLinkActive("/engineering-playbook")
                      ? "text-emerald-400" 
                      : "text-slate-300 hover:text-emerald-400"
                  }`}
                >
                  Articles <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                
                <AnimatePresence>
                  {articlesDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-56 bg-[#0F2A4A] border border-white/10 rounded-xl shadow-2xl py-2 z-50 feedback-dropdown"
                    >
                      <Link 
                        to="/blog-hba1c.html" 
                        className={`block px-4 py-2 text-[11px] font-semibold tracking-wider transition-colors uppercase ${
                          isLinkActive("/blog-hba1c") ? "text-emerald-400 bg-emerald-500/5" : "text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                        }`}
                      >
                        HbA1c Blood Sugar Guide
                      </Link>
                      <Link 
                        to="/blog-cbc.html" 
                        className={`block px-4 py-2 text-[11px] font-semibold tracking-wider transition-colors uppercase ${
                          isLinkActive("/blog-cbc") ? "text-emerald-400 bg-emerald-500/5" : "text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                        }`}
                      >
                        CBC Blood Test Explainer
                      </Link>
                      <Link 
                        to="/engineering-playbook.html" 
                        className={`block px-4 py-2 text-[11px] font-semibold tracking-wider transition-colors uppercase ${
                          isLinkActive("/engineering-playbook") ? "text-emerald-400 bg-emerald-500/5" : "text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                        }`}
                      >
                        Engineering Playbook
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleLaunchApp}
                disabled={isSigningIn}
                className="hidden sm:flex px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] md:text-xs font-semibold tracking-wide transition-colors disabled:opacity-50 items-center justify-center gap-2"
              >
                <Activity className="w-3 md:w-4 h-3 md:h-4" />
                <span>LAUNCH APP</span>
              </button>
              <button
                onClick={handleLaunchApp}
                disabled={isSigningIn}
                className="px-4 md:px-8 py-2 md:py-2.5 bg-white text-[#0A192F] hover:bg-emerald-50 rounded-full text-[10px] md:text-xs font-black tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {isSigningIn ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : user ? (
                  "GO TO DASHBOARD"
                ) : (
                  "GET STARTED"
                )}
              </button>

              {/* Mobile Menu Action */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Menu"
                className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Sliding Navigation Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="lg:hidden w-full bg-[#0A192F] border-b border-white/10 overflow-hidden shadow-2xl relative"
              >
                <div className="px-6 py-6 flex flex-col gap-4">
                  <Link 
                    to="/how-it-works.html" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className={`text-sm font-bold tracking-wider py-2 border-b border-white/5 uppercase ${
                      isLinkActive("/how-it-works") ? "text-emerald-400" : "text-slate-200 hover:text-emerald-400"
                    }`}
                  >
                    How It Works
                  </Link>
                  <Link 
                    to="/about.html" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className={`text-sm font-bold tracking-wider py-2 border-b border-white/5 uppercase ${
                      isLinkActive("/about") ? "text-emerald-400" : "text-slate-200 hover:text-emerald-400"
                    }`}
                  >
                    About Us
                  </Link>
                  <Link 
                    to="/security.html" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className={`text-sm font-bold tracking-wider py-2 border-b border-white/5 uppercase ${
                      isLinkActive("/security") ? "text-emerald-400" : "text-slate-200 hover:text-emerald-400"
                    }`}
                  >
                    Security First
                  </Link>
                  
                  <div className="py-2">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold block mb-2">
                      Articles & Playbooks
                    </span>
                    <div className="pl-4 flex flex-col gap-3">
                      <Link 
                        to="/blog-hba1c.html" 
                        onClick={() => setMobileMenuOpen(false)} 
                        className={`text-xs font-bold tracking-wider uppercase ${
                          isLinkActive("/blog-hba1c") ? "text-emerald-400" : "text-slate-300 hover:text-emerald-400"
                        }`}
                      >
                        HbA1c Blood Sugar Guide
                      </Link>
                      <Link 
                        to="/blog-cbc.html" 
                        onClick={() => setMobileMenuOpen(false)} 
                        className={`text-xs font-bold tracking-wider uppercase ${
                          isLinkActive("/blog-cbc") ? "text-emerald-400" : "text-slate-300 hover:text-emerald-400"
                        }`}
                      >
                        CBC Blood Test Explainer
                      </Link>
                      <Link 
                        to="/engineering-playbook.html" 
                        onClick={() => setMobileMenuOpen(false)} 
                        className={`text-xs font-bold tracking-wider uppercase ${
                          isLinkActive("/engineering-playbook") ? "text-emerald-400" : "text-slate-300 hover:text-emerald-400"
                        }`}
                      >
                        Engineering Playbook
                      </Link>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLaunchApp();
                    }}
                    disabled={isSigningIn}
                    className="w-full mt-4 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 rounded-full font-bold tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    <span>LAUNCH SANDBOX</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Page Content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* Shared Footer Area */}
        <footer className="mt-auto pb-12 border-t border-white/5 pt-16 bg-[#0A192F]">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            
            {/* Branding Column */}
            <div className="text-center md:text-left flex flex-col gap-4">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" strokeWidth={2} />
                <span className="font-bold tracking-[0.2em] text-emerald-400 text-lg">
                  AEGIS
                </span>
              </div>
              <p className="text-sm text-slate-400 font-light leading-relaxed max-w-xs mx-auto md:mx-0">
                Premium health intelligence for everyone. Powered by enterprise-grade AI infrastructure. Translating clinical complexity into home clarity.
              </p>
            </div>

            {/* Navigation Column */}
            <div className="text-center md:text-left">
              <h4 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Explore Aegis</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/how-it-works.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/about.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/security.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                    Security First
                  </Link>
                </li>
                <li>
                  <Link to="/blog-hba1c.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                    HbA1c Sugar Guide
                  </Link>
                </li>
                <li>
                  <Link to="/blog-cbc.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                    CBC Blood Explainer
                  </Link>
                </li>
                <li>
                  <Link to="/engineering-playbook.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                    Engineering Playbook
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Support Column */}
            <div className="text-center md:text-left">
              <h4 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Contact & Support</h4>
              <ul className="space-y-4">
                <li>
                  <a href="mailto:founder@aegishealthai.co.in" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm flex items-center justify-center md:justify-start gap-3">
                    <Mail className="w-4 h-4 shrink-0" /> founder@aegishealthai.co.in
                  </a>
                </li>
                <li>
                  <a href="mailto:support@aegishealthai.co.in" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm flex items-center justify-center md:justify-start gap-3">
                    <Mail className="w-4 h-4 shrink-0" /> support@aegishealthai.co.in
                  </a>
                </li>
                <li className="text-slate-400 text-sm flex items-center justify-center md:justify-start gap-3">
                  <MapPin className="w-4 h-4 shrink-0" /> Dombivli West, Maharashtra, India
                </li>
              </ul>
            </div>

            {/* Legal Links Column */}
            <div className="text-center md:text-right">
              <h4 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Legal</h4>
              <ul className="space-y-4">
                <li>
                  <Link to="/privacy-policy" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm underline decoration-white/20 underline-offset-4">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-service" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm underline decoration-white/20 underline-offset-4">
                    Terms & Medical Disclaimer
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Medical Disclaimer Row */}
          <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 mb-8">
            <p className="text-xs text-slate-400 text-center uppercase tracking-widest mb-2 font-semibold">Important Medical Disclaimer (Public Beta)</p>
            <p className="text-[11px] text-slate-500 text-center max-w-4xl mx-auto leading-relaxed">
              Aegis Health AI is currently in public beta. It is an informational tool and does NOT provide medical advice, diagnosis, or treatment. It does not replace professional clinical assessments. Always consult a qualified healthcare provider regarding your health data or any medical condition. If you are experiencing an urgent medical issue, contact emergency services immediately.
            </p>
          </div>

          {/* Bottom Copyright & Version Info */}
          <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-xs text-slate-400 tracking-wide uppercase mb-1">
                &copy; {new Date().getFullYear()} Aegis Health AI. All rights registered.
              </p>
              <p className="text-sm text-slate-400 transition-colors mb-2">
                Proudly developed in Dombivli West, Maharashtra, India.
              </p>
              <p className="text-[10px] text-slate-400 tracking-[0.2em] font-mono mb-2">
                VERSION 1.7.0 / SECURE ENCRYPTION ACTIVE
              </p>
              <p className="text-[10px] text-slate-500 max-w-sm">
                This site uses only essential session cookies to keep you signed in. We do not use tracking or advertising cookies.
              </p>
            </div>

            <div className="text-center md:text-right flex flex-col gap-2">
              <p className="text-[10px] text-slate-400 flex items-center justify-center md:justify-end gap-1.5 font-medium italic">
                Powered by <span className="text-slate-200">Google Gemini & Firebase</span>
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
