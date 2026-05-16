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
import { getDocuments } from "../../lib/firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { LabResult, LabStatus } from "../../types/medical";
import { AIErrorBoundary } from "../ui/AIErrorBoundary";
import { ChevronDown } from "lucide-react";

interface LabTrendChartProps {
  labs?: any[];
  reports?: any[];
}

export default function LabTrendChart({ labs, reports }: LabTrendChartProps) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [labResults, setLabResults] = useState<any[]>([]);
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
    let timeoutId: any;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (entries[0]) {
          setContainerWidth(entries[0].contentRect.width);
        }
      }, 50); // Recharts guardrail: 50ms debounce
    });
    observer.observe(containerRef.current);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
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

      const safeGetTime = (dateStr: any) => {
        if (!dateStr) return 0;
        const ts = new Date(dateStr).getTime();
        return isNaN(ts) ? new Date(String(dateStr).replace(/-/g, '/')).getTime() || 0 : ts;
      };

      const getValidTime = (r: any) => {
        const parsed = safeGetTime(r.actualDate);
        return parsed > 0 ? parsed : (safeGetTime(r.fallbackDate) || new Date().getTime());
      };

      const filtered = labResults
        .filter((r) => r.markerName === selectedMarker)
        .sort((a, b) => getValidTime(a) - getValidTime(b));

      const now = new Date().getTime();
      let cutoff = 0;
      if (timeRange === "3M") cutoff = now - 90 * 24 * 60 * 60 * 1000;
      else if (timeRange === "6M") cutoff = now - 180 * 24 * 60 * 60 * 1000;
      else if (timeRange === "1Y") cutoff = now - 365 * 24 * 60 * 60 * 1000;

      const ranged = filtered.filter((r) => {
        const t = getValidTime(r);
        return t >= cutoff;
      });

      return ranged.map((r) => {
        let refMin = undefined;
        let refMax = undefined;
        const refRange = r.referenceRange || r.reference_range;
        const numericValue = parseFloat(String(r.numeric_value || r.display_value || r.value).replace(/[^0-9.-]/g, ''));

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

        const safeTime = getValidTime(r);
        return {
          timestamp: safeTime,
          date: safeTime ? new Date(safeTime).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : String(r.actualDate || r.fallbackDate),
          value: !isNaN(numericValue) ? numericValue : undefined,
          unit: r.unitCanonical || r.unit,
          refMin: !isNaN(refMin as number) ? refMin : undefined,
          refMax: !isNaN(refMax as number) ? refMax : undefined,
          refRangeArray: !isNaN(refMin as number) && !isNaN(refMax as number) ? [refMin, refMax] : undefined,
          referenceRange: refRange,
          status: r.status || r.flag,
          flagCol
        };
      }).filter(r => r.value !== undefined);
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

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
           <div>
              <h3 className="font-bold text-xl lg:text-2xl mb-1 text-text">Select Marker</h3>
           </div>
           
           <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
             {uniqueMarkers.map((marker) => (
                <button
                  key={marker}
                  onClick={() => setSelectedMarker(marker)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                    selectedMarker === marker
                      ? "bg-primary text-black transform scale-105"
                      : "bg-surface hover:bg-black/10 border border-border text-muted"
                  }`}
                >
                  {marker}
                </button>
              ))}
           </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted text-sm border border-dashed border-border rounded-2xl h-[300px]">
          No data available for {selectedMarker} within this time frame.
        </div>
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

  const renderCustomDot = (props: any) => {
     const { cx, cy, payload } = props;
     const fillCol = payload.flagCol === 'red' ? '#ef4444' : payload.flagCol === 'orange' ? '#f97316' : '#10b981';
     return <circle cx={cx} cy={cy} r={6} fill={fillCol} stroke="var(--color-bg)" strokeWidth={2} />;
  };

  return (
    <div className="bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-[32px] shadow-2xl flex flex-col gap-6">
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
         <div id="lab-trend-chart-container" ref={containerRef} className="h-[300px] w-full relative">
           <AIErrorBoundary
             key={chartKey}
             onReset={() => setChartKey((k) => k + 1)}
             fallbackMessage="Chart rendering failed."
           >
             {containerWidth > 0 && (
               <div style={{ width: "100%", height: "300px" }}>
                 <ResponsiveContainer width="100%" height={300} debounce={50}>
                   <ChartComponent
                     data={chartData}
                     margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                   >
                 <CartesianGrid
                   strokeDasharray="0"
                   vertical={false}
                   stroke="rgba(150,150,150,0.1)"
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

                 {/* Reference Band */}
                 <Area
                   type="step"
                   dataKey="refRangeArray"
                   stroke="none"
                   fill="var(--color-primary)"
                   fillOpacity={0.05}
                   isAnimationActive={!isMobile}
                 />

                 {isMobile ? (
                   <Bar
                     dataKey="value"
                     fill="var(--color-primary)"
                     radius={[4, 4, 0, 0]}
                     isAnimationActive={!isMobile}
                   />
                 ) : (
                   <Line
                     type="monotone"
                     dataKey="value"
                     stroke="var(--color-primary)"
                     strokeWidth={2}
                     dot={renderCustomDot}
                     isAnimationActive={!isMobile}
                     activeDot={{
                       r: 8,
                       fill: "var(--color-primary)",
                       stroke: "var(--color-bg)",
                       strokeWidth: 2,
                     }}
                     animationDuration={1000}
                   />
                 )}
               </ChartComponent>
             </ResponsiveContainer>
             </div>
             )}
           </AIErrorBoundary>
         </div>
      )}
    </div>
  );
}
