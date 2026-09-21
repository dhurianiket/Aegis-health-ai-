/**
 * Utilities for handling AI responses.
 */

/**
 * Robustly parses a JSON string potentially wrapped in markdown or with leading/trailing noise.
 * @param text The raw text from the AI model
 * @param fallbackValue Value to return if parsing fails
 * @returns The parsed object or fallback
 */
export function safeJsonParse<T>(text: string | undefined | null, fallbackValue: T): T {
  if (!text) return fallbackValue;

  let cleaned = text.trim();
  
  // Remove markdown code blocks if present
  if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "");
    cleaned = cleaned.replace(/^```\s*/i, "");
    cleaned = cleaned.replace(/```\s*$/i, "");
    cleaned = cleaned.trim();
  }

  // Find the first { or [ and the last } or ]
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");

  let startIndex = -1;
  let endIndex = -1;

  // Decide whether we're looking for an object or an array
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    endIndex = lastBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    endIndex = lastBracket;
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    cleaned = cleaned.slice(startIndex, endIndex + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.warn("Standard JSON parse failed, attempting repair for:", (error as Error).message);
    
    // Attempt basic repair for truncated JSON
    try {
      const repaired = repairTruncatedJson(cleaned);
      return JSON.parse(repaired) as T;
    } catch (repairError) {
      console.error("Failed to parse AI JSON response after repair:", (repairError as Error).message);
      console.error("Original text attempted to parse:", cleaned);
      return fallbackValue;
    }
  }
}

/**
 * Basic heuristic-based JSON repair for truncated strings or missing closing brackets.
 */
function repairTruncatedJson(json: string): string {
  let repaired = json.trim();
  
  // 1. Handle unterminated strings
  // If number of quotes is odd, it's likely missing a closing quote
  const quoteCount = (repaired.match(/"/g) || []).length;
  const escapedQuoteCount = (repaired.match(/\\"/g) || []).length;
  const netQuoteCount = quoteCount - escapedQuoteCount;
  
  if (netQuoteCount % 2 !== 0) {
    repaired += '"';
  }
  
  // 2. Handle missing closing brackets/braces
  const stack: string[] = [];
  let inString = false;
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    const prevChar = i > 0 ? repaired[i - 1] : "";
    
    if (char === '"' && prevChar !== "\\") {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === "{") stack.push("}");
      else if (char === "[") stack.push("]");
      else if (char === "}" || char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }
  
  // Append closing characters in reverse order
  while (stack.length > 0) {
    repaired += stack.pop();
  }
  
  return repaired;
}

/**
 * Parses and returns an empathetic, patient-friendly error message from any Gemini API/neural engine error.
 */
export function getFriendlyErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred. Please try again in a moment.";
  
  const rawMsg = err.message || (typeof err === "string" ? err : "");
  
  if (!rawMsg) return "An unexpected error occurred. Please try again in a moment.";

  const status = err.status ?? err.code;
  const lowerMsg = rawMsg.toLowerCase();

  // 1. Detect Network / Offline / Connection failed
  if (
    lowerMsg.includes("failed to fetch") ||
    lowerMsg.includes("networkerror") ||
    lowerMsg.includes("network request failed") ||
    lowerMsg.includes("econnrefused") ||
    lowerMsg.includes("net::err") ||
    lowerMsg.includes("offline")
  ) {
    return "Unable to connect to Aura AI. Please check your internet connection and try again.";
  }

  // 2. Detect prepaid credits depleted / billing errors
  const isPrepaymentDepleted = 
    lowerMsg.includes("prepayment credits are depleted") ||
    lowerMsg.includes("prepayment") ||
    lowerMsg.includes("credits are depleted") ||
    lowerMsg.includes("billing#prepay");

  if (isPrepaymentDepleted) {
    return "Aura AI is currently under high load, or the developer's prepaid credits on Google AI Studio are depleted. Please try again later or contact support.";
  }

  // 3. Detect 429 quota exhaustion errors
  const isQuotaError = 
    status === 429 || 
    rawMsg.includes("429") || 
    lowerMsg.includes("quota") || 
    lowerMsg.includes("resource_exhausted") ||
    lowerMsg.includes("exhausted") ||
    lowerMsg.includes("rate limit");

  if (isQuotaError) {
    return "Aura AI is experiencing temporary high demand (Rate limit exceeded). Please wait a moment and try again. Your data is perfectly safe.";
  }

  // 4. Detect permission, credentials, edge proxy bearer or API key configuration errors
  if (
    status === 401 ||
    status === 403 ||
    rawMsg.includes("API key") ||
    rawMsg.includes("VITE_GEMINI_API_KEY") ||
    rawMsg.includes("VITE_AEGIS_EDGE_BEARER") ||
    rawMsg.includes("API_KEY") ||
    lowerMsg.includes("unauthorized") ||
    lowerMsg.includes("forbidden")
  ) {
    return "Aura AI is temporarily offline (edge auth or security verification required). Please configure VITE_AEGIS_EDGE_BEARER for the Cloudflare Gemini proxy.";
  }

  // 5. Detect edge service unavailable / gateway errors (502 / 503 / 504)
  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    lowerMsg.includes("service unavailable") ||
    lowerMsg.includes("bad gateway") ||
    lowerMsg.includes("gateway timeout") ||
    lowerMsg.includes("overloaded")
  ) {
    return "Aura AI's clinical engine is temporarily undergoing high traffic or maintenance. Please try again in a few moments.";
  }

  // 6. Handle nested inner error JSON if possible
  try {
    const parsed = typeof rawMsg === "string" ? JSON.parse(rawMsg) : rawMsg;
    if (parsed?.error?.message) {
      const innerMsg = parsed.error.message;
      try {
        const innerParsed = JSON.parse(innerMsg);
        if (innerParsed?.error?.message) {
          return getFriendlyErrorMessage({ message: innerParsed.error.message, status });
        }
      } catch {}
      return getFriendlyErrorMessage({ message: innerMsg, status });
    }
  } catch {}

  return "I am currently having trouble connecting to my clinical brain. Please try again in a moment.";
}

