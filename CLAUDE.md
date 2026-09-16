# Aegis Health AI — Agent Context

## Project Overview
Aegis is a multimodal, enterprise-grade personal health Progressive Web App (PWA). It allows users to upload medical reports, track health trends, and consult AI-powered specialists using text, voice, and real-time internet grounding.

## Active Tech Stack (Read Carefully)
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion. Uses `@chenglou/pretext` and `react-window` for synchronous text measurement and virtualized layout performance.
  *(Note: Next.js and Firebase App Hosting are NOT used. Do not assume App Directory setups).*
- **Hosting:** Firebase Hosting.
- **Database / Storage:** Firebase Firestore & Firebase Storage.
- **Backend / Triggers:** Firebase Cloud Functions (Node.js) located in `/functions/src/`.
- **Auth:** Firebase Google Sign-In (Authentication).
- **Anti-Bot:** reCAPTCHA v3 (`VITE_RECAPTCHA_SITE_KEY`).
- **AI:** Google Gemini API (@google/genai) with automated request interception in `geminiClient.ts` and `paperclipJulesCoordinator.ts`. Maps older/retired model identifiers (including Gemini 2.5 and 1.5 variants) to stable Gemini 3 series endpoints (`gemini-3.6-flash` and `gemini-3.1-pro-preview`) and retries using `gemini-3.6-flash` and `gemini-3.5-flash` to handle 503 high-demand errors.
- **Voice Integration:** Powered by the Web Speech API transcription class `VoiceService.ts`. Programmatically mounted inside the `ChatCoach.tsx` conversational assistant for hands-free health logs.
- **Care Map & Directions:** Powered by Google Maps Platform using `@vis.gl/react-google-maps` and global `Route.computeRoutes` overlays.
- **Calendar Sync:** Direct Google Calendar API queries leveraging the Google Auth access token, syncing medical agendas with strict confirmation modals.

## Core Conventions & Rules
1. **Repository Awareness:** ALWAYS read `ARCHITECTURE.md`, `CURRENT_STATE.md`, and `AGENTS.md` before making sweeping changes. 
2. **Landing Page Constraints:** The landing page is the home page. Do not change the landing page design, copy, or styling unless explicitly asked.
3. **Keep Mobile-First:** Preserve `.flex-col`, `md:flex-row`, and Tailwind's mobile-first conventions at all times.
4. **Preserve Brand Styling:** Aegis has a specific, soft, high-contrast, patient-friendly look. Do not arbitrarily change semantic colors (`bg-theme`, `text-surface`) to default gray or black without reason.
5. **Firebase Patterns:** We use standard Firebase SDK patterns. Keep functions inside `/functions/` and frontend queries isolated in standard hook structures. Do not mix Next.js paradigms into the Vite setup.
6. **Authentication:** The auth flow explicitly utilizes `onAuthStateChanged` state to handle seamless transition to the dashboard. 
7. **Real-time Synchronized Context:** Patient medications must always sync in real-time using `onSnapshot` inside `useClinicalContext.ts`. Any components formatting medications MUST dynamically fallback and support flexible keys (`genericName`, `name`, `brandName`, `medicationName`) across internal mappings.
8. **Visual Interaction Matrix:** Hosted inside `src/components/Medications/InteractionMatrix.tsx`. Displays compatible and warning medication pairings using colored matrix grid cells linked to RxNorm datastores and Aura AI advisory cards.


## Workflow
- Verify current status via `CURRENT_STATE.md`.
- Implement new logic respecting the Vite boundaries. 
- For backend logic, touch `/functions/` and run `npm run build` within that context.
- Keep the `CURRENT_STATE.md` in sync whenever you complete a major structural change.

## Session: September 16, 2026
### Work Done:
- **Gemini 2.5 Model Retirement Migration**: Migrated all model mappings and 503 fallback interceptors across both frontend (`src/lib/geminiClient.ts`) and backend Cloud Functions (`functions/src/paperclipJulesCoordinator.ts`) ahead of the Google Cloud October 2026 / January 2027 shutdown schedule.
- Mapped deprecated `gemini-2.5-pro` &rarr; `gemini-3.1-pro-preview`, and `gemini-2.5-flash` / `gemini-2.5-flash-lite` &rarr; `gemini-3.6-flash`.
- Replaced secondary 503 fallback from `gemini-2.5-flash` to GA-stable `gemini-3.5-flash`.
- Verified entire Vitest test suite (57 test files, 569 tests passing at 100%), verified Cloud Functions build, and executed clean Vite production build.

## Session: June 09, 2026 (II)
### Work Done:
- Fully aligned and regenerated the locked nested dependencies inside `package-lock.json` against the custom security overrides requested in `package.json` (such as resolving `protobufjs@7.6.2`, `ws@8.21.0`, and `qs@6.15.2`).
- Ran and verified a complete `npm ci` test cycle within the container runtime environment, demonstrating 100% clean installation and zero lockfile synchronization errors.
- Verified that compiling, linting, and structural integrity checks of the React client codebase build perfectly under active Node.js 22 constraints.

## Session: June 08, 2026 (III)
### Work Done:
- Synchronized and rebuilt `package-lock.json` targeting dependency constraints annotated in `package.json` to resolve `npm ci` layout synchronization blockers (`EUSAGE` mismatched lock state).
- Ensured absolute compatibility of packages and compiled binary targets across localized development and host integrations.

## Session: June 08, 2026 (II)
### Work Done:
- Upgraded the central build-and-deploy pipeline (`deploy.yml`) to Node.js `24` and setup-node v4 to conform with the latest Action host platform environment standards.
- Strengthened Cloud Functions deploy step in `.github/workflows/deploy.yml` by appending Google Service Account (`GCP_SA_KEY`) credential parameters to `w9jds/firebase-action`.
- Configured `.github/workflows/ci-smoke.yml` to target Node.js `24` for parity.
- Synchronized local development runtime configurations, upgrading `.nvmrc` to Node.js `24`.
- Explicitly declared parameter types inside standard Firebase entry points in `/functions/src/` to prevent implicit `any` compiler failures under strict TypeScript compilations.

## Session: June 08, 2026 (I)
### Work Done:
- Resolved Node.js incompatibility issues in the continuous integration smoke test workflow (`ci-smoke.yml`) by upgrading setup-node to v4 and locking the target version to Node.js `20`.
- Added the `"engines": { "node": ">=20" }` constraint block to `package.json` to prevent local runs using legacy engine runtimes.
- Configured a `.nvmrc` file set to Node.js `20` to guarantee consistent local development runtimes across teams.
- Re-synchronized the package manifest list and refreshed client-side locks.
- Documented Node.js requirements clearly inside `README.md`.

## Session: June 06, 2026 (I)
### Work Done:
- Addressed 4 moderate-risk Dependabot security vulnerability warnings across the main root app and Firebase Cloud Functions backend.
- Set up root `overrides` in `package.json` locking safe, non-vulnerable versions of transitive packages `protobufjs` to `>=7.5.8`, `ws` to `>=8.20.1`, and `qs` to `>=6.15.2`.
- Added the resolved version of `uuid` (`^11.1.1`) into the `functions/package.json` dependencies and its associated override block.
- Confirmed full module compilation and linting success across all features.

## Session: June 01, 2026 (I)
### Work Done:
- Reverted Vite `manualChunks` setup which broke React context sharing and Firebase initialized states globally inside the module graph, causing a full production outage.
- Updated agent markdown directives regarding safe Vite chunking procedures.
- Fixed Playwright smoke test failure by standardizing primary CTAs in both `LandingPage.tsx` and `InfoPageLayout.tsx` with accessible, stable, and highly visible `"GET STARTED"` label buttons.
### Decisions Made:
- Bundle chunk splitting should rely solely on React-level `route-level lazy loading` (via `React.lazy()`) rather than Vite `manualChunks` configurations, preventing inadvertent internal module state splitting.

## Session: May 31, 2026 (II)
### Work Done:
- Audited the Firestore security rules and implemented recursive owner-based access matching (wildcard rule `match /{document=**}` under `/users/{userId}`) to support nested profiles subcollections like `/specialistChats` and `/cycleLogs`. This ensures that specialist chat histories are saved and stored successfully without being blocked by Firestore security.
- Fixed low-contrast text in `SpecialistLounge.tsx` where inactive specialist options and loading elements used `dark:text-slate-500` inside a dark theme, making them virtually invisible. Updated to high-impact and accessible `dark:text-slate-400`.
- Integrated full Markdown styling inside `VirtualizedChatList.tsx` using `ReactMarkdown`, adjusted height computation cushions to prevent text clipping of prose elements, and added automatic, dynamic scrolling actions to keep the chatbot's latest streams or completions scrolled to view at all times.
### Decisions Made:
- Applied recursive subcollection rules matching under Firestore `/users/{userId}` path to automatically support any present and future health telemetry nested tables without modifying rule paths individually.
- Cast `listRef` to `any` in `VirtualizedChatList.tsx` to safely invoke `scrollToItem` without being blocked by types definitions on `react-window` interfaces.
### Pending for Human Review:
- Verify that specialist chat histories are securely persisting under user profiles on the Firestore console during active user sessions.
### Next Recommended Steps:
- Continue rolling out advanced medical SBAR classifications on incoming client diagnostics scans.
