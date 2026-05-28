# ARCHITECTURE.md — System Reference & Verified Design Specifications

This document serves as the single source of truth for the technical architecture of Aegis Health AI (Production Release v1.7.0).

## 1. Technical Stack Blueprint
- **Frontend Core:** React 18, TypeScript, Vite, Tailwind CSS (Strict Semantic CSS Variable Theming).
- **Infrastructure Core:** Firebase (Authentication, Cloud Firestore, Hosting).
- **AI Analytics Engine:** Google Gemini Developer Enterprise API Gateway.
  - *Routing:* **Gemini Flash** is utilized exclusively for high-speed data extraction and structured telemetry parsing. **Gemini Pro** handles conversational depth and virtual multi-specialty polyclinic threads.
- **Medical Intelligence Hub:** U.S. National Library of Medicine (NLM) RxNorm Datasets.

## 2. Security & API Management
- **Firebase Auth Constraint:** Authentication is built on standard Firebase Auth (Identity Platform is NOT enabled). The `authDomain` MUST remain the project's native `firebaseapp.com` domain.
- **Auth Flow Resilience:** The system runs primarily on `signInWithPopup` (to avoid Cloudflare caching breaking `/__/auth/handler`), with automated, graceful degradation to `signInWithRedirect` upon detecting popup blockers or embedded webview environments.
- **API Key Hardening:** All Google Cloud API keys (specifically for the Gemini 2.5 Flash model) must be secured using HTTP Referrer restrictions limited strictly to our production domain (`*aegishealthai.co.in/*`) and local development environments.
- **Environment Variables:** The frontend must solely rely on Vite environment variables (e.g., `import.meta.env.VITE_GEMINI_API_KEY`) for API access.
- **Zero-Trust Hardcoding Guardrail:** Strict architectural rule established: raw API keys or secrets must **never** be hardcoded inside standard files or committed to version control.

## 3. Component Hierarchy & Data Flow

```
[User Document Upload] ➔ [UploadPipeline.ts] ➔ [Gemini Flash Extraction API]
│
┌────────────────────────┴────────────────────────┐
▼                                                 ▼
[Firestore Observations]                         [Firestore Smart Alerts]
│                                                 │
▼                                                 ▼
[LabTrendChart.tsx]                              [ReminderService.ts]
(Enforced 300px Sizing)                           (Auto-Schedules +90 Days)
```

## 3. Core Subsystem Definitions

### A. Multi-Report Side-by-Side Comparison Engine
- **Calculations:** Takes exactly 2 checked collections of lab records, matches biomarkers via case-insensitive `testName` filters, references threshold metrics inside `CLINICAL_STABILITY_THRESHOLDS`, and presents delta shifts utilizing directional indicators (↑ / ↓) without throwing layout runtime loop exceptions.

### B. Print Synthesis Generator (`generateDoctorReport`)
- **Pipeline:** Leverages local client-side PDF compilers to package SBAR (Situation, Background, Assessment, Recommendation) framework elements, chronological trends, and flagged abnormal laboratory results into a print-ready document.
- **Legal Invariant:** Every document generated must render the following literal string value across the header:
  *"This document was prepared by the patient using Aegis Health AI. It is a patient-generated informational summary and does NOT constitute a medical record, diagnosis, or clinical assessment. Always verify values against original laboratory reports."*

### C. Follow-up Chronology Monitor (`reminderService.ts`)
- **Automated Scheduling:** Hooks into `uploadPipeline.ts` at step **7b**. If incoming laboratory alerts contain out-of-bounds metrics (`HIGH`/`CRITICAL`), the system runs deduplication logic against existing entries and automatically initializes a follow-up checklist target dated exactly at `Today + 90 Days` written to Firestore path `users/{userId}/reminders`.

### D. Keyless Drug-to-Drug Interaction Matrix
- **Data Ingestion Engine:** Operates entirely over open-source public endpoints (`https://rxnav.nlm.nih.gov/REST/...`), translating unstructured medication strings into standardized RxCUI values. 
- **Severity Mapping:** Maps NLM string variables directly into structured internal schemas (`High` ➔ `severe`, `Moderate` ➔ `moderate`, alternate values ➔ `mild`) to display non-alarmist UI warning badges on the client dashboard.

## 4. Database Schema
### Firestore Collections
User-owned app data remains exclusively under `users/{userId}/...`
- `users/{userId}/profiles/{profileId}`: Primary patient context.
  - `specialistChats/{specialistId}`: Persists historical chat arrays or chat payloads for individual AI specialists.
  - `cycleLogs/{logId}`: Dedicated timeline events for reproductive cycle tracking.
- `users/{userId}/documents/{documentId}`: Report metadata.
- Storage uploads remain under `users/{userId}/documents/...`

## 5. Data Models
### Profile Schema
- The Profile model extends standard demographics to include:
  - `height`
  - `weight`
  - `bmi`
  - `clinicalNotes`
  - `reproductiveProfile` (Optional): Consent-gated tracking (e.g. `cycleTrackingEnabled`, `menstruates`, etc.).

### Cycle Tracking Constraints
- Menstrual cycle tracking is strictly consent-gated and not driven by simplistic `gender === "female"` logic.
- Aura AI must not silently persist reproductive health data without explicit user confirmation.

## 6. Core Services & Hooks
- `useClinicalContext.ts`: centralizes the clinical context generation logic mapping state and observations to structured prompt contexts.

## 7. Protected Layouts
- **Specialist Lounge:** The mobile experience strictly uses a portal-based full-screen consultation shell (`createPortal`) to escape transformed/scrolling parent containers.

## 8. Static Marketing Directory Map
The landing site and marketing/article pages reside statically in the `/public/` root, designed for rapid loading, maximum SEO indexability, and clean decoupling from the React PWA client.
- `/public/index.html` — Primary home gateway and feature matrix.
- `/public/how-it-works.html` — Deep educational explanation of the biomarker mapping engine and 8-part FAQ.
- `/public/about.html` — First-person startup founder history and business communication channels.
- `/public/security.html` — DPDP Act compliance architecture, security boundaries, and data-erasure walk-through.
- `/public/blog-hba1c.html` & `/public/blog-cbc.html` — Specialized blood sugar and hematology guides.
- `/public/engineering-playbook.html` — Decentralized agent network automation walkthrough.
- `/public/styles.css` — Standardized typography headings and responsive visual utilities.

## 9. Google Jules Autonomous Cloud VM Integration
To achieve zero-human content creation and automated bug resolution, Aegis integrates custom **Google Jules** sandboxed environments.
- **GitHub Triggers:** Labeled issue webhooks (`jules-fix`, `jules-feature`) invoke Firebase Cloud Functions to instantiate Google Jules VM sessions under isolated branch checkouts (`jules/branch-issue-*`).
- **Plan Verification Pre-Flight:** Refuses compilation execution loops until an internal **Gemini Pro Plan Auditor** verifies the session steps. This ensures strict adherence to structural boundaries, CORS wrappers, and secret variables whitelists.
- **Failover / Retries:** Incorporates exponential backoff retry profiles. If a Jules session encounters terminal regression blocks, a callback gracefully triggers the **Hermes Manager Failover Protocol** to release active orchestrator queue locks and log diagnostic reports under isolated developer pathways: `users/developer_agent_jules/julesSessions/{sessionId}`.
- **Downstream Sync Script:** CLI staging pull runs (`jules remote pull --session`) execute automatic static typing (`npm run lint`), local unit testing frameworks (`npm run test` with Vitest), and optional browser assertions (`npx playwright test`) before moving code into main paths.