# Health Guides (AI) — daily quotas and guarded streaming

## Per-user daily quota (edge)

- Enforced in the Worker (`workers/aegishealthai-edge/src/quota.ts`) for Lounge requests only (`aegisFeature: "specialist"`). Report extraction and other routes are not metered.
- One `LoungeQuota` Durable Object per verified Firebase uid (atomic counters; SQLite-backed storage). The day resets at **midnight IST**.
- Each request reserves one message before calling Gemini. Tokens are committed afterwards from `usageMetadata.totalTokenCount`. The message is refunded if the upstream call fails, or the client aborts, before any text reaches the user. A Stop mid-reply still counts as a message.

| Tier (ID-token claim) | Messages / IST day | Tokens / IST day |
|---|---|---|
| none / unknown → `free` | 40 | 150,000 |
| `aegis_plan: b2c_monthly` / `b2c_quarterly` → `paid` | 200 | 1,000,000 |
| `aegis_plan: b2b_clinic_monthly` / `b2b_clinic_quarterly` → `clinic` | 600 | 3,000,000 |
| `admin: true` | 2,000 | 10,000,000 |

- **The tier is taken only from the verified ID token.** The Firestore subscription document is client-writable, so it is never trusted for limits. Until the payments backend sets the `aegis_plan` custom claim (Admin SDK `setCustomUserClaims`, then the client refreshes its token), every account gets the free tier.
- At the limit the Worker returns `429` with `{"code":"LOUNGE_QUOTA_EXCEEDED","resetAt":"<ISO>","message":…}`, plus `Retry-After`, `X-Aegis-Quota-Remaining` and `X-Aegis-Quota-Reset`. The Lounge shows: "You've reached today's Health Guides (AI) limit. It resets at 12:00 am IST tomorrow…" with the 112 reminder. Crisis triage runs before any AI call, so emergency guidance is never blocked by the quota.
- If the `LOUNGE_QUOTA` binding is missing or the DO errors, the check **fails open** and logs a warning, so a quota-store outage can't take the Lounge down.

## Guarded SSE streaming

- The SPA sends `stream: true`. For Lounge requests the Worker calls Gemini `:streamGenerateContent?alt=sse` and re-emits `delta` / `replace` / `done` / `error` events (`src/loungeStream.ts`). Thought parts are dropped.
- **Dosing guard:** text is released only at sentence boundaries (`.`, `!`, `?`, `।`, newline), or at a word boundary after about 400 characters without one. Before every release, the whole accumulated reply (including the unreleased tail) goes through `detectPatientDirectedDosing`, with doses already in the patient's data allowed. On a hit the Worker cancels the upstream call and sends `replace` with the fixed RMP message, and the SPA overwrites everything shown so far.
- **Tradeoffs:**
  - Streaming is sentence-granular, not token-granular.
  - A dose instruction contained in one sentence is never shown.
  - A directive spread across sentences can show briefly before the `replace` event swaps the whole reply. Only the safe text is saved to history.
- **Compatibility:**
  - Non-Lounge routes ignore `stream`.
  - An older Worker returns JSON, which the SPA treats as a single chunk (feature detection by `Content-Type: text/event-stream`).
  - Model fallback and PoP retries happen only before the first chunk is shown.
- **Stop:** the SPA aborts the fetch, and the Worker cancels the upstream Gemini stream (`enable_request_signal` plus stream cancel).
