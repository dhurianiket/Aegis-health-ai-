import { GoogleGenAI, Type } from "@google/genai";
import { Specialty } from "../../types/medical";

const getAI = () => new GoogleGenAI({ 
  apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY 
});

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
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.slice(jsonStart, jsonEnd + 1);
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error in specialist analysis (${specialty}):`, error);
    return null;
  }
}

export async function generateClinicalSummary(
  patientData: any,
  labHistory: any[],
  documents: any[],
  medications: any[],
  insights: any[]
) {
  const prompt = `
    You are a world-class PhD-level Oncologist, Hematologist, and Internal Medicine 
    Physician with 30+ years of clinical and research experience at top institutions 
    like Johns Hopkins, Mayo Clinic, and MD Anderson Cancer Center.

    I am going to share my medical history with you, including lab results, documents, medications, and specialist insights. Analyze them with the 
    depth, precision, and clinical rigor of a senior attending physician reviewing 
    a complex patient case.

    Please provide a FULL and DETAILED breakdown structured exactly as follows:

    ---

    ## 1. 🧬 PATIENT OVERVIEW
    - Summarize the overall picture of my health context in 3–5 sentences
    - State clearly: Is this report largely NORMAL, CONCERNING, or REQUIRES URGENT ATTENTION?

    ---

    ## 2. ✅ WHAT IS GOING RIGHT (Healthy Markers)
    - List every value that is within a healthy range
    - For each, explain WHY it is good and what it means for my body
    - Highlight any values that are not just "normal" but OPTIMAL

    ---

    ## 3. ⚠️ WHAT IS WRONG OR BORDERLINE (Abnormal/Flagged Markers & Issues)
    - List every value that is outside normal range or borderline abnormal
    - For each abnormal value:
      a. State the value vs. the expected normal range
      b. Explain what this deviation means physiologically
      c. List possible causes (dietary, lifestyle, disease-related, medication-related)
      d. Rate the urgency: LOW / MODERATE / HIGH / CRITICAL
      e. Suggest what follow-up test or action is recommended

    ---

    ## 4. 🫀 ORGAN SYSTEM HEALTH REPORT
    Evaluate each organ/system based on the available markers:
    - 🩸 Blood & Bone Marrow (CBC: RBC, WBC, Hemoglobin, Hematocrit, Platelets, Differentials)
    - 🫀 Cardiovascular Health (Lipid Panel: LDL, HDL, Total Cholesterol, Triglycerides)
    - 🍬 Metabolic & Blood Sugar Status (Glucose, HbA1c, Insulin if available)
    - 🟤 Liver Health (ALT, AST, ALP, Bilirubin, Albumin, Total Protein)
    - 🔵 Kidney Health (Creatinine, BUN, eGFR, Uric Acid)
    - 🦴 Thyroid Function (TSH, T3, T4 if available)
    - ⚡ Electrolytes & Minerals (Sodium, Potassium, Chloride)
    - 🛡️ Immune System (WBC Differential)
    - 💊 Nutritional Status (Iron, Ferritin, Vitamin B12, Vitamin D)
    - 🔬 Inflammation Markers (CRP, ESR, LDH)

    For each system: Give a rating — 🟢 HEALTHY / 🟡 BORDERLINE / 🔴 ABNORMAL

    ---

    ## 5. 🔗 PATTERN ANALYSIS & CORRELATIONS
    - Identify if multiple abnormal values together suggest a SPECIFIC condition or syndrome
    - Connect the dots across systems — what story do these results tell TOGETHER?
    - How do current medications and specialist insights correlate with the lab results?

    ---

    ## 6. 🎯 RISK ASSESSMENT
    - Based on this report, list any DISEASES or CONDITIONS I may be at elevated risk for
    - Include: cardiovascular disease, diabetes, anemia, liver disease, kidney disease, etc.
    - Be direct and honest — do not sugarcoat concerns.

    ---

    ## 7. 🥗 PERSONALIZED LIFESTYLE & NUTRITION RECOMMENDATIONS
    Based on my specific results:
    - What foods should I EAT MORE of?
    - What foods or habits should I AVOID?
    - What supplements should I consider (with dosage if possible)?
    - What lifestyle changes (exercise, sleep, stress) are most important for MY results?

    ---

    ## 8. 🏥 NEXT STEPS & FOLLOW-UP PLAN
    - Which values need to be re-tested, and HOW SOON?
    - What specialist should I see (Hematologist, Endocrinologist, Cardiologist, etc.)?
    - What additional tests or imaging would you recommend?
    - Is there anything that needs IMMEDIATE medical attention?

    ---

    ## 9. 📊 SUMMARY TABLE
    Create a table summarizing tests, my value, normal range, status, and urgency.

    ---

    IMPORTANT INSTRUCTIONS:
    - Be thorough, not vague. Give specific numbers and medical reasoning.
    - Do NOT say "consult your doctor" as the only answer — give me real clinical insight.
    - Use plain language where possible, but do not oversimplify medical facts.
    - Treat me as an intelligent adult who wants the full truth about my health.
    - Format output using Markdown.

    PATIENT PROFILE:
    ${JSON.stringify(patientData)}

    LAB HISTORY (Chronological, descending if possible, or grouped):
    ${JSON.stringify(labHistory)}
    
    MEDICAL TIMELINE/DOCUMENTS:
    ${JSON.stringify(documents.map((d: any) => ({
      type: d.type,
      date: d.date,
      hospitalName: d.hospitalName,
      doctorName: d.doctorName,
      extractedFindings: d.extractedData?.findings || ""
    })))}
    
    CURRENT POSSBLE MEDICATIONS:
    ${JSON.stringify(medications)}
    
    SPECIALIST AI INSIGHTS:
    ${JSON.stringify(insights)}
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Error generating clinical summary:", JSON.stringify(error));
    
    // Check if it's a rate limit / quota error
    const isQuotaError = 
      error?.status === 429 || 
      error?.code === 429 || 
      error?.status === 'RESOURCE_EXHAUSTED' ||
      (error?.message && (error.message.includes('429') || error.message.includes('quota')));
      
    if (isQuotaError) {
      return `## ⚠️ AI Service Quota Exceeded\n\nThe AI generation service has reached its rate limit or quota. \n\n*Error: RESOURCE_EXHAUSTED (429)*\n\nUnfortunately, standard AI analysis cannot be performed right now. Please try again later or check your API plan limits.`;
    }
    
    return `Failed to generate report. Please try again. ${error?.message ? `(${error.message})` : ''}`;
  }
}

export async function extractMedicalReports(filesData: {base64Data: string, mimeType: string}[]) {
  const prompt = `
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
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.slice(jsonStart, jsonEnd + 1);
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error extracting report:", error);
    return null;
  }
}
