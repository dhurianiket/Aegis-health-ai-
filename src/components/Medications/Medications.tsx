import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { 
  Pill, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  History,
  Zap,
  Activity,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Medication, MedicationStatus } from '../../types/medical';
import { getMedications } from '../../lib/firebase/firestore';

export default function Medications({ onOpenChat }: { onOpenChat?: () => void }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'history'>('active');

  useEffect(() => {
    async function fetchMeds() {
      if (!user) {
        setMeds([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const fetchedMeds = await getMedications(user.uid, activeProfile?.id);
        setMeds(fetchedMeds || []);
      } catch (error) {
        console.error('Failed to fetch medications:', error);
        setMeds([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMeds();
  }, [user, activeProfile]);

  const filteredMeds = meds.filter(med => {
    if (activeFilter === 'active') return med.status === MedicationStatus.ACTIVE;
    if (activeFilter === 'history') return med.status === MedicationStatus.DISCONTINUED;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Pill className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Active Regimen</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-white">
                {meds.filter(m => m.status === MedicationStatus.ACTIVE).length}
              </span>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Meds</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Adherence Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-white">98%</span>
              <span className="text-emerald-400 text-[10px] font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +2%
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl flex items-center gap-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Next Scheduled</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-light text-white">8:00 PM</span>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Dose</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation & Search */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-[32px] shadow-2xl">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search meds..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder-slate-500 shadow-inner"
              />
            </div>
            
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveFilter('active')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                  activeFilter === 'active' 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Active List</span>
              </button>
              <button 
                onClick={() => setActiveFilter('history')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                  activeFilter === 'history' 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <History className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Archive</span>
              </button>
              <button 
                onClick={() => setActiveFilter('all')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                  activeFilter === 'all' 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Inventory</span>
              </button>
              {onOpenChat && (
                <button 
                  onClick={onOpenChat}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all mt-4 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Ask Aura about Meds</span>
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Medication List */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex items-center justify-center p-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px]">
                 <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : filteredMeds.length > 0 ? (
              filteredMeds.map((med, index) => (
                <motion.div
                  key={med.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="group relative bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[40px] shadow-2xl hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-[#0F172A] border border-white/10 flex items-center justify-center text-indigo-400 grow-0 shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
                      <Pill className="w-8 h-8" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">{med.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                          med.status === MedicationStatus.ACTIVE 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-white/5 text-slate-400 border-white/10'
                        }`}>
                          {med.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm font-light">{med.purpose || 'Prescription item'}</p>
                      
                      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{med.dosage}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{med.frequency}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 backdrop-blur-xl border border-dashed border-white/10 p-20 rounded-[40px] text-center">
                <Pill className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-medium text-sm">No medications found in this category.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
