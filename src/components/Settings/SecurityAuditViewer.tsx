import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Key, FileCode, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { getAuditLogs, clearAuditLogs, SecurityAuditRecord } from '../../services/auditLogService';

export const SecurityAuditViewer: React.FC = () => {
  const [logs, setLogs] = useState<SecurityAuditRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const reloadLogs = () => {
    setLogs(getAuditLogs());
  };

  useEffect(() => {
    reloadLogs();
  }, []);

  const handleClear = () => {
    if (confirm('Clear local security audit history?')) {
      clearAuditLogs();
      reloadLogs();
    }
  };

  const copyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('UNLOCKED') || action.includes('SUCCESS')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
          {action}
        </span>
      );
    }
    if (action.includes('ENCRYPT') || action.includes('DECRYPT')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
        {action}
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/30 shadow-[0_16px_40px_-8px_rgba(99,102,241,0.2)] rounded-[32px] p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white tracking-wide">Immutable Security Audit Trail</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-semibold">
                SHA-256 Tamper-Proof
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light mt-0.5">
              Cryptographic audit logger tracking security events and DPDP compliance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadLogs}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh logs"
            aria-label="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
            title="Clear logs"
            aria-label="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      {logs.length === 0 ? (
        <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-6 text-center text-xs text-slate-400">
          No security audit records logged.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-mono text-slate-400 uppercase">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Details & Actor</th>
                <th className="py-2.5 px-3 text-right">SHA-256 Checksum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">{getActionBadge(log.action)}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{log.details}</div>
                    <div className="text-[10px] text-slate-400 font-light mt-0.5">{log.actor}</div>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => copyHash(log.sha256Checksum, log.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 hover:border-indigo-400 font-mono text-[10px] text-indigo-300 cursor-pointer transition-colors inline-flex items-center gap-1.5"
                      aria-label={`Copy SHA-256 checksum ${log.sha256Checksum.slice(0, 12)}`}
                    >
                      <span>{log.sha256Checksum.slice(0, 12)}...</span>
                      {copiedId === log.id ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <FileCode className="w-3 h-3 text-slate-500" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
