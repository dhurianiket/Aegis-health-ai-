import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase/config";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { useProfile } from "../../context/ProfileContext";
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
  status?: "complete" | "processing" | "error";
  profileId?: string;
}

function ReportCard({ report }: { report: LabReport }) {
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

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl flex items-center justify-center shrink-0">
            {docType.toLowerCase().includes('consult') ? <Stethoscope className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface text-muted border border-border">
                  {docType}
               </span>
               <span className="text-xs text-muted font-medium">{dateText}</span>
            </div>
            <h4 className="font-semibold text-lg text-[var(--color-text)] truncate max-w-[200px] sm:max-w-xs leading-tight">
              {labName}
            </h4>
            <div className="text-sm text-[var(--color-text-muted)] mt-1">
              {doctor && <p className="mb-0.5">Dr. {doctor}</p>}
              <p>{observationCount} lab values found</p>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col gap-2 justify-end sm:items-end w-full sm:w-auto">
          {report.fileUrl && (
             <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--color-bg)] hover:bg-surface text-theme text-xs font-bold rounded-lg border border-border transition-colors">
                <Download size={14} /> PDF
             </a>
          )}
          {observationCount > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-[var(--color-primary)] hover:underline focus:outline-none bg-primary/5 rounded-lg transition-colors border border-primary/10"
            >
              {expanded ? "Hide Results" : "View Table"}
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--color-bg)] text-[var(--color-text-muted)] text-[11px] uppercase tracking-widest font-semibold">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Marker</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 rounded-r-lg">Ref Range</th>
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

                    return (
                      <tr key={i} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                        <td className="px-4 py-3 font-medium flex items-center gap-2 w-1/3">
                          <span className="truncate">{m.testName || m.marker}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium w-1/4">
                          {m.valueCanonical ?? m.valueOriginal ?? m.value}{" "}
                          <span className="text-[var(--color-text-muted)] text-[10px] font-normal ml-0.5">
                            {m.unitCanonical || m.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 w-1/4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${flagColor}`}>
                            {flagText}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs w-1/4">
                          {m.referenceLow !== null && m.referenceLow !== undefined && m.referenceHigh !== null && m.referenceHigh !== undefined
                            ? `${m.referenceLow}–${m.referenceHigh}`
                            : m.reference_range || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {report.extractedData?.summary && (
               <div className="mt-4 p-4 rounded-xl bg-surface/50 border border-border text-sm leading-relaxed text-muted">
                  <strong>Findings:</strong> {report.extractedData.summary}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LabReportsSection({ onOpenChat, onNavigateToUpload }: { onOpenChat?: () => void; onNavigateToUpload?: () => void; }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'list'|'trends'>('list');
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredReports = reports.filter(r => {
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] mb-2">Vault & Analytics</h2>
          <div className="flex bg-[var(--color-bg)] border border-[var(--color-border)] p-1 rounded-[14px] inline-flex">
             <button onClick={() => setActiveTab('list')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-muted hover:text-[var(--color-text)]'}`}>
                Documents
             </button>
             <button onClick={() => setActiveTab('trends')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'trends' ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-muted hover:text-[var(--color-text)]'}`}>
                Trends & Charts
             </button>
          </div>
        </div>
        <button onClick={() => onNavigateToUpload && onNavigateToUpload()} className="px-6 py-3 rounded-[14px] text-xs font-bold uppercase tracking-widest transition-colors bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90 shadow-lg">
          Upload New Report
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-2">
                 {['All', 'Lab Reports', 'Consultations', 'Other'].map(f => (
                    <button key={f} onClick={() => setFilterType(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterType === f ? 'bg-primary text-white' : 'bg-surface text-muted hover:bg-border/50 border border-border'}`}>
                       {f}
                    </button>
                 ))}
              </div>
              <div className="relative w-full sm:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                 <input 
                    type="text" 
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
                 filteredReports.map((report) => <ReportCard key={report.id} report={report} />)
              ) : (
                 <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] p-12 text-center flex flex-col items-center">
                 <div className="w-20 h-20 bg-[var(--color-bg)] rounded-full flex items-center justify-center mb-6">
                    <Filter className="w-10 h-10 text-[var(--color-text-muted)]" strokeWidth={1} />
                 </div>
                 <h3 className="section-title mb-2 text-[var(--color-text)]">No matches found</h3>
                 <p className="text-[var(--color-text-muted)] text-sm mb-8 max-w-sm">
                    {reports.length === 0 ? "Upload your first medical report to unleash Aura AI's insights and start tracking your health trends." : "Try adjusting your filters or search terms."}
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
      ) : (
        <div className="space-y-8">
           <LabTrendChart reports={reports} />
        </div>
      )}

      <div className="pt-8 mt-12 border-t border-[var(--color-border)] opacity-40 text-center">
        <p className="text-[10px] text-[var(--color-text-faint)] font-mono uppercase tracking-[0.15em]">
          Built by <span className="text-[var(--color-text-muted)]">Aniket Dhuri</span> · Powered by Gemini AI
        </p>
      </div>
    </div>
  );
}
