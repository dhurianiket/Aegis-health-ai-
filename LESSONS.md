# LESSONS — Graphify AI Reflection & Dead-End Memory

This file logs verified implementation rules, past bugs, and dead-ends to prevent repeat mistakes across AI sessions.

## Invariants & Verified Patterns
1. **No Next.js / No Firebase App Hosting**: Strictly React + Vite + TypeScript + Firebase Client / Functions.
2. **Gemini Interceptor Mandatory**: All Gemini AI calls MUST use `geminiClient.ts` for model normalization & 503 fallback.
3. **Recharts Envelope Rule**: Recharts MUST be wrapped in strict `h-[300px]` height envelopes.
4. **Real-time Firestore Sync**: Clinical data MUST use real-time `onSnapshot` listeners (`useClinicalContext.ts`).
5. **Lockfile Synchronization**: Always run `npm install` when updating `package.json` dependencies.
