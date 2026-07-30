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
      let effectiveModel = params.model;
      if (
        params.model === "gemini-3-flash-preview" || 
        params.model === "gemini-3.5-flash" || 
        params.model === "gemini-2.0-flash" || 
        params.model === "gemini-1.5-flash"
      ) {
        effectiveModel = "gemini-3.6-flash";
      } else if (params.model === "gemini-1.5-pro") {
        effectiveModel = "gemini-3.1-pro-preview";
      }

      const activeParams = { ...params, model: effectiveModel };

      try {
        return await originalGenerateContent(activeParams);
      } catch (err: any) {
        const errorMsg = err?.message || "";
        const errorStatus = err?.status || err?.code;
        const isUnavailable = 
          errorStatus === 503 || 
          errorStatus === "UNAVAILABLE" ||
          errorMsg.includes("503") || 
          errorMsg.toLowerCase().includes("demand") || 
          errorMsg.toLowerCase().includes("unavailable");

        if (isUnavailable) {
          if (activeParams.model !== "gemini-3.6-flash") {
            console.warn(`[Gemini Interceptor] Model "${originalModel}" (mapped to "${activeParams.model}") was unavailable (503/high-demand). Retrying with "gemini-3.6-flash"...`);
            const retryParams = { ...params, model: "gemini-3.6-flash" };
            try {
              return await originalGenerateContent(retryParams);
            } catch (retryErr: any) {
              const retryMsg = retryErr?.message || "";
              const retryStatus = retryErr?.status || retryErr?.code;
              const isRetryUnavailable = 
                retryStatus === 503 || 
                retryStatus === "UNAVAILABLE" ||
                retryMsg.includes("503") || 
                retryMsg.toLowerCase().includes("demand") || 
                retryMsg.toLowerCase().includes("unavailable");

              if (isRetryUnavailable) {
                console.warn(`[Gemini Interceptor] Secondary fallback: "gemini-3.6-flash" was unavailable (503). Retrying with "gemini-2.5-flash"...`);
                const secondaryParams = { ...params, model: "gemini-2.5-flash" };
                return await originalGenerateContent(secondaryParams);
              }
              throw retryErr;
            }
          } else {
            console.warn(`[Gemini Interceptor] Model "gemini-3.6-flash" was unavailable (503/high-demand). Retrying with secondary fallback "gemini-2.5-flash"...`);
            const secondaryParams = { ...params, model: "gemini-2.5-flash" };
            return await originalGenerateContent(secondaryParams);
          }
        }
        throw err;
      }
    };

    // Intercept generateContentStream
    const originalGenerateContentStream = realAI.models.generateContentStream.bind(realAI.models);
    realAI.models.generateContentStream = async function(params: any) {
      if (!params) return originalGenerateContentStream(params);
      
      const originalModel = params.model;
      let effectiveModel = params.model;
      if (
        params.model === "gemini-3-flash-preview" || 
        params.model === "gemini-3.5-flash" || 
        params.model === "gemini-2.0-flash" || 
        params.model === "gemini-1.5-flash"
      ) {
        effectiveModel = "gemini-3.6-flash";
      } else if (params.model === "gemini-1.5-pro") {
        effectiveModel = "gemini-3.1-pro-preview";
      }

      const activeParams = { ...params, model: effectiveModel };

      try {
        return await originalGenerateContentStream(activeParams);
      } catch (err: any) {
        const errorMsg = err?.message || "";
        const errorStatus = err?.status || err?.code;
        const isUnavailable = 
          errorStatus === 503 || 
          errorStatus === "UNAVAILABLE" ||
          errorMsg.includes("503") || 
          errorMsg.toLowerCase().includes("demand") || 
          errorMsg.toLowerCase().includes("unavailable");

        if (isUnavailable) {
          if (activeParams.model !== "gemini-3.6-flash") {
            console.warn(`[Gemini Interceptor] Stream Model "${originalModel}" (mapped to "${activeParams.model}") was unavailable (503/high-demand). Retrying with "gemini-3.6-flash"...`);
            const retryParams = { ...params, model: "gemini-3.6-flash" };
            try {
              return await originalGenerateContentStream(retryParams);
            } catch (retryErr: any) {
              const retryMsg = retryErr?.message || "";
              const retryStatus = retryErr?.status || retryErr?.code;
              const isRetryUnavailable = 
                retryStatus === 503 || 
                retryStatus === "UNAVAILABLE" ||
                retryMsg.includes("503") || 
                retryMsg.toLowerCase().includes("demand") || 
                retryMsg.toLowerCase().includes("unavailable");

              if (isRetryUnavailable) {
                console.warn(`[Gemini Interceptor] Secondary Stream fallback: "gemini-3.6-flash" was unavailable (503). Retrying with "gemini-2.5-flash"...`);
                const secondaryParams = { ...params, model: "gemini-2.5-flash" };
                return await originalGenerateContentStream(secondaryParams);
              }
              throw retryErr;
            }
          } else {
            console.warn(`[Gemini Interceptor] Stream Model "gemini-3.6-flash" was unavailable (503/high-demand). Retrying with secondary fallback "gemini-2.5-flash"...`);
            const secondaryParams = { ...params, model: "gemini-2.5-flash" };
            return await originalGenerateContentStream(secondaryParams);
          }
        }
        throw err;
      }
    };

    aiInstance = realAI;
  }
  return aiInstance;
}

export default getAI;
