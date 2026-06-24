import {
  getLabHistory,
  getMedications,
  getLatestInsights,
  getDocuments,
} from "../../lib/firebase/firestore";
import { getConsolidatedAlerts } from "../alertService";
import { PatientContext } from "../../types/ai";
import { UserProfile, MedicalDocument } from "../../types/medical";
import { parseSafeTimestamp } from "../../utils/dateUtils";

/**
 * ContextService - Consolidates patient telemetry into a standardized format
 * for RAG (Retrieval-Augmented Generation) grounding.
 */
export const getPatientContext = async (
  userId: string,
  profile: UserProfile,
): Promise<PatientContext> => {
  const profileId = profile?.id === "Myself" ? undefined : profile?.id;

  const [labHistory, medications, recentInsights, documents] = await Promise.all([
    getLabHistory(userId, undefined, profileId),
    getMedications(userId, profileId),
    getLatestInsights(userId, profileId),
    getDocuments(userId, profileId),
  ]);

  // Extract from documents if possible
  const docSbars: string[] = [];
  const docDates: string[] = [];
  const parsedMeds: any[] = [];

  // A) Manual Medications
  (medications || []).forEach(m => {
     parsedMeds.push({ 
       ...m, 
       name: (m as any).genericName || (m as any).name || (m as any).medicationName || (m as any).drugName || (m as any).brandName || "Unknown Medication",
       source: 'manual', 
       priority: 1 
     });
  });

  if (documents) {
    documents.forEach((doc: MedicalDocument) => {
      if (doc.date) {
        const d = parseSafeTimestamp(doc.date);
        if (d) docDates.push(d.toLocaleDateString());
      }
      if (doc.extractedData) {
        if (Array.isArray(doc.extractedData.medications)) {
          doc.extractedData.medications.forEach((m: any) => {
            const medObj = typeof m === 'string' ? { name: m } : m;
            parsedMeds.push({ 
              ...medObj, 
              name: medObj.name || medObj.medicationName || medObj.drugName || "Unknown Medication",
              source: 'report', 
              priority: 3, 
              date: doc.date 
            });
          });
        }
        if (doc.extractedData.sbar) {
          docSbars.push(doc.extractedData.sbar);
        }
      }
    });
  }

  // Deduplicate by name, keeping highest priority first
  const deduplicatedMeds = new Map();
  parsedMeds.sort((a,b) => a.priority - b.priority).forEach(m => {
     const key = m.name?.toLowerCase().trim();
     if (key && !deduplicatedMeds.has(key)) {
        deduplicatedMeds.set(key, m);
     }
  });

  const allMedications = Array.from(deduplicatedMeds.values());
  const alerts = getConsolidatedAlerts(labHistory || [], allMedications);

  return {
    profile,
    labHistory: labHistory || [],
    medications: allMedications,
    recentInsights: recentInsights || [],
    alerts,
    // Add raw SBAR text for extra context
    extraContext: docSbars.join("\n\n") + (docDates.length ? `\n\nUPLOADED REPORT DATES:\n${docDates.join(', ')}` : ''),
    reportedSymptoms: [], // Populate from chat history if possible
    knownConditions: profile?.chronicConditions || [],
    demographics: {
      age: profile?.dob && parseSafeTimestamp(profile.dob) ? `${new Date().getFullYear() - parseSafeTimestamp(profile.dob)!.getFullYear()} years` : "Not provided",
      gender: profile?.gender || "Not provided",
      height: profile?.height,
      weight: profile?.weight,
    },
    clinicalNotes: profile?.clinicalNotes
  } as PatientContext;
};

/**
 * Formats the patient context into a clean, prompt-friendly string.
 */
export const formatContextForPrompt = (context: any): string => {
  const { profile, labHistory, medications, alerts, extraContext, reportedSymptoms, knownConditions, demographics, clinicalNotes } = context;

  let prompt = `PATIENT PROFILE:\n`;
  prompt += `- Name: ${profile?.name || profile?.fullName || "Unknown"}\n`;
  prompt += `- Demographics: Age: ${demographics?.age || "Not provided"}, Gender: ${demographics?.gender || "Not provided"}\n`;
  if (demographics?.height || demographics?.weight) {
    prompt += `- Metrics: `;
    if (demographics?.height) prompt += `Height: ${demographics.height} cm. `;
    if (demographics?.weight) prompt += `Weight: ${demographics.weight} kg. `;
    if (demographics?.height && demographics?.weight) {
      const h = demographics.height / 100;
      const bmi = Math.round((demographics.weight / (h * h)) * 10) / 10;
      prompt += `BMI: ${bmi}`;
    }
    prompt += `\n`;
  }
  prompt += `- Chronic Conditions: ${knownConditions?.join(", ") || profile?.chronicConditions?.join(", ") || "None reported"}\n`;
  prompt += `- Allergies: ${profile?.allergies?.join(", ") || "None reported"}\n`;
  if (clinicalNotes) {
    prompt += `- Clinical Notes: ${clinicalNotes}\n`;
  }
  prompt += `- Reported Symptoms: ${reportedSymptoms?.join(", ") || "None reported"}\n\n`;

  prompt += `ACTIVE MEDICATIONS:\n`;
  if (medications && medications.length > 0) {
    const activeMeds = medications.filter((m: any) => {
      const status = String(m.status || "").toLowerCase();
      return status === "active" || status === "current" || status === "ongoing" || m.status === undefined || m.status === null || status === "";
    });
    
    const displayMeds = activeMeds.length > 0 ? activeMeds : medications;
    
    displayMeds.forEach((m: any) => {
      prompt += `- ${m.name || 'Unknown Medication'}: ${m.dosage || ''} ${m.frequency || ''}\n`;
    });
  } else {
    prompt += `- None reported\n`;
  }
  prompt += `\n`;

  let lastReportDate = "None";
  if (labHistory.length > 0) {
    const dates = labHistory.map((l: any) => {
       const d = parseSafeTimestamp(l.date);
       return d ? d.getTime() : NaN;
    }).filter((n: any) => !isNaN(n));
    if (dates.length > 0) {
      lastReportDate = new Date(Math.max(...dates)).toISOString().split("T")[0];
    }
  }
  prompt += `LAST REPORT DATE: ${lastReportDate}\n\n`;

  prompt += `LAB RESULTS HISTORY (Grouped by Marker, chronological):\n`;
  if (labHistory.length > 0) {
    const labsByMarker = new Map();
    labHistory.forEach((lab: any) => {
      const existing = labsByMarker.get(lab.markerName) || [];
      existing.push(lab);
      labsByMarker.set(lab.markerName, existing);
    });

    const severityScore = (status: string) => {
      const s = String(status).toLowerCase();
      if (s === "critical") return 3;
      if (s === "high" || s === "low" || s === "abnormal") return 2;
      return 1;
    };

    // Pre-calculate parsed times and sort once to avoid O(N * M log M) sorts
    const getT = (doc: any) => {
      const _parsed = parseSafeTimestamp(doc.extractedDate || doc.date);
      return {
        time: _parsed?.getTime() || 0,
        formattedDate: _parsed ? _parsed.toISOString().split("T")[0] : "Recent"
      };
    };

    const markerInfo = Array.from(labsByMarker.entries()).map(([markerName, labs]) => {
      const decoratedLabs = labs.map((lab: any) => {
        const { time, formattedDate } = getT(lab);
        return { lab, time, formattedDate };
      });
      // Sort descending by time
      decoratedLabs.sort((a: any, b: any) => b.time - a.time);
      return {
        markerName,
        decoratedLabs,
        severity: decoratedLabs.length > 0 ? severityScore(decoratedLabs[0].lab.status) : 0
      };
    });

    // Sort markers by severity of their most recent lab
    markerInfo.sort((a, b) => b.severity - a.severity);

    markerInfo.slice(0, 15).forEach(({ markerName, decoratedLabs }) => {
      prompt += `- ${markerName}:\n`;
      // Slice the latest 5 and reverse to get ascending order for the prompt
      const recentLabs = decoratedLabs.slice(0, 5).reverse();
      recentLabs.forEach(({ lab, formattedDate }: any) => {
        const valStr = lab.display_value || lab.numeric_value || lab.value;
        prompt += `  * ${formattedDate}: ${valStr} ${lab.unit} (${lab.status})\n`;
      });
    });
  } else {
    prompt += `- None reported\n`;
  }
  prompt += `\n`;

  prompt += `CLINICAL ALERTS:\n`;
  if (alerts.length > 0) {
    alerts.forEach((alert: any) => {
      prompt += `- [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.description}\n`;
    });
  } else {
    prompt += `- No critical alerts detected\n`;
  }

  if (extraContext) {
    prompt += `\nPAST SBAR SUMMARIES / MEDICAL NOTES:\n${extraContext}\n`;
  }

  return prompt;
};
