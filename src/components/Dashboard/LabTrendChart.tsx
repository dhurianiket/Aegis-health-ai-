import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import ExportButton from "../ui/ExportButton";
import { getLabHistory } from "../../lib/firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { LabResult, LabStatus } from "../../types/medical";
import { AIErrorBoundary } from "../ui/AIErrorBoundary";

interface LabTrendChartProps {
  labs?: LabResult[];
}

export default function LabTrendChart({ labs }: LabTrendChartProps) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string>("");
  const [timeRange, setTimeRange] = useState<"3M" | "6M" | "1Y" | "ALL">("ALL");
  const [width, setWidth] = useState(window.innerWidth);
  const [chartKey, setChartKey] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isMobile = width < 768;

  useEffect(() => {
    async function fetchLabs() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        let results = labs;
        if (!results) {
          results = await getLabHistory(user.uid, undefined, activeProfile?.id);
        }
        if (results && results.length > 0) {
          const normalizedResults = results.map((r) => {
            const name = r.markerName ? r.markerName.trim() : "Unknown";
            const titleCaseName =
              name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            return {
              ...r,
              markerName: titleCaseName,
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
  }, [user, activeProfile, labs]);

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
    try {
      if (!selectedMarker) return [];

      const filtered = labResults
        .filter((r) => r.markerName === selectedMarker)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      // Filter by timeRange
      const now = new Date().getTime();
      let cutoff = 0;
      if (timeRange === "3M") cutoff = now - 90 * 24 * 60 * 60 * 1000;
      else if (timeRange === "6M") cutoff = now - 180 * 24 * 60 * 60 * 1000;
      else if (timeRange === "1Y") cutoff = now - 365 * 24 * 60 * 60 * 1000;

      const ranged = filtered.filter(
        (r) => new Date(r.date).getTime() >= cutoff,
      );

      return ranged.map((r) => {
        let refMin = undefined;
        let refMax = undefined;

        if (r.referenceRange) {
          const rangeMatch = r.referenceRange.match(
            /([0-9.]+)\s*-\s*([0-9.]+)/,
          );
          if (rangeMatch) {
            refMin = parseFloat(rangeMatch[1]);
            refMax = parseFloat(rangeMatch[2]);
          }
        }

        return {
          timestamp: new Date(r.date).getTime(),
          date: new Date(r.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          value: r.value,
          unit: r.unit,
          refMin: !isNaN(refMin as number) ? refMin : undefined,
          refMax: !isNaN(refMax as number) ? refMax : undefined,
          refRangeArray:
            !isNaN(refMin as number) && !isNaN(refMax as number)
              ? [refMin, refMax]
              : undefined,
          referenceRange: r.referenceRange,
          status: r.status,
        };
      });
    } catch (error) {
      return [];
    }
  }, [labResults, selectedMarker, timeRange]);

  if (isLoading || labResults.length === 0) {
    return (
      <div className="glass-card p-6 h-[400px] flex items-center justify-center text-muted text-sm">
        {isLoading ? "Loading trends..." : "No laboratory data available yet."}
      </div>
    );
  }

  const latestDataPoint = chartData[chartData.length - 1];
  const firstDataPoint = chartData[0];

  let summarySentence = "Not enough data points for trend analysis.";
  if (latestDataPoint && firstDataPoint && chartData.length > 1) {
    const delta = latestDataPoint.value - firstDataPoint.value;
    const pct = ((delta / firstDataPoint.value) * 100).toFixed(1);
    const isUp = delta > 0;
    const statusColor =
      latestDataPoint.status === LabStatus.CRITICAL
        ? "text-[var(--color-critical)]"
        : latestDataPoint.status === LabStatus.ABNORMAL
          ? "text-[var(--color-warning)]"
          : "text-[var(--color-success)]";

    summarySentence = `${selectedMarker} ${isUp ? "increased" : "decreased"} ${Math.abs(Number(pct))}% over the period · Currently `;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl min-w-[150px]">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">
            {data.date}
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-white font-medium text-xl">{data.value}</p>
            <span className="text-white/50 text-xs font-normal">
              {data.unit}
            </span>
          </div>
          {data.referenceRange && (
            <p className="text-white/50 text-[10px] mt-1">
              Ref: {data.referenceRange}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const ChartComponent = isMobile ? BarChart : LineChart;

  return (
    <div className="glass-card p-6 sm:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="section-title mb-1">Trends</h3>
          {latestDataPoint && chartData.length > 1 ? (
            <div className="text-sm text-muted flex items-center gap-2">
              {summarySentence}
              <span
                className={`font-semibold ${latestDataPoint.status === LabStatus.CRITICAL ? "text-[var(--color-critical)]" : latestDataPoint.status === LabStatus.ABNORMAL ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}
              >
                {latestDataPoint.status || "NORMAL"}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted">Tracking over time</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedMarker}
            onChange={(e) => setSelectedMarker(e.target.value)}
            className="appearance-none bg-surface border-surface text-theme text-xs font-medium uppercase tracking-widest rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer shadow-sm transition-colors"
          >
            {uniqueMarkers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <div className="flex bg-surface rounded-xl p-0.5 border border-surface shadow-sm">
            {["3M", "6M", "1Y", "ALL"].map((tr) => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[10px] transition-colors ${timeRange === tr ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-muted hover:text-theme"}`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id="lab-trend-chart-container" ref={containerRef} className="h-[280px] w-full relative">
        <AIErrorBoundary
          key={chartKey}
          onReset={() => setChartKey((k) => k + 1)}
          fallbackMessage="Chart rendering failed."
        >
          {containerWidth > 0 && (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <ChartComponent
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
              <CartesianGrid
                strokeDasharray="0"
                vertical={false}
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                dy={10}
                minTickGap={20}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                domain={["auto", "auto"]}
                width={50}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "var(--color-surface)", opacity: 0.5 }}
              />

              <Area
                type="step"
                dataKey="refRangeArray"
                stroke={isMobile ? "var(--color-primary)" : "none"}
                strokeWidth={isMobile ? 1 : 0}
                strokeDasharray={isMobile ? "3 3" : "0"}
                fill="var(--color-primary)"
                fillOpacity={isMobile ? 0.03 : 0.08}
              />

              {isMobile ? (
                <Bar
                  dataKey="value"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: "var(--color-primary)",
                    stroke: "var(--color-bg)",
                    strokeWidth: 2,
                  }}
                  animationDuration={1000}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
          )}
        </AIErrorBoundary>
      </div>
    </div>
  );
}
