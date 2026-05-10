import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";
import { motion } from "motion/react";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LabResult } from "../../types/medical";

interface TrendSparklinesProps {
  labs: LabResult[];
}

export default function TrendSparklines({ labs }: TrendSparklinesProps) {
  const sparklinesData = useMemo(() => {
    const byMarker: Record<string, LabResult[]> = {};
    labs.forEach((lab) => {
      const name = lab.markerName
        ? lab.markerName.trim().toUpperCase()
        : "UNKNOWN";
      if (!byMarker[name]) byMarker[name] = [];
      byMarker[name].push(lab);
    });

    const processed = Object.entries(byMarker)
      .map(([name, results]) => {
        // Sort chronologically
        const sorted = results.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        return {
          name,
          data: sorted.map((s) => ({ value: s.value, date: s.date })),
          latest: sorted[sorted.length - 1],
          previous: sorted.length > 1 ? sorted[sorted.length - 2] : null,
          count: sorted.length,
        };
      })
      .filter((item) => item.count > 1) // Need at least 2 points for a trend
      .sort((a, b) => b.count - a.count) // Prioritize markers with more data
      .slice(0, 4); // Take top 4

    return processed;
  }, [labs]);

  if (sparklinesData.length === 0) return null;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-xl">
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Key Biomarkers
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Recent trajectory overview
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sparklinesData.map((item, idx) => {
          const isUp = item.previous && item.latest.value > item.previous.value;
          const isDown =
            item.previous && item.latest.value < item.previous.value;
          const delta = item.previous
            ? item.latest.value - item.previous.value
            : 0;
          const isCritical =
            item.latest.status === "critical" ||
            item.latest.status === "abnormal";

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/50 rounded-2xl p-4 border border-white/5"
            >
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                {item.name}
              </h4>
              <div className="flex items-end justify-between mt-2">
                <span
                  className={`text-xl font-light tracking-tight ${isCritical ? "text-amber-400" : "text-white"}`}
                >
                  {item.latest.value}
                </span>
                {item.previous && (
                  <div
                    className={`flex items-center text-[10px] font-bold ${isUp ? "text-red-400" : isDown ? "text-emerald-400" : "text-slate-500"}`}
                  >
                    {isUp ? (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    ) : isDown ? (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    ) : (
                      <Minus className="w-3 h-3 mr-0.5" />
                    )}
                    {Math.abs(delta).toFixed(1)}
                  </div>
                )}
              </div>
              <div className="h-10 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={item.data}>
                    <YAxis domain={["dataMin", "dataMax"]} hide />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={isCritical ? "#F59E0B" : "#3B82F6"}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
