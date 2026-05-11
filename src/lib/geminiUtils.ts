
import { getAI } from "./geminiClient";

export const Type = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  OBJECT: "OBJECT",
  ARRAY: "ARRAY",
};

export async function streamGenerate(
  params: any,
  onChunk: (text: string) => void,
  onDone: (text: string) => void,
  signal?: AbortSignal,
) {
  const ai = getAI();
  const stream = await ai.models.generateContentStream(params);
  let fullText = "";
  try {
    for await (const chunk of stream) {
      if (signal?.aborted) break;
      const text = (chunk as any).text || "";
      fullText += text;
      onChunk(text);
    }
    onDone(fullText);
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log("AI Streaming aborted by user.");
      return;
    }
    console.error("Streaming error:", err);
    throw err;
  }
}
