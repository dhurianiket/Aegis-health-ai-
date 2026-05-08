import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Activity, Loader2 } from "lucide-react";
import { getLabHistory } from "../../lib/firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { LabResult } from "../../types/medical";

export default function LabTrendChart() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string>("");

  useEffect(() => {
    async function fetchLabs() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const results = await getLabHistory(
          user.uid,
          undefined,
          activeProfile?.id,
        );
        if (results && results.length > 0) {
          // Normalize marker names to Title Case to group duplicates like 'hemoglobin' and 'Hemoglobin '
          const normalizedResults = results.map(r => {
            const name = r.markerName ? r.markerName.trim() : 'Unknown';
            const titleCaseName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            return {
              ...r,
              markerName: titleCaseName
            };
          });
          setLabResults(normalizedResults);
        } else {
          setLabResults([]);
        }
      } catch (error) {
        console.error("Failed to fetch lab history:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLabs();
  }, [user, activeProfile]);

  const uniqueMarkers = useMemo(() => {
    const markers = Array.from(
      new Set(labResults.map((r) => r.markerName).filter(Boolean)),
    );
    return markers.sort();
  }, [labResults]);

  useEffect(() => {
    if (
      uniqueMarkers.length > 0 &&
      (!selectedMarker || !uniqueMarkers.includes(selectedMarker))
    ) {
      setSelectedMarker(uniqueMarkers[0]);
    } else if (uniqueMarkers.length === 0 && selectedMarker) {
      setSelectedMarker("");
    }
  }, [uniqueMarkers, selectedMarker]);

  const chartData = useMemo(() => {
    if (!selectedMarker) return [];

    // Filter and sort by date ascending
    const filtered = labResults
      .filter((r) => r.markerName === selectedMarker)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filtered.map((r) => {
      // Parse reference range carefully
      let refMin = undefined;
      let refMax = undefined;

      if (r.referenceRange) {
        // Handle "10 - 20" or "10-20" format
        const rangeMatch = r.referenceRange.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
        if (rangeMatch) {
          refMin = parseFloat(rangeMatch[1]);
          refMax = parseFloat(rangeMatch[2]);
        }
      }

      return {
        date: new Date(r.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        value: r.value,
        unit: r.unit,
        refMin: !isNaN(refMin as number) ? refMin : undefined,
        refMax: !isNaN(refMax as number) ? refMax : undefined,
        referenceRange: r.referenceRange,
        status: r.status,
      };
    });
  }, [labResults, selectedMarker]);

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl h-[450px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (labResults.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl h-[450px] flex flex-col items-center justify-center text-center">
        <Activity className="w-12 h-12 text-slate-700 mb-4" />
        <p className="text-slate-500 font-medium text-sm">
          No laboratory data available yet for this profile.
        </p>
        <p className="text-slate-600 text-xs mt-2">
          Upload medical records to populate your health graph.
        </p>
      </div>
    );
  }

  const latestDataPoint = chartData[chartData.length - 1];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-xl min-w-[150px]">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
            {label}
          </p>
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${data.status === "critical" ? "bg-red-500" : data.status === "abnormal" ? "bg-amber-500" : "bg-emerald-500"}`}
            ></div>
            <div>
              <p className="text-white font-medium text-xl">
                {data.value}{" "}
                <span className="text-slate-500 text-xs font-normal">
                  {data.unit}
                </span>
              </p>
            </div>
          </div>
          {data.referenceRange && (
            <div className="mt-3 bg-white/5 rounded-lg p-2 border border-white/5">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                Ref Range
              </p>
              <p className="text-slate-300 text-xs mt-0.5">
                {data.referenceRange}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[32px] shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Biomarker Trends
          </h3>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Longitudinal tracking of specific lab values
          </p>
        </div>

        <div className="relative">
          <select
            value={selectedMarker}
            onChange={(e) => setSelectedMarker(e.target.value)}
            className="appearance-none bg-slate-800/80 hover:bg-slate-800 border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-indigo-500 cursor-pointer w-full sm:w-auto shadow-inner transition-colors"
          >
            {uniqueMarkers.map((m) => (
              <option key={m} value={m} className="bg-slate-900 text-white">
                {m}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full mt-4 bg-slate-900/40 rounded-2xl p-4 border border-white/5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            {chartData.length > 0 && chartData[0].refMax !== undefined && (
              <ReferenceLine
                y={chartData[0].refMax}
                stroke="#F87171"
                strokeWidth={1}
                strokeDasharray="3 3"
                strokeOpacity={0.8}
              ></ReferenceLine>
            )}
            {chartData.length > 0 && chartData[0].refMin !== undefined && (
              <ReferenceLine
                y={chartData[0].refMin}
                stroke="#60A5FA"
                strokeWidth={1}
                strokeDasharray="3 3"
                strokeOpacity={0.8}
              ></ReferenceLine>
            )}

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#64748B", fontWeight: 600 }}
              dy={10}
              minTickGap={20}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#64748B", fontWeight: 600 }}
              domain={["auto", "auto"]}
              width={60}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "rgba(255,255,255,0.1)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#818CF8"
              fill="url(#colorValue)"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const isCritical =
                  payload.status === "critical" ||
                  payload.status === "abnormal";
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="#1E293B"
                    stroke={isCritical ? "#EF4444" : "#818CF8"}
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={(props: any) => {
                const { cx, cy, payload } = props;
                const isCritical =
                  payload.status === "critical" ||
                  payload.status === "abnormal";
                return (
                  <circle
                    key={`active-dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={7}
                    fill={isCritical ? "#EF4444" : "#818CF8"}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {latestDataPoint && (
        <div className="grid grid-cols-2 mt-6 gap-4">
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 shadow-lg">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${latestDataPoint.status === "critical" ? "bg-red-500" : latestDataPoint.status === "abnormal" ? "bg-amber-500" : "bg-emerald-500"}`}
              ></span>
              Latest Value
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-light tracking-tight ${latestDataPoint.status === "critical" ? "text-red-400" : latestDataPoint.status === "abnormal" ? "text-amber-400" : "text-white"}`}
              >
                {latestDataPoint.value}
              </span>
              <span className="text-sm text-slate-500 font-medium">
                {latestDataPoint.unit}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {latestDataPoint.date}
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 shadow-lg">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Reference Range
            </p>
            {latestDataPoint.referenceRange ? (
              <p className="text-lg font-light tracking-tight text-slate-300 mt-1">
                {latestDataPoint.referenceRange}{" "}
                <span className="text-xs text-slate-500">
                  {latestDataPoint.unit &&
                  !latestDataPoint.referenceRange.includes(latestDataPoint.unit)
                    ? latestDataPoint.unit
                    : ""}
                </span>
              </p>
            ) : (
              <p className="text-slate-500 text-sm font-medium italic mt-2">
                Not available
              </p>
            )}
            {(latestDataPoint.refMin !== undefined ||
              latestDataPoint.refMax !== undefined) && (
              <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden flex relative">
                {/* Visual indicator of range */}
                <div
                  className="absolute inset-y-0 bg-emerald-500/50"
                  style={{ left: "25%", right: "25%" }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
