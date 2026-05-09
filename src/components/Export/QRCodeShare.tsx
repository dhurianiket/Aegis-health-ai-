import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Share2, 
  X, 
  Copy, 
  Check, 
  Clock, 
  Settings2,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { generateShareLink } from '../../services/qrCodeService';

interface QRCodeShareProps {
  onClose: () => void;
  profileId: string;
  userId: string;
}

export default function QRCodeShare({ onClose, profileId, userId }: QRCodeShareProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState(24);
  const [exposedData, setExposedData] = useState({
    meds: true,
    labs: true,
    vitals: true,
    notes: false
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const url = await generateShareLink({
        profileId,
        userId,
        expiryHours: expiry,
        dataToExpose: exposedData
      });
      setShareUrl(url);
    } catch (error) {
      alert("Failed to generate share link.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-slate-800 border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <QrCode className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Share Quick Snapshot</h3>
            </div>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-full bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-400 text-sm">Generate a secure, time-limited QR code for your healthcare provider.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
          {!shareUrl ? (
            <div className="space-y-8 py-6">
              {/* Expiry Settings */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Access Duration
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '2 Hours', val: 2 },
                    { label: '24 Hours', val: 24 },
                    { label: '7 Days', val: 168 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setExpiry(opt.val)}
                      className={`px-3 py-3 rounded-2xl text-xs font-bold transition-all border ${
                        expiry === opt.val 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300' 
                        : 'bg-white/5 border-transparent text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy Controls */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5" /> Privacy Controls
                </label>
                <div className="space-y-3">
                  {Object.entries(exposedData).map(([key, enabled]) => (
                    <div 
                      key={key}
                      onClick={() => setExposedData(prev => ({ ...prev, [key]: !enabled }))}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        enabled 
                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                        : 'bg-white/5 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium capitalize ${enabled ? 'text-white' : 'text-slate-500'}`}>
                          {key === 'labs' ? 'Lab Results' : key === 'meds' ? 'Medication List' : key === 'vitals' ? 'Vital Signs' : 'Private Notes'}
                        </span>
                      </div>
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${enabled ? 'left-5' : 'left-1'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-8">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-6 bg-white rounded-[2.5rem] shadow-2xl relative"
              >
                <QRCodeSVG 
                  value={shareUrl} 
                  size={220}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/favicon.ico", // Or app icon link
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-900 border border-white/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest whitespace-nowrap shadow-xl">
                  Secure Snapshot
                </div>
              </motion.div>

              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="truncate flex-1 text-xs text-slate-400 font-mono">
                    {shareUrl}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-8 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Scan</span>
                  </div>
                  <div className="w-12 h-px bg-white/10" />
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Access</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-black/20 shrink-0">
          {!shareUrl ? (
            <button 
              disabled={isGenerating}
              onClick={handleGenerate}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-bold transition-all ${
                isGenerating 
                ? 'bg-emerald-600/50 text-white/50 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 active:scale-95'
              }`}
            >
              <Share2 className="w-5 h-5" />
              {isGenerating ? 'Generating Secure Access...' : 'Generate Sharing Link'}
            </button>
          ) : (
            <button 
              onClick={() => { setShareUrl(null); onClose(); }}
              className="w-full py-4 rounded-[1.5rem] bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10"
            >
              Done
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
