import { getAI } from "../../lib/geminiClient";
import { PatientContext } from "../../types/ai";
import { formatContextForPrompt } from "./contextService";
import { runSafetyCheck } from "./safetyGuardrail";
import { CORE_SYSTEM_PROMPT } from "./promptFramework";

export const COACH_SYSTEM_INSTRUCTION = `${CORE_SYSTEM_PROMPT}

<task>
Explain the provided health summary in simple language for a patient with no medical background.
Use reassuring but accurate language.
Do not minimize urgent findings.
Do not overstate certainty.
Answer the user's questions based purely on their telemetry and provided context.
</task>

<audience>
Patient
</audience>

<reading_level>
Grade 6 to 8
</reading_level>

<additional_instructions>
1. ALWAYS cite the specific data point you are referencing (e.g., "Your fasting glucose was 115 mg/dL on Oct 10").
2. Provide actionable, evidence-based lifestyle suggestions (diet, exercise, sleep) related to their lab results.
3. Be empathetic but professional and clinical in tone.
</additional_instructions>
`;

export interface CoachResponse {
  content: string;
  isSafe: boolean;
  flags: string[];
}

export const getCoachResponse = async (
  context: PatientContext,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<AsyncGenerator<string>> => {
  const ai = getAI();
  const patientDataPrompt = formatContextForPrompt(context);

  // GenAI SDK requires strictly alternating roles: user -> model -> user -> model
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  if (history.length === 0) {
    // First message - merge context and question
    contents.push({
      role: "user",
      parts: [
        {
          text: `Medical Context:\n${patientDataPrompt}\n\nQuestion: ${userMessage}`,
        },
      ],
    });
  } else {
    // History exists - process it
    history.forEach((h, i) => {
      const role = h.role === "assistant" ? "model" : "user";
      let text = h.content;

      // Inject context into the very first user message of the history
      if (i === 0 && role === "user") {
        text = `Context:\n${patientDataPrompt}\n\nUser previously said: ${text}`;
      }

      // Handle potential duplicate roles in history (though useCoach should prevent this)
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    });

    // Add current message
    if (contents[contents.length - 1].role === "user") {
      // Append to last user message if history ended with user
      contents[contents.length - 1].parts[0].text +=
        `\n\nFollow-up Question: ${userMessage}`;
    } else {
      contents.push({
        role: "user",
        parts: [{ text: userMessage }],
      });
    }
  }

  if (!ai) throw new Error("Aura AI is currently offline. Please check your configuration.");
  
  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents,
      config: {
        systemInstruction: COACH_SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    return (async function* () {
      try {
        for await (const chunk of stream) {
          if (chunk.text) {
            yield chunk.text;
          }
        }
      } catch (streamError) {
        console.error("Stream processing error:", streamError);
        yield "I'm having trouble connecting right now. Please try again in a moment.";
      }
    })();
  } catch (error) {
    console.error("Coach service initialization error:", error);
    return (async function* () {
      yield "I'm having trouble connecting right now. Please try again in a moment.";
    })();
  }
};
