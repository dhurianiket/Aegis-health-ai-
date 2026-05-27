# Aegis Health AI — Agent Context

## Project Overview
Aegis is a multimodal, enterprise-grade personal health Progressive Web App (PWA). It allows users to upload medical reports, track health trends, and consult AI-powered specialists using text, voice, and real-time internet grounding.

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Hosting: Firebase Hosting → aegishealthai.co.in (proxied via Cloudflare)
- Database: Firebase Firestore
- Auth: Firebase Google Sign-In
- Anti-Bot: reCAPTCHA v3 (`VITE_RECAPTCHA_SITE_KEY`)
- AI: Google Gemini API (@google/genai) via Cloudflare AI Gateway
- Multimodal: MediaRecorder API (Voice), Google Grounding (Search), Streaming API.

## AI Strategy & Major Invariants
Aegis uses a strictly enforced hybrid Gemini strategy:
- Gemini 3 Flash Preview: default model for high-volume, structured tasks.
- Gemini 3.1 Pro Preview: reserved for clinician-facing, long-context, trust-critical synthesis.
- Medical-Grade Parameters: `temperature` for all AI queries must remain at `0.1` or `0.2`.

## Operational Rules
0. MANDATORY CONTEXT: Before executing any codebase edits, you MUST read and obey the rules and architectural invariants defined in `AGENTS.md`, `ARCHITECTURE.md`, and `CURRENT_STATE.md`.
1. Conflict Resolution: If a request violates core architecture or model routing invariants, flag the violation and refuse execution without explicit user override.
2. State-Driven Auth: Authentication routing must be state-driven via React Context. No imperative router push in auth handlers is allowed. Use standard `.firebaseapp.com` `authDomain` (do NOT override with `aegishealthai.co.in`). Implement `signInWithPopup` with strict `signInWithRedirect` fallback.
3. Performance & A11y: Preserve all React.lazy Suspense boundaries, `<main>` semantic landmarks, and ARIA labels.
4. AI Capabilities: Preserve the `generateContentStream` logic and `MediaRecorder` voice integrations.
5. UI & State Persistence: Strictly adhere to the Mobile Responsive Data Displays (Table-to-Card) pattern for dense datasets and enforce AI state persistence via Firestore to minimize token waste.
6. Cycle Tracking & Reproductive Health: Preserve `users/{userId}/...` ownership structure. Do not introduce top-level sensitive collections. Do not silently write reproductive health data. Do not remove Specialist Lounge portal/mobile scroll protections. Update docs whenever architectural behavior changes.

---

## Session: May 27, 2026 (Security Page & Policy Overhaul)
### Work Done:
- **Overhauled security page (`/public/security.html`)**: Rewrote technical, high-stress words (like "zero-trust baseline", "defensive whitelists") into everyday, soothing protective concepts (isolated private folders for each family, proxy shielded connections, selective biomarker extraction).
- **Embedded DPDP Act 2023 Principles**: Outlined opt-in consent controls, necessary-only parameter minimization, and solid auditing.
- **Improved data deletion instructions**: Created simple self-service guide steps inside the product, paired with manual support email instructions featuring turnaround times and clear email subjects.
- **Synchronized geographic lines and warnings**: Refined geographic footers with "Dombivli West, Maharashtra, India" and added explicit safety disclaimers.

### Decisions Made:
- Substituted intimidating jargon with warm terms to build trust and clear communication for Indian families.
- Structured concrete deletion choices to ensure full user-side transparency and DPDP compliance.

### Pending for Human Review:
- Verification of manually typed email coordinates in the deletions list.

## Session: May 27, 2026 (How It Works & General Revisions)
### Work Done:
- **Overhauled how-it-works page (`/public/how-it-works.html`)**: Simplified the 4-step walkthrough into human-centric actions, compressed the listing of supported laboratory tests with brief explanations, and condensed and rewrote the 8-question FAQ content into calm, plain words.
- **Improved boundaries and disclaimers**: Enhanced safety definitions by explicitly indicating the educational translator boundaries under a clear warning, and aligned the office coordinate string to Dombivli West, Maharashtra, India.

### Decisions Made:
- Kept the design clean and utilized existing layout frameworks (`.detailed-steps`, `.supported-card`, and `.faq-item`) to maintain perfect layout compatibility.
- Streamlined FAQ replies specifically to appeal to Indian family members looking for quick reassurance.

### Pending for Human Review:
- General verification of step descriptions and FAQ answers.

## Session: May 27, 2026 (Content & About Revisions)
### Work Done:
- **Overhauled About Page (`/public/about.html`)**: Rewrote the Personal Story and Mission statements in a highly authentic, personal, and simplified tone. Replaced complex technical jargon with human language and highlighted Aniket's unique telecommunication, digital marketing, and film engineering roots.
- **Added Connect / Living CV Grid**: Constructed a beautiful 3-column features grid displaying Aniket's social and portfolio coordinates (LinkedIn, GitHub, and Living CV website).
- **Overhauled static blog guides (`/public/blog-hba1c.html` & `/public/blog-cbc.html`)**: Transformed lab and blood panel metrics (RBC, Hemoglobin, WBC, Platelets, Hematocrit) into supportive, educational metaphors and simplified physician consult questions.
- **Harmonized branding metadata**: Refined geographic citations and medical disclaimers uniformly.

### Decisions Made:
- Emphasized patient-first safety: backed all translations with clear disclaimers prioritizing standard clinician-patient partnerships.
- Utilized pre-constructed CSS classes (`.features-grid` and `.feature-card`) to design an aesthetic links interface without bloating the shared stylesheet.

### Pending for Human Review:
- Physician double-check on simplified Socratic doctor questions.
- Hand-testing of external profile links in `about.html`.

### Next Recommended Steps:
- Execute static deployment scripts to sync the entire `/public/` tree to production.

## Session: May 27, 2026 (Design Phase)
