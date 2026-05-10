import { Medication, MedicationStatus } from "../types/medical";
import { HealthAlert } from "../types/alerts";
import {
  isDuplicateClass,
  DRUG_INTERACTIONS,
  isMedInCategory,
} from "../lib/medicationInteractionDB";

/**
 * MedicationCheckService - Services for identifying drug-drug interactions
 * and duplicate therapies.
 */
export const checkMedicationInteractions = (
  meds: Medication[],
): HealthAlert[] => {
  const alerts: HealthAlert[] = [];
  const activeMeds = meds.filter((m) => m.status === MedicationStatus.ACTIVE);

  for (let i = 0; i < activeMeds.length; i++) {
    for (let j = i + 1; j < activeMeds.length; j++) {
      const med1 = activeMeds[i].name;
      const med2 = activeMeds[j].name;

      // 1. Check for Duplicate Therapy
      if (isDuplicateClass(med1, med2)) {
        alerts.push({
          id: crypto.randomUUID(),
          severity: "high",
          type: "medication",
          title: `Duplicate Therapy Detected`,
          description: `You are concurrently taking ${med1} and ${med2}, which belong to the same drug class. This may increase risk of side effects.`,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }

      // 2. Check for defined Drug Interactions
      DRUG_INTERACTIONS.forEach((interaction) => {
        const catA = interaction.drugs[0];
        const catB = interaction.drugs[1];

        const hasA1 = isMedInCategory(med1, catA);
        const hasB2 = isMedInCategory(med2, catB);

        const hasA2 = isMedInCategory(med2, catA);
        const hasB1 = isMedInCategory(med1, catB);

        if ((hasA1 && hasB2) || (hasA2 && hasB1)) {
          alerts.push({
            id: crypto.randomUUID(),
            severity: interaction.severity,
            type: "medication",
            title: `Potential Drug Interaction`,
            description: `Interaction between ${med1} and ${med2}: ${interaction.description}`,
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
      });
    }
  }

  return alerts;
};
