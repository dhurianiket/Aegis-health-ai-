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
import { trackStorageUsage } from "../../services/usageService";
import {
  saveDocument,
  saveLabResult,
  saveMedication,
} from "../../lib/firebase/firestore";
import NoteAnalyzer from "./NoteAnalyzer";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useClinicalContext } from "../../hooks/useClinicalContext";
import { MedicationStatus, LabStatus } from "../../types/medical";
import { useToast } from "../../context/ToastContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../lib/firebase/config";
import { getRecaptchaToken } from "../../utils/recaptcha";

const EXTRACTION_STEPS = [
  { id: 1, label: 'Uploading...', duration: 1000 },
  { id: 2, label: 'Extracting with AI...', duration: 8000 },
  { id: 3, label: 'Saving...', duration: 2000 },
  { id: 4, label: 'Done ✅', duration: 500 },
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

      if (import.meta.env.DEV) console.log("[Upload Stage 1] File size:", file.size, "bytes");
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
  const { contextString } = useClinicalContext();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"files" | "notes">("files");
  const [fileQueue, setFileQueue] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [confirmedLabIndices, setConfirmedLabIndices] = useState<Set<string>>(
    new Set(),
  );
  const [processingStep, setProcessingStep] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("Reading your report...");

  useEffect(() => {
    if (!isProcessing) {
      setProcessingStep(0);
      setProcessingMessage("Reading your report...");
      return;
    }
    
    const messages = [
      "Reading your report...",
      "Identifying lab values...",
      "Checking reference ranges...",
      "Preparing your analysis...",
      "Almost done..."
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setProcessingMessage(messages[idx]);
    }, 2000);
    
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
    if (hasSynced || isSyncing || !results || results.length === 0) return;
    if (!user) {
      showToast("Sign in to save records", "error");
      return;
    }

    const hasLabs = results.some((r) => r.lab_values?.length > 0);
    if (hasLabs && confirmedLabIndices.size === 0) {
      showToast("Select at least one lab value to save", "warning");
      return;
    }

    setIsSyncing(true);
    setHasSynced(true);
    console.log('[Sync] Starting vault sync for', results.length, 'reports');
    console.log('[Sync] Auth UID:', user?.uid);
    
    try {
      const userId = user.uid;
      let totalSavedDocs = 0;
      let totalSavedLabs = 0;

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
        totalSavedDocs++;

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
          totalSavedLabs += savedCount;
          console.log(`[Sync] Saved ${savedCount} lab values for ${result.fileName}`);
        }
      }

      console.log(`[Sync] Completed successfully: ${totalSavedDocs} docs, ${totalSavedLabs} labs`);
      showToast("Report saved to health vault ✓", "success");
      window.location.hash = "home";
    } catch (error: any) {
      console.error("[Sync Stage 4] Database write FAILED:", error);
      console.error("[Sync] Failed:", error);
      showToast(`Sync failed: ${error.message || 'Unknown error'}`, "error");
    } finally {
      setIsSyncing(false);
    }
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

    const token = await getRecaptchaToken("upload");
    if (!token) {
      showToast("Security verification failed. Please try again.", "error");
      setIsProcessing(false);
      return;
    }

    showToast("Processing your reports...", "info");
    const allExtractions: any[] = [];
    
    try {
      const itemsToProcess = fileQueue.filter(i => i.status !== 'done');
      let currentIdx = 0;
      for (const item of itemsToProcess) {
        currentIdx++;
        
        setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f));
        
        try {
          // Status 1: Uploading...
          setProcessingStep(0);
          
          // Generate deterministic ID
          const stableIdString = `${item.file.name}_${item.file.size}_${item.file.lastModified}`;
          const stableId = `doc_${btoa(unescape(encodeURIComponent(stableIdString))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;
          
          // Step 1: uploadBytes
          const storagePath = `users/${user.uid}/documents/${stableId}_${item.file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
          const fileRef = ref(storage, storagePath);
          await uploadBytes(fileRef, item.file);

          // Step 2: getDownloadURL
          const fileUrl = await getDownloadURL(fileRef);
          
          setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, progress: 33 } : f));

          // Status 2: Extracting with AI...
          setProcessingStep(1);

          let fileData;
          let extraction: any;

          try {
            // Step 3: Read file as base64 for Gemini inline data
            fileData = await readFileAsSafeBase64(item.file);

            // Step 4: Call extractMedicalReports (which uses safeGeminiCall under the hood)
            extraction = await extractMedicalReports([fileData], contextString);

            if (!extraction || Object.keys(extraction).length === 0) {
              throw new Error(
                "Could not extract data from this document. " +
                "Please ensure it is a clear medical report and try again."
              );
            }
          } catch (extractErr) {
            console.error("Extraction failed:", extractErr);
            showToast("Failed to extract document", "error");
            setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
            continue;
          }
          
          if (extraction && typeof extraction === 'object') {
             extraction.url = extraction.url || "";
             extraction.id = extraction.id || "";
          }
          
          // Status 3: Saving...
          setProcessingStep(2);
          setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, progress: 80 } : f));

          const result = {
            ...extraction,
            fileName: item.file.name,
            fileUrl,
            storagePath
          };
          if (result.lab_values) {
            result.lab_values = result.lab_values.map((l: any) => ({
              ...l,
              date: l.date || result.date || new Date().toISOString(),
            }));
          }

          // Step 5: setDoc with extracted data
          const docId = await saveDocument(user.uid, {
            id: stableId,
            fileName: result.fileName,
            type: result.document_type || "Unknown Type",
            date: result.date || new Date().toISOString(),
            hospitalName: result.hospital_name || "Unknown",
            doctorName: result.doctor_name || "Unknown",
            extractedData: result,
            profileId: activeProfile?.id,
            fileUrl: result.fileUrl,
            storagePath: result.storagePath,
          });

          // Track storage usage
          try {
             trackStorageUsage(user.uid, item.file.size).catch(e => console.error(e));
          } catch(e) {}

          if (result.lab_values && result.lab_values.length > 0) {
            for (let i = 0; i < result.lab_values.length; i++) {
              const lab = result.lab_values[i];
              await saveLabResult(user.uid, {
                id: `${stableId}_lab_${i}`,
                docId: stableId,
                date: lab.date,
                markerName: lab.marker || "Unknown",
                value: isNaN(parseFloat(lab.value)) ? 0 : parseFloat(lab.value),
                unit: lab.unit || "",
                referenceRange: lab.reference_range || "",
                status: (lab.status as LabStatus) || LabStatus.NORMAL,
                profileId: activeProfile?.id,
              });
            }
          }

          if (result.medications && result.medications.length > 0) {
            for (let i = 0; i < result.medications.length; i++) {
              const med = result.medications[i];
              const medName = typeof med === 'string' ? med : (med.name || "Unknown");
              await saveMedication(user.uid, {
                id: `${stableId}_med_${i}`,
                name: medName,
                dosage: typeof med === 'object' ? (med.dose || med.dosage || "") : "",
                frequency: typeof med === 'object' ? (med.frequency || "") : "",
                status: MedicationStatus.ACTIVE,
                startDate: result.date || new Date().toISOString().split("T")[0],
                profileId: activeProfile?.id,
              });
            }
          }
          
          setProcessingStep(3);
          setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done', progress: 100 } : f));
          allExtractions.push(result);
          
        } catch (err: any) {
          console.error('[Upload] Processing error:', err);
          setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
          showToast(`Error processing ${item.file.name}: ${err.message || "Failed to process"}`, "error");
        }

        // Delay between sequence
        if (currentIdx < itemsToProcess.length) {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      if (allExtractions.length > 0) {
        showToast("Extraction complete", "success");
        setFileQueue([]);
        setResults(allExtractions);
        setProcessingStep(4);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    // Add file size check (max 4MB)
    const validFiles = [];
    for (const file of acceptedFiles) {
      if (file.size > 4 * 1024 * 1024) {
        showToast(`File too large: ${file.name} (Max 4MB)`, "error");
      } else {
        validFiles.push(file);
      }
    }
    
    if (validFiles.length === 0) return;

    const newFiles = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending' as const,
      progress: 0
    }));
    setFileQueue((prev) => [...prev, ...newFiles]);
  }, [showToast]);

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
                ? "bg-[var(--color-primary)] text-slate-900 font-bold shadow-sm"
                : "text-muted hover:text-theme"
            }`}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors ${
              activeTab === "notes"
                ? "bg-[var(--color-primary)] text-slate-900 font-bold shadow-sm"
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
                <input {...getInputProps()} aria-label="Upload medical records or patient data" />
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

              <div className="flex flex-col items-center justify-center gap-4 mt-2">
                <div className="flex items-center justify-center gap-2 text-muted">
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <span className="text-xs">Reports are encrypted, processed securely, and kept strictly private.</span>
                </div>
                <button 
                  onClick={() => console.log('Sample report feature coming soon.')}
                  className="px-6 py-2 bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-xs rounded-full font-semibold transition-all inline-flex items-center gap-2"
                >
                  🔎 Try with a Sample Report
                </button>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  This site is protected by reCAPTCHA and the Google{' '}
                  <a className="text-blue-500 hover:underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> and{' '}
                  <a className="text-blue-500 hover:underline" href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Terms of Service</a> apply.
                </p>
              </div>

              {fileQueue.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase tracking-widest text-muted">Queue ({fileQueue.length})</h4>
                    {!isProcessing && (
                      fileQueue.every(f => f.status === 'error') ? (
                        <button 
                           onClick={() => setFileQueue([])}
                           className="px-6 py-2 bg-red-500 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-2"
                        >
                           <RefreshCw size={14} /> Try Uploading Again
                        </button>
                      ) : fileQueue.some(f => f.status === 'pending' || f.status === 'error') ? (
                        <button 
                           onClick={startProcessingQueue}
                           className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-full text-xs font-bold shadow-lg"
                        >
                           Extract Data →
                        </button>
                      ) : null
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
              
              <div className="flex justify-center mb-8">
                 <Loader2 className="w-16 h-16 text-[var(--color-primary)] animate-spin opacity-80" strokeWidth={1.5} />
              </div>

              <h3 className="text-xl font-bold mb-2">Analyzing Health Intelligence</h3>
              <p className="text-sm text-muted">
                 Usually takes 15-30 seconds per file.
                 {fileQueue.length > 1 && fileQueue.filter(f => f.status === 'done' || f.status === 'error').length < fileQueue.length && (
                   <span className="block mt-1 text-[var(--color-primary)] font-semibold">
                     Processing {fileQueue.filter(f => f.status === 'done' || f.status === 'error').length + 1} of {fileQueue.length}...
                   </span>
                 )}
              </p>
              
              <AnimatePresence mode="wait">
                <motion.p
                  key={processingMessage}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-6 text-[var(--color-primary)] font-medium text-sm h-6"
                >
                  {processingMessage}
                </motion.p>
              </AnimatePresence>
            </div>
          )}

          {results && results.length > 0 && !isProcessing && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                 <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                 </motion.div>
                 <h3 className="text-2xl font-bold mb-2">Extraction complete</h3>
                 <p className="text-muted">
                    Successfully extracted {results.reduce((acc, r) => acc + (r.lab_values?.length || 0), 0)} lab values and saved to your health vault.
                 </p>
                 {results.reduce((acc, r) => acc + (r.lab_values?.length || 0), 0) === 0 && (
                    <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm max-w-lg text-left inline-flex">
                       <AlertCircle className="shrink-0 w-5 h-5 mr-3 mt-0.5" />
                       <span>We couldn't read any numeric lab values from this file. It was saved to your vault, but dashboards and charts may stay empty.</span>
                    </div>
                 )}
                 <div className="flex items-center gap-4 mt-8">
                    <button
                       onClick={() => {
                          setResults(null);
                          setFileQueue([]);
                          setProcessingStep(0);
                       }}
                       className="px-6 py-3 rounded-xl border border-surface hover:bg-surface text-sm font-semibold transition-all"
                    >
                       Upload Another
                    </button>
                    <button
                       onClick={() => window.location.hash = "reports"}
                       className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90 shadow-lg text-sm font-semibold transition-all"
                    >
                       View in Reports
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-8 mt-8">
                {results.map((result: any, extIndex: number) => (
                  <div key={extIndex} className="space-y-6 bg-surface/30 p-6 rounded-[24px] border border-surface">
                    <div className="flex items-center gap-2 mb-4">
                       <FileText size={20} className="text-[var(--color-primary)]" />
                       <span className="font-bold">{result.fileName}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                       <div>
                          <p className="text-xs text-muted font-semibold uppercase">Document Type</p>
                          <p className="font-medium text-sm mt-1">{result.document_type || "N/A"}</p>
                       </div>
                       <div>
                          <p className="text-xs text-muted font-semibold uppercase">Date</p>
                          <p className="font-medium text-sm mt-1">{result.date || "N/A"}</p>
                       </div>
                       <div>
                          <p className="text-xs text-muted font-semibold uppercase">Doctor</p>
                          <p className="font-medium text-sm mt-1">{result.doctor_name || "N/A"}</p>
                       </div>
                       <div>
                          <p className="text-xs text-muted font-semibold uppercase">Hospital</p>
                          <p className="font-medium text-sm mt-1">{result.hospital_name || "N/A"}</p>
                       </div>
                    </div>

                    {result.summary && (
                      <div className="bg-[var(--color-bg)] p-4 rounded-xl mb-6">
                         <p className="text-sm font-medium">Findings:</p>
                         <p className="text-sm text-muted mt-1">{result.summary}</p>
                      </div>
                    )}

                    {result.medications && result.medications.length > 0 && (
                      <div className="mb-6">
                         <p className="text-sm font-medium mb-2">Medications Found:</p>
                         <div className="flex flex-wrap gap-2">
                            {result.medications.map((m: any, i: number) => (
                               <span key={i} className="px-3 py-1 bg-surface rounded-full text-xs font-semibold">
                                  {m.name || m} {m.dosage && `- ${m.dosage}`}
                               </span>
                            ))}
                         </div>
                      </div>
                    )}

                    {result.lab_values && result.lab_values.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-normal break-words">
                          <thead className="bg-[var(--color-bg)] text-muted text-[11px] uppercase tracking-widest font-semibold border-b border-surface">
                            <tr>
                              <th className="px-4 py-3 rounded-tl-xl">Marker</th>
                              <th className="px-4 py-3 text-right">Value</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 rounded-tr-xl">Range</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface text-theme">
                            {result.lab_values.map((m: any, i: number) => {
                              const isHigh = m.status?.toLowerCase() === 'high' || m.status?.toLowerCase() === 'abnormal';
                              const isLow = m.status?.toLowerCase() === 'low';
                              const isNormal = m.status?.toLowerCase() === 'normal';
                              return (
                                <tr key={i} className="hover:bg-surface/50">
                                  <td className="px-4 py-3 font-medium">{m.marker}</td>
                                  <td className="px-4 py-3 text-right font-medium">
                                     {m.value} <span className="text-muted text-xs font-normal ml-0.5">{m.unit}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                     <span className={`px-2 py-1 flex items-center w-fit rounded text-[10px] uppercase font-bold tracking-wider ${
                                        isHigh ? 'bg-red-500/10 text-red-500' :
                                        isLow ? 'bg-orange-500/10 text-orange-500' :
                                        isNormal ? 'bg-emerald-500/10 text-emerald-500' :
                                        'bg-slate-500/10 text-slate-500'
                                     }`}>
                                        {m.status || 'UNKNOWN'}
                                     </span>
                                  </td>
                                  <td className="px-4 py-3 text-muted text-xs">{m.reference_range || '-'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
