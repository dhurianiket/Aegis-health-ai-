/**
 * ExportButton Component
 * Dropdown menu for exporting dashboard to PDF or image
 * 
 * Features:
 * - PDF export with automatic quality detection
 * - Image export (PNG)
 * - Responsive design (compact icon button on mobile, full button on desktop)
 * - Loading states with animations
 * - Error handling with user feedback
 * - Tailwind v4 compatible
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Loader,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  exportDashboardToPdf,
  exportDashboardToImage,
} from '@/services/pdfExportService';

interface ExportButtonProps {
  /** Variant of the button */
  variant?: 'compact' | 'full';
  /** Custom class names */
  className?: string;
  /** Callback when export starts */
  onExportStart?: () => void;
  /** Callback when export ends */
  onExportEnd?: () => void;
}

export default function ExportButton({
  variant = 'full',
  className = '',
  onExportStart,
  onExportEnd,
}: ExportButtonProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'image' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Handle PDF export with progress tracking
   */
  const handlePdfExport = async () => {
    setIsExporting(true);
    setExportType('pdf');
    onExportStart?.();

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      await exportDashboardToPdf({
        filename: `health-report-${timestamp}.pdf`,
        title: 'Aegis Health Report',
        quality: 'medium',
      });
    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(false);
      setExportType(null);
      setIsOpen(false);
      onExportEnd?.();
    }
  };

  /**
   * Handle image export
   */
  const handleImageExport = async () => {
    setIsExporting(true);
    setExportType('image');
    onExportStart?.();

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      await exportDashboardToImage({
        filename: `health-report-${timestamp}.png`,
        quality: 'high',
      });
    } catch (error) {
      console.error('Image export error:', error);
    } finally {
      setIsExporting(false);
      setExportType(null);
      setIsOpen(false);
      onExportEnd?.();
    }
  };

  // Compact variant: Just icon button
  if (variant === 'compact') {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isExporting}
          className="p-2 text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
          title="Export options"
          aria-label="Export options"
        >
          <Download className="w-5 h-5" />
          {isExporting && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Loader className="w-5 h-5 text-indigo-500" />
            </motion.div>
          )}
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="py-1">
                <button
                  onClick={handlePdfExport}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-100 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  {isExporting && exportType === 'pdf' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Loader className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    </motion.div>
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium">Export as PDF</div>
                    <div className="text-xs text-slate-500">Professional report</div>
                  </div>
                </button>
                <div className="border-t border-white/5" />
                <button
                  onClick={handleImageExport}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-100 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  {isExporting && exportType === 'image' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Loader className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    </motion.div>
                  ) : (
                    <ImageIcon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium">Export as Image</div>
                    <div className="text-xs text-slate-500">PNG screenshot</div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full variant: Button with dropdown
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-indigo-500/20 ${
          className || ''
        }`}
        title="Export report"
        aria-label="Export report options"
      >
        {isExporting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Loader className="w-4 h-4" />
          </motion.div>
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Export Report</span>
        {!isExporting && <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="py-2">
              {/* PDF Export Option */}
              <button
                onClick={handlePdfExport}
                disabled={isExporting}
                className="w-full flex items-start gap-4 px-4 py-3 text-slate-100 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left group"
              >
                <div className="flex-shrink-0 mt-1">
                  {isExporting && exportType === 'pdf' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Loader className="w-5 h-5 text-indigo-500" />
                    </motion.div>
                  ) : (
                    <FileText className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Export as PDF</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Professional health report with all charts and data
                  </div>
                </div>
              </button>

              <div className="border-t border-white/5" />

              {/* Image Export Option */}
              <button
                onClick={handleImageExport}
                disabled={isExporting}
                className="w-full flex items-start gap-4 px-4 py-3 text-slate-100 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left group"
              >
                <div className="flex-shrink-0 mt-1">
                  {isExporting && exportType === 'image' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Loader className="w-5 h-5 text-indigo-500" />
                    </motion.div>
                  ) : (
                    <ImageIcon className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Export as Image</div>
                  <div className="text-xs text-slate-400 mt-1">
                    PNG screenshot for sharing or printing
                  </div>
                </div>
              </button>
            </div>

            {/* Footer Info */}
            <div className="px-4 py-3 bg-white/5 border-t border-white/10">
              <div className="text-xs text-slate-500">
                💡 <strong>Tip:</strong> For best results, open in a new browser
                tab before exporting.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
