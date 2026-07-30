import React from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { CLINICAL_GUIDELINES } from "../../services/sourceGroundedService";

/**
 * Custom ReactMarkdown Anchor component for rendering clickable, color-coded evidence pill badges.
 */
export const renderCitationLink = ({ href, children }: { href?: string; children?: React.ReactNode }) => {
  if (href?.startsWith("cite:")) {
    const guidelineId = href.replace("cite:", "");
    const guideline = CLINICAL_GUIDELINES[guidelineId];

    let colorClass = "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80";
    if (guideline?.organization === "ACC/AHA") {
      colorClass = "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/80";
    } else if (guideline?.organization === "ADA") {
      colorClass = "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/80";
    } else if (guideline?.organization === "KDIGO") {
      colorClass = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80";
    }

    return (
      <a
        href={guideline?.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        title={guideline ? `${guideline.title} (${guideline.evidenceLevel})` : "Verified Clinical Guideline"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 mx-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs hover:scale-105 hover:shadow-md ${colorClass}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>{children || guideline?.code || "Guideline"}</span>
        <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-medium">
      {children}
    </a>
  );
};
