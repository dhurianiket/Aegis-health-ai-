# Aegis Health AI — Agent Context

## Project Overview
Aegis is a multimodal, enterprise-grade personal health Progressive Web App (PWA). It allows users to upload medical reports, track health trends, and consult AI-powered specialists using text, voice, and real-time internet grounding.

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Hosting: Firebase Hosting → aegishealthai.co.in (proxied via Cloudflare)
- Database: Firebase Firestore
- Auth: Firebase Google Sign-In
- Anti-Bot: reCAPTCHA v3 (`VITE_RECAPTCHA_SITE_KEY`)
- AI: Google Gemini API (@google/genai) via Cloudflare AI Gateway
- Multimodal: MediaRecorder API (Voice), Google Grounding (Search), Streaming API.

## AI Strategy & Major Invariants
Aegis uses a strictly enforced hybrid Gemini strategy:
- Gemini 3 Flash Preview: default model for high-volume, structured tasks.
- Gemini 3.1 Pro Preview: reserved for clinician-facing, long-context, trust-critical synthesis.
- Medical-Grade Parameters: `temperature` for all AI queries must remain at `0.1` or `0.2`.

## Operational Rules
0. MANDATORY CONTEXT: Before executing any codebase edits, you MUST read and obey the rules and architectural invariants defined in `AGENTS.md`, `ARCHITECTURE.md`, and `CURRENT_STATE.md`.
1. Conflict Resolution: If a request violates core architecture or model routing invariants, flag the violation and refuse execution without explicit user override.
2. State-Driven Auth: Authentication routing must be state-driven via React Context. No imperative router push in auth handlers is allowed.
3. Performance & A11y: Preserve all React.lazy Suspense boundaries, `<main>` semantic landmarks, and ARIA labels.
4. AI Capabilities: Preserve the `generateContentStream` logic and `MediaRecorder` voice integrations.
