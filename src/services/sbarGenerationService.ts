import { LabResult, Medication, UserProfile } from '../types/medical';
import { GoogleGenAI } from "../lib/geminiClient";
import { CORE_SYSTEM_PROMPT, OUTPUT_FORMAT_JSON } from './ai/promptFramework';

const ai = new GoogleGenAI({});

export const generateSBAR = async (
  profile: UserProfile, 
  labs: LabResult[], 
  meds: Medication[]
): Promise<string> => {
  const activeMeds = meds.filter(m => m.status === 'active');
  const criticalLabs = labs.filter(l => l.status === 'critical' || l.status === 'abnormal').slice(0, 5);
  
  const age = profile.dob ? Math.floor((new Date().getTime() - new Date(profile.dob).getTime()) / 3.15576e+10) : 'Unknown';

  const prompt = `${CORE_SYSTEM_PROMPT}

<task>
Convert the provided health data into an SBAR handoff note for clinician review.
Keep it concise, factual, and clinically neutral.
Do not invent missing details.
</task>

<audience>
Clinician
</audience>

<input>
PATIENT CONTEXT:
- Age: ${age}
- Gender: ${profile.gender || 'Unknown'}
- Conditions: ${profile.chronicConditions?.join(', ') || 'None reported'}
- Allergies: ${profile.allergies?.join(', ') || 'None reported'}

ACTIVE MEDICATIONS:
${activeMeds.map(m => `- ${m.name} ${m.dosage} (${m.frequency})`).join('\n') || 'No active medications'}

RECENT LAB RESULTS (FOCUS AREAS):
${criticalLabs.map(l => `- ${l.markerName}: ${l.value} ${l.unit} (${l.status})`).join('\n') || 'All values within normal limits'}
</input>

${OUTPUT_FORMAT_JSON}
Return valid JSON with exactly these keys: task_type, situation, background, assessment, recommendation, missing_information, confidence_note.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    let text = response.text || "";
    text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    
    const parsed = JSON.parse(text);
    
    let resultStr = `SITUATION:\n${parsed.situation || 'Not provided'}\n\n`;
    resultStr += `BACKGROUND:\n${parsed.background || 'Not provided'}\n\n`;
    resultStr += `ASSESSMENT:\n${parsed.assessment || 'Not provided'}\n\n`;
    resultStr += `RECOMMENDATION:\n${parsed.recommendation || 'Not provided'}`;
    
    if (parsed.missing_information) {
      resultStr += `\n\nMISSING INFORMATION:\n${parsed.missing_information}`;
    }
    if (parsed.confidence_note) {
      resultStr += `\n\nCONFIDENCE:\n${parsed.confidence_note}`;
    }
    
    return resultStr.trim();

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


