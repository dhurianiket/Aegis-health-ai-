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
