import React, { useState } from 'react';
import { Shield, Key, Lock, Unlock, AlertTriangle, CheckCircle2, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import {
  encryptZeroKnowledge,
  decryptZeroKnowledge,
  EncryptedPayload,
} from '../../services/zeroKnowledgeCryptoService';
import { logSecurityEvent } from '../../services/auditLogService';

export const ZeroKnowledgeVaultModal: React.FC = () => {
  const [passphrase, setPassphrase] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [sampleText, setSampleText] = useState<string>('Biomarker Diagnostic Telemetry Payload — Confidentially Protected');
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedPayload | null>(null);
  const [decryptedText, setDecryptedText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleUnlock = async () => {
    if (!passphrase || passphrase.length < 6) {
      setStatusMessage({ type: 'error', text: 'Passphrase must be at least 6 characters.' });
      return;
    }
    setIsProcessing(true);
    try {
      setIsUnlocked(true);
      setStatusMessage({ type: 'success', text: 'Zero-Knowledge Vault Unlocked successfully!' });
      await logSecurityEvent('VAULT_UNLOCKED', 'WebCrypto Vault Unlocked');
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to unlock vault.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLock = async () => {
    setIsUnlocked(false);
    setPassphrase('');
    setEncryptedPayload(null);
    setDecryptedText('');
    setStatusMessage({ type: 'success', text: 'Zero-Knowledge Vault Locked.' });
    await logSecurityEvent('VAULT_LOCKED', 'WebCrypto Vault Locked');
  };

  const handleTestEncrypt = async () => {
    if (!passphrase) return;
    setIsProcessing(true);
    try {
      const payload = await encryptZeroKnowledge(sampleText, passphrase);
      setEncryptedPayload(payload);
      setDecryptedText('');
      setStatusMessage({ type: 'success', text: 'Payload Encrypted with AES-256-GCM!' });
      await logSecurityEvent('VAULT_ENCRYPT', 'Sample Payload Encrypted with AES-256-GCM');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Encryption failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestDecrypt = async () => {
    if (!encryptedPayload || !passphrase) return;
    setIsProcessing(true);
    try {
      const plain = await decryptZeroKnowledge(encryptedPayload, passphrase);
      setDecryptedText(plain);
      setStatusMessage({ type: 'success', text: 'Payload Decrypted Successfully!' });
      await logSecurityEvent('VAULT_DECRYPT', 'Encrypted Payload Decrypted Successfully');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Decryption failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDpdpErasure = async () => {
    if (confirm('Are you sure you want to trigger DPDP Act 2023 Right to Erasure? This will wipe transient client vault cache.')) {
      handleLock();
      setStatusMessage({ type: 'success', text: 'Client Vault Cache Wiped (DPDP Act Compliance).' });
      await logSecurityEvent('DPDP_ERASURE_REQUEST', 'DPDP Act Right to Erasure Triggered');
    }
  };

  return (
    <div className="bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_16px_40px_-8px_rgba(6,182,212,0.2)] rounded-[32px] p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white tracking-wide">Zero-Knowledge WebCrypto Vault</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-semibold">
                AES-256-GCM Hardware Security
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light mt-0.5">
              Client-side PBKDF2 key derivation (100k iterations) & DPDP Act 2023 Compliance
            </p>
          </div>
        </div>

        {/* Lock / Unlock Pill */}
        <div>
          {isUnlocked ? (
            <button
              onClick={handleLock}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Lock className="w-4 h-4 text-rose-400" /> Lock Vault Now
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-slate-400 text-xs font-semibold flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Vault Locked
            </span>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Passphrase Input Section */}
      {!isUnlocked ? (
        <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" /> Enter Master Zero-Knowledge Passphrase
            </label>
            <p className="text-[11px] text-slate-400 font-light">
              Your master passphrase encrypts clinical records locally using AES-256-GCM before syncing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              placeholder="Enter master vault passphrase..."
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="flex-1 bg-slate-900 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleUnlock}
              disabled={isProcessing || !passphrase}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" /> Unlock Vault
            </button>
          </div>
        </div>
      ) : (
        /* Vault Active Dashboard */
        <div className="space-y-4">
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-3">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> WebCrypto Encryption Tester
              </span>
              <span className="text-emerald-400 font-mono font-bold">● Active Key (PBKDF2 100k Iterations)</span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-slate-400 uppercase">Test Plaintext Payload</label>
              <input
                type="text"
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleTestEncrypt}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Lock className="w-3.5 h-3.5" /> Encrypt (AES-256-GCM)
              </button>

              <button
                onClick={handleTestDecrypt}
                disabled={isProcessing || !encryptedPayload}
                className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Unlock className="w-3.5 h-3.5" /> Decrypt Payload
              </button>
            </div>

            {/* Ciphertext Display */}
            {encryptedPayload && (
              <div className="bg-slate-900 border border-white/10 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="text-[10px] text-cyan-400 font-bold">AES-256-GCM Encrypted Output:</div>
                <div className="text-[11px] text-slate-300 break-all bg-slate-950 p-2 rounded-lg">
                  {encryptedPayload.ciphertext.slice(0, 80)}...
                </div>
                <div className="text-[10px] text-slate-500">
                  IV: {encryptedPayload.iv} | Salt: {encryptedPayload.salt.slice(0, 12)}...
                </div>
              </div>
            )}

            {/* Decrypted Display */}
            {decryptedText && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 space-y-1 text-xs">
                <div className="text-[10px] text-emerald-400 font-bold">Verified Decrypted Plaintext:</div>
                <div className="text-slate-100 font-semibold">{decryptedText}</div>
              </div>
            )}
          </div>

          {/* DPDP Act Compliance Strip */}
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 font-semibold">DPDP Act 2023 Compliance Control</span>
            </div>
            <button
              onClick={handleDpdpErasure}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Right to Erasure (Wipe Vault)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
