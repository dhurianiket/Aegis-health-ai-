import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  CloudUpload,
  FileText,
  X,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Brain,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { extractMedicalReports } from "../../services/ai/gemini";
import {
  saveDocument,
  saveLabResult,
  saveMedication,
} from "../../lib/firebase/firestore";
import NoteAnalyzer from "./NoteAnalyzer";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { MedicationStatus, LabStatus } from "../../types/medical";
import { useToast } from "../../context/ToastContext";

const EXTRACTION_STEPS = [
  { id: 1, label: 'Reading document', duration: 1000 },
  { id: 2, label: 'Extracting text', duration: 2000 },
  { id: 3, label: 'AI analyzing report', duration: 8000 },
  { id: 4, label: 'Structuring health data', duration: 2000 },
  { id: 5, label: 'Preparing review', duration: 500 },
];

const getMimeType = (file: File): string => {
  if (file.type && file.type.length > 0) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png'
  };
  return types[ext || ''] || 'application/pdf';
};

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const readFileAsSafeBase64 = (file: File): Promise<{
  base64Data: string;
  mimeType: string;
}> => {
  return new Promise((resolve, reject) => {
    const mimeType = getMimeType(file);

    if (file.size > 4 * 1024 * 1024) {
      reject(new Error("File too large. Maximum 4MB per file."));
      return;
    }

    const reader = new FileReader();

    const timeout = setTimeout(() => {
      reject(new Error("File read timeout (30s exceeded)"));
    }, 30000);

    reader.onloadend = () => {
      clearTimeout(timeout);
      if (reader.readyState !== FileReader.DONE) {
        reject(new Error("FileReader did not complete"));
        return;
      }
      const result = reader.result as string;
      if (!result || !result.includes(",")) {
        reject(new Error("Invalid file data"));
        return;
      }
      const base64Data = result
        .split(",")[1]
        .replace(/\s/g, "")
        .replace(/\r?\n/g, "");

      console.log("[Upload Stage 1] File size:", file.size, "bytes");
      console.log("[Upload Stage 1] Base64 start:", base64Data.substring(0, 100));
      console.log("[Safari Upload] MIME:", mimeType);
      console.log("[Safari Upload] Base64 length:", base64Data.length);
      console.log("[Safari Upload] Valid:", base64Data.length > 100);

      resolve({ base64Data, mimeType });
    };

    reader.onerror = (e) => {
      clearTimeout(timeout);
      console.error("[Safari Upload] FileReader error:", e);
      reject(new Error("Could not read file - hardware or browser error"));
    };

    reader.readAsDataURL(file);
  });
};

interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
}

export default function UploadCenter({
  onOpenChat,
}: {
  onOpenChat?: () => void;
}) {
  const { user, signIn } = useAuth();
  const { activeProfile } = useProfile();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"files" | "notes">("files");
  const [fileQueue, setFileQueue] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [confirmedLabIndices, setConfirmedLabIndices] = useState<Set<string>>(
    new Set(),
  );
  const [processingStep, setProcessingStep] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setProcessingStep((prev) => {
          if (prev < EXTRACTION_STEPS.length - 1) return prev + 1;
          return prev;
        });
      }, 3000);
    } else {
      setProcessingStep(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const toggleLabConfirmation = (indexStr: string) => {
    const newConfirmed = new Set(confirmedLabIndices);
    if (newConfirmed.has(indexStr)) {
      newConfirmed.delete(indexStr);
    } else {
      newConfirmed.add(indexStr);
    }
    setConfirmedLabIndices(newConfirmed);
  };

  const handleSync = async () => {
    if (!results || results.length === 0) return;
    if (!user) {
      showToast("Sign in to save records", "error");
      return;
    }

    const hasLabs = results.some((r) => r.lab_values?.length > 0);
    if (hasLabs && confirmedLabIndices.size === 0) {
      showToast("Select at least one lab value to save", "warning");
      return;
    }

    setIsSyncing(false);
    console.log('[Sync] Starting vault sync for', results.length, 'reports');
    console.log('[Sync] Auth UID:', user?.uid);
    
    // OPTIMISTIC UI
    showToast("Report saved to health vault ✓", "success");
    window.location.hash = "home";
    
    // Sync logic (Background)
    (async () => {
      try {
        const userId = user.uid;
        for (const [extIndex, result] of results.entries()) {
          console.log('[Sync] Processing report:', result.fileName);
          const docId = await saveDocument(userId, {
            fileName: result.fileName || "Document",
            type: result.document_type || "Unknown Type",
            date: result.date || new Date().toISOString(),
            hospitalName: result.hospital_name || "Unknown",
            doctorName: result.doctor_name || "Unknown",
            extractedData: result,
            profileId: activeProfile?.id,
            fileUrl: result.fileUrl,
            storagePath: result.storagePath,
          });
          console.log("[Sync Stage 4] Database doc write SUCCESS for:", result.fileName, "ID:", docId);

          if (result.lab_values && result.lab_values.length > 0) {
            let savedCount = 0;
            for (let i = 0; i < result.lab_values.length; i++) {
              if (confirmedLabIndices.has(`${extIndex}-${i}`)) {
                const lab = result.lab_values[i];
                await saveLabResult(userId, {
                  docId: docId || "unknown",
                  date: lab.date || result.date || new Date().toISOString(),
                  markerName: lab.marker || "Unknown",
                  value: isNaN(parseFloat(lab.value)) ? 0 : parseFloat(lab.value),
                  unit: lab.unit || "",
                  referenceRange: lab.reference_range || "",
                  status: (lab.status as LabStatus) || LabStatus.NORMAL,
                  profileId: activeProfile?.id,
                });
                console.log("[Sync Stage 4] Database lab write SUCCESS for:", lab.marker);
                savedCount++;
              }
            }
            console.log(`[Sync] Saved ${savedCount} lab values for ${result.fileName}`);
          }
        }
      } catch (error: any) {
        console.error("[Sync Stage 4] Database write FAILED:", error);
        console.error("[Sync] Failed:", error);
        showToast(`Sync failed: ${error.message || 'Unknown error'}`, "error");
      }
    })();
  };

  const removeFileFromQueue = (id: string) => {
    setFileQueue(prev => prev.filter(f => f.id !== id));
  };

  const startProcessingQueue = async () => {
    if (fileQueue.length === 0 || isProcessing) return;
    if (!user) {
      showToast("Sign in to process files", "error");
      return;
    }
    
    setIsProcessing(true);
    showToast("Processing your reports...", "info");
    const allExtractions: any[] = [];
    
    for (const item of fileQueue) {
      if (item.status === 'done') continue;
      
      setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f));
      
      try {
        console.log('[Upload] Browser Safari:', isSafari);
        
        // 1. UPLOAD TO STORAGE FIRST (Placeholder)
        const fileUrl = "local://" + Date.now();
        const storagePath = `users/${user.uid}/documents/${item.id}_${item.file.name}`;
        
        setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, progress: 100 } : f));

        // 2. READ FOR AI
        const fileData = await readFileAsSafeBase64(item.file);

        // 3. EXTRACT
        const extraction: any = await extractMedicalReports([fileData]);

        if (!extraction || Object.keys(extraction).length === 0) {
          throw new Error(
            "Could not extract data from this document. " +
            "Please ensure it is a clear medical report and try again."
          );
        }
        
        // Ensure url and id exist, add null/empty checks
        if (extraction && typeof extraction === 'object') {
           extraction.url = extraction.url || "";
           extraction.id = extraction.id || "";
        }
        
        if (extraction) {
          console.log('[Upload] Extraction success for:', item.file.name);
          const result = {
            ...extraction,
            fileName: item.file.name,
            fileUrl: fileUrl || "",
            storagePath
          };
          if (result.lab_values) {
            result.lab_values = result.lab_values.map((l: any) => ({
              ...l,
              date: l.date || result.date,
            }));
          }
          allExtractions.push(result);
          setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done' } : f));
        } else {
          console.error('[Upload] Extraction returned null for:', item.file.name);
          setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
          showToast(`Could not extract data from ${item.file.name}`, 'error');
        }
      } catch (err: any) {
        console.error('[Upload] Processing error:', err);
        setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
        showToast(err.message || "Failed to process file", "error");
      }
    }
    
    if (allExtractions.length > 0) {
      setResults(allExtractions);
      const initialConfirmed = new Set<string>();
      allExtractions.forEach((ext, extIndex) => {
        if (ext.lab_values && ext.lab_values.length > 0) {
          ext.lab_values.forEach((_: any, labIndex: number) => {
            initialConfirmed.add(`${extIndex}-${labIndex}`);
          });
        }
      });
      setConfirmedLabIndices(initialConfirmed);
      showToast("Report extracted successfully ✓", "success");
    }
    setIsProcessing(false);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const newFiles = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending' as const,
      progress: 0
    }));
    setFileQueue((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpeg", ".jpg", ".png"],
    },
  } as any);

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0 pb-24 touch-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ingest</h2>
          <p className="text-muted text-sm mt-1">
            Upload records or paste clinical notes.
          </p>
        </div>
        <div className="flex bg-surface p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("files")}
            className={`px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors ${
              activeTab === "files"
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-muted hover:text-theme"
            }`}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors ${
              activeTab === "notes"
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-muted hover:text-theme"
            }`}
          >
            Text
          </button>
        </div>
      </div>

      {activeTab === "notes" ? (
        <NoteAnalyzer />
      ) : (
        <div className="flex flex-col gap-6">
          {!results && (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-[32px] p-16 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 scale-[1.01]"
                    : "border-surface bg-surface/30 hover:bg-surface/50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-6">
                  {isDragActive ? (
                    <Clock className="w-8 h-8 text-[var(--color-primary)] animate-pulse" />
                  ) : (
                    <CloudUpload
                      className="w-8 h-8 text-[var(--color-primary)]"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <h3 className="section-title mb-2">
                  {isDragActive ? "Drop files here" : "Upload Reports"}
                </h3>
                <p className="text-muted text-sm mb-6 max-w-sm text-center">
                  Drag PDFs or images here, or click to browse. Multiple selection supported.
                </p>
              </div>

              {fileQueue.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase tracking-widest text-muted">Queue ({fileQueue.length})</h4>
                    {!isProcessing && (
                      <button 
                         onClick={startProcessingQueue}
                         className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-full text-xs font-bold shadow-lg"
                      >
                         Extract Data →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fileQueue.map((item) => (
                      <div key={item.id} className="bg-surface p-4 rounded-2xl flex items-center justify-between border border-surface shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-xl bg-[var(--color-bg)]">
                              <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                           </div>
                           <div className="min-w-0">
                              <p className="text-sm font-semibold truncate max-w-[150px]">{item.file.name.substring(0, 20)}</p>
                              <p className="text-[10px] text-muted">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {item.status === 'pending' && <Clock className="w-5 h-5 text-muted" />}
                           {item.status === 'processing' && <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />}
                           {item.status === 'done' && <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />}
                           {item.status === 'error' && <AlertCircle className="w-5 h-5 text-[var(--color-critical)]" />}
                           
                           {!isProcessing && (
                             <button onClick={() => removeFileFromQueue(item.id)} className="p-2 hover:bg-red-500/10 rounded-full text-muted hover:text-red-500">
                                <X className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {isProcessing && (
            <div className="glass-card flex flex-col items-center justify-center py-24 px-6 text-center border-teal-500/30">
              <div className="w-full max-w-md bg-surface h-1 rounded-full mb-12 overflow-hidden">
                 <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (processingStep + 1) / EXTRACTION_STEPS.length }}
                    className="h-full bg-[var(--color-primary)] origin-left"
                 />
              </div>
              
              <div className="grid grid-cols-5 gap-4 mb-12 w-full max-w-md">
                 {EXTRACTION_STEPS.map((step, i) => (
                   <div key={step.id} className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        processingStep > i ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : 
                        processingStep === i ? 'border-[var(--color-primary)] text-[var(--color-primary)] animate-pulse' : 
                        'border-surface text-muted'
                      }`}>
                         {processingStep > i ? <Check size={16} /> : step.id}
                      </div>
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${processingStep === i ? 'text-[var(--color-primary)]' : 'text-muted'}`}>
                        {step.label.split(' ')[0]}
                      </span>
                   </div>
                 ))}
              </div>

              <h3 className="text-xl font-bold mb-2">Analyzing Health Intelligence</h3>
              <p className="text-sm text-muted">Usually takes 15-30 seconds</p>
              
              <AnimatePresence mode="wait">
                <motion.p
                  key={processingStep}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-6 text-[var(--color-primary)] font-medium text-sm"
                >
                  {EXTRACTION_STEPS[processingStep].label}...
                </motion.p>
              </AnimatePresence>
            </div>
          )}

          {results && results.length > 0 && !isProcessing && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/50 p-6 rounded-[32px] border border-surface">
                 <div>
                    <h3 className="text-2xl font-bold">Review Extracted Results</h3>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full text-[10px] font-bold uppercase">
                         {results.reduce((acc, r) => acc + (r.lab_values?.length || 0), 0)} values found
                       </span>
                       <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-bold uppercase">
                         {results.reduce((acc, r) => acc + (r.lab_values?.filter((l: any) => l.status === 'abnormal' || l.status === 'critical').length || 0), 0)} abnormal
                       </span>
                    </div>
                    {results.reduce((acc, r) => acc + (r.lab_values?.length || 0), 0) === 0 && (
                      <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm">
                        <AlertCircle className="inline-block w-4 h-4 mr-2 mb-0.5" />
                        We couldn’t read any numeric lab values from this file. You can still save the document, but dashboards and SBAR may stay empty.
                      </div>
                    )}
                 </div>
                 <button
                    onClick={() => {
                        setResults(null);
                        setFileQueue([]);
                        setConfirmedLabIndices(new Set());
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--color-bg)] hover:bg-surface rounded-2xl text-xs font-bold transition-all border border-surface"
                 >
                    <RefreshCw size={16} /> Re-extract
                 </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {results.map((result: any, extIndex: number) => (
                  <div key={extIndex} className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                       <FileText size={16} className="text-[var(--color-primary)]" />
                       <span className="text-xs font-bold text-muted uppercase tracking-widest">{result.fileName}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Sort: Abnormal values first */}
                      {[...(result.lab_values || [])]
                        .sort((a: any, b: any) => {
                           const aIsAb = a.status === 'abnormal' || a.status === 'critical';
                           const bIsAb = b.status === 'abnormal' || b.status === 'critical';
                           if (aIsAb && !bIsAb) return -1;
                           if (!aIsAb && bIsAb) return 1;
                           return 0;
                        })
                        .map((m: any, i: number) => {
                        const isConfirmed = confirmedLabIndices.has(`${extIndex}-${i}`);
                        const isAbnormal = m.status === 'abnormal' || m.status === 'critical';
                        const isLow = m.status === 'low';
                        const isNormal = m.status === 'normal';
                        
                        return (
                          <div 
                            key={i} 
                            onClick={() => toggleLabConfirmation(`${extIndex}-${i}`)}
                            className={`
                              relative p-5 rounded-[24px] border-l-[6px] transition-all cursor-pointer bg-surface/40 hover:bg-surface/80
                              ${isConfirmed ? 'opacity-100 scale-100 shadow-sm' : 'opacity-40 grayscale scale-[0.98]'}
                              ${isAbnormal ? 'border-l-red-500' : isLow ? 'border-l-orange-500' : isNormal ? 'border-l-emerald-500' : 'border-l-slate-400'}
                            `}
                          >
                             <div className="flex justify-between items-start mb-4">
                               <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                                 isAbnormal ? 'bg-red-500 text-white' : 
                                 isLow ? 'bg-orange-500 text-white' : 
                                 isNormal ? 'bg-emerald-500 text-white' : 
                                 'bg-slate-500 text-white'
                               }`}>
                                 {m.status?.toUpperCase() || 'UNKNOWN'}
                               </span>
                               <button className="text-muted hover:text-theme p-1 rounded-full hover:bg-surface ">
                                  <Search size={14} />
                               </button>
                             </div>
                             
                             <h5 className="font-bold text-theme leading-tight mb-1 truncate">{m.marker}</h5>
                             <div className="flex items-baseline gap-1 mt-2">
                               <span className={`text-xl font-black ${isAbnormal ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-theme'}`}>
                                 {m.value}
                               </span>
                               <span className="text-xs text-muted font-medium">{m.unit}</span>
                             </div>
                             
                             <p className="text-[10px] text-muted font-medium mt-3">
                               REF: <span className="text-theme">{m.reference_range || 'N/A'}</span>
                             </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* STICKY ACTION BAR */}
              <div className="fixed bottom-0 left-0 right-0 md:left-24 p-6 bg-theme/80 backdrop-blur-3xl border-t border-surface z-50 flex justify-center">
                 <div className="w-full max-w-5xl flex gap-4">
                    <button
                      onClick={() => {
                        setResults(null);
                        setFileQueue([]);
                        setConfirmedLabIndices(new Set());
                      }}
                      className="flex-1 h-14 rounded-2xl bg-surface text-theme font-bold hover:bg-surface/80 transition-all border border-surface flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} /> Discard All
                    </button>
                    <button
                      onClick={handleSync}
                      disabled={isSyncing || (results.some((r: any) => r.lab_values?.length > 0) && confirmedLabIndices.size === 0)}
                      className="flex-[2] h-14 rounded-2xl bg-[var(--color-primary)] text-white font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-[var(--color-primary)]/20 disabled:opacity-50"
                    >
                      {isSyncing ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>Confirm & Save to Health Vault <ChevronRight size={18} /></>
                      )}
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
