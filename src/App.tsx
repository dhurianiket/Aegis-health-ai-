import React, { useState, Suspense, lazy, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
const LandingPage = lazy(() => import("./components/LandingPage/LandingPage"));
import { ShieldCheck } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase/config";
import SplashScreen from "./components/Onboarding/SplashScreen";
import PostLoginTransition from "./components/Onboarding/PostLoginTransition";
import {
  Bell,
  Search,
  LogIn,
  LogOut,
  Users,
  Loader2,
  FileText,
  Upload,
  Sparkles,
  Plus,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "./context/AuthContext";
import { useProfile } from "./context/ProfileContext";
import { useAlerts } from "./context/AlertsContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AIErrorBoundary } from "./components/ui/AIErrorBoundary";
import NotificationDropdown from "./components/Header/NotificationDropdown";
import OfflineIndicator from "./components/OfflineIndicator";
import { UserProfile } from "./types/medical";
import { AppNav } from "./components/Header/AppNav";

import { SectionErrorBoundary } from "./components/ui/SectionErrorBoundary";

const ConsentScreen = lazy(
  () => import("./components/Onboarding/ConsentScreen"),
);
const SBARPreview = lazy(() =>
  import("./components/Dashboard/SBARPreview").then((m) => ({
    default: m.SBARPreview,
  })),
);
const ExportModal = lazy(() => import("./components/Export/ExportModal"));
const ChatCoach = lazy(() => import("./components/AIHelper/ChatCoach"));
const NotificationCenter = lazy(
  () => import("./components/Notifications/NotificationCenter"),
);
const IntegrationsPanel = lazy(
  () => import("./components/Settings/IntegrationsPanel"),
);
const SharedProfile = lazy(() => import("./components/Export/SharedProfile"));

import { generateSBAR } from "./services/sbarGenerationService";
import { validateProfileName } from "./lib/validation";
import { logger } from "./lib/logger";
import { getDocuments } from "./lib/firebase/firestore";

declare global {
  interface Window {
    aistudio?: {
      openSelectKey?: () => Promise<void>;
      hasSelectedApiKey?: () => Promise<boolean>;
    };
  }
}

const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const UploadCenter = lazy(() => import("./components/Upload/UploadCenter"));
const Timeline = lazy(() => import("./components/Timeline/Timeline"));
const SpecialistLounge = lazy(
  () => import("./components/Specialists/SpecialistLounge"),
);
const Medications = lazy(() => import("./components/Medications/Medications"));
const ProfileManagement = lazy(
  () => import("./components/Profile/ProfileManagement"),
);
const FamilyHub = lazy(() => import("./components/Profile/FamilyHub"));
const SettingsPage = lazy(() => import("./components/Settings/SettingsPage"));
const LabReportsSection = lazy(
  () => import("./components/Reports/LabReportsSection"),
);
const AdminDashboard = lazy(() => import("./components/Admin/AdminDashboard"));
const FeedbackWidget = lazy(() => import("./components/Dashboard/FeedbackWidget"));
const CareMap = lazy(() => import("./components/CareMap/CareMap"));
const CalendarSync = lazy(() => import("./components/CalendarSync/CalendarSync"));

// Loading Fallback
const Fallback = () => (
  <div className="flex h-full items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-muted)]">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
);

function MainApp() {
  const [showPostLoginAnimation, setShowPostLoginAnimation] = useState(false);
  const isFirstAuthResolution = useRef(true);

  const [activeTab, setActiveTab] = useState("home");
  const { user, loading: authLoading, isSigningIn, signIn, logOut } = useAuth();
  const { profiles, activeProfile, setActiveProfile, createProfile, isLoading: profileLoading } =
    useProfile();
  const { alerts, dismissedIds, dismissAlert, unreadCount } = useAlerts();

  const [isNewProfileModaOpen, setIsNewProfileModaOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileToSwitch, setProfileToSwitch] = useState<UserProfile | null>(
    null,
  );
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isConsentGranted, setIsConsentGranted] = useState<boolean | null>(
    null,
  );
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] =
    useState(false);
  const [isSBAROpen, setIsSBAROpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sbarData, setSbarData] = useState<any>(null);
  const [isGeneratingSBAR, setIsGeneratingSBAR] = useState(false);
  const [sbarError, setSbarError] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [sbarKey, setSbarKey] = useState(0);

  useEffect(() => {
    if ((isSBAROpen || activeTab === "sbar") && activeProfile && user) {
      if (!sbarData && !isGeneratingSBAR && !sbarError) {
        const fetchSBAR = async () => {
          setIsGeneratingSBAR(true);
          setSbarError(null);
          try {
            const docs = await getDocuments(user.uid, activeProfile.id);
            let observations: any[] = [];
            docs?.slice(0, 3).forEach((doc: any) => {
              if (doc.extractedData?.observations) {
                observations.push(...doc.extractedData.observations);
              } else if (doc.extractedData?.lab_values) {
                observations.push(...doc.extractedData.lab_values);
              }
            });
            const meds = activeProfile.medications || [];
            const data = await generateSBAR(
              user.uid,
              activeProfile as unknown as UserProfile
            );
            setSbarData(data);
          } catch (e) {
            console.error(e);
            setSbarError("Unable to generate summary. Please try again.");
          } finally {
            setIsGeneratingSBAR(false);
          }
        };
        fetchSBAR();
      }
    }
  }, [
    isSBAROpen,
    activeTab,
    activeProfile,
    user,
    sbarData,
    isGeneratingSBAR,
    sbarError,
  ]);
  const [chatKey, setChatKey] = useState(0);
  const [showLogout, setShowLogout] = useState(false);

  // Check for shared profile in URL
  const searchParams = new URLSearchParams(window.location.search);
  const shareId = searchParams.get("share");
  const shareUid = searchParams.get("uid");

  useEffect(() => {
    const syncTabFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      const validTabs = [
        "home",
        "upload",
        "reports",
        "trends",
        "sbar",
        "specialist",
        "medications",
        "settings",
        "profile",
        "admin",
      ];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isNewProfileModaOpen) setIsNewProfileModaOpen(false);
        if (profileToSwitch) setProfileToSwitch(null);
        if (isNotificationsOpen) setIsNotificationsOpen(false);
        if (isSBAROpen) setIsSBAROpen(false);
        if (isExportOpen) setIsExportOpen(false);
        if (isChatOpen) setIsChatOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isNewProfileModaOpen,
    profileToSwitch,
    isNotificationsOpen,
    isSBAROpen,
    isExportOpen,
    isChatOpen,
  ]);

  const handleConsentGranted = React.useCallback(() => {
    setIsConsentGranted(true);
  }, []);

  const handleConsentChecked = React.useCallback((exists: boolean) => {
    setIsConsentGranted(exists);
  }, []);

  const handleCreateProfile = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");

    const validation = validateProfileName(newProfileName);
    if (!validation.isValid) {
      setProfileError(validation.error || "Invalid name");
      return;
    }

    try {
      await createProfile(newProfileName.trim());
      setIsNewProfileModaOpen(false);
      setNewProfileName("");
    } catch (e: unknown) {
      logger.error(e as Error);
      setProfileError("Failed to create profile. Please try again.");
    }
  }, [newProfileName, createProfile]);

  const activeAlertsCount = unreadCount;

  const isLoading = authLoading;

  if (shareId && shareUid) {
    return (
      <Suspense fallback={<Fallback />}>
        <SharedProfile shareId={shareId} userId={shareUid} />
      </Suspense>
    );
  }

  if (isLoading) {
    return <SplashScreen />;
  }

  if (showPostLoginAnimation && (!user || isConsentGranted === true)) {
    return (
      <PostLoginTransition 
        onComplete={() => setShowPostLoginAnimation(false)} 
      />
    );
  }

  if (user && (isConsentGranted === false || isConsentGranted === null)) {
    return (
      <Suspense fallback={<SplashScreen />}>
        <ConsentScreen
          userId={user.uid}
          onConsentGranted={handleConsentGranted}
          onConsentChecked={handleConsentChecked}
          onClose={logOut}
        />
      </Suspense>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-theme text-theme overflow-hidden selection:bg-[var(--color-primary)]/20 touch-none pointer-events-auto">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-[var(--color-primary)] text-white px-4 py-2 rounded-full font-bold"
      >
        Skip to main content
      </a>
      <OfflineIndicator />
      
      {/* Global Loading Bar */}
      <AnimatePresence>
        {(isGeneratingSBAR || authLoading) && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 via-indigo-500 to-teal-400 z-[100] origin-left"
          />
        )}
      </AnimatePresence>

      {/* Navigation (Sidebar Desktop / Bottom Bar Mobile) */}
      <AppNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.location.hash = tab;
        }}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 flex flex-col min-w-0 h-full relative pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 pointer-events-auto touch-auto"
      >
        {/* Top Header */}
        <header className="sticky top-0 z-50 bg-theme/80 backdrop-blur-3xl border-b border-surface px-6 md:px-10 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight capitalize text-theme">
              {activeTab === "profile"
                ? "Profile"
                : activeTab === "specialist"
                  ? "Specialist Lounge"
                  : activeTab === "sbar"
                    ? "SBAR Summary"
                    : activeTab === "settings"
                      ? "Settings"
                      : activeTab === "caremap"
                        ? "Localized Care Map"
                        : activeTab === "calendar"
                          ? "Calendar Sync"
                          : activeTab === "medications"
                            ? "Pharmacy"
                        : activeTab === "reports"
                          ? "Lab Reports"
                          : activeTab === "trends"
                            ? "Trends"
                            : activeTab === "upload"
                              ? "Ingest"
                              : activeTab === "home"
                                ? "Home"
                                : activeTab}
            </h1>
            {user && activeProfile && (
              <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-surface min-w-0">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)] shrink-0" />
                <span className="text-xs font-semibold text-theme tracking-wide truncate max-w-[80px] sm:max-w-none">
                  {activeProfile.name?.split(' ')[0] || 'User'}
                </span>
                <span className="hidden sm:inline text-[10px] text-muted ml-0.5 uppercase tracking-widest">
                  (Active)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search records..."
                className="pl-10 pr-4 py-2.5 bg-surface border-transparent rounded-[12px] text-sm md:w-56 focus:ring-1 focus:ring-[var(--color-primary)] transition-all placeholder-muted text-theme outline-none"
              />
            </div>
            <button aria-label="Search" className="md:hidden p-2 text-muted hover:text-theme bg-surface/50 rounded-full transition-colors relative">
              <Search className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                className="p-2 text-muted hover:text-theme bg-surface/50 rounded-full transition-colors relative focus:outline-none"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                aria-label={`View notifications. ${activeAlertsCount} unread.`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {activeAlertsCount > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-[var(--color-critical)] rounded-full border-2 border-theme"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 z-[60]">
                    <div
                      className="fixed inset-0 pointer-events-auto"
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <NotificationDropdown
                      onClose={() => setIsNotificationsOpen(false)}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
            {user ? (
              <div className="relative group ml-1">
                <div
                  className="w-10 h-10 rounded-[12px] bg-[var(--color-primary)] flex items-center justify-center font-bold text-white text-sm cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowLogout(!showLogout)}
                  title="Profile Action"
                >
                  {user.email?.[0]?.toUpperCase() || "U"}
                </div>
                {showLogout && (
                  <div className="absolute top-12 right-0 bg-theme border border-surface rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 text-xs text-muted border-b border-surface">
                      {user.email}
                    </div>
                    <button
                      onClick={logOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-surface transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signIn}
                disabled={isSigningIn}
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 text-white rounded-[12px] text-sm font-semibold transition-all shadow-sm ml-1 disabled:cursor-not-allowed"
              >
                {isSigningIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{isSigningIn ? "Signing In..." : "Sign In"}</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content View */}
        <div className="flex-1 overflow-y-auto w-full">
          <ErrorBoundary>
            <Suspense fallback={<Fallback />}>
              {user && isConsentGranted === true && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-[1200px] mx-auto w-full h-full p-6 md:p-10 pb-32"
                  >
                    {activeTab === "home" && (
                      <SectionErrorBoundary sectionName="Dashboard">
                        <div className="space-y-6">
                          <div className="flex items-center justify-end gap-3 mb-6">
                            <button
                              onClick={async () => {
                                if (activeProfile) {
                                  setIsSBAROpen(true);
                                  setSbarError(null);
                                }
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface/80 rounded-[12px] text-xs font-semibold transition-colors"
                            >
                              <FileText className="w-4 h-4 text-muted" /> Handover
                              Report
                            </button>
                            <button
                              onClick={() => setIsChatOpen(true)}
                              aria-label="Consult AI"
                              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 rounded-[12px] text-xs font-semibold transition-colors"
                            >
                              <Sparkles className="w-4 h-4" /> 
                              <span className="hidden sm:inline">Consult AI</span>
                            </button>
                          </div>
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          >
                            <Dashboard
                              onOpenChat={() => setIsChatOpen(true)}
                              onUploadClick={() => {
                                setActiveTab("upload");
                                window.location.hash = "upload";
                              }}
                            />
                          </motion.div>
                        </div>
                      </SectionErrorBoundary>
                    )}
                    {activeTab === "reports" && (
                      <SectionErrorBoundary sectionName="Reports">
                        <LabReportsSection
                          onOpenChat={() => setIsChatOpen(true)}
                          onNavigateToUpload={() => {
                            setActiveTab("upload");
                            window.location.hash = "upload";
                          }}
                        />
                      </SectionErrorBoundary>
                    )}
                    {activeTab === "upload" && (
                      <SectionErrorBoundary sectionName="Upload Center">
                        <UploadCenter onOpenChat={() => setIsChatOpen(true)} />
                      </SectionErrorBoundary>
                    )}
                    {activeTab === "trends" && (
                      <SectionErrorBoundary sectionName="Timeline">
                        <Timeline />
                      </SectionErrorBoundary>
                    )}
                    {activeTab === "specialist" && (
                      <SectionErrorBoundary sectionName="Specialist Lounge">
                        <SpecialistLounge />
                      </SectionErrorBoundary>
                    )}
                    {activeTab === "caremap" && (
                      <SectionErrorBoundary sectionName="Care Map">
                        <CareMap />
                      </SectionErrorBoundary>
                    )}
                    {activeTab === "calendar" && (
                      <SectionErrorBoundary sectionName="Calendar Sync">
                        <CalendarSync />
                      </SectionErrorBoundary>
                    )}
                    {activeTab === "medications" && (
                      <SectionErrorBoundary sectionName="Pharmacy">
                        <Medications onOpenChat={() => setIsChatOpen(true)} />
                      </SectionErrorBoundary>
                    )}
                    {activeTab === "profile" && (
                      <SectionErrorBoundary sectionName="Profile">
                        <ProfileManagement />
                      </SectionErrorBoundary>
                    )}
                    {activeTab === "settings" && (
                      <SectionErrorBoundary sectionName="Settings">
                        <SettingsPage />
                      </SectionErrorBoundary>
                    )}
                    {activeTab === "family" && (
                      <SectionErrorBoundary sectionName="Family Hub">
                        <FamilyHub />
                      </SectionErrorBoundary>
                    )}
                    {(() => {
                      if (activeTab === "admin") {
                        if (import.meta.env.DEV) console.log("[Admin] user email:", user?.email);
                      }
                      return activeTab === "admin" && user?.email === "dhurianiket@gmail.com" && (
                        <SectionErrorBoundary sectionName="Admin">
                          <AdminDashboard />
                        </SectionErrorBoundary>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>
              )}
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Floating Modals & Chat */}
        <AnimatePresence>
          {isNewProfileModaOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
              role="presentation"
              onClick={(e) => {
                if (e.target === e.currentTarget)
                  setIsNewProfileModaOpen(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="glass-card p-6 md:p-8 max-w-md w-full border border-surface shadow-2xl relative bg-theme"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title-new-profile"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3
                    id="modal-title-new-profile"
                    className="text-xl font-bold"
                  >
                    Create Profile
                  </h3>
                  <button
                    onClick={() => setIsNewProfileModaOpen(false)}
                    className="p-2 text-muted hover:text-theme bg-surface/50 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleCreateProfile}>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Profile Name
                  </label>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className={`w-full bg-surface border ${profileError ? "border-[var(--color-critical)]" : "border-surface"} rounded-[16px] px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all mb-2`}
                    placeholder="e.g. John's Health"
                    autoFocus
                  />
                  {profileError && (
                    <p className="text-[var(--color-critical)] text-xs mb-4 ml-1">
                      {profileError}
                    </p>
                  )}
                  <div
                    className={`flex justify-end gap-3 ${profileError ? "" : "mt-8"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setIsNewProfileModaOpen(false)}
                      className="px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-full text-sm font-semibold transition-transform active:scale-95 shadow-sm"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isNotificationCenterOpen && (
            <Suspense fallback={<Fallback />}>
              <NotificationCenter
                alerts={alerts}
                dismissedIds={dismissedIds}
                onDismiss={dismissAlert}
                onAction={(id: string) => {
                  const alert = alerts.find(a => a.id === id);
                  if (alert) {
                    if (alert.type === "medication") setActiveTab("medications");
                    else if (alert.type === "lab_value" || alert.type === "goal") setActiveTab("reports");
                    else if (alert.type === "appointment") setActiveTab("specialist"); 
                    else setActiveTab("home");
                  }
                  dismissAlert(id);
                  setIsNotificationCenterOpen(false);
                }}
                onClose={() => setIsNotificationCenterOpen(false)}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isExportOpen && activeProfile && (
            <Suspense fallback={<Fallback />}>
              <ExportModal
                onClose={() => setIsExportOpen(false)}
                healthContext={{
                  userName: activeProfile.name || "User",
                  healthScore: 85, // Stub
                  topFlags: ["Elevated HbA1c", "High LDL"], // Stub
                  medications: activeProfile.medications || [],
                  recentTrends: [
                    { marker: "HbA1c", value: 6.2, unit: "%", direction: "up", date: new Date().toISOString() },
                    {
                      marker: "LDL",
                      value: 142,
                      unit: "mg/dL",
                      direction: "down",
                      date: new Date().toISOString()
                    },
                  ],
                  doctorNotes: activeProfile.doctorNotes || [],
                }}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(isSBAROpen || activeTab === "sbar") && activeProfile && (
            <Suspense fallback={<Fallback />}>
              <AIErrorBoundary
                key={sbarKey}
                onReset={() => setSbarKey((k) => k + 1)}
                fallbackMessage="Medical summary engine unavailable."
              >
                <SBARPreview
                  isOpen={true}
                  onClose={() => {
                    setIsSBAROpen(false);
                    if (activeTab === "sbar") {
                      setActiveTab("home");
                      window.location.hash = "home";
                    }
                  }}
                  sbar={sbarData}
                  isLoading={isGeneratingSBAR}
                  error={sbarError}
                />
              </AIErrorBoundary>
            </Suspense>
          )}
        </AnimatePresence>

        <Suspense fallback={<Fallback />}>
          <AIErrorBoundary
            key={chatKey}
            onReset={() => setChatKey((k) => k + 1)}
          >
            <ChatCoach
              externalOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              showTrigger={false}
            />
          </AIErrorBoundary>
        </Suspense>
        
        <Suspense fallback={null}>
          <FeedbackWidget />
        </Suspense>
      </main>
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [splashTimeout, setSplashTimeout] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplashTimeout(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = authLoading || splashTimeout;
  console.log("[ProtectedRoute] Render state:", { authLoading, splashTimeout, isLoading, hasUser: !!user });

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    console.warn("[ProtectedRoute] No user found and splash timeout completed! Redirecting back to /");
    return <Navigate to="/" replace />;
  }

  console.log("[ProtectedRoute] Authentication resolved and user exists! Rendering child components...");
  return <>{children}</>;
};

const PublicLandingPageRoute = () => {
  const { user, loading: authLoading } = useAuth();
  console.log("[PublicLandingPageRoute] Render state:", { authLoading, hasUser: !!user });

  if (authLoading) {
    return <SplashScreen />;
  }

  if (user) {
    console.log("[PublicLandingPageRoute] User found! Redirecting to /dashboard via <Navigate />");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("[PublicLandingPageRoute] No user found. Rendering LandingPage...");
  return <LandingPage />;
};

const PrivacyPolicy = lazy(() => import("./components/Legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./components/Legal/TermsOfService"));

const HowItWorks = lazy(() => import("./components/InfoPages/HowItWorks"));
const AboutUs = lazy(() => import("./components/InfoPages/AboutUs"));
const SecurityFirst = lazy(() => import("./components/InfoPages/SecurityFirst"));
const BlogHbA1c = lazy(() => import("./components/InfoPages/BlogHbA1c"));
const BlogCBC = lazy(() => import("./components/InfoPages/BlogCBC"));
const EngineeringPlaybook = lazy(() => import("./components/InfoPages/EngineeringPlaybook"));

const GlobalFallback = () => (
  <div className="flex h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-muted)]">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<GlobalFallback />}>
      <Routes>
        <Route path="/" element={<PublicLandingPageRoute />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/how-it-works.html" element={<HowItWorks />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/about.html" element={<AboutUs />} />
        <Route path="/security" element={<SecurityFirst />} />
        <Route path="/security.html" element={<SecurityFirst />} />
        <Route path="/blog-hba1c" element={<BlogHbA1c />} />
        <Route path="/blog-hba1c.html" element={<BlogHbA1c />} />
        <Route path="/blog-cbc" element={<BlogCBC />} />
        <Route path="/blog-cbc.html" element={<BlogCBC />} />
        <Route path="/engineering-playbook" element={<EngineeringPlaybook />} />
        <Route path="/engineering-playbook.html" element={<EngineeringPlaybook />} />

        <Route path="/dashboard" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}
