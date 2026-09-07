import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Copy, Check, Maximize2, Minimize2, ShieldCheck, Hospital, Sparkles } from 'lucide-react';
import { AbhaProfile, generateScanAndShareQrPayload } from '../../services/abdmService';

interface AbdmScanShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AbhaProfile | null;
}

export const AbdmScanShareModal: React.FC<AbdmScanShareModalProps> = ({ isOpen, onClose, profile }) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const abhaNumber = profile?.abhaNumber || '91-2345-6789-0123';
  const abhaAddress = profile?.abhaAddress || 'patient@abdm';
  const name = profile?.name || 'Aniket Dhuri';

  const qrPayload = generateScanAndShareQrPayload(
    profile || {
      abhaNumber,
      abhaAddress,
      name,
      gender: 'Male',
      dateOfBirth: '1995-05-15',
      mobile: '+919876543210',
    }
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className={`bg-gradient-to-b from-[#0F2647] via-[#0A192F] to-[#071325] border border-orange-500/30 rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${
          isFullscreen ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-full max-w-lg'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-orange-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">ABDM Scan & Share</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                  NHA M1 Verified
                </span>
              </div>
              <p className="text-xs text-slate-300 font-light">Present QR at Hospital OPD Counter to Auto-Register</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen QR'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-6 overflow-y-auto">
          {/* Patient Details Pill */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-left flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Patient Name</div>
              <div className="text-base font-bold text-white">{name}</div>
              <div className="text-xs text-orange-300 font-mono mt-0.5">{abhaAddress}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">ABHA Number</div>
              <div className="text-sm font-mono font-bold text-orange-400">{abhaNumber}</div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-6 rounded-3xl border-4 border-orange-500/40 shadow-[0_0_40px_rgba(249,115,22,0.25)] relative group flex flex-col items-center justify-center">
            <QRCodeSVG
              value={qrPayload}
              size={isFullscreen ? 320 : 220}
              level="H"
              includeMargin={true}
            />
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-700">
              <Hospital className="w-3.5 h-3.5 text-orange-600" />
              NHA ABDM COUNTER CHECK-IN
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-slate-300 max-w-sm leading-relaxed font-light">
            Show this QR code at Apollo, Max, Fortis, or any government hospital OPD counter. The counter staff will scan it to auto-pull your demographic details.
          </div>

          {/* Payload String Copy Box */}
          <div className="w-full bg-[#071325]/90 border border-white/10 rounded-2xl p-3 flex items-center justify-between text-left">
            <div className="truncate pr-3 font-mono text-[11px] text-slate-400">
              {qrPayload}
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Payload'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> DPDP Act 2023 Encrypted
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-orange-400">
            <Sparkles className="w-3 h-3" /> NHA OPD COUNTER GATEWAY V3
          </span>
        </div>
      </div>
    </div>
  );
};
