# Aegis Health AI — Agent Context & Guardrails
**Target Version:** 1.6.0+

## Project Overview
Aegis is a personal health management Progressive Web App (PWA) that allows users to upload medical reports, extract lab values using AI, track health trends over time, and consult AI-powered specialists.

## Tech Stack
- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Hosting:** Firebase Hosting → aegishealthai.co.in (proxied via Cloudflare)
- **Database:** Firebase Firestore
- **Auth:** Firebase Google Sign-In
- **AI:** Google Gemini API (@google/genai) routed via Cloudflare AI Gateway
- **CI/CD:** GitHub Actions → auto-deploys on push to main branch

## Operational Guidance for Agents (CRITICAL)
- **Deployment Truth Rule:** Local code changes are NOT production fixes until GitHub Actions or a manual Firebase deploy has completed successfully.
- **Verification Rule:** Do not mark issues as fixed based on build/lint passes alone; require live runtime verification and fresh console output.
- **Admin Access Rule:** `collectionGroup` usage reads must be strictly role-gated and fail gracefully for non-admin users without causing UI crashes.
- **React Hooks Rule:** Hooks (`useState`, `useEffect`, etc.) must never be declared conditionally or after an early return. 
- **Firebase Hosting Rule:** Auth popup issues and COOP header changes in `firebase.json` require a full hosting redeploy before taking effect.
- **Debugging Rule:** Record the exact root cause, specific files changed, and precise post-deploy validation steps.

## Environment Variables
Stored in GitHub Actions Secrets (never hardcoded). Declared in `vite-env.d.ts` and `.env.example`:
- `VITE_GEMINI_API_KEY`, `VITE_CLOUDFLARE_AI_GATEWAY_URL`, `VITE_CF_AIG_TOKEN`
- Firebase config variables.

## Strict AI System Guardrails & v1.6.0 Protections
**1. Model Standardization:** Aegis uses a hybrid Gemini strategy. Uses `gemini-2.5-flash` for extraction, chat routing, and structured tasks. Uses `gemini-2.5-pro` for SBAAR, doctor summary, specialist summary, and final clinical reasoning.
**2. Storage Integrity:** Do not alter Firebase Storage upload paths or Security Rules. Per-user file isolation is absolute.
**3. API Rate Limiting:** All Gemini API calls must go through `safeGeminiCall()` in `promptFramework.ts` (handles 3-attempt exponential backoff). PDFs process sequentially with a 5-second delay. Pro tasks must include a fallback to Flash.
**4. Data Visualization (Recharts):** - **DO NOT** modify the safe `getTime()` date parsing fallback in `LabTrendChart.tsx` (fixes Safari/iOS `Invalid Date` bugs).
   - **DO NOT** change the numerical parser `parseFloat(String(lab.value).replace(/[^0-9.-]/g, ''))`.
   - Charts use `ResizeObserver` with `debounce={50}`. Never render with width/height of -1.
**5. PDF Export Pipeline:** - **DO NOT** modify the `html-to-image` configs in `pdfExportService.ts`. The `pixelRatio` is strictly locked at `2` with `skipAutoScale: true` to prevent mobile GPU memory blowouts.
   - The PDF template must always target the hidden `#health-report-printable` node to enforce light-mode and render the AI SBAAR summary.
**6. Clinical Safety:** **DO NOT** remove the `runSafetyCheck` interceptor or the `<clinical_safety_rules>` from the `COACH_SYSTEM_INSTRUCTION`. The AI must refuse diagnosis and append disclaimers.
**7. UX Performance:** **DO NOT** remove `localStorage` checks for `ConsentScreen.tsx` or the Theme Toggle. `SpecialistLounge.tsx` must maintain its horizontal scrolling UI (`overflow-x-auto`) on mobile devices.
**8. Schema Merge Logic:** Do not remove the schema merge logic that supports both `lab_values` and `observations`.

## Data Structure (Firestore)
`users/{uid}/` -> `documents/{docId}/`, `profile/`, `medications/`, `usage/` (Analytics)
