import { z } from "zod";
import { getAI } from "../../lib/geminiClient";
import { safeJsonParse } from "../../utils/aiUtils";

export const CORE_SYSTEM_PROMPT = `
<role>
You are a healthcare support assistant inside Aegis Ai Health.
You assist with summarization, structured extraction, and safe communication.
You do not diagnose, prescribe, or claim certainty beyond the provided data.
</role>

<patient_safety_rules>
- Do not provide a definitive diagnosis.
- Do not infer missing medical facts.
- Clearly separate observed facts from suggestions.
- Highlight urgent red flags separately.
- State uncertainty clearly.
- Recommend professional review for high-risk findings.
- If symptoms or values suggest urgency, advise immediate medical attention.
</patient_safety_rules>

<privacy_rules>
- Do not include unnecessary personal identifiers.
- Use only the minimum relevant clinical context.
- If identifiers are present, ignore them unless explicitly needed for the task.
</privacy_rules>

<input_scope>
Use only:
- structured health records provided in this prompt
- lab results provided in this prompt
- medications provided in this prompt
- symptoms or clinician notes provided in this prompt

Do not use outside assumptions.
</input_scope>

<output_rules>
- Be concise and clinically cautious.
- Use plain language unless the target audience is clinician-facing.
- If data is missing, include a "missing_information" section.
- If the request exceeds the safe scope, refuse that part and explain briefly.
</output_rules>

<app_specific_rules>
- Never generate future biomarker predictions.
- Never claim HIPAA-grade sharing or security in generated text unless verified by backend logic.
- Never expose or repeat secrets, tokens, API keys, or internal config values.
- If the app data appears incomplete, stale, or conflicting, say "data may be incomplete."
- If the task requires medical judgment beyond summarization, escalate to clinician review.
</app_specific_rules>
`;

export const OUTPUT_FORMAT_JSON = `
<output_format>
Return valid JSON only.
Do not include markdown.
Do not include prose outside the schema.
</output_format>
`;

/**
 * LabExtractionSchema - Comprehensive Zod schema for laboratory results.
 */
export const LabExtractionSchema = z.object({
  patient: z.object({
    name: z.string().nullable(),
    dob: z.string().nullable(),
    sex: z.string().nullable(),
    id: z.string().nullable(),
  }),
  reportMetadata: z.object({
    labName: z.string().nullable(),
    accessionNumber: z.string().nullable(),
    collectionDate: z.string().nullable(),
    reportDate: z.string().nullable(),
  }),
  observations: z
    .array(
      z.object({
        panel: z.string().nullable(),
        testName: z.string(),
        loincLikeName: z.string().nullable(),
        valueOriginal: z.preprocess((val) => {
          if (typeof val === "string") {
            const n = parseFloat(val);
            return isNaN(n) ? null : n;
          }
          return val;
        }, z.number().nullable()),
        unitOriginal: z.string().nullable(),
        valueCanonical: z.number().nullable(),
        unitCanonical: z.string().nullable(),
        referenceLow: z.number().nullable(),
        referenceHigh: z.number().nullable(),
        flag: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).nullable(),
        page: z.number().nullable(),
        rawText: z.string().nullable(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .default([]),
  issues: z
    .array(
      z.object({
        type: z.string(),
        description: z.string(),
      }),
    )
    .default([]),
});

export type LabExtraction = z.infer<typeof LabExtractionSchema>;

/**
 * Normalizes lab observations to canonical units.
 * - mmol/L glucose -> mg/dL (* 18.0182)
 * - µmol/L creatinine -> mg/dL (* 0.01131)
 * - µmol/L uric acid -> mg/dL (* 0.01681)
 * - g/L albumin -> g/dL (* 0.1)
 * - µmol/L bilirubin -> mg/dL (* 0.05848)
 * - mmol/L cholesterol -> mg/dL (* 38.67)
 * - mmol/L triglycerides -> mg/dL (* 88.57)
 * - mmol/mol HbA1c -> % (/ 10.929 + 2.15)
 */
export function normalizeObservation<
  T extends {
    testName: string;
    unitOriginal?: string | null;
    valueOriginal: any;
    valueCanonical?: number | null;
    unitCanonical?: string | null;
  },
>(obs: T): T {
  const result = { ...obs };
  const unit = (obs.unitOriginal || "").toLowerCase();
  const test = (obs.testName || "").toLowerCase();
  const valRaw =
    typeof obs.valueOriginal === "number"
      ? obs.valueOriginal
      : parseFloat(String(obs.valueOriginal));

  if (isNaN(valRaw)) return result;
  const val = valRaw;

  // Glucose
  if (
    unit.includes("mmol/l") &&
    (test.includes("glucose") || test.includes("glu"))
  ) {
    result.valueCanonical = val * 18.0182;
    result.unitCanonical = "mg/dL";
  }
  // Creatinine
  else if (
    unit.includes("umol/l") &&
    (test.includes("creatinine") || test.includes("creat"))
  ) {
    result.valueCanonical = val * 0.01131;
    result.unitCanonical = "mg/dL";
  }
  // Uric Acid
  else if (
    unit.includes("umol/l") &&
    (test.includes("uric acid") || test.includes("urate"))
  ) {
    result.valueCanonical = val * 0.01681;
    result.unitCanonical = "mg/dL";
  }
  // Albumin
  else if (unit.includes("g/l") && test.includes("albumin")) {
    result.valueCanonical = val * 0.1;
    result.unitCanonical = "g/dL";
  }
  // Bilirubin
  else if (unit.includes("umol/l") && test.includes("bilirubin")) {
    result.valueCanonical = val * 0.05848;
    result.unitCanonical = "mg/dL";
  }
  // Cholesterol
  else if (
    unit.includes("mmol/l") &&
    (test.includes("cholesterol") || test.includes("chol"))
  ) {
    result.valueCanonical = val * 38.67;
    result.unitCanonical = "mg/dL";
  }
  // Triglycerides
  else if (
    unit.includes("mmol/l") &&
    (test.includes("triglyceride") || test.includes("tg"))
  ) {
    result.valueCanonical = val * 88.57;
    result.unitCanonical = "mg/dL";
  }
  // LDL & HDL
  else if (
    unit.includes("mmol/l") &&
    (test.includes("ldl") || test.includes("hdl"))
  ) {
    result.valueCanonical = val * 38.67;
    result.unitCanonical = "mg/dL";
  }
  // HbA1c (mmol/mol to %)
  else if (
    unit.includes("mmol/mol") &&
    (test.includes("hba1c") || test.includes("hemoglobin a1c"))
  ) {
    result.valueCanonical = val * 0.0915 + 2.15;
    result.unitCanonical = "%";
  }
  // Haemoglobin
  else if (unit.includes("g/l") && (test.includes("haemoglobin") || test.includes("hemoglobin") || test.includes("hb"))) {
    result.valueCanonical = val * 0.1;
    result.unitCanonical = "g/dL";
  }
  // Calcium
  else if (unit.includes("mmol/l") && test.includes("calcium")) {
    result.valueCanonical = val * 4.008;
    result.unitCanonical = "mg/dL";
  }
  // Phosphorus
  else if (unit.includes("mmol/l") && test.includes("phosphorus")) {
    result.valueCanonical = val * 3.097;
    result.unitCanonical = "mg/dL";
  }

  return result;
}

export class GeminiQuotaError extends Error {}
export class GeminiInputError extends Error {}
export class GeminiTimeoutError extends Error {}

export async function safeGeminiCall(apiCall: () => Promise<any>, retries = 3, featureName?: string): Promise<any> {
    let attempt = 0;
    while (attempt < retries) {
        try {
            const response = await apiCall();
            
            try {
              if (response?.usageMetadata) {
                 const { auth } = await import("../../lib/firebase/config");
                 const userId = auth?.currentUser?.uid;
                 if (userId) {
                    const { trackUsage } = await import("../usageService");
                    await trackUsage(userId, {
                       promptTokens: response.usageMetadata.promptTokenCount,
                       responseTokens: response.usageMetadata.candidatesTokenCount,
                       totalTokens: response.usageMetadata.totalTokenCount,
                       feature: featureName || 'general'
                    });
                 }
              }
            } catch (err) {
              console.error("Usage tracking failed", err);
            }
            
            return response;
        } catch (error: any) {
            attempt++;
            const isQuotaError =
                error?.status === 429 ||
                error?.code === 429 ||
                error?.status === "RESOURCE_EXHAUSTED" ||
                (error?.message && (error.message.includes("429") || error.message.includes("quota")));
                
            if (isQuotaError && attempt < retries) {
                const backoff = attempt === 1 ? 1000 : attempt === 2 ? 2000 : 4000;
                console.info(JSON.stringify({ event: "gemini_backoff", attempt, delayMs: backoff, status: "429" }));
                await new Promise(resolve => setTimeout(resolve, backoff));
                continue;
            }
            if (isQuotaError) throw new GeminiQuotaError("Final failure: Gemini Quota exceeded after 3 attempts.");
            if (error?.message?.includes("400") || error?.status === 400) throw new GeminiInputError("Invalid argument.");
            if (error?.message?.includes("504") || error?.message?.includes("deadline")) throw new GeminiTimeoutError("Deadline exceeded.");
            throw new Error(`Gemini Call Failed: ${error?.message || 'Unknown error'}`);
        }
    }
}

export async function classifyDocument(filesData: { base64Data: string; mimeType: string }[]) {
  const ai = getAI();
  
  const response = await safeGeminiCall(() => ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: "Classify this document. Return JSON: { \"documentType\": \"lab_report\"|\"prescription\"|\"other\", \"labPanels\": [\"CBC\", \"Lipid\", ...], \"confidence\": number(0-1), \"extractionRecommended\": boolean }" }, ...filesData.map((f) => ({ inlineData: { data: f.base64Data, mimeType: f.mimeType } }))] }
    ],
    config: { temperature: 0, responseMimeType: "application/json" }
  }), 3, "pdf_extraction");
  return safeJsonParse<any>(response.text, {});
}

export async function generateSBAR(patientContextJSON: string, trendSummariesJSON: string, medications: any[], symptoms: any[]) {
  const ai = getAI();
  
  const response = await safeGeminiCall(() => ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: `${CORE_SYSTEM_PROMPT}\n\nGenerate physician-ready SBAR summary in PLAIN TEXT. DO NOT use markdown.\n\nUse EXACTLY these headings: S - SITUATION, B - BACKGROUND, A - ASSESSMENT, R - RECOMMENDATION.\nIn B - BACKGROUND, include the dates of all uploaded reports and all current medications.\n\nPatient Context:\n${patientContextJSON}\n\nTrends:\n${trendSummariesJSON}\n\nMedications:\n${JSON.stringify(medications)}\n\nSymptoms:\n${JSON.stringify(symptoms)}` }] }],
    config: { temperature: 0 }
  }), 3, "sbar");
  
  return response.text || "Failed to generate SBAR summary.";
}

export async function explainInteraction(medicationContext: any) {
  const ai = getAI();
  
  const response = await safeGeminiCall(() => ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: `${CORE_SYSTEM_PROMPT}\n\nExplain this drug-drug interaction JSON: ${JSON.stringify(medicationContext)}` }] }],
    config: { temperature: 0 }
  }), 3, "med_interaction");
  return response.text;
}

/**
 * Extracts laboratory data from medical reports with Zod validation and retry logic.
 */
export async function extractLabData(
  filesData: { base64Data: string; mimeType: string }[],
): Promise<LabExtraction> {
  const ai = getAI();
  const basePrompt = `
    Extract laboratory results into consistent JSON format.
    - Extract ALL rows from ALL lab result tables on ALL pages.
    - If a field is not present in the document, set it to null. Never invent values.
    - For every observation, set confidence between 0 and 1 based on OCR clarity.
    - If the same test appears multiple times on different pages, create separate observation entries with different page values.
    - For flag: compare value to reference range. Set CRITICAL if value is more than 2× above or below normal range. Set null if no reference range is available.
    - Avoid repeating redundant boilerplate words (like "Spectrophotometry") found in the source OCR. Focus only on the essential data.
    - Do not include markdown. Return valid JSON only.

    SCHEMA SPECIFICATION:
    {
      "patient": { "name", "dob", "sex", "id" },
      "reportMetadata": { "labName", "accessionNumber", "collectionDate", "reportDate" },
      "observations": [{
        "panel", "testName", "loincLikeName", "valueOriginal", "unitOriginal", 
        "valueCanonical", "unitCanonical", "referenceLow", "referenceHigh", 
        "flag" (LOW|NORMAL|HIGH|CRITICAL|null), "page", "rawText", "confidence" (0-1)
      }],
      "issues": [{ "type", "description" }]
    }
  `;

  let lastValidationErrors = "";
  let currentPrompt = Object.assign(basePrompt, {}); // Value copy

  for (let attempt = 1; attempt <= 3; attempt++) {
    const finalPrompt = attempt === 1
      ? currentPrompt
      : attempt === 2 
        ? `${currentPrompt}\n\nYour previous response had schema errors: ${lastValidationErrors}. Return corrected JSON matching the schema exactly.`
        : `${currentPrompt}\n\nYour previous response had issues analyzing the document properly: ${lastValidationErrors}. Please fix these and provide correct structured JSON.`;

    try {
      const response = await safeGeminiCall(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: CORE_SYSTEM_PROMPT,
          temperature: 0,
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
        },
        contents: [
          { role: "user", parts: [{ text: finalPrompt }, ...filesData.map((f) => ({ inlineData: { data: f.base64Data, mimeType: f.mimeType } }))] }
        ],
      }), 3, "pdf_extraction");

      const parsed = safeJsonParse<any>(response.text, {});

      const validationResult = LabExtractionSchema.safeParse(parsed);

      if (!validationResult.success) {
        lastValidationErrors = JSON.stringify(validationResult.error.format());
        console.warn(
          `Lab extraction validation failed (attempt ${attempt}):`,
          lastValidationErrors,
        );
        if (attempt < 2) continue; // retry for schema errors
        throw new Error(`Validation Error: ${lastValidationErrors}`);
      }

      let validatedData = validationResult.data;

      if (validatedData.issues.length > 0 && attempt < 3) {
        lastValidationErrors = JSON.stringify(validatedData.issues);
        continue; // attempt 3 to re-process flagged issues
      }

      // Apply normalization to observations capturing original string correctly
      validatedData.observations = validatedData.observations.map(obs => {
        // if original was missing, or non-numeric string preserve as rawText and valueCanonical null (from req)
        if (obs.valueOriginal == null && typeof obs.rawText === "string") {
           // handled by Zod coercing to null already.
        }
        return normalizeObservation(obs);
      });

      return validatedData;
    } catch (err: any) {
      if (attempt < 2 && !lastValidationErrors) {
        lastValidationErrors = err.message;
        continue;
      }
      if (attempt === 3) throw new Error(`Lab extraction failed: ${err.message}`);
    }
  }

  throw new Error("Unexpected end of extraction loop.");
}
