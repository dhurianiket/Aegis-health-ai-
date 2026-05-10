import { GoogleGenAI } from "../../lib/geminiClient";
import { CORE_SYSTEM_PROMPT, OUTPUT_FORMAT_JSON } from "./promptFramework";

const ai = new GoogleGenAI({});

export interface ExtractedClinicalEntities {
  symptoms: string[];
  conditions: string[];
  medications: Array<{ name: string; dosage?: string; frequency?: string }>;
  appointments: Array<{
    specialist: string;
    purpose?: string;
    timeframe?: string;
  }>;
  vitals?: Array<{ name: string; value: string }>;
  summary: string;
}

const EXTRACTION_PROMPT = `${CORE_SYSTEM_PROMPT}

<task>
Extract structured information from the provided doctor's note or medical text.
Focus on symptoms, conditions, medications mentioned, vitals, and suggested follow-up appointments.
</task>

<audience>
System/Internal
</audience>

${OUTPUT_FORMAT_JSON}
Format the output as a clean JSON object with exactly these keys: 
- symptoms (string[])
- conditions (string[])
- medications (array of {name, dosage, frequency})
- appointments (array of {specialist, purpose, timeframe})
- vitals (array of {name, value})
- summary (a concise 1-2 sentence human-readable summary, purely factual)

If information is missing, leave the array empty.`;

/**
 * EntityExtractorService - Uses Gemini to parse unstructured medical text
 * into structured clinical data.
 */
export const extractClinicalEntities = async (
  text: string,
): Promise<ExtractedClinicalEntities> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${EXTRACTION_PROMPT}\n\n<input>\n${text}\n</input>`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "";
    if (!jsonText) throw new Error("Empty response from AI");

    let cleanText = jsonText.trim();
    cleanText = cleanText
      .replace(/^```[a-z]*\s*/i, "")
      .replace(/```$/, "")
      .trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Clinical extraction error:", error);
    return {
      symptoms: [],
      conditions: [],
      medications: [],
      appointments: [],
      summary: "Failed to extract structured data from the provided text.",
    };
  }
};
