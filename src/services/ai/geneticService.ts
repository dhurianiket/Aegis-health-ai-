import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneticRiskAnalysis {
  condition: string;
  sharedRiskScore: number; // 0-100
  heritabilityFactor: number;
  recommendations: string[];
  description: string;
}

const GENETIC_PROMPT = `
Analyze the provided biomarker profiles of two or more related individuals (e.g., Parent/Child).
Identify shared physiological trends that suggest hereditary risk patterns.
Focus on: Cardiovascular risk, Metabolic shifts (HbA1c/Glucose), and Chronic inflammation (CRP).

Format the output as a JSON array of objects:
- condition (string)
- sharedRiskScore (number 0-100)
- heritabilityFactor (number 0-1)
- recommendations (string[])
- description (concise analysis)

Maturity Note: Be cautious and use clinical "could suggest" or "potential pattern" rather than definitive diagnosis.
`;

/**
 * GeneticService - Analyzes family health data for shared hereditary risks.
 */
export const analyzeSharedRisks = async (profilesData: any[]): Promise<GeneticRiskAnalysis[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: GENETIC_PROMPT + JSON.stringify(profilesData),
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Genetic analysis error:", error);
    return [];
  }
};
