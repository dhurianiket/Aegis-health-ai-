# Aegis Health Intelligence - Development Tracker
**Status:** v1.6.0+ Production Build (Authoritative Snapshot)

## Stable State
- AI Engine Upgraded: Core engine running `gemini-3.1-pro-preview` and `gemini-3-flash-preview` with medical-grade temperatures (`0.1`/`0.2`). History SDK crashes resolved via strict object serialization.
- Authentication Stabilized: Redirect loops eliminated. Enforced state-driven UI routing relying strictly on `signInWithPopup` via custom domain `aegishealthai.co.in`.
- UI/UX Resilience: Defensive rendering added to LabTrendChart to prevent blank-data crashes. PDF extraction wrapped in explicit try/catch blocks with native toast fallback. Theme toggles and notification action routes successfully linked.
- AI Specialist Lounge: 10 guideline-backed AI specialists deployed with horizontal scroll UI.
- SBAAR Generation: AI proactively generates clinical-grade SBAAR summaries.
- SBAR PDF Export: High-fidelity PDF export pipeline capturing Recharts and AI summaries.

## Experimental / Pending
- None currently active.

## Do Not Change Without Approval (INVARIANTS)
1. AI Routing: Gemini Flash is the default for extraction/parsing. Gemini Pro is strictly reserved for SBAAR and deep clinical synthesis.
2. Auth Pattern: Authentication strictly uses `signInWithPopup`. State-driven routing only. Imperative router push in auth handlers is banned.
3. Caching: Cached reports must be reused unless source hash changes.
4. UI Guardrails: Keep all chart, PDF, dashboard, and crash-fix guardrails intact.

## Changelog
**Date:** 2026-05-16
**Reason:** Master Hotfix & Architecture Lockdown (v1.6.0 Launch)
**What changed:**
- Upgraded models to Gemini 3.1 Pro Preview and Gemini 3 Flash Preview.
- Implemented `useEffect` state-driven routing for authentication to fix race conditions.
- Fixed chart rendering crashes via defensive empty-state handling.
- Sanitized AI chat history payloads to prevent native Google SDK time-formatting crashes.
**What remains unchanged:**
- The hybrid architecture routing logic.
- Core UI functionality and Firestore security rules.
**Verification status:** Verified via build plus runtime testing.
