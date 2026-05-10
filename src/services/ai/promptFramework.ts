import { z } from 'zod';
import { GoogleGenAI } from '../../lib/geminiClient';

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
  observations: z.array(z.object({
    panel: z.string().nullable(),
    testName: z.string(),
    loincLikeName: z.string().nullable(),
    valueOriginal: z.preprocess(
      (val) => {
        if (typeof val === 'string') {
          const n = parseFloat(val);
          return isNaN(n) ? null : n;
        }
        return val;
      },
      z.number().nullable()
    ),
    unitOriginal: z.string().nullable(),
    valueCanonical: z.number().nullable(),
    unitCanonical: z.string().nullable(),
    referenceLow: z.number().nullable(),
    referenceHigh: z.number().nullable(),
    flag: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).nullable(),
    page: z.number().nullable(),
    rawText: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  })).default([]),
  issues: z.array(z.object({
    type: z.string(),
    description: z.string(),
  })).default([]),
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
export function normalizeObservation<T extends { testName: string; unitOriginal?: string | null; valueOriginal: any; valueCanonical?: number | null; unitCanonical?: string | null }>(obs: T): T {
  const result = { ...obs };
  const unit = (obs.unitOriginal || "").toLowerCase();
  const test = (obs.testName || "").toLowerCase();
  const valRaw = typeof obs.valueOriginal === 'number' ? obs.valueOriginal : parseFloat(String(obs.valueOriginal));

  if (isNaN(valRaw)) return result;
  const val = valRaw;

  // Glucose
  if (unit.includes("mmol/l") && (test.includes("glucose") || test.includes("glu"))) {
    result.valueCanonical = val * 18.0182;
    result.unitCanonical = "mg/dL";
  }
  // Creatinine
  else if (unit.includes("umol/l") && (test.includes("creatinine") || test.includes("creat"))) {
    result.valueCanonical = val * 0.01131;
    result.unitCanonical = "mg/dL";
  }
  // Uric Acid
  else if (unit.includes("umol/l") && (test.includes("uric acid") || test.includes("urate"))) {
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
  else if (unit.includes("mmol/l") && (test.includes("cholesterol") || test.includes("chol"))) {
    result.valueCanonical = val * 38.67;
    result.unitCanonical = "mg/dL";
  }
  // Triglycerides
  else if (unit.includes("mmol/l") && (test.includes("triglyceride") || test.includes("tg"))) {
    result.valueCanonical = val * 88.57;
    result.unitCanonical = "mg/dL";
  }
  // HbA1c (mmol/mol to %)
  else if ((unit.includes("mmol/mol")) && (test.includes("hba1c") || test.includes("hemoglobin a1c"))) {
    result.valueCanonical = (val / 10.929) + 2.15;
    result.unitCanonical = "%";
  }

  return result;
}

/**
 * Extracts laboratory data from medical reports with Zod validation and retry logic.
 */
export async function extractLabData(
  filesData: { base64Data: string; mimeType: string }[]
): Promise<LabExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const basePrompt = `
    Extract laboratory results into consistent JSON format.
    
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

  for (let attempt = 1; attempt <= 2; attempt++) {
    const finalPrompt = attempt === 1 
      ? basePrompt 
      : `${basePrompt}\n\nYour previous response had schema errors: ${lastValidationErrors}. Return corrected JSON matching the schema exactly.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { text: finalPrompt },
          ...filesData.map(f => ({ inlineData: { data: f.base64Data, mimeType: f.mimeType } }))
        ],
        config: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      
      const validationResult = LabExtractionSchema.safeParse(parsed);
      
      if (!validationResult.success) {
        lastValidationErrors = JSON.stringify(validationResult.error.format());
        console.warn(`Lab extraction validation failed (attempt ${attempt}):`, lastValidationErrors);
        if (attempt === 1) continue;
        throw new Error(`Validation Error: ${lastValidationErrors}`);
      }

      const validatedData = validationResult.data;
      
      // Apply normalization to observations
      validatedData.observations = validatedData.observations.map(normalizeObservation);
      
      return validatedData;
    } catch (err: any) {
      if (attempt === 1 && !lastValidationErrors) {
        lastValidationErrors = err.message;
        continue;
      }
      throw new Error(`Lab extraction failed: ${err.message}`);
    }
  }

  throw new Error("Unexpected end of extraction loop.");
}
