# Architecture
**Current Version:** 1.6.0

## Technical Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend/Database**: Firebase (Firestore, Storage, Hosting)
- **Authentication**: Firebase Auth (Google Sign-In)
- **AI Integration**: Gemini API (`@google/genai`) via Cloudflare Gateway

## Authentication Architecture (v1.6.0+)
Aegis Health AI uses Firebase Authentication with strict cross-origin tracking protections enabled for modern browsers.

* **Auth Domain:** The Firebase `authDomain` is strictly locked to `aegishealthai.co.in`. We do not use default `firebaseapp.com` domains in production to prevent Safari/Chrome from blocking session cookies.
* **Sign-In Method:** Google SSO is handled exclusively via `signInWithPopup`. 
* **Routing Strategy (State-Driven):** We do not use imperative routing for authentication. The Landing Page (`/`) unauthenticated view passively watches the global Auth Context. When `!loading && user` resolves to true, a `useEffect` hook handles the programmatic push to `/dashboard`.
* **UI Flow:** There is no dedicated `/login` route. Unauthenticated users remain on `/` and trigger the Auth popup via overlay.

## Core Pipelines (v1.6.0)

### 1. Ingestion & Extraction
- **Flow:** PDF/Image -> Firebase Storage -> `promptFramework.ts` -> Zod Schema Validation -> Firestore.
- Extracts `display_value` (e.g., "< 0.1") for UI accuracy and stripped `numeric_value` for deterministic chart math.
- **Model:** `gemini-2.5-flash` handles throughput and structured validation.

### 2. Context Aggregation (`contextService.ts`)
- Acts as the RAG engine. Groups historical lab results chronologically.
- Consolidates manual medications (handling schema fallbacks like `name` vs `medicationName`) and injects a master `PatientContext` into AI prompts.
- **Model:** `gemini-2.5-flash`.

### 3. Virtual Polyclinic (`specialistFactory.ts`)
- Utilizes a Factory Pattern to route user chats to 10 specific AI personas.
- Grounded in real-world clinical guidelines (e.g., ACC/AHA, ADA).
- **Model:** `gemini-2.5-pro` for deep synthesis, falling back to `gemini-2.5-flash`.

### 4. AI Chat & SBAAR Generation
- **Streaming:** Handled via `useCoach.ts` using `AbortController` and `try/catch` fallbacks.
- **Proactive Summaries:** Intent detection triggers structured SBAAR outputs and plain-language summaries.
- **Routing:** Low-complexity chats use `gemini-2.5-flash`. High-complexity, clinical, or summary requests auto-escalate to `gemini-2.5-pro` (with Flash fallbacks).

### 5. PDF Handoff (`pdfExportService.ts`)
- Captures SVG Recharts accurately using `html-to-image` on a hidden DOM node, bridges to a multi-page A4 document via `jspdf`.

## Admin & Security Flow
- Definitive user `role` is stored in `users/{uid}`.
- Admin dashboard utilizes `collectionGroup` queries, executing only **after** verifying the admin role explicitly.
- Usage tracking (global stats) relies on best-effort writes, silently catching errors to prevent UI interruptions for non-admins.
- Hook Ordering: Conditional early-returns must never appear before all hook declarations are complete.
- Firebase Hosting relies on strict COOP headers (`same-origin-allow-popups`) deployed via `firebase.json` for OAuth stability.
