# Aegis Health Intelligence - Development Tracker

## Current Architecture & State
* **Core AI Model:** Standardized on `gemini-2.0-flash` across all 8 AI services.
* **PDF Upload Pipeline:** Bypasses Firebase Storage. Reads PDF as base64 locally, sends to Gemini with an increased 45-second timeout, and saves extracted JSON to Firestore. Validation is relaxed to accept partial data.
* **Security & Data Isolation:** Firestore rules hardened to isolate data strictly under `users/{userId}/**`. Public shares use scoped sub-collections (`users/{userId}/shares/{shareId}`). Server-side filtering enforces `profileId`.
* **SBAR Clinical Engine:** Generates clinical handover summaries using real patient demographics, labs, and medications from Firestore. Includes PDF export functionality.
* **Aura AI (Chatbot):** Error-handling implemented (try/catch on streams) to prevent UI crashes. Sanitizes internal AI generation errors (e.g., "Shield Failure") to present a clean, clinical UI.

## Recently Fixed (Latest Sprint)
1.  **PDF Extraction Block (Critical):** Relaxed strict validation in `UploadCenter.tsx` to allow partial data extraction instead of throwing "Could not extract data" errors on poor-quality documents. Added detailed pipeline console logs.
2.  **Mobile Navbar Bug (High):** Removed `overflow-hidden` from `AppNav.tsx` so the "More" menu and Settings tab render correctly and do not clip on small screens.
3.  **Branding Standardization (Low):** App/Engine = Aegis AI / Aegis Health Intelligence. Chatbot = Aura AI.
4.  **CI/CD:** GitHub Actions workflow upgraded to use the Node.js 24 runner to eliminate deprecation warnings.

## Next Immediate Steps
* Perform an end-to-end test of the CBC/ESR PDF upload with the newly relaxed validation in place.
* Verify the SBAR populates correctly with the extracted lab data post-upload.

## DIAGNOSTICS (Phase 2):
**A. PDF Ingest Bug:** `extractMedicalReports` relies solely on text prompting for JSON structure. It lacks a true `responseSchema`. If Gemini omits a field or varies the type slightly, `safeJsonParse` might work but the downstream logic in `UploadCenter` or `Firestore` might fail due to missing fields. Also, if there are NO labs extracted, it silently passes with `0 values found`.
**B. Meds Context Bug:** In `contextService.ts`, `medications.filter(m => m.status === "active")` is likely failing case-sensitivity checking (if Firestore has "Active"). This hides medications from the Aura AI prompt.
**C. UI UX:** In `UploadCenter.tsx`, empty labs result in a confusing success message. In `Dashboard`/`SBAR`, lack of data leads to generic errors instead of clear empty states.

## Fixed (Phase 3):
1. **Gemini Extraction:** Added strict `responseSchema` (with clean optional handling via removing from `required`) so `extractMedicalReports` forces Gemini to output valid JSON keys. Removed "nullable" which is unstable in SDK schemas.
2. **Medication Context:** Modifed `contextService.ts` to use case-insensitive `.toLowerCase()` matching on `m.status` so "Active" meds from Firestore are injected properly into Aura AI context. Added explicit system instruction inside `ChatCoach.tsx` telling Aura to use these medicines.
3. **Targeted UX:** 
   - `UploadCenter.tsx`: Display a clear warning notice "We couldn't read any numeric lab values..." so users aren't confused.
   - `UploadCenter.tsx`: The sync button handles empty arrays gracefully, disabled if arrays exist but none selected.
   - `SBARPreview.tsx`: Clear "No Clinical Data" empty state displayed when text is empty or simply includes 'No data provided.' instead of error layout.
