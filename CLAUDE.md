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

## Key Files
- `src/lib/geminiClient.ts` — Gemini API client initialization with Cloudflare gateway baseUrl
- `src/services/ai/gemini.ts` — AI service functions (SBAR generation, lab extraction)
- `src/services/ai/promptFramework.ts` — all Gemini prompts + safeGeminiCall() with exponential backoff
- `src/components/Upload/UploadCenter.tsx` — PDF upload, extraction, vault sync with hasSynced lock
- `src/components/AIHelper/ChatCoach.tsx` — Aura AI health coach chat
- `src/components/Dashboard/LabTrendChart.tsx` — Recharts lab trend charts
- `src/components/Dashboard/TrendSparklines.tsx` — Recharts sparkline charts
- `src/services/pdfExportService.ts` — PDF export service
- `src/vite-env.d.ts` — TypeScript environment variable declarations
- `.env.example` — environment variable documentation

## Environment Variables
All secrets are stored in GitHub Actions Secrets and never hardcoded:
- `VITE_GEMINI_API_KEY` — Google Gemini API key
- `VITE_CLOUDFLARE_AI_GATEWAY_URL` — Cloudflare AI Gateway URL for Gemini
- `VITE_CF_AIG_TOKEN` — Cloudflare AI Gateway authentication token
- Firebase config variables (API key, project ID, app ID, etc.)

## Active AI Model
Aegis uses a hybrid Gemini strategy:
- Gemini Flash (`gemini-2.5-flash`) is the default model for high-volume, structured, and cost-sensitive tasks like extraction, formatting, and chat routing.
- Gemini Pro (`gemini-2.5-pro`) is reserved for clinician-facing, long-context, trust-critical synthesis like SBAAR and Specialist/Doctor summaries.
- Pro tasks degrade gracefully to Flash if Pro fails or is unavailable.

## Architecture Rules (Always Follow)
1. Never hardcode API keys, tokens, URLs, or account IDs in any file
2. All new environment variables must be declared in `vite-env.d.ts` and documented in `.env.example`
3. Build must pass before considering any task complete
4. All Gemini API calls must go through `safeGeminiCall()` in `promptFramework.ts` which handles 3-attempt exponential backoff on 429 errors
5. PDF files are processed sequentially with a 5-second delay between each Gemini call — never in parallel
6. `hasSynced` lock in `UploadCenter.tsx` prevents duplicate Firestore writes — do not remove it
7. Chart components use ResizeObserver with debounce={50} — never render with width/height of -1
8. Maximum file size for upload is 4MB — rejected at drop with toast notification

## Data Structure (Firestore)
```
users/
  {uid}/
    documents/
      {docId}/    ← lab report documents
    profile/      ← user profile data
    medications/  ← medication records
```

## When Making Changes
- Read the relevant file before editing
- Make minimal focused changes — do not refactor unrelated code
- Confirm build passes after every change
- Summarize exactly which files were changed and why
