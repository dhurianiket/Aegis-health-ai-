import { SpecialistId, SpecialistProfile } from '../../../types/ai';
import { getCardiologistPrompt } from './cardiologist';
import { getEndocrinologistPrompt } from './endocrinologist';
import { getNeurologistPrompt } from './neurologist';
import { getGastroenterologistPrompt } from './gastroenterologist';
import { getPulmonologistPrompt } from './pulmonologist';
import { getNephrologistPrompt } from './nephrologist';
import { getPsychiatristPrompt } from './psychiatrist';
import { getDermatologistPrompt } from './dermatologist';
import { getOrthopedistPrompt } from './orthopedist';
import { getOncologistPrompt } from './oncologist';

/**
 * Specialist Lounge personas, framed as AI health information guides (not
 * doctors). Display names always carry the "(AI)" suffix. Prompts are built
 * from the shared SAFETY_CORE (see ./safetyCore.ts) plus a persona body.
 */
export const SPECIALISTS: Record<SpecialistId, SpecialistProfile> = {
  cardiologist: {
    id: 'cardiologist',
    name: 'Heart Health Guide',
    displayName: 'Heart Health Guide (AI)',
    specialty: 'Cardiology',
    description: 'AI health information guide for heart topics: blood pressure, cholesterol, heart rhythm and heart tests',
    expertise: ['Coronary artery disease', 'Heart failure', 'Atrial fibrillation', 'Lipid disorders'],
    guidelines: ['IHCI/ICMR 2024', 'CSI Lipid 2024', 'ACC/AHA 2024', 'ESC 2025'],
    systemPrompt: getCardiologistPrompt(),
  },
  endocrinologist: {
    id: 'endocrinologist',
    name: 'Diabetes & Thyroid Guide',
    displayName: 'Diabetes & Thyroid Guide (AI)',
    specialty: 'Endocrinology',
    description: 'AI health information guide for diabetes, thyroid and hormone-related reports',
    expertise: ['Type 1 & Type 2 Diabetes', 'Thyroid disorders', 'PCOS', 'Osteoporosis'],
    guidelines: ['RSSDI 2024', 'ICMR T2D STW', 'ADA Standards of Care 2025'],
    systemPrompt: getEndocrinologistPrompt(),
  },
  neurologist: {
    id: 'neurologist',
    name: 'Brain & Nerve Health Guide',
    displayName: 'Brain & Nerve Health Guide (AI)',
    specialty: 'Neurology',
    description: 'AI health information guide for headache, seizures, stroke awareness and memory topics',
    expertise: ['Headaches', 'Epilepsy', 'Stroke', 'Dementia'],
    guidelines: ['ICMR Stroke STW', 'AAN 2024'],
    systemPrompt: getNeurologistPrompt(),
  },
  gastroenterologist: {
    id: 'gastroenterologist',
    name: 'Digestive & Liver Health Guide',
    displayName: 'Digestive & Liver Health Guide (AI)',
    specialty: 'Gastroenterology',
    description: 'AI health information guide for stomach, bowel and liver topics and liver function tests',
    expertise: ['IBS', 'IBD', 'GERD', 'Liver Disease'],
    guidelines: ['ISG MASLD 2024', 'ICMR GERD STW', 'ACG/AGA 2024'],
    systemPrompt: getGastroenterologistPrompt(),
  },
  pulmonologist: {
    id: 'pulmonologist',
    name: 'Lung & Breathing Guide',
    displayName: 'Lung & Breathing Guide (AI)',
    specialty: 'Pulmonology',
    description: 'AI health information guide for asthma, COPD, breathing tests and sleep apnoea',
    expertise: ['Asthma', 'COPD', 'Sleep Apnea'],
    guidelines: ['ICMR Asthma/COPD STW', 'GOLD 2025', 'ATS/ERS 2024'],
    systemPrompt: getPulmonologistPrompt(),
  },
  nephrologist: {
    id: 'nephrologist',
    name: 'Kidney Health Guide',
    displayName: 'Kidney Health Guide (AI)',
    specialty: 'Nephrology',
    description: 'AI health information guide for kidney function tests, CKD and electrolytes',
    expertise: ['CKD', 'Hypertension', 'Electrolytes'],
    guidelines: ['ICMR CKD STW', 'KDIGO 2024'],
    systemPrompt: getNephrologistPrompt(),
  },
  psychiatrist: {
    id: 'psychiatrist',
    name: 'Mental Wellbeing Guide',
    displayName: 'Mental Wellbeing Guide (AI)',
    specialty: 'Psychiatry',
    description: 'AI health information guide for stress, mood, anxiety and sleep, with helpline signposting',
    expertise: ['Depression', 'Anxiety', 'Bipolar Disorder'],
    guidelines: ['Tele-MANAS/NMHP 2024', 'APA/DSM-5-TR 2024'],
    systemPrompt: getPsychiatristPrompt(),
  },
  dermatologist: {
    id: 'dermatologist',
    name: 'Skin Health Guide',
    displayName: 'Skin Health Guide (AI)',
    specialty: 'Dermatology',
    description: 'AI health information guide for skin, hair and nail topics',
    expertise: ['Melanoma', 'Eczema', 'Psoriasis'],
    guidelines: ['IADVL 2024', 'AAD 2024'],
    systemPrompt: getDermatologistPrompt(),
  },
  orthopedist: {
    id: 'orthopedist',
    name: 'Bone & Joint Health Guide',
    displayName: 'Bone & Joint Health Guide (AI)',
    specialty: 'Orthopedics',
    description: 'AI health information guide for bone, joint and muscle topics and bone density reports',
    expertise: ['Fractures', 'Joint Replacement', 'Sports Injuries'],
    guidelines: ['IOA/ICMR STW 2024', 'AAOS 2024'],
    systemPrompt: getOrthopedistPrompt(),
  },
  oncologist: {
    id: 'oncologist',
    name: 'Cancer Care Information Guide',
    displayName: 'Cancer Care Information Guide (AI)',
    specialty: 'Oncology',
    description: 'AI health information guide for cancer screening, reports and treatment side-effect topics',
    expertise: ['Solid Tumors', 'Leukemia', 'Lymphoma'],
    guidelines: ['NCG India 2024', 'NCCN 2025'],
    systemPrompt: getOncologistPrompt(),
  }
};

export function getSpecialist(id: SpecialistId): SpecialistProfile {
  const specialist = SPECIALISTS[id];
  if (!specialist) {
    throw new Error(`Unknown specialist: ${id}`);
  }
  return specialist;
}

export function getSpecialistSystemPrompt(id: SpecialistId): string {
  return getSpecialist(id).systemPrompt;
}
