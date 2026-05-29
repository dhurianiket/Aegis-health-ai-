# CURRENT_STATE.md — Verified Production Snapshot

## Live Status: Production System is Stable

### What is Currently Built & Deployed
- **Frontend App:** Fully built using React 18, Vite, TypeScript, and Tailwind CSS. Next.js and Firebase App Hosting are completely removed/not used.
- **AI Context Integration & Real-Time Sync:** Fully consolidated and verified the clinical telemetry sharing across all AI subsystems (Specialist Lounge, Health Coach Chat, Visit Prep Widget, and Lab Reports Section). Implemented a real-time reactive Firestore `onSnapshot` listener in `useClinicalContext.ts` for patient medications. This ensures that manually updated or newly extracted medications instantly propagate to the global AI clinical context, eliminating delays and stale data issues. Added support for flexible naming keys (`genericName`, `name`, `brandName`, `medicationName`) across internal AI context builders (`contextService.ts` and `ChatCoach.tsx`) for bulletproof mapping.
- **Visual Drug-Drug Interaction Matrix:** Built an interactive, high-fidelity biological drug compatibility grid directly into the Pharmacy (Medications) view. It maps out active medications against each other on X and Y axes, indicating interactions with responsive color-coded hazard alerts (Red = Severe, Amber = Moderate, Green = Compatible) based on real-time RxNorm database cross-referencing. Allows direct inspection of cells to showcase the detailed clinical summaries and smart advice powered by Aura AI.
- **Web Speech API Interactive Voice-to-Text:** Programmatically linked the `VoiceService` inside the main `ChatCoach.tsx` floating conversational interface with an elegant, responsive recording trigger button, enabling seamless hands-free speech transcription for user queries directly on both desktop and mobile layouts.
- **Performance & Virtualization (Pretext):** Implemented `@chenglou/pretext` and `react-window` to eliminate layout shifts and virtualize dense text contexts. Added `AutoSizeTextarea`, `FixedSizeText`, `VirtualizedChatList`, and a `MasonryLabCards` dashboard component powered by `pretext` for synchronous, canvas-backed layout measurement without DOM thrashing.
- **Gemini API Resilience Interceptor:** Integrated a global request wrapper in `geminiClient.ts` that intercepts model calls. It automatically normalizes deprecated models (e.g., `gemini-3-flash-preview`, `gemini-2.0-flash`) and provides an automatic retry fallback to `gemini-3.5-flash` when encountering `503 Unavailable` "high demand" errors, preventing feature downtime.
- **Google Forms & Visit Prep Safeguards:** Sanitized Google Form IDs by stripping quotes/white space. Handled third-party iframe cookie restrictions (e.g. `atob` or `expected pattern` errors) in `VisitPrepWidget.tsx` and `googleFormsService.ts` elegantly, guiding the user to open the application in a new tab for seamless Google OAuth form loading.
- **Landing Page:** The landing page is successfully hosted as the main entry point to the web application. Navigation is fully synced.
- **Localized Care Map (Google Maps Platform):** Created an interactive care map utilizing `@vis.gl/react-google-maps` to locate nearby clinical facilities, pharmacies, diagnostics labs, and medical specialists based on active profile and device geolocation. Implemented automatic distance and duration compute routes drawing overlay vectors using `Route.computeRoutes()`.
- **Google Calendar Sync (Google Workspace Integration):** Created a Google Calendar sync manager displaying upcoming health routines and appointments. Enabled addition of medical reminders and routine checkups securely using standard Fetch to Google Calendar API with the Google Sign-In access token. Added automatic confirmation dialog prompts before performing any Calendar modifications or removals.
- **Authentication Flow:** Login flow correctly routes authenticated Google Sign-in users from the landing page straight to the `/dashboard` without infinite redirect loops. Protected routes prevent unauthenticated access. Refreshing the dashboard keeps users authenticated.
- **Firebase Functions (Backend):** Webhooks (such as `julesWebhook` and `paperclipJulesCoordinator`) are implemented natively as structured Firebase Cloud Functions inside the `/functions/` directory using standard `firebase-functions/v2/https`. Next.js API routes are not used.
- **Public & Static Pages:** Static informational pages (How It Works, Security, blog posts) exist safely alongside the web application with a unified Aegis brand design.
- **Build Checks:** Strict `npx tsc --noEmit` and Vite compilation passes cleanly. Linting is stable.

### What is Still Pending / In Progress
- Refinement of AI response schemas for specialized medical edge cases.
- Continuous scaling of Jules VM webhook handlers to support more diverse autonomous orchestration commands.

---

### Recent Deployments & Changes
- **Localized Care Map integration:** Integrated React Google Maps API with auto-biased search keywords for clinical facilities and specialists depending on patient gender or medications. Coupled with Route.computeRoutes driving vector overlay paths.
- **Google Calendar Event Scheduling Sync:** Direct fetch calendar manager supporting medical appointments creation, verification caching, details removal with strict modal confirmation wrappers.
- **Interactive Visual Drug-Drug Interaction Matrix:** Conceived, designed, and deployed a robust dual-axis visual grid that processes active patient medications. Highlights safety compatibilities in high-impact red, warning amber, and reassuring emerald blocks. Selecting intersections surfaces dedicated clinical breakdowns and Aura AI advisory cards below the fold.
- **Real-time Medication Sync & Prompt Propagation:** Upgraded `useClinicalContext` hook to stream live updates of patient medication registries from Firestore using active `onSnapshot` subscriptions. Refactored `ChatCoach` and `contextService` to dynamically recognize and format multiple name bindings (`genericName`, `name`, `brandName`), ensuring updated medications are instantly consumed by Chat, SBAR, and Specialist Lounge AI agents.
- **Interactive Voice Chat Interface:** Integrated the Web Speech `VoiceService` with the standard chat interface. Implemented interactive microphone buttons, live listening indicator rings, and fallback error handlers.
- **Google Jules Autonomous Integration:** Webhook triggers and Cloud Functions deployed inside `/functions/` to enable autonomous VM staging.
- **Gemini API 503 Resilience Wrapper:** Created an API proxy interceptor inside `geminiClient.ts` to preemptively route deprecated model names, capture `503 Service Unavailable / High Demand` errors, and retry seamlessly with stable `gemini-3-5-flash`, resolving systemic outages.
- **Google Forms Sandbox Cookie Mitigation:** Implemented dynamic sanitization and exception-catching around form data fetching. Safe-guarded base64 conversions (`atob`) and `expected pattern` exceptions in `VisitPrepWidget.tsx`, dynamically suggesting tab-breakout execution where standard iframe sandboxing blocks credential propagation.
- **Mobile Login & App Check Fix:** Refactored `AuthContext.tsx` and `App.tsx` navigation guards, added detailed diagnostic logging inside redirect results and page resolution filters, bypassed endless App Check 500 errors by safety isolation, and explicitly routed non-popup devices strictly through dynamic same-origin `signInWithRedirect` flows.
- **React 310 Loop Fix:** Suppressed render loop race conditions by strict state dependency management.
- **Landing Page Revisions:** Cleaned up marketing copy to speak plainly and support Indian patient-demographics.
- **Dependency Cleanups:** Aligned all module resolutions to ensure Firebase Admin, Firebase Functions, and Vite dependencies coexist perfectly.

### Current Version Status
- **Stack:** React + Vite + TypeScript
- **State:** Verified and Operational
- **Deployment Strategy:** Firebase Hosting (Frontend) + Firebase Cloud Functions (Backend)
