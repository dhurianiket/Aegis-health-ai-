import React, { useState, useCallback, useEffect, useMemo } from "react";
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
  Sparkles,
  Mic,
  MicOff,
  Filter,
  Volume2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building,
  Tag,
  Plus,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { extractMedicalReports } from "../../services/ai/gemini";
import { trackStorageUsage } from "../../services/usageService";
import {
  saveDocument,
  saveLabResult,
  saveMedication,
  getDocuments,
  deleteDocumentRecord,
} from "../../lib/firebase/firestore";
import NoteAnalyzer from "./NoteAnalyzer";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useClinicalContext } from "../../hooks/useClinicalContext";
import { MedicationStatus, LabStatus } from "../../types/medical";
import { useToast } from "../../context/ToastContext";
import { getSourceForMarker, getUrgencyAndNextStep } from "../../services/sourceGroundedService";
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

/**
 * Compresses images > 4MB using HTML5 Canvas
 */
const compressImageIfNeeded = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.size <= 4 * 1024 * 1024) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const maxDim = 2048;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
};

const readFileAsSafeBase64 = async (file: File): Promise<{
  base64Data: string;
  mimeType: string;
}> => {
  let fileToRead = file;
  if (file.type.startsWith("image/") && file.size > 4 * 1024 * 1024) {
    try {
      fileToRead = await compressImageIfNeeded(file);
    } catch (e) {
      console.warn("Failed to compress image before reading:", e);
    }
  }

  return new Promise((resolve, reject) => {
    const mimeType = getMimeType(fileToRead);

    if (fileToRead.size > 4 * 1024 * 1024) {
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

      if (import.meta.env.DEV) console.log("[Upload Stage 1] File size:", fileToRead.size, "bytes");
      if (import.meta.env.DEV) console.log("[Upload Stage 1] Base64 start:", base64Data.substring(0, 100));
      if (import.meta.env.DEV) console.log("[Safari Upload] MIME:", mimeType);
      if (import.meta.env.DEV) console.log("[Safari Upload] Base64 length:", base64Data.length);
      if (import.meta.env.DEV) console.log("[Safari Upload] Valid:", base64Data.length > 100);

      resolve({ base64Data, mimeType });
    };

    reader.onerror = (e) => {
      clearTimeout(timeout);
      console.error("[Safari Upload] FileReader error:", e);
      reject(new Error("Could not read file - hardware or browser error"));
    };

    reader.readAsDataURL(fileToRead);
  });
};

export function generateSuggestedTags(extracted: any, fileName: string = ""): string[] {
  const tagsSet = new Set<string>();
  const textToScan = [
    fileName,
    extracted?.type,
    extracted?.document_type,
    extracted?.summary,
    extracted?.hospital_name,
    extracted?.doctor_name,
    ...(extracted?.lab_values || []).map((l: any) => `${l.marker || ''} ${l.testName || ''}`),
    ...(extracted?.medications || []).map((m: any) => typeof m === 'string' ? m : `${m.name || ''}`)
  ].filter(Boolean).join(" ").toLowerCase();

  // 1. Blood Test & Lab Reports
  if (
    /cbc|blood|lipid|cholesterol|hemoglobin|glucose|hba1c|thyroid|tsh|platelet|wbc|rbc|serum|creatinine|electrolytes|panel|lab|metabolic|liver|lft|kft|kidney/.test(textToScan)
  ) {
    tagsSet.add("Blood Test");
    tagsSet.add("Lab Report");
  }

  // 2. MRI
  if (/mri|magnetic resonance|brain scan|spine scan|t1-weighted|t2-weighted/.test(textToScan)) {
    tagsSet.add("MRI");
    tagsSet.add("Radiology");
  }

  // 3. CT Scan
  if (/ct scan|computed tomography|axial ct|contrast ct/.test(textToScan)) {
    tagsSet.add("CT Scan");
    tagsSet.add("Radiology");
  }

  // 4. X-Ray
  if (/x-ray|xray|radiograph|chest film|radiology/.test(textToScan)) {
    tagsSet.add("X-Ray");
    tagsSet.add("Radiology");
  }

  // 5. Ultrasound / Sonography
  if (/ultrasound|usg|sonography|echocardiogram|echo/.test(textToScan)) {
    tagsSet.add("Ultrasound");
    tagsSet.add("Imaging");
  }

  // 6. Prescription / Medications
  if (
    (extracted?.medications && extracted.medications.length > 0) ||
    /prescription|rx|tablet|capsule|dosage|mg|daily|pharmacy/.test(textToScan)
  ) {
    tagsSet.add("Prescription");
  }

  // 7. Discharge Summary
  if (/discharge|inpatient|admission|hospital stay|discharge summary/.test(textToScan)) {
    tagsSet.add("Discharge Summary");
  }

  // 8. Clinical Notes
  if (/consultation|doctor note|clinical note|outpatient|chief complaint/.test(textToScan)) {
    tagsSet.add("Clinical Notes");
  }

  // 9. Cardiology
  if (/cardiolog|ecg|ekg|troponin|heart|blood pressure|hypertension|coronary/.test(textToScan)) {
    tagsSet.add("Cardiology");
  }

  // 10. Endocrinology
  if (/endocrinolog|diabetes|hba1c|insulin|thyroid|t3|t4|cortisol/.test(textToScan)) {
    tagsSet.add("Endocrinology");
  }

  if (tagsSet.size === 0) {
    tagsSet.add("Medical Record");
  }

  return Array.from(tagsSet);
}

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
  const [activeTab, setActiveTab] = useState<"files" | "notes" | "search">("files");
  const [fileQueue, setFileQueue] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  // Voice Document Search states
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceHelpOpen, setVoiceHelpOpen] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("All");

  // Speech Recognition API
  const SpeechRecognitionAPI = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const isSpeechSupported = !!SpeechRecognitionAPI;

  const handleVoiceCommand = useCallback((spokenText: string) => {
    const cleanText = spokenText.toLowerCase().trim();
    
    if (cleanText === "clear" || cleanText === "clear search" || cleanText === "reset" || cleanText === "reset search") {
      setSearchQuery("");
      showToast("Search cleared", "success");
      return;
    }
    
    if (cleanText === "show high" || cleanText === "high") {
      setSearchQuery("high");
      showToast("Filtering for 'high' status values", "success");
      return;
    }
    if (cleanText === "show low" || cleanText === "low") {
      setSearchQuery("low");
      showToast("Filtering for 'low' status values", "success");
      return;
    }
    if (cleanText === "show abnormal" || cleanText === "abnormal") {
      setSearchQuery("abnormal");
      showToast("Filtering for 'abnormal' status values", "success");
      return;
    }
    if (cleanText === "show critical" || cleanText === "critical") {
      setSearchQuery("critical");
      showToast("Filtering for 'critical' status values", "success");
      return;
    }

    let query = spokenText;
    if (cleanText.startsWith("search for ")) {
      query = spokenText.substring(11);
    } else if (cleanText.startsWith("find ")) {
      query = spokenText.substring(5);
    }
    
    setSearchQuery(query);
    showToast(`Searching for "${query}"`, "success");
  }, [showToast]);

  const startVoiceSearch = useCallback(() => {
    if (!isSpeechSupported) {
      showToast("Speech recognition is not supported in this browser.", "error");
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
      };

      recognition.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");
        
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast("Microphone access was denied. Please allow microphone permission in your browser.", "error");
        } else {
          showToast(`Speech recognition error: ${event.error}`, "error");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setTranscript(prev => {
          if (prev.trim()) {
            handleVoiceCommand(prev);
          }
          return prev;
        });
      };

      recognition.start();
      (window as any)._activeRecognition = recognition;
    } catch (e: any) {
      console.error(e);
      showToast("Could not start speech recognition.", "error");
    }
  }, [isSpeechSupported, SpeechRecognitionAPI, showToast, handleVoiceCommand]);

  const stopVoiceSearch = useCallback(() => {
    const activeRec = (window as any)._activeRecognition;
    if (activeRec) {
      activeRec.stop();
    }
    setIsListening(false);
  }, []);

  const loadSearchDocs = useCallback(async () => {
    if (!user || !activeProfile) return;
    setIsLoadingDocs(true);
    try {
      const docs = await getDocuments(user.uid, activeProfile.id);
      setDocuments(docs || []);
    } catch (err) {
      console.error("Error loading documents in search:", err);
      showToast("Failed to load your medical records.", "error");
    } finally {
      setIsLoadingDocs(false);
    }
  }, [user, activeProfile, showToast]);

  const handleDeleteDoc = async (docId: string, fileName: string) => {
    if (!user || !window.confirm(`Are you sure you want to delete ${fileName}?`)) return;
    try {
      await deleteDocumentRecord(user.uid, docId);
      showToast("Document deleted successfully", "success");
      loadSearchDocs();
    } catch (err) {
      console.error("Error deleting document:", err);
      showToast("Failed to delete document", "error");
    }
  };

  useEffect(() => {
    if (activeTab === "search") {
      loadSearchDocs();
    }
  }, [activeTab, loadSearchDocs]);

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
    if (import.meta.env.DEV) console.log('[Sync] Starting vault sync for', results.length, 'reports');
    if (import.meta.env.DEV) console.log('[Sync] Auth UID:', user?.uid);
    
    try {
      const userId = user.uid;
      let totalSavedDocs = 0;
      let totalSavedLabs = 0;

      for (const [extIndex, result] of results.entries()) {
        if (import.meta.env.DEV) console.log('[Sync] Processing report:', result.fileName);
        const suggestedTags = result.tags || result.suggestedTags || generateSuggestedTags(result, result.fileName);
        const docId = await saveDocument(userId, {
          fileName: result.fileName || "Document",
          type: result.document_type || "Unknown Type",
          date: result.date || new Date().toISOString(),
          hospitalName: result.hospital_name || "Unknown",
          doctorName: result.doctor_name || "Unknown",
          extractedData: result,
          tags: suggestedTags,
          suggestedTags: suggestedTags,
          profileId: activeProfile?.id,
          fileUrl: result.fileUrl,
          storagePath: result.storagePath,
        });
        if (import.meta.env.DEV) console.log("[Sync Stage 4] Database doc write SUCCESS for:", result.fileName, "ID:", docId);
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
              if (import.meta.env.DEV) console.log("[Sync Stage 4] Database lab write SUCCESS for:", lab.marker);
              savedCount++;
            }
          }
          totalSavedLabs += savedCount;
          if (import.meta.env.DEV) console.log(`[Sync] Saved ${savedCount} lab values for ${result.fileName}`);
        }
      }

      if (import.meta.env.DEV) console.log(`[Sync] Completed successfully: ${totalSavedDocs} docs, ${totalSavedLabs} labs`);
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
          } catch (extractErr: any) {
            console.error("Extraction failed:", extractErr);
            const errMsg = extractErr?.message || "Failed to extract document";
            showToast(errMsg, "error");
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

          const autoTags = generateSuggestedTags(result, item.file.name);
          result.suggestedTags = autoTags;
          result.tags = autoTags;

          // Step 5: setDoc with extracted data
          const docId = await saveDocument(user.uid, {
            id: stableId,
            fileName: result.fileName,
            type: result.document_type || "Unknown Type",
            date: result.date || new Date().toISOString(),
            hospitalName: result.hospital_name || "Unknown",
            doctorName: result.doctor_name || "Unknown",
            extractedData: result,
            tags: autoTags,
            suggestedTags: autoTags,
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

  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    // Add file size check (max 4MB) with auto-compression for photo payloads
    const validFiles: File[] = [];
    for (const file of acceptedFiles) {
      let fileToUse = file;
      if (file.type.startsWith("image/") && file.size > 4 * 1024 * 1024) {
        try {
          fileToUse = await compressImageIfNeeded(file);
        } catch (err) {
          console.warn("[UploadCenter] Compression failed, proceeding with original:", err);
        }
      }

      if (fileToUse.size > 4 * 1024 * 1024) {
        showToast(`File too large: ${file.name} (Max 4MB)`, "error");
      } else {
        validFiles.push(fileToUse);
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

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await onDrop(Array.from(files));
    }
    if (e.target) e.target.value = "";
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpeg", ".jpg", ".png"],
    },
  } as any);

  const filteredDocuments = useMemo(() => {
    return documents.filter((docItem: any) => {
      const docTags = docItem.tags || docItem.suggestedTags || generateSuggestedTags(docItem.extractedData, docItem.fileName);

      if (selectedTagFilter !== "All" && !docTags.includes(selectedTagFilter)) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      const matchesFileName = docItem.fileName?.toLowerCase().includes(q);
      const matchesDocType = docItem.type?.toLowerCase().includes(q);
      const matchesDoctor = docItem.doctorName?.toLowerCase().includes(q);
      const matchesHospital = docItem.hospitalName?.toLowerCase().includes(q);
      const matchesDate = docItem.date?.toLowerCase().includes(q);
      const matchesTags = docTags.some((t: string) => t.toLowerCase().includes(q));

      // Check inside extracted summary
      const matchesSummary = docItem.extractedData?.summary?.toLowerCase().includes(q);

      // Check inside medications
      const matchesMedications = docItem.extractedData?.medications?.some((m: any) => {
        const name = typeof m === 'string' ? m : (m.name || '');
        return name.toLowerCase().includes(q);
      });

      // Check inside lab values
      const matchesLabs = (docItem.extractedData?.lab_values || docItem.extractedData?.observations || [])?.some((l: any) => {
        const marker = (l.marker || l.testName || '').toLowerCase();
        const status = (l.status || '').toLowerCase();
        return marker.includes(q) || status.includes(q);
      });

      return matchesFileName || matchesDocType || matchesDoctor || matchesHospital || matchesDate || matchesTags || matchesSummary || matchesMedications || matchesLabs;
    });
  }, [documents, selectedTagFilter, searchQuery]);

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
          <button
            onClick={() => setActiveTab("search")}
            className={`px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors ${
              activeTab === "search"
                ? "bg-[var(--color-primary)] text-slate-900 font-bold shadow-sm"
                : "text-muted hover:text-theme"
            }`}
          >
            Voice Search
          </button>
        </div>
      </div>

      {activeTab === "notes" && (
        <NoteAnalyzer />
      )}

      {activeTab === "files" && (
        <div className="flex flex-col gap-6">
          {!results && (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 scale-[1.01]"
                    : "border-surface bg-surface/30 hover:bg-surface/50"
                }`}
              >
                <input {...getInputProps()} aria-label="Upload medical records or patient data" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  className="hidden"
                  onChange={handleCameraCapture}
                />
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
                  {isDragActive ? "Drop files here" : "Upload Reports or Take Photo"}
                </h3>
                <p className="text-muted text-sm mb-6 max-w-sm text-center">
                  Drag PDFs or images here, or click to browse. Take a photo directly on mobile devices.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-full shadow transition-all inline-flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo of Report
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4 mt-2">
                <div className="flex items-center justify-center gap-2 text-muted">
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <span className="text-xs">Reports are encrypted, processed securely, and kept strictly private.</span>
                </div>
                <button 
                  onClick={() => { if (import.meta.env.DEV) console.log('Sample report feature coming soon.') }}
                  className="px-6 py-2 bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-xs rounded-full font-semibold transition-all inline-flex items-center gap-2"
                >
                  🔎 Try with a Sample Report
                </button>
                <p className="text-xs text-slate-300 mt-4 text-center">
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
                              <p className="text-xs text-muted">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {item.status === 'pending' && <Clock className="w-5 h-5 text-muted" />}
                           {item.status === 'processing' && <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />}
                           {item.status === 'done' && <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />}
                           {item.status === 'error' && <AlertCircle className="w-5 h-5 text-[var(--color-critical)]" />}
                           
                           {!isProcessing && (
                             <button onClick={() => removeFileFromQueue(item.id)} aria-label="Remove file" className="p-2 hover:bg-red-500/10 rounded-full text-muted hover:text-red-500">
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

                    {/* AI Suggested Document Tags */}
                    <div className="bg-surface/40 p-3.5 rounded-2xl border border-[var(--color-border)]/20 mb-6">
                       <p className="text-xs font-bold text-theme uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)] animate-pulse" />
                          AI Suggested Document Tags
                       </p>
                       <div className="flex flex-wrap items-center gap-2">
                          {(result.tags || result.suggestedTags || generateSuggestedTags(result, result.fileName)).map((tag: string, tIdx: number) => (
                             <span key={tIdx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
                                <Tag className="w-3.5 h-3.5" />
                                {tag}
                             </span>
                          ))}
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
                          <thead className="bg-[var(--color-bg)] text-muted text-xs uppercase tracking-widest font-semibold border-b border-surface">
                            <tr>
                              <th className="px-4 py-3 rounded-tl-xl w-1/4">Marker</th>
                              <th className="px-4 py-3 text-right w-1/5">Value</th>
                              <th className="px-4 py-3 w-1/5">Status</th>
                              <th className="px-4 py-3 w-1/5">Range</th>
                              <th className="px-4 py-3 rounded-tr-xl w-1/5">Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface text-theme">
                            {result.lab_values.map((m: any, i: number) => {
                              const isHigh = m.status?.toLowerCase() === 'high' || m.status?.toLowerCase() === 'abnormal';
                              const isLow = m.status?.toLowerCase() === 'low';
                              const isNormal = m.status?.toLowerCase() === 'normal';
                              const source = getSourceForMarker(m.marker);
                              const urgency = getUrgencyAndNextStep(m.marker, m.status, m.value);
                              return (
                                <tr key={i} className="hover:bg-surface/50">
                                  <td className="px-4 py-3 font-medium">{m.marker}</td>
                                  <td className="px-4 py-3 text-right font-medium">
                                     {m.value} <span className="text-muted text-xs font-normal ml-0.5">{m.unit}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                     <span className={`px-2 py-1 flex items-center w-fit rounded text-xs uppercase font-bold tracking-wider ${
                                        isHigh ? 'bg-red-500/10 text-red-500' :
                                        isLow ? 'bg-orange-500/10 text-orange-500' :
                                        isNormal ? 'bg-emerald-500/10 text-emerald-500' :
                                        'bg-slate-500/10 text-slate-300'
                                     }`}>
                                        {m.status || 'UNKNOWN'}
                                     </span>
                                  </td>
                                  <td className="px-4 py-3 text-muted text-xs">{m.reference_range || '-'}</td>
                                  <td className="px-4 py-3 text-muted text-xs">
                                     <div className="space-y-1">
                                        {source ? (
                                           <a 
                                              href={source.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-medium"
                                              id={`ref-link-up-${i}`}
                                           >
                                              {source.name}
                                           </a>
                                        ) : (
                                           <span className="text-muted text-xs italic block">reference not available</span>
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
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "search" && (
        <div className="space-y-6">
          {/* Welcome Voice Search Panel */}
          <div className="bg-surface/30 border border-surface rounded-[24px] p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Mic className="w-5 h-5 text-[var(--color-primary)]" />
                  Voice-Activated Vault Search
                </h3>
                <p className="text-muted text-sm mt-1">
                  Search through all your extracted medical records, lab reports, doctor names, and summaries using secure, browser-native voice commands.
                </p>
              </div>
              <button
                onClick={() => setVoiceHelpOpen(!voiceHelpOpen)}
                className="text-xs text-[var(--color-primary)] hover:underline font-medium shrink-0 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {voiceHelpOpen ? "Hide Commands" : "Show Voice Commands"}
              </button>
            </div>

            {/* Expandable Voice Commands Guide */}
            <AnimatePresence>
              {voiceHelpOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-4 pt-4 border-t border-[var(--color-border)]/20"
                >
                  <p className="text-xs font-semibold text-theme mb-2">Available Voice Commands:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-surface/50 p-2.5 rounded-xl border border-[var(--color-border)]/10">
                      <span className="font-bold text-[var(--color-primary)]">Search:</span>
                      <p className="text-[var(--color-text-muted)] mt-0.5">Say "Search for Cholesterol" or "Find Dr. Smith"</p>
                    </div>
                    <div className="bg-surface/50 p-2.5 rounded-xl border border-[var(--color-border)]/10">
                      <span className="font-bold text-[var(--color-primary)]">Abnormal Filters:</span>
                      <p className="text-[var(--color-text-muted)] mt-0.5">Say "Show high", "Show low", or "Show abnormal"</p>
                    </div>
                    <div className="bg-surface/50 p-2.5 rounded-xl border border-[var(--color-border)]/10">
                      <span className="font-bold text-[var(--color-primary)]">Clear:</span>
                      <p className="text-[var(--color-text-muted)] mt-0.5">Say "Reset", "Clear search", or "Reset search"</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactive Voice Search Bar */}
          <div className="flex flex-col gap-3">
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder={isSpeechSupported ? "Search by voice or typing... (Try clicking the mic and saying 'cholesterol')" : "Search by typing..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface/50 border border-surface rounded-[20px] pl-12 pr-16 py-4 text-base text-[var(--color-text)] placeholder-muted focus:outline-none focus:border-[var(--color-primary)]/50 transition-all shadow-inner"
              />
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      showToast("Search cleared", "success");
                    }}
                    className="p-1.5 hover:bg-surface rounded-full text-muted hover:text-theme transition-colors"
                    title="Clear Search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isSpeechSupported ? (
                  <button
                    onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                    className={`p-3 rounded-full transition-all flex items-center justify-center relative ${
                      isListening 
                        ? "bg-red-500 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]" 
                        : "bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20"
                    }`}
                    title={isListening ? "Stop Listening" : "Start Voice Search"}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                ) : (
                  <div className="p-2 text-xs text-muted italic" title="Speech Recognition not supported in this browser.">
                    No Mic
                  </div>
                )}
              </div>
            </div>

            {/* Active Listening / Transcribing Overlay feedback */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 items-end h-3.5">
                      <span className="w-1 bg-red-500 animate-pulse h-2" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1 bg-red-500 animate-pulse h-3.5" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1 bg-red-500 animate-pulse h-3" style={{ animationDelay: "300ms" }}></span>
                      <span className="w-1 bg-red-500 animate-pulse h-1.5" style={{ animationDelay: "450ms" }}></span>
                    </div>
                    <span className="text-xs font-bold text-red-500 uppercase tracking-wider animate-pulse">Listening...</span>
                    <span className="text-sm font-medium text-theme italic truncate max-w-md">
                      {transcript || '"Say something like Cholesterol..."'}
                    </span>
                  </div>
                  <button
                    onClick={stopVoiceSearch}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                  >
                    Done
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick AI Tag Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
              <span className="text-muted font-bold flex items-center gap-1 shrink-0 text-xs uppercase tracking-wider mr-1">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                AI Tags:
              </span>
              {["All", "Blood Test", "Lab Report", "Prescription", "MRI", "CT Scan", "X-Ray", "Ultrasound", "Discharge Summary", "Clinical Notes"].map((tag) => {
                const isSelected = selectedTagFilter === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTagFilter(tag);
                      if (tag !== "All") {
                        showToast(`Filtered by AI tag: ${tag}`, "info");
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full font-semibold transition-all shrink-0 flex items-center gap-1.5 text-xs cursor-pointer ${
                      isSelected
                        ? "bg-[var(--color-primary)] text-slate-950 shadow-sm font-bold"
                        : "bg-surface hover:bg-surface/80 text-muted hover:text-theme border border-[var(--color-border)]/20"
                    }`}
                  >
                    {tag !== "All" && <Tag className="w-3 h-3 opacity-80" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Documents Grid / Stack */}
          {isLoadingDocs ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] mb-4" />
              <p className="text-sm text-muted">Retrieving your health vault documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-16 px-6 text-center">
              <AlertCircle className="w-12 h-12 text-muted mb-4" />
              <h4 className="text-lg font-bold">No matching documents found</h4>
              <p className="text-sm text-muted max-w-md mt-1">
                {searchQuery 
                  ? `We couldn't find any medical records matching "${searchQuery}". Try saying another command, like "Show high" or "Reset search".`
                  : "No medical records have been uploaded for this profile yet."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 bg-surface hover:bg-surface/80 rounded-full border border-border text-xs font-semibold transition-all"
                >
                  Clear search filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted px-2">
                <span className="font-semibold uppercase tracking-wider">
                  Matches found ({filteredDocuments.length})
                </span>
                {searchQuery && (
                  <span className="flex items-center gap-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded-full font-medium">
                    <Filter className="w-3 h-3" /> filter active
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {filteredDocuments.map((docItem) => {
                  const isExpanded = expandedDocId === docItem.id;
                  const ext = docItem.extractedData || {};
                  const docLabs = ext.lab_values || ext.observations || [];
                  const docMeds = ext.medications || [];

                  return (
                    <div 
                      key={docItem.id} 
                      className="bg-surface/20 border border-surface hover:border-[var(--color-border)]/50 rounded-[24px] p-5 transition-all animate-fade-in"
                    >
                      {/* Document Header (click to expand/collapse) */}
                      <div 
                        onClick={() => setExpandedDocId(isExpanded ? null : docItem.id)}
                        className="flex items-start justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-3 rounded-2xl bg-surface/80 shrink-0">
                            <FileText className="w-6 h-6 text-[var(--color-primary)]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-theme truncate md:max-w-xl">
                              {docItem.fileName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted">
                              <span className="flex items-center gap-1 font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/5 px-2 py-0.5 rounded">
                                {docItem.type || "Medical Record"}
                              </span>
                              {docItem.date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {docItem.date}
                                </span>
                              )}
                              {docItem.doctorName && (
                                <span className="flex items-center gap-1">
                                  Dr. {docItem.doctorName}
                                </span>
                              )}
                              {docItem.hospitalName && (
                                <span className="flex items-center gap-1">
                                  <Building className="w-3.5 h-3.5" />
                                  {docItem.hospitalName}
                                </span>
                              )}
                            </div>

                            {/* AI Suggested Tags Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                              <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-1 mr-0.5">
                                <Sparkles className="w-3 h-3 animate-pulse" />
                                Tags:
                              </span>
                              {(docItem.tags || docItem.suggestedTags || generateSuggestedTags(docItem.extractedData, docItem.fileName)).map((tag: string, tIdx: number) => (
                                <button
                                  key={tIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTagFilter(tag);
                                    showToast(`Filtered by tag: ${tag}`, "info");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/20 transition-all cursor-pointer"
                                  title={`Click to filter by '${tag}'`}
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDoc(docItem.id, docItem.fileName);
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-full text-muted hover:text-red-500 transition-all"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="p-1.5 hover:bg-surface rounded-full text-muted">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content View */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mt-4 pt-4 border-t border-[var(--color-border)]/20 space-y-4"
                          >
                            {/* Summary Finding text */}
                            {ext.summary && (
                              <div className="bg-[var(--color-bg)] p-4 rounded-2xl">
                                <p className="text-xs font-semibold text-theme uppercase tracking-wider mb-1">Key AI Findings:</p>
                                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{ext.summary}</p>
                              </div>
                            )}

                            {/* Medications */}
                            {docMeds.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-theme uppercase tracking-wider mb-2">Prescribed Medications:</p>
                                <div className="flex flex-wrap gap-2">
                                  {docMeds.map((m: any, idx: number) => (
                                    <span key={idx} className="px-3 py-1 bg-surface rounded-full text-xs font-semibold border border-[var(--color-border)]/15">
                                      {typeof m === 'string' ? m : `${m.name || ''} ${m.dosage ? `- ${m.dosage}` : ''}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Lab Values Table */}
                            {docLabs.length > 0 ? (
                              <div className="overflow-x-auto rounded-2xl border border-surface">
                                <table className="w-full text-left text-xs whitespace-normal break-words">
                                  <thead className="bg-[var(--color-bg)] text-muted text-xs uppercase tracking-wider font-semibold border-b border-surface">
                                    <tr>
                                      <th className="px-4 py-2.5 rounded-tl-xl w-1/4">Lab Marker</th>
                                      <th className="px-4 py-2.5 text-right w-1/5">Result Value</th>
                                      <th className="px-4 py-2.5 w-1/5">Status</th>
                                      <th className="px-4 py-2.5 w-1/5">Reference Range</th>
                                      <th className="px-4 py-2.5 rounded-tr-xl w-1/5">Source Grounding</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-surface text-theme bg-surface/5">
                                    {docLabs.map((l: any, lIdx: number) => {
                                      const isHigh = l.status?.toLowerCase() === 'high' || l.status?.toLowerCase() === 'abnormal';
                                      const isLow = l.status?.toLowerCase() === 'low';
                                      const isNormal = l.status?.toLowerCase() === 'normal';
                                      const markerName = l.marker || l.testName || '';
                                      const source = getSourceForMarker(markerName);
                                      const urgency = getUrgencyAndNextStep(markerName, l.status, l.value);

                                      return (
                                        <tr key={lIdx} className="hover:bg-surface/20">
                                          <td className="px-4 py-2.5 font-medium">{markerName}</td>
                                          <td className="px-4 py-2.5 text-right font-medium">
                                            {l.value} <span className="text-muted text-xs font-normal ml-0.5">{l.unit}</span>
                                          </td>
                                          <td className="px-4 py-2.5">
                                            <span className={`px-2 py-0.5 flex items-center w-fit rounded text-xs uppercase font-bold tracking-wider ${
                                              isHigh ? 'bg-red-500/10 text-red-500' :
                                              isLow ? 'bg-orange-500/10 text-orange-500' :
                                              isNormal ? 'bg-emerald-500/10 text-emerald-500' :
                                              'bg-slate-500/10 text-slate-300'
                                            }`}>
                                              {l.status || 'UNKNOWN'}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2.5 text-muted">{l.reference_range || l.referenceRange || '-'}</td>
                                          <td className="px-4 py-2.5 text-muted">
                                            <div className="space-y-1">
                                              {source ? (
                                                <a 
                                                  href={source.url} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer" 
                                                  className="text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-medium"
                                                  id={`ref-link-search-${lIdx}`}
                                                >
                                                  {source.name}
                                                </a>
                                              ) : (
                                                <span className="text-muted italic block">reference not available</span>
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
                            ) : (
                              <p className="text-xs text-muted italic">No extracted lab measurements found in this document.</p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
