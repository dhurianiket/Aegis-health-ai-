import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  transcribeAndScribeAmbientOpd,
  generateHeuristicScribe,
} from "../indicAmbientScribeService";
import { __setNimFetchForTests } from "../nvidiaNimService";

describe("Indic Vernacular Ambient OPD Scribe (Pillar 5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    __setNimFetchForTests(null);
  });

  it("should transcribe and translate Hindi/Hinglish clinical conversation into structured SOAP & SBAR via NVIDIA NIM", async () => {
    const mockNimResponse = {
      detectedLanguage: "Hindi / Hinglish",
      englishMedicalTranslation: "Patient presents with retrosternal burning sensation and palpitations for 3 days. Also experiencing dry cough.",
      soapNotes: {
        subjective: "Patient reports 3-day history of retrosternal pyrosis and palpitations without radiation to left arm. Intermittent dry nocturnal cough.",
        objective: "Attending notes pulse regular at 84 bpm, normotensive, chest clear on auscultation.",
        assessment: "Gastroesophageal Reflux Disease (GERD) with possible reactive airway irritation.",
        plan: "Prescribe PPI therapy (Pantoprazole 40mg OD AC) for 14 days, lifestyle modifications, and follow-up in 2 weeks.",
      },
      sbarSummary: {
        situation: "45-year-old male with persistent retrosternal chest burn and cough.",
        background: "Outpatient visit, no prior coronary artery disease history.",
        assessment: "Stable vitals, presentation clinically consistent with GERD / acid peptic disease.",
        recommendation: "Trial of proton pump inhibitors, review with physician if symptoms persist or exertional dyspnea occurs.",
      },
      extractedVitals: {
        bloodPressure: "128/82 mmHg",
        heartRate: 84,
        temperature: "98.6 F",
        symptoms: ["Retrosternal pyrosis", "Palpitations", "Dry cough"],
        medicationsMentioned: ["Pantoprazole 40mg"],
      },
    };

    __setNimFetchForTests(
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          model: "nvidia/nemotron-3.5-bolt-e4b",
          choices: [{ message: { content: JSON.stringify(mockNimResponse) } }],
        }),
      } as unknown as Response),
    );

    const result = await transcribeAndScribeAmbientOpd({
      rawTranscript: "Doctor sahab 3 din se seene me jalan aur dhaddhad ho rahi hai, aur thoda khasi bhi hai.",
      sourceLanguageHint: "Hindi / Hinglish",
    });

    expect(result.detectedLanguage).toBe("Hindi / Hinglish");
    expect(result.englishMedicalTranslation).toContain("retrosternal burning");
    expect(result.soapNotes.subjective).toContain("retrosternal pyrosis");
    expect(result.soapNotes.assessment).toContain("GERD");
    expect(result.sbarSummary.situation).toContain("45-year-old male");
    expect(result.extractedVitals.symptoms).toContain("Retrosternal pyrosis");
    expect(result.extractedVitals.medicationsMentioned).toContain("Pantoprazole 40mg");
    expect(result.audioEngine).toBe("NVIDIA Nemotron Indic Vernacular Scribe");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("should process Marathi vernacular clinical dialogue accurately", async () => {
    const mockMarathiResponse = {
      detectedLanguage: "Marathi",
      englishMedicalTranslation: "Patient complains of chest discomfort, palpitation, and intermittent high-grade fever since yesterday.",
      soapNotes: {
        subjective: "Patient presents with acute chest discomfort, tachycardia sensations, and fever for 24 hours.",
        objective: "Febrile, clinical examination pending.",
        assessment: "Febrile illness with sinus tachycardia / systemic response.",
        plan: "Order CBC, Dengue NS1 antigen, advise paracetamol and adequate hydration.",
      },
      sbarSummary: {
        situation: "Patient with acute febrile presentation and palpitations.",
        background: "No known chronic illnesses.",
        assessment: "Acute onset pyrexia with compensatory tachycardia.",
        recommendation: "Perform baseline blood work and evaluate for acute viral vs bacterial etiology.",
      },
      extractedVitals: {
        bloodPressure: null,
        heartRate: 98,
        temperature: "101.4 F",
        symptoms: ["Pyrexia", "Tachycardia", "Chest discomfort"],
        medicationsMentioned: ["Paracetamol 650mg"],
      },
    };

    __setNimFetchForTests(
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          model: "nvidia/nemotron-3.5-bolt-e4b",
          choices: [{ message: { content: JSON.stringify(mockMarathiResponse) } }],
        }),
      } as unknown as Response),
    );

    const result = await transcribeAndScribeAmbientOpd({
      rawTranscript: "मला छातीत खूप धडधड वाटतेय आणि कालपासून जोरात ताप आलाय.",
      sourceLanguageHint: "Marathi",
    });

    expect(result.detectedLanguage).toBe("Marathi");
    expect(result.extractedVitals.symptoms).toContain("Pyrexia");
    expect(result.soapNotes.plan).toContain("CBC");
  });

  it("should fall back gracefully to heuristic scribe when NIM encounters an error", async () => {
    __setNimFetchForTests(
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => "Service Unavailable",
      } as unknown as Response),
    );

    const result = await transcribeAndScribeAmbientOpd({
      rawTranscript: "Doctor sahab 2 din se tez bukhar aur khansi hai.",
    });

    expect(result.audioEngine).toBe("Indic Vernacular Heuristic Fallback");
    expect(result.extractedVitals.symptoms).toEqual(
      expect.arrayContaining(["Pyrexia (Fever)", "Cough / Respiratory irritation"]),
    );
    expect(result.soapNotes.subjective).toContain("tez bukhar aur khansi hai");
    expect(result.sbarSummary.recommendation).toContain("Review vital signs");
  });

  it("should handle empty or whitespace-only audio transcript with immediate heuristic response", async () => {
    const result = await transcribeAndScribeAmbientOpd({
      rawTranscript: "   ",
    });

    expect(result.audioEngine).toBe("Indic Vernacular Heuristic Fallback");
    expect(result.rawTranscript).toContain("No speech or audio transcript provided");
  });

  it("should accurately extract Marathi symptoms in heuristic mode", () => {
    const heuristic = generateHeuristicScribe("मला छातीत खूप दुखतेय आणि पोटात पण दुखत आहे, ताप पण आहे.");
    expect(heuristic.extractedVitals.symptoms).toContain("Chest Discomfort / Palpitations");
    expect(heuristic.extractedVitals.symptoms).toContain("Abdominal Pain / Gastric Distress");
    expect(heuristic.extractedVitals.symptoms).toContain("Pyrexia (Fever)");
  });
});
