# Project-Specific Rules

1. Environment Management:
   - NEVER delete or overwrite the `.env` file under any circumstances in the standard workflow.
   - If the `.env` file is missing, recreate it using `.env.example` as a template, but you MUST request the necessary values from the user before finalizing the file content.

2. Firebase Authentication:
   - NEVER modify src/lib/firebase/config.ts unless explicitly asked by the user.
   - NEVER modify src/context/AuthContext.tsx unless explicitly asked by the user.

3. Known Issues:
   - `auth/invalid-continue-uri` is an AI Studio preview-only error. Never attempt to fix it.

# Agent Rules — AegisAI

## 🚫 NEVER Touch These Files
- src/lib/firebase/config.ts
- .env / .env.local / any environment variable files
- vite.config.ts
- index.html

## ✅ Firebase Config Rules
- NEVER add experimentalForceLongPolling
- NEVER add persistenceSettings or custom persistence
- NEVER change how initializeApp() is called
- NEVER add extra imports to firebase/config.ts
- The only exports must be: app, auth, db, storage, googleProvider

## ✅ AI / Gemini API Rules
- NEVER hardcode API keys in any file
- ALWAYS use import.meta.env.VITE_GEMINI_API_KEY
- NEVER change the Gemini model name without asking the user first

## ✅ General Rules
- Fix only the file mentioned in the user's prompt
- Do NOT refactor unrelated files while fixing a bug
- Do NOT add dependencies without asking first
- Always preserve existing exports when editing a file
- If unsure, ask before editing core config files
