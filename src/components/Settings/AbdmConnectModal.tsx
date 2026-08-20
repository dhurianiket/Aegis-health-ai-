import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, QrCode, Smartphone, RefreshCw, KeyRound, Lock, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import {
  AbhaProfile,
  getAbdmProfile,
  requestAbdmOtp,
  confirmAbdmOtp,
  linkAbdmCareContext,
} from '../../services/abdmService';

interface AbdmConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (profile: AbhaProfile) => void;
}

export default function AbdmConnectModal({ isOpen, onClose, onSuccess }: AbdmConnectModalProps) {
  const { user } = useAuth();
  const userId = user?.uid || 'demo-user-id';

  const [step, setStep] = useState<'input' | 'otp' | 'connected'>('input');
  const [mobileOrAadhaar, setMobileOrAadhaar] = useState('9876543210');
  const [preferredAddress, setPreferredAddress] = useState('aniket.dhuri');
  const [otp, setOtp] = useState('');
  const [txnId, setTxnId] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<AbhaProfile | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const existing = getAbdmProfile(userId);
    if (existing) {
      setProfile(existing);
      setStep('connected');
    }
  }, [userId, isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await requestAbdmOtp(mobileOrAadhaar);
      setTxnId(res.txnId);
      setStep('otp');
      setFeedback('OTP sent via SMS to Aadhaar registered mobile (+91 ******3210).');
    } catch (err: any) {
      setFeedback('Failed to initiate ABDM Gateway auth.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const newProf = await confirmAbdmOtp(txnId, otp || '123456', userId, preferredAddress);
      setProfile(newProf);
      setStep('connected');
      setFeedback('ABHA Card successfully created & linked to Aegis Health AI!');
      if (onSuccess) onSuccess(newProf);
    } catch (err: any) {
      setFeedback('Invalid OTP. Please check code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkTestRecord = async () => {
    setLoading(true);
    try {
      const res = await linkAbdmCareContext(userId, {
        referenceNumber: `REC-${Date.now()}`,
        display: 'Complete Blood Count (CBC) & Lipid Panel',
        type: 'LabReport',
        date: new Date().toISOString(),
      });
      const updated = getAbdmProfile(userId);
      if (updated) setProfile(updated);
      setFeedback(`Care Context linked! Total ABDM Records: ${res.updatedCount}`);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to link care context.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-slate-900/95 border border-orange-500/30 rounded-[32px] shadow-[0_16px_40px_-8px_rgba(234,88,12,0.25)] p-6 md:p-8 overflow-hidden text-slate-50"
        >
          {/* Glowing Ambient Background */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-radial from-orange-500/20 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-orange-500 to-amber-700 text-white shadow-lg shrink-0">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-[10px] font-extrabold uppercase tracking-widest mb-1">
                <ShieldCheck className="w-3 h-3" /> NHA ABDM Gateway Verified
              </div>
              <h2 className="text-2xl font-extrabold text-slate-50 tracking-tight">
                Ayushman Bharat Digital Health ID (ABHA)
              </h2>
            </div>
          </div>

          {feedback && (
            <div className="mb-6 p-4 rounded-2xl text-xs font-bold text-center bg-orange-500/15 border border-orange-400/40 text-orange-300 relative z-10">
              {feedback}
            </div>
          )}

          {/* STEP 1: Mobile/Aadhaar Input */}
          {step === 'input' && (
            <form onSubmit={handleSendOtp} className="space-y-5 relative z-10">
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect your 14-digit ABHA ID to sync longitudinal medical histories across hospitals, polyclinics, and diagnostic labs in India.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Aadhaar Number or Registered Mobile Number
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={mobileOrAadhaar}
                    onChange={(e) => setMobileOrAadhaar(e.target.value)}
                    placeholder="Enter 10-digit mobile or 12-digit Aadhaar"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-50 focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Preferred ABHA Handle (@abdm)
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={preferredAddress}
                    onChange={(e) => setPreferredAddress(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-l-xl text-xs font-bold text-slate-50 focus:border-orange-500 focus:outline-none"
                  />
                  <span className="px-3.5 py-2.5 bg-slate-800 border border-l-0 border-slate-800 rounded-r-xl text-xs font-bold text-orange-400">
                    @abdm
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Requesting ABDM Gateway OTP...' : 'Request Aadhaar / Mobile OTP'}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 relative z-10">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter the 6-digit verification code sent to your Aadhaar-linked mobile number.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  6-Digit OTP
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 123456"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-black tracking-widest text-slate-50 focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loading ? 'Verifying ABHA ID...' : 'Verify OTP & Connect ABHA'}
              </button>
            </form>
          )}

          {/* STEP 3: Connected Profile Card */}
          {step === 'connected' && profile && (
            <div className="space-y-6 relative z-10">
              {/* Virtual ABHA Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-orange-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400">
                    National Health Authority • ABHA Card
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                    Verified Link
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Full Name</span>
                    <span className="font-extrabold text-slate-50">{profile.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider">ABHA Handle</span>
                    <span className="font-extrabold text-orange-300">{profile.abhaAddress}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider">ABHA Number</span>
                    <span className="font-extrabold tracking-wider text-slate-50">{profile.abhaNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Linked Records</span>
                    <span className="font-extrabold text-emerald-300">{profile.linkedCareContextsCount} FHIR Care Contexts</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleLinkTestRecord}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-500/20 border border-orange-400/40 hover:bg-orange-500/30 text-orange-300 text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LinkIcon className="w-4 h-4" /> Link Lab Care Context
                </button>
                <button
                  onClick={onClose}
                  className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
