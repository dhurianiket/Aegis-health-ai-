import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY is not set");
    }
    
    aiInstance = new GoogleGenAI({ 
      apiKey,
      baseUrl: import.meta.env.VITE_CLOUDFLARE_AI_GATEWAY_URL,
    });
  }
  return aiInstance;
}

export default getAI;
