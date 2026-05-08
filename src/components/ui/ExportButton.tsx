import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportToPDF } from '../../services/pdfExportService';

interface ExportButtonProps {
  variant?: 'compact' | 'full';
  elementId: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
}

export default function ExportButton({ variant = 'compact', elementId, filename, orientation = 'portrait' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setError(null);
    try {
      await exportToPDF(elementId, filename, orientation);
    } catch (err) {
      console.error("Export failed", err);
      setError("Failed to export PDF");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className={
          variant === 'full' 
            ? "flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            : "p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors disabled:opacity-50"
        }
        title="Export as PDF"
      >
        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {variant === 'full' && <span>Export PDF</span>}
      </button>

      {error && (
        <div className="absolute right-0 top-full mt-2 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  );
}
