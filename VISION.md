# Aegis Health Intelligence - Product Vision

## 1. Product Vision Summary

Aegis Health Intelligence is a "Personal Medical Intelligence Bureau." It empowers patients by transforming fragmented, opaque medical records into a structured, longitudinal health narrative analyzed by a panel of specialized AI agents. It does not replace physicians but acts as a highly knowledgeable assistant that bridges the gap between raw data and patient understanding.

## 2. MVP Feature List (Day 30)

- **Smart Ingestion**: PDF/Image upload with structured extraction (Date, Type, Lab Values, Doctor Notes).
- **Consolidated Health Record**: A central repository for medications, allergies, and chronic conditions.
- **Health Snapshot Dashboard**: Summary of current status, 3 key flags, and 3 key improvements.
- **Specialist Panel (V1)**: 4 agents (Internal Med, Cardiology, Endocrinology, Hematology) providing initial insights.
- **Longitudinal Graphs**: Tracking common markers (HbA1c, Lipids, BP) over time.
- **Medication Intelligence**: Simple list view with safety checks for duplicates.
- **Safety Layer**: Clear emergency warnings and AI uncertainty indicators.

## 3. Advanced Features (V2 & V3)

- **V2**: Full sub-specialist expansion (Oncology, Hepatology, Nephrology).
- **V2**: Advanced Trend Analysis (Cross-marker correlations).
- **V2**: Personal Health Improvement Plans (Habit & Lab re-test cycles).
- **V3**: AI Health Coach chat with full record-grounding (RAG).
- **V3**: Digital Family History & Genetic Marker Integration.
- **V3**: Secure Export for Doctors with AI-generated "SBAR" summaries.

## 4. User Journey

1. **Onboarding**: Secure login + quick profile (History, Allergies).
2. **Data Ingestion**: User uploads a messy PDF lab report.
3. **AI Processing**: Aegis extracts values, flags abnormalities, and updates the timeline.
4. **Specialist Review**: The "Cardiology Agent" notices rising LDL; the "Endocrinology Agent" notes stable Glucose.
5. **Dashboard Update**: Health Score shifts; user sees "Cardiovascular Risk Improvement needed."
6. **Action**: User receives a "30-day health optimization plan" focused on fiber and re-testing.

## 5. Screen-by-Screen UX Plan

- **Dashboard**: "The Pulse" - Radar charts for organ systems + current "Flags".
- **Timeline**: "The Story" - Scrollable vertical history of every medical event.
- **Reports**: "The Vault" - Gallery of original documents + digitized twins.
- **Specialist Lounge**: "The Panel" - Tabbed interface where each specialist speaks.
- **Medications**: "The Rx Room" - Active meds + safety alerts + schedule.
- **Coach**: "The Clinic" - Chat interface for asking "Why is my creatinine high?".

## 6. App Architecture (Text Diagram)

```
[ Frontend (React/Vite) ]
      |
      |-- (Auth) --> Firebase Auth
      |
      |-- (Data) --> Firestore (Longitudinal Records)
      |
      |-- (Files) --> Gemini Multi-modal PDF/OCR
      |
      |-- (AI Analysis) --> Gemini Specialists (Chain of Thought)
      |
      |-- (Visualization) --> Recharts / D3 Component Layer
```

## 7. AI Pipeline Architecture

1. **Input**: PDF/Image/Text.
2. **Extraction (Gemini 3 Flash)**: Multimodal extraction to JSON schema.
3. **Verification**: User confirms critical values (e.g., Creatinine 4.5 vs 0.45).
4. **Context Assembly**: Fetch last 12 months of related markers + chronic conditions.
5. **Agent Inference**: Parallel calls to specialized prompts.
6. **Synthesis**: Aggregate specialist views into "Actionable Insights" + "Emergency Flags".
7. **Grounding**: All claims must cite a specific data point from the "Vault".

## 8. Health Score Framework

- **Metabolic (30%)**: HbA1c, Fasting Glucose, BMI, Triglycerides.
- **Cardiovascular (20%)**: BP, LDL, HDL, HS-CRP.
- **Organ Function (30%)**: GFR/Creatinine (Kidney), ALT/AST (Liver).
- **Vital Force (20%)**: CBC, Vitamin D/B12, Sleep/Stress (if data exists).

## 9. Safety & Legal Guardrails

- **Disclaimers**: Present on every analysis output.
- **Urgency Matrix**: If marker > X or symptom = Y, immediate "Consult Physician" banner.
- **No Treatment Change**: Aegis never tells a user to stop or start a prescription; only to "Discuss with Doctor."
- **Confidence Scoring**: If data is sparse, confidence is "Low - Insufficient data."

## 10. Development Roadmap

- **7-day Prototype**: Basic upload, Gemini OCR, and Dashboard.
- **30-day MVP**: Full specialist panel, Med tracking, and Health Scores.
- **90-day Production**: HIPAA-aligned data lifecycle, encryption at rest configuration, and Advanced Coach.
