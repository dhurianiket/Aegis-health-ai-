import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Calendar, Sparkles } from 'lucide-react';
import {
  computeBiomarkerTrajectory,
  BiomarkerTrajectory,
  HistoricalPoint,
} from '../../services/biomarkerTrajectoryService';

interface BiomarkerTrajectoryWidgetProps {
  labHistory?: {
    testName: string;
    unit: string;
    referenceLow?: number;
    referenceHigh?: number;
    history: HistoricalPoint[];
  }[];
}

const DEFAULT_SAMPLE_DATA = [
  {
    testName: 'HbA1c',
    unit: '%',
    referenceLow: 4.0,
    referenceHigh: 5.7,
    history: [
      { date: '2026-02-15', value: 5.4 },
      { date: '2026-05-10', value: 5.7 },
      { date: '2026-08-15', value: 6.1 },
    ],
  },
  {
    testName: 'LDL Cholesterol',
    unit: 'mg/dL',
    referenceLow: 50,
    referenceHigh: 100,
    history: [
      { date: '2026-02-15', value: 110 },
      { date: '2026-05-10', value: 124 },
      { date: '2026-08-15', value: 138 },
    ],
  },
  {
    testName: 'eGFR (Kidney Function)',
    unit: 'mL/min/1.73m2',
    referenceLow: 60,
    referenceHigh: 120,
    history: [
      { date: '2026-02-15', value: 92 },
      { date: '2026-05-10', value: 88 },
      { date: '2026-08-15', value: 84 },
    ],
  },
];

export const BiomarkerTrajectoryWidget: React.FC<BiomarkerTrajectoryWidgetProps> = ({
  labHistory = DEFAULT_SAMPLE_DATA,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeWindow, setActiveWindow] = useState<30 | 60 | 90>(90);

  const selectedItem = labHistory[selectedIndex] || DEFAULT_SAMPLE_DATA[0];

  const trajectory: BiomarkerTrajectory = computeBiomarkerTrajectory({
    testName: selectedItem.testName,
    unit: selectedItem.unit,
    referenceLow: selectedItem.referenceLow,
    referenceHigh: selectedItem.referenceHigh,
    history: selectedItem.history,
  });

  const getForecastVal = () => {
    if (activeWindow === 30) return trajectory.forecasts.d30;
    if (activeWindow === 60) return trajectory.forecasts.d60;
    return trajectory.forecasts.d90;
  };

  const forecast = getForecastVal();

  // Combine historical and projected data points for Recharts
  const chartData = [
    ...trajectory.historicalPoints.map((p) => ({
      date: p.date,
      historical: p.value,
      projected: undefined,
      type: 'Actual',
    })),
    ...trajectory.projectedPoints.slice(1).map((p) => ({
      date: p.date,
      historical: undefined,
      projected: p.value,
      type: 'Forecast',
    })),
  ];

  // Connect last historical point to first projected point
  if (chartData.length > 0 && trajectory.historicalPoints.length > 0) {
    const lastHistIdx = trajectory.historicalPoints.length - 1;
    chartData[lastHistIdx].projected = trajectory.historicalPoints[lastHistIdx].value;
  }

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/30 shadow-[0_16px_40px_-8px_rgba(99,102,241,0.25)] rounded-[32px] p-5 sm:p-7 md:p-8 space-y-6">
      {/* Header — Clean flex wrap for title & dropdown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)] shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">30-60-90 Day Biomarker Risk Trajectory</h3>
              <span className="px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] font-bold">
                Predictive AI Engine
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light mt-1">
              Exponential Moving Average (EMA) & Linear Regression Slope Forecasting
            </p>
          </div>
        </div>

        {/* Biomarker Dropdown Selector */}
        <select
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          className="w-full sm:w-auto bg-slate-950 border border-white/20 text-slate-100 font-bold text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-400 cursor-pointer min-h-[44px]"
        >
          {labHistory.map((item, idx) => (
            <option key={idx} value={idx}>
              {item.testName} ({item.unit})
            </option>
          ))}
        </select>
      </div>

      {/* Stats KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Baseline / Current */}
        <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Baseline</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">{trajectory.currentValue}</span>
            <span className="text-xs font-mono text-slate-400">{trajectory.unit}</span>
          </div>
        </div>

        {/* Forecast Value */}
        <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
            <span>+{activeWindow}-Day Projected</span>
            <span className="font-mono text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-200">
              {forecast.percentChangeFromBaseline > 0 ? `+${forecast.percentChangeFromBaseline}%` : `${forecast.percentChangeFromBaseline}%`}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-indigo-400">{forecast.projectedValue}</span>
            <span className="text-xs font-mono text-indigo-300">{trajectory.unit}</span>
          </div>
        </div>

        {/* Risk Badge */}
        <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trajectory Risk</span>
          <div className="mt-2 flex items-center gap-2">
            {forecast.riskLevel === 'critical' ? (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Critical Shift
              </span>
            ) : forecast.riskLevel === 'borderline' ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Borderline Drift
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Stable / Optimal
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Controls (30d / 60d / 90d) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <span className="text-slate-300 font-semibold flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-indigo-400" /> Forecast Horizon Window
        </span>
        <div className="w-full sm:w-auto flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-white/10 justify-center">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setActiveWindow(d as any)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-mono font-bold transition-all min-h-[36px] ${
                activeWindow === d
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              +{d}d
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Chart Container — Enforced h-[300px] Pixel Boundary */}
      <div className="w-full h-[300px] min-h-[300px] bg-slate-950/90 rounded-2xl p-3 sm:p-4 border border-white/10 relative overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#F8FAFC',
                fontSize: '12px',
              }}
            />
            {selectedItem.referenceHigh && (
              <ReferenceLine
                y={selectedItem.referenceHigh}
                stroke="#F43F5E"
                strokeDasharray="4 4"
                label={{ value: `Upper Ref: ${selectedItem.referenceHigh}`, fill: '#F43F5E', fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            {/* Historical Line */}
            <Line
              type="monotone"
              dataKey="historical"
              name="Actual Biomarker"
              stroke="#38BDF8"
              strokeWidth={3}
              dot={{ r: 5, fill: '#0284C7' }}
              connectNulls={true}
            />
            {/* Projected Line */}
            <Line
              type="monotone"
              dataKey="projected"
              name="AI Forecast"
              stroke="#818CF8"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#6366F1' }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Clinical Summary & Actions */}
      <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs">
        <div className="flex items-center gap-2 text-indigo-300 font-bold">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Clinical Recommendation & Guidance</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-light">{trajectory.summary}</p>
        <ul className="space-y-1.5 pt-1 text-slate-300 font-light">
          {trajectory.mitigationActions.map((act, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">•</span>
              <span>{act}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
