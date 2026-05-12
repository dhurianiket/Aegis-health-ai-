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
