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

## 3. Data & Layout Rules
- **Firestore Isolation:** Write data strictly to isolated paths (e.g., `users/{userId}/{subcollection}`). Avoid global unsandboxed collections.
- **Mobile-Responsive First:** All components must handle mobile viewports graciously. Dense data tables must convert to stacked vertical cards on small screens (`md:hidden block`).
- **Main-Thread Safety (React):** Offload heavy map/reduce processing of Health Data out of render cycles (`useEffect`) to dedicated service files or Cloud Functions to maintain 60FPS UI experiences.
- **Component Height Enforcements:** Recharts MUST have strict `h-[300px]` pixel boundary envelopes injected strictly to prevent flex-box visual collapses during rendering.

## 4. Coding & Maintenance
- **Gemini API Resilience Interceptor:** All AI feature interactions must go through the pre-initialized wrapper in `geminiClient.ts` which handles model normalization (e.g., mapping deprecated preview models to stable long-term models) and implements a 503 high-demand retry transparent fallback to stable fallback models. Do not bypass this wrapper by calling the GoogleGenAI SDK directly with unhandled endpoints.
- **Google Forms Sandbox Cookie Mitigation:** When loading/fetching forms, gracefully catch sandbox/iframe cookie blocking exceptions (`expected pattern`, `atob` failures) and suggest breakout actions (like navigating natively in a separate tab) so authentication state flows correctly.
- **Firebase Backend Updates:** Any server-side webhook, schedule, or orchestrator script MUST go inside the `/functions/src/` folder and adhere to standard Firebase Functions v2 TypeScript syntax.
- **Agent Self-Documentation:** When concluding a major structural change, update `CURRENT_STATE.md` to keep future AI sessions synchronized with your accomplishments.
