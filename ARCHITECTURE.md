# Architecture Reference
**Current Version:** 1.6.0+ (Multimodal)

## Technical Stack
- Frontend: React 18, Vite, Tailwind CSS, Framer Motion
- Backend/Database: Firebase (Firestore, Storage, Hosting)
- Authentication: Firebase Auth (Google Sign-In)
- AI Integration: Gemini API (`@google/genai`) via Cloudflare Gateway

## Authentication Architecture
- Auth Domain: Firebase `authDomain` is locked to `aegishealthai.co.in`.
- Sign-In Method: Exclusively `signInWithPopup`.
- Routing Strategy: State-driven. Unauthenticated users remain on `/` and passively watch the global Auth Context. When `!loading && user` resolves to true, a `useEffect` hook programmatically pushes to `/dashboard`.

## Core Pipelines

### 1. Ingestion & Extraction
- Flow: PDF/Image -> Firebase Storage -> `promptFramework.ts` -> Validation -> Firestore.
- Model: `gemini-3-flash-preview` handles throughput and structured extraction.

### 2. Context Aggregation & RAG
- Groups historical lab results chronologically and maps manual medications.
- Injects a master `PatientContext` into AI prompts.

### 3. Virtual Polyclinic, Chat & Multimodal Inputs
- Factory Pattern routes user chats to 10 clinical AI personas.
- **Streaming:** Chat responses utilize `generateContentStream` for low-latency, word-by-word token delivery to the UI.
- **Voice:** Implements native browser `MediaRecorder` API for Speech-to-Text input.
- **Grounding:** Injects Google Search tool definitions into payloads to fetch live medical data when required.

### 4. Performance & Accessibility
- Components utilize `React.lazy` and `<Suspense>` to drastically reduce initial bundle size (specifically Recharts and PDF generators).
- Fully WCAG compliant with strict H1-H3 hierarchies, ARIA labels on all icon/filter buttons, and semantic `<main>` landmarks.

### 5. PDF Export Pipeline
- Hardware-safe (`pixelRatio: 2`) capturing of SVG Recharts via `html-to-image` on a hidden DOM node, bridged to `jspdf`.
