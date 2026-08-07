# Changelog

All notable changes to Aegis Health AI will be documented in this file.

## [2.0.0] - 2026-08-07

### 🚀 Major Clinical Intelligence Release

Aegis Health AI v2.0.0 represents a major evolutionary leap in personalized health intelligence, introducing real-time wearable telemetry fusion, a visual drug-lab contraindication matrix, multimodal vision OCR for handwritten medical notes, and grounded clinical specialist guidance.

---

### ⌚ Wearable Telemetry & Fusion Engine
- **Live Device Pairing & Cloud Sync**: Added native Web Bluetooth device pairing (`connectWebBluetooth()`) and real-time Firestore persistence (`useWearableTelemetry.ts`) under `users/{uid}/wearableTelemetry`.
- **5-Panel AI Health Coach**: Embedded `WearableCoachWidget` featuring Daily Readiness Scores (0-100), Sleep Architecture visualizers, Biometric Micro-Trend Sparklines (RHR/HRV/SpO2/Steps), and Recovery Strain Overrides.
- **Biometric Diagnostic Engine**: Built `biometricDiagnosticEngine.ts` to cross-evaluate real-time wearable telemetry against laboratory biomarkers (HbA1c, CRP, Ferritin) and imaging findings.
- **Clinical Triage Safety Alerts**: Automatic hazard detection for acute conditions like tachycardia and nocturnal hypoxia.

### 💊 Visual Drug-Drug & Drug-Lab Interaction Matrix
- **Contraindication Engine Service**: Built `drugLabEngine.ts` covering critical drug-lab and drug-drug interactions (ACEi/ARB + Potassium, Metformin + eGFR/Creatinine, Statins + ALT/AST, Anticoagulants + INR) using RxCUI & string matching.
- **Interactive Dual-Axis Matrix UI**: Built `InteractionMatrix.tsx` rendering interactive compatibility grids, mobile stacked cards (`md:hidden block`), plain-language clinical summaries, and direct Aura AI recommendations.
- **Real-Time Context Sync**: Firestore `onSnapshot` listener in `useClinicalContext.ts` streams newly added patient medications to AI context dynamically.

### 📷 Multimodal Vision OCR & Document Extraction
- **Camera & Photo Capture**: Direct environment camera trigger and client-side HTML5 canvas compression for photo payloads > 4MB.
- **Structured Schema OCR**: Upgraded Gemini extraction prompts (`gemini.ts` & `promptFramework.ts`) with Zod schema validation (`UnifiedExtractionResultSchema`) to process handwritten doctor notes, prescriptions, and complex multi-column lab charts.

### 🩺 Medical Consensus Grounded AI Specialist Polyclinic
- **Clinical Guidelines Grounding**: Integrated official clinical guidelines catalog (`sourceGroundedService.ts`: ACC/AHA 2024, ADA 2025, KDIGO 2024, ESC 2025).
- **Evidence Pill Badges**: Color-coded, interactive citation badges (`CitationBadge.tsx`) in `SpecialistLounge.tsx` pointing to authoritative clinical evidence.

### 🎨 3D Glassmorphic Design & WCAG AA Legibility
- **3D Feature Showcase**: Interactive 3D glassmorphic card section on `LandingPage.tsx` with tilt physics and ambient glow.
- **WCAG AA Typography Audit**: Converted legacy dark-only colors to semantic CSS variables across `ProfileManagement.tsx`, `FamilyHub.tsx`, `IntegrationsPanel.tsx`, and `SettingsPage.tsx` for optimal contrast in light and dark modes.
- **Pretext Layout Shift Elimination**: Synchronous canvas-backed text height calculations using `@chenglou/pretext` across text areas and virtualized lists.

### 🗺️ Localized Care Map & Calendar Sync
- **Interactive Care Map**: Powered by `@vis.gl/react-google-maps` with driving vector overlays (`Route.computeRoutes()`) to locate nearby medical facilities, diagnostic labs, and specialists.
- **Google Workspace Calendar Sync**: Direct Fetch calendar manager supporting appointment creation and health routine scheduling.

### 🛡️ Core Infrastructure & Resilience
- **Gemini 503 Interceptor**: Proxy interceptor in `geminiClient.ts` captures high-demand service errors and transparently retries with stable fallback models.
- **Graphify Codebase Knowledge Graph**: Automated AST index generator (`scripts/graphify.ts`) producing `GRAPHIFY.md` for instant AI context navigation.
