import React, { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { LOUNGE_CONSENT_DISCLOSURES, canSubmitLoungeConsent } from "../../services/lounge/loungeConsent";

interface LoungeConsentSheetProps {
  /** First name (or null) of the active profile — never the full name. */
  profileFirstName: string | null;
  isMinorProfile: boolean;
  saving: boolean;
  error: string | null;
  onAccept: (input: { guardianConfirmed: boolean }) => void;
}

/** One-time (per profile, per consent version) notice + consent for the Lounge. */
export default function LoungeConsentSheet({ profileFirstName, isMinorProfile, saving, error, onAccept }: LoungeConsentSheetProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);
  const who = profileFirstName ?? "this profile";
  const canSubmit = canSubmitLoungeConsent({ acknowledged, isMinorProfile, guardianConfirmed }) && !saving;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="lounge-consent-title"
      data-testid="lounge-consent-sheet"
      className="mx-auto max-w-xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] p-5 md:p-6 shadow-xl text-slate-900 dark:text-slate-100"
    >
      <div className="flex items-center gap-3 mb-3">
        <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <h3 id="lounge-consent-title" className="text-base md:text-lg font-bold">
          Before you use Health Guides (AI)
        </h3>
      </div>
      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-3">
        Please read how Health Guides (AI) work for {who}.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[13px] leading-relaxed text-slate-800 dark:text-slate-200">
        {LOUNGE_CONSENT_DISCLOSURES.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>

      <label className="mt-4 flex items-start gap-2 text-[13px] font-semibold">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5"
        />
        <span>I have read and understood this, and I agree to my questions and relevant health records being processed as described.</span>
      </label>

      {isMinorProfile && (
        <label className="mt-3 flex items-start gap-2 text-[13px] font-semibold text-amber-900 dark:text-amber-200 bg-amber-100/70 dark:bg-amber-900/30 rounded-xl p-3">
          <input
            type="checkbox"
            checked={guardianConfirmed}
            onChange={(e) => setGuardianConfirmed(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            This profile belongs to a child (under 18). I confirm I am their parent or lawful guardian and I give consent on their behalf.
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[13px] font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onAccept({ guardianConfirmed })}
        className="mt-4 w-full rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Agree and continue
      </button>
    </div>
  );
}
