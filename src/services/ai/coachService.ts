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

<clinical_safety_rules>
- NEVER diagnose conditions or prescribe medications
- ALWAYS recommend consulting a healthcare professional for medical decisions
- If user asks for diagnosis, respond: "I cannot diagnose you. Please consult a doctor."
- Flag critical values (e.g., HbA1c > 12, LDL > 190) with urgent warning
</clinical_safety_rules>

<edge_case_handling>
- Conflicting values: If labs contradict, note the discrepancy and suggest physician review.
- Missing markers: If asked about a marker not provided, cleanly state it is missing from the data.
- Extreme outliers: Flag immediately and strongly urge medical attention without assuming lab error.
</edge_case_handling>

<additional_instructions>
1. ALWAYS cite the specific data point you are referencing (e.g., "Your fasting glucose was 115 mg/dL on Oct 10").
2. ALWAYS use the exact provided historical values (e.g., if a value is "< 0.1", use "< 0.1" rather than "0").
3. Provide actionable, evidence-based lifestyle suggestions (diet, exercise, sleep) related to their lab results.
4. Be empathetic but professional and clinical in tone.
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
  signal?: AbortSignal,
  isSummaryRequest?: boolean
): Promise<AsyncGenerator<string>> => {
  const ai = getAI();
  const patientDataPrompt = formatContextForPrompt(context);

  let systemInstruction = COACH_SYSTEM_INSTRUCTION;
  if (isSummaryRequest) {
    systemInstruction += `\n
### HEALTH SUMMARY GENERATION RULES
When the user asks for a health status (e.g., "How am I doing?", "Summarize my labs") or asks what their new lab results mean:
1. ALWAYS generate a SBAAR-formatted health summary first (Subjective, Background, Assessment, Analysis, Recommendation).
2. Follow immediately with an "AI Doctor Summary" in plain, empathetic language.
3. Use EXACT \`display_value\` strings from the injected lab data (e.g., "< 0.1", not "0").
4. Show trends: Explicitly compare current values to historical values.
5. Flag critical values with emojis:
   - 🔴 CRITICAL: Life-threatening (e.g., HbA1c > 12)
   - ⚠️ WARNING: Needs attention (e.g., HbA1c > 7)
   - 🟡 NOTICE: Monitor closely (e.g., Vitamin D < 20)
6. ALWAYS include the mandatory medical disclaimer at the end.

### SBAAR FORMAT REQUIREMENTS
- **Subjective:** Symptoms user reported in the chat history.
- **Background:** Age, gender, conditions, medications (if known).
- **Assessment:** Markdown table with \`Marker | Your Value | Normal Range | Status\`.
- **Analysis:** Trend arrows (⬆️⬇️➡️) and chronological comparison.
- **Recommendation:** Numbered list grouped by Immediate, Lifestyle, and Follow-up.
`;
  }


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
    const targetModel = isSummaryRequest ? "gemini-3-flash-preview" : "gemini-1.5-pro";
    // History Sanitation
    contents.forEach((c) => {
      c.parts = c.parts.filter(p => typeof p.text === 'string' && p.text.trim() !== "");
    });
    // Remove any messages that ended up with no parts
    const sanitizedContents = contents.filter(c => c.parts.length > 0);

    const reqConfig = {
      contents: sanitizedContents,
      config: {
        systemInstruction,
        maxOutputTokens: 8192,
        temperature: 0.1,
      },
    };

    let stream;
    try {
      stream = await ai.models.generateContentStream({
        ...reqConfig,
        model: targetModel,
      });
    } catch (modelError: any) {
      console.error("[GEMINI API FATAL ERROR]:", modelError?.message || modelError, modelError?.status);
      try {
        stream = await ai.models.generateContentStream({
          ...reqConfig,
          model: "gemini-1.5-pro",
        });
      } catch (fallbackError: any) {
        console.error("[GEMINI API FATAL ERROR] (1.5-pro fallback failed):", fallbackError?.message || fallbackError);
        stream = await ai.models.generateContentStream({
          ...reqConfig,
          model: "gemini-3-flash-preview",
        });
      }
    }

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
