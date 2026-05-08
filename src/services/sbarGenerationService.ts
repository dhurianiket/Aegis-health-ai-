import { LabResult, Medication, UserProfile } from '../types/medical';

export const generateSBAR = (
  profile: UserProfile, 
  labs: LabResult[], 
  meds: Medication[]
): string => {
  const activeMeds = meds.filter(m => m.status === 'active');
  const criticalLabs = labs.filter(l => l.status === 'critical' || l.status === 'abnormal').slice(0, 5);
  
  const age = profile.dob ? Math.floor((new Date().getTime() - new Date(profile.dob).getTime()) / 3.15576e+10) : 'Unknown';

  const situation = `Patient is a ${age}-year-old ${profile.gender || ''} presenting for routine follow-up or review of recent laboratory observations.`;
  
  const background = `Chronic Conditions: ${profile.chronicConditions?.join(', ') || 'None report'}.
Allergies: ${profile.allergies?.join(', ') || 'None reported'}.
Active Medications: ${activeMeds.length > 0 ? activeMeds.map(m => \`\${m.name} \${m.dosage}\`).join(', ') : 'None'}.`;
  
  const assessment = `Recent laboratory data indicates ${criticalLabs.length} abnormal/critical values.
${criticalLabs.length > 0 ? criticalLabs.map(l => \` - \${l.markerName}: \${l.value} \${l.unit} (\${l.status})\`).join('\n') : 'All recent labs appear within normal limits.'}`;

  const recommendation = `1. Review recent abnormal laboratory markers.
2. Evaluate current medication regimen for potential adjustments.
3. Recommend scheduling follow-up testing as clinically indicated.`;

  return `SITUATION:
${situation}

BACKGROUND:
${background}

ASSESSMENT:
${assessment}

RECOMMENDATION:
${recommendation}`;
};
