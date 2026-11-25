import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Camera,
  CheckCircle2,
  ChevronDown,
  Droplets,
  FileJson,
  FileText,
  Github,
  Heart,
  Link2,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  Pill,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Volume2,
  Watch,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../ErrorBoundary';
import LegalModal from './LegalModal';
import { AuthLoginModal } from '../Auth/AuthLoginModal';
import { CountUp } from '../ui/CountUp';
import { TiltSurface3D } from './TiltSurface3D';
import { LandingScrollStory } from './LandingScrollStory';
import { SpecialistShowcaseSection } from './SpecialistShowcaseSection';

const HeroClinicalCore3D = lazy(() =>
  import('./HeroClinicalCore3D').then((m) => ({ default: m.HeroClinicalCore3D })),
);

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

const BENTO_LABS = [
  {
    id: 'hb',
    label: 'Hemoglobin',
    value: '14.2 g/dL',
    range: '13.5 – 17.5 g/dL',
    fillPct: 72,
    status: 'Optimal',
    desc: 'Healthy oxygen transport across recent CBC panels.',
    icon: Activity,
    color: 'text-emerald-300',
    pillBg: 'bg-emerald-500/12 border-emerald-400/25',
    barColor: 'bg-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.16)',
  },
  {
    id: 'hba1c',
    label: 'HbA1c',
    value: '5.8%',
    range: '< 5.7% Normal',
    fillPct: 64,
    status: 'Borderline',
    desc: 'Down from 6.4% over 16 weeks. Track post-meal glucose.',
    icon: Activity,
    color: 'text-amber-300',
    pillBg: 'bg-amber-500/12 border-amber-400/25',
    barColor: 'bg-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.16)',
  },
  {
    id: 'vitd',
    label: 'Vitamin D (25-OH)',
    value: '18 ng/mL',
    range: '30 – 100 ng/mL',
    fillPct: 32,
    status: 'Deficient',
    desc: 'Units normalized from nmol/L. Flagged for clinician review.',
    icon: AlertCircle,
    color: 'text-rose-300',
    pillBg: 'bg-rose-500/12 border-rose-400/25',
    barColor: 'bg-rose-400',
    glowColor: 'rgba(251, 113, 133, 0.16)',
  },
  {
    id: 'crp',
    label: 'hs-CRP',
    value: '1.9 mg/L',
    range: '< 3.0 mg/L',
    fillPct: 48,
    status: 'Improving',
    desc: 'Systemic inflammation normalized from baseline 4.1 mg/L.',
    icon: ShieldCheck,
    color: 'text-sky-300',
    pillBg: 'bg-sky-500/12 border-sky-400/25',
    barColor: 'bg-sky-400',
    glowColor: 'rgba(56, 189, 248, 0.16)',
  },
];

const EXPLORE_PAGES = [
  {
    title: 'How It Works',
    desc: 'See how Aegis transforms raw Indian blood, biochemistry, and scan PDFs into structured clinical timelines.',
    href: '/how-it-works.html',
    icon: Brain,
  },
  {
    title: 'About Us',
    desc: 'Our story from Dombivli, Maharashtra and our commitment to plain-language healthcare clarity for Indian families.',
    href: '/about.html',
    icon: Heart,
  },
  {
    title: 'Security First',
    desc: 'Explore DPDP Act 2023 alignment, Model Armor AI firewalling, and isolated per-patient cloud storage.',
    href: '/security.html',
    icon: ShieldCheck,
  },
  {
    title: 'HbA1c Blood Sugar Guide',
    desc: 'Understand HbA1c percentages, South Asian glycemic thresholds, and how 90-day glucose trends behave.',
    href: '/blog-hba1c.html',
    icon: Droplets,
  },
  {
    title: 'CBC Blood Test Explainer',
    desc: 'Plain-English guide to platelets, hemoglobin, MCV, and differential counts in Indian pathology panels.',
    href: '/blog-cbc.html',
    icon: Stethoscope,
  },
  {
    title: 'Engineering Playbook',
    desc: 'Architecture breakdown of our Vertex AI Gemini 4 pipeline, Cloudflare Edge gateway, and HL7 FHIR R4 layer.',
    href: '/engineering-playbook.html',
    icon: Zap,
  },
];

const HeroCanvasFallback: React.FC = () => (
  <div className="aegis-hairline-surface rounded-[32px] p-6 w-full max-w-[540px] mx-auto h-[490px] flex flex-col items-center justify-center">
    <div className="relative w-44 h-44 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-teal-400/35 animate-pulse" />
      <div className="absolute inset-4 rounded-full border border-dashed border-sky-400/30" />
      <ShieldCheck className="w-16 h-16 text-teal-300" strokeWidth={1.6} />
    </div>
    <p className="mt-6 text-xs font-mono uppercase tracking-[0.18em] text-teal-300">
      Initializing 3D Telemetry Core
    </p>
  </div>
);

export default function LandingPage() {
  const { user, loading, isSigningIn } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const resourcesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('login=true')) {
      setIsLoginModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!resourcesOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setResourcesOpen(false);
    };
    const handleOutsideClick = (e: MouseEvent) => {
      if (resourcesMenuRef.current && !resourcesMenuRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [resourcesOpen]);

  const { scrollYProgress: pageScrollRaw } = useScroll();
  const pageScrollProgress = useSpring(pageScrollRaw, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  const handleSignIn = () => {
    setIsLoginModalOpen(true);
  };

  const staggerInitial = (delayIdx: number) =>
    prefersReducedMotion
      ? { opacity: 0 }
      : { opacity: 0, transform: `translateY(${10 + delayIdx * 2}px) scale(0.985)` };

  const staggerAnimate = { opacity: 1, transform: 'translateY(0px) scale(1)' };

  return (
    <ErrorBoundary>
      <div
        data-landing-dark="true"
        className="relative bg-[#040B16] text-slate-50 min-h-screen font-sans selection:bg-teal-500/30 overflow-x-clip"
      >
        {/* Architectural Ambient Radial Grid Backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 12%, rgba(20, 184, 166, 0.14), transparent 42%), radial-gradient(circle at 82% 24%, rgba(56, 189, 248, 0.10), transparent 38%), linear-gradient(to right, rgba(148, 163, 184, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.04) 1px, transparent 1px)',
            backgroundSize: '100% 100%, 100% 100%, 56px 56px, 56px 56px',
          }}
        />

        {/* Persistent Hairline Navbar */}
        <nav className="fixed w-full z-50 top-0 left-0">
          <div className="absolute inset-0 bg-[#040B16]/82 backdrop-blur-2xl border-b border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_36px_rgba(0,0,0,0.45)]" />
          {/* Top Hairline Scroll Progress Beam */}
          <motion.div
            aria-hidden="true"
            style={{ scaleX: pageScrollProgress, transformOrigin: 'left center' }}
            className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-teal-400 via-sky-400 to-emerald-400 z-20"
          />

          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between relative z-10">
            {/* Brand Mark */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg">
              <ShieldCheck className="w-6 h-6 md:w-7 md:h-7 text-teal-400" strokeWidth={2} />
              <span className="font-black border-l border-white/15 pl-2.5 text-sm md:text-base tracking-[0.2em] text-white">
                AEGIS
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-7">
              <a
                href="#features-showcase"
                className="text-xs font-bold tracking-[0.14em] text-slate-300 hover:text-teal-300 transition-colors duration-150 uppercase"
              >
                Capabilities
              </a>
              <a
                href="#abha-gateway"
                className="text-xs font-bold tracking-[0.14em] text-slate-300 hover:text-teal-300 transition-colors duration-150 uppercase"
              >
                ABDM &amp; FHIR
              </a>
              <a
                href="#specialists"
                className="text-xs font-bold tracking-[0.14em] text-slate-300 hover:text-teal-300 transition-colors duration-150 uppercase"
              >
                Specialists
              </a>
              <a
                href="#pricing"
                className="text-xs font-bold tracking-[0.14em] text-slate-300 hover:text-teal-300 transition-colors duration-150 uppercase"
              >
                Platform Access
              </a>

              {/* Origin-Aware Resources Popover */}
              <div
                ref={resourcesMenuRef}
                className="relative py-1"
                onMouseEnter={() => setResourcesOpen(true)}
                onMouseLeave={() => setResourcesOpen(false)}
              >
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={resourcesOpen}
                  onClick={() => setResourcesOpen((prev) => !prev)}
                  className="flex items-center gap-1 text-xs font-bold tracking-[0.14em] text-slate-300 hover:text-teal-300 transition-colors duration-150 uppercase cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-md px-1 py-1"
                >
                  <span>Resources</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${resourcesOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {resourcesOpen && (
                    <motion.div
                      role="menu"
                      style={{ transformOrigin: 'top center' }}
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(4px) scale(0.97)' }}
                      animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(2px) scale(0.98)' }}
                      transition={{ duration: 0.16, ease: EASE_OUT }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-60 rounded-2xl bg-[#081426]/98 border border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.65)] py-2 z-50 backdrop-blur-2xl"
                    >
                      {EXPLORE_PAGES.map((page) => (
                        <Link
                          key={page.href}
                          role="menuitem"
                          to={page.href}
                          onClick={() => setResourcesOpen(false)}
                          className="block px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-teal-500/10 hover:text-teal-300 transition-colors duration-150"
                        >
                          {page.title}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Action CTAs */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 min-h-[40px] rounded-full text-xs font-semibold text-teal-200 hover:text-white bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/30 transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97] cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="px-5 md:px-6 min-h-[40px] bg-white text-[#040B16] hover:bg-teal-50 rounded-full text-xs font-black tracking-[0.12em] uppercase transition-[transform,background-color] duration-150 active:scale-[0.97] shadow-[0_0_24px_rgba(255,255,255,0.14)] cursor-pointer shrink-0"
              >
                Get Started
              </button>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle Menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-[transform,background-color] duration-150 active:scale-[0.95] focus-visible:ring-2 focus-visible:ring-teal-400 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                id="mobile-menu"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: EASE_DRAWER }}
                className="lg:hidden w-full bg-[#061020]/96 backdrop-blur-2xl border-b border-white/10 z-40 overflow-hidden shadow-2xl relative"
              >
                <div className="px-6 py-5 flex flex-col gap-3">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-bold tracking-wide text-teal-300 py-2 border-b border-white/5"
                  >
                    Launch Live Workspace
                  </Link>
                  <a
                    href="#features-showcase"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-semibold text-slate-200 py-2 border-b border-white/5"
                  >
                    Capabilities
                  </a>
                  <a
                    href="#abha-gateway"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-semibold text-slate-200 py-2 border-b border-white/5"
                  >
                    ABDM &amp; FHIR R4
                  </a>
                  <a
                    href="#specialists"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-semibold text-slate-200 py-2 border-b border-white/5"
                  >
                    10+ AI Specialists
                  </a>
                  <a
                    href="#pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-semibold text-slate-200 py-2 border-b border-white/5"
                  >
                    Platform Access (Free)
                  </a>
                  <div className="pt-1 flex flex-wrap gap-2">
                    {EXPLORE_PAGES.map((page) => (
                      <Link
                        key={page.href}
                        to={page.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300"
                      >
                        {page.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <main id="main-content" className="relative z-10">
          {/* ─── 1. HERO SECTION ─── */}
          <section className="relative min-h-[86vh] flex items-center pt-20 pb-10 px-6">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-8 items-center w-full">
              {/* Left Narrative Column */}
              <div className="lg:col-span-6 space-y-4">
                <motion.div
                  initial={staggerInitial(0)}
                  animate={staggerAnimate}
                  transition={{ duration: 0.28, ease: EASE_OUT }}
                  className="inline-flex flex-wrap items-center gap-2.5 px-3.5 py-1 rounded-full bg-[#081426]/90 border border-teal-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-teal-300">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    Aegis Health AI v2.0
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="text-xs font-semibold text-[#8ce405]">NVIDIA Inception</span>
                  <span className="text-white/20 hidden sm:inline">|</span>
                  <span className="text-xs font-semibold text-sky-300 hidden sm:inline">
                    Google for Startups Cloud Program
                  </span>
                </motion.div>

                <motion.h1
                  initial={staggerInitial(1)}
                  animate={staggerAnimate}
                  transition={{ duration: 0.34, delay: 0.05, ease: EASE_OUT }}
                  className="text-4xl sm:text-5xl xl:text-[3.5rem] font-black tracking-[-0.03em] text-white leading-[1.06]"
                >
                  Understand your medical telemetry.{' '}
                  <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent">
                    In plain clinical language.
                  </span>
                </motion.h1>

                <motion.p
                  initial={staggerInitial(2)}
                  animate={staggerAnimate}
                  transition={{ duration: 0.34, delay: 0.1, ease: EASE_OUT }}
                  className="text-base md:text-[17px] text-slate-300 max-w-[54ch] leading-relaxed"
                >
                  Upload Indian pathology PDFs or handwritten prescriptions. Decode biomarker trends with{' '}
                  <strong className="text-white font-semibold">Gemini 4 Hydrogen &amp; Argon</strong>, listen in
                  Indian languages via Cloud HD voice, and generate SBAR briefs for your Doctor Visit Prep.
                </motion.p>

                {/* Concise 4-Item Capability Strip */}
                <motion.div
                  initial={staggerInitial(3)}
                  animate={staggerAnimate}
                  transition={{ duration: 0.34, delay: 0.15, ease: EASE_OUT }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold text-slate-200"
                >
                  <div className="px-2.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>DPDP Act 2023</span>
                  </div>
                  <div className="px-2.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>ABHA Gateway</span>
                  </div>
                  <div className="px-2.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-1.5">
                    <FileJson className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>FHIR R4 Export</span>
                  </div>
                  <div className="px-2.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Doctor Visit Prep</span>
                  </div>
                </motion.div>

                {/* Primary & Secondary CTAs */}
                <motion.div
                  initial={staggerInitial(4)}
                  animate={staggerAnimate}
                  transition={{ duration: 0.34, delay: 0.2, ease: EASE_OUT }}
                  className="flex flex-col sm:flex-row gap-3 pt-0.5"
                >
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="px-7 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 rounded-full font-black tracking-wide transition-[transform,background-color] duration-150 active:scale-[0.97] shadow-[0_0_28px_rgba(45,212,191,0.32)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Sign In / Launch Vault</span>
                  </button>

                  <Link
                    to="/dashboard"
                    className="px-7 py-3 bg-white/[0.04] hover:bg-white/[0.09] text-white rounded-full font-semibold border border-teal-400/35 tracking-wide transition-[transform,background-color,border-color] duration-150 active:scale-[0.97] flex items-center justify-center gap-2"
                  >
                    <span>Explore Live Demo</span>
                    <ArrowRight className="w-4 h-4 text-teal-300" />
                  </Link>
                </motion.div>

                {/* Compact Ecosystem Backing Card */}
                <div className="aegis-hairline-surface rounded-2xl p-3.5 sm:p-4 max-w-xl">
                  <div className="flex flex-col sm:flex-row items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0">
                      <img
                        src="/nvidia-inception-badge.svg"
                        alt="Member of the NVIDIA Inception program"
                        className="h-9 w-auto object-contain"
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-teal-300 font-bold">
                        Startup Ecosystem &amp; Cloud Backing
                      </h2>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Member of the <strong className="text-white">NVIDIA Inception</strong> program and participant
                        in the <strong className="text-white">Google for Startups Cloud Program</strong>, with
                        infrastructure credits from AWS Activate and Microsoft Azure Founders Hub.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-[#76B900]/12 border border-[#76B900]/35 text-[11px] font-semibold text-[#8ce405]">
                          NVIDIA Inception
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/12 border border-sky-400/35 text-[11px] font-semibold text-sky-300">
                          Google for Startups Cloud Program
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/15 text-[11px] font-semibold text-slate-200">
                          AWS Activate
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/15 text-[11px] font-semibold text-slate-200">
                          Microsoft Azure Founders Hub
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Interactive 3D Clinical Telemetry Stage */}
              <div className="lg:col-span-6">
                <Suspense fallback={<HeroCanvasFallback />}>
                  <HeroClinicalCore3D />
                </Suspense>
              </div>
            </div>
          </section>

          {/* ─── 2. LIVE CLINICAL BENCHMARK BAR ─── */}
          <section className="w-full relative z-20 bg-[#061020]/90 border-y border-white/10 py-10 px-6 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="text-3xl md:text-4xl font-black text-emerald-300 font-mono tabular-nums flex items-center justify-center gap-0.5">
                  <CountUp to={99.4} decimals={1} duration={1.8} />
                  <span>%</span>
                </div>
                <p className="text-xs uppercase tracking-widest text-slate-200 font-bold mt-2">
                  Vision Schema Precision
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Gemini 4 Multimodal OCR</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="text-3xl md:text-4xl font-black text-teal-300 font-mono tabular-nums flex items-center justify-center gap-0.5">
                  <CountUp to={10} decimals={0} duration={1.4} />
                  <span>+</span>
                </div>
                <p className="text-xs uppercase tracking-widest text-slate-200 font-bold mt-2">
                  Polyclinic Specialists
                </p>
                <p className="text-xs text-slate-400 mt-0.5">ICMR, ACC &amp; ADA Grounded</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="text-3xl md:text-4xl font-black text-sky-300 font-mono tabular-nums flex items-center justify-center gap-0.5">
                  <CountUp to={100} decimals={0} duration={1.8} />
                  <span>%</span>
                </div>
                <p className="text-xs uppercase tracking-widest text-slate-200 font-bold mt-2">
                  Mumbai Residency Vault
                </p>
                <p className="text-xs text-slate-400 mt-0.5">DPDP 2023 · asia-south1</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="text-3xl md:text-4xl font-black text-indigo-300 font-mono tabular-nums flex items-center justify-center gap-0.5">
                  <span>&lt;</span>
                  <CountUp to={450} decimals={0} duration={1.8} />
                  <span className="text-base font-medium">ms</span>
                </div>
                <p className="text-xs uppercase tracking-widest text-slate-200 font-bold mt-2">
                  Edge AI Routing
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Cloudflare + Vertex AI</p>
              </div>
            </div>
          </section>

          {/* ─── 3. 3D GLASSMORPHIC CLINICAL & CLOUD CAPABILITIES BENTO ─── */}
          <section id="features-showcase" className="w-full relative z-20 bg-[#040B16] border-b border-white/10 py-24 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-14 max-w-3xl mx-auto">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-[0.16em] text-sky-300 bg-sky-500/10 border border-sky-400/25 mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Six Core Clinical Modules
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 text-white">
                  Wearables, Lab Vision, and{' '}
                  <span className="bg-gradient-to-r from-sky-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                    Google Cloud AI Defense.
                  </span>
                </h2>
                <p className="text-base md:text-lg text-slate-300 font-light leading-relaxed">
                  Every layer works together — streaming smartwatch vitals, checking medication safety, protecting prompts with Model Armor, and speaking results in your family&apos;s language.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Module 1: Wearable Telemetry */}
                <TiltSurface3D glowColor="rgba(56, 189, 248, 0.20)" className="rounded-[28px] p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-400/30">
                        <Watch className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-400/20">
                        Web Bluetooth
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">Wearable Biometric Fusion</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      Correlates live Resting HR, HRV, and SpO2 streams with blood inflammation markers to calibrate recovery intensity.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#040B16]/85 border border-white/10 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">Readiness Index</span>
                      <span className="text-emerald-300 font-mono font-bold">88 / 100 Peak</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-white/[0.04]">
                        <span className="block text-[10px] text-slate-400">HR</span>
                        <span className="font-mono font-bold text-sky-300 tabular-nums">64 bpm</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.04]">
                        <span className="block text-[10px] text-slate-400">SpO2</span>
                        <span className="font-mono font-bold text-emerald-300 tabular-nums">98%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.04]">
                        <span className="block text-[10px] text-slate-400">HRV</span>
                        <span className="font-mono font-bold text-indigo-300 tabular-nums">62 ms</span>
                      </div>
                    </div>
                  </div>
                </TiltSurface3D>

                {/* Module 2: Drug-Lab Matrix */}
                <TiltSurface3D glowColor="rgba(251, 113, 133, 0.20)" className="rounded-[28px] p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-400/30">
                        <Pill className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-400/20">
                        Safety Guard
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">Drug–Lab Interaction Matrix</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      Cross-references parsed medications with renal and electrolyte panels to surface clinically grounded alerts early.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#040B16]/85 border border-rose-500/25 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> High-Priority Flag
                      </span>
                      <span className="font-mono text-[10px] text-rose-200 bg-rose-500/20 px-2 py-0.5 rounded">Review</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-200">
                      <span>Lisinopril (10mg) ↔ Serum K+</span>
                      <span className="font-mono font-bold text-rose-300 tabular-nums">5.4 mEq/L ↑</span>
                    </div>
                  </div>
                </TiltSurface3D>

                {/* Module 3: Gemini 4 Multimodal Vision */}
                <TiltSurface3D glowColor="rgba(52, 211, 153, 0.20)" className="rounded-[28px] p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                        Strict Schema OCR
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">Gemini 4 Lab &amp; Rx Vision</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      Schema-enforced extraction parses multi-column Indian diagnostic PDFs and handwritten scripts with adaptive thinking retry.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#040B16]/85 border border-white/10 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-300" /> Verified Extraction
                      </span>
                      <span className="font-mono text-[11px] text-emerald-300">99.4%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] font-medium">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/12 text-emerald-200 border border-emerald-500/25">HbA1c 5.8%</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/12 text-amber-200 border border-amber-500/25">Vit D 18 ng/mL</span>
                      <span className="px-2 py-0.5 rounded bg-sky-500/12 text-sky-200 border border-sky-500/25">Metformin BD</span>
                    </div>
                  </div>
                </TiltSurface3D>

                {/* Module 4: Evidence-Grounded Specialists */}
                <TiltSurface3D glowColor="rgba(168, 85, 247, 0.20)" className="rounded-[28px] p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-400/30">
                        <Brain className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-400/20">
                        Clinical Grounding
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">10+ Polyclinic Specialists</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      Virtual specialist lenses grounded in ICMR, ADA 2025, ACC/AHA, and KDIGO citations plus live Google Search clinical retrieval.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#040B16]/85 border border-white/10 p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-purple-300">
                      <span>AI Endocrinologist</span>
                      <span className="text-[10px] font-mono bg-purple-500/15 px-2 py-0.5 rounded-full">ADA 2025</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Pairs HbA1c velocity with post-meal walking &amp; clinician medication review prompts.
                    </p>
                  </div>
                </TiltSurface3D>

                {/* Module 5: Model Armor + Mumbai FHIR R4 */}
                <TiltSurface3D glowColor="rgba(45, 212, 191, 0.22)" className="rounded-[28px] p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-400/30">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-400/20">
                        asia-south1
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">Model Armor &amp; Mumbai FHIR R4</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      Google Cloud Model Armor screens clinical prompts for injection attacks while Cloud Healthcare API isolates FHIR R4 stores in Mumbai.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#040B16]/85 border border-teal-500/25 p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-teal-200">Firewall · aegis-clinical-guard</span>
                      <span className="font-mono text-emerald-300">ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                      <span>aegis-fhir-r4</span>
                      <span>DPDP Residency</span>
                    </div>
                  </div>
                </TiltSurface3D>

                {/* Module 6: Cloud HD Indian Voice & Local AQI */}
                <TiltSurface3D glowColor="rgba(251, 146, 60, 0.20)" className="rounded-[28px] p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="p-2.5 rounded-xl bg-orange-500/15 text-orange-300 border border-orange-400/30">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-300 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-400/20">
                        Cloud TTS &amp; AQI
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">Cloud HD Voice &amp; Local AQI</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      Hear SBAR summaries read aloud via Google Cloud Text-to-Speech in Hindi, Marathi, Tamil, Telugu, or English alongside live Google Air Quality advisories.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#040B16]/85 border border-white/10 p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-200">
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Volume2 className="w-3.5 h-3.5 text-orange-300" /> Cloud HD Synthesis
                      </span>
                      <span className="font-mono text-[11px] text-orange-300">EN · HI · MR · TA · TE</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-sky-300" /> Air Quality Telemetry
                      </span>
                      <span className="font-mono text-[11px] text-sky-300">Live City AQI</span>
                    </div>
                  </div>
                </TiltSurface3D>
              </div>
            </div>
          </section>

          {/* ─── 4. ABHA / ABDM INDIA HEALTH STACK ─── */}
          <section id="abha-gateway" className="w-full relative z-20 bg-gradient-to-b from-[#040B16] to-[#071325] py-24 px-6 border-b border-white/10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-14 max-w-3xl mx-auto">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-[0.16em] text-orange-300 bg-orange-500/10 border border-orange-400/30 mb-4">
                  <QrCode className="w-3.5 h-3.5" /> India Health Stack · NHA ABDM Gateway
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 text-white">
                  Your Health ID.{' '}
                  <span className="bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 bg-clip-text text-transparent">
                    Interoperable Across Hospitals.
                  </span>
                </h2>
                <p className="text-base md:text-lg text-slate-300 font-light leading-relaxed">
                  Built to align with the National Health Authority&apos;s ABDM architecture — link care contexts across diagnostic chains and share AES-GCM-256 encrypted HL7 FHIR R4 bundles.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <TiltSurface3D glowColor="rgba(251, 146, 60, 0.22)" className="rounded-[28px] p-7 border-orange-500/25 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-orange-500/15 text-orange-300 border border-orange-400/30">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-300">M1 · ABHA Auth</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">ABHA ID &amp; Handle Mapping</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      Connect your 14-digit Ayushman Bharat Health Account and <span className="font-mono text-orange-200">name@abdm</span> handle cleanly inside your patient vault.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#040B16]/85 border border-orange-400/20 p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-semibold">ABHA Sample Format</span>
                      <span className="text-emerald-300 font-mono">Verified</span>
                    </div>
                    <div className="font-mono text-orange-200 font-bold tracking-wider">91-2345-6789-0123</div>
                  </div>
                </TiltSurface3D>

                <TiltSurface3D glowColor="rgba(245, 158, 11, 0.22)" className="rounded-[28px] p-7 border-amber-500/25 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-400/30">
                        <Link2 className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">M2 · Care Contexts</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">Care-Context Linking</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      Organize CBC panels, lipid studies, prescriptions, and clinical handover briefs into longitudinal care episodes.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#040B16]/85 border border-amber-400/20 p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300">CBC &amp; Lipid Panel</span>
                      <span className="text-emerald-300 font-semibold">Linked</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">SBAR Handover Note</span>
                      <span className="text-emerald-300 font-semibold">Linked</span>
                    </div>
                  </div>
                </TiltSurface3D>

                <TiltSurface3D glowColor="rgba(129, 140, 248, 0.22)" className="rounded-[28px] p-7 border-indigo-500/25 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
                        <FileJson className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">M3 · FHIR R4</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">Mumbai Cloud FHIR R4 Vault</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      Generate HL7 FHIR R4 / NRCeS India bundles synced directly with our tenant-isolated <span className="font-mono text-indigo-200">asia-south1</span> store.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#040B16]/85 border border-indigo-400/20 p-3.5 grid grid-cols-2 gap-1.5 text-[11px] font-mono text-indigo-200 text-center">
                    <span className="px-2 py-1 rounded bg-indigo-500/12">Patient</span>
                    <span className="px-2 py-1 rounded bg-indigo-500/12">DiagnosticReport</span>
                    <span className="px-2 py-1 rounded bg-indigo-500/12">Observation</span>
                    <span className="px-2 py-1 rounded bg-indigo-500/12">Consent</span>
                  </div>
                </TiltSurface3D>
              </div>

              <div className="aegis-hairline-surface rounded-3xl p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-orange-400/25">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-orange-500/15 text-orange-300 border border-orange-400/30 shrink-0">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">Built on the NHA ABDM &amp; DPDP Act 2023 Stack</h3>
                    <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                      Aligned with ABDM M1–M3 milestones, NRCeS FHIR R4 India IG, AES-GCM-256 encryption, and Indian data residency controls.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="shrink-0 px-7 py-3.5 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-300 hover:to-amber-300 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider transition-[transform,background-color] duration-150 active:scale-[0.97] flex items-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isSigningIn ? 'Connecting...' : 'Connect ABHA ID'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* ─── 5. CHAOS TO CLARITY 3D PIPELINE ─── */}
          <LandingScrollStory />

          {/* ─── 6. 100% FREE OPEN PLATFORM SHOWCASE (#pricing) ─── */}
          <section id="pricing" className="w-full relative z-20 bg-[#040B16] border-t border-white/10 py-24 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-14 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Production v2.0 • 100% Free Open Access
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                  Full Health Intelligence.{' '}
                  <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-sky-300 bg-clip-text text-transparent">
                    100% Free Open Access.
                  </span>
                </h2>
                <p className="text-base md:text-lg text-slate-300 font-light leading-relaxed">
                  Every clinical intelligence module — from multimodal lab ingestion and multi-profile tracking to our 10+ specialist lounges — is live in production and completely unlocked.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-7 max-w-6xl mx-auto">
                {/* Card 1 */}
                <TiltSurface3D glowColor="rgba(45, 212, 191, 0.16)" className="rounded-3xl p-7 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-teal-300 uppercase tracking-widest bg-teal-500/10 px-3 py-1 rounded-full border border-teal-400/20">
                      Clinical Intelligence
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-4 mb-2">Multimodal Lab AI</h3>
                    <div className="flex items-baseline gap-1.5 mb-6">
                      <span className="text-4xl font-black text-white tabular-nums">₹0</span>
                      <span className="text-sm font-bold text-emerald-300">Free Open Access</span>
                    </div>
                    <ul className="space-y-3 mb-8 text-sm text-slate-300">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong className="text-white">Unlimited</strong> Lab Report Vision Scans</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Instant Unit Normalization &amp; Anomaly Alerts</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Automated SBAR Doctor Handover Reports</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>FHIR R4 Diagnostic Bundles &amp; Export</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        handleSignIn();
                      }
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-[transform,background-color] duration-150 active:scale-[0.97] flex items-center justify-center gap-2"
                  >
                    Start Free Ingestion
                  </Link>
                </TiltSurface3D>

                {/* Card 2 (Featured) */}
                <TiltSurface3D
                  glowColor="rgba(52, 211, 153, 0.24)"
                  className="rounded-3xl p-7 !border-emerald-400/60 flex flex-col justify-between shadow-[0_0_45px_rgba(16,185,129,0.16)]"
                >
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-[11px] uppercase tracking-wider mb-3">
                      <Sparkles className="w-3.5 h-3.5" /> All Features Unlocked
                    </div>
                    <div className="block">
                      <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-400/20">
                        Family &amp; Wearables
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mt-4 mb-2">Multi-Profile Vault</h3>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-black text-emerald-300 tabular-nums">₹0</span>
                      <span className="text-sm font-bold text-emerald-200">100% Free Open Access</span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-300 mb-6">
                      Unlimited tracking for you &amp; your loved ones
                    </p>

                    <ul className="space-y-3 mb-8 text-sm text-slate-200">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong className="text-white">Multi-Profile</strong> Family &amp; Patient Tracking</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Apple Health &amp; Google Health Auto-Sync</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>3D Holographic Body Scanner &amp; Digital Twin</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Longitudinal Historical Trend Sparklines</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        handleSignIn();
                      }
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm transition-[transform,background-color] duration-150 active:scale-[0.97] flex items-center justify-center gap-2"
                  >
                    Launch Live Workspace
                  </Link>
                </TiltSurface3D>

                {/* Card 3 */}
                <TiltSurface3D glowColor="rgba(129, 140, 248, 0.20)" className="rounded-3xl p-7 !border-indigo-400/35 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-400/20">
                      Specialist Lounge
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-4 mb-2">10+ AI Specialists</h3>
                    <div className="flex items-baseline gap-1.5 mb-6">
                      <span className="text-4xl font-black text-indigo-300 tabular-nums">₹0</span>
                      <span className="text-sm font-bold text-indigo-200">Included Free</span>
                    </div>

                    <ul className="space-y-3 mb-8 text-sm text-slate-300">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span><strong className="text-white">Specialist Lounge</strong> (Cardio, Endo, Nephro &amp; more)</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Drug-Lab Contraindication Matrix</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Cloud HD Regional Voice &amp; Local AQI Advice</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>DPDP 2023 Aligned Zero-Knowledge Client Vault</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        handleSignIn();
                      }
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition-[transform,background-color] duration-150 active:scale-[0.97] flex items-center justify-center gap-2"
                  >
                    Explore Specialist Lounge
                  </Link>
                </TiltSurface3D>
              </div>

              <div className="mt-10 max-w-4xl mx-auto rounded-2xl p-4 bg-emerald-500/10 border border-emerald-400/25 flex items-center justify-center gap-2.5 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <p className="text-xs md:text-sm text-emerald-200 font-medium">
                  <strong className="text-white">Open Platform Guarantee:</strong> No credit card required. Launch the live interactive demo or sign in with your Email ID or Google account.
                </p>
              </div>
            </div>
          </section>

          {/* ─── 7. LAB BIOMARKER BENTO & INTERACTIVE SPECIALIST EXPLORER ─── */}
          <section className="w-full relative z-20 bg-[#040B16] border-t border-white/10 pt-20 pb-24 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-14 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                  Everything in its right place.
                </h2>
                <p className="text-base md:text-lg text-slate-300 font-light leading-relaxed">
                  Aegis extracts analyte values from PDFs, harmonizes units, and maps every biomarker against clinical reference ranges.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {BENTO_LABS.map((lab) => {
                  const Icon = lab.icon;
                  return (
                    <TiltSurface3D key={lab.id} glowColor={lab.glowColor} className="rounded-3xl p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-8">
                          <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${lab.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${lab.pillBg} ${lab.color}`}>
                            {lab.status}
                          </span>
                        </div>

                        <p className="text-slate-300 text-sm font-medium">{lab.label}</p>
                        <h3 className={`text-3xl font-black font-mono tabular-nums tracking-tight mt-1 ${lab.color}`}>
                          {lab.value}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-1 mb-4">Ref: {lab.range}</p>
                      </div>

                      <div>
                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mb-3">
                          <div className={`h-full rounded-full ${lab.barColor}`} style={{ width: `${lab.fillPct}%` }} />
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{lab.desc}</p>
                      </div>
                    </TiltSurface3D>
                  );
                })}
              </div>

              <SpecialistShowcaseSection
                isAuthenticated={!!user}
                onRequireSignIn={handleSignIn}
              />

              {/* ─── 8. RESOURCE CENTER (#explore) ─── */}
              <div id="explore" className="mt-24 pt-20 border-t border-white/10">
                <div className="text-center mb-12 max-w-2xl mx-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest text-teal-300 bg-teal-500/10 border border-teal-400/25 mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> Resource Center
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white">
                    Explore Aegis Guides &amp; Architecture
                  </h2>
                  <p className="text-base text-slate-300 font-light">
                    Read biomarker primers, patient safety documentation, and our multi-agent architecture playbook.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {EXPLORE_PAGES.map((page) => {
                    const Icon = page.icon;
                    return (
                      <Link key={page.href} to={page.href} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-3xl">
                        <TiltSurface3D glowColor="rgba(45, 212, 191, 0.16)" className="rounded-3xl p-7 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-5">
                              <div className="p-3 rounded-2xl bg-teal-500/12 border border-teal-400/25 text-teal-300">
                                <Icon className="w-5 h-5" />
                              </div>
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 group-hover:text-teal-300 group-hover:border-teal-400/30 transition-colors">
                                <span>Read Guide</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
                              {page.title}
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed font-light">
                              {page.desc}
                            </p>
                          </div>
                        </TiltSurface3D>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* ─── 9. SECURITY PILLARS & FOUNDER STORY ─── */}
              <div className="mt-24 text-center">
                <div className="mb-20 inline-grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto border-y border-white/10 py-10 text-left">
                  <div className="px-4">
                    <h3 className="text-white font-bold text-base mb-2">AES-256 &amp; Model Armor</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Tenant-isolated cloud vault with Mumbai region Model Armor prompt screening and strict session scoping.
                    </p>
                  </div>
                  <div className="px-4 border-y md:border-y-0 md:border-x border-white/10 py-4 md:py-0">
                    <h3 className="text-white font-bold text-base mb-2">Clinical Decision Support</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Aegis Health AI structures data for tracking and consultation prep. It is not a medical diagnosis authority.
                    </p>
                  </div>
                  <div className="px-4">
                    <h3 className="text-white font-bold text-base mb-2">Zero Data Sale Guarantee</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      We never sell health records to insurers, advertisers, or third parties. Your data belongs to your family.
                    </p>
                  </div>
                </div>

                {/* Founder Card */}
                <div className="mb-20 max-w-3xl mx-auto">
                  <TiltSurface3D glowColor="rgba(45, 212, 191, 0.16)" className="rounded-[2rem] p-8 md:p-10 text-left">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-7">
                      <img
                        src="https://lh3.googleusercontent.com/d/11-MtBvMJRl6OpfL60wypuMn-LCw2jC50"
                        alt="Aniket Rajesh Dhuri - Founder & Lead AI Systems Architect of Aegis Health AI"
                        className="w-36 h-36 md:w-44 md:h-44 shrink-0 object-cover object-[center_35%] rounded-full border-2 border-teal-400/50 bg-slate-800"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold">
                            Founder &amp; Lead AI Systems Architect
                          </span>
                          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
                            Govt. of India MSME: UDYAM-MH-33-0782403
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Leadership &amp; Company Story</h3>
                        <p className="text-slate-300 leading-relaxed mb-3 text-sm md:text-base">
                          Hi, I&apos;m{' '}
                          <a
                            href="https://aniket.aegishealthai.co.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-teal-300 hover:text-teal-200 underline underline-offset-4 decoration-teal-400/40"
                          >
                            Aniket Rajesh Dhuri, Founder &amp; Lead Architect
                          </a>{' '}
                          of Aegis Health AI, headquartered in Dombivli West, Thane, Maharashtra, India.
                        </p>
                        <p className="text-slate-300 leading-relaxed mb-5 text-sm md:text-base">
                          Built to help Indian families decode pathology reports from Thyrocare, Dr. Lal PathLabs, Metropolis, Apollo, and SRL into normalized longitudinal timelines, HL7 FHIR R4 bundles, SBAR Doctor Visit Prep briefs, and multilingual summaries.
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-white/10">
                          <a
                            href="https://www.linkedin.com/in/aniket-dhuri-273094225"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-400/30 rounded-xl text-xs font-bold transition-colors"
                          >
                            <Linkedin className="w-4 h-4 text-blue-400" />
                            <span>LinkedIn</span>
                          </a>
                          <a
                            href="https://github.com/dhurianiket/Aegis-health-ai-"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 rounded-xl text-xs font-bold transition-colors"
                          >
                            <Github className="w-4 h-4 text-emerald-400" />
                            <span>GitHub</span>
                          </a>
                          <a
                            href="https://aniket.aegishealthai.co.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-bold transition-colors"
                          >
                            <Sparkles className="w-4 h-4 text-emerald-300" />
                            <span>Founder Portfolio</span>
                          </a>
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 md:ml-auto">
                            <MapPin className="w-3.5 h-3.5 text-teal-400" />
                            Dombivli West, Thane 421202
                          </span>
                        </div>
                      </div>
                    </div>
                  </TiltSurface3D>
                </div>

                {/* Final Bottom CTA */}
                <p className="text-teal-300 font-mono font-bold mb-3 tracking-widest text-xs uppercase">
                  Your health, decoded.
                </p>
                <h3 className="text-3xl md:text-5xl font-bold mb-5 text-white tracking-tight max-w-2xl mx-auto">
                  Stop guessing. Start knowing.
                </h3>
                <p className="text-base md:text-lg text-slate-300 mb-8 max-w-lg mx-auto font-light leading-relaxed">
                  Launch the live clinical workspace right now or upload your own diagnostic PDF report.
                </p>
                <Link
                  to="/dashboard"
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      handleSignIn();
                    }
                  }}
                  className="px-9 py-4 bg-white text-[#040B16] hover:bg-teal-50 rounded-full font-black text-sm tracking-wide transition-[transform,background-color] duration-150 active:scale-[0.97] shadow-[0_0_30px_rgba(255,255,255,0.14)] inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Sign In / Launch Workspace</span>
                </Link>
              </div>
            </div>
          </section>

          {/* ─── FOOTER ─── */}
          <footer className="pb-12 border-t border-white/10 pt-16 bg-[#040B16]">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                  <ShieldCheck className="w-6 h-6 text-teal-400" strokeWidth={2} />
                  <span className="font-black tracking-[0.2em] text-white text-lg">AEGIS</span>
                </div>
                <p className="text-sm text-slate-400 font-light leading-relaxed max-w-xs mx-auto md:mx-0">
                  Clinical-grade medical telemetry and plain-language health intelligence for Indian families.
                </p>
              </div>

              <div className="text-center md:text-left">
                <h4 className="text-white font-bold tracking-widest uppercase text-xs mb-4">Explore Aegis</h4>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link
                      to="/dashboard"
                      onClick={(e) => {
                        if (!user) {
                          e.preventDefault();
                          handleSignIn();
                        }
                      }}
                      className="text-teal-300 hover:text-teal-200 font-bold"
                    >
                      Live Interactive Workspace
                    </Link>
                  </li>
                  <li>
                    <a href="#pricing" className="text-slate-300 hover:text-teal-300">
                      Platform Capabilities (Free)
                    </a>
                  </li>
                  {EXPLORE_PAGES.map((page) => (
                    <li key={page.href}>
                      <Link to={page.href} className="text-slate-400 hover:text-teal-300 transition-colors">
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center md:text-left">
                <h4 className="text-white font-bold tracking-widest uppercase text-xs mb-4">Contact &amp; Support</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a
                      href="mailto:founder@aegishealthai.co.in"
                      className="text-slate-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>founder@aegishealthai.co.in</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:support@aegishealthai.co.in"
                      className="text-slate-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>support@aegishealthai.co.in</span>
                    </a>
                  </li>
                  <li className="text-slate-400 inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Dombivli West, Thane 421202</span>
                  </li>
                  <li className="text-slate-400 text-xs font-mono">
                    MSME Udyam: UDYAM-MH-33-0782403
                  </li>
                </ul>
              </div>

              <div className="text-center md:text-right">
                <h4 className="text-white font-bold tracking-widest uppercase text-xs mb-4">Legal</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link
                      to="/privacy-policy"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalModalType('privacy');
                        setLegalModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-teal-300 underline decoration-white/20 underline-offset-4"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/terms-of-service"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalModalType('terms');
                        setLegalModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-teal-300 underline decoration-white/20 underline-offset-4"
                    >
                      Terms &amp; Medical Disclaimer
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 mb-8 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-semibold">
                Important Clinical &amp; Medical Disclaimer
              </p>
              <p className="text-xs text-slate-300 max-w-4xl mx-auto leading-relaxed">
                Aegis Health AI is an informational clinical decision-support and health intelligence platform and does NOT provide medical diagnosis or treatment prescriptions. It does not replace professional clinical assessments. Always consult a qualified healthcare provider regarding your health data or any medical condition.
              </p>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left space-y-1">
                <p className="text-xs text-slate-400 tracking-wide uppercase">
                  &copy; {new Date().getFullYear()} Aegis Health AI. All rights reserved.
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  VERSION 2.0.0 / SECURE ENCRYPTION ACTIVE
                </p>
                <p className="text-xs text-slate-300 max-w-md">
                  This site uses only essential session cookies to keep you signed in. No tracking or advertising cookies.
                </p>
              </div>

              <div className="text-center md:text-right space-y-2.5">
                <p className="text-xs text-slate-300 flex items-center justify-center md:justify-end gap-1.5 italic">
                  <span>Built on Google Cloud, Vertex AI &amp; Firebase</span>
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                </p>
                <div className="flex flex-col items-center md:items-end gap-2">
                  <a
                    href="https://www.nvidia.com/en-us/startups/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Aegis Health AI is a member of the NVIDIA Inception program"
                    className="p-1.5 bg-white rounded-lg border border-slate-200 inline-block"
                  >
                    <img
                      src="/nvidia-inception-badge.svg"
                      alt="Member of the NVIDIA Inception program"
                      className="h-8 w-auto object-contain"
                    />
                  </a>
                  <span className="text-xs text-slate-300">
                    Member of NVIDIA Inception &amp; supported by the Google for Startups Cloud Program.
                  </span>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-4 text-center space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-4xl mx-auto">
                © 2026 NVIDIA, the NVIDIA logo, and NVIDIA Inception are trademarks and/or registered trademarks of NVIDIA Corporation in the U.S. and other countries. Google Cloud, Vertex AI, and Google for Startups are trademarks of Google LLC.
              </p>
              <p className="text-xs text-slate-400">
                This site is protected by reCAPTCHA and the Google{' '}
                <a className="text-sky-400 hover:underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a className="text-sky-400 hover:underline" href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
                  Terms of Service
                </a>{' '}
                apply.
              </p>
            </div>
          </footer>
        </main>

        <AuthLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

        <LegalModal
          isOpen={legalModalOpen}
          onClose={() => setLegalModalOpen(false)}
          type={legalModalType}
        />
      </div>
    </ErrorBoundary>
  );
}
