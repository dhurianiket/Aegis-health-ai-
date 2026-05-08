import React, { useState } from 'react';
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
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard/Dashboard';
import UploadCenter from './components/Upload/UploadCenter';
import Timeline from './components/Timeline/Timeline';
import SpecialistLounge from './components/Specialists/SpecialistLounge';
import Medications from './components/Medications/Medications';
import { useAuth } from './context/AuthContext';
import { useProfile } from './context/ProfileContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signIn, logOut } = useAuth();
  const { profiles, activeProfile, setActiveProfile, createProfile } = useProfile();
  const [isNewProfileModaOpen, setIsNewProfileModaOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    try {
      await createProfile(newProfileName.trim());
      setIsNewProfileModaOpen(false);
      setNewProfileName('');
    } catch (e) {
      console.error(e);
      alert('Failed to create profile');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'upload', label: 'Upload Reports', icon: Upload },
    { id: 'timeline', label: 'Medical History', icon: Calendar },
    { id: 'specialists', label: 'Specialist Panels', icon: Stethoscope },
    { id: 'meds', label: 'Medications', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-100 overflow-hidden relative">
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

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
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
          <button className="flex items-center gap-4 w-full p-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all">
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
                    <button className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white hover:bg-white/10 transition-colors uppercase tracking-widest">
                      <Users className="w-3 h-3" />
                      {activeProfile.name}
                    </button>
                    <div className="absolute left-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                      <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                        Select Profile
                      </div>
                      {profiles.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setActiveProfile(p)}
                          className={`w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors ${activeProfile.id === p.id ? 'bg-white/5 font-bold text-indigo-400' : ''}`}
                        >
                          {p.name}
                        </button>
                      ))}
                      <button
                        onClick={() => setIsNewProfileModaOpen(true)}
                        className="w-full text-left px-4 py-2 text-sm text-indigo-400 hover:bg-white/5 transition-colors flex items-center gap-2 border-t border-white/5 mt-1 pt-2"
                      >
                        <Plus className="w-3 h-3" /> New Profile
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
            <button className="hidden sm:block p-2 text-slate-400 hover:text-indigo-400 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0F172A]"></span>
            </button>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'upload' && <UploadCenter />}
              {activeTab === 'timeline' && <Timeline />}
              {activeTab === 'specialists' && <SpecialistLounge />}
              {activeTab === 'meds' && <Medications />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Action Button */}
        <button 
          onClick={() => setActiveTab('upload')}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-20 border border-white/10"
        >
          <Plus className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <AnimatePresence>
          {isNewProfileModaOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full border border-white/10 shadow-2xl relative"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Create New Profile</h3>
                  <button onClick={() => setIsNewProfileModaOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-full"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleCreateProfile}>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Profile Name (e.g. John, Mom's Records)</label>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
                    placeholder="Enter name..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setIsNewProfileModaOpen(false)} className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 transition-colors font-medium">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium shadow-lg shadow-indigo-500/20">Create Profile</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
