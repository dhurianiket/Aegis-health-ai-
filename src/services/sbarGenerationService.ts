import { LabResult, Medication, UserProfile } from '../types/medical';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateSBAR = async (
  profile: UserProfile, 
  labs: LabResult[], 
  meds: Medication[]
): Promise<string> => {
  const activeMeds = meds.filter(m => m.status === 'active');
  const criticalLabs = labs.filter(l => l.status === 'critical' || l.status === 'abnormal').slice(0, 5);
  
  const age = profile.dob ? Math.floor((new Date().getTime() - new Date(profile.dob).getTime()) / 3.15576e+10) : 'Unknown';

  const prompt = `Generate a professional medical SBAR (Situation, Background, Assessment, Recommendation) summary for a ${age}-year-old ${profile.gender || ''} patient.
  
  PATIENT PROFILE:
  - Conditions: ${profile.chronicConditions?.join(', ') || 'None reported'}
  - Allergies: ${profile.allergies?.join(', ') || 'None reported'}
  
  ACTIVE MEDICATIONS:
  ${activeMeds.map(m => `- ${m.name} ${m.dosage} (${m.frequency})`).join('\n') || 'No active medications'}
  
  RECENT LAB RESULTS (FOCUS AREAS):
  ${criticalLabs.map(l => `- ${l.markerName}: ${l.value} ${l.unit} (${l.status})`).join('\n') || 'All values within normal limits'}
  
  INSTRUCTIONS:
  1. Use a professional, concise clinical tone.
  2. The Situation should summarize the current clinical status.
  3. The Background should highlight relevant history and meds.
  4. The Assessment should interpret the lab findings in context.
  5. The Recommendation should suggest actionable next steps for a physician to consider.
  6. Return ONLY the SBAR text. Do not use AI conversational filler.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: prompt,
    });
    
    return response.text || "Failed to generate AI summary. Please try again.";
  } catch (error) {
    console.error("Gemini SBAR Generation failed:", error);
    // Fallback to template if AI fails
    const situation = `Patient is a ${age}-year-old ${profile.gender || ''} presenting for review of recent laboratory observations.`;
    const background = `Chronic Conditions: ${profile.chronicConditions?.join(', ') || 'None reported'}. Allergies: ${profile.allergies?.join(', ') || 'None reported'}. Active Medications: ${activeMeds.length > 0 ? activeMeds.map(m => `${m.name} ${m.dosage}`).join(', ') : 'None'}.`;
    const assessment = `Recent laboratory data indicates ${criticalLabs.length} abnormal/critical values. ${criticalLabs.length > 0 ? criticalLabs.map(l => `${l.markerName}: ${l.value} ${l.unit}`).join(', ') : 'All recent labs appear within normal limits.'}`;
    const recommendation = `1. Review abnormal markers. 2. Evaluate medication regimen. 3. Schedule follow-up as indicated.`;

    return `SITUATION:\n${situation}\n\nBACKGROUND:\n${background}\n\nASSESSMENT:\n${assessment}\n\nRECOMMENDATION:\n${recommendation}`;
  }
};
