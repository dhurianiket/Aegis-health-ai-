# Aegis Health AI

<div align="center">

[![Live Website](https://img.shields.io/badge/Live%20Production%20Site-aegishealthai.co.in-0ea5e9?style=for-the-badge&logo=google-chrome&logoColor=white)](https://aegishealthai.co.in)
[![Status](https://img.shields.io/badge/Status-Online%2024%2F7-10b981?style=for-the-badge)](https://aegishealthai.co.in)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-GenAI%20App%20Builder%20%26%20Vertex%20AI-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://console.cloud.google.com/gen-app-builder/engines?project=aegis-health-app-90697)
[![NVIDIA Inception](https://img.shields.io/badge/NVIDIA%20Inception-Member-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://www.nvidia.com/en-us/startups/)

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/dhurianiket/Aegis-health-ai-)
[![GitGuardian](https://img.shields.io/badge/GitGuardian-Protected-000000.svg)](https://www.gitguardian.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

**Next-Generation Clinical-Grade Health Intelligence, Autonomous Multi-Agent Reasoning & Grounded Medical Retrieval**

[🌐 Access Live Application: aegishealthai.co.in](https://aegishealthai.co.in)

</div>

---

## 🌟 Overview

**Aegis Health AI** is an enterprise-grade, clinical-grade health management and diagnostic copilot application. Backed by Google Cloud's **GenAI App Builder (Discovery Engine)**, **Vertex AI Agent Runtime**, and multi-model consensus combining **Google Gemini 3.8 Flash**, **Gemini 4 Argon**, **Anthropic Claude** (via AWS Bedrock Mantle), and **NVIDIA NIM** (NVIDIA Inception member), Aegis enables patients, families, and physicians to centralize complex medical records, parse longitudinal lab biomarker trajectories, search verified institutional protocols, and triage emergency risks in real time.

---

## 🚀 Key Features

### 1. 🔍 Spotlight Clinical Protocol Search (`Cmd+K` / `Ctrl+K`)
- **Instant Institutional Retrieval**: Search across 6 verified medical research guidelines and drug formularies indexed in Google Cloud Discovery Engine.
- **Raycast-Style Spotlight UI**: Rapid keyboard navigation (`Cmd+K` on Mac, `Ctrl+K` on Windows) with category filtering (*Cardiology*, *Metabolic*, *Pharmacology*, *Safety & Triage*, *Clinical Communication*).
- **Expandable Reader Drawer**: Inspect reference cutoffs, clinical directives, and Cloud Storage URIs (`gs://.../protocols/`) with one click.
- **Direct Bridge to Aura AI**: Send any protocol inquiry straight into the AI Health Coach with a single tap.

### 2. 🧠 Autonomous Multi-Agent Clinical Intelligence
- **Chief Medical Research Coordinator (`research_agent`)**: Orchestrates specialist agents to deliver grounded, progressive clinical summaries.
- **Protocol Specialist (`protocol_specialist`)**: Queries Google Cloud Discovery Engine for institutional ranges (e.g. Fasting Glucose 70–99 mg/dL, Resting HR 60–82 bpm, HRV RMSSD > 35 ms).
- **Literature Researcher (`literature_researcher`)**: Searches peer-reviewed biomedical literature (PubMed, Europe PMC, arXiv) for mechanisms of action and clinical trials.
- **Clinical Safety Officer (`safety_officer`)**: Evaluates patient biomarkers and drug regimens, immediately triggering emergency triage alarms for critical values (e.g., Hypoglycemia < 54 mg/dL, Tachycardia > 130 bpm, Warfarin + Aspirin bleeding hazards).

### 3. 📋 3-Tier SBAR Progressive Disclosure
- **Tier 1 (Triage Radar)**: Immediate glanceable safety badges (`NORMAL`, `WARNING`, `CRITICAL`) with 1-sentence bottom-line answers.
- **Tier 2 (SBAR Summary)**: Structured Situation, Background, Assessment, and Recommendation reports with one-click copyable handoffs.
- **Tier 3 (Grounded Evidence)**: Expandable citations with match scores and direct references to Google Cloud Storage documents.

### 4. 🔒 Enterprise Data Privacy & Security
- **Per-User Isolation**: User medical data is sandboxed strictly under `users/{userId}/` with Firebase Security Rules.
- **Zero Secrets Committed**: Verified pre-commit and pre-push enforcement using GitGuardian (`ggshield`).
- **Edge Routing**: Gemini AI inference is proxied through a hardened Cloudflare Edge Worker (`https://api.aegishealthai.co.in`) with JWT RS256 verification and zero client-side key leakage.

---

## 🛠️ Tech Stack & Cloud Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend SPA** | React 19, Vite 6, TypeScript, Tailwind CSS 4, Motion, Lucide Icons |
| **Zero-Layout-Shift** | `@chenglou/pretext` canvas measurement, `VirtualizedChatList` |
| **Search & Grounding** | Google Cloud GenAI App Builder / Discovery Engine (`aegis-clinical-search`) |
| **Agent Serverless** | Google Cloud Vertex AI Agent Runtime (`us-east1`) |
| **AI Models & Consensus** | Google Gemini 3.8 Flash, Gemini 4 Argon, Anthropic Claude (AWS Bedrock Mantle), NVIDIA NIM |
| **Edge Gateway** | Cloudflare Workers (`aegishealthai-edge`), Google JWKs verification |
| **Database & Auth** | Firebase Firestore (Real-time snapshots), Firebase Authentication (Google OAuth) |
| **Storage** | Google Cloud Storage (`gs://aegis-health-app-90697.firebasestorage.app`) |
| **Hosting & CI/CD** | Firebase Hosting (`aegishealthai.co.in`), GitHub Actions |

---

## 📦 Getting Started

### Prerequisites
- **Node.js**: `v20.0.0` or higher (Node 22 recommended)
- **NPM**: `v10` or higher
- **Python**: `3.12+` (for local Google ADK agent development)
- **uv**: `0.5+`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dhurianiket/Aegis-health-ai-.git
   cd Aegis-health-ai-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** (`.env`):
   ```env
   VITE_FIREBASE_API_KEY=[CONFIGURED_VIA_SECRET_STORE]
   VITE_FIREBASE_AUTH_DOMAIN=aegis-health-app-90697.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=aegis-health-app-90697
   VITE_FIREBASE_STORAGE_BUCKET=aegis-health-app-90697.firebasestorage.app
   VITE_EDGE_API_URL=https://api.aegishealthai.co.in
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser. Press `Ctrl+K` to launch the Clinical Protocol Search.

---

## 🧪 Testing & Quality Gates

Run the test suites:

```bash
# Frontend Unit & Integration Tests
npm test

# TypeScript Type Checking
npx tsc --noEmit

# Multi-Agent Python Tool Tests
cd agents/research-agent
pytest tests/unit/test_tools.py -v

# GitGuardian Security Scan
ggshield secret scan pre-commit
```

---

## 🌐 Live Deployment Links

- **Production Web Application**: [https://aegishealthai.co.in](https://aegishealthai.co.in)
- **Firebase Hosting Fallback**: [https://aegis-health-app-90697.web.app](https://aegis-health-app-90697.web.app)
- **Google Cloud Console Discovery Engine**: [Aegis Clinical Search](https://console.cloud.google.com/gen-app-builder/engines?project=aegis-health-app-90697)
- **Vertex AI Agent Engines**: [Research Agent Runtime](https://console.cloud.google.com/vertex-ai/agents/agent-engines/locations/us-east1/agent-engines/8500323294824628224?project=aegis-health-app-90697)

---

## 📄 Documentation

- [Features Overview](./FEATURES.md)
- [Architecture Details](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Knowledge Graph (Graphify)](./GRAPHIFY.md)
- [Current State Snapshot](./CURRENT_STATE.md)

---

<div align="center">
  <sub>Built with ❤️ by the Aegis Health AI Engineering Team. Powered by Google Cloud & Google DeepMind Agentic Systems.</sub>
</div>
