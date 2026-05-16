import {
  UserProfile,
} from "../types/medical";
import { getAI } from "../lib/geminiClient";
import { getPatientContext, formatContextForPrompt } from "./ai/contextService";
import { generateSourceHash, getCachedReport, saveCachedReport } from "./cacheService";
import { auth } from "../lib/firebase/config";

const PROMPT_VERSION = "v1.0";

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
    ? Math.floor((new Date().getTime() - new Date(profile.dob).getTime()) / 3.15576e10)
    : "Unknown";
    
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const prompt = `
You are the clinical reasoning and medical report summarization engine for Aegis Health AI.

Your job is to analyze extracted medical report data and generate a highly useful, clinically structured summary for both:
1. SBAR format for healthcare communication.
2. AI DR Summary for the patient/user in detailed, easy-to-understand language.

<output_rules>
- OUTPUT MUST BE PLAIN TEXT ONLY.
- NO MARKDOWN (no bolding, no headers).
- Start with the intro paragraph for the patient.
</output_rules>

INTRO PARAGRAPH:
Here is the clinical summary of your complete medical profile. It contains two sections: a technical SBAR summary for healthcare providers, and an AI Doctor Summary tailored for you.

--------------------------------------------------
PART 1: SBAR CLINICAL SUMMARY (For Healthcare Providers)
Patient: ${profile.fullName || profile.name} | Age: ${age} | Sex: ${profile.gender || 'Unknown'} | Date: ${today}

S - SITUATION
[Current report type, date, and the main reason for attention]

B - BACKGROUND
[Relevant patient history, ongoing conditions, previous abnormal values, medication context, and trends]

A - ASSESSMENT
[Medical meaning of findings. Separate normal from abnormal/borderline. Explain how current results compare with prior results and likely clinical significance]

R - RECOMMENDATION
[What should be reviewed next. Follow-up, repeat testing, specialist review. Concise and action-oriented]

--------------------------------------------------
PART 2: AI DR SUMMARY (For the Patient)
[Write a detailed, user-friendly doctor-style summary for the patient. Explain the report in clear language. Start with the most important findings. Explain what each abnormal result means in context. Include how this report fits into the patient's history. Explain trends, improvement, worsening, or stability. Detailed enough for the patient to understand. Avoid jargon where possible. Explain normal findings briefly.]

CLINICAL CONTEXT:
${formattedContext}
`;

  try {
    let response;
    let modelUsed = "gemini-3.1-pro-preview";
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
      modelUsed = "gemini-3-flash-preview";
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 8192,
          temperature: 0.1,
        },
      });
    }

    const content = response.text || "Failed to generate summary.";
    
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

