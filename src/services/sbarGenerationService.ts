import {
  UserProfile,
} from "../types/medical";
import { getAI } from "../lib/geminiClient";
import { getPatientContext, formatContextForPrompt } from "./ai/contextService";

export const generateSBAR = async (
  userId: string,
  profile: UserProfile,
): Promise<string> => {
  const ai = getAI();
  if (!ai) throw new Error("Aura AI is currently offline.");
  
  const patientData = await getPatientContext(userId, profile);

  const age = profile.dob
    ? Math.floor((new Date().getTime() - new Date(profile.dob).getTime()) / 3.15576e10)
    : "Unknown";
    
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const prompt = `
Generate a professional, physician-ready SBAR clinical summary.

<output_rules>
- OUTPUT MUST BE PLAIN TEXT ONLY.
- NO MARKDOWN (no bolding, no headers).
- Start with the intro paragraph for the patient.
</output_rules>

INTRO PARAGRAPH:
Here is the SBAR (Situation, Background, Assessment, Recommendation) summary of your complete medical profile.
You can keep this on your phone or print it out. It is the perfect format to hand to any new doctor, physical therapist, or specialist so they can understand your entire complex case in under 60 seconds.

SBAR CLINICAL SUMMARY
Patient: ${profile.fullName || profile.name} | Age/Sex: ${age}/${profile.gender || 'Unknown'} | Date: ${today}

S - SITUATION
[Summary]

B - BACKGROUND (CRITICAL MEDICAL ALERTS)
• Categories (Hematology, Medications, Radiology, etc.)
• Current meds, past diagnoses, imaging.

A - ASSESSMENT
• System assessment
• Contraindications: Identify any severe risks (e.g. NO NSAIDs/ESI/Spinal Manipulation for Rivaroxaban; flag ESI risk for AT-III Deficiency; flag chiropractic risk for anticoagulants).

R - RECOMMENDATION / PLAN
1. Actionable list
2. Meds with names/doses
3. Follow-up instructions

CLINICAL CONTEXT:
${formatContextForPrompt(patientData)}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0,
        maxOutputTokens: 2048,
      },
    });

    return response.text || "Failed to generate summary.";
  } catch (error) {
    console.error("Gemini SBAR Generation failed:", error);
    throw new Error("Unable to generate summary. Please try again.");
  }
};
