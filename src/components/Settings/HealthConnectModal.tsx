import React, { useState } from 'react';
import {
  X,
  Check,
  Apple,
  Chrome,
  ShieldCheck,
  Activity,
  Heart,
  Footprints,
  Moon,
  Upload,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HealthProvider,
  syncAppleHealth,
  syncGoogleHealth,
  parseAppleHealthExport,
  parseGoogleHealthExport,
  getHealthSyncState,
} from '../../services/healthSyncService';
import { useAuth } from '../../context/AuthContext';
import { CLINICAL_BOUNDS } from '../../services/wearableService';

interface HealthConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: HealthProvider;
  onSyncComplete?: () => void;
}

export default function HealthConnectModal({
  isOpen,
  onClose,
  provider,
  onSyncComplete,
}: HealthConnectModalProps) {
  const { user } = useAuth();
  const userId = user?.uid || 'demo-user-id';

  const [activeTab, setActiveTab] = useState<'permissions' | 'file' | 'manual'>('permissions');
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Manual inputs
  const [manualHR, setManualHR] = useState(70);
  const [manualRHR, setManualRHR] = useState(62);
  const [manualHRV, setManualHRV] = useState(58);
  const [manualSpO2, setManualSpO2] = useState(98);
  const [manualSteps, setManualSteps] = useState(8200);

  if (!isOpen) return null;

  const isApple = provider === 'apple';
  const providerTitle = isApple ? 'Apple Health (HealthKit)' : 'Google Health Connect';
  const ProviderIcon = isApple ? Apple : Chrome;

  const handleConnectSync = async () => {
    setIsSyncing(true);
    setFeedback(null);

    try {
      const result = isApple ? await syncAppleHealth(userId) : await syncGoogleHealth(userId);
      if (result.success) {
        setFeedback({
          type: 'success',
          message: `Successfully connected & synced 5 biometrics from ${providerTitle}!`,
        });
        if (onSyncComplete) onSyncComplete();
        setTimeout(() => onClose(), 1500);
      } else {
        setFeedback({
          type: 'error',
          message: result.error || `Failed to connect ${providerTitle}.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Sync error occurred.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        const biometrics = isApple
          ? parseAppleHealthExport(content, userId)
          : parseGoogleHealthExport(content, userId);

        setFeedback({
          type: 'success',
          message: `Successfully imported ${providerTitle} export! HR: ${biometrics.heartRate} bpm, Steps: ${biometrics.steps}.`,
        });
        if (onSyncComplete) onSyncComplete();
        setTimeout(() => onClose(), 1500);
      } catch {
        setFeedback({
          type: 'error',
          message: `Failed to parse ${providerTitle} export file. Please check file formatting.`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSaveManualMetrics = async () => {
    setIsSyncing(true);
    setFeedback(null);

    const customExport = JSON.stringify({
      heartRate: manualHR,
      rhr: manualRHR,
      hrv: manualHRV,
      spo2: manualSpO2,
      steps: manualSteps,
    });

    try {
      if (isApple) {
        parseAppleHealthExport(customExport, userId);
      } else {
        parseGoogleHealthExport(customExport, userId);
      }

      setFeedback({
        type: 'success',
        message: `Custom biometrics saved to ${providerTitle}! (HR: ${manualHR} bpm, SpO2: ${manualSpO2}%)`,
      });
      if (onSyncComplete) onSyncComplete();
      setTimeout(() => onClose(), 1500);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save manual biometrics.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] shadow-2xl p-6 md:p-8 overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-[var(--color-bg)] hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`p-3.5 rounded-2xl ${
                isApple
                  ? 'bg-slate-900 text-white border border-slate-700/60 dark:bg-slate-800'
                  : 'bg-blue-600 text-white'
              } shadow-lg shrink-0`}
            >
              <ProviderIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-extrabold uppercase tracking-widest mb-1">
                <ShieldCheck className="w-3 h-3" /> Encrypted Device Bridge
              </div>
              <h2 className="text-2xl font-extrabold text-[var(--color-text)] tracking-tight">
                {providerTitle}
              </h2>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex p-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl mb-6">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'permissions'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Live Sync & Permissions
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'file'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Import Export File
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'manual'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Manual Metrics
            </button>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center border ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* TAB 1: Permissions & Live Connect */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Connect Aegis Health AI with {providerTitle} to continuously sync resting heart rate, HRV, blood oxygen, daily steps, and sleep stages into your clinical dashboard.
              </p>

              <div className="space-y-2 bg-[var(--color-bg)] border border-[var(--color-border)] p-4 rounded-2xl">
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--color-border)]">
                  <span className="flex items-center gap-2 text-[var(--color-text)] font-semibold">
                    <Heart className="w-4 h-4 text-rose-400" /> Heart Rate & Resting HR
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--color-border)]">
                  <span className="flex items-center gap-2 text-[var(--color-text)] font-semibold">
                    <Activity className="w-4 h-4 text-teal-400" /> HRV (Heart Rate Variability)
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--color-border)]">
                  <span className="flex items-center gap-2 text-[var(--color-text)] font-semibold">
                    <Activity className="w-4 h-4 text-cyan-400" /> Blood Oxygen (SpO2)
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--color-border)]">
                  <span className="flex items-center gap-2 text-[var(--color-text)] font-semibold">
                    <Footprints className="w-4 h-4 text-emerald-400" /> Daily Steps & Activity
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="flex items-center gap-2 text-[var(--color-text)] font-semibold">
                    <Moon className="w-4 h-4 text-indigo-400" /> Sleep Architecture Stages
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              <button
                onClick={handleConnectSync}
                disabled={isSyncing}
                className="w-full py-3.5 px-6 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Connecting & Syncing...' : `Connect & Authorize ${providerTitle}`}
              </button>
            </div>
          )}

          {/* TAB 2: File Import */}
          {activeTab === 'file' && (
            <div className="space-y-6">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Export health records from your iPhone ({`Health App -> Export Health Data -> export.xml`}) or Android Google Health Connect JSON export, then drop the file here.
              </p>

              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-teal-500/40 hover:border-teal-400 rounded-3xl bg-[var(--color-bg)] text-center cursor-pointer transition-all">
                <Upload className="w-10 h-10 text-teal-400 mb-3" />
                <span className="text-sm font-bold text-[var(--color-text)] mb-1">
                  Upload {providerTitle} File
                </span>
                <span className="text-xs text-[var(--color-text-muted)] mb-4">
                  Supports .xml (Apple Health export.xml) and .json files
                </span>
                <span className="px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider">
                  Browse Files
                </span>
                <input
                  type="file"
                  accept=".xml,.json,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 3: Manual Metrics */}
          {activeTab === 'manual' && (
            <div className="space-y-5">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Enter your exact daily metrics directly from your smartwatch (Apple Watch, Fitbit, Garmin, Samsung Galaxy Watch).
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-muted)] block mb-1">
                    Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    value={manualHR}
                    onChange={(e) => setManualHR(Number(e.target.value))}
                    className="w-full p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-xs font-bold text-[var(--color-text)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-muted)] block mb-1">
                    Resting HR (BPM)
                  </label>
                  <input
                    type="number"
                    value={manualRHR}
                    onChange={(e) => setManualRHR(Number(e.target.value))}
                    className="w-full p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-xs font-bold text-[var(--color-text)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-muted)] block mb-1">
                    HRV Baseline (ms)
                  </label>
                  <input
                    type="number"
                    value={manualHRV}
                    onChange={(e) => setManualHRV(Number(e.target.value))}
                    className="w-full p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-xs font-bold text-[var(--color-text)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-muted)] block mb-1">
                    Blood Oxygen SpO2 (%)
                  </label>
                  <input
                    type="number"
                    value={manualSpO2}
                    onChange={(e) => setManualSpO2(Number(e.target.value))}
                    className="w-full p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-xs font-bold text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--color-text-muted)] block mb-1">
                  Daily Steps
                </label>
                <input
                  type="number"
                  value={manualSteps}
                  onChange={(e) => setManualSteps(Number(e.target.value))}
                  className="w-full p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-xs font-bold text-[var(--color-text)]"
                />
              </div>

              <button
                onClick={handleSaveManualMetrics}
                disabled={isSyncing}
                className="w-full py-3.5 px-6 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                Save Custom {providerTitle} Biometrics
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
