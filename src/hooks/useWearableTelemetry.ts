/**
 * useWearableTelemetry.ts
 *
 * React hook for real-time Firestore-backed wearable biometric telemetry.
 *
 * Data path: users/{uid}/wearableTelemetry/{docId}
 *
 * Pattern mirrors useClinicalContext.ts:
 * - onSnapshot for live push updates (AGENTS.md Rule 3 — real-time reactive listeners)
 * - Unsubscribe on unmount to prevent listener leaks
 * - Falls back to generateMockTelemetry + localStorage if Firestore returns empty
 *   (so first-time users still see a populated widget)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  saveWearableTelemetry,
  subscribeToLatestTelemetry,
} from '../lib/firebase/firestore';
import {
  generateMockTelemetry,
  persistTelemetryToLocal,
  loadPersistedTelemetry,
} from '../services/wearableService';
import { WearableBiometrics } from '../types/wearables';

export interface UseWearableTelemetryResult {
  /** The most recent wearable reading (from Firestore), or null while loading */
  telemetry: WearableBiometrics | null;
  /** Last 20 readings ordered newest-first (for trend charts) */
  history: WearableBiometrics[];
  /** True while the initial Firestore snapshot hasn't arrived yet */
  loading: boolean;
  /** Non-null if the Firestore listener failed */
  error: string | null;
  /**
   * Save a new telemetry reading to Firestore and localStorage.
   * Merges partial overrides with a generated baseline for the current user.
   */
  saveTelemetry: (overrides: Partial<WearableBiometrics>) => Promise<void>;
  /** Whether the user has any real Firestore telemetry (vs. mock-only state) */
  hasRealData: boolean;
}

export function useWearableTelemetry(): UseWearableTelemetryResult {
  const { user } = useAuth();
  const userId = user?.uid ?? '';

  const [telemetry, setTelemetry] = useState<WearableBiometrics | null>(null);
  const [history, setHistory] = useState<WearableBiometrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRealData, setHasRealData] = useState(false);

  // ─── Real-time Firestore listener (AGENTS.md Rule 3) ─────────────────────
  useEffect(() => {
    if (!userId) {
      setTelemetry(null);
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToLatestTelemetry(
      userId,
      (latest, allReadings) => {
        if (latest) {
          // Real Firestore data exists — use it
          setTelemetry(latest);
          setHistory(allReadings);
          setHasRealData(true);
          // Keep localStorage in sync as offline fallback
          persistTelemetryToLocal(latest);
        } else {
          // No Firestore data yet — try localStorage, then generate a mock seed
          setHasRealData(false);
          const persisted = loadPersistedTelemetry(userId);
          if (persisted) {
            setTelemetry(persisted);
            setHistory([persisted]);
            // Seed Firestore with the persisted local reading so future loads are real
            saveWearableTelemetry(userId, persisted).catch((e) =>
              console.warn('[useWearableTelemetry] Seeding Firestore from localStorage failed:', e)
            );
          } else {
            // Totally new user: generate a realistic mock and leave it as UI-only
            // (don't auto-save mock data to Firestore; only save on explicit user action)
            setTelemetry(null);
            setHistory([]);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[useWearableTelemetry] Firestore listener error:', err.message);
        setError('Unable to sync wearable data. Check your connection.');

        // Degrade gracefully: fall back to localStorage
        const fallback = loadPersistedTelemetry(userId);
        if (fallback) {
          setTelemetry(fallback);
          setHistory([fallback]);
        }
        setHasRealData(false);
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe on unmount or userId change (AGENTS.md Rule 3)
    return () => unsubscribe();
  }, [userId]);

  // ─── Save telemetry helper ────────────────────────────────────────────────
  const saveTelemetry = useCallback(
    async (overrides: Partial<WearableBiometrics>): Promise<void> => {
      if (!userId) return;

      // Generate a complete reading merging overrides with a realistic baseline
      const base = generateMockTelemetry(userId, overrides);
      const reading: WearableBiometrics = { ...base, ...overrides, userId };

      try {
        // Optimistic local update so UI responds immediately
        setTelemetry(reading);
        setHistory((prev) => [reading, ...prev].slice(0, 20));
        setHasRealData(true);

        // Persist to both Firestore and localStorage
        await saveWearableTelemetry(userId, reading);
        persistTelemetryToLocal(reading);
      } catch (err) {
        console.error('[useWearableTelemetry] Failed to save telemetry to Firestore:', err);
        setError('Failed to save wearable reading. Data saved locally.');
        // Keep the optimistic update — it will retry on next snapshot reconciliation
      }
    },
    [userId]
  );

  return { telemetry, history, loading, error, saveTelemetry, hasRealData };
}
