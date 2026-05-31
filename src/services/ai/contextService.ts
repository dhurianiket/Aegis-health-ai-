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

  const lines: string[] = [];

  lines.push(`PATIENT PROFILE:`);
  lines.push(`- Name: ${profile?.name || profile?.fullName || "Unknown"}`);
  lines.push(`- Demographics: Age: ${demographics?.age || "Not provided"}, Gender: ${demographics?.gender || "Not provided"}`);
  if (demographics?.height || demographics?.weight) {
    let metricsLine = `- Metrics: `;
    if (demographics?.height) metricsLine += `Height: ${demographics.height} cm. `;
    if (demographics?.weight) metricsLine += `Weight: ${demographics.weight} kg. `;
    if (demographics?.height && demographics?.weight) {
      const h = demographics.height / 100;
      const bmi = Math.round((demographics.weight / (h * h)) * 10) / 10;
      metricsLine += `BMI: ${bmi}`;
    }
    lines.push(metricsLine);
  }
  lines.push(`- Chronic Conditions: ${knownConditions?.join(", ") || profile?.chronicConditions?.join(", ") || "None reported"}`);
  lines.push(`- Allergies: ${profile?.allergies?.join(", ") || "None reported"}`);
  if (clinicalNotes) {
    lines.push(`- Clinical Notes: ${clinicalNotes}`);
  }
  lines.push(`- Reported Symptoms: ${reportedSymptoms?.join(", ") || "None reported"}\n`);

  lines.push(`ACTIVE MEDICATIONS:`);
  if (medications && medications.length > 0) {
    let hasActiveMeds = false;
    for (let i = 0; i < medications.length; i++) {
      const m = medications[i];
      const status = m.status ? String(m.status).toLowerCase() : "";
      if (status === "active" || status === "current" || status === "ongoing" || m.status === undefined || m.status === null || status === "") {
        lines.push(`- ${m.name || 'Unknown Medication'}: ${m.dosage || ''} ${m.frequency || ''}`);
        hasActiveMeds = true;
      }
    }
    if (!hasActiveMeds) {
      for (let i = 0; i < medications.length; i++) {
        const m = medications[i];
        lines.push(`- ${m.name || 'Unknown Medication'}: ${m.dosage || ''} ${m.frequency || ''}`);
      }
    }
  } else {
    lines.push(`- None reported`);
  }
  lines.push("");

  let lastReportDate = "None";
  if (labHistory && labHistory.length > 0) {
    let maxDate = -Infinity;
    for (let i = 0; i < labHistory.length; i++) {
       const d = parseSafeTimestamp(labHistory[i].date);
       if (d) {
         const t = d.getTime();
         if (!isNaN(t) && t > maxDate) {
           maxDate = t;
         }
       }
    }
    if (maxDate !== -Infinity) {
      lastReportDate = new Date(maxDate).toISOString().split("T")[0];
    }
  }
  lines.push(`LAST REPORT DATE: ${lastReportDate}\n`);

  lines.push(`LAB RESULTS HISTORY (Grouped by Marker, chronological):`);
  if (labHistory && labHistory.length > 0) {
    const labsByMarker = new Map();
    for (let i = 0; i < labHistory.length; i++) {
      const lab = labHistory[i];
      let existing = labsByMarker.get(lab.markerName);
      if (!existing) {
        existing = [];
        labsByMarker.set(lab.markerName, existing);
      }
      existing.push(lab);
    }

    const severityScore = (status: string) => {
      if (!status) return 1;
      const s = String(status).toLowerCase();
      if (s === "critical") return 3;
      if (s === "high" || s === "low" || s === "abnormal") return 2;
      return 1;
    };

    const getT = (doc: any) => {
      if (!doc) return 0;
      const dateStr = doc.extractedDate || doc.date;
      if (!dateStr) return 0;
      const parsed = parseSafeTimestamp(dateStr);
      return parsed ? parsed.getTime() : 0;
    }

    const sortedMarkers = Array.from(labsByMarker.keys()).sort((a, b) => {
      const labsA = labsByMarker.get(a);
      const labsB = labsByMarker.get(b);

      let latestA = labsA[0];
      let maxTA = getT(latestA);
      for (let i=1; i<labsA.length; i++) {
        const t = getT(labsA[i]);
        if (t > maxTA) { maxTA = t; latestA = labsA[i]; }
      }

      let latestB = labsB[0];
      let maxTB = getT(latestB);
      for (let i=1; i<labsB.length; i++) {
        const t = getT(labsB[i]);
        if (t > maxTB) { maxTB = t; latestB = labsB[i]; }
      }

      return severityScore(latestB.status) - severityScore(latestA.status);
    });

    const maxMarkers = Math.min(15, sortedMarkers.length);
    for (let i = 0; i < maxMarkers; i++) {
      const markerName = sortedMarkers[i];
      lines.push(`- ${markerName}:`);

      const labs = labsByMarker.get(markerName);

      const labsWithTime = labs.map((l:any) => ({ lab: l, t: getT(l) }));
      labsWithTime.sort((a:any, b:any) => a.t - b.t);

      const recentLabs = labsWithTime.slice(-5);

      for (let j = 0; j < recentLabs.length; j++) {
        const lab = recentLabs[j].lab;
        const dateStr = lab.extractedDate || lab.date;
        const _parsed = parseSafeTimestamp(dateStr);
        const formattedDate = _parsed ? _parsed.toISOString().split("T")[0] : "Recent";
        const valStr = lab.display_value || lab.numeric_value || lab.value;
        lines.push(`  * ${formattedDate}: ${valStr} ${lab.unit} (${lab.status})`);
      }
    }
  } else {
    lines.push(`- None reported`);
  }
  lines.push("");

  lines.push(`CLINICAL ALERTS:`);
  if (alerts && alerts.length > 0) {
    for (let i = 0; i < alerts.length; i++) {
      const alert = alerts[i];
      lines.push(`- [${(alert.severity || "").toUpperCase()}] ${alert.title}: ${alert.description}`);
    }
  } else {
    lines.push(`- No critical alerts detected`);
  }

  if (extraContext) {
    lines.push(`\nPAST SBAR SUMMARIES / MEDICAL NOTES:\n${extraContext}`);
  }

  return lines.join('\n') + '\n';
};
