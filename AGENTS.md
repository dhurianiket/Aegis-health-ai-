# Project-Specific Rules

1. Environment Management:
   - NEVER delete or overwrite the `.env` file under any circumstances in the standard workflow.
   - If the `.env` file is missing, recreate it using `.env.example` as a template, but you MUST request the necessary values from the user before finalizing the file content.

2. Firebase Authentication:
   - NEVER modify src/lib/firebase/config.ts unless explicitly asked by the user.
   - NEVER modify src/context/AuthContext.tsx unless explicitly asked by the user.

3. Known Issues:
   - `auth/invalid-continue-uri` is an AI Studio preview-only error. Never attempt to fix it.
