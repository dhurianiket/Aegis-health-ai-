import { GoogleGenAI as GenAI } from "@google/genai";

export class GoogleGenAI {
  private ai: GenAI | null = null;
  private apiKey: string | undefined;

  constructor(config: any = {}) {
    this.apiKey = config.apiKey 
      || import.meta.env.VITE_GEMINI_API_KEY;
    
    // Clean the key
    if (this.apiKey) {
      this.apiKey = this.apiKey.trim().replace(/^["']|["']$/g, "");
    }
    
    console.log("[GeminiLog] API Key present:", !!this.apiKey, "Length:", this.apiKey?.length || 0);
    if (import.meta.env.DEV) {
      console.log("[GeminiLog] Env keys:", Object.keys(import.meta.env).filter(k => k.includes("GEMINI")));
    }

    if (this.isAvailable) {
      try {
        this.ai = new GenAI({ apiKey: this.apiKey! });
      } catch (err) {
        console.error("Failed to initialize GenAI SDK:", err);
      }
    } else {
      console.warn("GoogleGenAI initialized without a valid API key. AI features will be disabled.");
    }
  }

  get isAvailable(): boolean {
    const key = this.apiKey?.trim();
    return typeof key === 'string' && 
           key.length > 20 && 
           key.startsWith('AIza');
  }

  get models() {
    return {
      generateContent: async (params: any) => {
        if (!this.ai) {
          throw new Error("AI services are currently unavailable (API key missing or invalid).");
        }
        return this.ai.models.generateContent(params);
      },
      generateContentStream: async function* (this: any, params: any) {
        if (!this.ai) {
          throw new Error("AI services are currently unavailable (API key missing or invalid).");
        }
        const response = await this.ai.models.generateContentStream(params);
        for await (const chunk of response) {
          yield chunk;
        }
      }.bind(this),
    };
  }
}

export async function streamGenerate(
  params: any,
  onChunk: (text: string) => void,
  onDone: (text: string) => void,
  signal?: AbortSignal,
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
    if (err.name === "AbortError") {
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
