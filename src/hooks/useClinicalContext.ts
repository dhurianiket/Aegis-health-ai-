import { useState, useEffect, useMemo } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { getActiveMedications } from '../services/medicationService';
import { calculateBMI } from '../utils/calculateBMI';
import { getForm, getFormResponses } from '../services/googleFormsService';
import { db } from '../lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export function useClinicalContext() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  
  const [medications, setMedications] = useState<any[]>([]);
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
    const q = query(
      collection(db, 'users', user.uid, 'medications'),
      where('endDate', '==', null),
      orderBy('addedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeMeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedications(activeMeds);
      setMedsLoading(false);
    }, (err) => {
      console.error("[useClinicalContext] Failed to load medications via onSnapshot, falling back:", err);
      // Fallback
      getActiveMedications(user.uid)
        .then(activeMeds => {
          setMedications(activeMeds);
        })
        .catch(console.error)
        .finally(() => setMedsLoading(false));
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Load Google Form Intake data
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
             const latest = responses.responses.reduce((latestResp: any, currentResp: any) => new Date(currentResp.lastSubmittedTime).getTime() > new Date(latestResp.lastSubmittedTime).getTime() ? currentResp : latestResp);
             
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
    
    if (formResponsesText) {
      ctx += formResponsesText;
    }
    
    return ctx.trim();
  }, [activeProfile, medications, bmi, formResponsesText]);

  return {
    contextString,
    profile: activeProfile,
    medications,
    bmi,
    loading,
    error
  };
}
