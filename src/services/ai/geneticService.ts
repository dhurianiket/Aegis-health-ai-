import { getAI } from "../../lib/geminiClient";
import { UserProfile, LabResult } from "../../types/medical";
import { CORE_SYSTEM_PROMPT, OUTPUT_FORMAT_JSON } from "./promptFramework";
import { safeJsonParse } from "../../utils/aiUtils";

export interface GeneticRiskAnalysis {
  condition: string;
  sharedRiskScore: number; // 0-100
  heritabilityFactor: number;
  recommendations: string[];
  description: string;
}

const GENETIC_PROMPT = `${CORE_SYSTEM_PROMPT}

<task>
Analyze the provided biomarker profiles of two or more related individuals (e.g., Parent/Child).
Identify shared physiological trends that suggest common health histories.
Do not predict future outcomes.
Focus on: Cardiovascular trends, Metabolic histories (HbA1c/Glucose), and Chronic inflammation (CRP).
</task>

<audience>
Clinician/Patient
</audience>

${OUTPUT_FORMAT_JSON}
Format the output as a JSON array of objects:
- condition (string)
- sharedRiskScore (number 0-100)
- heritabilityFactor (number 0-1)
- recommendations (string[])
- description (concise analysis)

Maturity Note: Be cautious and use clinical "could suggest" or "potential pattern" rather than definitive diagnosis.`;

/**
 * GeneticService - Analyzes family health data for shared hereditary risks.
 */
export const analyzeSharedRisks = async (
  profilesData: { profile: UserProfile; labs: LabResult[] }[],
): Promise<GeneticRiskAnalysis[]> => {
  const ai = getAI();
  try {
    const aiConfig = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${GENETIC_PROMPT}\n\n<input>\n${JSON.stringify(profilesData)}\n</input>`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    };
    let response;
    try {
      response = await ai.models.generateContent({
        ...aiConfig,
        model: "gemini-3.1-pro-preview",
        contents: aiConfig.contents as any,
      });
    } catch (proErr) {
      console.warn(
        "Genetic analysis failed with Pro, falling back to Flash",
        proErr,
      );
      response = await ai.models.generateContent({
        ...aiConfig,
        model: "gemini-3-flash-preview",
        contents: aiConfig.contents as any,
      });
    }

    return safeJsonParse<GeneticRiskAnalysis[]>(response.text, []);
  } catch (error) {
    console.error("Genetic analysis error:", error);
    return [];
  }
};
