import { describe, it, expect } from "vitest";
import { COACH_SYSTEM_INSTRUCTION, buildCoachPromptAugmentation } from "./coachService";
import { renderCitationLink } from "../../components/Common/CitationBadge";
import { WearableBiometrics } from "../../types/wearables";
import { BiometricDiagnosticCorrelation } from "../biometricDiagnosticEngine";

describe("Coach Service System Prompt Safety Guardrails & Baseline Rules", () => {
  it("should contain mandatory clinical safety rules", () => {
    expect(COACH_SYSTEM_INSTRUCTION).toContain("NEVER diagnose conditions or prescribe medications");
    expect(COACH_SYSTEM_INSTRUCTION).toContain("ALWAYS recommend consulting a healthcare professional for medical decisions");
    expect(COACH_SYSTEM_INSTRUCTION).toContain("I cannot diagnose you. Please consult a doctor.");
    expect(COACH_SYSTEM_INSTRUCTION).toContain("Flag critical values");
  });

  it("should contain edge case handling rules", () => {
    expect(COACH_SYSTEM_INSTRUCTION).toContain("Conflicting values");
    expect(COACH_SYSTEM_INSTRUCTION).toContain("Missing markers");
    expect(COACH_SYSTEM_INSTRUCTION).toContain("Extreme outliers");
  });

  it("should contain default dual-source citation rules in COACH_SYSTEM_INSTRUCTION", () => {
    expect(COACH_SYSTEM_INSTRUCTION).toContain("MANDATORY DUAL-SOURCE ATTRIBUTION RULES");
    expect(COACH_SYSTEM_INSTRUCTION).toContain("cite:wearable_hr_steps");
    expect(COACH_SYSTEM_INSTRUCTION).toContain("cite:lab_report");
    expect(COACH_SYSTEM_INSTRUCTION).toContain("cite:imaging_finding");
    expect(COACH_SYSTEM_INSTRUCTION).toContain("cite:correlation_matrix");
  });
});

describe("Prompt Context Enrichment & Augmentation (Milestone 3)", () => {
  const mockWearables: WearableBiometrics = {
    id: "telemetry-test-1",
    userId: "user-test-1",
    timestamp: new Date().toISOString(),
    heartRate: 74,
    rhr: 62,
    hrv: 58,
    spo2: 98,
    steps: 8200,
    sleep: {
      totalMinutes: 480,
      deepMinutes: 110,
      remMinutes: 115,
      lightMinutes: 255,
      sleepScore: 85,
    },
    connectionStatus: "connected",
  };

  const mockCorrelation: BiometricDiagnosticCorrelation = {
    readinessScore: 88,
    metabolicAdaptations: [
      {
        ruleId: "METABOLIC_HBA1C_ELEVATED",
        condition: "HbA1c elevated (6.8%)",
        action: "Incorporate post-meal 15-min walk nudges",
        targetZone: "Zone 2 (60-70% max HR)",
        postMealWalkNudge: true,
        evidence: "[Source: Lab Report] HbA1c: 6.8%",
      },
    ],
    recoveryOverrides: [
      {
        active: true,
        reason: "Low iron storage detected",
        strainReductionPercent: 40,
        recommendedRhrCeiling: 110,
        evidence: "[Source: Lab Report] Ferritin: 18 ng/mL",
      },
    ],
    activityFilters: [
      {
        restrictedActivities: ["running", "heavy squatting"],
        recommendedActivities: ["swimming", "cycling"],
        anatomicalTarget: "Lumbar Spine",
        evidence: "[Source: Imaging Finding] L4-L5 disc herniation",
      },
    ],
    safetyAlerts: [],
    summaryMarkdown: "# Biometric-Diagnostic Correlation Summary",
  };

  it("should enrich system prompt context with WearableBiometrics snapshot and BiometricDiagnosticCorrelation outputs", () => {
    const promptAugmentation = buildCoachPromptAugmentation(mockWearables, mockCorrelation);

    expect(promptAugmentation).toContain("Current Wearable Biometrics Snapshot");
    expect(promptAugmentation).toContain("Resting HR: 62 bpm");
    expect(promptAugmentation).toContain("HRV: 58 ms");
    expect(promptAugmentation).toContain("SpO2: 98%");
    expect(promptAugmentation).toContain("Sleep Score: 85/100");

    expect(promptAugmentation).toContain("Dynamic Readiness Score: 88/100");
    expect(promptAugmentation).toContain("HbA1c elevated (6.8%)");
    expect(promptAugmentation).toContain("Low iron storage detected");
    expect(promptAugmentation).toContain("Target: Lumbar Spine");
  });

  it("should enforce mandatory dual-source attribution instructions in prompt augmentation", () => {
    const promptAugmentation = buildCoachPromptAugmentation(mockWearables, mockCorrelation);

    expect(promptAugmentation).toContain("MANDATORY DUAL-SOURCE ATTRIBUTION & CITATION RULES");
    expect(promptAugmentation).toContain("[Source: Wearable HR/Steps](cite:wearable_hr_steps)");
    expect(promptAugmentation).toContain("[Source: Lab Report](cite:lab_report)");
    expect(promptAugmentation).toContain("[Source: Imaging Finding](cite:imaging_finding)");
    expect(promptAugmentation).toContain("[Source: Wearable + Lab Correlation](cite:correlation_matrix)");
  });

  it("should inject Tachycardia triage alert when Resting HR exceeds 100 bpm", () => {
    const tachycardicWearables: WearableBiometrics = {
      ...mockWearables,
      rhr: 108,
      heartRate: 112,
    };

    const promptAugmentation = buildCoachPromptAugmentation(tachycardicWearables, mockCorrelation);

    expect(promptAugmentation).toContain("URGENT CLINICAL ALERT: Tachycardia detected");
    expect(promptAugmentation).toContain("Resting HR = 108 bpm > 100 bpm");
    expect(promptAugmentation).toContain("REST IMMEDIATELY");
    expect(promptAugmentation).toContain("[Source: Wearable HR/Steps](cite:wearable_rhr)");
  });

  it("should inject Hypoxia triage alert when SpO2 drops below 92%", () => {
    const hypoxicWearables: WearableBiometrics = {
      ...mockWearables,
      spo2: 89,
    };

    const promptAugmentation = buildCoachPromptAugmentation(hypoxicWearables, mockCorrelation);

    expect(promptAugmentation).toContain("URGENT CLINICAL ALERT: Hypoxia detected");
    expect(promptAugmentation).toContain("SpO2 = 89% < 92%");
    expect(promptAugmentation).toContain("REST IMMEDIATELY");
    expect(promptAugmentation).toContain("[Source: Wearable HR/Steps](cite:wearable_spo2)");
  });
});

describe("CitationBadge Parser Logic (Milestone 3)", () => {
  it("should parse cite:wearable_* URIs into cyan pill badges", () => {
    const element = renderCitationLink({
      href: "cite:wearable_hr_steps",
      children: "[Source: Wearable HR/Steps]",
    });

    expect(element).toBeDefined();
    expect(element.props.className).toContain("bg-cyan-50");
    expect(element.props.title).toContain("Wearable Biometrics Telemetry");
  });

  it("should parse cite:lab_* and cite:imaging_* URIs into purple pill badges", () => {
    const labElement = renderCitationLink({
      href: "cite:lab_report",
      children: "[Source: Lab Report]",
    });

    expect(labElement).toBeDefined();
    expect(labElement.props.className).toContain("bg-purple-50");
    expect(labElement.props.title).toContain("Lab Report / Diagnostic Imaging Finding");

    const imagingElement = renderCitationLink({
      href: "cite:imaging_finding",
      children: "[Source: Imaging Finding]",
    });

    expect(imagingElement).toBeDefined();
    expect(imagingElement.props.className).toContain("bg-purple-50");
  });

  it("should parse cite:correlation_* URIs into amber pill badges", () => {
    const correlationElement = renderCitationLink({
      href: "cite:correlation_matrix",
      children: "[Source: Wearable + Lab Correlation]",
    });

    expect(correlationElement).toBeDefined();
    expect(correlationElement.props.className).toContain("bg-amber-50");
    expect(correlationElement.props.title).toContain("Wearable + Lab Cross-Correlation Matrix");
  });
});
