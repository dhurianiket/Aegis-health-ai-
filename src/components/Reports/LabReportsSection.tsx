import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase/config";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { useProfile } from "../../context/ProfileContext";
import { getSourceForMarker, getUrgencyAndNextStep } from "../../services/sourceGroundedService";
import {
  FileText,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Stethoscope,
  Activity,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import LabTrendChart from "../Dashboard/LabTrendChart"; // We can reuse this or copy its logic for Trends View

interface LabReport {
  id: string;
  type?: string;
  fileName?: string;
  hospitalName?: string;
  doctorName?: string;
  date?: string;
  uploadedAt: string;
  fileUrl?: string;
  extractedData?: {
    observations?: any[];
    lab_values?: any[];
    summary?: string;
  };
  aiSummary?: string;
  status?: "complete" | "processing" | "error";
  profileId?: string;
}

function ReportCard({ report, showCheckbox, isSelected, onToggleSelection }: { report: LabReport, showCheckbox?: boolean, isSelected?: boolean, onToggleSelection?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const labName = report.hospitalName && report.hospitalName !== "Unknown" ? report.hospitalName : report.fileName || "Lab Report";
  const docType = report.type || "Document";
  const doctor = report.doctorName && report.doctorName !== "Unknown" ? report.doctorName : null;

  let dateText = "Unknown Date";
  if (report.date) {
    try {
      dateText = format(new Date(report.date), "dd MMM yyyy");
    } catch (e) {
      dateText = report.date;
    }
  }

  const observations = report.extractedData?.observations || report.extractedData?.lab_values || [];
  const observationCount = observations.length;
  const status = report.status || "complete";

  const downloadSummary = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report.extractedData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `aegis_extraction_${report.fileName || 'report'}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className={`bg-[var(--color-surface)] border ${isSelected ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/50' : 'border-[var(--color-border)]'} rounded-2xl p-4 hover:shadow-md transition-all`}>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-start gap-4">
          {showCheckbox && (
            <div className="pt-2">
              <input 
                type="checkbox" 
                checked={!!isSelected} 
                onChange={() => onToggleSelection && onToggleSelection(report.id)}
                className="w-4 h-4 cursor-pointer accent-[var(--color-primary)]"
                aria-label={`Select report ${report.fileName || report.id}`}
              />
            </div>
          )}
          <div className="w-12 h-12 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl flex items-center justify-center shrink-0">
            {docType.toLowerCase().includes('consult') ? <Stethoscope className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
               <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-surface text-muted border border-border mt-0.5">
                  {docType}
               </span>
               <span className="text-xs text-muted font-medium mt-0.5">{dateText}</span>
            </div>
            <h3 className="font-semibold text-lg text-[var(--color-text)] leading-tight whitespace-normal break-words sm:max-w-md">
              {labName}
            </h3>
            <div className="text-sm mt-1">
              {doctor && (
                <p className="mb-0.5 font-medium text-[var(--color-text)] whitespace-normal break-words">
                  {doctor.toLowerCase().startsWith('dr.') || doctor.toLowerCase().startsWith('dr ') ? doctor : `Dr. ${doctor}`}
                </p>
              )}
              <p className="text-[var(--color-text-muted)]">{observationCount} lab values found</p>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col gap-2 justify-end sm:items-end w-full sm:w-auto">
          {report.fileUrl ? (
             <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--color-bg)] hover:bg-surface text-theme text-xs font-bold rounded-lg border border-border transition-colors">
                <Download size={14} /> PDF
             </a>
          ) : (
             <button onClick={downloadSummary} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--color-bg)] hover:bg-surface text-theme text-xs font-bold rounded-lg border border-border transition-colors">
                <Download size={14} /> JSON
             </button>
          )}
          {observationCount > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-[var(--color-primary)] hover:underline focus:outline-none bg-[var(--color-primary)]/5 rounded-lg transition-colors border border-[var(--color-primary)]/10"
            >
              {expanded ? "Hide Results" : "View Details"}
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && observationCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4 pt-4 border-t border-[var(--color-border)]"
          >
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-normal break-words">
                <thead className="bg-[var(--color-bg)] text-[var(--color-text-muted)] text-xs uppercase tracking-widest font-semibold">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg w-1/4">Marker</th>
                    <th className="px-4 py-3 text-right w-1/5">Value</th>
                    <th className="px-4 py-3 w-1/5 text-center">Status</th>
                    <th className="px-4 py-3 w-1/5">Ref Range</th>
                    <th className="px-4 py-3 rounded-r-lg w-1/5">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                  {observations.map((m: any, i: number) => {
                    const flag = m.flag || m.status; // Fallback for old status
                    const isHigh = flag?.toLowerCase() === "high" || flag?.toLowerCase() === "abnormal";
                    const isLow = flag?.toLowerCase() === "low";
                    const isCritical = flag?.toLowerCase() === "critical";
                    const flagColor = isCritical ? "text-[var(--color-critical)] bg-[var(--color-critical)]/10" : isHigh ? "text-[var(--color-warning)] bg-[var(--color-warning)]/10" : isLow ? "text-orange-500 bg-orange-500/10" : "text-[var(--color-success)] bg-[var(--color-success)]/10";
                    const flagText = flag || "NORMAL";
                    const source = getSourceForMarker(m.testName || m.marker);
                    const urgency = getUrgencyAndNextStep(m.testName || m.marker, flagText, m.valueCanonical ?? m.valueOriginal ?? m.value);

                    return (
                      <tr key={i} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          <span className="whitespace-normal break-words">{m.testName || m.marker}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {m.valueCanonical ?? m.valueOriginal ?? m.value}{" "}
                          <span className="text-[var(--color-text-muted)] text-xs font-normal ml-0.5">
                            {m.unitCanonical || m.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${flagColor}`}>
                            {flagText}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">
                          {m.referenceLow !== null && m.referenceLow !== undefined && m.referenceHigh !== null && m.referenceHigh !== undefined
                            ? `${m.referenceLow}–${m.referenceHigh}`
                            : m.reference_range || "-"}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">
                          <div className="space-y-1">
                            {source ? (
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-medium"
                                id={`ref-link-dt-${m.id || i}`}
                              >
                                {source.name}
                              </a>
                            ) : (
                              <span className="text-[var(--color-text-faint)] text-xs italic block">reference not available</span>
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

            {/* MOBILE LAYOUT */}
            <div className="md:hidden flex flex-col gap-3">
              {observations.map((m: any, i: number) => {
                const flag = m.flag || m.status;
                const isHigh = flag?.toLowerCase() === "high" || flag?.toLowerCase() === "abnormal";
                const isLow = flag?.toLowerCase() === "low";
                const isCritical = flag?.toLowerCase() === "critical";
                const flagColor = isCritical ? "text-[var(--color-critical)] border-[var(--color-critical)] bg-[var(--color-critical)]/10" : isHigh ? "text-[var(--color-warning)] border-[var(--color-warning)] bg-[var(--color-warning)]/10" : isLow ? "text-orange-500 border-orange-500 bg-orange-500/10" : "text-[var(--color-success)] border-[var(--color-success)] bg-[var(--color-success)]/10";
                const flagText = flag || "NORMAL";
                const source = getSourceForMarker(m.testName || m.marker);
                const urgency = getUrgencyAndNextStep(m.testName || m.marker, flagText, m.valueCanonical ?? m.valueOriginal ?? m.value);

                return (
                  <div key={i} className="bg-white/[0.02] dark:bg-white/[0.03] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-semibold text-[var(--color-text)] text-sm leading-5 whitespace-normal break-words">
                        {m.testName || m.marker}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border shrink-0 ${flagColor}`}>
                        {flagText}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      <div className="font-bold text-[var(--color-text)] text-lg leading-tight">
                        {m.valueCanonical ?? m.valueOriginal ?? m.value}
                        { (m.unitCanonical || m.unit) && (
                          <span className="text-[var(--color-text-muted)] text-xs font-normal ml-1">
                            {m.unitCanonical || m.unit}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[var(--color-text-muted)] text-xs">
                        Reference: {m.referenceLow !== null && m.referenceLow !== undefined && m.referenceHigh !== null && m.referenceHigh !== undefined
                          ? `${m.referenceLow}–${m.referenceHigh}`
                          : m.reference_range || "-"}
                      </div>

                      <div className="text-[var(--color-text-muted)] text-xs mt-1">
                        Source: {source ? (
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[var(--color-primary)] hover:underline font-medium inline-flex items-center gap-1"
                            id={`ref-link-mb-${m.id || i}`}
                          >
                            {source.name}
                          </a>
                        ) : (
                          <span className="text-[var(--color-text-faint)] text-xs italic">reference not available</span>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-[var(--color-border)]/20 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-[var(--color-text-muted)] font-medium">Urgency:</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${urgency.badgeClass}`}>
                            {urgency.level}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)]">
                          <span className="font-medium">Next Step:</span> <span className="text-[var(--color-text-faint)]">{urgency.nextStep}</span>
                        </div>
                      </div>
                    </div>
                    {m.interpretation && (
                      <div className="text-[var(--color-text-faint)] text-xs mt-1 italic">
                        {m.interpretation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {(report.aiSummary || report.extractedData?.summary) && (
               <div className="mt-4 p-4 rounded-xl bg-surface/50 border border-[var(--color-border)] text-sm leading-relaxed text-[var(--color-text-muted)]">
                  <strong>Findings:</strong> {report.aiSummary || report.extractedData?.summary}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import ReportHistory from "./ReportHistory";
import ReportComparison from "../Dashboard/ReportComparison";
import ClinicalHandover from "./ClinicalHandover";

export default function LabReportsSection({ onOpenChat, onNavigateToUpload }: { onOpenChat?: () => void; onNavigateToUpload?: () => void; }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'list'|'trends'|'history'|'share'>('list');
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedReports(prev => {
      if (prev.includes(id)) {
        return prev.filter(r => r !== id);
      } else {
        if (prev.length >= 2) {
          // Deselect oldest item in selection (first item added) and add new one
          return [prev[1], id];
        }
        return [...prev, id];
      }
    });
  };

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    let q = query(collection(db, "users", user.uid, "documents"));
    if (activeProfile?.id) {
       q = query(q, where("profileId", "==", activeProfile.id));
    }
    
    // We sort locally since we might not have a composite index for profileId + date DESC
    const unsubscribe = onSnapshot(q, (snapshot) => {
       const docs = snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data(),
         uploadedAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().date || new Date().toISOString(),
         status: "complete"
       })) as LabReport[];
       
       docs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
       setReports(docs);
       setIsLoading(false);
    }, (err) => {
       console.error("Error fetching reports real-time:", err);
       setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, activeProfile]);

  const filteredReports = useMemo(() => {
     return reports.filter(r => {
        if (filterType !== 'All') {
           const typeMatch = filterType === 'Lab Reports' ? r.type?.toLowerCase().includes('lab') || r.type?.toLowerCase().includes('blood') || r.type?.toLowerCase().includes('pathology')
              : filterType === 'Consultations' ? r.type?.toLowerCase().includes('consult') || r.type?.toLowerCase().includes('visit')
              : true;
           if (!typeMatch) return false;
        }
        if (searchQuery.trim().length > 0) {
           const queryStr = searchQuery.toLowerCase();
           const hospMatch = (r.hospitalName || '').toLowerCase().includes(queryStr);
           const docMatch = (r.doctorName || '').toLowerCase().includes(queryStr);
           const markerMatch = (r.extractedData?.lab_values || []).some(l => (l.marker || l.testName || '').toLowerCase().includes(queryStr));
           if (!hospMatch && !docMatch && !markerMatch) return false;
        }
        return true;
     });
  }, [reports, filterType, searchQuery]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] mb-2">Vault & Analytics</h2>
          <div className="flex bg-[var(--color-bg)] border border-[var(--color-border)] p-1 rounded-[14px] inline-flex">
             <button id="tab-btn-docs" onClick={() => setActiveTab('list')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-muted hover:text-[var(--color-text)]'}`}>
                Documents
             </button>
             <button id="tab-btn-trends" onClick={() => setActiveTab('trends')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'trends' ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-muted hover:text-[var(--color-text)]'}`}>
                Trends & Charts
             </button>
             <button id="tab-btn-history" onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-muted hover:text-[var(--color-text)]'}`}>
                History
             </button>
             <button id="tab-btn-share" onClick={() => setActiveTab('share')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'share' ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-muted hover:text-[var(--color-text)]'}`}>
                Share With Doctor
             </button>
          </div>
        </div>
        <button onClick={() => onNavigateToUpload && onNavigateToUpload()} className="px-6 py-3 rounded-[14px] text-xs font-bold uppercase tracking-widest transition-colors bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90 shadow-lg">
          Upload New Report
        </button>
      </div>

      {activeTab === 'list' && (
        <>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                 {['All', 'Lab Reports', 'Consultations', 'Other'].map(f => (
                    <button key={f} onClick={() => setFilterType(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterType === f ? 'bg-primary text-white dark:text-slate-950 font-bold' : 'bg-surface text-muted hover:bg-border/50 border border-border'}`}>
                       {f}
                    </button>
                 ))}
              </div>
              <div className="relative w-full sm:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                 <input 
                    type="text" 
                    aria-label="Search lab reports"
                    placeholder="Search markers, doctors..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface border border-border rounded-full pl-9 pr-4 py-2 text-sm text-[var(--color-text)] placeholder-muted focus:outline-none focus:border-primary/50 transition-colors"
                 />
              </div>
           </div>

           <div className="space-y-4">
              {isLoading ? (
                 [...Array(3)].map((_, i) => (
                 <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 animate-pulse">
                    <div className="flex gap-4">
                       <div className="w-12 h-12 bg-[var(--color-bg)] rounded-xl" />
                       <div className="flex-1 space-y-3">
                       <div className="w-1/3 h-5 bg-[var(--color-bg)] rounded" />
                       <div className="w-1/4 h-3 bg-[var(--color-bg)] rounded" />
                       </div>
                    </div>
                 </div>
                 ))
              ) : filteredReports.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {filteredReports.map((report) => (
                      <ReportCard 
                        key={report.id} 
                        report={report} 
                        showCheckbox={reports.length >= 2} 
                        isSelected={selectedReports.includes(report.id)}
                        onToggleSelection={toggleSelection}
                      />
                    ))}
                  </div>
              ) : (
                 <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] p-12 text-center flex flex-col items-center">
                 <div className="w-20 h-20 bg-[var(--color-bg)] rounded-full flex items-center justify-center mb-6">
                    <Filter className="w-10 h-10 text-[var(--color-text-muted)]" strokeWidth={1} />
                 </div>
                 <h3 className="section-title mb-2 text-[var(--color-text)]">{reports.length === 0 ? "Your health vault is empty." : "No matches found"}</h3>
                 <p className="text-[var(--color-text-muted)] text-sm mb-8 max-w-sm">
                    {reports.length === 0 ? "Upload your first lab report to generate insights and track your trends." : "Try adjusting your filters or search terms."}
                 </p>
                 {reports.length === 0 && (
                    <button onClick={() => onNavigateToUpload && onNavigateToUpload()} className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity">
                       Upload Report
                    </button>
                 )}
                 </div>
              )}
           </div>
        </>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-8">
           <LabTrendChart reports={reports} />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-8">
           <ReportHistory />
        </div>
      )}

      {activeTab === 'share' && (
        <div className="space-y-8">
           <ClinicalHandover />
        </div>
      )}

      <div className="pt-8 mt-12 border-t border-[var(--color-border)] opacity-40 text-center">
        <p className="text-xs text-[var(--color-text-faint)] font-mono uppercase tracking-[0.15em]">
          Built by <a href="https://aniket.aegishealthai.co.in/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline decoration-[var(--color-text-faint)] transition-colors">Aniket Dhuri</a> · Powered by Gemini AI
        </p>
      </div>

      <AnimatePresence>
        {selectedReports.length === 2 && !showComparison && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40"
          >
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-semibold text-text">2 reports selected for comparison</span>
              <button 
                onClick={() => setShowComparison(true)}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-xl transition-colors text-center"
              >
                Compare Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showComparison && selectedReports.length === 2 && (() => {
        const reportA = reports.find(r => r.id === selectedReports[0]);
        const reportB = reports.find(r => r.id === selectedReports[1]);
        
        let dateA = reportA?.date || reportA?.uploadedAt || "Unknown date";
        let dateB = reportB?.date || reportB?.uploadedAt || "Unknown date";
        
        try { if (reportA?.date) dateA = format(new Date(reportA.date), "MMM d, yyyy"); } catch(e) {}
        try { if (reportB?.date) dateB = format(new Date(reportB.date), "MMM d, yyyy"); } catch(e) {}

        return (
          <div className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-sm overflow-y-auto w-full h-screen">
            <ReportComparison 
              reportAId={selectedReports[0]}
              reportBId={selectedReports[1]}
              reportADate={dateA}
              reportBDate={dateB}
              onClose={() => setShowComparison(false)}
            />
          </div>
        );
      })()}
    </div>
  );
}
