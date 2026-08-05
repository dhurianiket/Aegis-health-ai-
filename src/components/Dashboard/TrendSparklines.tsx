import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";
import { motion } from "motion/react";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LabResult } from "../../types/medical";
import { parseSafeTimestamp } from "../../utils/dateUtils";

interface TrendSparklinesProps {
  labs: LabResult[];
}

function TrendSparklines({ labs }: TrendSparklinesProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
        // Sanitize and filter out invalid values first
        const validResults = results.map(r => ({
          ...r,
          numericValue: parseFloat(String(r.value).replace(/[^0-9.-]/g, '')),
          timestamp: parseSafeTimestamp(r.date)
        })).filter(r => !isNaN(r.numericValue) && r.numericValue !== null && r.timestamp !== null);

        // Sort chronologically
        const sorted = validResults.sort((a, b) => {
          return a.timestamp!.getTime() - b.timestamp!.getTime();
        });
        
        return {
          name,
          data: sorted.map((s) => ({ value: s.numericValue, date: s.timestamp!.toLocaleDateString() })),
          latest: sorted.length > 0 ? { ...sorted[sorted.length - 1], value: sorted[sorted.length - 1].numericValue } : null as any,
          previous: sorted.length > 1 ? { ...sorted[sorted.length - 2], value: sorted[sorted.length - 2].numericValue } : null,
          count: sorted.length,
        };
      })
      .filter((item) => item.count > 1) // Need at least 2 points for a trend
      .sort((a, b) => b.count - a.count) // Prioritize markers with more data
      .slice(0, 4); // Take top 4

    return processed;
  }, [labs]);

  if (sparklinesData.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-[32px] shadow-md dark:shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-xl">
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 tracking-tight">
            Key Biomarkers
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
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
              className="bg-slate-100 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-sm"
            >
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider truncate">
                {item.name}
              </h4>
              <div className="flex items-end justify-between mt-2">
                <span
                  className={`text-2xl font-extrabold tracking-tight ${isCritical ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}
                >
                  {item.latest.value}
                </span>
                {item.previous && (
                  <div
                    className={`flex items-center text-xs font-bold ${isUp ? "text-red-600 dark:text-red-400" : isDown ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}
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
              <div className="w-full h-[40px] min-h-[40px] mt-3" ref={containerRef}>
                {containerWidth > 0 && (
                  <ResponsiveContainer width="100%" height={40} minWidth={0} debounce={50}>
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
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(TrendSparklines);
