# AGENTS.md — Developer Agent Operating Rulebook & Invariants

This file outlines the non-negotiable architectural and behavior rules for all AI agents, code editors, and developers modifying the Aegis Health AI repository.

## 🚨 CONFLICT RESOLUTION RULE
Always read `ARCHITECTURE.md` and `CURRENT_STATE.md` FIRST to understand the latest project reality. If a request violates documented invariants, inform the user and seek explicit approval before proceeding.

---

## 1. Foundational Architecture Constraints
- **Stack Consistency:** We are strictly a **React + Vite + TypeScript** application backed by **Firebase Cloud Functions**. There is NO Next.js. There is NO Firebase App Hosting. All APIs are either Cloud Functions or direct Firebase client calls.
- **Landing Page Stability:** Do NOT modify the landing page structure, styles, or content unless explicitly commanded to do so. It is the designated root entry point and highly tuned for brand messaging.
- **Brand Fidelity:** Preserve the Aegis visual identity. Use the established Tailwind CSS semantic variables (like `bg-surface`, `text-theme`). Do not inject generic unbranded slate/gray designs or change global CSS variables unless requested.

## 2. Authentication & Navigation Guardrails
- **State-Driven Routing:** The main route transition between the landing page and protected paths (Dashboard) must remain bound to Firebase `onAuthStateChanged` lifecycles.
- **Login Fixes:** We rely on browser local persistence. Do not inject new authentication libraries. Google Sign-In via Firebase is the sole provider. 

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
