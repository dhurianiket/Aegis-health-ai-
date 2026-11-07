/**
 * Indic Vernacular Ambient OPD Scribe
 * 
 * Powered by NVIDIA NIM (Nemotron-3.5-Bolt & Riva Multilingual Intelligence)
 * 
 * Converts doctor-patient clinical conversations in Hindi (हिंदी), Marathi (मराठी),
 * Tamil (தமிழ்), Telugu (తెలుగు), English, and colloquial Hinglish / vernacular code-mixing
 * into formal, structured medical documentation:
 * 1. English Medical Translation of colloquial idioms & symptoms
 * 2. Standardized SOAP Note (Subjective, Objective, Assessment, Plan)
 * 3. Hospital Inter-Provider SBAR Summary (Situation, Background, Assessment, Recommendation)
 * 4. Structured Clinical Entities (Vitals, Symptoms with severity, Prescribed Medications)
 */

import { converseNim, NVIDIA_MODELS } from "./nvidiaNimService";
import { safeJsonParse } from "../../utils/aiUtils";

export interface IndicSoapNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface IndicSbarSummary {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
}

export interface IndicExtractedVitals {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: string;
  symptoms: string[];
  medicationsMentioned: string[];
}

export interface IndicScribeResult {
  rawTranscript: string;
  detectedLanguage: string;
  englishMedicalTranslation: string;
  soapNotes: IndicSoapNotes;
  sbarSummary: IndicSbarSummary;
  extractedVitals: IndicExtractedVitals;
  audioEngine: string;
  latencyMs: number;
}

const INDIC_SCRIBE_SYSTEM_PROMPT = `You are a Senior Ambient OPD Clinical Scribe specializing in Indian multilingual healthcare documentation (Hindi, Marathi, Tamil, Telugu, English, and Hinglish).

YOUR TASKS:
1. Detect Language: Identify the dominant Indian language/code-mixed dialect (e.g. "Hindi / Hinglish", "Marathi", "Tamil", "Telugu", "Indian English").
2. Translation: Translate colloquial symptom descriptions and vernacular idioms into formal medical English terminology (e.g., "छातीत जळजळ आणि धडधड" -> "Retrosternal pyrosis and palpitations").
3. SOAP Notes:
   - Subjective: Chief complaint, history of present illness, patient reported symptoms.
   - Objective: Clinical findings, vitals mentioned, examination observations.
   - Assessment: Primary working diagnosis, stability status.
   - Plan: Investigations ordered, treatment regimen, follow-up instructions.
4. SBAR Summary: Standard concise Situation, Background, Assessment, Recommendation.
5. Entity Extraction: Vitals, structured symptoms list, and medications mentioned.

OUTPUT FORMAT:
Respond with valid JSON matching this schema:
{
  "detectedLanguage": string,
  "englishMedicalTranslation": string,
  "soapNotes": {
    "subjective": string,
    "objective": string,
    "assessment": string,
    "plan": string
  },
  "sbarSummary": {
    "situation": string,
    "background": string,
    "assessment": string,
    "recommendation": string
  },
  "extractedVitals": {
    "bloodPressure": string or null,
    "heartRate": number or null,
    "temperature": string or null,
    "symptoms": string[],
    "medicationsMentioned": string[]
  }
}`;

/**
 * Heuristic fallback parser if NIM service is unavailable
 */
export function generateHeuristicScribe(
  rawTranscript: string,
  detectedLanguage = "Indian Multilingual (Heuristic)"
): IndicScribeResult {
  const norm = rawTranscript.toLowerCase();
  const symptoms: string[] = [];
  const meds: string[] = [];

  // Vernacular keyword mapping (Devanagari, English, and Romanized Hinglish/Marathi)
  if (
    norm.includes("छातीत") ||
    norm.includes("सीने") ||
    norm.includes("seene") ||
    norm.includes("chest") ||
    norm.includes("धडधड") ||
    norm.includes("dhadkan") ||
    norm.includes("jalan")
  ) {
    symptoms.push("Chest Discomfort / Palpitations");
  }
  if (
    norm.includes("ताप") ||
    norm.includes("fever") ||
    norm.includes("बुखार") ||
    norm.includes("bukhar")
  ) {
    symptoms.push("Pyrexia (Fever)");
  }
  if (
    norm.includes("खोकला") ||
    norm.includes("cough") ||
    norm.includes("खांसी") ||
    norm.includes("khansi") ||
    norm.includes("khasi")
  ) {
    symptoms.push("Cough / Respiratory irritation");
  }
  if (
    norm.includes("पोटात") ||
    norm.includes("stomach") ||
    norm.includes("पेन") ||
    norm.includes("दर्द") ||
    norm.includes("dard") ||
    norm.includes("pet") ||
    norm.includes("pait")
  ) {
    symptoms.push("Abdominal Pain / Gastric Distress");
  }
  if (
    norm.includes("श्वास") ||
    norm.includes("सांस") ||
    norm.includes("saans") ||
    norm.includes("breath") ||
    norm.includes("dum")
  ) {
    symptoms.push("Dyspnea / Breathlessness");
  }
  if (
    norm.includes("डोके") ||
    norm.includes("सरदर्द") ||
    norm.includes("sir dard") ||
    norm.includes("headache")
  ) {
    symptoms.push("Cephalea / Headache");
  }

  return {
    rawTranscript,
    detectedLanguage,
    englishMedicalTranslation: `Patient reports: ${rawTranscript}. Symptoms include: ${symptoms.join(", ") || "General discomfort"}.`,
    soapNotes: {
      subjective: `Patient presents with self-reported complaints: ${rawTranscript}.`,
      objective: "Physical exam and vital signs deferred to attending clinician.",
      assessment: `Clinical presentation suggestive of: ${symptoms[0] || "Undifferentiated presentation"}.`,
      plan: "Proceed with clinical review and baseline diagnostic workup.",
    },
    sbarSummary: {
      situation: `OPD consultation regarding: ${symptoms[0] || "General consultation"}.`,
      background: "Ambulatory outpatient visit.",
      assessment: `Patient reports ${symptoms.join(", ") || "clinical symptoms"}.`,
      recommendation: "Review vital signs, consider targeted labs, and provide physician evaluation.",
    },
    extractedVitals: {
      symptoms: symptoms.length ? symptoms : ["Unspecified Symptom"],
      medicationsMentioned: meds,
    },
    audioEngine: "Indic Vernacular Heuristic Fallback",
    latencyMs: 1,
  };
}

/**
 * Transcribes and generates structured medical SOAP/SBAR documentation
 * from Indic vernacular doctor-patient conversations.
 */
export async function transcribeAndScribeAmbientOpd(params: {
  rawTranscript: string;
  sourceLanguageHint?: string;
  patientContext?: string;
  signal?: AbortSignal;
}): Promise<IndicScribeResult> {
  const startTime = Date.now();
  const rawText = params.rawTranscript.trim();

  if (!rawText) {
    return generateHeuristicScribe("No speech or audio transcript provided.");
  }

  const queryPayload = {
    conversationText: rawText,
    languageHint: params.sourceLanguageHint || "Auto-detect Indic Vernacular (Hindi / Marathi / Tamil / Telugu / Hinglish)",
    patientBackground: params.patientContext || "Outpatient general medical consultation",
  };

  try {
    const nimResponse = await converseNim({
      model: NVIDIA_MODELS.NEMOTRON_BOLT || NVIDIA_MODELS.NEMOTRON_70B,
      messages: [
        { role: "system", content: INDIC_SCRIBE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze and scribe the following outpatient doctor-patient dialogue:\n\n${JSON.stringify(queryPayload, null, 2)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: "json_object" },
      signal: params.signal,
    });

    const parsed = safeJsonParse<Partial<IndicScribeResult>>(nimResponse.text, {});

    return {
      rawTranscript: rawText,
      detectedLanguage: parsed.detectedLanguage || "Indic Multilingual",
      englishMedicalTranslation: parsed.englishMedicalTranslation || rawText,
      soapNotes: parsed.soapNotes || {
        subjective: rawText,
        objective: "Vitals recorded in EHR",
        assessment: "Clinical evaluation in progress",
        plan: "Physician follow-up",
      },
      sbarSummary: parsed.sbarSummary || {
        situation: "Outpatient clinical consultation",
        background: "Ambulatory OPD encounter",
        assessment: "Evaluated by AI Clinical Scribe",
        recommendation: "Review with attending physician",
      },
      extractedVitals: parsed.extractedVitals || {
        symptoms: [],
        medicationsMentioned: [],
      },
      audioEngine: "NVIDIA Nemotron Indic Vernacular Scribe",
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    console.warn("[IndicAmbientScribe] NIM call failed, falling back to heuristic scribe:", err?.message);
    const fallback = generateHeuristicScribe(rawText);
    fallback.latencyMs = Date.now() - startTime;
    return fallback;
  }
}
