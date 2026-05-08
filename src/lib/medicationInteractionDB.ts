export interface InteractionRule {
  drugs: [string, string];
  severity: 'critical' | 'high' | 'moderate';
  description: string;
}

export const DRUG_INTERACTIONS: InteractionRule[] = [
  {
    drugs: ['statin', 'macrolide'],
    severity: 'high',
    description: 'Concurrent use increases risk of statin toxicity (myopathy and rhabdomyolysis).'
  },
  {
    drugs: ['warfarin', 'nsaid'],
    severity: 'critical',
    description: 'Concurrent use significantly increases the risk of serious gastrointestinal bleeding.'
  },
  {
    drugs: ['ssri', 'maoi'],
    severity: 'critical',
    description: 'Risk of potentially fatal serotonin syndrome.'
  },
  {
    drugs: ['ace inhibitor', 'potassium'],
    severity: 'high',
    description: 'Risk of hyperkalemia. Monitor potassium levels closely.'
  }
];

export const isDuplicateClass = (med1: string, med2: string): boolean => {
  const statins = ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin'];
  const nsaids = ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'meloxicam'];
  
  if (statins.includes(med1.toLowerCase()) && statins.includes(med2.toLowerCase())) return true;
  if (nsaids.includes(med1.toLowerCase()) && nsaids.includes(med2.toLowerCase())) return true;
  
  return false;
};
