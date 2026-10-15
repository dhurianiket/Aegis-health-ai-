import React, { useState, createContext, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Activity, Loader2, Mail, MapPin, Sparkles, ChevronDown, Menu, X, Github, Linkedin, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "../ErrorBoundary";
import { AuthLoginModal, DEMO_REVIEWER_EMAIL } from "../Auth/AuthLoginModal";

interface InfoPageContextValue {
  openLoginModal: () => void;
}

const InfoPageContext = createContext<InfoPageContextValue>({
  openLoginModal: () => {},
});

export const useInfoPageLogin = () => useContext(InfoPageContext);

interface InfoPageLayoutProps {
  children: React.ReactNode;
  activePath: string;
}

export default function InfoPageLayout({ children, activePath }: InfoPageLayoutProps) {
  const { isSigningIn, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [articlesDropdownOpen, setArticlesDropdownOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("login=true")) {
      setIsLoginModalOpen(true);
    }
  }, []);

  const handleLaunchApp = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const isLinkActive = (path: string) => {
    return activePath === path || activePath === path + ".html";
  };

  return (
    <ErrorBoundary>
      <InfoPageContext.Provider value={{ openLoginModal: () => setIsLoginModalOpen(true) }}>
        <div className="bg-[#0A192F] text-white min-h-screen font-sans selection:bg-emerald-500/30 overflow-x-hidden flex flex-col">
          
          {/* Clinical Safety & Governance Banner */}
          <div className="bg-emerald-950/90 border-b border-emerald-500/20 text-emerald-200 text-xs py-2 px-4 text-center sticky top-0 z-[60] backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>
                <strong className="text-emerald-300">Aegis Clinical Governance:</strong> Informational clinical intelligence &amp; doctor consult preparation platform.
              </span>
              <span className="hidden md:inline text-emerald-500/50">|</span>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="hidden md:inline-flex items-center gap-1 text-emerald-300 hover:text-white underline decoration-emerald-400/50 underline-offset-2 font-semibold cursor-pointer"
              >
                Reviewer Demo: {DEMO_REVIEWER_EMAIL} →
              </button>
            </div>
          </div>

          {/* Unified Glassmorphic Navigation Bar */}
          <nav className="sticky top-[33px] w-full z-50 bg-[#0A192F]/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
              
              {/* Brand Logo */}
              <Link to="/" className="flex items-center gap-2 md:gap-3 group hover:opacity-90 transition-opacity">
                <ShieldCheck className="w-5 h-5 md:w-8 md:h-8 text-emerald-400 group-hover:scale-105 transition-transform" strokeWidth={2} />
                <span className="font-bold border-l border-white/20 pl-2 md:pl-3 text-xs md:text-lg tracking-[0.2em] text-emerald-400 font-sans">
                  AEGIS
                </span>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden lg:flex items-center gap-6">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-bold tracking-widest text-emerald-300 hover:text-emerald-200 transition-all uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Email / Reviewer Login
                </button>
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
                <Link 
                  to="/?login=true#pricing" 
                  className="text-xs font-bold tracking-widest text-slate-300 hover:text-emerald-400 transition-colors uppercase"
                >
                  Platform Access
                </Link>
                
                {/* Desktop Articles Dropdown */}
                <div 
                  className="relative py-2"
                  onMouseEnter={() => setArticlesDropdownOpen(true)}
                  onMouseLeave={() => setArticlesDropdownOpen(false)}
                >
                  <button 
                    className={`flex items-center gap-1 text-xs font-bold tracking-widest transition-colors uppercase focus:outline-none cursor-pointer ${
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
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-60 bg-[#0F2A4A] border border-white/15 rounded-2xl shadow-2xl py-2 z-50"
                      >
                        <Link 
                          to="/blog-hba1c.html" 
                          className={`block px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors uppercase ${
                            isLinkActive("/blog-hba1c") ? "text-emerald-400 bg-emerald-500/10" : "text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                          }`}
                        >
                          HbA1c Blood Sugar Guide
                        </Link>
                        <Link 
                          to="/blog-cbc.html" 
                          className={`block px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors uppercase ${
                            isLinkActive("/blog-cbc") ? "text-emerald-400 bg-emerald-500/10" : "text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                          }`}
                        >
                          CBC Blood Test Explainer
                        </Link>
                        <Link 
                          to="/engineering-playbook.html" 
                          className={`block px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors uppercase ${
                            isLinkActive("/engineering-playbook") ? "text-emerald-400 bg-emerald-500/10" : "text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400"
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
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={handleLaunchApp}
                  disabled={isSigningIn}
                  className="hidden sm:flex px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold tracking-wide transition-colors disabled:opacity-50 items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>SIGN IN</span>
                </button>
                <button
                  onClick={handleLaunchApp}
                  disabled={isSigningIn}
                  className="px-4 md:px-6 py-2 md:py-2.5 bg-white text-[#0A192F] hover:bg-emerald-50 rounded-full text-xs font-black tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-pointer"
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
                  className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none cursor-pointer"
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
                  className="lg:hidden w-full bg-[#0A192F]/95 backdrop-blur-2xl border-b border-white/10 overflow-hidden shadow-2xl relative"
                >
                  <div className="px-6 py-6 flex flex-col gap-4">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                      className="text-left text-sm font-bold tracking-wider py-2 border-b border-white/5 uppercase text-emerald-400 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> Email / Reviewer Login
                    </button>
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
                    <Link 
                      to="/?login=true#pricing" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="text-sm font-bold tracking-wider py-2 border-b border-white/5 uppercase text-slate-200 hover:text-emerald-400"
                    >
                      Platform Access
                    </Link>
                    
                    <div className="py-2">
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-extrabold block mb-2">
                        Clinical Guides &amp; Architecture
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
                      className="w-full mt-2 py-3 bg-emerald-400 text-[#0A192F] hover:bg-emerald-300 rounded-full font-black tracking-widest text-xs uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Activity className="w-4 h-4" />
                      <span>LAUNCH LIVE WORKSPACE</span>
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

          {/* Shared Enterprise Footer */}
          <footer className="mt-auto pb-12 border-t border-white/10 pt-16 bg-[#0A192F]">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
              
              {/* Branding Column */}
              <div className="text-center md:text-left flex flex-col gap-4">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" strokeWidth={2} />
                  <span className="font-bold tracking-[0.2em] text-emerald-400 text-lg">
                    AEGIS
                  </span>
                </div>
                <p className="text-sm text-slate-300 font-light leading-relaxed max-w-xs mx-auto md:mx-0">
                  Clinical-grade multi-agent health intelligence for Indian families. Powered by Google Cloud, Vertex AI, and Gemini 2.5 Flash.
                </p>
                <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
                  <a
                    href="https://www.linkedin.com/in/aniket-dhuri-273094225"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Founder LinkedIn"
                    className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-white/10 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href="https://github.com/dhurianiket/Aegis-health-ai-"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub Repository"
                    className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-white/10 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Navigation Column */}
              <div className="text-center md:text-left">
                <h4 className="text-white font-bold tracking-widest uppercase text-xs mb-4">Explore Aegis</h4>
                <ul className="space-y-3">
                  <li>
                    <Link to="/" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      Main Platform Home
                    </Link>
                  </li>
                  <li>
                    <Link to="/how-it-works.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link to="/about.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      About Us &amp; Leadership
                    </Link>
                  </li>
                  <li>
                    <Link to="/security.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      Security First (DPDP 2023)
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog-hba1c.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      HbA1c Blood Sugar Guide
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog-cbc.html" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      CBC Blood Test Explainer
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
                <h4 className="text-white font-bold tracking-widest uppercase text-xs mb-4">Enterprise &amp; Contact</h4>
                <ul className="space-y-3.5">
                  <li>
                    <a href="mailto:founder@aegishealthai.co.in" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-center justify-center md:justify-start gap-2.5">
                      <Mail className="w-4 h-4 shrink-0 text-emerald-400" /> founder@aegishealthai.co.in
                    </a>
                  </li>
                  <li>
                    <a href="mailto:support@aegishealthai.co.in" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-center justify-center md:justify-start gap-2.5">
                      <Mail className="w-4 h-4 shrink-0 text-emerald-400" /> support@aegishealthai.co.in
                    </a>
                  </li>
                  <li className="text-slate-400 text-xs flex items-center justify-center md:justify-start gap-2.5">
                    <MapPin className="w-4 h-4 shrink-0 text-emerald-400" /> Dombivli West, Thane, Maharashtra 421202
                  </li>
                  <li className="text-emerald-300/90 text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg inline-block">
                    MSME Udyam: UDYAM-MH-33-0782403
                  </li>
                </ul>
              </div>

              {/* Legal & Reviewer Column */}
              <div className="text-center md:text-right flex flex-col items-center md:items-end">
                <h4 className="text-white font-bold tracking-widest uppercase text-xs mb-4">Legal &amp; Access</h4>
                <ul className="space-y-3 mb-5">
                  <li>
                    <Link to="/privacy-policy" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm underline decoration-white/20 underline-offset-4">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms-of-service" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm underline decoration-white/20 underline-offset-4">
                      Terms &amp; Medical Disclaimer
                    </Link>
                  </li>
                </ul>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" /> Reviewer Email Sign-In
                </button>
              </div>
            </div>

            {/* Medical Disclaimer Row */}
            <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 mb-8">
              <p className="text-xs text-slate-400 text-center uppercase tracking-widest mb-2 font-semibold">
                Important Clinical &amp; Medical Disclaimer
              </p>
              <p className="text-xs text-slate-300 text-center max-w-4xl mx-auto leading-relaxed">
                Aegis Health AI is an informational clinical decision-support and health intelligence platform and does NOT provide medical diagnosis or treatment prescriptions. It does not replace professional clinical assessments. Always consult a qualified healthcare provider regarding your health data or any medical condition. If you are experiencing an urgent medical issue, contact emergency services immediately.
              </p>
            </div>

            {/* Bottom Copyright & Version Info */}
            <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <p className="text-xs text-slate-400 tracking-wide uppercase mb-1">
                  &copy; {new Date().getFullYear()} Aegis Health AI. All rights reserved.
                </p>
                <p className="text-sm text-slate-400 transition-colors mb-2">
                  Proudly engineered in Dombivli West, Mumbai Metropolitan Region, Maharashtra, India.
                </p>
                <p className="text-xs text-slate-400 tracking-[0.2em] font-mono mb-2">
                  PRODUCTION v2.0.0 / ZERO-KNOWLEDGE ISOLATION ACTIVE
                </p>
                <p className="text-xs text-slate-300 max-w-sm">
                  This site uses only essential session cookies to keep you signed in. We do not use tracking or advertising cookies.
                </p>
              </div>

              <div className="text-center md:text-right flex flex-col gap-2">
                <p className="text-xs text-slate-400 flex items-center justify-center md:justify-end gap-1.5 font-medium italic">
                  Powered by <span className="text-slate-200">Google Cloud, Vertex AI &amp; Firebase</span>
                  <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                </p>
              </div>
            </div>
          </footer>

          <AuthLoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
          />
        </div>
      </InfoPageContext.Provider>
    </ErrorBoundary>
  );
}
