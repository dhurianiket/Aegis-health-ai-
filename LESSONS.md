# LESSONS — Graphify AI Reflection & Dead-End Memory

This file logs verified implementation rules, past bugs, and dead-ends to prevent repeat mistakes across AI sessions.

## Invariants & Verified Patterns
1. **Graphify Context Search**: Always consult `GRAPHIFY.md` first for codebase context, AST mapping, and component dependencies before modifying code. Run `npm run graphify` after structural changes.
2. **No Next.js / No Firebase App Hosting**: Strictly React + Vite + TypeScript + Firebase Client / Functions.
3. **Gemini Interceptor Mandatory**: All Gemini AI calls MUST use `geminiClient.ts` for model normalization & 503 fallback.
4. **Recharts Envelope Rule**: Recharts MUST be wrapped in strict `h-[300px]` height envelopes.
5. **Real-time Firestore Sync**: Clinical data MUST use real-time `onSnapshot` listeners (`useClinicalContext.ts`).
6. **Lockfile Synchronization**: Always run `npm install` when updating `package.json` dependencies.
