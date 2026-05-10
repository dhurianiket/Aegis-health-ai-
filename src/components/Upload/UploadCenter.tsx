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

export default function UploadCenter({
  onOpenChat,
}: {
  onOpenChat?: () => void;
}) {
  const { user, signIn } = useAuth();
  const { activeProfile } = useProfile();
  const [activeTab, setActiveTab] = useState<"files" | "notes">("files");
  const [files, setFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [confirmedLabIndices, setConfirmedLabIndices] = useState<Set<string>>(
    new Set(),
  );
  const [syncMessage, setSyncMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [processingStep, setProcessingStep] = useState(0);

  const processingSteps = [
    "Reading document structure...",
    "Extracting clinical entities...",
    "Harmonizing reference ranges...",
    "Finalizing structured schema...",
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setProcessingStep((prev) => (prev + 1) % processingSteps.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isProcessing, processingSteps.length]);

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
    setSyncMessage(null);
    if (!results || results.length === 0) return;

    if (!user) {
      setSyncMessage({
        type: "error",
        text: "Please sign in to save records.",
      });
      return;
    }

    const hasLabs = results.some((r) => r.lab_values?.length > 0);
    if (hasLabs && confirmedLabIndices.size === 0) {
      setSyncMessage({
        type: "error",
        text: "Select at least one lab value to save.",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const userId = user.uid;

      for (const [extIndex, result] of results.entries()) {
        const docId = await saveDocument(userId, {
          fileName: result.fileName || "Document",
          type: result.document_type || "Unknown Type",
          date: result.date || new Date().toISOString(),
          hospitalName: result.hospital_name || "Unknown",
          doctorName: result.doctor_name || "Unknown",
          extractedData: result,
          profileId: activeProfile?.id,
        });

        if (result.lab_values && result.lab_values.length > 0) {
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
            }
          }
        }
      }

      setSyncMessage({ type: "success", text: "Saved to Clinical Vault" });
      setTimeout(() => {
        setResults(null);
        setConfirmedLabIndices(new Set());
        setFiles([]);
        setSyncMessage(null);
      }, 2000);
    } catch (error) {
      setSyncMessage({ type: "error", text: "Upload failed." });
    } finally {
      setIsSyncing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setResults(null);
    setConfirmedLabIndices(new Set());
    setSyncMessage(null);

    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    setIsProcessing(true);
    setProcessingStep(0);

    try {
      const processFile = async (f: any, index: number) => {
        try {
          const fileData = await new Promise<{
            base64Data: string;
            mimeType: string;
          }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64Data = (reader.result as string).split(",")[1];
              resolve({ base64Data, mimeType: f.file.type });
            };
            reader.onerror = reject;
            reader.readAsDataURL(f.file);
          });

          const extraction = await extractMedicalReports([fileData]);
          if (!extraction) return null;

          const result = {
            ...extraction,
            fileName: f.file.name,
          };

          if (result.lab_values) {
            result.lab_values = result.lab_values.map((l: any) => ({
              ...l,
              date: l.date || result.date,
            }));
          }
          return result;
        } catch (err) {
          return null;
        }
      };

      const extractions = await Promise.all(
        newFiles.map((f, i) => processFile(f, i)),
      );
      const validExtractions = extractions.filter(Boolean) as any[];

      if (validExtractions.length > 0) {
        setResults(validExtractions);
        const initialConfirmed = new Set<string>();
        validExtractions.forEach((ext, extIndex) => {
          if (ext.lab_values && ext.lab_values.length > 0) {
            ext.lab_values.forEach((_: any, labIndex: number) => {
              initialConfirmed.add(`${extIndex}-${labIndex}`);
            });
          }
        });
        setConfirmedLabIndices(initialConfirmed);
      }
    } catch (err) {
      console.error("General upload error:", err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpeg", ".jpg", ".png"],
    },
  } as any);

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0 pb-24">
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
          {!isProcessing && !results && (
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
                <CloudUpload
                  className="w-8 h-8 text-[var(--color-primary)]"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="section-title mb-2">Upload Report</h3>
              <p className="text-muted text-sm mb-6 max-w-sm text-center">
                Drag a PDF, JPEG, or PNG here, or click to browse files.
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="glass-card flex flex-col items-center justify-center py-24 px-6 text-center">
              <Loader2
                className="w-8 h-8 animate-spin text-[var(--color-primary)] mb-6"
                strokeWidth={2}
              />
              <h3 className="text-lg font-medium mb-2">Processing</h3>
              <div className="h-6 relative overflow-visible w-full flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={processingStep}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="text-sm text-muted text-center absolute"
                  >
                    {processingSteps[processingStep]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          )}

          {results && results.length > 0 && !isProcessing && (
            <div className="glass-card overflow-hidden flex flex-col relative">
              <div className="flex justify-between items-center px-6 py-4 bg-surface/50 border-b border-surface shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <h3 className="font-semibold">Review Extraction</h3>
                </div>
                <button
                  onClick={() => {
                    setResults(null);
                    setFiles([]);
                    setConfirmedLabIndices(new Set());
                  }}
                  className="text-muted hover:text-theme transition-colors p-2 rounded-full focus:outline-none hover:bg-surface"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[600px]">
                {results.map((result: any, extIndex: number) => (
                  <div key={extIndex} className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xl font-semibold mb-1">
                          {result.document_type?.replace("_", " ") ||
                            "Medical Report"}
                        </h4>
                        <p className="text-sm text-muted">
                          {result.date || "N/A"} •{" "}
                          {result.hospital_name || "Lab"}
                        </p>
                      </div>
                    </div>

                    {result.lab_values?.length > 0 && (
                      <div className="border border-surface rounded-[24px] overflow-hidden">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-surface/50 text-muted text-[11px] uppercase tracking-widest font-semibold border-b border-surface">
                            <tr>
                              <th className="px-5 py-3 w-12 rounded-tl-[24px]">
                                Verify
                              </th>
                              <th className="px-5 py-3">Metric</th>
                              <th className="px-5 py-3 text-right">Value</th>
                              <th className="px-5 py-3">Ref</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface">
                            {result.lab_values.map((m: any, i: number) => {
                              const isConfirmed = confirmedLabIndices.has(
                                `${extIndex}-${i}`,
                              );
                              const isCritical =
                                m.status === "critical" ||
                                m.status === "abnormal";
                              return (
                                <tr
                                  key={i}
                                  className={`transition-colors ${!isConfirmed ? "opacity-50 grayscale bg-surface/20" : "hover:bg-surface/30"} ${isConfirmed && isCritical ? "bg-[var(--color-warning)]/5" : ""}`}
                                >
                                  <td className="px-5 py-4 w-12 text-center">
                                    <button
                                      onClick={() =>
                                        toggleLabConfirmation(
                                          `${extIndex}-${i}`,
                                        )
                                      }
                                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors mx-auto ${
                                        isConfirmed
                                          ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                                          : "border-muted hover:border-theme"
                                      }`}
                                    >
                                      {isConfirmed && (
                                        <Check
                                          size={14}
                                          className="text-white"
                                          strokeWidth={3}
                                        />
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-5 py-4 font-medium text-theme">
                                    {m.marker}
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <span
                                      className={`text-base font-semibold ${isConfirmed && isCritical ? "text-[var(--color-warning)]" : ""}`}
                                    >
                                      {m.value}
                                    </span>
                                    <span className="text-muted ml-1 text-xs">
                                      {m.unit}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-muted text-xs">
                                    {m.reference_range}
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

              <div className="p-6 border-t border-surface bg-surface/30 shrink-0">
                {syncMessage && (
                  <div
                    className={`p-3 rounded-[12px] text-sm text-center mb-4 ${syncMessage.type === "error" ? "bg-[var(--color-critical)]/10 text-[var(--color-critical)]" : "bg-[var(--color-success)]/10 text-[var(--color-success)]"}`}
                  >
                    {syncMessage.text}
                  </div>
                )}
                <button
                  onClick={handleSync}
                  disabled={isSyncing || confirmedLabIndices.size === 0}
                  className="w-full h-14 rounded-full bg-[var(--color-primary)] text-white font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isSyncing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Save to Vault"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
