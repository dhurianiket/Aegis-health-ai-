import {
  getLabHistory,
  getMedications,
  getLatestInsights,
  getDocuments,
  getAllSpecialistChats,
  getCoachChat,
  getActiveReferrals,
} from "../../lib/firebase/firestore";
import { getConsolidatedAlerts } from "../alertService";
import {
  PatientContext,
  SpecialistConsultation,
  ClinicalReferral,
  CoachSessionSummary,
  SpecialistId,
} from "../../types/ai";
import { UserProfile, MedicalDocument } from "../../types/medical";
import { parseSafeTimestamp } from "../../utils/dateUtils";
import { SPECIALISTS } from "./specialists/specialistFactory";

import { WearableBiometrics } from "../../types/wearables";

/**
 * ContextService - Consolidates patient telemetry into a standardized format
 * for RAG (Retrieval-Augmented Generation) grounding.
 */
export const getPatientContext = async (
  userId: string,
  profile: UserProfile,
  wearableTelemetry?: WearableBiometrics,
): Promise<PatientContext> => {
  const profileId = profile?.id === "Myself" ? undefined : profile?.id;
  const targetProfileId = profile?.id || "Myself";

  const [
    labHistory,
    medications,
    recentInsights,
    documents,
    specialistChats,
    coachMessages,
    activeReferrals,
  ] = await Promise.all([
    getLabHistory(userId, undefined, profileId),
    getMedications(userId, profileId),
    getLatestInsights(userId, profileId),
    getDocuments(userId, profileId),
    getAllSpecialistChats(userId, targetProfileId),
    getCoachChat(userId, targetProfileId),
    getActiveReferrals(userId, targetProfileId),
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

  // Parse specialist consultations across all 10 specialists
  const specialistConsultations: SpecialistConsultation[] = (specialistChats || [])
    .filter((c: any) => Array.isArray(c.messages) && c.messages.length > 0)
    .map((c: any) => {
      const modelMsgs = c.messages.filter((m: any) => m.role === "assistant" || m.role === "model");
      const userMsgs = c.messages.filter((m: any) => m.role === "user");
      const lastModel = modelMsgs[modelMsgs.length - 1];
      const lastUser = userMsgs[userMsgs.length - 1];
      const specProfile = SPECIALISTS[c.specialistId as SpecialistId];
      const content = String(lastModel?.content || "");

      // Look for any outbound referral tags like [REFERRAL: specialistId | reason]
      const referralMatches = content.match(/\[REFERRAL:\s*([a-zA-Z0-9_-]+)\s*\|\s*([^\]]+)\]/gi);
      const activeRefs = referralMatches
        ? referralMatches.map((r: string) => r.replace(/^\[REFERRAL:\s*/i, "").replace(/\]$/, "").trim())
        : [];

      return {
        specialistId: c.specialistId,
        specialistName: specProfile?.displayName || c.specialistId,
        lastUpdated: lastModel?.createdAt || (c.updatedAt?.toMillis ? new Date(c.updatedAt.toMillis()).toISOString().split("T")[0] : "Recent"),
        summary: content.slice(0, 350) + (content.length > 350 ? "..." : ""),
        lastAssessment: content,
        lastUserQuery: lastUser?.content,
        activeReferrals: activeRefs,
      };
    });

  // Parse Coach session summary
  let coachSummary: CoachSessionSummary | undefined = undefined;
  const coachUserQueries: string[] = [];
  if (coachMessages && coachMessages.length > 0) {
    const modelMsgs = coachMessages.filter((m: any) => m.role === "assistant");
    const userMsgs = coachMessages.filter((m: any) => m.role === "user");
    const lastModel = modelMsgs[modelMsgs.length - 1];
    userMsgs.slice(-4).forEach((m: any) => {
      if (m.content) coachUserQueries.push(String(m.content).slice(0, 80));
    });
    const lastTime = lastModel?.timestamp instanceof Date
      ? lastModel.timestamp.toISOString().split("T")[0]
      : "Recent";

    coachSummary = {
      lastInteractionDate: lastTime,
      recentTopics: coachUserQueries,
      lastTriageNote: lastModel ? String(lastModel.content).slice(0, 300) : undefined,
    };
  }

  // Combine symptoms reported across coach and specialist chats
  const reportedSymptoms: string[] = [...coachUserQueries];
  specialistConsultations.forEach((sc) => {
    if (sc.lastUserQuery && !reportedSymptoms.includes(sc.lastUserQuery)) {
      reportedSymptoms.push(sc.lastUserQuery.slice(0, 80));
    }
  });

  return {
    profile,
    labHistory: labHistory || [],
    medications: allMedications,
    recentInsights: recentInsights || [],
    alerts,
    // Add raw SBAR text for extra context
    extraContext: docSbars.join("\n\n") + (docDates.length ? `\n\nUPLOADED REPORT DATES:\n${docDates.join(', ')}` : ''),
    reportedSymptoms,
    knownConditions: profile?.chronicConditions || [],
    demographics: {
      age: profile?.dob && parseSafeTimestamp(profile.dob) ? `${new Date().getFullYear() - parseSafeTimestamp(profile.dob)!.getFullYear()} years` : "Not provided",
      gender: profile?.gender || "Not provided",
      height: profile?.height,
      weight: profile?.weight,
    },
    clinicalNotes: profile?.clinicalNotes,
    wearableTelemetry,
    specialistConsultations,
    coachSummary,
    activeReferrals: activeReferrals || [],
  } as PatientContext;
};

/**
 * Formats the patient context into a clean, prompt-friendly string.
 */
export const formatContextForPrompt = (context: any): string => {
  const {
    profile,
    labHistory,
    medications,
    alerts,
    extraContext,
    reportedSymptoms,
    knownConditions,
    demographics,
    clinicalNotes,
    wearableTelemetry,
    specialistConsultations,
    coachSummary,
    activeReferrals,
    recentInsights,
  } = context;

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

  if (wearableTelemetry) {
    prompt += `WEARABLE BIOMETRICS TELEMETRY:\n`;
    prompt += `- Resting HR: ${wearableTelemetry.rhr || 0} bpm | Heart Rate: ${wearableTelemetry.heartRate || 0} bpm\n`;
    prompt += `- HRV (rMSSD): ${wearableTelemetry.hrv || 0} ms | SpO2: ${wearableTelemetry.spo2 || 0}%\n`;
    prompt += `- Steps: ${wearableTelemetry.steps || 0} | Connection: ${wearableTelemetry.connectionStatus || 'synced'}\n`;
    if (wearableTelemetry.sleep) {
      prompt += `- Sleep: Score ${wearableTelemetry.sleep.sleepScore}/100 | Deep: ${wearableTelemetry.sleep.deepMinutes}m, REM: ${wearableTelemetry.sleep.remMinutes}m, Light: ${wearableTelemetry.sleep.lightMinutes}m\n`;
    }
    prompt += `\n`;
  }

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

    // Pre-compute latest severity score for each marker
    const markerSeverities = new Map<string, number>();
    const getT = (doc: any) => parseSafeTimestamp(doc.extractedDate || doc.date)?.getTime() || 0;
    for (const [marker, labs] of labsByMarker.entries()) {
      // Map to include time so we avoid parsing repeatedly during reduce
      const labsWithTime = labs.map((l: any) => ({ lab: l, time: getT(l) }));
      let latestObj = labsWithTime[0];
      for (let i = 1; i < labsWithTime.length; i++) {
         if (labsWithTime[i].time > latestObj.time || isNaN(latestObj.time)) {
             latestObj = labsWithTime[i];
         }
      }
      markerSeverities.set(marker, severityScore(latestObj.lab.status));
    }

    // Sort markers by severity of their most recent lab
    const sortedMarkers = Array.from(labsByMarker.keys()).sort((a, b) => {
      return (markerSeverities.get(b) || 0) - (markerSeverities.get(a) || 0);
    });

    sortedMarkers.slice(0, 15).forEach((markerName) => {
      prompt += `- ${markerName}:\n`;
      const getT = (doc: any) => parseSafeTimestamp(doc.extractedDate || doc.date)?.getTime() || 0;
      const labs = labsByMarker.get(markerName)
        .sort((a: any, b: any) => getT(a) - getT(b))
        .slice(-5); // Get up to 5 most recent
      labs.forEach((lab: any) => {
        const dateStr = lab.extractedDate || lab.date;
        const _parsed = parseSafeTimestamp(dateStr);
        const formattedDate = _parsed ? _parsed.toISOString().split("T")[0] : "Recent";
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

  if (recentInsights && recentInsights.length > 0) {
    prompt += `\nSPECIALIST CLINICAL INSIGHTS:\n`;
    recentInsights.slice(0, 5).forEach((ins: any) => {
      prompt += `- [${ins.specialty || "Specialist"}] (${ins.timestamp || "Recent"}): ${ins.content || "Insight recorded"}\n`;
    });
  }

  if (specialistConsultations && specialistConsultations.length > 0) {
    prompt += `\nMULTI-SPECIALIST CROSS-CONSULTATIONS & TEAM ASSESSMENTS:\n`;
    prompt += `(Direct multi-disciplinary awareness: Incorporate colleague assessments for holistic continuity of care)\n`;
    specialistConsultations.forEach((sc: SpecialistConsultation) => {
      prompt += `- [${sc.specialistName}] (Last consulted: ${sc.lastUpdated}):\n`;
      if (sc.lastUserQuery) {
        prompt += `  * Patient Question: "${sc.lastUserQuery.replace(/\n/g, ' ')}"\n`;
      }
      prompt += `  * Assessment & Plan: "${sc.summary.replace(/\n/g, ' ')}"\n`;
      if (sc.activeReferrals && sc.activeReferrals.length > 0) {
        prompt += `  * Referrals Issued: ${sc.activeReferrals.join("; ")}\n`;
      }
    });
  }

  if (coachSummary) {
    prompt += `\nAURA AI HEALTH COACH SESSIONS & TRIAGE:\n`;
    prompt += `- Last Interaction: ${coachSummary.lastInteractionDate}\n`;
    if (coachSummary.recentTopics && coachSummary.recentTopics.length > 0) {
      prompt += `- Topics / Inquiries Discussed: ${coachSummary.recentTopics.join("; ")}\n`;
    }
    if (coachSummary.lastTriageNote) {
      prompt += `- Coach Triage Guidance: "${coachSummary.lastTriageNote.replace(/\n/g, ' ')}"\n`;
    }
  }

  if (activeReferrals && activeReferrals.length > 0) {
    prompt += `\nACTIVE INTER-AGENT CLINICAL REFERRALS:\n`;
    activeReferrals.forEach((ref: any) => {
      prompt += `- [${ref.status === "pending" ? "PENDING ACTION" : ref.status.toUpperCase()}] From ${ref.fromAgent || "Colleague"} to ${ref.toSpecialist}: "${ref.reason}" (Ref ID: ${ref.id || "N/A"})\n`;
    });
  }

  return prompt;
};

