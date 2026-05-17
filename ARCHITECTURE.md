# Architecture Reference
**Current Version:** 1.6.0+

## Technical Stack
- Frontend: React 18, Vite, Tailwind CSS, Framer Motion
- Backend/Database: Firebase (Firestore, Storage, Hosting)
- Authentication: Firebase Auth (Google Sign-In)
- AI Integration: Gemini API (`@google/genai`) via Cloudflare Gateway

## Authentication Architecture
- Auth Domain: Firebase `authDomain` is locked to `aegishealthai.co.in`.
- Sign-In Method: Exclusively `signInWithPopup`.
- Routing Strategy: State-driven. Unauthenticated users remain on `/` and passively watch the global Auth Context. When `!loading && user` resolves to true, a `useEffect` hook programmatically pushes to `/dashboard`. There is no dedicated `/login` route.

## Core Pipelines

### 1. Ingestion & Extraction
- Flow: PDF/Image -> Firebase Storage -> `promptFramework.ts` -> Validation -> Firestore.
- Model: `gemini-3-flash-preview` handles throughput and structured extraction.

### 2. Context Aggregation & RAG
- Groups historical lab results chronologically and maps manual medications.
- Injects a master `PatientContext` into AI prompts.
- Model: `gemini-3-flash-preview`.

### 3. Virtual Polyclinic & Chat
- Factory Pattern routes user chats to 10 clinical AI personas.
- Routing: Low-complexity uses `gemini-3-flash-preview`. Clinical requests auto-escalate to `gemini-3.1-pro-preview`.
- History arrays are serialized safely to prevent SDK string formatting crashes.

### 4. Caching System
- Cached reports are reused when source data is unchanged.
- Reports are recomputed only when source hash, prompt version, template version, or model version changes.

### 5. PDF Export Pipeline
- Hardware-safe (`pixelRatio: 2`) capturing of SVG Recharts via `html-to-image` on a hidden DOM node, bridged to `jspdf`.
