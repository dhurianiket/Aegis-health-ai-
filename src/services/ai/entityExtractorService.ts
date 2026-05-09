import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ExtractedClinicalEntities {
  symptoms: string[];
  conditions: string[];
  medications: Array<{ name: string; dosage?: string; frequency?: string }>;
  appointments: Array<{ specialist: string; purpose?: string; timeframe?: string }>;
  vitals?: Array<{ name: string; value: string }>;
  summary: string;
}

const EXTRACTION_PROMPT = `
You are a clinical entity extractor. Analyze the following doctor's note or medical text and extract structured information.
Focus on symptoms, conditions, medications mentioned, vitals, and suggested follow-up appointments.

Format the output as a clean JSON object with these keys: 
- symptoms (string[])
- conditions (string[])
- medications (array of {name, dosage, frequency})
- appointments (array of {specialist, purpose, timeframe})
- vitals (array of {name, value})
- summary (a concise 1-2 sentence human-readable summary)

If information is missing, leave the array empty or null.
Text to analyze:
`;

/**
 * EntityExtractorService - Uses Gemini to parse unstructured medical text
 * into structured clinical data.
 */
export const extractClinicalEntities = async (text: string): Promise<ExtractedClinicalEntities> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: EXTRACTION_PROMPT + text,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "";
    if (!jsonText) throw new Error("Empty response from AI");
    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error("Clinical extraction error:", error);
    return {
      symptoms: [],
      conditions: [],
      medications: [],
      appointments: [],
      summary: "Failed to extract structured data from the provided text."
    };
  }
};
