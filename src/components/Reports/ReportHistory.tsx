import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { getReportHistory, getDocuments } from "../../lib/firebase/firestore";
import { ReportHistoryEntry, MedicalDocument } from "../../types/medical";
import { parseSafeTimestamp } from "../../utils/dateUtils";
import { getSourceForMarker, getUrgencyAndNextStep } from "../../services/sourceGroundedService";
import {
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  User,
  Clock,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ReportHistory() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();

  const [historyRecords, setHistoryRecords] = useState<ReportHistoryEntry[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isExpandingLoad, setIsExpandingLoad] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Fetch custom history records (page 1, limit 10)
        const res = await getReportHistory(user.uid, activeProfile?.id, 10);
        const hist = res?.history || [];
        setLastVisibleDoc(res?.lastVisible || null);
        setHasMore(hist.length === 10);

        // Fetch raw documents for backward compatibility/auto-sync
        const docs = await getDocuments(user.uid, activeProfile?.id);
        
        setHistoryRecords(hist);
        setDocuments(docs || []);
      } catch (err) {
        console.error("Error loading report history data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user, activeProfile]);

  const loadMoreHistory = async () => {
    if (!user || isExpandingLoad || !lastVisibleDoc) return;
    setIsExpandingLoad(true);
    try {
      const res = await getReportHistory(user.uid, activeProfile?.id, 10, lastVisibleDoc);
      if (res?.history) {
        setHistoryRecords((prev) => [...prev, ...res.history]);
        setLastVisibleDoc(res.lastVisible || null);
        setHasMore(res.history.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more history records:", err);
    } finally {
      setIsExpandingLoad(false);
    }
  };

  // Merge custom reportHistory with existing documents (reconcile duplicates by docId)
  const allReports = useMemo(() => {
    const map = new Map<string, any>();

    // 1. First, populate from documents (the existing single-report data)
    documents.forEach((doc) => {
      const observations = doc.extractedData?.observations || doc.extractedData?.lab_values || [];
      const validObs = observations.filter((obs: any) =>
        (obs.valueCanonical !== undefined && obs.valueCanonical !== null) || obs.numeric_value !== undefined
      );

      const dateStr = doc.extractedDate || doc.date || new Date().toISOString();
      map.set(doc.id, {
        id: `hist_${doc.id}`,
        userId: doc.userId,
        profileId: doc.profileId,
        docId: doc.id,
        fileName: doc.hospitalName && doc.hospitalName !== "Unknown" ? doc.hospitalName : doc.fileName || "Lab Report",
        uploadedAt: doc.uploadedAt || doc.createdAt || new Date().toISOString(),
        extractedDate: dateStr,
        markerCount: validObs.length,
        date: dateStr,
        rawDocument: doc,
        observations: observations,
      });
    });

    // 2. Override or add from reportHistory collection if available
    historyRecords.forEach((hist) => {
      const existing = map.get(hist.docId);
      if (existing) {
        map.set(hist.docId, {
          ...existing,
          ...hist,
          id: hist.id, // preserve history entry ID
        });
      } else {
        // Find matching raw document if any
        const matchedDoc = documents.find((d) => d.id === hist.docId);
        const observations = matchedDoc?.extractedData?.observations || matchedDoc?.extractedData?.lab_values || [];
        map.set(hist.docId, {
          ...hist,
          rawDocument: matchedDoc,
          observations: observations,
        });
      }
    });

    // Sort chronologically (newest first) using Schwartzian transform for O(N) date parsing
    const mapped = Array.from(map.values()).map(item => ({
      item,
      time: parseSafeTimestamp(item.date || item.uploadedAt)?.getTime() || 0
    }));
    mapped.sort((a, b) => b.time - a.time);
    return mapped.map(m => m.item);
  }, [historyRecords, documents]);

  // chronological oldest to newest for trend scanning
  const chronologicalReports = useMemo(() => {
    // allReports is already strictly sorted in reverse-chronological order using the exact same date logic.
    // We can safely use .reverse() to get O(N) instead of O(N log N) with repeated Date parsing.
    return [...allReports].reverse();
  }, [allReports]);

  // Precompute preceding values in a single O(N) forward pass instead of O(N^2) backward scanning during render
  const precedingValuesMap = useMemo(() => {
    const map = new Map<string, Map<string, any>>();
    const lastSeenMap = new Map<string, any>();

    for (const report of chronologicalReports) {
      const reportPreceding = new Map<string, any>();
      map.set(report.docId, reportPreceding);

      if (report.observations && Array.isArray(report.observations)) {
        for (const obs of report.observations) {
          const markerName = (obs.marker || obs.testName || obs.name || "").toLowerCase().trim();
          if (!markerName) continue;

          // Store the preceding value if it exists from previous reports
          if (lastSeenMap.has(markerName)) {
            reportPreceding.set(markerName, lastSeenMap.get(markerName));
          }

          // Update last seen for the next reports in chronological order
          const val = obs.valueCanonical ?? obs.numeric_value ?? obs.valueOriginal;
          if (val !== undefined && val !== null) {
            lastSeenMap.set(markerName, {
              value: parseFloat(String(val)),
              unit: obs.unitCanonical || obs.unitOriginal || "",
              date: report.date,
              reportName: report.fileName,
            });
          }
        }
      }
    }
    return map;
  }, [chronologicalReports]);

  // O(1) preceding value lookup using the precomputed map
  const getPrecedingMarkerValue = (reportId: string, markerName: string, currentDateStr: string) => {
    const currentNorm = markerName.toLowerCase().trim();
    const reportPreceding = precedingValuesMap.get(reportId);
    if (!reportPreceding) return null;
    return reportPreceding.get(currentNorm) || null;
  };

  // Filter based on search query
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return allReports;
    const q = searchQuery.toLowerCase();
    return allReports.filter((report) => {
      const nameMatch = (report.fileName || "").toLowerCase().includes(q);
      const markerMatch = (report.observations || []).some((obs: any) => {
        const markerName = (obs.marker || obs.testName || obs.name || "").toLowerCase();
        return markerName.includes(q);
      });
      return nameMatch || markerMatch;
    });
  }, [allReports, searchQuery]);

  const toggleReportExpanded = (id: string) => {
    setExpandedReportId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="report-history-container">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="history-stats-grid">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Total Reports</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{allReports.length}</p>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Tracked Biomarkers</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">
              {useMemo(() => {
                const markers = new Set<string>();
                allReports.forEach((r) => {
                  r.observations?.forEach((o: any) => {
                    const name = (o.marker || o.testName || o.name || "").toLowerCase().trim();
                    if (name) markers.add(name);
                  });
                });
                return markers.size;
              }, [allReports])}
            </p>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Latest Record</p>
            <p className="text-lg font-bold text-[var(--color-text)] truncate">
              {allReports[0]?.date ? format(new Date(allReports[0].date), "dd MMM yyyy") : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="history-controls">
        <h3 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" /> Chronological Timeline
        </h3>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search report titles or lab markers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full pl-9 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder-muted focus:outline-none focus:border-[var(--color-primary)]/50 transition-colors shadow-sm"
            id="history-search-input"
          />
        </div>
      </div>

      {/* History Timeline */}
      <div className="space-y-4" id="history-timeline-list">
        {isLoading ? (
          [...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--color-bg)] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-1/4 h-4 bg-[var(--color-bg)] rounded" />
                  <div className="w-1/3 h-3 bg-[var(--color-bg)] rounded" />
                </div>
              </div>
            </div>
          ))
        ) : filteredReports.length > 0 ? (
          filteredReports.map((report) => {
            const isExpanded = expandedReportId === report.docId;
            let dateText = "Unknown Date";
            if (report.date) {
              try {
                dateText = format(new Date(report.date), "dd MMM yyyy");
              } catch (e) {
                dateText = report.date;
              }
            }

            return (
              <div
                key={report.docId}
                className={`bg-[var(--color-surface)] border ${
                  isExpanded ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30" : "border-[var(--color-border)]"
                } rounded-2xl overflow-hidden transition-all duration-200 shadow-sm`}
                id={`report-row-${report.docId}`}
              >
                {/* Accordion Trigger Header */}
                <button
                  onClick={() => toggleReportExpanded(report.docId)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--color-bg)]/40 transition-colors focus:outline-none"
                  id={`btn-expand-${report.docId}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                          Report
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)] font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {dateText}
                        </span>
                      </div>
                      <h4 className="font-semibold text-base text-[var(--color-text)] truncate max-w-sm sm:max-w-md">
                        {report.fileName}
                      </h4>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {report.markerCount} biomarkers extracted
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[var(--color-text-muted)]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />
                    )}
                  </div>
                </button>

                {/* Extended Details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-6 pt-1 border-t border-[var(--color-border)] bg-[var(--color-bg)]/20 space-y-4">
                        {/* Summary / Findings */}
                        {(report.rawDocument?.aiSummary || report.rawDocument?.extractedData?.summary) && (
                          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex gap-3">
                            <Activity className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Clinical Assessment Summary</p>
                              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                                {report.rawDocument.aiSummary || report.rawDocument.extractedData.summary}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Biomarker Comparative Table */}
                        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead>
                              <tr className="bg-[var(--color-bg)] text-[var(--color-text-muted)] text-xs uppercase tracking-wider font-semibold border-b border-[var(--color-border)]">
                                <th className="px-4 py-3">Marker Name</th>
                                <th className="px-4 py-3 text-right">Current Value</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Trend vs Past</th>
                                <th className="px-4 py-3">Reference Source</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                              {report.observations?.map((obs: any, oIdx: number) => {
                                const markerName = obs.marker || obs.testName || obs.name || "Unknown";
                                const currentValRaw = obs.valueCanonical ?? obs.numeric_value ?? obs.valueOriginal;
                                const currentVal = currentValRaw !== undefined && currentValRaw !== null ? parseFloat(String(currentValRaw)) : null;
                                const unit = obs.unitCanonical || obs.unitOriginal || "";
                                const status = (obs.status || obs.flag || "NORMAL").toUpperCase();
                                const source = getSourceForMarker(markerName);

                                // Get preceding value for comparison
                                const preceding = currentVal !== null ? getPrecedingMarkerValue(report.docId, markerName, report.date) : null;

                                let trendIndicator = null;
                                if (currentVal !== null && preceding !== null && preceding.value !== null) {
                                  const diff = currentVal - preceding.value;
                                  const pct = preceding.value !== 0 ? (diff / preceding.value) * 100 : 0;
                                  const diffFormatted = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
                                  const pctFormatted = pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;

                                  if (Math.abs(diff) < 0.0001) {
                                    trendIndicator = (
                                      <div className="flex items-center justify-end gap-1.5 text-slate-300">
                                        <Minus className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium">Stable</span>
                                      </div>
                                    );
                                  } else if (diff > 0) {
                                    trendIndicator = (
                                      <div className="flex flex-col items-end gap-0.5">
                                        <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                                          <ArrowUp className="w-3.5 h-3.5 stroke-[3px]" />
                                          <span>{diffFormatted}</span>
                                        </div>
                                        <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/5 px-1.5 py-0.5 rounded">
                                          {pctFormatted}
                                        </span>
                                      </div>
                                    );
                                  } else {
                                    trendIndicator = (
                                      <div className="flex flex-col items-end gap-0.5">
                                        <div className="flex items-center gap-1 text-sky-500 font-bold text-xs">
                                          <ArrowDown className="w-3.5 h-3.5 stroke-[3px]" />
                                          <span>{diffFormatted}</span>
                                        </div>
                                        <span className="text-xs text-sky-500/80 font-semibold bg-sky-500/5 px-1.5 py-0.5 rounded">
                                          {pctFormatted}
                                        </span>
                                      </div>
                                    );
                                  }
                                } else {
                                  trendIndicator = (
                                    <span className="text-xs text-[var(--color-text-faint)] italic">first recording</span>
                                  );
                                }

                                // Status styling helper
                                const isCritical = status.includes("CRITICAL") || status.includes("ABNORMAL");
                                const isHigh = status.includes("HIGH");
                                const isLow = status.includes("LOW");
                                const statusClass = isCritical
                                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                                  : isHigh
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : isLow
                                  ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

                                const valStr = currentVal !== null ? String(currentVal) : (obs.display_value || obs.valueOriginal || "");
                                const urgency = getUrgencyAndNextStep(markerName, status, valStr);

                                return (
                                  <tr key={oIdx} className="hover:bg-[var(--color-bg)]/20 transition-colors">
                                    <td className="px-4 py-3.5 font-medium text-sm text-[var(--color-text)]">
                                      {markerName}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-semibold text-sm">
                                      {currentVal !== null ? `${currentVal} ${unit}` : obs.display_value || obs.valueOriginal || "-"}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusClass}`}>
                                        {status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                      {trendIndicator}
                                    </td>
                                    <td className="px-4 py-3.5 text-[var(--color-text-muted)] text-xs">
                                      <div className="space-y-1">
                                        {source ? (
                                          <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-medium"
                                            id={`history-ref-link-${report.docId}-${oIdx}`}
                                          >
                                            {source.name}
                                          </a>
                                        ) : (
                                          <span className="text-[var(--color-text-faint)] italic block">not available</span>
                                        )}
                                        <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-[var(--color-border)]/20">
                                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider w-fit ${urgency.badgeClass}`}>
                                            {urgency.level} Urgency
                                          </span>
                                          <span className="text-xs text-[var(--color-text-faint)] leading-tight">{urgency.nextStep}</span>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[var(--color-bg)] rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <h4 className="text-base font-semibold text-[var(--color-text)] mb-1">No matching history records</h4>
            <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
              We couldn't find any report or lab value matching "{searchQuery}". Try updating your search keyword.
            </p>
          </div>
        )}

        {filteredReports.length > 0 && hasMore && (
          <div className="flex justify-center pt-4" id="load-more-container">
            <button
              onClick={loadMoreHistory}
              disabled={isExpandingLoad}
              className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/40 transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
              id="btn-load-more-history"
            >
              {isExpandingLoad ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More Records"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
