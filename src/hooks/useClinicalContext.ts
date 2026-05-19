import { useState, useEffect, useMemo } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { getActiveMedications } from '../services/medicationService';
import { calculateBMI } from '../utils/calculateBMI';

export function useClinicalContext() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadMeds() {
      if (!user) {
        if (isMounted) {
          setMedications([]);
          setLoading(false);
        }
        return;
      }
      
      try {
        setLoading(true);
        // Attempt to load from medication service
        const activeMeds = await getActiveMedications(user.uid);
        if (isMounted) setMedications(activeMeds);
      } catch (err) {
        console.error("Failed to load active medications for clinical context", err);
        if (isMounted) setError("Failed to load clinical context");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMeds();
    return () => { isMounted = false; };
  }, [user]);

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
    return ctx.trim();
  }, [activeProfile, medications, bmi]);

  return {
    contextString,
    profile: activeProfile,
    medications,
    bmi,
    loading,
    error
  };
}
