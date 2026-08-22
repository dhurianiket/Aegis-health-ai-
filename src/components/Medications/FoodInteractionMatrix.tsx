import React, { useState } from 'react';
import { Apple, AlertTriangle, ShieldCheck, Info, Clock, Utensils, Filter } from 'lucide-react';
import {
  evaluateFoodInteractions,
  DetectedFoodInteraction,
} from '../../services/foodInteractionService';

interface FoodInteractionMatrixProps {
  activeMedications?: string[];
}

const DEFAULT_SAMPLE_MEDS = ['Atorvastatin 20mg', 'Lisinopril 10mg', 'Ciprofloxacin 500mg'];

export const FoodInteractionMatrix: React.FC<FoodInteractionMatrixProps> = ({
  activeMedications = DEFAULT_SAMPLE_MEDS,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const detectedInteractions: DetectedFoodInteraction[] = evaluateFoodInteractions(activeMedications);

  const filteredInteractions =
    selectedCategory === 'all'
      ? detectedInteractions
      : detectedInteractions.filter((i) => i.foodCategory === selectedCategory);

  const getSeverityBadge = (sev: 'critical' | 'warning' | 'info') => {
    if (sev === 'critical') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 shrink-0 glow-rose-3d">
          <AlertTriangle className="w-3.5 h-3.5" /> Critical Severe
        </span>
      );
    }
    if (sev === 'warning') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5" /> Moderate Risk
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 shrink-0">
        <Info className="w-3.5 h-3.5" /> Dietary Timing
      </span>
    );
  };

  return (
    <div className="w-full glass-card-ultra-3d p-5 sm:p-7 md:p-8 space-y-6 relative overflow-hidden">
      {/* Ambient Lighting Glow */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 glow-rose-3d shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">Food-Drug Contraindication Matrix</h3>
              <span className="px-3 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-[11px] font-bold">
                Pharmacology Safety
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light mt-1">
              Identifies dietary & herbal contraindications for active prescription regimens
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <Filter className="w-4 h-4 text-rose-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto bg-slate-950 border border-white/20 text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-rose-400 cursor-pointer min-h-[44px]"
          >
            <option value="all">All Food Categories ({detectedInteractions.length})</option>
            <option value="Citrus">Citrus & Grapefruit</option>
            <option value="Dairy">Dairy & Milk</option>
            <option value="Leafy Greens">Leafy Greens (Palak/Methi)</option>
            <option value="Potassium-Rich">Potassium (Bananas/Coconut)</option>
            <option value="Beverages">Tea & Coffee</option>
          </select>
        </div>
      </div>

      {/* Detected Contraindications List */}
      {filteredInteractions.length === 0 ? (
        <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-6 text-center space-y-2 relative z-10">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Active Food-Drug Contraindications</h4>
          <p className="text-xs text-slate-400 font-light">
            No dangerous dietary interactions detected for your active prescription list.
          </p>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          {filteredInteractions.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/85 border border-white/10 hover:border-rose-500/40 rounded-2xl p-4 sm:p-5 transition-all space-y-3.5 shadow-md hover:-translate-y-0.5"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-rose-300 font-mono text-xs font-bold">
                    {item.medicationName}
                  </div>
                  <span className="text-slate-500 text-xs font-mono">+</span>
                  <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                    {item.foodName}
                  </div>
                </div>

                <div>{getSeverityBadge(item.severity)}</div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Apple className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{item.headline}</span>
                </h4>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  <strong className="text-slate-200 font-semibold">Mechanism:</strong> {item.mechanism}
                </p>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  <strong className="text-rose-300 font-semibold">Clinical Impact:</strong> {item.clinicalImpact}
                </p>
              </div>

              {/* Timing Advice Banner */}
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-start sm:items-center gap-3 text-xs text-rose-200 font-medium">
                <Clock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                <span>{item.timingAdvice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
