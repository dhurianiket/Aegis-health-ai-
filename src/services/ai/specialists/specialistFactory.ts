import { SpecialistId, SpecialistProfile } from "../../../types/ai";
import { getCardiologistPrompt } from "./cardiologist";
import { getEndocrinologistPrompt } from "./endocrinologist";
import { getNeurologistPrompt } from "./neurologist";
import { getGastroenterologistPrompt } from "./gastroenterologist";
import { getPulmonologistPrompt } from "./pulmonologist";
import { getNephrologistPrompt } from "./nephrologist";
import { getPsychiatristPrompt } from "./psychiatrist";
import { getDermatologistPrompt } from "./dermatologist";
import { getOrthopedistPrompt } from "./orthopedist";
import { getOncologistPrompt } from "./oncologist";

export const SPECIALISTS: Record<SpecialistId, SpecialistProfile> = {
  cardiologist: {
    id: "cardiologist",
    name: "Dr. CardiologyAI",
    displayName: "AI Cardiologist",
    specialty: "Cardiology",
    description:
      "World-class cardiologist specializing in heart disease, arrhythmias, and hypertension",
    expertise: [
      "Coronary artery disease",
      "Heart failure",
      "Atrial fibrillation",
      "Lipid disorders",
    ],
    guidelines: ["ACC/AHA 2024", "ESC 2025"],
    systemPrompt: getCardiologistPrompt(),
  },
  endocrinologist: {
    id: "endocrinologist",
    name: "Dr. EndoAI",
    displayName: "AI Endocrinologist",
    specialty: "Endocrinology",
    description:
      "Expert in diabetes, thyroid disorders, and metabolic diseases",
    expertise: [
      "Type 1 & Type 2 Diabetes",
      "Thyroid disorders",
      "PCOS",
      "Osteoporosis",
    ],
    guidelines: ["ADA Standards of Care 2025", "ATA Guidelines 2024"],
    systemPrompt: getEndocrinologistPrompt(),
  },
  neurologist: {
    id: "neurologist",
    name: "Dr. NeuroAI",
    displayName: "AI Neurologist",
    specialty: "Neurology",
    description:
      "Specializing in headache, epilepsy, stroke, and neurodegenerative diseases",
    expertise: ["Headaches", "Epilepsy", "Stroke", "Dementia"],
    guidelines: ["AAN 2024"],
    systemPrompt: getNeurologistPrompt(),
  },
  gastroenterologist: {
    id: "gastroenterologist",
    name: "Dr. GastroAI",
    displayName: "AI Gastroenterologist",
    specialty: "Gastroenterology",
    description:
      "Specializing in IBS, IBD, liver diseases, GERD, and GI malignancies",
    expertise: ["IBS", "IBD", "GERD", "Liver Disease"],
    guidelines: ["ACG/AGA"],
    systemPrompt: getGastroenterologistPrompt(),
  },
  pulmonologist: {
    id: "pulmonologist",
    name: "Dr. PulmoAI",
    displayName: "AI Pulmonologist",
    specialty: "Pulmonology",
    description: "Specializing in asthma, COPD, and sleep medicine",
    expertise: ["Asthma", "COPD", "Sleep Apnea"],
    guidelines: ["ATS/ERS", "GOLD"],
    systemPrompt: getPulmonologistPrompt(),
  },
  nephrologist: {
    id: "nephrologist",
    name: "Dr. NephroAI",
    displayName: "AI Nephrologist",
    specialty: "Nephrology",
    description: "Specializing in CKD, hypertension, and electrolyte disorders",
    expertise: ["CKD", "Hypertension", "Electrolytes"],
    guidelines: ["KDIGO"],
    systemPrompt: getNephrologistPrompt(),
  },
  psychiatrist: {
    id: "psychiatrist",
    name: "Dr. PsychAI",
    displayName: "AI Psychiatrist",
    specialty: "Psychiatry",
    description:
      "Specializing in mood disorders, anxiety, and cognitive disorders",
    expertise: ["Depression", "Anxiety", "Bipolar Disorder"],
    guidelines: ["DSM-5-TR", "APA"],
    systemPrompt: getPsychiatristPrompt(),
  },
  dermatologist: {
    id: "dermatologist",
    name: "Dr. DermAI",
    displayName: "AI Dermatologist",
    specialty: "Dermatology",
    description:
      "Specializing in skin cancers, inflammatory skin diseases, and cosmetics",
    expertise: ["Melanoma", "Eczema", "Psoriasis"],
    guidelines: ["AAD"],
    systemPrompt: getDermatologistPrompt(),
  },
  orthopedist: {
    id: "orthopedist",
    name: "Dr. OrthoAI",
    displayName: "AI Orthopedist",
    specialty: "Orthopedics",
    description: "Focusing on sports medicine, joint replacements, and trauma",
    expertise: ["Fractures", "Joint Replacement", "Sports Injuries"],
    guidelines: ["AAOS"],
    systemPrompt: getOrthopedistPrompt(),
  },
  oncologist: {
    id: "oncologist",
    name: "Dr. OncoAI",
    displayName: "AI Oncologist",
    specialty: "Oncology",
    description: "Specializing in solid tumors and hematologic malignancies",
    expertise: ["Solid Tumors", "Leukemia", "Lymphoma"],
    guidelines: ["NCCN"],
    systemPrompt: getOncologistPrompt(),
  },
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
