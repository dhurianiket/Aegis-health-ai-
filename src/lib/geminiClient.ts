import { GoogleGenAI as GenAI } from "@google/genai";

export class GoogleGenAI {
  private ai: GenAI;

  constructor(config: any = {}) {
    const rawKey = config.apiKey || process.env.GEMINI_API_KEY;
    const apiKey = rawKey?.trim().replace(/^["']|["']$/g, "");
    this.ai = new GenAI({ apiKey });
  }

  get models() {
    return {
      generateContent: async (params: any) => {
        return this.ai.models.generateContent(params);
      },
      generateContentStream: async function* (this: any, params: any) {
        const response = await this.ai.models.generateContentStream(params);
        for await (const chunk of response) {
          yield chunk;
        }
      }.bind(this)
    };
  }
}

export async function streamGenerate(
  params: any,
  onChunk: (text: string) => void,
  onDone: (text: string) => void,
  signal?: AbortSignal
) {
  const ai = new GoogleGenAI();
  const stream = ai.models.generateContentStream(params);
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
    if (err.name === 'AbortError') {
      console.log("AI Streaming aborted by user.");
      return;
    }
    console.error("Streaming error:", err);
    throw err;
  }
}

export const Type = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  OBJECT: "OBJECT",
  ARRAY: "ARRAY",
};
