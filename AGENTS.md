# Aegis Health AI — Agent Context & Guardrails
**Target Version:** 1.6.0+ (Multimodal Edition)

## CONFLICT RESOLUTION (CRITICAL)
If a future user request conflicts with any invariant in these files:
1. FLAG the conflict immediately.
2. EXPLAIN exactly which invariant is being violated.
3. REFUSE the change until explicit user approval and override are provided.

## DO NOT CHANGE WITHOUT APPROVAL (INVARIANTS)
- **AI Routing & Modalities:** Gemini Flash remains the default for standard extraction. Gemini Pro remains reserved for deep clinical synthesis. The AI pipeline now utilizes **Streaming (`generateContentStream`)**, **Voice (`MediaRecorder` API)**, and **Google Search Grounding**. Do not remove or downgrade these capabilities.
- **Microphone API:** Voice features must handle browser permission gracefully. Never crash the UI if microphone access is denied.
- **Caching:** Cached reports must be reused when source data has not changed. Recompute reports only when source hash, prompt version, template version, or model version changes.
- **UI/UX & A11y Guardrails:** Keep all chart, PDF, dashboard, and WCAG A11y (ARIA labels, semantic `<main>` tags, H1-H3 hierarchy) fixes intact. Do not remove `React.lazy` or `<Suspense>` boundaries.
- **Auth Guardrails:** Authentication strictly uses `signInWithPopup` via the `aegishealthai.co.in` custom domain. Imperative auth routing is forbidden; all auth routing must be state-driven via `useEffect` watching the Auth Context.

## STRICT SYSTEM DIRECTIVES FOR CODE EDITS
- **No Imperative Auth Routing:** NEVER put a router push inside an `onClick` handler for login buttons. 
- **Strictly Popup Auth:** NEVER implement `signInWithRedirect`. ONLY use `signInWithPopup`.
- **Domain Lock:** NEVER alter `src/lib/firebase/config.ts` to use default `.firebaseapp.com` domains.
- **No Redundant Views:** NEVER create a `Login.tsx` or `Auth.tsx` page view. Keep the router clean (`/` for unauthenticated, `/dashboard` for authenticated).

IF YOU ARE ASSIGNED A FRONTEND BUG:
Do not touch backend security, Firestore logic, or Auth configurations to fix a CSS or Router issue. Keep your blast radius small.
