import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
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
import { getDocuments } from "../../lib/firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { LabResult } from "../../types/medical";
import { AIErrorBoundary } from "../ui/AIErrorBoundary";
import { ChevronDown } from "lucide-react";

interface LabTrendChartProps {
  labs?: any[];
  reports?: any[];
}

import { parseSafeTimestamp } from "../../utils/dateUtils";

export default function LabTrendChart({ labs, reports }: LabTrendChartProps) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [labResults, setLabResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string>("");
  const [timeRange, setTimeRange] = useState<"3M" | "6M" | "1Y" | "ALL">("ALL");
  const [width, setWidth] = useState(window.innerWidth);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
        let extractedValues: any[] = [];
        
        if (labs && labs.length > 0 && labs[0].history) {
           // Passed from Dashboard
           labs.forEach(l => {
              extractedValues.push(...l.history.map((h: any) => ({
                 ...h,
                 markerName: h.marker || h.testName || l.markerName,
                 actualDate: h.date || h.extractedDate || h.collection_date || null,
                 fallbackDate: h.docDate || new Date().toISOString()
              })));
           });
        } else if (reports && reports.length > 0) {
           // Passed from Reports
           reports.forEach(doc => {
              const obs = doc.extractedData?.lab_values || doc.extractedData?.observations || [];
              const docDateFallback = doc.extractedDate || doc.extractedData?.collection_date || doc.extractedData?.reportMetadata?.collectionDate || doc.date || doc.createdAt || new Date().toISOString();
              const safeDocDate = typeof docDateFallback === 'string' ? docDateFallback : docDateFallback?.toDate?.()?.toISOString() || new Date().toISOString();
              obs.forEach((o: any) => {
                 extractedValues.push({
                    ...o,
                    markerName: o.marker || o.testName || o.name || o.label,
                    actualDate: o.extractedDate || o.collection_date || o.date || null,
                    fallbackDate: safeDocDate
                 });
              });
           });
        } else {
           // Fetch from documents
           const docs = await getDocuments(user.uid, activeProfile?.id);
           (docs || []).forEach((doc: any) => {
              const obs = doc.extractedData?.lab_values || doc.extractedData?.observations || [];
              const docDateFallback = doc.extractedDate || doc.extractedData?.collection_date || doc.extractedData?.reportMetadata?.collectionDate || doc.date || doc.createdAt || new Date().toISOString();
              const safeDocDate = typeof docDateFallback === 'string' ? docDateFallback : docDateFallback?.toDate?.()?.toISOString() || new Date().toISOString();
              obs.forEach((o: any) => {
                 extractedValues.push({
                    ...o,
                    markerName: o.marker || o.testName || o.name || o.label,
                    actualDate: o.extractedDate || o.collection_date || o.date || null,
                    fallbackDate: safeDocDate
                 });
              });
           });
        }
        
        if (extractedValues.length > 0) {
          const normalizedResults = extractedValues.filter(r => r.markerName).map((r) => {
            const name = r.markerName.trim();
            const titleCaseName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
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
  }, [user, activeProfile, labs, reports]);

  const uniqueMarkers = useMemo(() => {
    const markerCounts = new Map<string, number>();
    labResults.forEach((r) => {
       if (r.markerName) {
          markerCounts.set(r.markerName, (markerCounts.get(r.markerName) || 0) + 1);
       }
    });
    // Only show markers appearing in 2+ reports as requested
    const markers = Array.from(markerCounts.entries())
       .filter(([_, count]) => count >= 2)
       .map(([name]) => name);
    
    // Sort with favorites first
    const favorites = ['Hemoglobin', 'Hba1c', 'Ldl', 'Hdl', 'Uric acid', 'Crp', 'Vitamin d', 'Egfr', 'Lymphocytes'];
    return markers.sort((a, b) => {
       const aFav = favorites.findIndex(f => a.toLowerCase().includes(f.toLowerCase()));
       const bFav = favorites.findIndex(f => b.toLowerCase().includes(f.toLowerCase()));
       if (aFav !== -1 && bFav !== -1) return aFav - bFav;
       if (aFav !== -1) return -1;
       if (bFav !== -1) return 1;
       return a.localeCompare(b);
    });
  }, [labResults]);

  useEffect(() => {
    if (uniqueMarkers.length > 0 && (!selectedMarker || !uniqueMarkers.includes(selectedMarker))) {
      setSelectedMarker(uniqueMarkers[0]);
    } else if (uniqueMarkers.length === 0 && selectedMarker) {
      setSelectedMarker("");
    }
  }, [uniqueMarkers, selectedMarker]);

  const chartData = useMemo(() => {
    try {
      if (!selectedMarker) return [];

      const now = new Date().getTime();
      let cutoff = 0;
      if (timeRange === "3M") cutoff = now - 90 * 24 * 60 * 60 * 1000;
      else if (timeRange === "6M") cutoff = now - 180 * 24 * 60 * 60 * 1000;
      else if (timeRange === "1Y") cutoff = now - 365 * 24 * 60 * 60 * 1000;

      // ⚡ Bolt: Cache parsed timestamps using Schwartzian transform to avoid O(N log N) regex/parsing calls
      const decorated = labResults
        .filter((r) => r.markerName === selectedMarker)
        .map((r) => {
          const d1 = parseSafeTimestamp(r.actualDate);
          const d2 = !d1 ? parseSafeTimestamp(r.fallbackDate) : null;
          const parsedDate = d1 || d2;
          const time = parsedDate ? parsedDate.getTime() : new Date().getTime();
          return { r, time, parsedDate };
        });

      decorated.sort((a, b) => a.time - b.time);

      const ranged = decorated.filter((item) => item.time >= cutoff);

      return ranged.map(({ r, time, parsedDate }) => {
        let refMin = undefined;
        let refMax = undefined;
        const refRange = r.referenceRange || r.reference_range;
        const parsedVal = parseFloat(String(r.numeric_value || r.display_value || r.value).replace(/[^0-9.-]/g, ''));
        const numericValue = isNaN(parsedVal) ? 0 : parsedVal;

        if (refRange) {
          const rangeMatch = refRange.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
          if (rangeMatch) {
            refMin = parseFloat(rangeMatch[1]);
            refMax = parseFloat(rangeMatch[2]);
          } else if (refRange.includes("<=") || refRange.includes("<")) {
            const numMatch = refRange.match(/([0-9.]+)/);
            if (numMatch) {
              refMin = 0;
              refMax = parseFloat(numMatch[1]);
            }
          } else if (refRange.includes(">=") || refRange.includes(">")) {
            const numMatch = refRange.match(/([0-9.]+)/);
            if (numMatch) {
              const val = parseFloat(numMatch[1]);
              refMin = val;
              refMax = Math.max(val * 1.5, numericValue * 1.5);
            }
          }
        }

        let flagCol = 'emerald';
        const st = (r.status || r.flag || '').toLowerCase();
        if (st === 'high' || st === 'abnormal' || st === 'critical') flagCol = 'red';
        else if (st === 'low') flagCol = 'orange';

        const safeTime = time;
        return {
          timestamp: safeTime,
          date: parsedDate ? parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent",
          numericValue: numericValue,
          value: numericValue,
          unit: r.unitCanonical || r.unit,
          refMin: !isNaN(refMin as number) ? refMin : undefined,
          refMax: !isNaN(refMax as number) ? refMax : undefined,
          refRangeArray: !isNaN(refMin as number) && !isNaN(refMax as number) ? [refMin, refMax] : undefined,
          referenceRange: refRange,
          status: r.status || r.flag,
          flagCol
        };
      }).filter(r => r.numericValue !== undefined && r.numericValue !== null && !isNaN(r.numericValue));
    } catch (error) {
      return [];
    }
  }, [labResults, selectedMarker, timeRange]);

  if (isLoading || labResults.length === 0) {
    return (
      <div className="bg-surface/50 border border-border p-6 rounded-3xl h-[400px] flex items-center justify-center text-muted text-sm">
        {isLoading ? "Loading trends..." : "No laboratory data available yet."}
      </div>
    );
  }

  const latestDataPoint = chartData[chartData.length - 1];
  const firstDataPoint = chartData[0];

  let summarySentence = "Not enough data points for trend analysis.";
  if (latestDataPoint && firstDataPoint && chartData.length > 1 && latestDataPoint.value !== undefined && firstDataPoint.value !== undefined) {
    const delta = latestDataPoint.value - firstDataPoint.value;
    const pct = ((delta / firstDataPoint.value) * 100).toFixed(1);
    const isUp = delta > 0;
    summarySentence = `${selectedMarker} ${isUp ? "increased" : "decreased"} ${Math.abs(Number(pct))}% over this period · Currently `;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md border border-[var(--color-border)] p-4 rounded-2xl shadow-xl min-w-[150px]">
          <p className="text-slate-600 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2">
            {data.date}
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-slate-900 dark:text-white font-medium text-xl">{data.value}</p>
            <span className="text-slate-600 dark:text-white/70 text-xs font-normal">
              {data.unit}
            </span>
          </div>
          {data.referenceRange && (
            <p className="text-slate-600 dark:text-white/70 text-[10px] mt-1">
              Ref: {data.referenceRange}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const ChartComponent = isMobile ? BarChart : LineChart;

  const renderCustomDot = (props: any) => {
     const { cx, cy, payload } = props;
     const fillCol = payload.flagCol === 'red' ? '#ef4444' : payload.flagCol === 'orange' ? '#f97316' : '#10b981';
     return <circle cx={cx} cy={cy} r={6} fill={fillCol} stroke="var(--color-bg)" strokeWidth={2} />;
  };

  return (
    <div className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-[32px] shadow-md dark:shadow-2xl flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="section-title mb-1">Trends</h3>
          {latestDataPoint && chartData.length > 1 ? (
            <div className="text-sm text-muted flex items-center gap-2">
              {summarySentence}
              <span className={`font-semibold ${latestDataPoint.flagCol === 'red' ? "text-red-500" : latestDataPoint.flagCol === 'orange' ? "text-orange-500" : "text-emerald-500"}`}>
                {latestDataPoint.status || "NORMAL"}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted">{uniqueMarkers.length === 0 ? "You need at least 2 reports of a specific marker to see its trend." : "Tracking over time"}</p>
          )}
        </div>

        {uniqueMarkers.length > 0 && (
           <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
             <div className="relative">
               <select
                 value={selectedMarker}
                 aria-label="Select Lab Result to filter chart"
                 onChange={(e) => setSelectedMarker(e.target.value)}
                 className="appearance-none bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-medium tracking-widest rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer shadow-sm transition-colors"
               >
                 {uniqueMarkers.map((m) => (
                   <option key={m} value={m} className="text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-900">
                     {m}
                   </option>
                 ))}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-muted)]">
                 <ChevronDown className="w-4 h-4" />
               </div>
             </div>

             <div className="flex bg-surface rounded-xl p-0.5 border border-border">
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
        )}
      </div>

      {uniqueMarkers.length > 0 && (
         <div id="lab-trend-chart-container" className="w-full h-[300px] min-h-[300px] relative">
           <AIErrorBoundary
             key={chartKey}
             onReset={() => setChartKey((k) => k + 1)}
             fallbackMessage="Chart rendering failed."
           >
            <div className="w-full h-[300px] min-h-[300px] relative mt-4">
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                  
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: "currentColor", fontSize: 12, opacity: 0.6 }}
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  
                  <YAxis 
                    tick={{ fill: "currentColor", fontSize: 12, opacity: 0.6 }}
                    tickLine={false} 
                    axisLine={false} 
                    dx={-10}
                  />
                  
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />

                  <Line 
                    type="monotone" 
                    dataKey="numericValue" 
                    stroke="var(--color-primary, #2dd4bf)" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2, fill: "var(--color-surface, #ffffff)" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-primary, #2dd4bf)" }}
                    isAnimationActive={true} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
           </AIErrorBoundary>
         </div>
      )}
    </div>
  );
}
