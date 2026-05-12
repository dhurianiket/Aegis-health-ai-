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

## 🚫 Gemini API Rules — NEVER Violate

### API Key
- ALWAYS pass apiKey explicitly: new GoogleGenAI({ apiKey })
- NEVER use new GoogleGenAI({}) with empty object
- NEVER use new GoogleGenAI() with no arguments
- apiKey must ALWAYS come from import.meta.env.VITE_GEMINI_API_KEY

### geminiClient.ts
- This is the SINGLE source of truth for Gemini initialization
- NEVER initialize GoogleGenAI outside of geminiClient.ts
- ALL services must import getAI() from geminiClient.ts
- NEVER export GoogleGenAI, Type, or streamGenerate from geminiClient.ts

### Refactoring Rules
- If editing geminiClient.ts breaks other files, say so IMMEDIATELY
- NEVER leave the codebase in a broken/non-compiling state
- Always run quality control after touching AI service files
- If a change affects more than 1 file, list ALL affected files first

### Model Rules
- Current model: gemini-2.0-flash — do NOT change without asking
- generationConfig is now called config in newer SDK versions
- NEVER use deprecated isAvailable property

### Safe Edit Checklist
Before editing any AI file, confirm:
1. Will this break other imports? 
2. Does getAI() still work after this change?
3. Does the build still compile?

## CRITICAL ARCHITECTURE RULES (Updated May 2026)

1. **AI Model Standardization:** Strictly use `gemini-2.0-flash` for all 8 AI services. Do not use experimental, lite, or pro models unless explicitly approved.
2. **No Firebase Storage:** The PDF upload pipeline bypasses Firebase Storage completely to avoid billing blocks. Files are read as Base64, sent directly to Gemini, and the extracted data is saved to Firestore.
3. **Data Isolation:** All queries must use server-side filtering (`where('profileId', '==', profileId)`). No client-side filtering. Public shares use `users/{userId}/shares/{shareId}`.
4. **Strict UI Safety:** All Firestore reads must use optional chaining and nullish coalescing (e.g., `activeProfile?.chronicConditions ?? []`). Stream generation must be wrapped in `try/catch` blocks to prevent UI crashes.
5. **Branding:** 
   - **Aegis AI / Aegis Health Intelligence:** The App / Platform / Clinical Engine.
   - **Aura AI:** The Chatbot Assistant ONLY.







