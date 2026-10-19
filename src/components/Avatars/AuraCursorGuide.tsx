/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Aura Interactive Cursor & Contextual "Explain What To Do" Companion Guide.
 * Evolves the clean-room procedural SVG avatar engine with:
 * 1. Real-time 2.5D pointer gaze tracking & contextual cursor badge follower
 * 2. Smart DOM hover inspection that explains what any button/control does and what to do next
 * 3. Interactive 5-step Guided Clinical Tour across Aegis Health AI
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, Compass, ChevronRight, EyeOff, HelpCircle } from 'lucide-react';
import { AuraCompanion } from './ProceduralAvatar';

export interface GuideExplanation {
  title: string;
  whatItDoes: string;
  whatToDo: string;
  cursorBadge: string;
}

interface AuraCursorGuideProps {
  activeTab: string;
  onNavigateTab?: (tab: string) => void;
  onOpenChat?: () => void;
}

const TAB_DEFAULT_GUIDES: Record<string, GuideExplanation> = {
  home: {
    title: 'Clinical Command Dashboard',
    whatItDoes: 'Displays your 3D Organ Digital Twin, live biomarker telemetry, and longitudinal health score.',
    whatToDo: 'Hover over any organ card, click "Handover Report" for a doctor summary, or click "Consult AI".',
    cursorBadge: 'Explore Dashboard',
  },
  upload: {
    title: 'AI Lab Report & Prescription Ingest',
    whatItDoes: 'Extracts structured biomarkers and medication schedules from PDFs or camera photos using Gemini.',
    whatToDo: 'Drag and drop a diagnostic lab PDF or click the upload zone to parse your results.',
    cursorBadge: 'Upload PDF / Image',
  },
  reports: {
    title: 'Diagnostic Lab Reports Vault',
    whatItDoes: 'Organizes your historical blood panels, reference ranges, and out-of-range flags.',
    whatToDo: 'Click any lab report card to inspect individual biomarkers or ask Aura AI to explain abnormal values.',
    cursorBadge: 'Inspect Biomarkers',
  },
  trends: {
    title: 'Longitudinal Biomarker Trends',
    whatItDoes: 'Charts how your key vitals, lipids, HbA1c, and organ markers evolve over time.',
    whatToDo: 'Select a biomarker filter chip to compare historical readings against clinical target zones.',
    cursorBadge: 'Compare Trends',
  },
  sbar: {
    title: 'SBAR Clinical Handover Summary',
    whatItDoes: 'Synthesizes Situation, Background, Assessment, and Recommendation notes for your physician.',
    whatToDo: 'Review the structured summary or export/print it before your next doctor appointment.',
    cursorBadge: 'Review SBAR',
  },
  specialist: {
    title: 'Multi-Persona Specialist Lounge',
    whatItDoes: 'Provides 10 distinct procedural AI Health Information Guides (Cardiology, Neurology, Paediatrics, etc.).',
    whatToDo: 'Select any specialist avatar on the left sidebar and type or speak your health question.',
    cursorBadge: 'Choose Specialist',
  },
  profile: {
    title: 'Profile & Paediatric Buddy Studio',
    whatItDoes: 'Manages family health profiles, DPDP Section 9 parental consent, and 2.5D procedural avatars.',
    whatToDo: 'Click the pencil ("Edit Profile") button on any card to customize the Buddy Avatar, tone, and mood.',
    cursorBadge: 'Customize Profile',
  },
  medications: {
    title: 'Pharmacy & Medication Adherence',
    whatItDoes: 'Tracks active prescriptions, dosages, refill schedules, and interaction alerts.',
    whatToDo: 'Add or verify your current medications so Aura AI includes them in clinical context.',
    cursorBadge: 'Manage Meds',
  },
  caremap: {
    title: 'Localized Care Map',
    whatItDoes: 'Locates nearby hospitals, diagnostic labs, and emergency care centers.',
    whatToDo: 'Filter by facility type to find verified clinical centers near your location.',
    cursorBadge: 'Find Care',
  },
  calendar: {
    title: 'Clinical Calendar & Follow-Up Sync',
    whatItDoes: 'Schedules upcoming lab re-tests, vaccination reminders, and doctor visits.',
    whatToDo: 'Click an upcoming reminder to sync follow-up dates with your schedule.',
    cursorBadge: 'Sync Schedule',
  },
  settings: {
    title: 'Privacy, Security & App Settings',
    whatItDoes: 'Controls DPDP data privacy preferences, FHIR export, and display themes.',
    whatToDo: 'Toggle preferences or export your health record in interoperable format.',
    cursorBadge: 'Configure App',
  },
};

const TOUR_STEPS: Array<{ tab: string; label: string }> = [
  { tab: 'home', label: '1/5 Digital Twin' },
  { tab: 'upload', label: '2/5 Ingest PDF' },
  { tab: 'specialist', label: '3/5 10 Specialists' },
  { tab: 'sbar', label: '4/5 SBAR Handover' },
  { tab: 'profile', label: '5/5 Avatar Studio' },
];

/**
 * Inspects a hovered DOM element and returns a plain-language explanation of what it does and what to do.
 */
function resolveElementExplanation(target: HTMLElement | null): GuideExplanation | null {
  if (!target) return null;
  const interactive = target.closest(
    'button, a, input, select, textarea, [role="button"], [data-aura-guide], [data-testid]'
  ) as HTMLElement | null;
  if (!interactive) return null;

  // Ignore clicks inside the guide HUD itself so it stays stable while interacting with tour controls
  if (interactive.closest('[data-testid="aura-cursor-guide"]')) {
    return null;
  }

  const customHint = interactive.getAttribute('data-aura-guide');
  const ariaLabel = (interactive.getAttribute('aria-label') || '').trim();
  const titleAttr = (interactive.getAttribute('title') || '').trim();
  const testId = (interactive.getAttribute('data-testid') || '').trim();
  const text = (interactive.textContent || '').replace(/\s+/g, ' ').trim();
  const combined = `${customHint || ''} ${ariaLabel} ${titleAttr} ${testId} ${text}`.toLowerCase();

  if (combined.includes('open ai assistant') || combined.includes('consult ai') || combined.includes('aura ai')) {
    return {
      title: 'Aura AI Health Companion',
      whatItDoes: 'Opens the real-time clinical chat drawer powered by Gemini with full awareness of your labs & meds.',
      whatToDo: 'Click to open the chat drawer and ask questions by text or voice.',
      cursorBadge: '✨ Ask Aura AI',
    };
  }
  if (combined.includes('edit profile')) {
    return {
      title: 'Edit Profile & Avatar Studio',
      whatItDoes: 'Opens the 2-column profile editor, DPDP Section 9 parental verification, and Paediatric Buddy Studio.',
      whatToDo: 'Click this pencil icon to customize the 2.5D SVG character, skin tone, expression mood, and hair.',
      cursorBadge: '✏️ Edit & Customize',
    };
  }
  if (combined.includes('select astro') || combined.includes('select sprout') || combined.includes('select sunshine') || combined.includes('select wonder') || combined.includes('select aqua')) {
    return {
      title: `Buddy Preset: ${text || ariaLabel.replace('Select ', '')}`,
      whatItDoes: 'Switches the procedural SVG character geometry, outfit palette, and default accessory.',
      whatToDo: 'Click to apply this character preset and see the live 2.5D preview update immediately.',
      cursorBadge: '🎨 Apply Preset',
    };
  }
  if (combined.includes('tone ') || combined.includes('skin')) {
    return {
      title: `Skin & Surface Tone (${titleAttr || ariaLabel})`,
      whatItDoes: 'Updates the 3D-shaded facial gradient and rim-lighting palette of the procedural avatar.',
      whatToDo: 'Click to preview this tone on your companion avatar.',
      cursorBadge: '🎨 Change Tone',
    };
  }
  if (combined.includes('cheerful') || combined.includes('super star') || combined.includes('calm') || combined.includes('curious')) {
    return {
      title: `Expression Mood: ${text}`,
      whatItDoes: 'Changes the avatar’s eyebrow curvature, cheek warmth, and mouth geometry.',
      whatToDo: 'Click to set this default emotional expression for the profile.',
      cursorBadge: '😊 Set Mood',
    };
  }
  if (combined.includes('avatar hair style') || combined.includes('spiky explorer') || combined.includes('curly cloud')) {
    return {
      title: 'Procedural Hair Geometry',
      whatItDoes: 'Selects between 6 multi-layered SVG hair silhouettes with 3D highlight planes.',
      whatToDo: 'Choose a hair style from the dropdown to customize the avatar.',
      cursorBadge: '💇 Change Hair',
    };
  }
  if (combined.includes('avatar accessory') || combined.includes('star badge') || combined.includes('super shield')) {
    return {
      title: 'Companion Badge & Accessory',
      whatItDoes: 'Adds a kid-friendly star badge, super shield, sprout pin, round glasses, or cyber halo.',
      whatToDo: 'Select an accessory to personalize the profile medallion.',
      cursorBadge: '⭐ Add Badge',
    };
  }
  if (combined.includes('72h data purge') || combined.includes('erasure')) {
    return {
      title: 'DPDP Section 9 — 72-Hour Hard Erasure',
      whatItDoes: 'Triggers a statutory cryptographic data purge receipt under India’s DPDP Act 2023.',
      whatToDo: 'Click to schedule verifiable 72-hour erasure of paediatric diagnostic records.',
      cursorBadge: '🛡️ Statutory Purge',
    };
  }
  if (combined.includes('handover report') || combined.includes('sbar')) {
    return {
      title: 'SBAR Doctor Handover Generator',
      whatItDoes: 'Compiles your clinical history, abnormal labs, and active medications into a 1-page physician brief.',
      whatToDo: 'Click to generate or view your structured SBAR handover summary.',
      cursorBadge: '📋 Generate SBAR',
    };
  }
  if (combined.includes('specialist lounge') || combined.includes('cardiologist') || combined.includes('neurologist') || combined.includes('endocrinologist') || combined.includes('psychiatrist') || combined.includes('nephrologist') || combined.includes('pulmonologist') || combined.includes('gastroenterologist') || combined.includes('dermatologist') || combined.includes('orthopedist') || combined.includes('oncologist')) {
    return {
      title: `AI Specialist Guide (${text.slice(0, 28) || 'Specialist Lounge'})`,
      whatItDoes: 'Switches the active clinical persona and procedural avatar to a domain-specific AI health guide.',
      whatToDo: 'Click to consult this specialist guide and review tailored health insights.',
      cursorBadge: '🩺 Switch Specialist',
    };
  }
  if (combined.includes('email / reviewer sign in') || combined.includes('sign in')) {
    return {
      title: 'Reviewer & Patient Authentication',
      whatItDoes: 'Signs into live Firestore cloud sync or switches between sandbox evaluation and personal records.',
      whatToDo: 'Click to sign in with Email, Google, or the pre-configured Reviewer account.',
      cursorBadge: '🔐 Sign In',
    };
  }
  if (combined.includes('switch to') || combined.includes('viewing')) {
    return {
      title: 'Active Patient Context Switcher',
      whatItDoes: 'Sets which family member’s biomarkers, medications, and DPDP rules are active across the app.',
      whatToDo: 'Click "Switch To" to load this patient’s clinical dashboard and AI context.',
      cursorBadge: '👤 Switch Patient',
    };
  }
  if (combined.includes('add profile')) {
    return {
      title: 'Create Family / Paediatric Profile',
      whatItDoes: 'Adds a new adult or child health record with dedicated avatar and consent settings.',
      whatToDo: 'Click to create a new patient profile.',
      cursorBadge: '➕ New Profile',
    };
  }
  if (combined.includes('ingest') || combined.includes('upload')) {
    return {
      title: 'Lab PDF & Image Ingestion',
      whatItDoes: 'Uploads diagnostic reports for automated Gemini biomarker extraction.',
      whatToDo: 'Click to navigate to the Ingest center and upload a medical PDF.',
      cursorBadge: '📤 Upload Report',
    };
  }
  if (combined.includes('switch to light') || combined.includes('switch to dark')) {
    return {
      title: 'Clinical Theme Switcher',
      whatItDoes: 'Toggles between high-contrast dark clinical mode and daylight mode.',
      whatToDo: 'Click to switch the interface color theme.',
      cursorBadge: '🌗 Toggle Theme',
    };
  }
  if (text && text.length >= 2 && text.length <= 42) {
    return {
      title: `Interactive Control: "${text}"`,
      whatItDoes: 'Triggers the selected action or updates your current clinical view.',
      whatToDo: `Click "${text}" to activate this control.`,
      cursorBadge: '👆 Click to Activate',
    };
  }
  return null;
}

export function AuraCursorGuide({
  activeTab,
  onNavigateTab,
}: AuraCursorGuideProps) {
  const [isGuideEnabled, setIsGuideEnabled] = useState(true);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: -200, y: -200 });
  const [isPointerFine, setIsPointerFine] = useState(false);
  const [hoveredGuide, setHoveredGuide] = useState<GuideExplanation | null>(null);
  const [isSpeakingPulse, setIsSpeakingPulse] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fine =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: fine)').matches
        : true;
    setIsPointerFine(fine);

    const handleMove = (e: PointerEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const handleOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const explained = resolveElementExplanation(target);
      if (explained) {
        setHoveredGuide((prev) => {
          if (prev?.title !== explained.title) {
            setIsSpeakingPulse(true);
          }
          return explained;
        });
      } else if (!target?.closest('[data-testid="aura-cursor-guide"]')) {
        setHoveredGuide(null);
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerover', handleOver, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerover', handleOver);
    };
  }, []);

  // Brief mouth-articulation pulse whenever Aura explains a new hovered element
  useEffect(() => {
    if (!isSpeakingPulse) return;
    const timer = setTimeout(() => setIsSpeakingPulse(false), 1100);
    return () => clearTimeout(timer);
  }, [isSpeakingPulse, hoveredGuide?.title]);

  const currentExplanation: GuideExplanation =
    hoveredGuide ||
    TAB_DEFAULT_GUIDES[activeTab] ||
    TAB_DEFAULT_GUIDES.home;

  const handleNextTourStep = () => {
    const nextIdx = (tourIndex + 1) % TOUR_STEPS.length;
    setTourIndex(nextIdx);
    const nextTab = TOUR_STEPS[nextIdx].tab;
    setHoveredGuide(null);
    setIsSpeakingPulse(true);
    if (onNavigateTab) {
      onNavigateTab(nextTab);
    } else {
      window.location.hash = nextTab;
    }
  };

  return (
    <>
      {/* 1. Interactive Cursor Ring & Action Badge (Desktop fine pointers only) */}
      {isGuideEnabled && isPointerFine && cursorPos.x > 0 && (
        <div
          data-testid="aura-interactive-cursor"
          className="fixed top-0 left-0 z-[10000] pointer-events-none select-none transition-transform duration-75 ease-out hidden md:block"
          style={{
            transform: `translate3d(${Math.min(cursorPos.x + 16, (typeof window !== 'undefined' ? window.innerWidth : 1280) - 165)}px, ${Math.min(cursorPos.y + 16, (typeof window !== 'undefined' ? window.innerHeight : 800) - 44)}px, 0)`,
          }}
        >
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-lg transition-all ${
              hoveredGuide
                ? 'bg-teal-50/95 dark:bg-teal-950/90 border-teal-500/70 dark:border-teal-400/70 text-teal-900 dark:text-teal-200 scale-105 shadow-teal-500/20'
                : 'bg-white/90 dark:bg-slate-900/75 border-indigo-500/40 dark:border-indigo-400/35 text-slate-800 dark:text-slate-300 opacity-90'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                hoveredGuide ? 'bg-teal-600 dark:bg-teal-400 animate-ping' : 'bg-indigo-600 dark:bg-indigo-400'
              }`}
            />
            <span className="whitespace-nowrap">{currentExplanation.cursorBadge}</span>
          </div>
        </div>
      )}

      {/* 2. Floating Aura "Explain What To Do" Companion HUD */}
      <div
        data-testid="aura-cursor-guide"
        className="fixed bottom-[5.25rem] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-20 z-[9850] sm:w-[355px] pointer-events-auto"
      >
        {!isGuideEnabled ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsGuideEnabled(true)}
              aria-label="Enable Interactive Avatar Guide"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 border border-teal-500/40 text-teal-800 dark:text-teal-300 text-xs font-bold shadow-lg cursor-pointer transition-all"
            >
              <HelpCircle className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>Interactive Guide</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-teal-500/40 dark:border-teal-500/35 p-3 sm:p-3.5 shadow-2xl shadow-slate-900/15 dark:shadow-teal-950/50 text-left transition-all">
            <div className="flex items-start gap-3">
              {/* 2.5D Gaze-Tracking Aura Guide Avatar with Pointing/Explaining Gesture */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-teal-500/40 dark:border-teal-400/40 flex items-center justify-center p-0.5 shrink-0 shadow-md">
                <AuraCompanion
                  isListening={Boolean(hoveredGuide) && !isSpeakingPulse}
                  isSpeaking={isSpeakingPulse}
                  gesture={hoveredGuide ? 'explain' : 'wave'}
                  size={42}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300 truncate">
                    <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                    {hoveredGuide ? 'Interactive Cursor Guide' : 'Aura Screen Guide'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsGuideEnabled(false)}
                    aria-label="Minimize Interactive Guide"
                    title="Minimize Guide"
                    className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4
                  data-testid="aura-guide-title"
                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug break-words"
                >
                  {currentExplanation.title}
                </h4>

                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {currentExplanation.whatItDoes}
                </p>

                <div
                  data-testid="aura-guide-action"
                  className="mt-2 px-2.5 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/35 dark:border-teal-400/30 text-[11px] text-teal-950 dark:text-teal-200 leading-snug"
                >
                  <strong className="text-teal-900 dark:text-teal-300 font-bold">What to do: </strong>
                  {currentExplanation.whatToDo}
                </div>

                {/* Interactive Guided Walkthrough Controls */}
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">
                    Move cursor over any item to inspect
                  </span>
                  <button
                    type="button"
                    onClick={handleNextTourStep}
                    data-testid="aura-guide-next-tour"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-600 dark:bg-indigo-600/80 dark:hover:bg-indigo-500 text-white text-[11px] font-bold transition-colors shrink-0 cursor-pointer"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Tour {TOUR_STEPS[tourIndex].label}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AuraCursorGuide;
