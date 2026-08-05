import { useState, useEffect, useMemo } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { getActiveMedications } from '../services/medicationService';
import { calculateBMI } from '../utils/calculateBMI';
import { getForm, getFormResponses } from '../services/googleFormsService';
import { db } from '../lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

import { evaluateDrugLabContraindications, LabBiomarker, DrugLabContraindication } from '../services/drugLabEngine';

export function useClinicalContext() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  
  const [medications, setMedications] = useState<any[]>([]);
  const [labBiomarkers, setLabBiomarkers] = useState<LabBiomarker[]>([]);
  const [formResponsesText, setFormResponsesText] = useState<string>("");
  const [medsLoading, setMedsLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Listen for real-time medication updates
  useEffect(() => {
    if (!user) {
      setMedications([]);
      setMedsLoading(false);
      return;
    }

    setMedsLoading(true);
    const q = collection(db, 'users', user.uid, 'medications');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeMeds = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(med => !med.endDate)
        .sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
      setMedications(activeMeds);
      setMedsLoading(false);
    }, (err) => {
      console.warn("[useClinicalContext] Failed to load medications via onSnapshot, falling back:", err);
      // Fallback
      getActiveMedications(user.uid)
        .then(activeMeds => {
          setMedications(activeMeds);
        })
        .catch(console.warn)
        .finally(() => setMedsLoading(false));
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Listen for real-time lab document updates (AGENTS.md Rule 3)
  useEffect(() => {
    if (!user) {
      setLabBiomarkers([]);
      return;
    }

    const docQuery = collection(db, 'users', user.uid, 'documents');

    const unsubscribe = onSnapshot(docQuery, (snapshot) => {
      const extractedLabs: LabBiomarker[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const extracted = data.extractedData || data;
        const obs = extracted.lab_values || extracted.observations || extracted.labResults || [];
        if (Array.isArray(obs)) {
          obs.forEach((l: any) => {
            const testName = l.testName || l.marker || l.markerName || "";
            if (testName) {
              extractedLabs.push({
                id: l.id || docSnap.id,
                testName,
                marker: testName,
                value: String(l.value || l.display_value || l.numeric_value || ""),
                numericValue: typeof l.numericValue === "number" ? l.numericValue : (typeof l.numeric_value === "number" ? l.numeric_value : null),
                unit: l.unit || l.unitOriginal || "",
                referenceRange: l.referenceRange || l.reference_range || "",
                flag: l.flag || l.status || "NORMAL",
                date: l.date || data.createdAt || data.date,
              });
            }
          });
        }
      });
      setLabBiomarkers(extractedLabs);
    }, (err) => {
      console.warn("[useClinicalContext] Document lab onSnapshot listener warning:", err);
    });

    return () => unsubscribe();
  }, [user]);

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
        setFormLoading(true);
        let formContext = "";
        try {
          const formMeta = await getForm(activeProfile.googleFormId);
          const responses = await getFormResponses(activeProfile.googleFormId);
          
          if (responses?.responses?.length > 0) {
             const latest = responses.responses.reduce((latest: any, current: any) => new Date(current.lastSubmittedTime).getTime() > new Date(latest.lastSubmittedTime).getTime() ? current : latest);
             
             let answersText = [];
             for (const [qId, answerObj] of Object.entries(latest.answers)) {
                 const item = formMeta.items.find(i => i.questionItem?.question?.questionId === qId);
                 const qTitle = item?.title || "Unknown Question";
                 const ansArr = (answerObj as any).textAnswers?.answers?.map((a:any) => a.value) || [];
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
      const medList = medications.map(m => `${m.genericName || m.name} (${m.dosage || 'unknown dosage'})`).join(', ');
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

  return {
    contextString,
    profile: activeProfile,
    medications,
    labBiomarkers,
    drugLabContraindications,
    bmi,
    loading,
    error
  };
}
