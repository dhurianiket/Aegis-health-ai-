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
  recommended_questions: {
    question: string;
    reason_for_asking: string;
  }[];
  suggested_next_steps: string[];
  lifestyle_advice: string[];
  urgency_level: string;
  confidence_score: number;
  summary: string;
}

const SPECIALIST_PROMPTS: Record<string, string> = {
  [Specialty.INTERNAL_MEDICINE]:
    "You are a world-class Internal Medicine specialist. Your role is to provide a holistic overview of the patient's health, identifying general patterns and coordinating between other specialists. Focus on systemic health, prevention, and unexplained symptoms.",
  [Specialty.CARDIOLOGY]:
    "You are a senior Cardiologist. Focus on cardiovascular risk, lipids, blood pressure, inflammatory markers like HS-CRP, and heart-related family history. Interpret trends in cholesterol and blood pressure.",
  [Specialty.ENDOCRINOLOGY]:
    "You are an expert Endocrinologist. Focus on metabolic health, HbA1c, fasting glucose, thyroid function (TSH, T4), Vitamin D, and weight trends. Identify patterns of insulin resistance or hormonal imbalances.",
  [Specialty.HEMATOLOGY]:
    "You are a specialist Hematologist. Analyze Complete Blood Count (CBC), iron studies (Ferritin, TIBC), Vitamin B12, and folate. Look for signs of anemia, clotting issues, or immune response patterns.",
  [Specialty.NEPHROLOGY]:
    "You are a Nephrology expert. Focus on kidney health markers: Creatinine, eGFR, Uric Acid, Urine Protein, and electrolytes. Monitor kidney function stability over time.",
  [Specialty.HEPATOLOGY]:
    "You are a Hepatology specialist. Analyze Liver Function Tests (LFTs): ALT, AST, Bilirubin, Albumin, and GGT. Identify markers of fatty liver, inflammation, or synthetic function issues.",
};

const SAFETY_GUARDRAIL = (sensitivity: string) => `
CRITICAL INSTRUCTIONS:
1. You are an AI MEDICAL INTELLIGENCE ASSISTANT, NOT a licensed doctor.
2. DO NOT provide definitive diagnoses. Use phrases like "Patterns suggest...", "Possible causes include...", "Consider discussing X with your doctor."
3. ALWAYS indicate confidence level (0-100%).
4. IF specific markers are critically abnormal, FLAG them with an urgency level (Normal, Non-urgent, Moderate, High, Emergency).
5. NEVER suggest changing prescription medication.
6. CITE the markers or reports you used for your observations.
7. SENSITIVITY THRESHOLD: ${sensitivity}.
   - If Conservative: Only flag severe, potentially life-threatening or highly abnormal values.
   - If Standard: Flag standard out-of-range lab values and clear abnormalities.
   - If High: Flag even minor deviations from optimal (not just 'normal') ranges, and highlight any potential emerging risks.
8. DISCLAIMER: Your output MUST contain the disclaimer "For informational purposes only. Not medical advice."
`;

export async function analyzeWithSpecialist(
  specialty: Specialty,
  patientData: UserProfile,
  recentReports: MedicalDocument[],
  sensitivity: string = "Standard",
): Promise<SpecialistAnalysisResponse | null> {
  const prompt = `${CORE_SYSTEM_PROMPT}

<task>
${SPECIALIST_PROMPTS[specialty] || "You are a medical specialist."}
Analyze the provided telemetry and generate structured specialist observations.
</task>

<audience>
Clinician/Patient
</audience>

${SAFETY_GUARDRAIL(sensitivity)}

<input>
PATIENT PROFILE:
${JSON.stringify(patientData)}

RECENT LAB RESULTS & DOCUMENTS:
${JSON.stringify(recentReports)}
</input>

${OUTPUT_FORMAT_JSON}
`;

  try {
    const ai = getAI();
    if (!ai.isAvailable) throw new Error("Specialist analysis unavailable: API Key missing.");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            observations: { type: Type.ARRAY, items: { type: Type.STRING } },
            abnormalities: { type: Type.ARRAY, items: { type: Type.STRING } },
            patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommended_questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  reason_for_asking: { type: Type.STRING },
                },
              },
            },
            suggested_next_steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            lifestyle_advice: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            urgency_level: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
          },
          required: ["summary", "urgency_level", "confidence_score"],
        },
      },
    });

    const text = response.text || "{}";
    return safeJsonParse<SpecialistAnalysisResponse>(text, {
      observations: [],
      abnormalities: [],
      patterns: [],
      recommended_questions: [],
      suggested_next_steps: [],
      lifestyle_advice: [],
      urgency_level: "Normal",
      confidence_score: 0.5,
      summary: "Failed to generate specialist analysis.",
    } as SpecialistAnalysisResponse);
  } catch (error) {
    console.error(`Error in specialist analysis (${specialty}):`, error);
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
  const prompt = `${CORE_SYSTEM_PROMPT}

<task>
Explain the provided health summary in simple language for a patient with no medical background.
Compile all laboratory history, medications, documents, and specialist insights into a cohesive overview.
Use reassuring but accurate language.
Do not minimize urgent findings.
Do not overstate certainty.
</task>

<audience>
Patient
</audience>

<reading_level>
Grade 6 to 8
</reading_level>

<input>
PATIENT PROFILE:
${JSON.stringify(patientData)}

LAB HISTORY:
${JSON.stringify(labHistory)}

MEDICAL DOCUMENTS:
${JSON.stringify(
  documents.map((d: MedicalDocument) => ({
    type: d.type,
    date: d.date,
    extractedFindings: d.extractedData?.findings || "",
  })),
)}

MEDICATIONS:
${JSON.stringify(medications)}

SPECIALIST AI INSIGHTS:
${JSON.stringify(insights)}
</input>

${OUTPUT_FORMAT_JSON}
Return valid JSON with exactly these keys:
- task_type (string)
- summary (string, short overview)
- key_findings (array of strings, simple explanation of healthy and abnormal items)
- abnormal_items (array of strings, any flagged or concerning telemetry)
- urgent_flags (array of strings, critical items requiring immediate attention)
- follow_up_questions (array of strings, questions patient should ask their doctor)
- recommended_next_steps (array of strings, actionable advice)
- safety_disclaimer (string, reminding patient to consult a doctor)
`;

  try {
    const ai = getAI();
    if (!ai.isAvailable) throw new Error("Clinical summary unavailable: API Key missing.");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
      },
    });

    const text = response.text || "{}";
    const parsed = safeJsonParse<any>(text, {});

    // Construct the markdown string from the JSON to maintain compatibility with the UI
    return `## Health Summary
${parsed.summary || "No summary provided."}

### Key Findings
${(parsed.key_findings || []).map((f: string) => `- ${f}`).join("\n") || "None noted."}

### Abnormal Items
${(parsed.abnormal_items || []).map((f: string) => `- ${f}`).join("\n") || "None noted."}

${parsed.urgent_flags && parsed.urgent_flags.length > 0 ? `### ⚠️ Urgent Flags\n${parsed.urgent_flags.map((f: string) => `- ${f}`).join("\n")}` : ""}

### Recommended Next Steps
${(parsed.recommended_next_steps || []).map((f: string) => `- ${f}`).join("\n") || "Consult your provider."}

### Questions to Ask Your Doctor
${(parsed.follow_up_questions || []).map((f: string) => `- ${f}`).join("\n") || "None."}

---
*For informational purposes only. Not medical advice.*
*${parsed.safety_disclaimer || "Aegis AI Health provides informational summaries, not medical advice. Consult your doctor."}*
`;
  } catch (error: any) {
    console.error("Error generating clinical summary:", JSON.stringify(error));

    const isQuotaError =
      error?.status === 429 ||
      error?.code === 429 ||
      error?.status === "RESOURCE_EXHAUSTED" ||
      (error?.message &&
        (error.message.includes("429") || error.message.includes("quota")));

    if (isQuotaError) {
      return `## ⚠️ AI Service Quota Exceeded\n\nThe AI generation service has reached its rate limit or quota. \n\n*Error: RESOURCE_EXHAUSTED (429)*\n\nUnfortunately, standard AI analysis cannot be performed right now. Please try again later.\n\n*For informational purposes only. Not medical advice.*`;
    }

    return `Failed to generate report. Please try again. ${error?.message ? `(${error.message})` : ""}\n\n*For informational purposes only. Not medical advice.*`;
  }
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
}

export async function extractMedicalReports(
  filesData: { base64Data: string; mimeType: string }[],
): Promise<ExtractedReportResponse | null> {
  const prompt = `
    Extract the following information from this medical report (image or PDF).
    Extract the information into a single structured JSON format:
    {
      "document_type": "lab_report|prescription|consultation_note|...",
      "date": "YYYY-MM-DD",
      "hospital_name": "string or null",
      "doctor_name": "string or null",
      "lab_values": [
        {
          "date": "YYYY-MM-DD",
          "marker": "string",
          "value": "string or number",
          "unit": "string",
          "reference_range": "string",
          "status": "normal|abnormal|critical"
        }
      ],
      "findings": "string summary",
      "medications": [
        {
          "date": "YYYY-MM-DD",
          "name": "string",
          "dosage": "string",
          "frequency": "string",
          "purpose": "string"
        }
      ],
      "follow_up_date": "YYYY-MM-DD or null"
    }
    
    CRITICAL: 
    - Output ONLY valid JSON containing the structure above. No markdown, no explanations.
    - Be concise. 
    - If the source text has long repeating phrases or redundant boilerplate (like "Spectrophotometry" repeated 100 times), ignore the repetitions and just extract the core value.
    - If any value is unclear, mark it as null.
  `;

  try {
    const ai = getAI();
    if (!ai.isAvailable) throw new Error("Report extraction unavailable: API Key missing.");

    const { safeGeminiCall, CORE_SYSTEM_PROMPT } = await import("./promptFramework");

    console.log("[Extraction] Starting report extraction for", filesData.length, "files");
    const response = await safeGeminiCall(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...filesData.map((f) => {
              console.log("[Extraction] File details:", f.mimeType, "Base64 length:", f.base64Data.length);
              return {
                inlineData: { data: f.base64Data, mimeType: f.mimeType },
              };
            }),
          ],
        },
      ],
      generationConfig: {
        systemInstruction: CORE_SYSTEM_PROMPT,
        temperature: 0.1,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    }));

    const text = response.text || "{}";
    console.log("[Extraction] Gemini raw response length:", text.length);
    const result = safeJsonParse<ExtractedReportResponse | null>(text, null);
    console.log("[Extraction] Parsed result success:", !!result);
    if (!result) {
        throw new Error("AI returned an invalid or empty response.");
    }
    return result;
  } catch (error: any) {
    console.error("Error extracting report:", error);
    if (error?.message?.includes("xhr error") || error?.message?.includes("Rpc failed")) {
      throw new Error("File too large or connection timed out. Please try a smaller file (under 4MB).");
    }
    throw new Error(error?.message || "Failed to extract medical report");
  }
}
