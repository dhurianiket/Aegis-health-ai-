import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { compareReports, ComparisonRow } from '../../utils/reportComparison';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ReportComparisonProps {
  reportAId: string;
  reportBId: string;
  reportADate: string;
  reportBDate: string;
  onClose: () => void;
}

export default function ReportComparison({ reportAId, reportBId, reportADate, reportBDate, onClose }: ReportComparisonProps) {
  const { user } = useAuth();
  const [data, setData] = useState<{ rows: ComparisonRow[], summary: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const [errorA, setErrorA] = useState(false);
  const [errorB, setErrorB] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setErrorA(false);
      setErrorB(false);
      setLoading(true);
      try {
        let docA, docB;
        // ⚡ Bolt Optimization: Run independent document fetches concurrently using Promise.allSettled
        // This halves the network latency compared to awaiting them sequentially.
        const [resultA, resultB] = await Promise.allSettled([
          getDoc(doc(db, 'users', user.uid, 'documents', reportAId)),
          getDoc(doc(db, 'users', user.uid, 'documents', reportBId))
        ]);

        if (resultA.status === 'fulfilled') {
          docA = resultA.value;
        } else {
          console.error("Failed to load report A for comparison:", resultA.reason);
          setErrorA(true);
        }

        if (resultB.status === 'fulfilled') {
          docB = resultB.value;
        } else {
          console.error("Failed to load report B for comparison:", resultB.reason);
          setErrorB(true);
        }

        if (docA?.exists() && docB?.exists()) {
          const obsA = docA.data().extractedData?.observations || docA.data().extractedData?.lab_values || [];
          const obsB = docB.data().extractedData?.observations || docB.data().extractedData?.lab_values || [];

          // Compare
          const result = compareReports(obsA, obsB, reportADate, reportBDate);
          setData(result);
        }
      } catch (err) {
        console.error("Failed to load reports for comparison:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, reportAId, reportBId, reportADate, reportBDate, retryCount]);

  if (errorA || errorB) {
    return (
      <div className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-sm overflow-y-auto w-full h-screen flex flex-col justify-center items-center" role="dialog" aria-modal="true">
        <div className="bg-[var(--color-surface)] p-8 rounded-2xl flex flex-col items-center">
            <p className="text-red-400 mb-4 text-center">Failed to load this report.</p>
            <button 
              onClick={() => { setRetryCount(old => old + 1); }}
              className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold uppercase"
            >
              Tap to retry
            </button>
            <button onClick={onClose} className="mt-4 text-sm text-[var(--color-text-muted)] underline">Cancel</button>
        </div>
      </div>
    );
  }

  if (!data && loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-sm overflow-y-auto w-full h-screen" role="dialog" aria-modal="true">
        <div className="bg-[var(--color-surface)] p-8 rounded-2xl flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted text-sm">Analyzing clinical divergence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-sm overflow-y-auto w-full h-screen" role="dialog" aria-modal="true">
      <div className="bg-[var(--color-bg)] w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-[var(--color-border)] overflow-hidden">
        
        {/* Header Element */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Comparing <span className="font-mono text-sm text-[var(--color-primary)]">{reportADate}</span> vs <span className="font-mono text-sm text-[var(--color-primary)]">{reportBDate}</span>
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-[var(--color-bg)] rounded-full text-[var(--color-text-muted)] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Summary Chips */}
        {data && (
          <div className="px-6 py-4 flex flex-wrap gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
            <div className="px-3 py-1.5 rounded-full border border-green-500/20 bg-green-500/10 text-green-600 text-xs font-semibold flex items-center gap-1.5">
              Improved: {data.summary.improved}
            </div>
            <div className="px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-600 text-xs font-semibold flex items-center gap-1.5">
              Worsened: {data.summary.worsened}
            </div>
            <div className="px-3 py-1.5 rounded-full border border-slate-500/20 bg-slate-500/10 text-slate-600 text-xs font-semibold flex items-center gap-1.5">
              Stable: {data.summary.stable}
            </div>
            <div className="px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 text-xs font-semibold flex items-center gap-1.5">
              New Tests: {data.summary.newTests}
            </div>
          </div>
        )}

        {/* Data Grid Table */}
        <div className="flex-1 overflow-auto bg-[var(--color-bg)]">
          <table className="w-full text-left text-sm whitespace-normal break-words">
            <thead className="sticky top-0 bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[11px] uppercase tracking-widest font-semibold z-10 border-b border-[var(--color-border)] shadow-sm">
              <tr>
                <th className="px-6 py-3">Test</th>
                <th className="px-6 py-3">Panel</th>
                <th className="px-6 py-3">{reportADate} Value</th>
                <th className="px-6 py-3">{reportBDate} Value</th>
                <th className="px-6 py-3">Change Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
              {data?.rows.map((row, i) => {
                const isWorsened = row.direction === 'worsened';
                const isImproved = row.direction === 'improved';
                
                return (
                  <tr key={i} className={`hover:bg-[var(--color-surface)]/50 transition-colors ${isWorsened ? 'border-l-4 border-l-amber-500 bg-amber-50/5' : 'border-l-4 border-l-transparent'}`}>
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      {row.testName}
                      {row.isNewInB && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">NEW</span>}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-muted)]">{row.panel || '-'}</td>
                    
                    <td className="px-6 py-4">
                      {row.isNewInB ? '-' : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{row.valueA ?? '-'}</span>
                          <span className="text-[10px] text-[var(--color-text-muted)]">{row.unitA}</span>
                          {row.flagA && row.flagA !== 'NORMAL' && (
                            <span className="text-[10px] font-bold bg-slate-500/10 text-slate-500 px-1.5 rounded">{row.flagA}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {row.isMissingInB ? '-' : (
                         <div className="flex items-center gap-2">
                           <span className="font-mono">{row.valueB ?? '-'}</span>
                           <span className="text-[10px] text-[var(--color-text-muted)]">{row.unitB}</span>
                           {row.flagB && row.flagB !== 'NORMAL' && (
                             <span className={`text-[10px] font-bold px-1.5 rounded ${isWorsened ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-500'}`}>{row.flagB}</span>
                           )}
                         </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs">
                      {row.deltaPercent !== null ? (
                        <div className={`flex items-center gap-1 ${isWorsened ? 'text-amber-500' : isImproved ? 'text-green-500' : 'text-slate-500'}`}>
                          {row.direction === 'worsened' ? <ArrowUpRight size={14} className={row.delta! < 0 ? 'rotate-90' : ''} /> : 
                           row.direction === 'improved' ? <ArrowDownRight size={14} className={row.delta! > 0 ? '-rotate-90' : ''} /> : null}
                          <span>
                            {row.delta! > 0 ? '+' : ''}{row.deltaPercent.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">{row.direction === 'unchanged' ? 'Unchanged' : '-'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data?.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted">No comparable data points found between these reports.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
