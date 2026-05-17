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
**Date:** 2026-05-17
**Reason:** Runtime Master Hotfix (Dates & UI Contrast)
**What changed:**
- Implemented global `parseSafeTimestamp` to safely parse Firestore Timestamp objects across Safari and generic browsers, preventing `RangeError: Invalid Date`.
- Replaced raw `new Date()` calls throughout data models, context service, and dashboard components.
- Added strict `NaN` and `null` filtering before injecting data into Recharts lines/sparklines.
- Hardened the AI query model execution by implementing an explicit and robust fallback chain (`3.1-pro` -> `1.5-pro` -> `3-flash`) and tracking fatal errors via `[GEMINI API FATAL ERROR]`.
- Addressed multiple light mode UI text contrast issues inside `ChatCoach`, `AlertBanner`, and `SpecialistLounge`.
**What remains unchanged:**
- The hybrid architecture routing logic.
- Core UI functionality, auth flow, and Firestore security rules.
**Verification status:** Verified via build. No regressions detected in chart rendering.
