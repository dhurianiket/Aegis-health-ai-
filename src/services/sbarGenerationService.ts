import {
  LabResult,
  Medication,
  UserProfile,
  SBARSummary,
} from "../types/medical";
import { getAI } from "../lib/geminiClient";
import { CORE_SYSTEM_PROMPT, OUTPUT_FORMAT_JSON } from "./ai/promptFramework";
import { safeJsonParse } from "../utils/aiUtils";

export const generateSBAR = async (
  profile: UserProfile,
  labs: any[],
  meds: any[],
): Promise<string> => {
  const ai = getAI();
  
  const sortedLabs = [...labs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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
• Contraindications: NO NSAIDs/ESI/Spinal Manipulation for Rivaroxaban; flag ESI risk for AT-III Deficiency; flag chiropractic risk for anticoagulants.

R - RECOMMENDATION / PLAN
1. Actionable list
2. Meds with names/doses
3. Follow-up instructions

DATA:
Profile: ${JSON.stringify({ ...profile, age })}
Medications: ${JSON.stringify(meds)}
Labs: ${JSON.stringify(sortedLabs)}
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
