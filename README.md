# Aegis Health AI [![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)](https://github.com/dhurianiket/aegis-health-app-90697)

A modern, clinical-grade health management system. Aegis Health AI enables users to centralize medical records, extract intelligence from lab reports using Gemini 1.5 Flash, and monitor long-term clinical narratives. It empowers patients by transforming fragmented, opaque medical records into a structured, longitudinal health narrative analyzed by a panel of specialized AI agents.

**Live URL**: [https://aegis-health-app-90697.web.app](https://aegis-health-app-90697.web.app)

## 🚀 Vision

Aegis Health Intelligence is a "Personal Medical Intelligence Bureau." It acts as a highly knowledgeable assistant that bridges the gap between raw data and patient understanding without replacing physicians.

## ✨ Key Features

- **Google Auth & Secure Vault**: Protected health data storage with Firebase per-user isolation.
- **AI-Powered Lab Extraction**: Digitalize PDF/Image reports automatically using Gemini 1.5 Flash.
- **Health Vault (Timeline)**: A chronological clinical narrative of all your medical documents and findings.
- **Clinical Trend Engine**: Automatically compute metabolic and physiological trends across multiple lab tests.
- **Smart SBAR Analytics**: Generate clinical summaries for physician consults.
- **Specialist Lounge**: An AI-driven analysis tool where users can consult virtual specialists (Cardiologist, Endocrinologist, Internal Medicine).
- **Integrated Clinical Alerts**: Real-time notifications for critical values, drug interactions, and duplicate therapy.
- **High-Density Visualization**: Correlation matrices, comparative analysis, and trend sparklines using Recharts.
- **Family Hub**: Manage multiple profiles (children, spouse, parents) from a single account.
- **CI/CD Integrated**: Automated deployments with GitHub Actions and Firebase Hosting.

## 🛠️ Tech Stack & Architecture

- **Frontend Core**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4.0 + Motion (Strict Semantic CSS Variable Theming)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google OAuth via project native domain)
- **Storage**: Firebase Storage (PDF/Image hosting)
- **AI Analytics Engine**: Google Gemini Developer Enterprise API Gateway (@google/genai)
  - *Gemini 1.5 Flash* is used exclusively for high-speed data extraction and structured telemetry parsing.
  - *Gemini Pro* handles conversational depth and virtual multi-specialty polyclinic threads.
- **Medical Intelligence Hub**: U.S. National Library of Medicine (NLM) RxNorm Datasets.
- **CI/CD**: GitHub Actions + Firebase Hosting

## 📦 Installation & Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/dhurianiket/aegis-health-app-90697.git
   cd aegis-health-app-90697
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and fill in the required keys:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=aegis-health-app-90697.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=aegis-health-app-90697
   VITE_FIREBASE_STORAGE_BUCKET=aegis-health-app-90697.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   GEMINI_API_KEY=your_gemini_api_key
   ```
   > **Note**: Variables prefixed with `VITE_` are publicly accessible in the client bundle. Server-only secrets like `GEMINI_API_KEY` must never be exposed or committed to version control.

4. **Start the development server**
   ```bash
   npm run dev &
   ```

## 🧪 Testing and Quality

Run unit tests and linting to ensure project stability:

```bash
# Run TypeScript static analysis
npm run lint

# Run Vitest testing suite
npm test
```

## 📄 Documentation

For deep dives into project internals, architectural guardrails, and ongoing agent workflows, please consult our documentation files:

- [Product Vision](./VISION.md)
- [Features Overview](./FEATURES.md)
- [Architecture Details & Invariants](./ARCHITECTURE.md)
- [Developer Guidelines](./DEVELOPMENT.md)
- [Current System State](./CURRENT_STATE.md)
- [Agent & CI Rules](./AGENTS.md)
- [Secrets Management](./SECRETS_MANAGEMENT.md)
