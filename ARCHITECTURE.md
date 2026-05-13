# Architecture

## Technical Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Motion (framer-motion)
- **Backend/Database**: Firebase (Firestore)
- **Authentication**: Firebase Auth (Google Sign-In)
- **AI Integration**: Gemini API (`@google/genai`)

## Directory Structure

- `src/components`: UI components organized by feature (Dashboard, Upload, Timeline, Specialists, Medications)
- `src/context`: React Context providers for global state (AuthContext, ProfileContext)
- `src/services/ai`: AI integration logic (Gemini API calls for extracting data and generating insights)
- `src/lib/firebase`: Firebase configuration and Firestore helper functions
- `src/types`: Global TypeScript definitions

## Data Flow

1. **Authentication**: Users authenticate via Firebase. Their `uid` is used across all Firestore interactions.
2. **Profile Management**: A user can manage multiple profiles (e.g., themselves, a child). A global `ProfileContext` tracks the `activeProfile`.
3. **Data Ingestion**:
   - Files are uploaded and processed client-side.
   - The contents are structured and sent to Gemini for extraction.
   - Extracted data (documents, labs, medications) is saved to Firestore under the current user and active profile.
4. **Data Visualization & Analysis**:
   - The UI components fetch their respective data from Firestore based on the active profile.
   - The `SpecialistLounge` orchestrates analysis by fetching a cross-section of data and sending it to Gemini for insight generation.

## Data Ingestion & File Handling

**PDF Ingestion & Storage:**
PDF ingestion utilizes Firebase Storage for secure, per-user file retention. All user documents are uploaded to the path `users/{uid}/documents/{fileName}`. The app generates download URLs for future user access.

**Workflow & Access Rules:**
- The PDF upload and download feature is a core part of the live user workflow and must remain in place.
- Uploads are strictly handled through Firebase Storage (do not use Base64-to-Gemini-only ingestion).
- Each authenticated user only sees and accesses their own uploaded PDFs.
- File access is strictly controlled by Firebase Security Rules ensuring `request.auth.uid == uid`.

## Security

- Firestore rules validate all payloads.
- Environment variables securely handle API keys.
- Authentication dictates reading and writing limits.
