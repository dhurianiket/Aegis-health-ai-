/**
 * User-facing text for the edge's per-user daily Health Guides (AI) quota
 * (HTTP 429, code LOUNGE_QUOTA_EXCEEDED). Reset time is shown in IST.
 */
export interface LoungeQuotaErrorLike {
  errorCode?: string;
  resetAt?: string;
  userMessage?: string;
}

/** Mirrors geminiClient's EdgeGeminiError.errorCode (duck-typed so tests can mock the client freely). */
export function isLoungeQuotaError(err: unknown): err is LoungeQuotaErrorLike {
  return !!err && typeof err === "object" && (err as { errorCode?: unknown }).errorCode === "LOUNGE_QUOTA_EXCEEDED";
}

export function formatIstResetTime(resetAt: string | undefined, now: Date = new Date()): string | null {
  if (!resetAt) return null;
  const reset = new Date(resetAt);
  if (Number.isNaN(reset.getTime())) return null;
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(reset);
  const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const day = dayKey(reset) === dayKey(now) ? "today" : dayKey(reset) === dayKey(tomorrow) ? "tomorrow" : null;
  return day ? `${time} IST ${day}` : `${time} IST`;
}

export function formatLoungeQuotaMessage(err: LoungeQuotaErrorLike, now: Date = new Date()): string {
  const when = formatIstResetTime(err.resetAt, now);
  const base = "You've reached today's Health Guides (AI) limit.";
  const reset = when ? ` It resets at ${when}.` : " It resets at midnight IST.";
  return `${base}${reset} Your records and earlier conversations are safe. If something feels urgent, please contact your doctor or call 112.`;
}
