import { GoogleGenAI, Type } from "../../lib/geminiClient";
import {
  Specialty,
  MedicalDocument,
  LabResult,
  Medication,
  SpecialistInsight,
  UserProfile,
} from "../../types/medical";
import { CORE_SYSTEM_PROMPT, OUTPUT_FORMAT_JSON } from "./promptFramework";
import { safeJsonParse } from "../../utils/aiUtils";

const getAI = () => new GoogleGenAI({});

export interface SpecialistAnalysisResponse {
  observations: string[];
  abnormalities: string[];
  patterns: string[];
  recommended_questions: { question: string; reason_for_asking: string; }[];
  suggested_next_steps: string[];
  lifestyle_advice: string[];
  urgency_level: string;
  confidence_score: number;
  summary: string;
}

export interface ExtractedReportResponse {
  document_type: string;
  date: string;
  hospital_name: string | null;
  doctor_name: string | null;
  lab_values: {
    date: string;
    marker: string;
    value: string;
    unit: string;
    reference_range: string | null;
    status: string;
  }[];
  findings: string | null;
  medications: {
    date: string;
    name: string;
    dosage: string;
    frequency: string;
    purpose: string;
  }[];
  follow_up_date: string | null;
  url?: string;
  id?: string;
}

const SPECIALIST_PROMPTS: Record<string, string> = {
  [Specialty.INTERNAL_MEDICINE]: "You are a world-class Internal Medicine specialist.",
  [Specialty.CARDIOLOGY]: "You are a senior Cardiologist.",
  [Specialty.ENDOCRINOLOGY]: "You are an expert Endocrinologist.",
  [Specialty.HEMATOLOGY]: "You are a specialist Hematologist.",
  [Specialty.NEPHROLOGY]: "You are a Nephrology expert.",
  [Specialty.HEPATOLOGY]: "You are a Hepatology specialist.",
};

const SAFETY_GUARDRAIL = (sensitivity: string) => `
CRITICAL INSTRUCTIONS:
1. You are an AI MEDICAL INTELLIGENCE ASSISTANT, NOT a licensed doctor.
2. DO NOT provide definitive diagnoses.
3. ALWAYS indicate confidence level (0-100%).
4. SENSITIVITY THRESHOLD: ${sensitivity}.
5. DISCLAIMER: Output MUST contain "For informational purposes only. Not medical advice."
`;

export async function analyzeWithSpecialist(
  specialty: Specialty,
  patientData: UserProfile,
  recentReports: MedicalDocument[],
  sensitivity: string = "Standard",
): Promise<SpecialistAnalysisResponse | null> {
  try {
    const ai = getAI();
    if (!ai.isAvailable) throw new Error("API Key missing.");
    const prompt = `${CORE_SYSTEM_PROMPT}\n<task>${SPECIALIST_PROMPTS[specialty]}</task>\n${SAFETY_GUARDRAIL(sensitivity)}\n<input>${JSON.stringify(patientData)}\n${JSON.stringify(recentReports)}</input>\n${OUTPUT_FORMAT_JSON}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return safeJsonParse<SpecialistAnalysisResponse>(response.text || "{}", {
      observations: [], abnormalities: [], patterns: [],
      recommended_questions: [], suggested_next_steps: [],
      lifestyle_advice: [], urgency_level: "Normal",
      confidence_score: 0.5, summary: "Failed to generate analysis.",
    });
  } catch (error) {
    console.error(`Specialist analysis error (${specialty}):`, error);
    return null;
  }
}

export async function generateClinicalSummary(
  patientData: UserProfile,
  labHistory: LabResult[],
  documents: MedicalDocument[],
  medications: Medication[],
  insights: SpecialistInsight[],
): Promise<string> {
  try {
    const ai = getAI();
    if (!ai.isAvailable) throw new Error("API Key missing.");
    const prompt = `${CORE_SYSTEM_PROMPT}\nGenerate a patient-friendly health summary in JSON.\n<input>${JSON.stringify(patientData)}\n${JSON.stringify(labHistory)}\n${JSON.stringify(medications)}\n${JSON.stringify(insights)}</input>\n${OUTPUT_FORMAT_JSON}\nReturn JSON with: task_type, summary, key_findings, abnormal_items, urgent_flags, follow_up_questions, recommended_next_steps, safety_disclaimer`;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2048 },
    });
    const parsed = safeJsonParse<any>(response.text || "{}", {});
    return `## Health Summary\n${parsed.summary || "No summary."}\n\n### Key Findings\n${(parsed.key_findings || []).map((f: string) => `- ${f}`).join("\n")}\n\n### Abnormal Items\n${(parsed.abnormal_items || []).map((f: string) => `- ${f}`).join("\n")}\n\n### Recommended Next Steps\n${(parsed.recommended_next_steps || []).map((f: string) => `- ${f}`).join("\n")}\n\n---\n*For informational purposes only. Not medical advice.*`;
  } catch (error: any) {
    console.error("Clinical summary error:", error);
    return `Failed to generate summary. Please try again.\n\n*For informational purposes only. Not medical advice.*`;
  }
}

export async function extractMedicalReports(
  filesData: { base64Data: string; mimeType: string }[],
): Promise<ExtractedReportResponse | null> {
  try {
    const ai = getAI();
    if (!ai.isAvailable) throw new Error("API Key missing.");
    const { safeGeminiCall } = await import("./promptFramework");
    const prompt = `Extract medical report data into this exact JSON structure:
    {"document_type":"string","date":"YYYY-MM-DD","hospital_name":"string|null","doctor_name":"string|null","lab_values":[{"date":"YYYY-MM-DD","marker":"string","value":"string","unit":"string","reference_range":"string","status":"normal|abnormal|critical"}],"findings":"string","medications":[{"date":"YYYY-MM-DD","name":"string","dosage":"string","frequency":"string","purpose":"string"}],"follow_up_date":"YYYY-MM-DD|null"}
    Output ONLY valid JSON. No markdown.`;
    const response = await safeGeminiCall(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          ...filesData.map((f) => ({ inlineData: {  f.base64Data, mimeType: f.mimeType } })),
        ],
      }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json", maxOutputTokens: 8192 },
    }));
    const result = safeJsonParse<ExtractedReportResponse | null>(response.text || "{}", null);
    if (!result) throw new Error("AI returned empty response.");
    return result;
  } catch (error: any) {
    console.error("Report extraction error:", error);
    return {
      lab_values: [], document_type: "Unknown",
      date: new Date().toISOString(), url: "", id: "",
      hospital_name: null, doctor_name: null,
      findings: null, medications: [], follow_up_date: null,
    };
  }
}
