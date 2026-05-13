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
`gemini-2.0-flash` is used everywhere — no other models permitted

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

## Additions: Tests, CI, Backoff logging

### ADDITION — Tests, CI smoke, and backoff logging

#### 1) Unit test — AuthContext + Dashboard regression
- Purpose: Prevent regressions where Dashboard fetches before auth initializes.
- File to add: tests/auth-dash.spec.ts (or update existing test folder)
- Test intent: confirm `authResolved` exported and Dashboard does not call Firestore when false.

Example (pseudo-code):
```markdown
Test: AuthContext exposes authResolved and Dashboard waits
- Mock onAuthStateChanged to delay initial callback.
- Render AuthContext provider and Dashboard.
- Assert: Dashboard shows loading spinner while authResolved is false.
- After resolving auth, assert: Dashboard fires a Firestore read once.
```

#### 2) CI smoke E2E — nightly deploy check
- Purpose: Run a minimal end-to-end smoke test after deploy (or nightly) to catch regressions early.
- Add a GitHub Actions job `ci-smoke.yml` that:
  - Runs on: push to main (optional) and schedule: nightly
  - Steps:
    1. Checkout repo
    2. Use Node.js LTS
    3. Install deps: npm ci
    4. Start build or hit deployed URL directly
    5. Run Playwright/Cypress test that: signs in with a test Google test account, uploads a tiny PDF, waits for report tile, asserts presence
  - On failure: open an issue and notify owners via Slack/email (webhook)

Example job summary (for docs):
```markdown
ci-smoke.yml job:
- name: Nightly smoke
- runs-on: ubuntu-latest
- schedule: cron(0 1 * * *)  # 01:00 UTC nightly
- steps: checkout -> npm ci -> run smoke tests -> report
```

#### 3) Backoff logging / metric hook
- Purpose: Surface retry/backoff events to logs so you can monitor rate limits without deep log combing.
- Change location: src/services/ai/promptFramework.ts (inside safeGeminiCall)
- Behavior to add:
  - On each retry, emit a structured console.debug / console.info:
    - { event: "gemini_backoff", attempt: n, delayMs, errorCode (if present) }
  - Optionally increment an in-process counter: `console.count('gemini_backoff')` or push to analytics when available.
- Example log line:
```markdown
{ "event":"gemini_backoff", "attempt":2, "delayMs":2000, "status":"429" }
```

#### Implementation notes
- Keep tests lightweight (one happy-path, one auth-race regression) to avoid flakiness.
- Use a single test account and secrets stored in GitHub Secrets for CI only; never commit credentials.
- The CI job should run against the deployed URL (aegishealthai.co.in) to validate the full production flow, not only the local build.

## Strict AI System Guardrails

* **Model Standardization:** The only approved AI model for this project is `gemini-2.0-flash`. Do not replace this string unless explicitly instructed. Any future AI model changes must be verified against the currently enabled Gemini API and project documentation before editing code.
* **Storage Integrity:** Do not alter Firebase Storage upload paths, file listing logic, or Security Rules. Per-user file isolation is a strict architectural requirement.
* **PDF Workflow Protection:** Do not switch PDF ingestion away from Firebase Storage unless the owner explicitly approves an architecture change. The PDF upload/download feature is required for usability and must remain in place.

## Current-State Safety Rules for AGENTS.md

- Only use the model currently approved in the project.
- If a model fails, check the Gemini models list and account access first.
- Do not global-replace model strings unless the current model is confirmed broken and the replacement is verified.
- Keep the model string consistent across the repo.
- Always verify `import.meta.env.VITE_GEMINI_API_KEY` is present and valid before debugging AI failures.
- If Cloudflare AI Gateway is enabled, confirm the SDK is using the correct gateway configuration before making broader changes.
- Do not touch Firebase config, environment files, Firestore rules, Storage rules, or deployment files unless the task explicitly requires it.
- Keep fixes minimal when the app is already stable.
- After any AI-layer change, run lint and build, then test ChatCoach, SBAR generation, PDF extraction, and specialist analysis.
- If a change affects production behavior, prefer a small patch and owner review rather than a broad refactor.