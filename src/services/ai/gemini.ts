import { getAI } from "../../lib/geminiClient";
import { Type } from "../../lib/geminiUtils";
import {
  Specialty,
  MedicalDocument,
  LabResult,
  Medication,
  SpecialistInsight,
  UserProfile,
} from "../../types/medical";
import { CORE_SYSTEM_PROMPT, OUTPUT_FORMAT_JSON, safeGeminiCall } from "./promptFramework";
import { safeJsonParse } from "../../utils/aiUtils";
import { auth } from "../../lib/firebase/config";
import { trackUsage } from "../usageService";

// Removed old getAI class wrapper and now using pre-initialized getAI from lib/geminiClient
// Function is already available via import

export interface SpecialistAnalysisResponse {
  analyzed_markers: {
    marker: string;
    reason: string;
  }[];
  key_concern: string;
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
    const geminiConfig = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analyzed_markers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  marker: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            },
            key_concern: { type: Type.STRING },
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
    };
    
    let response;
    try {
      response = await ai.models.generateContent({
        ...geminiConfig,
        model: "gemini-3.1-pro-preview",
        contents: geminiConfig.contents as any
      });
    } catch (proError: any) {
      console.warn("Gemini Pro failed, falling back to Flash:", proError.message || proError);
      response = await ai.models.generateContent({
        ...geminiConfig,
        model: "gemini-3-flash-preview",
        contents: geminiConfig.contents as any
      });
    }

    try {
      if (response?.usageMetadata) {
         const userId = auth?.currentUser?.uid;
         if (userId) {
            await trackUsage(userId, {
               promptTokens: response.usageMetadata.promptTokenCount,
               responseTokens: response.usageMetadata.candidatesTokenCount,
               totalTokens: response.usageMetadata.totalTokenCount,
               feature: 'specialist'
            });
         }
      }
    } catch (e) {
      console.error("Usage track err:", e);
    }

    const text = response.text || "{}";
    return safeJsonParse<SpecialistAnalysisResponse>(text, {
      analyzed_markers: [],
      key_concern: "No specific concerns identified.",
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
  const ai = getAI();
  
  // Sort labs by date (newest first)
  const sortedLabs = [...labHistory].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const age = patientData.dob
    ? Math.floor((new Date().getTime() - new Date(patientData.dob).getTime()) / 3.15576e10)
    : "Unknown";
    
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const prompt = `${CORE_SYSTEM_PROMPT}

<task>
Generate a professional, physician-ready SBAR (Situation, Background, Assessment, Recommendation) clinical summary of the patient's complete medical profile.
This summary will be used for handovers to new specialists or doctors.
</task>

<output_format_rules>
- OUTPUT MUST BE PLAIN TEXT ONLY.
- NO MARKDOWN (Do NOT use ** for bold, do NOT use # for headings).
- NO CODE BLOCKS.
- Use standard line breaks and spaces for formatting.
- Section headers should be in ALL CAPS.
- The tone must be clinical, precise, and professional.
- Start EXACTLY with the intro paragraph provided in the example.
</output_format_rules>

<intro_paragraph>
Here is the SBAR (Situation, Background, Assessment, Recommendation) summary of your complete medical profile.
You can keep this on your phone or print it out. It is the perfect format to hand to any new doctor, physical therapist, or specialist so they can understand your entire complex case in under 60 seconds.
</intro_paragraph>

<structure_example>
SBAR CLINICAL SUMMARY
Patient: ${patientData.fullName || patientData.name} | Age/Sex: ${age}/${patientData.gender || 'Unknown'} | Date: ${today}

S - SITUATION
[2-3 sentences: current chief complaint, duration, key recent lab findings, current treatment plan]

B - BACKGROUND (CRITICAL MEDICAL ALERTS)
• [Grouped by category: Hematology, Medications, Radiology, Urology, etc.]
• Use bullet points with sub-bullets using *
• Always include current daily medications
• Always include all past diagnoses
• Always include radiology/imaging findings

A - ASSESSMENT
• [One bullet per system assessed]
• Include autoimmune clearance if labs show normal HLA-B27, RF, Anti-CCP, ESR, CRP
• Include kidney function if Creatinine present
• 🚨 Strict Contraindications: list as sub-bullets using * — include reason for each contraindication

R - RECOMMENDATION / PLAN
1. Numbered list
2. Each item is actionable and specific
3. Include medications with full names and doses
4. Include lifestyle modifications
5. Include follow-up instructions with doctor name if available
</structure_example>

<specific_contraindication_logic>
You MUST infer and explicitly list these contraindications if relevant:
- If on Rivaroxaban: NO NSAIDs, NO ESI (Epidural Steroid Injection), NO Spinal Manipulation.
- If AT-III Deficiency (Antithrombin III Deficiency) is noted: flag ESI as high risk.
- If on any anticoagulants (e.g., Rivaroxaban, Warfarin, Eliquis): flag chiropractic risk/spinal manipulation risk.
</specific_contraindication_logic>

<data_input>
PATIENT PROFILE:
${JSON.stringify({ ...patientData, age, today })}

ALL MEDICATIONS:
${JSON.stringify(medications)}

ALL DIAGNOSES:
${JSON.stringify(patientData.chronicConditions)}

LAB RESULTS (Sorted newest first, include units and reference range status):
${JSON.stringify(sortedLabs.map(l => ({
  date: l.date,
  marker: l.markerName,
  value: l.value,
  unit: l.unit,
  range: l.referenceRange,
  status: l.status
})))}

DOCUMENT SUMMARIES:
${JSON.stringify(documents.map(d => ({ type: d.type, date: d.date, findings: d.extractedData?.findings })))}
</data_input>

Generate the summary strictly following the plain text format above.
`;

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 8192,
          temperature: 0.1,
        },
      });
    } catch (proError: any) {
      console.warn("Gemini Pro failed, falling back to Flash:", proError.message || proError);
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 8192,
          temperature: 0.1,
        },
      });
    }

    try {
      if (response?.usageMetadata) {
         const userId = auth?.currentUser?.uid;
         if (userId) {
            await trackUsage(userId, {
               promptTokens: response.usageMetadata.promptTokenCount,
               responseTokens: response.usageMetadata.candidatesTokenCount,
               totalTokens: response.usageMetadata.totalTokenCount,
               feature: 'summary'
            });
         }
      }
    } catch (e) {
      console.error("Usage track err:", e);
    }

    return response.text || "Failed to generate summary.";
  } catch (error: any) {
    console.error("Error generating clinical summary:", JSON.stringify(error));

    const isQuotaError =
      error?.status === 429 ||
      error?.code === 429 ||
      error?.status === "RESOURCE_EXHAUSTED" ||
      (error?.message &&
        (error.message.includes("429") || error.message.includes("quota")));

    if (isQuotaError) {
      return "AI Service Quota Exceeded. The AI service has reached its usage limit for now. Please wait a few minutes and try again. Your data is perfectly safe.";
    }

    return `Failed to generate report. Please try again. ${error?.message ? `(${error.message})` : ""}`;
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
  url?: string;
  id?: string;
}

export async function extractMedicalReports(
  filesData: { base64Data: string; mimeType: string }[],
): Promise<ExtractedReportResponse | null> {
    const prompt = `
    Extract the following information from this medical report (image or PDF).
    Extract the information into a single structured JSON format.
    
    CRITICAL: 
    - Output ONLY valid JSON.
    - Be concise. 
    - If the source text has long repeating phrases or redundant boilerplate (like "Spectrophotometry" repeated 100 times), ignore the repetitions and just extract the core value.
    - Even if the document quality is poor, extract whatever data is visible. Return partial results rather than failing. For any field you cannot read, use null.
  `;

    const ai = getAI();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      if (import.meta.env.DEV) console.log("[Extraction] Starting report extraction for", filesData.length, "files");

      const response = await safeGeminiCall(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
        config: {
          systemInstruction: CORE_SYSTEM_PROMPT,
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              document_type: { type: Type.STRING },
              date: { type: Type.STRING },
              hospital_name: { type: Type.STRING },
              doctor_name: { type: Type.STRING },
              lab_values: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    marker: { type: Type.STRING },
                    value: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    reference_range: { type: Type.STRING },
                    status: { type: Type.STRING }
                  },
                  required: ["marker", "value"]
                }
              },
              findings: { type: Type.STRING },
              medications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    name: { type: Type.STRING },
                    dosage: { type: Type.STRING },
                    frequency: { type: Type.STRING },
                    purpose: { type: Type.STRING }
                  },
                  required: ["name"]
                }
              },
              follow_up_date: { type: Type.STRING }
            },
            required: ["document_type", "date", "lab_values"]
          }
        },
      }), 3, "pdf_extraction");

      clearTimeout(timeoutId);

      const text = response.text || "{}";
      console.log("RAW_GEMINI:", JSON.stringify(response));
      console.log("[Extraction] Gemini raw response:", text);
      const result = safeJsonParse<ExtractedReportResponse | null>(text, null);
      
      if (result && Array.isArray(result.lab_values)) {
        result.lab_values = result.lab_values.map((lab: any) => ({
          ...lab,
          unit: lab.unit || "",
          reference_range: lab.reference_range || "",
          status: lab.status || "unknown"
        }));
      }

      const labs = result?.lab_values || [];
      console.log("NORMALIZED_LABS:", labs);

      console.log("[Extraction] Parsed result success:", !!result);
      
      // Relaxed validation: only reject if null or empty JSON
      if (!result || (Object.keys(result).length === 0) || !result.lab_values) {
          console.warn("[Extraction] AI returned an empty or invalid response result, but we'll try to provide a skeleton.");
          return {
            lab_values: [],
            document_type: "Unknown",
            date: new Date().toISOString(),
            url: "", id: "",
            hospital_name: null, doctor_name: null,
            findings: "Extraction resulted in no data.",
            medications: [], follow_up_date: null
          };
      }
      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError" || 
          error.message?.includes("timed out") ||
          error.message?.includes("AI analysis")) {
        return {
          lab_values: [],
          document_type: "Unknown",
          date: new Date().toISOString(),
          url: "", id: "",
          hospital_name: null, doctor_name: null,
          findings: "Upload timed out. Please try again.",
          medications: [], follow_up_date: null
        };
      }
      console.error("Error extracting report:", error);
      return {
        lab_values: [],
        document_type: "Unknown",
        date: new Date().toISOString(),
        url: "",
        id: "",
        hospital_name: null,
        doctor_name: null,
        findings: null,
        medications: [],
        follow_up_date: null
      };
    }
}