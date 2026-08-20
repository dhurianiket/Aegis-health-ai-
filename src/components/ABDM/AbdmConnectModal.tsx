import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  QrCode,
  Smartphone,
  RefreshCw,
  KeyRound,
  Lock,
  Link as LinkIcon,
  Layers,
  FileText,
  Send,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Building2,
  Clock,
  Eye,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import {
  AbhaProfile,
  CareContext,
  ConsentRequest,
  ConsentArtifact,
  EncryptedBundleTransfer,
  getAbdmProfile,
  saveAbdmProfile,
  requestAbdmOtp,
  confirmAbdmOtp,
  disconnectAbdm,
  getLinkedCareContexts,
  linkAbdmCareContext,
  unlinkAbdmCareContext,
  linkBatchCareContexts,
  getConsentRequests,
  simulateConsentApproval,
  simulateConsentDenial,
  simulateConsentRevocation,
  simulateEncryptedDataTransfer,
  formatAbhaNumber,
} from '../../services/abdmService';
import { downloadFhirJson } from '../../services/fhirService';

interface AbdmConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (profile: AbhaProfile) => void;
}

export default function AbdmConnectModal({ isOpen, onClose, onSuccess }: AbdmConnectModalProps) {
  const { user } = useAuth();
  const userId = user?.uid || 'demo-user-id';

  // Active Tab: 'm1_profile' | 'm2_contexts' | 'm3_consent' | 'm3_transfer'
  const [activeTab, setActiveTab] = useState<'m1_profile' | 'm2_contexts' | 'm3_consent' | 'm3_transfer'>('m1_profile');

  // M1 Auth State
  const [authMode, setAuthMode] = useState<'aadhaar' | 'mobile'>('mobile');
  const [identifier, setIdentifier] = useState('9876543210');
  const [preferredAddress, setPreferredAddress] = useState('aniket.dhuri');
  const [otp, setOtp] = useState('');
  const [txnId, setTxnId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [profile, setProfile] = useState<AbhaProfile | null>(null);

  // M2 Contexts State
  const [contexts, setContexts] = useState<CareContext[]>([]);

  // M3 Consent State
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<ConsentArtifact | null>(null);

  // M3 Transfer Simulation State
  const [isSimulatingTransfer, setIsSimulatingTransfer] = useState(false);
  const [transferResult, setTransferResult] = useState<EncryptedBundleTransfer | null>(null);
  const [simulationStep, setSimulationStep] = useState<number>(0);

  // Common UI State
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load existing profile, contexts, and consent requests
  useEffect(() => {
    if (isOpen) {
      const existingProfile = getAbdmProfile(userId);
      setProfile(existingProfile);
      setContexts(getLinkedCareContexts(userId));
      setConsentRequests(getConsentRequests(userId));
      setFeedback(null);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      }
    } catch {}
  };

  // M1 OTP Request
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await requestAbdmOtp(identifier, authMode);
      setTxnId(res.txnId);
      setOtpSent(true);
      setFeedback({
        type: 'info',
        message: `OTP sent via ABDM Gateway to ${res.maskedTarget}. Use demo OTP: 123456.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to request OTP from ABDM Gateway.' });
    } finally {
      setLoading(false);
    }
  };

  // M1 OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const newProf = await confirmAbdmOtp(txnId || 'txn-demo', otp || '123456', userId, preferredAddress, authMode);
      setProfile(newProf);
      setContexts(getLinkedCareContexts(userId));
      setOtpSent(false);
      setFeedback({
        type: 'success',
        message: 'ABHA Profile successfully authenticated and linked to Aegis Health AI!',
      });
      if (onSuccess) onSuccess(newProf);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Invalid OTP code.' });
    } finally {
      setLoading(false);
    }
  };

  // Disconnect ABHA
  const handleDisconnect = () => {
    disconnectAbdm(userId);
    setProfile(null);
    setOtpSent(false);
    setOtp('');
    setFeedback({ type: 'info', message: 'ABHA account successfully unlinked from Aegis Health.' });
  };

  // M2 Link/Unlink Care Context
  const handleToggleContext = async (context: CareContext) => {
    setLoading(true);
    try {
      if (context.status === 'linked') {
        const res = await unlinkAbdmCareContext(userId, context.referenceNumber);
        setContexts(res.linkedContexts);
        setFeedback({ type: 'info', message: `Unlinked care context: ${context.display}` });
      } else {
        const res = await linkAbdmCareContext(userId, context);
        setContexts(res.linkedContexts);
        setFeedback({ type: 'success', message: `Linked care context: ${context.display}` });
      }
      const p = getAbdmProfile(userId);
      if (p) setProfile(p);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update care context.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAllContexts = async () => {
    setLoading(true);
    try {
      const res = await linkBatchCareContexts(userId, contexts);
      setContexts(res.linkedContexts);
      const p = getAbdmProfile(userId);
      if (p) setProfile(p);
      setFeedback({ type: 'success', message: `All ${res.updatedCount} Care Contexts successfully linked to ABHA.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to batch link records.' });
    } finally {
      setLoading(false);
    }
  };

  // M3 Consent Approval
  const handleApproveConsent = async (reqId: string) => {
    setLoading(true);
    try {
      const artifact = await simulateConsentApproval(reqId, userId);
      setActiveArtifact(artifact);
      setConsentRequests(getConsentRequests(userId));
      setFeedback({
        type: 'success',
        message: `Consent request ${reqId} approved with SHA256withECDSA digital signature!`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to approve consent.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDenyConsent = async (reqId: string) => {
    setLoading(true);
    try {
      await simulateConsentDenial(reqId, userId);
      setConsentRequests(getConsentRequests(userId));
      setFeedback({ type: 'info', message: `Consent request ${reqId} denied.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to deny consent.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async (reqId: string) => {
    setLoading(true);
    try {
      await simulateConsentRevocation(reqId, userId);
      setConsentRequests(getConsentRequests(userId));
      setFeedback({ type: 'info', message: `Consent ${reqId} revoked.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to revoke consent.' });
    } finally {
      setLoading(false);
    }
  };

  // M3 Encrypted Transfer Simulation
  const handleRunTransferSimulation = async () => {
    setIsSimulatingTransfer(true);
    setSimulationStep(1);
    setTransferResult(null);
    setFeedback(null);

    try {
      await new Promise((r) => setTimeout(r, 600));
      setSimulationStep(2);
      await new Promise((r) => setTimeout(r, 600));
      setSimulationStep(3);
      await new Promise((r) => setTimeout(r, 600));
      setSimulationStep(4);

      const result = await simulateEncryptedDataTransfer('ART-APOLLO-9481', userId, profile);
      setTransferResult(result);
      setFeedback({
        type: 'success',
        message: 'Encrypted FHIR R4 Bundle successfully exchanged via simulated ABDM Gateway!',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Data transfer failed.' });
    } finally {
      setIsSimulatingTransfer(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative w-full max-w-4xl bg-slate-900/95 border border-white/10 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 via-indigo-600 to-emerald-500 p-[2px] shadow-lg">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  NHA ABDM Sandbox Gateway v3
                </span>
                <span className="text-xs text-muted font-medium">• Ayushman Bharat Digital Mission</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                ABHA & ABDM Health Gateway
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/20 px-6 gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('m1_profile')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'm1_profile'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            M1: ABHA Profile
          </button>

          <button
            onClick={() => setActiveTab('m2_contexts')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'm2_contexts'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            M2: Care Contexts ({contexts.filter((c) => c.status === 'linked').length})
          </button>

          <button
            onClick={() => setActiveTab('m3_consent')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'm3_consent'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            M3: Consent Manager ({consentRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('m3_transfer')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'm3_transfer'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            M3: Encrypted Exchange
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : feedback.type === 'error'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : feedback.type === 'error' ? (
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <Info className="w-4 h-4 shrink-0 text-indigo-400" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: M1 ABHA PROFILE & AUTH */}
          {activeTab === 'm1_profile' && (
            <div className="space-y-6">
              {profile ? (
                /* Connected State: 3D Holographic ABHA Card */
                <div className="space-y-6">
                  {/* Virtual ABHA Card */}
                  <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    {/* Tricolor India Accent Stripe */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-500" />
                    
                    {/* Holographic Watermark Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center font-black text-orange-400 text-xs">
                          NHA
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                            National Health Authority
                          </div>
                          <div className="text-sm font-black text-white tracking-wide">
                            AYUSHMAN BHARAT HEALTH ACCOUNT (ABHA)
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Verified Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                      {/* Left: ABHA Details */}
                      <div className="sm:col-span-2 space-y-4">
                        <div>
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            ABHA Number (14-Digit)
                          </div>
                          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-widest flex items-center gap-2 mt-0.5">
                            {profile.abhaNumber}
                            <button
                              onClick={() => copyToClipboard(profile.abhaNumber, 'num')}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="Copy ABHA Number"
                            >
                              {copiedField === 'num' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              ABHA Address (@abdm)
                            </div>
                            <div className="text-sm font-mono font-bold text-indigo-300 flex items-center gap-1 mt-0.5">
                              {profile.abhaAddress}
                              <button
                                onClick={() => copyToClipboard(profile.abhaAddress, 'addr')}
                                className="p-0.5 text-slate-400 hover:text-white"
                              >
                                {copiedField === 'addr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Full Name
                            </div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {profile.name}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              DOB & Gender
                            </div>
                            <div className="text-xs font-semibold text-slate-300 mt-0.5">
                              {profile.dateOfBirth} • {profile.gender}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Registered Mobile
                            </div>
                            <div className="text-xs font-mono text-slate-300 mt-0.5">
                              {profile.mobile}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Holographic QR Code Box */}
                      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl text-slate-900 border border-white/30">
                        <QrCode className="w-24 h-24 text-slate-900" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-600 mt-1">
                          NHA Scannable Token
                        </span>
                        <button
                          onClick={() => copyToClipboard(profile.qrCodeString || '', 'qr')}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-1"
                        >
                          {copiedField === 'qr' ? 'Copied Payload!' : 'Copy QR Payload'}
                        </button>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="text-slate-400 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        Linked HIP Facility: <strong>Aegis Health Intelligence Clinic (IN2710001824)</strong>
                      </div>
                      <button
                        onClick={handleDisconnect}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 font-bold transition-colors"
                      >
                        Disconnect ABHA
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Unconnected State: Registration / Login Wizard */
                <div className="space-y-6">
                  <div className="p-6 bg-black/20 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">Create or Link Your ABHA Number</h3>
                        <p className="text-xs text-muted mt-0.5">
                          Authenticate via National Health Authority (NHA) ABDM Sandbox to unlock national health record exchange.
                        </p>
                      </div>
                      <div className="flex bg-black/30 p-1 rounded-xl border border-white/10 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setAuthMode('mobile')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            authMode === 'mobile' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                          }`}
                        >
                          Mobile OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthMode('aadhaar')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            authMode === 'aadhaar' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                          }`}
                        >
                          Aadhaar OTP
                        </button>
                      </div>
                    </div>

                    {!otpSent ? (
                      <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                              {authMode === 'aadhaar' ? '12-Digit Aadhaar Number' : '10-Digit Mobile Number'}
                            </label>
                            <input
                              type="text"
                              value={identifier}
                              onChange={(e) => setIdentifier(e.target.value)}
                              placeholder={authMode === 'aadhaar' ? '1234 5678 9012' : '98765 43210'}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                              Preferred ABHA Address Handle
                            </label>
                            <div className="flex items-center">
                              <input
                                type="text"
                                value={preferredAddress}
                                onChange={(e) => setPreferredAddress(e.target.value)}
                                placeholder="firstname.lastname"
                                className="w-full bg-slate-900 border border-white/10 rounded-l-xl px-4 py-3 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                                required
                              />
                              <span className="bg-black/40 border border-l-0 border-white/10 px-3 py-3 rounded-r-xl text-slate-400 text-xs font-mono">
                                @abdm
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIdentifier('9876543210');
                              setPreferredAddress('aniket.dhuri');
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Fill Demo Credentials
                          </button>

                          <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                            Request ABDM OTP
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Enter 6-Digit ABDM Verification OTP
                          </label>
                          <div className="flex gap-3 items-center">
                            <input
                              type="text"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="123456"
                              className="w-full max-w-xs bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:border-indigo-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setOtp('123456')}
                              className="px-3 py-3 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 rounded-xl border border-white/10"
                            >
                              Auto-Fill Demo OTP (123456)
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => setOtpSent(false)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            Change Number / Resend
                          </button>

                          <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                            Verify OTP & Link ABHA
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: M2 CARE CONTEXTS */}
          {activeTab === 'm2_contexts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">ABDM Care-Context Discovery & Linking</h3>
                  <p className="text-xs text-muted">
                    Clinical lab reports and prescriptions linked to your ABHA for interoperable health data exchange.
                  </p>
                </div>

                {profile && (
                  <button
                    onClick={handleLinkAllContexts}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Link All Active Records ({contexts.length})
                  </button>
                )}
              </div>

              {!profile && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-300 text-xs">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>Please authenticate and link your ABHA profile in the M1 tab first to manage Care Contexts.</span>
                </div>
              )}

              <div className="space-y-3">
                {contexts.map((ctx) => (
                  <div
                    key={ctx.referenceNumber}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      ctx.status === 'linked'
                        ? 'bg-black/20 border-white/10'
                        : 'bg-black/10 border-white/5 opacity-70'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                          {ctx.referenceNumber}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-300 font-semibold">
                          {ctx.type}
                        </span>
                        <span className="text-xs text-muted">
                          • {new Date(ctx.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{ctx.display}</h4>
                      <div className="text-[11px] text-muted flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> {ctx.hipName}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ctx.status === 'linked'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {ctx.status}
                      </span>
                      {profile && (
                        <button
                          onClick={() => handleToggleContext(ctx)}
                          disabled={loading}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            ctx.status === 'linked'
                              ? 'bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {ctx.status === 'linked' ? 'Unlink' : 'Link to ABHA'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: M3 CONSENT MANAGER */}
          {activeTab === 'm3_consent' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">ABDM Digital Consent Manager</h3>
                <p className="text-xs text-muted">
                  Review and grant granular time-bound consent to certified Health Information Users (HIUs) with digital signatures.
                </p>
              </div>

              <div className="space-y-4">
                {consentRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      req.status === 'GRANTED'
                        ? 'bg-emerald-950/10 border-emerald-500/30'
                        : req.status === 'DENIED'
                        ? 'bg-rose-950/10 border-rose-500/30'
                        : 'bg-black/20 border-white/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                          {req.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            req.status === 'GRANTED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : req.status === 'DENIED'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : req.status === 'REVOKED'
                              ? 'bg-slate-500/20 text-slate-400'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          Requested: {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-300">
                        Purpose: <strong className="text-white">{req.purpose.text}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-black/30 rounded-xl border border-white/5 text-xs text-muted">
                      <div>
                        <div><strong>Requesting HIU:</strong> {req.hiu.name}</div>
                        <div><strong>Clinician:</strong> {req.requester.name} ({req.requester.designation})</div>
                      </div>
                      <div>
                        <div><strong>Permitted HI Types:</strong> {req.hiTypes.join(', ')}</div>
                        <div><strong>Valid Until:</strong> {new Date(req.permission.dataEraseAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {req.status === 'REQUESTED' && (
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => handleDenyConsent(req.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                          Deny
                        </button>
                        <button
                          onClick={() => handleApproveConsent(req.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve with Digital Signature
                        </button>
                      </div>
                    )}

                    {req.status === 'GRANTED' && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cryptographic ECDSA Signature Generated
                        </span>
                        <button
                          onClick={() => handleRevokeConsent(req.id)}
                          disabled={loading}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-colors"
                        >
                          Revoke Consent
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Active Consent Artifact Inspector */}
              {activeArtifact && (
                <div className="p-4 bg-black/40 rounded-2xl border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Active Consent Artifact ({activeArtifact.consentId})
                    </span>
                    <button
                      onClick={() => setActiveArtifact(null)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono bg-black/50 p-3 rounded-xl border border-white/5 text-slate-300 overflow-x-auto">
                    {JSON.stringify(activeArtifact, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: M3 ENCRYPTED FHIR EXCHANGE SIMULATOR */}
          {activeTab === 'm3_transfer' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">ABDM Encrypted FHIR R4 Data Exchange Simulator</h3>
                <p className="text-xs text-muted">
                  Demonstrates the full end-to-end ECDH Curve25519 key exchange + AES-GCM-256 encrypted payload transfer conforming to NHA specifications.
                </p>
              </div>

              {/* Interactive Simulation Trigger */}
              <div className="p-6 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-black/30 rounded-3xl border border-indigo-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-white text-base">Run Simulated Encrypted Transfer</h4>
                    <p className="text-xs text-slate-400">
                      Target: Apollo Telehealth (HIU-APOLLO-001) • Consent: ART-APOLLO-9481
                    </p>
                  </div>

                  <button
                    onClick={handleRunTransferSimulation}
                    disabled={isSimulatingTransfer}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
                  >
                    {isSimulatingTransfer ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSimulatingTransfer ? 'Simulating Transfer...' : 'Execute Encrypted Exchange'}
                  </button>
                </div>

                {/* Simulation Step Progress */}
                {isSimulatingTransfer && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>
                        {simulationStep === 1 && '1. Establishing ECDH Curve25519 Key Agreement...'}
                        {simulationStep === 2 && '2. Compiling Clinical Data to FHIR R4 Bundle...'}
                        {simulationStep === 3 && '3. Encrypting with AES-GCM-256 & Computing Checksum...'}
                        {simulationStep === 4 && '4. Finalizing Gateway Handover...'}
                      </span>
                      <span className="font-mono text-indigo-400">{simulationStep * 25}%</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${simulationStep * 25}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Transfer Result Envelope */}
              {transferResult && (
                <div className="space-y-4">
                  <div className="p-5 bg-black/30 rounded-2xl border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-bold text-white text-sm">Exchange Envelope: {transferResult.transactionId}</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Algorithm: ECDH-Curve25519 + AES-GCM-256
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted">
                      <div><strong>Transaction ID:</strong> <span className="font-mono text-slate-300">{transferResult.transactionId}</span></div>
                      <div><strong>SHA-256 Checksum:</strong> <span className="font-mono text-slate-300 truncate block">{transferResult.checksum}</span></div>
                      <div><strong>Ciphertext Envelope:</strong> <span className="font-mono text-indigo-300 truncate block">{transferResult.encryptedData}</span></div>
                      <div><strong>Records Transferred:</strong> <span className="text-white font-bold">{transferResult.recordCount} Biomarkers</span></div>
                    </div>
                  </div>

                  {/* Decrypted FHIR Bundle Inspection */}
                  {transferResult.decryptedBundle && (
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          Live Decrypted FHIR R4 Bundle ({transferResult.decryptedBundle.entry?.length || 0} Entries)
                        </span>
                        <button
                          onClick={() => downloadFhirJson(transferResult.decryptedBundle, `abdm_decrypted_bundle_${Date.now()}`)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download JSON
                        </button>
                      </div>

                      <pre className="text-[11px] font-mono bg-black/60 p-4 rounded-xl border border-white/5 text-slate-300 max-h-60 overflow-y-auto">
                        {JSON.stringify(transferResult.decryptedBundle, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-white/10 bg-black/20 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>NHA ABDM Sandbox Gateway Online</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
