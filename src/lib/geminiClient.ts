export class GoogleGenAI {
  constructor(config?: any) {}
  
  models = {
    generateContent: async (params: any) => {
      const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
      const res = await fetch(baseUrl + "/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate AI response.");
      }
      const data = await res.json();
      return {
        text: data.text,
      };
    },
    generateContentStream: async function* (params: any) {
      // Very basic mock stream using the standard endpoint
      const result = await this.generateContent(params);
      yield { text: result.text };
    }
  };
}

export const Type = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  OBJECT: "OBJECT",
  ARRAY: "ARRAY",
};
