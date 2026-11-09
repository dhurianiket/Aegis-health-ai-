# AGENTS.md — Developer Agent Operating Rulebook & Invariants

This file outlines the non-negotiable architectural and behavior rules for all AI agents, code editors, and developers modifying the Aegis Health AI repository.

## 🚨 MANDATORY SESSION START — READ THESE FILES FIRST (No Exception)

> **This rule fires automatically at the start of EVERY agent session. The user does NOT need to remind you.**

Before doing ANYTHING — before reading any other file, writing any code, or answering any question — you MUST silently read:

1. **[`GRAPHIFY.md`](./GRAPHIFY.md)** — Full codebase knowledge graph (171 source nodes, 1,164 AST nodes, 89 communities). Use this to locate any component, service, hook, or type instantly without guessing.
2. **[`graphify-out/GRAPH_REPORT.md`](./graphify-out/GRAPH_REPORT.md)** — God nodes, community cohesion scores, knowledge gaps, and cross-module dependency analysis. Use this when a change touches multiple modules.
3. **[`CURRENT_STATE.md`](./CURRENT_STATE.md)** — The latest snapshot of what has been built. Never repeat work that's already done.

**Regenerate the graph after any major refactor:**
```bash
npm run graphify          # fast: 171 nodes → GRAPHIFY.md
npm run graphify:full     # deep: 1,164 nodes → graphify-out/
```

---

## 0. Edge AI invariant
- SPA Gemini traffic: `src/lib/geminiClient.ts` → Worker `POST /api/ai/generate`.
- Env: `VITE_EDGE_API_URL`. Never hardcode API keys or bearer tokens in client code or docs.
- After changing AI routing, refresh Graphify (`npm run graphify`) and note the snapshot in `CURRENT_STATE.md`.

## 0.1 🔒 ZERO SECRETS LEAK & GGSHIELD DEFENSE INVARIANT (Strictly Enforced)
- **Zero Secrets Committed**: NEVER commit, log, or document real secrets, API keys, private keys, service account JSONs, bearer tokens, or webhook credentials in source code, comments, git commit messages, or markdown documentation (including `CURRENT_STATE.md`, `WALKTHROUGH.md`, and `README.md`). Use placeholder syntax like `[REDACTED]` or `[CONFIGURED_VIA_SECRET_STORE]`.
- **Secret Storage Boundaries**: All runtime secrets belong strictly in environment variables (`.env` - gitignored) or edge/cloud secret stores (Cloudflare `wrangler secret put`, Firebase Secret Manager).
- **Mandatory `ggshield` Pre-Commit / Pre-Push Protection**: GitGuardian's `ggshield` CLI is installed and active in `.git/hooks/pre-commit` and `.git/hooks/pre-push`. All changes MUST pass `ggshield secret scan pre-commit` cleanly. Running `git commit --no-verify` to bypass `ggshield` is strictly forbidden.
- **Secrets Policy (binding)**: Never share, commit, paste or log API keys, secrets, tokens, passwords or service-account files anywhere online (repo, gists, issues, PRs, chat, docs, client bundles). Redact as `[REDACTED_SECRET_<TYPE>]`. `VITE_*` vars are public — never put secrets in them. Full rule + leak procedure: [`SECURITY.md`](SECURITY.md#secrets-policy). Setup: `pip install pre-commit ggshield && pre-commit install`.
- **Incident Protocol**: If any secret is accidentally flagged by `ggshield`, immediately redact the file, verify `.gitguardian.yaml` exclusions, rotate the affected credential upstream, and ensure a 100% clean `ggshield secret scan` before proceeding.

## 1. Foundational Architecture Constraints
- **Stack Consistency:** We are strictly a **React + Vite + TypeScript** application backed by **Firebase Cloud Functions** and the Cloudflare Worker **`aegishealthai-edge`** for Gemini. There is NO Next.js. There is NO Firebase App Hosting. Browser Gemini calls go through `https://api.aegishealthai.co.in` — never embed `GEMINI_API_KEY` in the SPA.
- **Landing Page Stability:** Do NOT modify the landing page structure, styles, or content unless explicitly commanded to do so. It is the designated root entry point and highly tuned for brand messaging.
- **Brand Fidelity:** Preserve the Aegis visual identity. Use the established Tailwind CSS semantic variables (like `bg-surface`, `text-theme`). Do not inject generic unbranded slate/gray designs or change global CSS variables unless requested.

## 2. Authentication, Login Resilience & Viewport Invariants (Strictly Enforced)
> **Mandatory Goal:** Ensure 100% login uptime, zero redirect race conditions, zero HTTP referrer blocks, and complete immunity against blank/black screens on `/dashboard`.

- **2.1 Dual-Mode OAuth & Redirect Settling Invariant (`src/context/AuthContext.tsx`)**:
  - `initializeAuth()` MUST ALWAYS evaluate `getRedirectResult(auth)` with a dedicated safety timeout (20s) BEFORE settling `authLoading = false`.
  - Never allow `onAuthStateChanged`'s initial transient `null` state to trigger premature navigation or flip `authLoading = false` while a redirect credential exchange is pending.
  - When `signInWithRedirect` is triggered (on mobile or popup-blocked browsers), login modals and landing buttons MUST return early without calling `navigate('/dashboard')`, allowing the browser to navigate cleanly to `accounts.google.com`.
  - Upon successful redirect completion, transition cleanly via React Router's `<Navigate to="/dashboard" replace />` rather than reloading the page with `window.location.replace()`.
  - Firebase Authentication with Google Sign-In is the sole identity provider. Never inject alternative auth libraries or custom JWT storage schemes. Always enforce `browserLocalPersistence`.

- **2.2 Google Cloud API Key Restriction Invariant (NO HTTP Referrer Blocks)**:
  - The Firebase browser API key (`AIzaSy...`) MUST NEVER have HTTP Referrer restrictions configured in Google Cloud Console (`identitytoolkit.googleapis.com` will fail with `API_KEY_HTTP_REFERRER_BLOCKED`).
  - Mobile WebViews, OAuth redirects, and internal Service Worker requests frequently send blank/empty referrers. Enforce security strictly via API Scope / Target Restrictions (limiting keys to Identity Toolkit, Firestore, Storage, and Token Service APIs) rather than HTTP referrers.

- **2.3 Viewport Render Guarantee (Zero Black Screen Invariant - `src/App.tsx`, `src/components/Dashboard/Dashboard.tsx`)**:
  - The main dashboard router container in `src/App.tsx` MUST NEVER evaluate to an empty or null render state for authenticated users.
  - Never gate the entire dashboard container behind an incomplete boolean condition where `user` exists but `isConsentGranted` is `null` or uninitialized, while the consent modal is simultaneously skipped.
  - Every authenticated state must resolve deterministically:
    - If consent is required → render `<ConsentScreen>`.
    - If consent is granted OR user is an exempt reviewer/admin account (`dhurianiket@gmail.com`, `reviewer@aegishealthai.co.in`) → render the active dashboard view.
    - Never create a state where neither is rendered (the "blank screen trap").
  - Admin/reviewer accounts (`dhurianiket@gmail.com`, `reviewer@aegishealthai.co.in`) MUST always have auto-granted consent state and immediate hydration of demonstration clinical telemetry in `Dashboard.tsx` so that empty/new accounts never crash, stall, or display pitch-black viewports.

- **2.4 Service Worker Abort Immunity (`public/sw.js`)**:
  - The Service Worker `fetch` event listener MUST ALWAYS catch aborted requests (`e.catch(() => {})`).
  - Navigating to `accounts.google.com` or external OAuth endpoints naturally aborts in-flight SPA fetch requests. An unhandled promise rejection in the Service Worker crashes the worker lifecycle and throws cascading console exceptions.

- **2.5 App Check & Rate Limiting Safety Boundaries**:
  - Firebase App Check on `identitytoolkit.googleapis.com` and `firestore.googleapis.com` must remain `UNENFORCED` in production unless custom enterprise reCAPTCHA Enterprise thresholds and debug tokens are actively configured.
  - `isTokenAutoRefreshEnabled` in `src/lib/firebase/config.ts` must remain disabled or safely handled to prevent 24-hour client storage lockouts when token exchanges fail or reCAPTCHA v3 scores fluctuate on mobile networks.

- **2.6 PWA & Browser Cache Invalidation on Auth Changes**:
  - Any modification to authentication flows, Service Worker, or PWA entry points MUST increment the Service Worker cache version (e.g. `aegis-health-ai-v*`) and HTML asset query versions (`?v=*`).
  - `firebase.json` headers MUST enforce `no-cache, no-store, must-revalidate` on PWA manifests and auth endpoints so mobile and desktop browsers never execute stale, cached auth scripts.

## 3. Data, Layout & Performance Rules
- **Firestore Isolation:** Write data strictly to isolated paths (e.g., `users/{userId}/{subcollection}`). Avoid global unsandboxed collections.
- **Real-Time Context Synchronization:** Any updates to clinical data (including manual edits or newly extracted reports for medications, active treatments, or biomarkers) MUST run through real-time reactive Firestore listeners (e.g., `onSnapshot` inside standard React hooks/context triggers like `useClinicalContext`) rather than static, one-time loads, to prevent AI systems from relying on stale, unrecognized records.
- **Mobile-Responsive First:** All components must handle mobile viewports graciously. Dense data tables must convert to stacked vertical cards on small screens (`md:hidden block`).
- **Main-Thread Safety (React):** Offload heavy map/reduce processing of Health Data out of render cycles (`useEffect`) to dedicated service files or Cloud Functions to maintain 60FPS UI experiences.
- **Component Height Enforcements:** Recharts MUST have strict `h-[300px]` pixel boundary envelopes injected strictly to prevent flex-box visual collapses during rendering.
- **Visual Drug-Drug Interaction Matrix Rules:** Grid/matrix rendering MUST be responsive and handle layout overflow scroll gracefully. Intersecting tile items must check both RxCUI and string name lowercasing for compatibility mapping, and show clear safety labels for the user without clinical jargon overload.
- **Text Measurement & Layout Shifts:** Always use `@chenglou/pretext` for synchronous, canvas-backed text height/width measurements before mounting elements to the DOM. Avoid rendering text blocks off-screen or using `getBoundingClientRect()` to measure layouts, as this creates DOM thrashing and layout shifts. Utilize `AutoSizeTextarea`, `FixedSizeText`, and `VirtualizedChatList` components for adaptive blocks and dense text contexts.

## 4. Coding & Maintenance
- **Gemini API Resilience Interceptor:** All AI feature interactions must go through the pre-initialized wrapper in `geminiClient.ts` which handles model normalization (e.g., mapping deprecated preview models to stable long-term models) and implements a 503 high-demand retry transparent fallback to stable fallback models. Do not bypass this wrapper by calling the GoogleGenAI SDK directly with unhandled endpoints.
- **Google Forms Sandbox Cookie Mitigation:** When loading/fetching forms, gracefully catch sandbox/iframe cookie blocking exceptions (`expected pattern`, `atob` failures) and suggest breakout actions (like navigating natively in a separate tab) so authentication state flows correctly.
- **Bundle Optimization:** Manual chunk splitting in Vite via `manualChunks` is powerful but risky because it can break internal React context or Firebase module state sharing. If performance improvement is needed through chunk splitting, rely strictly on route-level lazy loading (using `React.lazy()`) instead of customizing Vite's manual chunks, letting Vite handle chunk boundaries safely.
- **Firebase Backend Updates:** Any server-side webhook, schedule, or orchestrator script MUST go inside the `/functions/src/` folder and adhere to standard Firebase Functions v2 TypeScript syntax.
- **Agent Self-Documentation:** When concluding a major structural change, update `CURRENT_STATE.md` to keep future AI sessions synchronized with your accomplishments.
- **Lockfile Synchronization Rule:** When changing dependencies or adding custom overrides inside `package.json` (such as pinning security patches for `protobufjs`, `ws`, etc.), you MUST regenerate and synchronize the `package-lock.json` file (typically using `npm install` / `npm ci` test cycles) to prevent continuous-integration smoke test blockages and deployment pipeline EUSAGE failures.
