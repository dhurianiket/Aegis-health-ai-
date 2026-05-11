# Aegis Health AI [![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](https://github.com/dhurianiket/aegis-health-app-90697)

A modern, clinical-grade health management system. Aegis Health AI enables users to centralize medical records, extract intelligence from lab reports using Gemini 1.5 Flash, and monitor long-term clinical narratives.

**Live URL**: [https://aegis-health-app-90697.web.app](https://aegis-health-app-90697.web.app)

## 🚀 Features

- **Google Auth & Secure Vault**: Protected health data storage with Firebase per-user isolation.
- **AI-Powered Lab Extraction**: Digitalize PDF/Image reports automatically using Gemini 1.5 Flash.
- **Health Vault (Timeline)**: A chronological clinical narrative of all your medical documents and findings.
- **Clinical Trend Engine**: Automatically compute metabolic and physiological trends across multiple lab tests.
- **Smart SBAR Analytics**: Generate clinical summaries for physician consults.
- **Family Hub**: Manage multiple profiles (children, spouse, parents) from a single account.
- **CI/CD Integrated**: Automated deployments with GitHub Actions and Firebase Hosting.

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4.0 + Motion
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google OAuth)
- **Storage**: Firebase Storage (PDF/Image hosting)
- **Intelligence**: Google Gemini 1.5 Flash (@google/genai)
- **CI/CD**: GitHub Actions + Firebase Hosting

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🧪 Testing

Run unit tests with:

```bash
npm test
```

## 📄 Documentation

- [Features Overview](./FEATURES.md)
- [Development Guide](./DEVELOPMENT.md)
- [Architecture Details](./ARCHITECTURE.md)
