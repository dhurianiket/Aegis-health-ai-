# Aegis Health AI — Agent Context

## Project Overview
Aegis is a personal health management Progressive Web App (PWA) allowing users to upload medical reports, extract lab values using AI, track health trends, and consult AI-powered specialists.

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Hosting: Firebase Hosting → aegishealthai.co.in (proxied via Cloudflare)
- Database: Firebase Firestore
- Auth: Firebase Google Sign-In
- AI: Google Gemini API (@google/genai) via Cloudflare AI Gateway

## AI Strategy & Major Invariants
Aegis uses a strictly enforced hybrid Gemini strategy:
- Gemini 3 Flash Preview: default model for high-volume, structured tasks.
- Gemini 3.1 Pro Preview: reserved for clinician-facing, long-context, trust-critical synthesis.
- Medical-Grade Parameters: `temperature` for all AI queries must remain at `0.1` or `0.2`.

## Operational Rules
1. Conflict Resolution: If a request violates core architecture or model routing invariants, flag the violation and refuse execution without explicit user override.
2. State-Driven Auth: Authentication routing must be state-driven via React Context. No imperative router push in auth handlers is allowed.
3. Caching Integrity: Cached reports must be reused unless source hash or relevant versions change.
4. UI Safety: Chart components must use defensive rendering and return an empty state if data is undefined.
5. Secrets: Never hardcode API keys. Rely on `VITE_GEMINI_API_KEY` and Cloudflare variables.
