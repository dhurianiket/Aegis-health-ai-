import {
  UserProfile,
} from "../types/medical";
import { getAI } from "../lib/geminiClient";
import { getPatientContext, formatContextForPrompt } from "./ai/contextService";
import { generateSourceHash, getCachedReport, saveCachedReport } from "./cacheService";
import { auth } from "../lib/firebase/config";
import { parseSafeTimestamp } from "../utils/dateUtils";

const PROMPT_VERSION = "v2.1";

function cleanClinicalText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\$\s*\\rightarrow\s*\$/g, " → ")
    .replace(/\\rightarrow/g, " → ")
    .replace(/\$\s*->\s*\$/g, " → ")
    .replace(/\$\s*\\times\s*10\^3\/\\mu\\text\{L\}\s*\$/gi, " × 10³/µL")
    .replace(/\\times\s*10\^3\/\\mu\\text\{L\}/gi, " × 10³/µL")
    .replace(/\\times/g, " × ")
    .replace(/\\mu\\text\{L\}/gi, "µL")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\$([0-9.,/% -]+)\$/g, "$1")
    .replace(/\$/g, "")
    .replace(/Gemini\s*(4\s*Argon|3\.8\s*Flash|Pro|Flash)?/gi, "Aegis Clinical Intelligence")
    .replace(/Google\s*Gemini/gi, "Aegis Health AI")
    .trim();
}

export const generateSBAR = async (
  userId: string,
  profile: UserProfile,
  forceRefresh: boolean = false
): Promise<string> => {
  const patientData = await getPatientContext(userId, profile);
  const formattedContext = formatContextForPrompt(patientData);
  const sourceHash = await generateSourceHash(formattedContext);
  
  const cachedContent = await getCachedReport(userId, profile.id || "Myself", "SBAAR", sourceHash, PROMPT_VERSION, forceRefresh);
  if (cachedContent) {
    console.log("Returning cached SBAAR report.");
    return cachedContent;
  }

  const ai = getAI();
  if (!ai) throw new Error("Aura AI is currently offline.");

  const age = profile.dob
    ? Math.floor((new Date().getTime() - (parseSafeTimestamp(profile.dob)?.getTime() || new Date().getTime())) / 3.15576e10)
    : "Unknown";
    
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const prompt = `
You are the advanced clinical reasoning and multi-specialist medical summarization engine for Aegis Health AI.

Your mission is to perform deep clinical synthesis across the patient's longitudinal lab reports, active medications, wearable biometrics, and multi-specialist consultation chats. Generate an exhaustive, high-fidelity summary with two dedicated parts:
1. PART 1: SBAR CLINICAL SUMMARY (For Attending Physicians, Specialists & Hospital OPDs).
2. PART 2: PLAIN-LANGUAGE SUMMARY (For the Patient & Family in clear, detailed, reassuring layperson terms).

<strict_formatting_and_branding_rules>
- NEVER output LaTeX or KaTeX math syntax (NO dollar signs $, NO \\rightarrow, NO \\times, NO \\mu, NO \\text{}).
- For trajectory arrows, use simple arrows like "->" or "→".
- For units, use standard notation (e.g. "x 10^3/uL", "mg/dL", "g/dL", "mL/min").
- NEVER mention Google Gemini, Argon, or underlying AI model names in your output text or disclaimers. You represent exclusively the "Aegis Clinical Intelligence Engine".
- Structure your output cleanly using the exact partition dividers shown below.
- Keep the technical SBAR concise, evidence-grounded, and packed with exact biomarker values, reference ranges, and pharmacological context.
- Make the patient summary warm, educational, and deeply informative—explain *why* certain numbers are flagged, how organs communicate, what medicines do in the body, and what questions to bring to the doctor.
</strict_formatting_and_branding_rules>

INTRO PARAGRAPH:
Here is the clinical summary of your complete medical profile. It contains two sections: a technical SBAR summary for healthcare providers, and a plain-language summary tailored for you (educational information, not a diagnosis).

--------------------------------------------------
PART 1: SBAR CLINICAL SUMMARY (For Healthcare Providers)
Patient: ${profile.fullName || profile.name} | Age: ${age} | Sex: ${profile.gender || 'Unknown'} | Date: ${today}

S - SITUATION
[Current report type, date, acute presentations, and the main reason for attention]

B - BACKGROUND
[Relevant patient history, ongoing conditions, previous abnormal values, active prescription regimen, multi-specialist team consultations, and biomarker trends]

A - ASSESSMENT
[Medical meaning of findings. Synthesize multi-specialist assessments (Cardiology, Endocrinology, Nephrology, etc.) with current laboratory biomarkers. Correlate clinical significance and cross-system organ interactions]

R - RECOMMENDATION
[What should be reviewed next. Include specialist follow-ups, pending referrals, repeat testing, titration points, and lifestyle modifications. Action-oriented]

--------------------------------------------------
PART 2: PLAIN-LANGUAGE SUMMARY (For the Patient)

1. HEALTH OVERVIEW (At a Glance)
[Explain the overall picture of health in clear, friendly language without scary medical jargon. Mention which organ systems are doing well and which need attention.]

2. WHAT YOUR TEST RESULTS MEAN
[Break down key abnormal vs normal findings in simple everyday language. Explain what each number means in context.]

3. YOUR MEDICATIONS IN SIMPLE TERMS
[Explain why each active medication was prescribed, what it does in your body, and key safety reminders.]

4. QUESTIONS TO ASK YOUR DOCTOR AT YOUR NEXT VISIT
[List 3 to 4 specific, high-yield questions tailored to these findings to ask during your doctor appointment.]

5. PRACTICAL DIET & LIFESTYLE POINTERS
[Provide practical everyday advice—hydration, nutrition, sleep, and physical activity aligned with your lab results.]

CLINICAL CONTEXT:
${formattedContext}
`;

  try {
    let response;
    let modelUsed = "gemini-4-argon";
    try {
      response = await ai.models.generateContent({
        model: "gemini-4-argon",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 8192,
          temperature: 0.1,
        },
      });
    } catch (proError: any) {
      console.warn("Gemini 4 Argon failed, falling back to Gemini 3.8 Flash:", proError.message || proError);
      modelUsed = "gemini-3.8-flash";
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 8192,
          temperature: 0.1,
        },
      });
    }

    const rawContent = response.text || "Failed to generate summary.";
    const content = cleanClinicalText(rawContent);
    
    if (content && content !== "Failed to generate summary.") {
      await saveCachedReport(userId, {
        patientId: profile.id || "Myself",
        reportType: "SBAAR",
        sourceHash,
        content,
        modelUsed,
        promptVersion: PROMPT_VERSION,
        status: "success"
      });
    }

    return content;
  } catch (error) {
    console.error("Gemini SBAR Generation failed:", error);
    throw new Error("Unable to generate summary. Please try again.");
  }
};

