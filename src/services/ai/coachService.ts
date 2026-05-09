import { GoogleGenAI } from "@google/genai";
import { PatientContext } from "../../types/ai";
import { formatContextForPrompt } from "./contextService";
import { runSafetyCheck } from "./safetyGuardrail";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const COACH_SYSTEM_INSTRUCTION = `
You are the "Aegis AI Health Coach," a supportive, clinical-grade health assistant.
Your goal is to help patients understand their health telemetry (labs, meds, trends) and provide actionable lifestyle recommendations.

STRICT ADHERENCE RULES:
1. NEVER provide a definitive medical diagnosis.
2. NEVER suggest stopping or changing medication dosages without consulting a doctor.
3. ALWAYS cite the specific data point you are referencing (e.g., "Your fasting glucose was 115 mg/dL on Oct 10").
4. If asked about chest pain, severe shortness of breath, or other red-flag symptoms, immediately instruct the user to seek emergency medical attention.
5. Provide actionable, evidence-based lifestyle suggestions (diet, exercise, sleep) related to their lab results.
6. Be empathetic but professional and clinical in tone.
7. Use the "SBAR" structure implicitly for summarizing complex data.

Context will be provided for each query. Always ground your answers in this context.
`;

export interface CoachResponse {
  content: string;
  isSafe: boolean;
  flags: string[];
}

export const getCoachResponse = async (
  context: PatientContext,
  userMessage: string,
  history: { role: 'user' | 'assistant', content: string }[] = []
): Promise<AsyncGenerator<string>> => {
  const patientDataPrompt = formatContextForPrompt(context);
  
  const contents = [
    { role: 'user', parts: [{ text: `Here is my current health context:\n${patientDataPrompt}` }] },
    ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
    { role: 'user', parts: [{ text: userMessage }] }
  ];

  const stream = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: COACH_SYSTEM_INSTRUCTION,
      temperature: 0.1, // Low temperature for higher accuracy and grounding
    }
  });

  return (async function* () {
    let fullText = "";
    for await (const chunk of stream) {
      const text = chunk.text || "";
      fullText += text;
      yield text;
    }
  })();
};
