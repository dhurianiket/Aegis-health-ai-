import { classifyDocument, extractLabData, generateSBAR } from "./ai/promptFramework";
import { saveDocument, saveLabResult, getLabHistory, saveReportHistory } from "../lib/firebase/firestore";
import { computeAllTrends, formatTrendForPrompt } from "../utils/trendAnalysis";
import { getConsolidatedAlerts } from "./alertService";
import { LabStatus } from "../types/medical";
import { LabObservation } from "../types/health";
import { getUpcomingReminders, generateRemindersFromAlerts, createReminder } from "./reminderService";

const logAuditEvent = async (userId: string, action: string, data: any) => {
  if (import.meta.env.DEV) console.log("Audit log:", userId, action, data);
};

export const executeFullUploadPipeline = async (
  userId: string,
  profileId: string | undefined,
  rawFiles: { base64Data: string; mimeType: string }[]
) => {
  // 1. Classify
  const classification = await classifyDocument(rawFiles);

  if (!classification.extractionRecommended || classification.confidence < 0.7) {
    await logAuditEvent(userId, 'UPLOAD_REJECTED', 'classifier_gate');
    return {
      success: false,
      error: `Document type "${classification.documentType}" is not supported. \n              Please upload a lab report PDF or image.`,
      documentType: classification.documentType,
    };
  }

  // 2. Extract & Normalize
  const extraction = await extractLabData(rawFiles);
  
  // 3. Write to Firestore
  const collectionDate = extraction.collection_date || extraction.reportMetadata?.collectionDate || new Date().toISOString();
  
  const docId = await saveDocument(userId, {
    fileName: "Uploaded Document",
    type: classification.documentType || "Unknown",
    date: new Date().toISOString(),
    extractedDate: collectionDate,
    uploadedAt: new Date().toISOString(),
    extractedData: extraction,
    profileId,
  });

  if (extraction.observations) {
    for (const obs of extraction.observations) {
      if ((obs.valueCanonical !== undefined && obs.valueCanonical !== null) || obs.numeric_value !== undefined) {
        await saveLabResult(userId, {
          docId: docId || "unknown",
          date: new Date().toISOString(),
          extractedDate: collectionDate,
          uploadedAt: new Date().toISOString(),
          markerName: obs.testName || "Unknown",
          value: obs.valueCanonical ?? obs.numeric_value ?? obs.valueOriginal ?? 0,
          numeric_value: obs.numeric_value ?? obs.valueCanonical ?? undefined,
          display_value: obs.display_value ?? undefined,
          unit: obs.unitCanonical || obs.unitOriginal || "",
          referenceRange: `${obs.referenceLow || ""} - ${obs.referenceHigh || ""}`,
          status: (obs.flag as LabStatus) || LabStatus.NORMAL,
          profileId,
        });
      }
    }
  }

  // Step 2 Additive Database Write: Save report history record
  try {
    const validObs = (extraction.observations || []).filter((obs: any) => 
      (obs.valueCanonical !== undefined && obs.valueCanonical !== null) || obs.numeric_value !== undefined
    );
    await saveReportHistory(userId, {
      docId: docId || "unknown",
      fileName: classification.documentType || "Uploaded Document",
      uploadedAt: new Date().toISOString(),
      extractedDate: collectionDate,
      markerCount: validObs.length,
      profileId,
      date: collectionDate,
    });
  } catch (err) {
    console.error("Failed to save report history record:", err);
  }

  // 4. logAuditEvent
  await logAuditEvent(userId, "document_uploaded", { documentType: classification.documentType });

  // 5. computeAllTrends
  const history = await getLabHistory(userId, undefined, profileId);
  const mappedObservations: LabObservation[] = (history || []).map(h => ({
     id: h.id,
     patientId: userId,
     reportId: h.docId,
     testName: h.markerName,
     collectedAt: h.date,
     valueCanonical: h.value,
     unitCanonical: h.unit,
     flag: h.status as any,
     referenceLow: null,
     referenceHigh: null,
  }));
  const trends = computeAllTrends(mappedObservations);
  
  // 6. Run alert rules
  const alerts = getConsolidatedAlerts(history || [], []);

  // 7. Write alerts/FCM
  // (Placeholder for Firebase Cloud Messaging alert notification)
  console.log("FCM Alerts triggered:", alerts.length);

  // Step 7b: Auto-generate reminders from new alerts
  const existingReminders = await getUpcomingReminders(userId, 365);
  const suggestedReminders = generateRemindersFromAlerts(alerts, existingReminders);
  await Promise.all(
    suggestedReminders.map(r => createReminder(userId, r))
  );

  // Step 7c: Re-check drug interactions with updated lab context
  const { getActiveMedications, checkInteractions } = await import("./medicationService");
  const activeMeds = await getActiveMedications(userId);
  if (activeMeds.length >= 2) {
    const rxcuis = activeMeds.filter(m => m.rxcui != null).map(m => m.rxcui as string);
    if (rxcuis.length >= 2) {
      const interactions = await checkInteractions(rxcuis);
      if (interactions.length > 0) {
        await logAuditEvent(userId, 'DDI_CHECK_COMPLETED', `${interactions.length} interactions evaluated`);
      }
    }
  }

  // 8. generateSBAR
  const trendsJson = formatTrendForPrompt(trends);
  const sbar = await generateSBAR(JSON.stringify({ profileId, alerts }), trendsJson, [], []);
  
  if (docId) {
    const { doc, updateDoc } = await import("firebase/firestore");
    const docRef = doc((await import("../lib/firebase/config")).db, "users", userId, "documents", docId);
    await updateDoc(docRef, { aiSummary: sbar });
  }
  
  return { extraction, sbar, trends, alerts };
};
