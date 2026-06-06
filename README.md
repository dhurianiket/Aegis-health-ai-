<div align="center">
  <img src="https://raw.githubusercontent.com/dhurianiket/aegis-health-app-90697/main/public/logo-placeholder.png" alt="Aegis Health AI Logo" width="120" />

  # Aegis Health AI

  <p align="center">
    <strong>A modern, clinical-grade health management system powered by Gemini AI.</strong>
  </p>

  [![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)](https://github.com/dhurianiket/aegis-health-app-90697/releases)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-19.0.1-61dafb.svg?logo=react)](https://react.dev)
  [![Firebase](https://img.shields.io/badge/Firebase-12.13.0-FFCA28.svg?logo=firebase)](https://firebase.google.com/)
  [![Google Gemini](https://img.shields.io/badge/Gemini-1.5_Flash-8E75B2.svg?logo=google)](https://deepmind.google/technologies/gemini/)
  [![Deploy Status](https://github.com/dhurianiket/aegis-health-app-90697/actions/workflows/deploy.yml/badge.svg)](https://github.com/dhurianiket/aegis-health-app-90697/actions)

  <h3>
    <a href="https://aegis-health-app-90697.web.app">Live Demo</a>
    <span> | </span>
    <a href="#-features">Features</a>
    <span> | </span>
    <a href="#-tech-stack">Tech Stack</a>
    <span> | </span>
    <a href="#-getting-started">Getting Started</a>
    <span> | </span>
    <a href="#-architecture--documentation">Architecture</a>
  </h3>
</div>

---

## 📖 Overview

Aegis Health Intelligence is your **"Personal Medical Intelligence Bureau."** It bridges the gap between raw laboratory data and patient understanding without replacing physicians.

By leveraging **Gemini 1.5 Flash** for high-speed extraction and **Gemini Pro** for nuanced conversational context, Aegis transforms fragmented, opaque medical records (PDFs/Images) into a structured, longitudinal health narrative. It provides intelligent insights, detects drug interactions via the RxNorm dataset, and prepares you for your next physician consult.

---

## ✨ Features

- 🔐 **Secure Health Vault**: Enterprise-grade health data storage with strict Firebase per-user isolation.
- 📄 **AI-Powered Lab Extraction**: Instantly digitize and structure physical or PDF lab reports via Gemini 1.5 Flash.
- 📈 **Clinical Trend Engine**: Automatically visualize metabolic and physiological trends across multiple lab tests over time.
- 🧑‍⚕️ **Virtual Specialist Lounge**: Consult specialized AI agents (Cardiologist, Endocrinologist, Internal Medicine) grounded strictly in your personal health timeline.
- 💊 **Medication Intelligence**: Real-time detection of drug-to-drug interactions and duplicate therapies leveraging the U.S. NLM RxNorm APIs.
- 📑 **Smart SBAR Summaries**: Automatically generate "Situation, Background, Assessment, Recommendation" summaries optimized for your physician.
- 👨‍👩‍👧 **Family Hub**: Manage multiple distinct health profiles (children, spouse, parents) under a single secure account.
- 📱 **Mobile-First Glassmorphism UI**: Beautiful, accessible, and highly responsive components powered by Tailwind CSS 4.0 and Framer Motion.

---

## 💻 Tech Stack

### Frontend & UI
- **React 19** + **Vite**
- **TypeScript**
- **Tailwind CSS 4.0** + **Framer Motion**
- **Recharts** (High-Density Medical Visualizations)

### Backend & Infrastructure
- **Firebase Auth** (Google OAuth)
- **Firestore** (Strictly isolated subcollections)
- **Firebase Storage** (Encrypted PDF/Image hosting)
- **GitHub Actions** (CI/CD Pipeline)

### AI & Integrations
- **Google Gemini API** (`@google/genai`)
  - *Gemini 1.5 Flash*: Structured JSON telemetry parsing.
  - *Gemini Pro*: Deep conversational multi-agent multi-specialty chats.
- **U.S. National Library of Medicine (NLM)** (RxNorm for Drug Interactions)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- A Firebase Project (with Auth, Firestore, and Storage enabled)
- A Google Gemini API Key

### 1. Clone the repository
```bash
git clone https://github.com/dhurianiket/aegis-health-app-90697.git
cd aegis-health-app-90697
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the template to create your `.env` file:
```bash
cp .env.example .env.local
```
Fill in the values in `.env.local`:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server/AI key - MUST remain secret
GEMINI_API_KEY=your_gemini_api_key
```
> ⚠️ **Security Note:** Variables prefixed with `VITE_` are public. Never expose `GEMINI_API_KEY` or admin tokens to the client.

### 4. Start the Development Server
```bash
npm run dev &
```
The application will boot up at `http://localhost:5173`.

---

## 🧪 Testing

Aegis enforces rigorous testing and static analysis to ensure clinical-grade reliability.

```bash
# Run TypeScript compilation check
npm run lint

# Run the Vitest unit testing suite
npm test
```

---

## 📚 Architecture & Documentation

We maintain detailed documentation regarding the architectural boundaries, system rules, and agent workflows. All contributors and autonomous agents must strictly follow these.

| Document | Purpose |
| :--- | :--- |
| [**VISION.md**](./VISION.md) | High-level roadmap, goals, and intended user journey. |
| [**FEATURES.md**](./FEATURES.md) | In-depth breakdown of current platform capabilities. |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | System blueprint, invariants, and security configurations. |
| [**AGENTS.md**](./AGENTS.md) | Strict operational rules and context instructions for AI coding agents. |
| [**SECRETS_MANAGEMENT.md**](./SECRETS_MANAGEMENT.md) | Guidelines for safe handling of API keys and environment variables. |
| [**CURRENT_STATE.md**](./CURRENT_STATE.md) | Changelog and recent stabilization milestones. |

---

## 🤝 Contributing

We welcome contributions! Please follow our established workflows:
1. Ensure your changes align with the strict architectural invariants in [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`AGENTS.md`](./AGENTS.md).
2. Write unit tests for new services (Vitest).
3. Ensure no linting errors (`npm run lint`).
4. Submit a Pull Request targeting the `main` branch with a clear description of the impact.

---

## 🛡️ License & Legal Disclaimer

This project is licensed under the [MIT License](LICENSE).

> **Medical Disclaimer:** Aegis Health AI is a patient-generated informational tool. It **does not constitute a medical record, diagnosis, or clinical assessment**. All insights and flagged values must be verified against original laboratory reports and discussed with a licensed healthcare professional.
