# Aegis Health AI — Agent Context & Guardrails
**Target Version:** 1.6.0+

## CONFLICT RESOLUTION (CRITICAL)
If a future user request conflicts with any invariant in these files:
1. FLAG the conflict immediately.
2. EXPLAIN exactly which invariant is being violated.
3. REFUSE the change until explicit user approval and override are provided.

## DO NOT CHANGE WITHOUT APPROVAL (INVARIANTS)
- AI Routing: Gemini Flash (`gemini-3-flash-preview`) remains the default for extraction, parsing, normalization, and high-volume helper tasks.
- AI Reasoning: Gemini Pro (`gemini-3.1-pro-preview`) remains reserved for SBAAR, doctor summary, specialist summary, and final clinical synthesis. `temperature` must remain at `0.1` or `0.2` for medical-grade determinism.
- Caching: Cached reports must be reused when source data has not changed. Recompute reports only when source hash, prompt version, template version, or model version changes.
- UI/UX Guardrails: Keep all existing chart, PDF, and dashboard defensive rendering intact.
- Auth Guardrails: Authentication strictly uses `signInWithPopup` via the `aegishealthai.co.in` custom domain. Imperative auth routing is forbidden; all auth routing must be state-driven via `useEffect` watching the Auth Context.

## STRICT SYSTEM DIRECTIVES FOR CODE EDITS
- No Imperative Auth Routing: NEVER put a router push inside an `onClick` handler for login buttons. Auth routing MUST be handled passively via `useEffect`.
- Strictly Popup Auth: NEVER implement `signInWithRedirect` or `getRedirectResult`. ONLY use `signInWithPopup`.
- Domain Lock: NEVER alter `src/lib/firebase/config.ts` to use default `.firebaseapp.com` domains. The `authDomain` must remain strictly locked to `aegishealthai.co.in`.
- No Redundant Views: NEVER create a `Login.tsx` or `Auth.tsx` page view. Keep the router clean (`/` for unauthenticated, `/dashboard` for authenticated).

IF YOU ARE ASSIGNED A FRONTEND BUG:
Do not touch backend security, Firestore logic, or Auth configurations to fix a CSS or Router issue. Keep your blast radius small.
