import React, { useState } from 'react';
import { Apple, AlertTriangle, ShieldCheck, Info, Clock, Utensils, Sparkles, Filter } from 'lucide-react';
import {
  evaluateFoodInteractions,
  DetectedFoodInteraction,
  FOOD_RULES,
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
        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Critical Severe
        </span>
      );
    }
    if (sev === 'warning') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Moderate Risk
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1">
        <Info className="w-3 h-3" /> Dietary Timing
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-rose-500/30 shadow-[0_16px_40px_-8px_rgba(244,63,94,0.2)] rounded-[32px] p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white tracking-wide">Food-Drug Contraindication Matrix</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-[10px] font-semibold">
                Pharmacology Safety
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light mt-0.5">
              Identifies dietary & herbal contraindications for active prescription regimens
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-white/20 text-slate-100 text-xs rounded-xl px-3 py-1.5 font-semibold focus:outline-none focus:border-rose-400 cursor-pointer"
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
        <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-6 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Active Food-Drug Contraindications</h4>
          <p className="text-xs text-slate-400">
            No dangerous dietary interactions detected for your active prescription list.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInteractions.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/80 border border-white/10 hover:border-rose-500/40 rounded-2xl p-4 md:p-5 transition-all space-y-3 shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-rose-300 font-mono text-xs font-bold">
                    {item.medicationName}
                  </div>
                  <span className="text-slate-500 text-xs font-mono">+</span>
                  <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                    {item.foodName}
                  </div>
                </div>

                <div>{getSeverityBadge(item.severity)}</div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Apple className="w-4 h-4 text-rose-400" />
                  {item.headline}
                </h4>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  <strong className="text-slate-200 font-semibold">Mechanism:</strong> {item.mechanism}
                </p>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  <strong className="text-rose-300 font-semibold">Clinical Impact:</strong> {item.clinicalImpact}
                </p>
              </div>

              {/* Timing Advice Banner */}
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-rose-200 font-medium">
                <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{item.timingAdvice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
