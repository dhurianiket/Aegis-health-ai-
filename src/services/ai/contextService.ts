import {
  getLabHistory,
  getMedications,
  getLatestInsights,
  getDocuments,
} from "../../lib/firebase/firestore";
import { getConsolidatedAlerts } from "../alertService";
import { PatientContext } from "../../types/ai";
import { UserProfile, MedicalDocument } from "../../types/medical";

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
     parsedMeds.push({ ...m, source: 'manual', priority: 1 });
  });

  if (documents) {
    documents.forEach((doc: MedicalDocument) => {
      if (doc.date) docDates.push(new Date(doc.date).toLocaleDateString());
      if (doc.extractedData) {
        if (Array.isArray(doc.extractedData.medications)) {
          doc.extractedData.medications.forEach((m: any) => {
            const medObj = typeof m === 'string' ? { name: m } : m;
            parsedMeds.push({ ...medObj, source: 'report', priority: 3, date: doc.date });
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
  } as any;
};

/**
 * Formats the patient context into a clean, prompt-friendly string.
 */
export const formatContextForPrompt = (context: any): string => {
  const { profile, labHistory, medications, alerts, extraContext } = context;

  let prompt = `PATIENT PROFILE:\n`;
  prompt += `- Name: ${profile?.name || "Unknown"}\n`;
  prompt += `- Chronic Conditions: ${profile?.chronicConditions?.join(", ") || "None reported"}\n`;
  prompt += `- Allergies: ${profile?.allergies?.join(", ") || "None reported"}\n\n`;

  prompt += `ACTIVE MEDICATIONS:\n`;
  if (medications.length > 0) {
    medications
      .filter((m: any) => String(m.status).toLowerCase() === "active" || m.status === undefined)
      .forEach((m: any) => {
        prompt += `- ${m.name}: ${m.dosage || ''} ${m.frequency || ''}\n`;
      });
  } else {
    prompt += `- None reported\n`;
  }
  prompt += `\n`;

  let lastReportDate = "None";
  if (labHistory.length > 0) {
    const dates = labHistory.map((l: any) => new Date(l.date).getTime()).filter((n: any) => !isNaN(n));
    if (dates.length > 0) {
      lastReportDate = new Date(Math.max(...dates)).toISOString().split("T")[0];
    }
  }
  prompt += `LAST REPORT DATE: ${lastReportDate}\n\n`;

  prompt += `LATEST LAB RESULTS (Top 10 by severity):\n`;
  if (labHistory.length > 0) {
    const latestLabs = new Map();
    labHistory.forEach((lab: any) => {
      const existing = latestLabs.get(lab.markerName);
      if (!existing || new Date(lab.date) > new Date(existing.date)) {
         latestLabs.set(lab.markerName, lab);
      }
    });

    const severityScore = (status: string) => {
      const s = String(status).toLowerCase();
      if (s === "critical") return 3;
      if (s === "high" || s === "low" || s === "abnormal") return 2;
      return 1;
    };

    const sortedLabs = Array.from(latestLabs.values()).sort((a, b) => {
      return severityScore(b.status) - severityScore(a.status);
    });

    sortedLabs.slice(0, 10).forEach((lab) => {
      prompt += `- ${lab.markerName}: ${lab.value} ${lab.unit} (${lab.status}) on ${lab.date}\n`;
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
