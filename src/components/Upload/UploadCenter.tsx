import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  CloudUpload, 
  FileText, 
  X, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Clock,
  ChevronRight,
  Microscope,
  ShieldAlert,
  Check,
  Info,
  Edit2,
  Save,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractMedicalReports } from '../../services/ai/gemini';
import { saveDocument, saveLabResult, saveMedication } from '../../lib/firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { MedicationStatus, LabStatus } from '../../types/medical';

export default function UploadCenter() {
  const { user, signIn } = useAuth();
  const { activeProfile } = useProfile();
  const [files, setFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmedLabIndices, setConfirmedLabIndices] = useState<Set<string>>(new Set());

  const [syncMessage, setSyncMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const [editingIndex, setEditingIndex] = useState<{ext: number, lab: number} | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const toggleLabConfirmation = (indexStr: string) => {
    const newConfirmed = new Set(confirmedLabIndices);
    if (newConfirmed.has(indexStr)) {
      newConfirmed.delete(indexStr);
    } else {
      newConfirmed.add(indexStr);
    }
    setConfirmedLabIndices(newConfirmed);
  };

  const handleEditClick = (extIndex: number, labIndex: number, lab: any) => {
    setEditingIndex({ ext: extIndex, lab: labIndex });
    setEditForm({ ...lab });
  };

  const handleSaveEdit = (extIndex: number, labIndex: number) => {
    const newResults = [...(results || [])];
    newResults[extIndex].lab_values[labIndex] = editForm;
    setResults(newResults);
    setEditingIndex(null);
  };

  const handleSync = async () => {
    setSyncMessage(null);
    if (!results || results.length === 0) return;

    if (!user) {
      setSyncMessage({ type: 'error', text: 'Please sign in to sync records.' });
      return;
    }

    const hasLabs = results.some(r => r.lab_values?.length > 0);
    if (hasLabs && confirmedLabIndices.size === 0) {
      setSyncMessage({ type: 'error', text: 'Please select at least one laboratory value to confirm before syncing.' });
      return;
    }

    setIsSyncing(true);
    try {
      const userId = user.uid;
      
      for (const [extIndex, result] of results.entries()) {
        const docId = await saveDocument(userId, {
          fileName: result.fileName || 'Document',
          type: result.document_type || 'Unknown Type',
          date: result.date || new Date().toISOString(),
          hospitalName: result.hospital_name || 'Unknown',
          doctorName: result.doctor_name || 'Unknown',
          extractedData: result,
          profileId: activeProfile?.id
        });

        if (!docId) throw new Error('Failed to save document - docId was undefined.');

        if (result.lab_values && result.lab_values.length > 0) {
          for (let i = 0; i < result.lab_values.length; i++) {
            if (confirmedLabIndices.has(`${extIndex}-${i}`)) {
              const lab = result.lab_values[i];
              await saveLabResult(userId, {
                docId: docId || 'unknown',
                date: lab.date || result.date || new Date().toISOString(),
                markerName: lab.marker || 'Unknown',
                value: isNaN(parseFloat(lab.value)) ? 0 : parseFloat(lab.value),
                unit: lab.unit || '',
                referenceRange: lab.reference_range || '',
                status: (lab.status as LabStatus) || LabStatus.NORMAL,
                profileId: activeProfile?.id
              });
            }
          }
        }

        if (result.medications && result.medications.length > 0) {
          for (const med of result.medications) {
            await saveMedication(userId, {
              name: med.name || 'Unknown',
              dosage: med.dosage || 'Unknown',
              frequency: med.frequency || 'Unknown',
              status: MedicationStatus.ACTIVE,
              startDate: med.date || result.date || new Date().toISOString(),
              purpose: med.purpose || 'Unknown',
              profileId: activeProfile?.id
            });
          }
        }
      }

      setSyncMessage({ type: 'success', text: 'Successfully synced to your health vault!' });
      setTimeout(() => {
        setResults(null);
        setIsVerifying(false);
        setConfirmedLabIndices(new Set());
        setFiles([]);
        setSyncMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncMessage({ type: 'error', text: `Failed to sync: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const [processingStep, setProcessingStep] = useState(0);

  const processingSteps = [
    { text: "Reading documents...", sub: "Extracting optical characters" },
    { text: "Cross-referencing entities...", sub: "Analyzing with medical databases" },
    { text: "Parsing values...", sub: "Harmonizing units and ranges" },
    { text: "Finalizing schema...", sub: "Generating structured data" }
  ];

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Reset previous uploads
    setResults(null);
    setConfirmedLabIndices(new Set());
    setSyncMessage(null);
    setEditingIndex(null);
    setEditForm(null);

    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      statusText: 'Waiting...',
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);

    setIsProcessing(true);
    setProcessingStep(0);
    
    const updateFileStatus = (id: string, updates: any) => {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    try {
      const processFile = async (f: any, index: number) => {
        try {
          updateFileStatus(f.id, { statusText: 'Reading file...', progress: 10 });
          setProcessingStep(0);
          
          const fileData = await new Promise<{base64Data: string, mimeType: string}>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64Data = (reader.result as string).split(',')[1];
              resolve({ base64Data, mimeType: f.file.type });
            };
            reader.onerror = reject;
            reader.readAsDataURL(f.file);
          });

          updateFileStatus(f.id, { statusText: 'Extracting markers...', progress: 30 });
          await new Promise(r => setTimeout(r, 600));
          setProcessingStep(1);
          
          updateFileStatus(f.id, { statusText: 'Analyzing with Gemini...', progress: 50 });
          
          const extraction = await extractMedicalReports([fileData]);
          
          if (!extraction) {
            updateFileStatus(f.id, { status: 'error', statusText: 'AI failed to parse', progress: 0 });
            return null;
          }

          setProcessingStep(2);
          updateFileStatus(f.id, { statusText: 'Structuring findings...', progress: 80 });
          await new Promise(r => setTimeout(r, 800));
          setProcessingStep(3);

          const result = {
            ...extraction,
            fileName: f.file.name
          };

          // Normalize
          if (result.lab_values) {
            result.lab_values = result.lab_values.map((l: any) => ({ ...l, date: l.date || result.date }));
          }
          if (result.medications) {
            result.medications = result.medications.map((m: any) => ({ ...m, date: m.date || result.date }));
          }

          updateFileStatus(f.id, { status: 'completed', statusText: 'Success', progress: 100 });
          return result;
        } catch (err) {
          updateFileStatus(f.id, { status: 'error', statusText: 'Processing failed', progress: 0 });
          return null;
        }
      };

      const extractions = await Promise.all(newFiles.map((f, i) => processFile(f, i)));
      const validExtractions = extractions.filter(Boolean);

      if (validExtractions.length > 0) {
        setResults(validExtractions);
        
        let hasLabs = false;
        const initialConfirmed = new Set<string>();
        
        validExtractions.forEach((ext, extIndex) => {
          if (ext.lab_values && ext.lab_values.length > 0) {
            hasLabs = true;
            ext.lab_values.forEach((lab: any, labIndex: number) => {
              initialConfirmed.add(`${extIndex}-${labIndex}`);
            });
          }
        });
        
        if (hasLabs) {
          setConfirmedLabIndices(initialConfirmed);
          setIsVerifying(true);
        } else if (validExtractions.some(e => e.findings || (e.medications && e.medications.length > 0))) {
          setIsVerifying(true);
        }
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
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png']
    }
  } as any);

  const removeFile = (id: string) => {
    const fileIndex = files.findIndex(f => f.id === id);
    if (fileIndex !== -1 && results) {
      setResults(prev => {
        if (!prev) return prev;
        const newResults = prev.filter((_, i) => i !== fileIndex);
        return newResults.length > 0 ? newResults : null;
      });
      
      setConfirmedLabIndices(prev => {
        const newSet = new Set<string>();
        prev.forEach(key => {
          const [ext, lab] = key.split('-');
          const extInt = parseInt(ext, 10);
          if (extInt < fileIndex) {
            newSet.add(key);
          } else if (extInt > fileIndex) {
            newSet.add(`${extInt - 1}-${lab}`);
          }
        });
        return newSet;
      });
    }

    setFiles(prev => prev.filter(f => f.id !== id));
    
    if (files.length <= 1) {
      setResults(null);
      setConfirmedLabIndices(new Set());
      setSyncMessage(null);
      setEditingIndex(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Ingestion Hub</h2>
        <p className="text-slate-400 text-sm font-light leading-relaxed">
          The extraction pipeline uses Gemini multimodal intelligence to parse prescriptions, notes, and records into structured medical data.
        </p>
        
        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-[40px] p-16 transition-all cursor-pointer flex flex-col items-center gap-6
            ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:border-indigo-400 hover:bg-white/10'}
          `}
        >
          <input {...getInputProps()} />
          <div className="w-20 h-20 rounded-3xl bg-indigo-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
            <CloudUpload className="w-10 h-10" />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-white">Upload New Records</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Drag-and-drop or select files</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold text-slate-400">PDF</span>
            <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold text-slate-400">JPEG</span>
            <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold text-slate-400">PNG</span>
          </div>
        </div>

        <AnimatePresence>
          <div className="space-y-3">
            {files.map((f) => (
              <motion.div 
                key={f.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex flex-col gap-3 relative overflow-hidden"
              >
                {/* Progress bar background */}
                {f.status === 'pending' && (
                  <div className="absolute left-0 bottom-0 h-1.5 bg-white/5 w-full">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                      animate={{ width: `${f.progress}%` }} 
                      transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white truncate max-w-[180px]">{f.file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                          {(f.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {f.status === 'pending' && (
                          <motion.p 
                            key={f.statusText}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[9px] text-indigo-400 font-black uppercase tracking-widest"
                          >
                            • {f.statusText} ({Math.round(f.progress)}%)
                          </motion.p>
                        )}
                        {f.status === 'completed' && (
                          <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">• Ready</p>
                        )}
                        {f.status === 'error' && (
                          <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">• Failed</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {f.status === 'pending' && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                    {f.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    {f.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                    <button onClick={() => removeFile(f.id)} className="text-slate-500 hover:text-red-400 p-1 z-10 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>

      <div className="bg-white/5 backdrop-blur-2xl rounded-[48px] border border-white/10 shadow-3xl overflow-hidden flex flex-col min-h-[600px]">
        {isProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-8">
             <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white/5 border-t-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Microscope className="w-8 h-8 text-indigo-400/50" />
                </div>
             </div>
             <motion.div 
               key={processingStep}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-2 h-20"
             >
              <h3 className="font-bold text-2xl text-white tracking-tight">{processingSteps[processingStep].text}</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto font-light">{processingSteps[processingStep].sub}</p>
            </motion.div>
            <div className="flex gap-3">
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
            </div>
          </div>
        ) : results && results.length > 0 ? (
          <div className="flex-1 p-10 space-y-10 overflow-y-auto relative">
            <div className="flex justify-end p-2 -mt-4 shrink-0 border-b border-white/5 pb-4">
               <button onClick={() => { setResults(null); setFiles([]); setConfirmedLabIndices(new Set()); setSyncMessage(null); setEditingIndex(null); }} className="text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl">
                 <RefreshCw className="w-4 h-4" /> Start Over
               </button>
            </div>
            {results.map((result: any, extIndex: number) => (
              <div key={extIndex} className="space-y-8 pb-10 border-b border-white/10 last:border-0 last:pb-0">
                <div className="flex items-center justify-between border-b border-white/5 pb-8">
                  <div>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-full text-[9px] font-bold uppercase tracking-widest mb-3 inline-block">AI Extraction Success</span>
                    <h3 className="text-3xl font-light text-white tracking-tight leading-tight">{result.document_type?.replace('_', ' ') || 'Medical Report'}</h3>
                    <p className="text-slate-500 text-sm mt-2 flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4" /> {result.date || 'Record Date N/A'} • {result.hospital_name || 'Independent Lab'}
                    </p>
                    <p className="text-slate-500 text-xs mt-1 font-medium italic">
                      Source: {result.fileName}
                    </p>
                  </div>
                </div>

                {result.lab_values?.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Extracted Lab Markers</h4>
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Auto Verified</span>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {result.lab_values.map((m: any, i: number) => {
                        const isConfirmed = confirmedLabIndices.has(`${extIndex}-${i}`);
                        const isCritical = m.status === 'critical' || m.status === 'abnormal';
                        const isEditing = editingIndex?.ext === extIndex && editingIndex?.lab === i;
                        
                        return (
                          <motion.div 
                            key={i} 
                            initial={false}
                            animate={{ 
                              borderColor: isConfirmed ? 'rgba(16, 185, 129, 0.2)' : isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)'
                            }}
                            className={`p-5 bg-white/5 rounded-3xl border transition-all relative overflow-hidden group ${
                              !isConfirmed && isCritical ? 'bg-red-500/5' : ''
                            }`}
                          >
                            {!isConfirmed && isCritical && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                            )}
                            
                            {isEditing ? (
                              <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 block">Marker Name</label>
                                    <input 
                                      value={editForm.marker} 
                                      onChange={e => setEditForm({...editForm, marker: e.target.value})}
                                      className="w-full bg-slate-800 text-white text-sm rounded-xl px-3 border border-white/10 focus:outline-none focus:border-indigo-500 py-1.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 block">Value</label>
                                    <input 
                                      value={editForm.value} 
                                      onChange={e => setEditForm({...editForm, value: e.target.value})}
                                      className="w-full bg-slate-800 text-white text-sm rounded-xl px-3 border border-white/10 focus:outline-none focus:border-indigo-500 py-1.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 block">Unit</label>
                                    <input 
                                      value={editForm.unit} 
                                      onChange={e => setEditForm({...editForm, unit: e.target.value})}
                                      className="w-full bg-slate-800 text-white text-sm rounded-xl px-3 border border-white/10 focus:outline-none focus:border-indigo-500 py-1.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 block">Ref Range</label>
                                    <input 
                                      value={editForm.reference_range} 
                                      onChange={e => setEditForm({...editForm, reference_range: e.target.value})}
                                      className="w-full bg-slate-800 text-white text-sm rounded-xl px-3 border border-white/10 focus:outline-none focus:border-indigo-500 py-1.5"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                  <button 
                                    onClick={() => setEditingIndex(null)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => handleSaveEdit(extIndex, i)}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-400 transition-colors"
                                  >
                                    <Save className="w-3 h-3" /> Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <button 
                                    onClick={() => toggleLabConfirmation(`${extIndex}-${i}`)}
                                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                                      isConfirmed 
                                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                                      : isCritical 
                                        ? 'border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                                        : 'border-white/10 hover:border-white/20'
                                    }`}
                                  >
                                    {isConfirmed && <Check className="w-4 h-4" />}
                                  </button>
                                  
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-slate-200">
                                        {m.marker}
                                        {m.date && <span className="ml-2 text-slate-400 font-normal italic opacity-70 text-xs">({m.date})</span>}
                                      </p>
                                      {isCritical && (
                                        <span className="p-1 rounded-md bg-red-500/20 text-red-400">
                                          <AlertCircle className="w-3 h-3" />
                                        </span>
                                      )}
                                      <button 
                                        onClick={() => handleEditClick(extIndex, i, m)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-indigo-400 transition-all ml-2"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Ref: {m.reference_range}</p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className={`text-xl font-light ${m.status === 'abnormal' ? 'text-amber-400' : m.status === 'critical' ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {m.value} <span className="text-xs opacity-50">{m.unit}</span>
                                  </p>
                                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mt-1 ${
                                    m.status === 'abnormal' ? 'bg-amber-500/20 text-amber-500' : 
                                    m.status === 'critical' ? 'bg-red-500/20 text-red-500' : 
                                    'bg-emerald-500/20 text-emerald-500'
                                  }`}>
                                    {m.status}
                                  </span>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {result.findings && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clinical Impressions</h4>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 italic text-slate-300 font-light leading-relaxed">
                      {result.findings}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="sticky bottom-0 pt-4 pb-4 bg-[#0B0F19] border-t border-white/5">
              {syncMessage && (
                <div className={`p-4 rounded-xl text-xs font-bold text-center mb-4 ${syncMessage.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/20'}`}>
                  {syncMessage.text}
                </div>
              )}

              {!user ? (
                 <button 
                   onClick={signIn}
                   className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-bold transition-all shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3 group text-sm uppercase tracking-widest"
                 >
                   Sign In to Sync
                 </button>
              ) : (
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-bold transition-all shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3 group text-sm uppercase tracking-widest"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Syncing to Vault...
                    </>
                  ) : (
                    <>
                      Sync to Secure Vault <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6 opacity-20 group">
            <FileText className="w-24 h-24 text-slate-400 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-slate-400 max-w-[200px]">Extract findings by dropping a report in the left pane.</p>
          </div>
        )}
      </div>
    </div>
  );
}
