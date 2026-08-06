import { getAI } from "../../lib/geminiClient";
import { PatientContext } from "../../types/ai";
import { formatContextForPrompt } from "./contextService";
import { runSafetyCheck } from "./safetyGuardrail";
import { CORE_SYSTEM_PROMPT } from "./promptFramework";
import { getFriendlyErrorMessage } from "../../utils/aiUtils";
import { WearableBiometrics } from "../../types/wearables";
import { BiometricDiagnosticCorrelation } from "../biometricDiagnosticEngine";

export const COACH_SYSTEM_INSTRUCTION = `${CORE_SYSTEM_PROMPT}

<task>
Explain the provided health summary in simple language for a patient with no medical background.
Use reassuring but accurate language.
Do not minimize urgent findings.
Do not overstate certainty.
Answer the user's questions based purely on their telemetry and provided context.
</task>

<audience>
Patient
</audience>

<reading_level>
Grade 6 to 8
</reading_level>

<clinical_safety_rules>
- NEVER diagnose conditions or prescribe medications
- ALWAYS recommend consulting a healthcare professional for medical decisions
- If user asks for diagnosis, respond: "I cannot diagnose you. Please consult a doctor."
- Flag critical values (e.g., HbA1c > 12, LDL > 190) with urgent warning
- TACHYCARDIA RULE: If resting heart rate exceeds 100 bpm, issue urgent triage alert to rest immediately and seek medical evaluation.
- HYPOXIA RULE: If blood oxygen saturation (SpO2) falls below 92%, issue urgent triage alert to rest immediately and seek medical evaluation.
</clinical_safety_rules>

<edge_case_handling>
- Conflicting values: If labs contradict, note the discrepancy and suggest physician review.
- Missing markers: If asked about a marker not provided, cleanly state it is missing from the data.
- Extreme outliers: Flag immediately and strongly urge medical attention without assuming lab error.
</edge_case_handling>

<additional_instructions>
1. ALWAYS cite the specific data point you are referencing (e.g., "Your fasting glucose was 115 mg/dL on Oct 10").
2. ALWAYS use the exact provided historical values (e.g., if a value is "< 0.1", use "< 0.1" rather than "0").
3. Provide actionable, evidence-based lifestyle suggestions (diet, exercise, sleep) related to their lab results.
4. Be empathetic but professional and clinical in tone.
5. MANDATORY DUAL-SOURCE ATTRIBUTION RULES: Require responses to cite wearable metrics ([Source: Wearable HR/Steps]), lab panels ([Source: Lab Report]), and imaging findings ([Source: Imaging Finding]) using markdown citation tags:
   - Wearable HR/Steps: [Source: Wearable HR/Steps](cite:wearable_hr_steps)
   - Lab Report: [Source: Lab Report](cite:lab_report)
   - Imaging Finding: [Source: Imaging Finding](cite:imaging_finding)
   - Wearable + Lab Correlation: [Source: Wearable + Lab Correlation](cite:correlation_matrix)
</additional_instructions>
`;

/**
 * Augments AI Health Coach system prompt with wearable telemetry, biometric-diagnostic correlation matrix outputs,
 * mandatory dual-source attribution instructions, and clinical safety triage alerts.
 */
export function buildCoachPromptAugmentation(
  wearables?: WearableBiometrics,
  correlation?: BiometricDiagnosticCorrelation
): string {
  let augmentation = `\n\n### WEARABLE BIOMETRICS & DIAGNOSTIC CORRELATION GROUNDING\n`;

  if (wearables) {
    augmentation += `#### Current Wearable Biometrics Snapshot:\n`;
    augmentation += `- Heart Rate: ${wearables.heartRate ?? "N/A"} bpm | Resting HR: ${wearables.rhr ?? "N/A"} bpm | HRV: ${wearables.hrv ?? "N/A"} ms\n`;
    augmentation += `- SpO2: ${wearables.spo2 ?? "N/A"}% | Steps: ${wearables.steps ?? "N/A"}\n`;
    augmentation += `- Sleep Architecture: Total ${wearables.sleep?.totalMinutes ?? 0}m (Deep: ${wearables.sleep?.deepMinutes ?? 0}m, REM: ${wearables.sleep?.remMinutes ?? 0}m, Light: ${wearables.sleep?.lightMinutes ?? 0}m) | Sleep Score: ${wearables.sleep?.sleepScore ?? 0}/100\n`;
  }

  if (correlation) {
    augmentation += `\n#### Biometric-Diagnostic Correlation Matrix:\n`;
    augmentation += `- Dynamic Readiness Score: ${correlation.readinessScore}/100\n`;

    if (correlation.metabolicAdaptations && correlation.metabolicAdaptations.length > 0) {
      augmentation += `- Metabolic Adaptations:\n`;
      correlation.metabolicAdaptations.forEach((m) => {
        augmentation += `  * ${m.condition}: ${m.action} (Target: ${m.targetZone}) ${m.evidence}\n`;
      });
    }

    if (correlation.recoveryOverrides && correlation.recoveryOverrides.length > 0) {
      augmentation += `- Recovery Overrides:\n`;
      correlation.recoveryOverrides.forEach((r) => {
        augmentation += `  * ${r.reason} (Strain Reduction: ${r.strainReductionPercent}%, RHR Ceiling: ${r.recommendedRhrCeiling} bpm) ${r.evidence}\n`;
      });
    }

    if (correlation.activityFilters && correlation.activityFilters.length > 0) {
      augmentation += `- Activity Filters & Restrictions:\n`;
      correlation.activityFilters.forEach((a) => {
        augmentation += `  * Target: ${a.anatomicalTarget} | Restricted: ${a.restrictedActivities.join(", ")} | Recommended: ${a.recommendedActivities.join(", ")} ${a.evidence}\n`;
      });
    }

    if (correlation.safetyAlerts && correlation.safetyAlerts.length > 0) {
      augmentation += `- Safety Triage Alerts:\n`;
      correlation.safetyAlerts.forEach((s) => {
        augmentation += `  * [${s.severity.toUpperCase()}] ${s.metric}: ${s.message} ${s.source}\n`;
      });
    }

    if (correlation.summaryMarkdown) {
      augmentation += `\nCross-Correlation Summary Matrix:\n${correlation.summaryMarkdown}\n`;
    }
  }

  augmentation += `\n### MANDATORY DUAL-SOURCE ATTRIBUTION & CITATION RULES\n`;
  augmentation += `You MUST cite all data points and recommendations using exact markdown citation tags:\n`;
  augmentation += `- Wearable Telemetry (Heart Rate, HRV, SpO2, Steps, Sleep): Cite as \`[Source: Wearable HR/Steps](cite:wearable_hr_steps)\` (or \`cite:wearable_...\` tags)\n`;
  augmentation += `- Lab Reports & Panels (HbA1c, Glucose, Ferritin, hs-CRP, etc.): Cite as \`[Source: Lab Report](cite:lab_report)\` (or \`cite:lab_...\` tags)\n`;
  augmentation += `- Diagnostic Imaging Findings (Spine, Joint, Cartilage MRI/CT): Cite as \`[Source: Imaging Finding](cite:imaging_finding)\` (or \`cite:imaging_...\` tags)\n`;
  augmentation += `- Cross-Correlated Insights (Wearable + Lab Correlation): Cite as \`[Source: Wearable + Lab Correlation](cite:correlation_matrix)\` (or \`cite:correlation_...\` tags)\n`;

  augmentation += `\n### CLINICAL SAFETY TRIAGE RULES\n`;
  augmentation += `- TACHYCARDIA RULE (Resting HR > 100 bpm): Flag resting heart rate spikes immediately. Recommend physical rest and urgent medical evaluation.\n`;
  augmentation += `- HYPOXIA RULE (SpO2 < 92%): Flag sub-normal oxygen saturation immediately. Urgent instruction for physical rest and medical evaluation.\n`;

  // Check active biometrics / correlation for immediate triage alert injection
  const rhr = wearables?.rhr ?? wearables?.heartRate ?? 0;
  const spo2 = wearables?.spo2 ?? 100;
  if (rhr > 100) {
    augmentation += `\n🚨 URGENT CLINICAL ALERT: Tachycardia detected (Resting HR = ${rhr} bpm > 100 bpm). Urge patient to REST IMMEDIATELY and seek medical evaluation. [Source: Wearable HR/Steps](cite:wearable_rhr)\n`;
  }
  if (spo2 > 0 && spo2 < 92) {
    augmentation += `\n🚨 URGENT CLINICAL ALERT: Hypoxia detected (SpO2 = ${spo2}% < 92%). Urge patient to REST IMMEDIATELY and seek emergency medical evaluation. [Source: Wearable HR/Steps](cite:wearable_spo2)\n`;
  }

  return augmentation;
}

export interface CoachResponse {
  content: string;
  isSafe: boolean;
  flags: string[];
}

export const getCoachResponse = async (
  context: PatientContext,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  signal?: AbortSignal,
  isSummaryRequest?: boolean,
  wearables?: WearableBiometrics,
  correlation?: BiometricDiagnosticCorrelation
): Promise<AsyncGenerator<string>> => {
  const ai = getAI();
  const patientDataPrompt = formatContextForPrompt(context);

  let systemInstruction = COACH_SYSTEM_INSTRUCTION;
  if (wearables || correlation) {
    systemInstruction += buildCoachPromptAugmentation(wearables, correlation);
  }

  if (isSummaryRequest) {
    systemInstruction += `\n
### HEALTH SUMMARY GENERATION RULES
When the user asks for a health status (e.g., "How am I doing?", "Summarize my labs") or asks what their new lab results mean:
1. ALWAYS generate a SBAAR-formatted health summary first (Subjective, Background, Assessment, Analysis, Recommendation).
2. Follow immediately with an "AI Doctor Summary" in plain, empathetic language.
3. Use EXACT \`display_value\` strings from the injected lab data (e.g., "< 0.1", not "0").
4. Show trends: Explicitly compare current values to historical values.
5. Flag critical values with emojis:
   - 🔴 CRITICAL: Life-threatening (e.g., HbA1c > 12)
   - ⚠️ WARNING: Needs attention (e.g., HbA1c > 7)
   - 🟡 NOTICE: Monitor closely (e.g., Vitamin D < 20)
6. ALWAYS include the mandatory medical disclaimer at the end.

### SBAAR FORMAT REQUIREMENTS
- **Subjective:** Symptoms user reported in the chat history.
- **Background:** Age, gender, conditions, medications (if known).
- **Assessment:** Markdown table with \`Marker | Your Value | Normal Range | Status\`.
- **Analysis:** Trend arrows (⬆️⬇️➡️) and chronological comparison.
- **Recommendation:** Numbered list grouped by Immediate, Lifestyle, and Follow-up.
`;
  }


  // GenAI SDK requires strictly alternating roles: user -> model -> user -> model
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  if (history.length === 0) {
    // First message - merge context and question
    contents.push({
      role: "user",
      parts: [
        {
          text: `Medical Context:\n${patientDataPrompt}\n\nQuestion: <user_content>${userMessage}</user_content>`,
        },
      ],
    });
  } else {
    // History exists - process it
    history.forEach((h, i) => {
      const role = h.role === "assistant" ? "model" : "user";
      let text = h.content;

      // Inject context into the very first user message of the history
      if (i === 0 && role === "user") {
        text = `Context:\n${patientDataPrompt}\n\nUser previously said: <user_content>${text}</user_content>`;
      } else if (role === "user") {
        text = `<user_content>${text}</user_content>`;
      }

      // Handle potential duplicate roles in history (though useCoach should prevent this)
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    });

    // Add current message
    if (contents[contents.length - 1].role === "user") {
      // Append to last user message if history ended with user
      contents[contents.length - 1].parts[0].text +=
        `\n\nFollow-up Question: <user_content>${userMessage}</user_content>`;
    } else {
      contents.push({
        role: "user",
        parts: [{ text: `<user_content>${userMessage}</user_content>` }],
      });
    }
  }

  if (!ai) throw new Error("Aura AI is currently offline. Please check your configuration.");
  
  try {
    const targetModel = isSummaryRequest ? "gemini-3-flash-preview" : "gemini-1.5-pro";
    // History Sanitation
    contents.forEach((c) => {
      c.parts = c.parts.filter(p => typeof p.text === 'string' && p.text.trim() !== "");
    });
    // Remove any messages that ended up with no parts
    const sanitizedContents = contents.filter(c => c.parts.length > 0);

    const reqConfig = {
      contents: sanitizedContents,
      config: {
        systemInstruction,
        maxOutputTokens: 8192,
        temperature: 0.1,
      },
    };

    let stream;
    try {
      stream = await ai.models.generateContentStream({
        ...reqConfig,
        model: targetModel,
      });
    } catch (modelError: any) {
      console.error("[GEMINI API FATAL ERROR]:", modelError?.message || modelError, modelError?.status);
      try {
        stream = await ai.models.generateContentStream({
          ...reqConfig,
          model: "gemini-1.5-pro",
        });
      } catch (fallbackError: any) {
        console.error("[GEMINI API FATAL ERROR] (1.5-pro fallback failed):", fallbackError?.message || fallbackError);
        stream = await ai.models.generateContentStream({
          ...reqConfig,
          model: "gemini-3-flash-preview",
        });
      }
    }

    if (!stream) {
      throw new Error("Failed to initialize conversational stream.");
    }

    return (async function* () {
      try {
        for await (const chunk of stream) {
          if (chunk.text) {
            yield chunk.text;
          }
        }
      } catch (streamError) {
        console.error("Stream processing error:", streamError);
        yield getFriendlyErrorMessage(streamError);
      }
    })();
  } catch (error) {
    console.error("Coach service initialization error:", error);
    return (async function* () {
      yield getFriendlyErrorMessage(error);
    })();
  }
};

