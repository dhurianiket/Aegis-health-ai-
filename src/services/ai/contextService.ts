import { getLabHistory, getMedications, getLatestInsights } from '../../lib/firebase/firestore';
import { getConsolidatedAlerts } from '../alertService';
import { PatientContext } from '../../types/ai';
import { UserProfile } from '../../types/medical';

/**
 * ContextService - Consolidates patient telemetry into a standardized format
 * for RAG (Retrieval-Augmented Generation) grounding.
 */
export const getPatientContext = async (userId: string, profile: UserProfile): Promise<PatientContext> => {
  const profileId = profile?.id === 'Myself' ? undefined : profile?.id;
  
  const [labHistory, medications, recentInsights] = await Promise.all([
    getLabHistory(userId, undefined, profileId),
    getMedications(userId, profileId),
    getLatestInsights(userId, profileId)
  ]);

  // Generate real-time alerts based on latest data
  const alerts = getConsolidatedAlerts(labHistory || [], medications || []);

  return {
    profile,
    labHistory: labHistory || [],
    medications: medications || [],
    recentInsights: recentInsights || [],
    alerts
  };
};

/**
 * Formats the patient context into a clean, prompt-friendly string.
 */
export const formatContextForPrompt = (context: PatientContext): string => {
  const { profile, labHistory, medications, alerts } = context;
  
  let prompt = `PATIENT PROFILE:\n`;
  prompt += `- Name: ${profile?.name || 'Unknown'}\n`;
  prompt += `- Chronic Conditions: ${profile?.chronicConditions?.join(', ') || 'None reported'}\n`;
  prompt += `- Allergies: ${profile?.allergies?.join(', ') || 'None reported'}\n\n`;

  prompt += `ACTIVE MEDICATIONS:\n`;
  if (medications.length > 0) {
    medications.filter(m => m.status === 'active').forEach(m => {
      prompt += `- ${m.name}: ${m.dosage} ${m.frequency}\n`;
    });
  } else {
    prompt += `- None reported\n`;
  }
  prompt += `\n`;

  prompt += `LATEST LAB RESULTS:\n`;
  if (labHistory.length > 0) {
    // Group by marker name and take latest
    const latestLabs = new Map();
    labHistory.forEach(lab => {
      if (!latestLabs.has(lab.markerName)) {
        latestLabs.set(lab.markerName, lab);
      }
    });

    Array.from(latestLabs.values()).slice(0, 15).forEach(lab => {
      prompt += `- ${lab.markerName}: ${lab.value} ${lab.unit} (${lab.status}) on ${lab.date}\n`;
    });
  } else {
    prompt += `- None reported\n`;
  }
  prompt += `\n`;

  prompt += `CLINICAL ALERTS:\n`;
  if (alerts.length > 0) {
    alerts.forEach(alert => {
      prompt += `- [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.description}\n`;
    });
  } else {
    prompt += `- No critical alerts detected\n`;
  }

  return prompt;
};
