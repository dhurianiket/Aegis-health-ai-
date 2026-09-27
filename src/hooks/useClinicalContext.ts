import { useState, useEffect, useMemo } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { calculateBMI } from '../utils/calculateBMI';
import { getForm, getFormResponses } from '../services/googleFormsService';
import { db } from '../lib/firebase/config';
import { collection, query, where, onSnapshot, type Query, type DocumentData } from 'firebase/firestore';

import { evaluateDrugLabContraindications, LabBiomarker } from '../services/drugLabEngine';
import {
  resolvePrimaryProfileId,
  selectActiveMedications,
  extractLabBiomarkers,
  type ScopedMedication,
  type ClinicalDocumentData,
} from './clinicalContextScope';

/**
 * Builds a query over an account-level clinical collection scoped to the
 * active profile. Secondary profiles are filtered server-side by `profileId`;
 * the primary profile also needs legacy records that have no `profileId`
 * (Firestore cannot query for a missing field), so it reads the collection
 * and relies on the client-side scope filter below.
 */
function scopedCollectionQuery(
  uid: string,
  sub: 'medications' | 'documents',
  profileId: string,
  isPrimary: boolean,
): Query<DocumentData> {
  const base = collection(db, 'users', uid, sub);
  return isPrimary ? query(base) : query(base, where('profileId', '==', profileId));
}

export function useClinicalContext() {
  const { user } = useAuth();
  const { activeProfile, profiles } = useProfile();
  const activeProfileId = activeProfile?.id ?? null;
  const primaryProfileId = useMemo(() => resolvePrimaryProfileId(profiles ?? []), [profiles]);
  const isPrimaryProfile = !!activeProfileId && activeProfileId === primaryProfileId;
  const uid = user?.uid ?? null;

  const [medications, setMedications] = useState<ScopedMedication[]>([]);
  const [labBiomarkers, setLabBiomarkers] = useState<LabBiomarker[]>([]);
  const [formResponsesText, setFormResponsesText] = useState<string>("");
  const [medsLoading, setMedsLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Real-time medications for the ACTIVE profile only.
  //    Re-subscribes on profile switch and clears stale data immediately.
  useEffect(() => {
    setMedications([]);
    if (!uid || !activeProfileId) {
      setMedsLoading(false);
      return;
    }

    let active = true;
    setMedsLoading(true);
    const q = scopedCollectionQuery(uid, 'medications', activeProfileId, isPrimaryProfile);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!active) return;
      const meds = snapshot.docs.map(
        (d) => ({ ...(d.data() as Omit<ScopedMedication, 'id'>), id: d.id }) as ScopedMedication,
      );
      setMedications(selectActiveMedications(meds, activeProfileId, isPrimaryProfile));
      setMedsLoading(false);
    }, (err) => {
      if (!active) return;
      // Fail closed: never fall back to an unscoped account-level read.
      console.warn("[useClinicalContext] Medication listener failed:", err);
      setMedications([]);
      setMedsLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid, activeProfileId, isPrimaryProfile]);

  // 2. Real-time lab documents for the ACTIVE profile only (AGENTS.md Rule 3)
  useEffect(() => {
    setLabBiomarkers([]);
    if (!uid || !activeProfileId) return;

    let active = true;
    const q = scopedCollectionQuery(uid, 'documents', activeProfileId, isPrimaryProfile);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!active) return;
      const docs = snapshot.docs.map((d) => ({ id: d.id, data: d.data() as ClinicalDocumentData }));
      setLabBiomarkers(extractLabBiomarkers(docs, activeProfileId, isPrimaryProfile));
    }, (err) => {
      if (!active) return;
      console.warn("[useClinicalContext] Document lab onSnapshot listener warning:", err);
      setLabBiomarkers([]);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid, activeProfileId, isPrimaryProfile]);

  // 3. Evaluate real-time drug-lab contraindications
  const drugLabContraindications = useMemo(() => {
    return evaluateDrugLabContraindications(medications, labBiomarkers);
  }, [medications, labBiomarkers]);

  // 4. Load Google Form Intake data
  useEffect(() => {
    let isMounted = true;
    async function loadFormResponses() {
      if (!user || !activeProfile?.googleFormId) {
        if (isMounted) {
          setFormResponsesText("");
          setFormLoading(false);
        }
        return;
      }
      
      try {
        setFormResponsesText("");
        setFormLoading(true);
        let formContext = "";
        try {
          const formMeta = await getForm(activeProfile.googleFormId);
          const responses = await getFormResponses(activeProfile.googleFormId);
          
          if (responses?.responses?.length > 0) {
             let latest = responses.responses[0];
             let maxTime = new Date(latest.lastSubmittedTime).getTime();
             for (let i = 1; i < responses.responses.length; i++) {
                const current = responses.responses[i];
                const time = new Date(current.lastSubmittedTime).getTime();
                if (time > maxTime || isNaN(maxTime)) {
                   maxTime = time;
                   latest = current;
                }
             }
             
             let answersText = [];
             for (const [qId, answerObj] of Object.entries(latest.answers)) {
                 const item = formMeta.items.find(i => i.questionItem?.question?.questionId === qId);
                 const qTitle = item?.title || "Unknown Question";
                 const ansArr = ((answerObj as { textAnswers?: { answers?: Array<{ value?: string }> } }).textAnswers?.answers ?? []).map((a) => a.value ?? "");
                 answersText.push(`${qTitle}: ${ansArr.join(", ")}`);
             }
             formContext = `\n[Google Forms Intake Data - ${formMeta.info.title}]\n${answersText.join("\n")}\n`;
          }
        } catch (e) {
             console.warn("Failed to load Google Forms Intake data for context", e);
        }
        if (isMounted) {
          setFormResponsesText(formContext);
        }
      } catch (err) {
        if (isMounted) setError("Failed to load clinical form data");
      } finally {
        if (isMounted) setFormLoading(false);
      }
    }

    loadFormResponses();
    return () => { isMounted = false; };
  }, [user, activeProfile?.googleFormId]);

  const loading = medsLoading || formLoading;

  const bmi = useMemo(() => {
    if (activeProfile?.height && activeProfile?.weight) {
      return calculateBMI(activeProfile.height, activeProfile.weight);
    }
    return null;
  }, [activeProfile?.height, activeProfile?.weight]);

  const contextString = useMemo(() => {
    if (!activeProfile) return "";
    let ctx = `Patient Name: ${activeProfile.name || activeProfile.fullName || "Unknown"}.\n`;
    if (activeProfile.dob) {
       // rough age
       const age = new Date().getFullYear() - new Date(activeProfile.dob).getFullYear();
       ctx += `Patient is a ${age}-year-old ${activeProfile.gender || "individual"}.\n`;
    }
    
    if (activeProfile.height) ctx += `Height: ${activeProfile.height} cm. `;
    if (activeProfile.weight) ctx += `Weight: ${activeProfile.weight} kg. `;
    if (bmi) ctx += `BMI: ${bmi}.`;
    if (activeProfile.height || activeProfile.weight) ctx += `\n`;
    
    if (activeProfile.clinicalNotes) {
      ctx += `Clinical notes: ${activeProfile.clinicalNotes}\n`;
    }
    if (medications.length > 0) {
      const medList = medications.map(m => `${m.genericName || m.name || 'Unknown medication'} (${m.dosage || 'unknown dosage'})`).join(', ');
      ctx += `Active medications: ${medList}.\n`;
    } else {
      ctx += `Active medications: None recorded.\n`;
    }
    
    if (labBiomarkers.length > 0) {
      const labList = labBiomarkers.map(b => `${b.testName}: ${b.value} ${b.unit || ''} [${b.flag || 'NORMAL'}]`).slice(0, 10).join(', ');
      ctx += `Recent Lab Biomarkers: ${labList}.\n`;
    }

    if (drugLabContraindications.length > 0) {
      const contraList = drugLabContraindications.map(c => `[${c.severity.toUpperCase()}] ${c.title}: ${c.plainSummary}`).join('; ');
      ctx += `Clinical Contraindication Alerts: ${contraList}.\n`;
    }

    if (formResponsesText) {
      ctx += formResponsesText;
    }
    
    return ctx.trim();
  }, [activeProfile, medications, labBiomarkers, drugLabContraindications, bmi, formResponsesText]);

  /**
   * Only the parts of the clinical context that are NOT already produced by
   * contextService.formatContextForPrompt (drug–lab contraindication alerts and
   * Google Forms intake answers). Used by the Specialist Lounge to avoid sending
   * duplicate profile/medication/lab blocks to the model.
   */
  const supplementaryContext = useMemo(() => {
    if (!activeProfile) return "";
    let ctx = "";
    if (drugLabContraindications.length > 0) {
      const contraList = drugLabContraindications.map(c => `[${c.severity.toUpperCase()}] ${c.title}: ${c.plainSummary}`).join('; ');
      ctx += `Drug–lab contraindication alerts (rule-based): ${contraList}.\n`;
    }
    if (formResponsesText) {
      ctx += formResponsesText;
    }
    return ctx.trim();
  }, [activeProfile, drugLabContraindications, formResponsesText]);

  return {
    contextString,
    supplementaryContext,
    profile: activeProfile,
    medications,
    labBiomarkers,
    drugLabContraindications,
    bmi,
    loading,
    error
  };
}
