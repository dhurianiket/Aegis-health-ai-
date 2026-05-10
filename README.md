# Clinical Health Telemetry System

A modern, high-density clinical dashboard for personal health management. This application allows users to upload medical reports, extract key data using Gemini 1.5 Flash, and visualize health trends over time.

## 🚀 Features

- **AI-Powered Extraction**: Seamlessly parse PDF and image-based medical reports.
- **Smart Alerts**: Automatic detection of critical lab values and drug-drug interactions.
- **SBAR Summarization**: Generate professional Situation-Background-Assessment-Recommendation summaries for physicians.
- **Advanced Visualization**: High-fidelity charts using Recharts for metabolic and cardiovascular trends.
- **Offline Support**: Robust offline indicator and cached data access.
- **Privacy First**: Secure handling of medical telemetry via Firebase and local processing.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Motion (formerly Framer Motion)
- **Backend**: Firebase Firestore, Firebase Authentication
- **AI**: Google Gemini 1.5 Flash (via @google/genai)
- **Visuals**: Lucide React, Recharts
- **Testing**: Vitest, React Testing Library

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
