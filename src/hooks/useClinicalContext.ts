import { useState, useEffect, useMemo } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { getActiveMedications } from '../services/medicationService';
import { calculateBMI } from '../utils/calculateBMI';
import { getForm, getFormResponses } from '../services/googleFormsService';

export function useClinicalContext() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  
  const [medications, setMedications] = useState<any[]>([]);
  const [formResponsesText, setFormResponsesText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user) {
        if (isMounted) {
          setMedications([]);
          setFormResponsesText("");
          setLoading(false);
        }
        return;
      }
      
      try {
        setLoading(true);
        // Attempt to load from medication service
        const activeMeds = await getActiveMedications(user.uid).catch(err => {
          console.error("Failed to load active medications for clinical context", err);
          return [];
        });
        if (isMounted) setMedications(activeMeds);
        
        let formContext = "";
        if (activeProfile?.googleFormId) {
          try {
            const formMeta = await getForm(activeProfile.googleFormId);
            const responses = await getFormResponses(activeProfile.googleFormId);
            
            // Format the latest response
            if (responses?.responses?.length > 0) {
               // Get easiest latest
               const latest = responses.responses.sort((a,b) => new Date(b.lastSubmittedTime).getTime() - new Date(a.lastSubmittedTime).getTime())[0];
               
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
            console.warn("Failed to load Google Forms Intake data", e);
          }
        }
        if (isMounted) {
          setFormResponsesText(formContext);
          if (formContext) {
            console.log("[useClinicalContext] Fetched Google Forms Intake Data:", formContext);
          }
        }
        
      } catch (err) {
        if (isMounted) setError("Failed to load clinical context");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [user, activeProfile?.googleFormId]);

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
