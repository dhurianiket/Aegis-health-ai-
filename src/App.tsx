import React, { useState, Suspense, lazy, useEffect } from 'react';
import { 
  Activity, 
  Upload, 
  Calendar, 
  FileText, 
  Stethoscope, 
  Settings, 
  Bell, 
  Search,
  ChevronRight,
  Plus,
  Menu,
  X,
  LogIn,
  LogOut,
  Users,
  Pill,
  Handshake,
  Loader2,
  Key,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './context/AuthContext';
import { useProfile } from './context/ProfileContext';
import { useAlerts } from './context/AlertsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AIErrorBoundary } from './components/ui/AIErrorBoundary';
import ConsentScreen from './components/Onboarding/ConsentScreen';
import NotificationDropdown from './components/Header/NotificationDropdown';
import OfflineIndicator from './components/OfflineIndicator';
import { UserProfile } from './types/medical';
const SBARPreview = lazy(() => import('./components/Export/SBARPreview'));
const ExportModal = lazy(() => import('./components/Export/ExportModal'));
const ChatCoach = lazy(() => import('./components/AIHelper/ChatCoach'));
const NotificationCenter = lazy(() => import('./components/Notifications/NotificationCenter'));
const IntegrationsPanel = lazy(() => import('./components/Settings/IntegrationsPanel'));
const SharedProfile = lazy(() => import('./components/Export/SharedProfile'));
import { MessageSquare } from 'lucide-react';
import { generateSBAR } from './services/sbarGenerationService';

import { validateProfileName } from './lib/validation';
import { logger } from './lib/logger';

declare global {
  interface Window {
    aistudio?: {
      openSelectKey?: () => Promise<void>;
      hasSelectedApiKey?: () => Promise<boolean>;
    };
  }
}

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const UploadCenter = lazy(() => import('./components/Upload/UploadCenter'));
const Timeline = lazy(() => import('./components/Timeline/Timeline'));
const SpecialistLounge = lazy(() => import('./components/Specialists/SpecialistLounge'));
const Medications = lazy(() => import('./components/Medications/Medications'));
const ProfileManagement = lazy(() => import('./components/Profile/ProfileManagement'));
const FamilyHub = lazy(() => import('./components/Profile/FamilyHub'));

// Loading Fallback
const Fallback = () => (
  <div className="flex h-full items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signIn, logOut } = useAuth();
  const { profiles, activeProfile, setActiveProfile, createProfile } = useProfile();
  const { alerts, dismissedIds, dismissAlert, unreadCount } = useAlerts();
  const [isNewProfileModaOpen, setIsNewProfileModaOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileToSwitch, setProfileToSwitch] = useState<UserProfile | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isConsentGranted, setIsConsentGranted] = useState<boolean | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isSBAROpen, setIsSBAROpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sbarText, setSbarText] = useState('');
  const [isGeneratingSBAR, setIsGeneratingSBAR] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSharingOpen, setIsSharingOpen] = useState(false);
  const [sbarKey, setSbarKey] = useState(0);
  const [chatKey, setChatKey] = useState(0);

  // Check for shared profile in URL
  const searchParams = new URLSearchParams(window.location.search);
  const shareId = searchParams.get('share');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isNewProfileModaOpen) setIsNewProfileModaOpen(false);
        if (profileToSwitch) setProfileToSwitch(null);
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        if (isNotificationsOpen) setIsNotificationsOpen(false);
        if (isSBAROpen) setIsSBAROpen(false);
        if (isExportOpen) setIsExportOpen(false);
        if (isChatOpen) setIsChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewProfileModaOpen, profileToSwitch, isMobileMenuOpen, isNotificationsOpen, isSBAROpen, isExportOpen, isChatOpen]);

  if (shareId) {
    return (
      <Suspense fallback={<Fallback />}>
        <SharedProfile shareId={shareId} />
      </Suspense>
    );
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    
    const validation = validateProfileName(newProfileName);
    if (!validation.isValid) {
      setProfileError(validation.error || 'Invalid name');
      return;
    }
    
    try {
      await createProfile(newProfileName.trim());
      setIsNewProfileModaOpen(false);
      setNewProfileName('');
    } catch (e: unknown) {
      logger.error(e as Error);
      setProfileError('Failed to create profile. Please try again.');
    }
  };

  const activeAlertsCount = unreadCount;

  const tabs = [
    { id: 'dashboard', label: 'Telemetry', icon: Activity },
    { id: 'upload', label: 'Ingestion', icon: Upload },
    { id: 'meds', label: 'Pharmacy', icon: Pill },
    { id: 'timeline', label: 'Analytics', icon: Calendar },
    { id: 'family', label: 'Family Vault', icon: Handshake },
    { id: 'specialists', label: 'Specialists', icon: Stethoscope },
    { id: 'profiles', label: 'Profile Mgmt', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-100 overflow-hidden relative selection:bg-indigo-500/30 selection:text-white">
      <OfflineIndicator />
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:relative z-50 h-full ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } border-r border-white/10 bg-[#0F172A] md:bg-black/20 transition-all duration-300 flex flex-col shrink-0`}
      >
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Activity className="text-white w-6 h-6" />
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="font-bold text-xl tracking-tight">
                AURA <span className="text-indigo-400 font-light text-sm hidden sm:inline">INTELLIGENCE</span>
              </span>
            )}
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto" aria-label="Main Navigation">
          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  aria-label={`Go to ${tab.label}`}
                  title={tab.label}
                  data-nav={tab.id === 'meds' ? 'medications' : tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                    activeTab === tab.id 
                    ? 'bg-white/10 text-white border border-white/10 shadow-lg' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5 min-w-[20px]" />
                  {(isSidebarOpen || isMobileMenuOpen) && <span className="font-medium text-sm text-left truncate">{tab.label}</span>}
                  {activeTab === tab.id && (isSidebarOpen || isMobileMenuOpen) && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="ml-auto w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => setActiveTab('settings')}
            data-nav="settings"
            className={`flex items-center gap-4 w-full p-3 transition-all rounded-xl ${
              activeTab === 'settings' 
              ? 'bg-white/10 text-white' 
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 min-w-[20px]" />
            {(isSidebarOpen || isMobileMenuOpen) && <span className="font-medium text-sm">Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative w-full h-full flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold capitalize tracking-tight text-white">{activeTab}</h1>
              <div className="flex items-center gap-2 md:gap-3 mt-1">
                <span className="px-2 py-0.5 bg-white/10 rounded-full text-[8px] md:text-[10px] font-medium border border-white/10 text-slate-400 uppercase tracking-widest hidden sm:inline-block">HIPAA SECURE</span>
                {user && activeProfile && (
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[11px] font-bold text-indigo-300 hover:bg-indigo-500/20 transition-colors uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.15)] relative overflow-hidden">
                      <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      <Users className="w-3.5 h-3.5" />
                      <span className="max-w-[100px] truncate">{activeProfile.name}</span>
                    </button>
                    <div className="absolute left-0 top-full mt-2 w-52 bg-slate-800 border border-white/10 rounded-xl shadow-xl py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                      <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1 flex items-center justify-between">
                        <span>Select Profile</span>
                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded">{profiles.length}</span>
                      </div>
                      {profiles.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            if (p.id !== activeProfile.id) {
                              setProfileToSwitch(p);
                            }
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                            activeProfile.id === p.id 
                              ? 'bg-indigo-500/10 font-bold text-indigo-400 border-l-2 border-indigo-400' 
                              : 'text-white hover:bg-white/5 border-l-2 border-transparent'
                          }`}
                        >
                          <span className="truncate pr-2">{p.name}</span>
                          {activeProfile.id === p.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                        </button>
                      ))}
                      <button
                        onClick={() => setIsNewProfileModaOpen(true)}
                        className="w-full text-left px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 border-t border-white/5 mt-1 pt-3"
                      >
                        <Plus className="w-4 h-4" /> New Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm w-48 lg:w-64 focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder-slate-500"
              />
            </div>
            <button className="md:hidden p-2 text-slate-400 hover:text-indigo-400 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-slate-400 hover:text-indigo-400 transition-colors relative"
              onClick={async () => {
                if (window.aistudio?.openSelectKey) {
                  await window.aistudio.openSelectKey();
                }
              }}
              title="Set custom Gemini API Key"
            >
              <Key className="w-5 h-5" />
            </button>
            <div className="relative">
              <button 
                className="p-2 text-slate-400 hover:text-indigo-400 transition-colors relative focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                aria-label={`View notifications. ${activeAlertsCount} unread.`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {activeAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0F172A]"></span>
                )}
              </button>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 z-50">
                    <div 
                      className="fixed inset-0" 
                      onClick={() => setIsNotificationsOpen(false)} 
                    />
                    <NotificationDropdown onClose={() => setIsNotificationsOpen(false)} />
                  </div>
                )}
              </AnimatePresence>
            </div>
            {user ? (
              <div 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white/20 flex items-center justify-center font-bold text-white shadow-lg text-xs md:text-sm shrink-0 uppercase cursor-pointer relative group"
                onClick={logOut}
                title="Log Out"
              >
                {user.email?.[0] || 'U'}
                <div className="absolute top-12 right-0 bg-white/10 backdrop-blur-xl border border-white/10 p-2 rounded-xl text-xs font-medium text-white shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                  Click to log out
                </div>
              </div>
            ) : (
              <button 
                onClick={signIn}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 p-4 md:p-8 pb-24 w-full">
          <ErrorBoundary>
            <Suspense fallback={<Fallback />}>
              {user && isConsentGranted === true && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {activeTab === 'dashboard' && (
                      <div className="space-y-6">
                         <div className="flex items-center justify-end gap-3 mb-4">
                            <button 
                              onClick={async () => {
                                if (activeProfile) {
                                  try {
                                    setIsSBAROpen(true);
                                    setIsGeneratingSBAR(true);
                                    const text = await generateSBAR(
                                      activeProfile, 
                                      activeProfile.labValues || [], 
                                      activeProfile.medications || []
                                    );
                                    setSbarText(text);
                                  } catch (error) {
                                    logger.error('SBAR Trigger Error:', error as Error);
                                  } finally {
                                    setIsGeneratingSBAR(false);
                                  }
                                }
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/5 transition-all"
                            >
                              <FileText className="w-4 h-4" /> Physician SBAR
                            </button>
                            <button 
                              onClick={() => setIsChatOpen(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-widest border border-indigo-500/10 transition-all shadow-lg shadow-indigo-500/5"
                            >
                              <Sparkles className="w-4 h-4" /> Consult AURA
                            </button>
                            <button 
                              onClick={() => setIsExportOpen(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-widest border border-emerald-500/10 transition-all shadow-lg shadow-emerald-500/5"
                            >
                              <Upload className="w-4 h-4" /> PDF Report
                            </button>
                         </div>
                         <Dashboard onOpenChat={() => setIsChatOpen(true)} />
                      </div>
                    )}
                    {activeTab === 'upload' && <UploadCenter onOpenChat={() => setIsChatOpen(true)} />}
                    {activeTab === 'timeline' && <Timeline />}
                    {activeTab === 'specialists' && <SpecialistLounge />}
                    {activeTab === 'meds' && <Medications onOpenChat={() => setIsChatOpen(true)} />}
                    {activeTab === 'profiles' && <ProfileManagement />}
                    {activeTab === 'family' && <FamilyHub />}
                    {activeTab === 'settings' && user && activeProfile && (
                       <div className="max-w-4xl mx-auto space-y-12">
                          <section className="space-y-6">
                             <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Integrations & Data</h2>
                             <IntegrationsPanel activeProfile={activeProfile} />
                          </section>
                       </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
              {user && isConsentGranted === null && <Fallback />}
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Global Action Button - Speed Dial Style */}
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex flex-col items-center gap-4">
          <button 
            aria-label="Ask Aura AI"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all border border-white/10 ${
              isChatOpen ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30'
            }`}
          >
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <button 
            aria-label="Upload New Document"
            onClick={() => setActiveTab('upload')}
            className="w-14 h-14 md:w-16 md:h-16 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border border-white/10"
          >
            <Plus className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <AnimatePresence>
          {isNewProfileModaOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              role="presentation"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsNewProfileModaOpen(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full border border-white/10 shadow-2xl relative"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title-new-profile"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 id="modal-title-new-profile" className="text-xl font-bold text-white">Create New Profile</h3>
                  <button onClick={() => setIsNewProfileModaOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-full"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleCreateProfile}>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Profile Name (e.g. John, Mom's Records)</label>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)}
                    className={`w-full bg-black/20 border ${profileError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2`}
                    placeholder="Enter name..."
                    autoFocus
                  />
                  {profileError && (
                    <p className="text-red-400 text-xs mb-4">{profileError}</p>
                  )}
                  <div className={`flex justify-end gap-3 ${profileError ? '' : 'mt-6'}`}>
                    <button type="button" onClick={() => setIsNewProfileModaOpen(false)} className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 transition-colors font-medium">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium shadow-lg shadow-indigo-500/20">Create Profile</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Switch Profile Confirmation Modal */}
        <AnimatePresence>
          {profileToSwitch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              role="presentation"
              onClick={(e) => {
                if (e.target === e.currentTarget) setProfileToSwitch(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-[#0F172A] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title-switch-profile"
              >
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <h3 id="modal-title-switch-profile" className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    Switch Profile
                  </h3>
                  <button onClick={() => setProfileToSwitch(null)} className="p-1 text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5"/>
                  </button>
                </div>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed relative z-10">
                  Are you sure you want to switch to <span className="font-bold text-indigo-400">{profileToSwitch.name}</span>? 
                  You will view health records associated with this profile.
                </p>
                <div className="flex gap-3 justify-end relative z-10">
                  <button
                    onClick={() => setProfileToSwitch(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setActiveProfile(profileToSwitch);
                      setProfileToSwitch(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Switch Profile
                  </button>
                </div>
                {/* Decorative background blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full" />
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
                   console.log("Action on", id);
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
                  userName: activeProfile.name || 'User',
                  healthScore: 85, // Stub
                  topFlags: ['Elevated HbA1c', 'High LDL'], // Stub
                  medications: activeProfile.medications || [],
                  recentTrends: [
                     { marker: 'HbA1c', value: 6.2, unit: '%', direction: 'up' },
                     { marker: 'LDL', value: 142, unit: 'mg/dL', direction: 'down' }
                  ],
                  doctorNotes: activeProfile.doctorNotes || []
                }}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSBAROpen && activeProfile && (
            <Suspense fallback={<Fallback />}>
              <AIErrorBoundary 
                key={sbarKey}
                onReset={() => setSbarKey(k => k + 1)}
                fallbackMessage="The medical summary engine is taking a break. Please try again in a moment."
              >
                <SBARPreview 
                  onClose={() => {
                    setIsSBAROpen(false);
                    setSbarText('');
                  }}
                  sbarText={sbarText}
                  isLoading={isGeneratingSBAR}
                />
              </AIErrorBoundary>
            </Suspense>
          )}
        </AnimatePresence>

        <Suspense fallback={<Fallback />}>
          <AIErrorBoundary 
            key={chatKey}
            onReset={() => setChatKey(k => k + 1)}
          >
            <ChatCoach 
              externalOpen={isChatOpen} 
              onClose={() => setIsChatOpen(false)} 
              showTrigger={false} 
            />
          </AIErrorBoundary>
        </Suspense>
      </main>

      {/* Consent Blocking Overlay */}
      {user && (isConsentGranted === false || isConsentGranted === null) && (
        <ConsentScreen 
          userId={user.uid} 
          onConsentGranted={() => setIsConsentGranted(true)} 
          onConsentChecked={(exists) => setIsConsentGranted(exists)}
        />
      )}
    </div>
  );
}
