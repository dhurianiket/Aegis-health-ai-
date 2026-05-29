# ARCHITECTURE.md — System Reference & Verified Design Specifications

This document serves as the single source of truth for the technical architecture of Aegis Health AI.

## 1. Technical Stack Blueprint
- **Frontend Core:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion (animations). Next.js and App Hosting are explicitly NOT used.
- **UI Performance & Virtualization:** Uses `@chenglou/pretext` for Canvas-backed synchronous text layout measurement and `react-window` for virtualizing densely populated lists (chats, labs) with zero layout thrashing or browser reflows.
- **Backend & APIs:** Firebase Cloud Functions (Node.js). We use this for backend logic, webhooks, and automation instead of Next.js API routes.
- **Infrastructure Core:** Firebase Authentication, Cloud Firestore, Firebase Hosting.
- **AI Analytics Engine:** Google Gemini API.
  - *Routing:* **Gemini Flash** is utilized exclusively for high-speed data extraction and structured telemetry parsing. **Gemini Pro** handles conversational depth and virtual multi-specialty polyclinic threads.
  - *Resilience Layer:* Real-time interceptors normalization automatically parses and maps older/deprecated preview models to stable long-term endpoints (`gemini-3.5-flash` and `gemini-3.1-pro-preview`). A defensive retry mechanism captures remote `503 Service Unavailable / High Demand` API errors and transparently redirects processing to stable fallback pools, guaranteeing zero conversational downtime.
- **Medical Intelligence Hub:** U.S. National Library of Medicine (NLM) RxNorm Datasets.

## 2. Security & API Management
- **Firebase Auth Constraint:** Authentication is built on standard Firebase Auth (Identity Platform is NOT enabled). The `authDomain` MUST remain the project's native `firebaseapp.com` domain.
- **Auth Flow Resilience:** The system relies on `onAuthStateChanged` as the source of truth to seamlessly route users from the landing page to the dashboard. It uses `signInWithPopup` with fallback to `signInWithRedirect`.
- **API Key Hardening:** All Google Cloud API keys must be secured. Frontend relies solely on Vite environment variables (`import.meta.env`).
- **Zero-Trust Hardcoding Guardrail:** Strict architectural rule established: raw API keys or secrets must **never** be hardcoded inside standard files or committed to version control.

## 3. Application Flow & Component Hierarchy
- **Landing Page (Home):** The public landing page (`/`) lives inside the React Router structure and serves as the main entry point to the app. Static HTML versions inside `/public/` might be used for SEO, but the primary user entry is the React landing page.
- **Authentication:** Users sign in on the landing page and are smoothly redirected to the `/dashboard`. Re-authentication on refresh is handled persistently.
- **Protected Layouts:** Dashboard, Specialist Lounge (using portal-based full-screen consultation shell), and tools are nested under protected routes.
- **Mobile-First Structure:** Responsive Tailwind grids and "Table-to-Card" approaches ensure deep mobile optimization.

## 4. Firebase Cloud Functions (`/functions/`)
- Webhooks (e.g., GitHub issue trackers), background processing, and any server-side orchestration live strictly inside the `/functions/src/` directory.
- Deployed separately from the frontend using `firebase deploy --only functions`.

## 5. Core Subsystem Definitions

### A. Multi-Report Side-by-Side Comparison Engine
- Takes exactly 2 checked collections of lab records, matches biomarkers via case-insensitive `testName` filters, and presents delta shifts utilizing directional indicators (↑ / ↓) without throwing layout runtime loop exceptions.

### B. Print Synthesis Generator (`generateDoctorReport`)
- Leverages local client-side PDF compilers to package SBAR (Situation, Background, Assessment, Recommendation) framework elements.

### C. Follow-up Chronology Monitor (`reminderService.ts`)
- Hooks into upload flows to automatically schedule reminder follow-ups 90 days out in Firestore.

### D. Keyless & Visual Drug-to-Drug Interaction Matrix
- Operates entirely over open-source public endpoints (`https://rxnav.nlm.nih.gov/REST/...`). Maps severity to structured internal schemas.
- Incorporates a rich, interactive frontend visual grid (`InteractionMatrix.tsx`) representing active medications on both X and Y axes. Color-codes intersection cells to display safety alerts (Red = Severe, Amber = Moderate, Green/Emerald = Compatible). Supports interactive cell selection to present full RxNorm narrative and Aura AI recommendations below the folder.


### E. Real-Time Telemetry AI Synchronization (RAG Context)
- Subscribes via standard Firestore reactive queries to live changes in user medications, health metrics, and patient profiles. The clinical context hooks (`useClinicalContext.ts`) consume real-time streams and dynamically formulate contextual tokens. All formatting queries map flexible keys (`genericName`, `name`, `brandName`, `medicationName`) across internal RAG pipelines seamlessly, enabling real-time context propagation to conversational assistants and multi-specialty virtual clinic engines.

### F. Web Speech API Voice Transcription
- Binds full-fidelity Web Speech Recognition protocols inside the `ChatCoach.tsx` component. Speech recognition sessions transcribe user prompts in real-time, providing hands-free queries on mobile browser viewports without remote server latency.

### G. Localized Care Map (Google Maps Platform)
- Uses `@vis.gl/react-google-maps` and Google Maps Platform APIs. Biases searches near patient longitude/latitude coordinates for emergency clinics, diagnostic labs, pharmacies, and lists them in highly detailed card directories. Computes driving direction polygons natively via `Route.computeRoutes()` utilizing modern routes library references.

### H. Google Calendar Sync Subsystem (Workspace Integration)
- Connects authenticated sessions directly to Google Calendar APIs. Reads future itineraries, highlights healthcare-related appointments in dedicated highlights, and enables addition/deletion of clinical timelines with strict confirmation modals.

## 6. Database Schema
### Firestore Collections
User-owned app data remains exclusively under `users/{userId}/...`
- `users/{userId}/profiles/{profileId}`: Primary patient context.
  - `specialistChats/{specialistId}`: Persists historical chat arrays.
  - `cycleLogs/{logId}`: Dedicated timeline events for reproductive cycle tracking.
- `users/{userId}/documents/{documentId}`: Report metadata.
- Storage uploads remain under `users/{userId}/documents/...`

## 7. Operational & Autonomous Deployments (Google Jules)
- **GitHub Triggers:** Labeled issue webhooks invoke Firebase Cloud Functions to instantiate autonomous sessions.
- **Verification:** Built against strict Vite/React linting and Vitest testing checks before staging branch synchronization.
