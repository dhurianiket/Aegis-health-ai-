import { GoogleGenAI, Type } from "@google/genai";
import { Specialty } from "../../types/medical";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SPECIALIST_PROMPTS: Record<string, string> = {
  [Specialty.INTERNAL_MEDICINE]: "You are a world-class Internal Medicine specialist. Your role is to provide a holistic overview of the patient's health, identifying general patterns and coordinating between other specialists. Focus on systemic health, prevention, and unexplained symptoms.",
  [Specialty.CARDIOLOGY]: "You are a senior Cardiologist. Focus on cardiovascular risk, lipids, blood pressure, inflammatory markers like HS-CRP, and heart-related family history. Interpret trends in cholesterol and blood pressure.",
  [Specialty.ENDOCRINOLOGY]: "You are an expert Endocrinologist. Focus on metabolic health, HbA1c, fasting glucose, thyroid function (TSH, T4), Vitamin D, and weight trends. Identify patterns of insulin resistance or hormonal imbalances.",
  [Specialty.HEMATOLOGY]: "You are a specialist Hematologist. Analyze Complete Blood Count (CBC), iron studies (Ferritin, TIBC), Vitamin B12, and folate. Look for signs of anemia, clotting issues, or immune response patterns.",
  [Specialty.NEPHROLOGY]: "You are a Nephrology expert. Focus on kidney health markers: Creatinine, eGFR, Uric Acid, Urine Protein, and electrolytes. Monitor kidney function stability over time.",
  [Specialty.HEPATOLOGY]: "You are a Hepatology specialist. Analyze Liver Function Tests (LFTs): ALT, AST, Bilirubin, Albumin, and GGT. Identify markers of fatty liver, inflammation, or synthetic function issues.",
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
`;

export async function analyzeWithSpecialist(
  specialty: Specialty,
  patientData: any,
  recentReports: any[],
  sensitivity: string = 'Standard'
) {
  const prompt = `
    ${SPECIALIST_PROMPTS[specialty] || "You are a medical specialist."}
    ${SAFETY_GUARDRAIL(sensitivity)}

    PATIENT PROFILE:
    ${JSON.stringify(patientData)}

    RECENT LAB RESULTS & DOCUMENTS:
    ${JSON.stringify(recentReports)}

    Please provide your expert analysis following this JSON structure:
    - observations: (list of findings)
    - abnormalities: (list of concerning markers)
    - patterns: (longitudinal trends detected)
    - recommended_questions: (array of objects with { question: string, reason_for_asking: string } focusing on important clinical inquiries)
    - suggested_next_steps: (further tests or monitoring)
    - lifestyle_advice: (wellness-focused suggestions)
    - urgency_level: (Emergency | High | Moderate | Non-urgent | Normal)
    - confidence_score: (number 0-100)
    - summary: (A plain English summary for the patient)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
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
                  reason_for_asking: { type: Type.STRING }
                }
              } 
            },
            suggested_next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            lifestyle_advice: { type: Type.ARRAY, items: { type: Type.STRING } },
            urgency_level: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
          },
          required: ["summary", "urgency_level", "confidence_score"],
        },
      },
    });

    let text = response.text || "{}";
    if (text.startsWith("\`\`\`json")) { text = text.replace(/^\`\`\`json\n/, "").replace(/\n\`\`\`$/, ""); }
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error in specialist analysis (${specialty}):`, error);
    return null;
  }
}

export async function extractMedicalReports(filesData: {base64Data: string, mimeType: string}[]) {
  const prompt = `
    Analyze these medical reports (images or PDFs). 
    Extract the following information from this medical report (image or PDF).
    Extract the information into a single structured JSON format:
    - document_type: (lab_report, prescription, consultation_note, etc. - choose the most prominent or general type)
    - date: (YYYY-MM-DD - the date of the report)
    - hospital_name: (if available)
    - doctor_name: (if available)
    - lab_values: (array of objects with {date, marker, value, unit, reference_range, status})
      * date should be the actual date of the report this lab value comes from (YYYY-MM-DD)
      * status must be one of: normal, abnormal, critical (all lowercase)
    - findings: (summary of text results or doctor's impressions)
    - medications: (array of {date, name, dosage, frequency, purpose})
      * date should be the actual date of the report this medication comes from (YYYY-MM-DD)
    - follow_up_date: (if mentioned)
    
    If any value is unclear, mark it as null.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        { text: prompt },
        ...filesData.map(f => ({ inlineData: { data: f.base64Data, mimeType: f.mimeType } }))
      ],
      config: {
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
                }
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
                }
              } 
            },
            follow_up_date: { type: Type.STRING }
          }
        }
      },
    });

    let text = response.text || "{}";
    if (text.startsWith("\`\`\`json")) { text = text.replace(/^\`\`\`json\n/, "").replace(/\n\`\`\`$/, ""); }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error extracting report:", error);
    return null;
  }
}
