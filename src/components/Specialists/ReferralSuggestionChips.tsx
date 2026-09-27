import React from "react";
import { CheckCircle2 } from "lucide-react";
import { SPECIALISTS } from "../../services/ai/specialists/specialistFactory";
import type { ReferralSuggestion } from "../../services/ai/specialists/referrals";

export type ReferralSuggestionStatus = "idle" | "saving" | "saved" | "error";

export interface ReferralSuggestionItem extends ReferralSuggestion {
  status: ReferralSuggestionStatus;
}

interface ReferralSuggestionChipsProps {
  suggestions: readonly ReferralSuggestionItem[];
  onSave: (index: number) => void;
  onDismiss: (index: number) => void;
  className?: string;
}

/**
 * Tap-to-save referral suggestions. Model-emitted referral tags are never
 * saved automatically; the user must explicitly tap "Save suggestion".
 */
export default function ReferralSuggestionChips({
  suggestions,
  onSave,
  onDismiss,
  className = "",
}: ReferralSuggestionChipsProps) {
  if (suggestions.length === 0) return null;
  return (
    <div data-testid="referral-suggestions" className={`flex flex-col gap-2 ${className}`}>
      {suggestions.map((sug, i) => {
        const target = SPECIALISTS[sug.toSpecialist];
        return (
          <div
            key={`${sug.toSpecialist}-${i}`}
            data-testid="referral-suggestion-chip"
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-[13px] text-slate-800 dark:text-slate-100"
          >
            <span className="flex-1 min-w-0">
              <strong>Suggested: talk to the {target.displayName}</strong>
              <span className="block text-[12px] text-slate-600 dark:text-slate-300">{sug.reason}</span>
            </span>
            {sug.status === "saved" ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onSave(i)}
                  disabled={sug.status === "saving"}
                  className="rounded-full bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {sug.status === "error" ? "Retry save" : "Save suggestion"}
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(i)}
                  className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:underline"
                >
                  Dismiss
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
