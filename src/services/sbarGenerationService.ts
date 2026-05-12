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
): Promise<SBARSummary> => {
  const ai = getAI();
  const activeMeds = meds.filter((m: any) => m.status === "active" || true);

  const age = profile.dob
    ? Math.floor(
        (new Date().getTime() - new Date(profile.dob).getTime()) / 3.15576e10,
      )
    : "Unknown";

  const prompt = `${CORE_SYSTEM_PROMPT}

<task>
Convert the provided health data into an SBAR handoff note for clinician review.
Keep it concise, factual, and clinically neutral.
Do not invent missing details.

Safety constraint: Assessment: restate observed facts in plain language only. Do not name diseases, suggest diagnoses, or recommend specific treatments. Recommendation: phrase as questions for the clinician to consider.
</task>

<audience>
Clinician
</audience>

<input>
PATIENT CONTEXT:
- Age: ${age}
- Gender: ${profile.gender || "Unknown"}
- Doctor Notes: ${profile.doctorNotes || "None"}

ACTIVE MEDICATIONS:
${activeMeds.map((m: any) => `- ${m.name} ${m.dose || m.dosage || ""} (${m.frequency || ""})`).join("\n") || "No active medications"}

RECENT LAB OBSERVATIONS:
${labs.map((l: any) => `- ${l.testName || l.markerName || l.marker}: ${l.valueCanonical ?? l.valueOriginal ?? l.value} ${l.unitCanonical || l.unit || ""} (${l.flag || l.status || "NORMAL"})`).join("\n") || "No recent lab observations"}
</input>

${OUTPUT_FORMAT_JSON}
Return valid JSON with exactly these keys: situation (string), background (string), assessment (array of strings), recommendation (array of strings).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });

    const parsed = safeJsonParse<any>(response.text, {});
    return {
      situation: parsed.situation || "Situation not provided.",
      background: parsed.background || "Background not provided.",
      assessment: Array.isArray(parsed.assessment)
        ? parsed.assessment
        : [parsed.assessment || "Assessment not provided."],
      recommendation: Array.isArray(parsed.recommendation)
        ? parsed.recommendation
        : [parsed.recommendation || "Recommendation not provided."],
    } as SBARSummary;
  } catch (error) {
    console.error("Gemini SBAR Generation failed:", error);
    throw new Error("Unable to generate summary. Please try again.");
  }
};
