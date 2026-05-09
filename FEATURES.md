# Product Features

## 1. Medical Report Upload & AI Processing
Users can upload laboratory results (PDF, PNG, JPG). The system uses Gemini 1.5 Flash to:
- Identify the report type and source.
- Extract individual biomarkers (e.g., Blood Glucose, HbA1c, LDL).
- Normalize units and reference ranges.
- Identify prescribed medications.

## 2. Integrated Clinical Alerts
The `AlertsContext` provides real-time notifications for:
- **Critical Values**: Values significantly outside normal ranges.
- **Drug Interactions**: Detection of potential interactions based on active medications (e.g., Warfarin + Ibuprofen).
- **Duplicate Therapy**: Identifying multiple medications from the same class.

## 3. Specialist Lounge
An AI-driven analysis tool where users can consult virtual specialists:
- **Cardiologist**: Focuses on lipid panels and blood pressure.
- **Endocrinologist**: Focuses on metabolic markers and thyroid function.
- **Internal Medicine**: General clinical synthesis.

## 4. Professional Export (SBAR)
Generates clinical-grade summaries formatted for healthcare providers:
- **Situation**: Current status and recent changes.
- **Background**: Medical history and active medications.
- **Assessment**: Data interpretation.
- **Recommendation**: Suggested clinical actions.

## 5. Offline Connectivity
The application monitors network status and provides visual feedback when the connection is lost. It prioritizes local data access to ensure availability in clinical settings.

## 6. High-Density Visualization
- **Correlation Matrix**: View relationships between different health markers.
- **Comparative Analysis**: Compare current metrics against historical baselines.
- **Trend Sparklines**: Quick visual summaries of recent changes.
