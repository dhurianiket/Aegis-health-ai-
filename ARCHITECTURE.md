# Architecture

## Technical Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Motion (framer-motion)
- **Backend/Database**: Firebase (Firestore)
- **Authentication**: Firebase Auth (Google Sign-In)
- **AI Integration**: Gemini API (`@google/genai`)

## Auth and Role Model
- Users authenticate via Firebase. Their `uid` is used across all Firestore interactions.
- The `users/{uid}` document contains the definitive user `role` (e.g., `"admin"`).
- Admin-only flows must explicitly verify this role before executing privileged reads or operations.

## Admin Analytics Data Flow
- The Admin dashboard utilizes `collectionGroup` queries to aggregate usage analytics across the platform.
- These queries execute only **after** verifying the user's admin role explicitly.
- Non-admin users are shown a gracefully restricted UI rather than causing unhandled promise rejections.

## Usage Tracking Behavior
- Background usage tracking mechanisms (like global stats increments) are designed to be explicitly best-effort.
- Write operations that fail due to standard Security Rules strictly catch and silence their errors, ensuring end-user flows (like ChatCoach interactions) are never interrupted or broken by analytics tracking.

## Frontend Stability Rules
- **React Hook Ordering**: Hooks (`useState`, `useEffect`, etc.) must be declared at the highest scope. Conditional early-return statements must never appear before all hook declarations are complete to prevent React minified errors.
- Chart components utilize `ResizeObserver` with debounce patterns to guarantee performance and stability.

## Hosting and Auth Popup Behavior
- Firebase Hosting provisions response headers configured via `firebase.json`.
- Missing or misconfigured headers (like Cross-Origin-Opener-Policy) can negatively impact OAuth providers such as the Google Auth popup.
- Header changes must be officially redeployed to production infrastructure before taking effect on deployed domains.

## Data Structure (Firestore)
```
users/
  {uid}/
    documents/
      {docId}/    ← lab report documents
    profile/      ← user profile data
    medications/  ← medication records
    usage/        ← per-user tracking analytics
```

## Security
- Firestore rules validate all payloads, restrict read paths to `request.auth.uid`, and provision administrative views based on `isAdmin()`.
- Access and environment variables cleanly safeguard API keys.
