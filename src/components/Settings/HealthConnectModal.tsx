import React, { useState, useEffect } from 'react';
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
  FileCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HealthProvider,
  syncAppleHealth,
  syncGoogleHealth,
  parseAppleHealthExport,
  parseGoogleHealthExport,
  getHealthSyncState,
  getHealthPermissions,
  saveHealthPermissions,
  HealthPermissions,
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
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Biometric permission toggles state
  const [permissions, setPermissions] = useState<HealthPermissions>(() =>
    getHealthPermissions(userId, provider)
  );

  useEffect(() => {
    setPermissions(getHealthPermissions(userId, provider));
  }, [userId, provider]);

  // Manual inputs
  const [manualHR, setManualHR] = useState(70);
  const [manualRHR, setManualRHR] = useState(62);
  const [manualHRV, setManualHRV] = useState(58);
  const [manualSpO2, setManualSpO2] = useState(98);
  const [manualSteps, setManualSteps] = useState(8200);
  const [manualTotalSleep, setManualTotalSleep] = useState(480);
  const [manualDeepSleep, setManualDeepSleep] = useState(110);
  const [manualRemSleep, setManualRemSleep] = useState(105);

  if (!isOpen) return null;

  const isApple = provider === 'apple';
  const providerTitle = isApple ? 'Apple Health (HealthKit)' : 'Google Health Connect';
  const ProviderIcon = isApple ? Apple : Chrome;

  const togglePermission = (key: keyof HealthPermissions) => {
    const updated = saveHealthPermissions(userId, provider, { [key]: !permissions[key] });
    setPermissions(updated);
  };

  const handleConnectSync = async () => {
    setIsSyncing(true);
    setFeedback(null);

    try {
      const result = isApple ? await syncAppleHealth(userId) : await syncGoogleHealth(userId);
      if (result.success) {
        setFeedback({
          type: 'success',
          message: `Successfully connected & synced biometrics from ${providerTitle}!`,
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

  const processFile = (file: File) => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
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
      sleep: {
        totalMinutes: manualTotalSleep,
        deepMinutes: manualDeepSleep,
        remMinutes: manualRemSleep,
        lightMinutes: Math.max(0, manualTotalSleep - manualDeepSleep - manualRemSleep),
      },
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
          className="relative w-full max-w-xl bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-700/60 rounded-[32px] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.15)] p-6 md:p-8 overflow-hidden"
        >
          {/* Ambient Glow */}
          <div
            className={`absolute -top-24 -left-24 w-72 h-72 bg-radial ${
              isApple ? 'from-slate-400/20 via-rose-500/10' : 'from-blue-500/25 via-teal-400/15'
            } to-transparent blur-3xl pointer-events-none`}
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div
              className={`p-3.5 rounded-2xl ${
                isApple
                  ? 'bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700/80 text-white shadow-[0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'bg-gradient-to-b from-blue-600 to-indigo-900 border border-blue-400/60 text-white shadow-[0_8px_20px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]'
              } shrink-0`}
            >
              <ProviderIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-extrabold uppercase tracking-widest mb-1">
                <ShieldCheck className="w-3 h-3" /> Encrypted Telemetry Bridge
              </div>
              <h2 className="text-2xl font-extrabold text-slate-50 tracking-tight">
                {providerTitle}
              </h2>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex p-1 bg-slate-950/60 border border-slate-800/80 rounded-2xl mb-6 relative z-10">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'permissions'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Sync & Permissions
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Import Export File
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Manual Metrics
            </button>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center border relative z-10 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-400/40 text-rose-300'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* TAB 1: Permissions & Live Connect */}
          {activeTab === 'permissions' && (
            <div className="space-y-6 relative z-10">
              <p className="text-xs text-slate-200 leading-relaxed">
                Connect Aegis Health AI with {providerTitle} to continuously sync resting heart rate, HRV, blood oxygen, daily steps, and sleep stages into your clinical dashboard.
              </p>

              <div className="space-y-2 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
                {/* Permission Row 1 */}
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/60">
                  <span className="flex items-center gap-2 text-slate-100 font-semibold">
                    <Heart className="w-4 h-4 text-rose-400" /> Heart Rate & Resting HR
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePermission('heartRate')}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer border ${
                      permissions.heartRate
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {permissions.heartRate ? 'Allowed' : 'Disabled'}
                  </button>
                </div>

                {/* Permission Row 2 */}
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/60">
                  <span className="flex items-center gap-2 text-slate-100 font-semibold">
                    <Activity className="w-4 h-4 text-teal-400" /> HRV (Heart Rate Variability)
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePermission('hrv')}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer border ${
                      permissions.hrv
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {permissions.hrv ? 'Allowed' : 'Disabled'}
                  </button>
                </div>

                {/* Permission Row 3 */}
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/60">
                  <span className="flex items-center gap-2 text-slate-100 font-semibold">
                    <Activity className="w-4 h-4 text-cyan-400" /> Blood Oxygen (SpO2)
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePermission('spo2')}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer border ${
                      permissions.spo2
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {permissions.spo2 ? 'Allowed' : 'Disabled'}
                  </button>
                </div>

                {/* Permission Row 4 */}
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/60">
                  <span className="flex items-center gap-2 text-slate-100 font-semibold">
                    <Footprints className="w-4 h-4 text-emerald-400" /> Daily Steps & Activity
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePermission('steps')}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer border ${
                      permissions.steps
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {permissions.steps ? 'Allowed' : 'Disabled'}
                  </button>
                </div>

                {/* Permission Row 5 */}
                <div className="flex items-center justify-between text-xs py-2">
                  <span className="flex items-center gap-2 text-slate-100 font-semibold">
                    <Moon className="w-4 h-4 text-indigo-400" /> Sleep Architecture Stages
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePermission('sleep')}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer border ${
                      permissions.sleep
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {permissions.sleep ? 'Allowed' : 'Disabled'}
                  </button>
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

          {/* TAB 2: File Import with Drag & Drop */}
          {activeTab === 'file' && (
            <div className="space-y-6 relative z-10">
              <p className="text-xs text-slate-200 leading-relaxed">
                Export health records from your iPhone ({`Health App -> Export Health Data -> export.xml`}) or Android Google Health Connect JSON export, then drop the file here.
              </p>

              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-teal-400 bg-teal-500/20 scale-[1.02]'
                    : 'border-teal-500/40 hover:border-teal-400 bg-slate-950/60'
                }`}
              >
                <Upload className={`w-10 h-10 mb-3 transition-transform ${isDragging ? 'text-teal-300 scale-125' : 'text-teal-400'}`} />
                <span className="text-sm font-bold text-slate-50 mb-1">
                  Upload {providerTitle} File
                </span>
                <span className="text-xs text-slate-300 mb-4">
                  Drag and drop your .xml (Apple Health export.xml) or .json file here, or click to browse
                </span>
                <span className="px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-bold uppercase tracking-wider">
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
            <div className="space-y-5 relative z-10">
              <p className="text-xs text-slate-200 leading-relaxed">
                Enter your exact daily metrics directly from your smartwatch (Apple Watch, Fitbit, Garmin, Samsung Galaxy Watch).
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    value={manualHR}
                    onChange={(e) => setManualHR(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Resting HR (BPM)
                  </label>
                  <input
                    type="number"
                    value={manualRHR}
                    onChange={(e) => setManualRHR(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    HRV Baseline (ms)
                  </label>
                  <input
                    type="number"
                    value={manualHRV}
                    onChange={(e) => setManualHRV(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Blood Oxygen SpO2 (%)
                  </label>
                  <input
                    type="number"
                    value={manualSpO2}
                    onChange={(e) => setManualSpO2(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Daily Steps
                </label>
                <input
                  type="number"
                  value={manualSteps}
                  onChange={(e) => setManualSteps(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-50"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Total Sleep (min)
                  </label>
                  <input
                    type="number"
                    value={manualTotalSleep}
                    onChange={(e) => setManualTotalSleep(Number(e.target.value))}
                    className="w-full p-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Deep Sleep (min)
                  </label>
                  <input
                    type="number"
                    value={manualDeepSleep}
                    onChange={(e) => setManualDeepSleep(Number(e.target.value))}
                    className="w-full p-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    REM Sleep (min)
                  </label>
                  <input
                    type="number"
                    value={manualRemSleep}
                    onChange={(e) => setManualRemSleep(Number(e.target.value))}
                    className="w-full p-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-50"
                  />
                </div>
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
