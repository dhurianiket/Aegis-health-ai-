import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Download, 
  X, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronDown,
  Activity
} from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';

interface ExportModalProps {
  onClose: () => void;
  healthContext: {
    userName: string;
    healthScore: number;
    topFlags: string[];
    medications: any[];
    recentTrends: any[];
    doctorNotes: string[];
  };
}

type DateRange = '30days' | '6months' | '1year' | 'custom';

export default function ExportModal({ onClose, healthContext }: ExportModalProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(10);
    
    try {
      // Create a specific, well-formatted printable element for the PDF
      // We'll use a hidden template in the DOM or generate one on the fly
      const reportId = 'health-report-printable';
      
      // Artificial delay to show progress and ensure DOM is ready
      setExportProgress(30);
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportProgress(60);
      
      const { exportToPDF } = await import('../../services/pdfExportService');
      const fileName = `Health_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      await exportToPDF(reportId, fileName, 'portrait');
      
      setExportProgress(100);
      setTimeout(() => onClose(), 800);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-800 border border-white/10 rounded-[2rem] w-full max-w-xl shadow-2xl relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 id="export-modal-title" className="text-xl font-bold text-white tracking-tight">Export Health Report</h3>
              <p className="text-slate-400 text-sm">Professional PDF summary for your records</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Date Range Selection */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date Range
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: '30days', label: 'Last 30 Days' },
                { id: '6months', label: 'Last 6 Months' },
                { id: '1year', label: 'Last 1 Year' },
                { id: 'custom', label: 'Custom Range' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id as DateRange)}
                  className={`px-4 py-3 rounded-2xl text-sm font-medium transition-all border ${
                    dateRange === range.id 
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/5' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Report Preview Summary */}
          <div className="p-6 bg-black/20 rounded-3xl border border-white/5 space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Included Content</label>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-6 gap-y-3">
              {[
                'Health Overview Score',
                'Critical Lab Flags',
                'Active Medications',
                'Vital Sign Trends',
                'Specialist Notes',
                'Insurance Information',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-200/60 leading-relaxed">
              This report is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare professional.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 order-2 sm:order-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Approx. generation: 5s</span>
          </div>
          
          <button 
            disabled={isExporting}
            onClick={handleExport}
            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all relative overflow-hidden order-1 sm:order-2 ${
              isExporting 
              ? 'bg-indigo-600/50 text-white/50 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 active:scale-95'
            }`}
          >
            {isExporting ? (
              <>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress}%` }}
                  className="absolute inset-0 bg-indigo-400/20"
                />
                <span className="relative z-10 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Clock className="w-5 h-5" />
                  </motion.div>
                  Generating...
                </span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Hidden Printable Component */}
      <div className="hidden">
        <HealthReportPrintable reportId="health-report-printable" context={healthContext} />
      </div>
    </div>
  );
}

function HealthReportPrintable({ reportId, context }: { reportId: string, context: any }) {
  return (
    <div id={reportId} className="w-[800px] bg-white text-slate-900 p-12 font-sans">
      <div className="flex justify-between items-start mb-12 border-b-4 border-indigo-600 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="text-white w-6 h-6" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">AURA HEALTH</h1>
          </div>
          <p className="text-slate-500 font-medium">Digital Medical Record Summary</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Report Date</p>
          <p className="text-xl font-bold">{format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 mb-12">
        <div className="col-span-2 space-y-6">
          <h2 className="text-2xl font-bold border-l-4 border-indigo-600 pl-4">Patient Information</h2>
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Name</p>
              <p className="font-bold text-lg">{context.userName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Health Score</p>
              <p className="font-bold text-lg text-indigo-600">{context.healthScore}% - Optimal</p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold border-l-4 border-red-500 pl-4">Top Flags</h2>
          <div className="bg-red-50 p-6 rounded-2xl space-y-2">
            {context.topFlags.length > 0 ? context.topFlags.map((flag: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm font-bold text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {flag}
              </div>
            )) : <p className="text-sm text-slate-500">No critical flags detected.</p>}
          </div>
        </div>
      </div>

      <div className="space-y-8 mb-12">
        <h2 className="text-2xl font-bold border-l-4 border-indigo-600 pl-4">Current Medications</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Medication</th>
              <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Dosage</th>
              <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Frequency</th>
              <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody>
            {context.medications.length > 0 ? context.medications.map((med: any, i: number) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="py-4 font-bold">{med.name}</td>
                <td className="py-4 text-slate-600">{med.dosage}</td>
                <td className="py-4 text-slate-600">{med.frequency}</td>
                <td className="py-4 font-bold text-emerald-600">Active</td>
              </tr>
            )) : <tr><td colSpan={4} className="py-4 text-slate-500">No medications listed.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="space-y-8 mb-12">
        <h2 className="text-2xl font-bold border-l-4 border-indigo-600 pl-4">Clinical Insights</h2>
        <div className="grid grid-cols-2 gap-8">
           <div className="p-6 bg-slate-50 rounded-3xl">
              <h3 className="font-bold mb-4 text-slate-700">Recent Trends</h3>
              <div className="space-y-4">
                {context.recentTrends.map((trend: any, i: number) => (
                  <div key={i} className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-sm font-medium text-slate-600">{trend.marker}</span>
                    <span className={`text-sm font-bold ${trend.direction === 'up' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {trend.value} {trend.unit}
                    </span>
                  </div>
                ))}
              </div>
           </div>
           <div className="p-6 bg-slate-50 rounded-3xl">
              <h3 className="font-bold mb-4 text-slate-700">Medical Notes</h3>
              <div className="space-y-3">
                {context.doctorNotes.length > 0 ? context.doctorNotes.map((note: string, i: number) => (
                  <p key={i} className="text-sm italic text-slate-600 leading-relaxed border-l-2 border-slate-200 pl-3">
                    "{note}"
                  </p>
                )) : <p className="text-sm text-slate-500">No recent physician notes.</p>}
              </div>
           </div>
        </div>
      </div>

      <div className="mt-auto pt-12 border-t border-slate-200 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
          Confidential Health Report • For Informational Purposes Only
        </p>
        <p className="text-[10px] text-slate-300 mt-2">
          Generated via Aura Intelligence.
        </p>
      </div>
    </div>
  );
}
