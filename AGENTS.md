# AGENTS.md — Developer Agent Operating Rulebook & Invariants

This file outlines the non-negotiable architectural and behavior rules for all AI agents, code editors, and developers modifying the Aegis Health AI repository.

## 🚨 CONFLICT RESOLUTION RULE
If any feature request, optimization, or refactoring task violates a documented invariant in this file or `ARCHITECTURE.md`, you MUST stop immediately, flag the conflict to the developer, and refuse to write code until explicitly approved.

---

## 1. Architectural Guardrails & Invariants

### A. Authentication & Routing Isolation
- **Rule:** Never modify the standard path routing wrappers around the Dashboard or onboarding state hooks. 
- **Constraint:** Main layout transitions between the user's root viewport and protected paths must remain tied strictly to Firebase `onAuthStateChanged` lifecycles.

### B. Gemini API Hybrid Processing Pipeline
- **Rule:** Do not change the logic splitting operations between Gemini models without explicit approval.
- **Constraint:** High-speed document extractions and structured telemetry parsing are routed exclusively to **Gemini Flash**. Conversational depth, virtual multi-specialty polyclinic threads, and complex medical symptom processing are mapped to **Gemini Pro**.

### C. Data Visualization (Recharts Rendering Safe-Zone)
- **Rule:** Every single `<ResponsiveContainer>` component inside the codebase MUST possess an explicit numerical layout height parameters baseline.
- **Constraint:** Never utilize bare `<div className="w-full h-full">` wrapper definitions without strict CSS pixel boundaries. All chart parents must enforce an explicit minimum container height class (`h-[300px] min-h-[300px]`) and pass `minWidth={0}` to the container element. This prevents `-1px` layout collapsing loop failures during React Suspense hydration.

### D. Multi-Report Component Portal Isolation
- **Rule:** The `ReportComparison` layer must live entirely decoupled from standard layout rendering streams.
- **Constraint:** To prevent mobile grid mashing or view overlaps, ensure the component is explicitly bound inside an absolute fixed layout portal wrapper using the exact utility classes:
  `className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-sm overflow-y-auto w-full h-screen"`

### E. Medication Log (CORS Fault Isolation Contract)
- **Rule:** The RxNorm API network requests (`lookupRxCUI`, `checkInteractions`) MUST remain isolated within defensive asynchronous `try/catch` shells.
- **Constraint:** If a fetch operation to the National Library of Medicine encounters a browser CORS block or a remote server downtime cascade, the function MUST catch the error silently, return a fallback value (`null` or `[]`), and allow the medication entry to write successfully to Firestore anyway. An API failure must never throw an unhandled exception or crash the user's UI.

### F. Firestore Isolation & Hierarchy
- **Rule:** All writes and collections must reside inside isolated, user-specific Firestore paths. 
- **Constraint:** Never introduce global root-level collections for shared states. All data must target subcollections underneath individual user paths: `users/{userId}/{subcollection}`.

### G. UI Theme Consistency (Semantic Variables)
- **Rule:** Never use hardcoded Tailwind structural colors (e.g., `text-white`, `bg-white`, `text-black`, `bg-slate-900`) for primary component backgrounds or text.
- **Constraint:** You MUST use the semantic CSS variables defined in the global stylesheet (e.g., `text-theme`, `text-muted`, `bg-surface`, `border-surface`) to ensure Light/Dark mode toggles function without contrast failures.

### H. React Performance & Main-Thread Safety
- **Rule:** Do not place heavy data aggregation loops (like mapping/reducing large lab datasets) directly inside `useEffect` or render cycles.
- **Constraint:** Abstract data parsing/sorting into standalone utility functions outside the component. You must use `useCallback` for UI handlers passed down as props to prevent render cascades.

### I. Mobile Responsive Data Displays
- **Rule:** Never force dense, multi-column data tables (like lab results) to squeeze horizontally on mobile viewports.
- **Constraint:** You MUST use a Table-to-Card responsive pattern. Use `hidden md:block` for the desktop `<table />` and `block md:hidden` for vertically stacked cards, allowing text to wrap naturally (`whitespace-normal break-words`) without truncation.

### J. AI Token Optimization & State Persistence
- **Rule:** AI summaries and deep conversational histories must not be kept purely in volatile state.
- **Constraint:** High-value AI generations (like SBAR summaries or Specialist chats) must be saved to Firestore. Always check for an existing Firestore record before triggering a fresh Gemini API call on component mount.

## 2. Environment Variables Constraints
All environment variables configured for Aegis Health AI:
- `VITE_FIREBASE_API_KEY`: Firebase connection bindings.
- `GEMINI_API_KEY`: Server-side model key.
- `VITE_RECAPTCHA_SITE_KEY`: Frontend Anti-bot tracker config.
