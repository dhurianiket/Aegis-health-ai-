import { GoogleGenAI } from "../../lib/geminiClient";
import { UserProfile, LabResult } from "../../types/medical";
import { CORE_SYSTEM_PROMPT, OUTPUT_FORMAT_JSON } from "./promptFramework";

const ai = new GoogleGenAI({ });

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
export const analyzeSharedRisks = async (profilesData: { profile: UserProfile; labs: LabResult[] }[]): Promise<GeneticRiskAnalysis[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${GENETIC_PROMPT}\n\n<input>\n${JSON.stringify(profilesData)}\n</input>`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "[]";
    let cleanText = jsonText.trim();
    cleanText = cleanText.replace(/^```[a-z]*\s*/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Genetic analysis error:", error);
    return [];
  }
};

