# Aegis Health AI — Agent Context

## Project Overview
Aegis is a multimodal, enterprise-grade personal health Progressive Web App (PWA). It allows users to upload medical reports, track health trends, and consult AI-powered specialists using text, voice, and real-time internet grounding.

## Active Tech Stack (Read Carefully)
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion. 
  *(Note: Next.js and Firebase App Hosting are NOT used. Do not assume App Directory setups).*
- **Hosting:** Firebase Hosting.
- **Database / Storage:** Firebase Firestore & Firebase Storage.
- **Backend / Triggers:** Firebase Cloud Functions (Node.js) located in `/functions/src/`.
- **Auth:** Firebase Google Sign-In (Authentication).
- **Anti-Bot:** reCAPTCHA v3 (`VITE_RECAPTCHA_SITE_KEY`).
- **AI:** Google Gemini API (@google/genai) with automated request interception in `geminiClient.ts`. Maps older preview model identifiers to stable, long-term options (`gemini-3.5-flash` and `gemini-3.1-pro-preview`) and retries using `gemini-3.5-flash` to handle 503 high-demand errors.

## Core Conventions & Rules
1. **Repository Awareness:** ALWAYS read `ARCHITECTURE.md`, `CURRENT_STATE.md`, and `AGENTS.md` before making sweeping changes. 
2. **Landing Page Constraints:** The landing page is the home page. Do not change the landing page design, copy, or styling unless explicitly asked.
3. **Keep Mobile-First:** Preserve `.flex-col`, `md:flex-row`, and Tailwind's mobile-first conventions at all times.
4. **Preserve Brand Styling:** Aegis has a specific, soft, high-contrast, patient-friendly look. Do not arbitrarily change semantic colors (`bg-theme`, `text-surface`) to default gray or black without reason.
5. **Firebase Patterns:** We use standard Firebase SDK patterns. Keep functions inside `/functions/` and frontend queries isolated in standard hook structures. Do not mix Next.js paradigms into the Vite setup.
6. **Authentication:** The auth flow explicitly utilizes `onAuthStateChanged` state to handle seamless transition to the dashboard. 

## Workflow
- Verify current status via `CURRENT_STATE.md`.
- Implement new logic respecting the Vite boundaries. 
- For backend logic, touch `/functions/` and run `npm run build` within that context.
- Keep the `CURRENT_STATE.md` in sync whenever you complete a major structural change.
