import React from "react";
import { Phone, AlertTriangle } from "lucide-react";
import { EMERGENCY_HELPLINES, type TriageResult } from "../../services/ai/safety/triage";

interface EmergencyTriageCardProps {
  result: TriageResult;
}

interface CallButtonProps {
  href: string;
  number: string;
  labelEn: string;
  labelHi: string;
  variant: "primary" | "secondary" | "support";
}

const VARIANT_CLASSES: Record<CallButtonProps["variant"], string> = {
  primary: "bg-red-700 hover:bg-red-800 text-white border-red-800",
  secondary: "bg-white dark:bg-[#1C1C1E] hover:bg-red-50 dark:hover:bg-red-950/40 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800",
  support: "bg-white dark:bg-[#1C1C1E] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700",
};

function CallButton({ href, number, labelEn, labelHi, variant }: CallButtonProps) {
  return (
    <a
      href={href}
      aria-label={`Call ${number}, ${labelEn}`}
      className={`flex items-center gap-3 min-h-[56px] w-full rounded-2xl border-2 px-4 py-3 font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/50 ${VARIANT_CLASSES[variant]}`}
    >
      <Phone className="w-5 h-5 shrink-0" aria-hidden="true" />
      <span className="flex flex-col min-w-0">
        <span className="text-xl tracking-wide tabular-nums">{number}</span>
        <span className="text-[13px] leading-snug">
          {labelEn} · <span lang="hi">{labelHi}</span>
        </span>
      </span>
    </a>
  );
}

/**
 * Fixed, non-AI emergency card shown when the deterministic triage pre-check
 * flags a Specialist Lounge message. No model output is involved.
 */
export default function EmergencyTriageCard({ result }: EmergencyTriageCardProps) {
  const { national, ambulance, teleManasShort, teleManasTollFree } = EMERGENCY_HELPLINES;
  return (
    <section
      role="alert"
      aria-live="assertive"
      aria-labelledby="emergency-triage-title"
      data-testid="emergency-triage-card"
      className="my-4 mx-2 md:mx-4 rounded-3xl border-2 border-red-600 bg-red-50 dark:bg-red-950/30 p-5 shadow-lg"
    >
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-7 h-7 text-red-700 dark:text-red-400 shrink-0" aria-hidden="true" />
        <div>
          <h2 id="emergency-triage-title" className="text-lg font-bold text-red-900 dark:text-red-100 leading-tight">
            This may be a medical emergency
          </h2>
          <p lang="hi" className="text-base font-bold text-red-900 dark:text-red-100 leading-tight mt-1">
            यह एक मेडिकल इमरजेंसी हो सकती है
          </p>
          <p className="text-sm text-red-900 dark:text-red-100 mt-2">
            The AI specialist has not answered this message. Please get help from a person now.
          </p>
          <p lang="hi" className="text-sm text-red-900 dark:text-red-100">
            AI विशेषज्ञ ने इस संदेश का जवाब नहीं दिया है। कृपया अभी किसी व्यक्ति से मदद लें।
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <CallButton
          href={national.tel}
          number={national.number}
          labelEn="Emergency — call first"
          labelHi="आपातकाल — पहले यहाँ कॉल करें"
          variant="primary"
        />
        <CallButton
          href={ambulance.tel}
          number={ambulance.number}
          labelEn="Ambulance, if 112 does not connect"
          labelHi="एम्बुलेंस, अगर 112 न लगे"
          variant="secondary"
        />
      </div>

      {result.showMentalHealthLine && (
        <div className="mt-5 pt-4 border-t border-red-200 dark:border-red-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            You are not alone. Talk to a trained counsellor at Tele-MANAS — free, 24x7.
          </p>
          <p lang="hi" className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            आप अकेले नहीं हैं। Tele-MANAS पर प्रशिक्षित काउंसलर से बात करें — निःशुल्क, 24x7।
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <CallButton
              href={teleManasShort.tel}
              number={teleManasShort.number}
              labelEn="Tele-MANAS"
              labelHi="टेली-मानस"
              variant="support"
            />
            <CallButton
              href={teleManasTollFree.tel}
              number={teleManasTollFree.number}
              labelEn="Tele-MANAS toll-free"
              labelHi="टोल-फ्री"
              variant="support"
            />
          </div>
        </div>
      )}
    </section>
  );
}
