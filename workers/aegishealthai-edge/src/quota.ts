/**
 * Per-user daily Specialist Lounge quota (messages + tokens), enforced at the
 * edge with one Durable Object instance per Firebase uid (atomic counters —
 * a DO processes requests for one id serially).
 *
 * Day boundary: midnight Asia/Kolkata (IST, UTC+5:30).
 *
 * Plan tier comes ONLY from the verified Firebase ID token (custom claim
 * `aegis_plan`, or `admin: true`). Client-sent plan data is never trusted.
 * Accounts without a claim are treated as "free".
 */

export type PlanTier = "free" | "paid" | "clinic" | "admin";

export interface QuotaLimits {
  messagesPerDay: number;
  tokensPerDay: number;
}

export const LOUNGE_QUOTA_LIMITS: Readonly<Record<PlanTier, QuotaLimits>> = {
  free: { messagesPerDay: 40, tokensPerDay: 150_000 },
  paid: { messagesPerDay: 200, tokensPerDay: 1_000_000 },
  clinic: { messagesPerDay: 600, tokensPerDay: 3_000_000 },
  admin: { messagesPerDay: 2_000, tokensPerDay: 10_000_000 },
};

const PAID_PLAN_IDS = new Set(["b2c_monthly", "b2c_quarterly", "paid", "pro", "premium"]);
const CLINIC_PLAN_IDS = new Set(["b2b_clinic_monthly", "b2b_clinic_quarterly", "clinic"]);

/** Maps verified token claims to a tier. Unknown / missing → "free" (fail-safe). */
export function resolvePlanTier(claims: Record<string, unknown> | undefined): PlanTier {
  if (!claims) return "free";
  if (claims.admin === true) return "admin";
  const raw = claims.aegis_plan ?? claims.plan;
  const plan = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (CLINIC_PLAN_IDS.has(plan)) return "clinic";
  if (PAID_PLAN_IDS.has(plan)) return "paid";
  return "free";
}

const IST_OFFSET_MS = 330 * 60 * 1000;

/** YYYY-MM-DD of the IST calendar day containing `now`. */
export function istDayKey(now: Date): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The next IST midnight after `now`, as a UTC Date. */
export function nextIstMidnight(now: Date): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const nextIstDayUtc = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + 1);
  return new Date(nextIstDayUtc - IST_OFFSET_MS);
}

export interface QuotaUsage {
  day: string;
  messages: number;
  tokens: number;
}

export interface QuotaDecision {
  allowed: boolean;
  usage: QuotaUsage;
  limits: QuotaLimits;
  resetAt: string;
  reason?: "messages" | "tokens";
}

/** Pure: evaluates a reservation of one message against current usage. */
export function evaluateReservation(current: QuotaUsage | undefined, limits: QuotaLimits, now: Date): QuotaDecision {
  const day = istDayKey(now);
  const usage: QuotaUsage = current && current.day === day ? { ...current } : { day, messages: 0, tokens: 0 };
  const resetAt = nextIstMidnight(now).toISOString();
  if (usage.messages >= limits.messagesPerDay) return { allowed: false, usage, limits, resetAt, reason: "messages" };
  if (usage.tokens >= limits.tokensPerDay) return { allowed: false, usage, limits, resetAt, reason: "tokens" };
  return { allowed: true, usage: { ...usage, messages: usage.messages + 1 }, limits, resetAt };
}

/** Minimal structural types so this compiles without @cloudflare/workers-types. */
export interface DurableStorageLike {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
}
export interface DurableStateLike {
  storage: DurableStorageLike;
}
export interface DurableStubLike {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}
export interface DurableNamespaceLike {
  idFromName(name: string): unknown;
  get(id: unknown): DurableStubLike;
}

const USAGE_KEY = "usage";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

/**
 * Durable Object: one instance per uid. Endpoints (internal only, never
 * routed publicly): POST /reserve {limits}, POST /commit {tokens}, POST /refund.
 */
export class LoungeQuota {
  private readonly state: DurableStateLike;

  constructor(state: DurableStateLike, _env?: unknown) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    const now = new Date();
    const body = (await request.json().catch(() => ({}))) as { limits?: QuotaLimits; tokens?: unknown };
    const current = await this.state.storage.get<QuotaUsage>(USAGE_KEY);

    if (path === "/reserve") {
      const limits = body.limits;
      if (!limits || typeof limits.messagesPerDay !== "number" || typeof limits.tokensPerDay !== "number") {
        return json({ error: "bad limits" }, 400);
      }
      const decision = evaluateReservation(current, limits, now);
      if (decision.allowed) await this.state.storage.put(USAGE_KEY, decision.usage);
      return json(decision);
    }

    const day = istDayKey(now);
    const usage: QuotaUsage = current && current.day === day ? { ...current } : { day, messages: 0, tokens: 0 };
    if (path === "/commit") {
      const tokens = typeof body.tokens === "number" && Number.isFinite(body.tokens) ? Math.max(0, Math.floor(body.tokens)) : 0;
      usage.tokens += tokens;
      await this.state.storage.put(USAGE_KEY, usage);
      return json({ usage });
    }
    if (path === "/refund") {
      usage.messages = Math.max(0, usage.messages - 1);
      await this.state.storage.put(USAGE_KEY, usage);
      return json({ usage });
    }
    return json({ error: "not found" }, 404);
  }
}

/** Worker-side client for the quota DO. */
export function quotaClient(ns: DurableNamespaceLike, uid: string) {
  const stub = ns.get(ns.idFromName(uid));
  const post = async (path: string, payload: unknown): Promise<Response> =>
    stub.fetch(`https://lounge-quota${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  return {
    reserve: async (limits: QuotaLimits): Promise<QuotaDecision> => (await post("/reserve", { limits })).json() as Promise<QuotaDecision>,
    commit: async (tokens: number): Promise<void> => {
      await post("/commit", { tokens });
    },
    refund: async (): Promise<void> => {
      await post("/refund", {});
    },
  };
}

/** Friendly 429 body the SPA displays verbatim (plus a formatted reset time). */
export function buildQuotaExceededBody(decision: QuotaDecision, requestId: string): Record<string, unknown> {
  return {
    error: "Daily Health Guides (AI) limit reached",
    code: "LOUNGE_QUOTA_EXCEEDED",
    message:
      decision.reason === "tokens"
        ? "You've reached today's Health Guides (AI) usage limit. It resets at midnight IST."
        : "You've reached today's Health Guides (AI) message limit. It resets at midnight IST.",
    reason: decision.reason,
    resetAt: decision.resetAt,
    limits: decision.limits,
    request_id: requestId,
  };
}
