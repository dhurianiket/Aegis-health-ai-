import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY is not set");
    }
    
    const realAI = new GoogleGenAI({ 
      apiKey,
      httpOptions: { baseUrl: import.meta.env.VITE_CLOUDFLARE_AI_GATEWAY_URL },
    });

    // Intercept generateContent
    const originalGenerateContent = realAI.models.generateContent.bind(realAI.models);
    realAI.models.generateContent = async function(params: any) {
      if (!params) return originalGenerateContent(params);
      
      const originalModel = params.model;
      // Pre-map deprecated/unstable models to stable highly-available ones
      if (
        params.model === "gemini-3-flash-preview" || 
        params.model === "gemini-2.0-flash" || 
        params.model === "gemini-1.5-flash"
      ) {
        params.model = "gemini-3.5-flash";
      } else if (params.model === "gemini-1.5-pro") {
        params.model = "gemini-3.1-pro-preview";
      }

      try {
        return await originalGenerateContent(params);
      } catch (err: any) {
        const errorMsg = err?.message || "";
        const errorStatus = err?.status || err?.code;
        const isUnavailable = 
          errorStatus === 503 || 
          errorStatus === "UNAVAILABLE" ||
          errorMsg.includes("503") || 
          errorMsg.toLowerCase().includes("demand") || 
          errorMsg.toLowerCase().includes("unavailable");

        if (isUnavailable && params.model !== "gemini-3.5-flash") {
          console.warn(`[Gemini Interceptor] Model "${originalModel}" (mapped to "${params.model}") was unavailable (503/high-demand). Retrying with "gemini-3.5-flash"...`);
          params.model = "gemini-3.5-flash";
          return await originalGenerateContent(params);
        }
        throw err;
      }
    };

    // Intercept generateContentStream
    const originalGenerateContentStream = realAI.models.generateContentStream.bind(realAI.models);
    realAI.models.generateContentStream = async function(params: any) {
      if (!params) return originalGenerateContentStream(params);
      
      const originalModel = params.model;
      if (
        params.model === "gemini-3-flash-preview" || 
        params.model === "gemini-2.0-flash" || 
        params.model === "gemini-1.5-flash"
      ) {
        params.model = "gemini-3.5-flash";
      } else if (params.model === "gemini-1.5-pro") {
        params.model = "gemini-3.1-pro-preview";
      }

      try {
        return await originalGenerateContentStream(params);
      } catch (err: any) {
        const errorMsg = err?.message || "";
        const errorStatus = err?.status || err?.code;
        const isUnavailable = 
          errorStatus === 503 || 
          errorStatus === "UNAVAILABLE" ||
          errorMsg.includes("503") || 
          errorMsg.toLowerCase().includes("demand") || 
          errorMsg.toLowerCase().includes("unavailable");

        if (isUnavailable && params.model !== "gemini-3.5-flash") {
          console.warn(`[Gemini Interceptor] Stream Model "${originalModel}" (mapped to "${params.model}") was unavailable (503/high-demand). Retrying with "gemini-3.5-flash"...`);
          params.model = "gemini-3.5-flash";
          return await originalGenerateContentStream(params);
        }
        throw err;
      }
    };

    aiInstance = realAI;
  }
  return aiInstance;
}

export default getAI;
