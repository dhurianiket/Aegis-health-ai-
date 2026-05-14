# Aegis Health AI — Agent Context

## Project Overview
Aegis is a personal health management Progressive Web App (PWA) that allows users to upload medical reports, extract lab values using AI, track health trends over time, and get AI-powered health insights.

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
- **Admin Access Rule:** `collectionGroup` usage reads (and similar global queries) must be strictly role-gated. They must fail gracefully for non-admin users without causing uncaught promise rejections or UI crashes.
- **React Hooks Rule:** Hooks (`useState`, `useEffect`, etc.) must never be declared conditionally or after an early return. They must always be called unconditionally at the top level of the component.
- **Firebase Hosting Rule:** Auth popup issues and Cross-Origin-Opener-Policy (COOP) header changes in `firebase.json` require a full hosting redeploy before they take effect in production. Always document and verify these changes post-deploy.
- **Debugging Rule:** When fixing bugs, always record the exact root cause, the specific files changed, and the precise post-deploy validation steps taken to confirm the fix in production.

## Environment Variables
All secrets are stored in GitHub Actions Secrets and never hardcoded:
- `VITE_GEMINI_API_KEY` — Google Gemini API key
- `VITE_CLOUDFLARE_AI_GATEWAY_URL` — Cloudflare AI Gateway URL for Gemini
- `VITE_CF_AIG_TOKEN` — Cloudflare AI Gateway authentication token
- Firebase config variables (API key, project ID, app ID, etc.)

## Active AI Model
The approved AI model for this project must always be a currently supported Gemini Flash model verified against the active project account. Currently using `gemini-2.5-flash`.

## Architecture Rules (Always Follow)
1. Never hardcode API keys, tokens, URLs, or account IDs in any file
2. All new environment variables must be declared in `vite-env.d.ts` and documented in `.env.example`
3. Build must pass before considering any task complete
4. All Gemini API calls must go through `safeGeminiCall()` in `promptFramework.ts` which handles 3-attempt exponential backoff on 429 errors
5. PDF files are processed sequentially with a 5-second delay between each Gemini call — never in parallel
6. `hasSynced` lock in `UploadCenter.tsx` prevents duplicate Firestore writes — do not remove it
7. Chart components use ResizeObserver with debounce={50} — never render with width/height of -1
8. Maximum file size for upload is 4MB — rejected at drop with toast notification

## Strict AI System Guardrails

* **Model Standardization:** The approved AI model for this project must always be a currently supported Gemini Flash model verified against the active project account. Currently using `gemini-2.5-flash`. Do not change model strings unless the currently active model is confirmed broken and the replacement model is verified available. If a model returns 404 or unavailable, check the Gemini models list for the active account before editing code.
* **Storage Integrity:** Do not alter Firebase Storage upload paths, file listing logic, or Security Rules. Per-user file isolation is a strict architectural requirement.
* **PDF Workflow Protection:** Do not switch PDF ingestion away from Firebase Storage unless the owner explicitly approves an architecture change. The PDF upload/download feature is required for usability and must remain in place.

## Data Structure (Firestore)
```
users/
  {uid}/
    documents/
      {docId}/    ← lab report documents
    profile/      ← user profile data
    medications/  ← medication records
```

## Additions: Tests, CI, Backoff logging
- Unit tests required for AuthContext regression preventions.
- CI smoke E2E nightly deploy checks guard against regressions.
- `gemini_backoff` structure logging required for rate-limit visibility.