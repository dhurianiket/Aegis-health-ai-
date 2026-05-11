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
