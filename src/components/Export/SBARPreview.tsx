import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Copy, Check, X, Download } from 'lucide-react';

interface SBARPreviewProps {
  sbarText: string;
  isLoading?: boolean;
  onClose: () => void;
}

export default function SBARPreview({ sbarText, isLoading, onClose }: SBARPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sbarText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { exportToPDF } = await import('../../services/pdfExportService');
      await exportToPDF('sbar-content', 'AI_Physician_SBAR.pdf');
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 border border-white/10 p-6 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sbar-preview-title"
      >
        <div className="flex items-center justify-between mx-2 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 id="sbar-preview-title" className="text-xl font-bold text-white tracking-tight">Physician SBAR Summary</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div 
          id="sbar-content"
          className="flex-1 overflow-y-auto p-8 md:p-12 bg-black/20 rounded-2xl border border-white/5 mb-4 text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap relative min-h-[200px]"
        >
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
              />
              <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest animate-pulse">Consulting Gemini AI...</p>
            </div>
          ) : (
            sbarText
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 mt-2">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors order-3 sm:order-1"
          >
            Close
          </button>
          <button 
            disabled={isLoading || isExporting}
            onClick={handleExport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10 order-2 sm:order-2 disabled:opacity-50"
          >
            {isExporting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Download className="w-4 h-4" /></motion.div> : <Download className="w-4 h-4" />}
            Export PDF
          </button>
          <button 
            disabled={isLoading}
            onClick={handleCopy}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/20 order-1 sm:order-3 disabled:opacity-50"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied' : 'Copy to Clipboard'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
