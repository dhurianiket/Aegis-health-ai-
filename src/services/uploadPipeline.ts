import { classifyDocument, extractLabData, generateSBAR } from "./ai/promptFramework";
import { saveDocument, saveLabResult, getLabHistory } from "../lib/firebase/firestore";
import { computeAllTrends, formatTrendForPrompt } from "../utils/trendAnalysis";
import { getConsolidatedAlerts } from "./alertService";
import { LabStatus } from "../types/medical";
import { LabObservation } from "../types/health";

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
      if (obs.valueCanonical !== undefined && obs.valueCanonical !== null) {
        await saveLabResult(userId, {
          docId: docId || "unknown",
          date: new Date().toISOString(),
          extractedDate: collectionDate,
          uploadedAt: new Date().toISOString(),
          markerName: obs.testName || "Unknown",
          value: obs.valueCanonical,
          unit: obs.unitCanonical || "",
          referenceRange: `${obs.referenceLow || ""} - ${obs.referenceHigh || ""}`,
          status: (obs.flag as LabStatus) || LabStatus.NORMAL,
          profileId,
        });
      }
    }
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

  // 8. generateSBAR
  const trendsJson = formatTrendForPrompt(trends);
  const sbar = await generateSBAR(JSON.stringify({ profileId, alerts }), trendsJson, [], []);
  
  return { extraction, sbar, trends, alerts };
};
