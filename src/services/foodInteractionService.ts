/**
 * foodInteractionService.ts — Food-Drug & Dietary Supplement Contraindication Engine
 * Evaluates active drug regimens against dangerous dietary contraindications in Indian diets:
 * 1. Grapefruit Juice + Statins / CCBs (CYP3A4 inhibition -> toxicity)
 * 2. Dairy / Milk + Antibiotics / Iron (Cation chelation -> 80% absorption loss)
 * 3. High Vitamin K (Spinach/Palak, Methi, Broccoli) + Warfarin / Acenocoumarol (INR drop)
 * 4. High Potassium (Bananas, Coconut Water) + ACE Inhibitors / ARBs / Spironolactone (Hyperkalemia)
 * 5. High Tannin Tea / Coffee + Oral Iron / Theophylline (Iron binding / Arrhythmia)
 * 6. Tyramine-Rich / Fermented Foods + Linezolid / MAOIs (Hypertensive Crisis)
 */

export type FoodSeverity = 'critical' | 'warning' | 'info';

export interface FoodContraindicationRule {
  id: string;
  foodName: string;
  foodCategory: 'Citrus' | 'Dairy' | 'Leafy Greens' | 'Potassium-Rich' | 'Beverages' | 'Fermented';
  icon: string;
  targetDrugKeywords: string[];
  severity: FoodSeverity;
  headline: string;
  mechanism: string;
  clinicalImpact: string;
  timingAdvice: string;
}

export interface DetectedFoodInteraction {
  ruleId: string;
  medicationName: string;
  foodName: string;
  foodCategory: string;
  icon: string;
  severity: FoodSeverity;
  headline: string;
  mechanism: string;
  clinicalImpact: string;
  timingAdvice: string;
}

export const FOOD_RULES: FoodContraindicationRule[] = [
  {
    id: 'food-grapefruit-statin',
    foodName: 'Grapefruit & Grapefruit Juice',
    foodCategory: 'Citrus',
    icon: 'Grapefruit',
    targetDrugKeywords: ['atorvastatin', 'simvastatin', 'lovastatin', 'amlodipine', 'nifedipine', 'felodipine', 'cyclosporine'],
    severity: 'critical',
    headline: 'Grapefruit Juice + Statin / CCB Toxicity Risk',
    mechanism: 'Inhibits intestinal CYP3A4 enzyme metabolism, increasing blood concentration of the drug by 3x-5x.',
    clinicalImpact: 'High risk of rhabdomyolysis (muscle breakdown), kidney injury, or severe hypotension.',
    timingAdvice: 'Avoid grapefruit and grapefruit juice completely while taking this medication.',
  },
  {
    id: 'food-dairy-antibiotic',
    foodName: 'Dairy, Milk, Yogurt & Calcium Foods',
    foodCategory: 'Dairy',
    icon: 'Milk',
    targetDrugKeywords: ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'doxycycline', 'tetracycline', 'ferrous', 'iron'],
    severity: 'warning',
    headline: 'Dairy / Calcium Chelation & Reduced Absorption',
    mechanism: 'Calcium ions bind to fluoroquinolones, tetracyclines, or iron to form insoluble chelate complexes.',
    clinicalImpact: 'Reduces antibiotic or iron absorption by up to 80%, causing treatment failure.',
    timingAdvice: 'Take medication at least 2 hours before or 4 hours after consuming dairy or calcium-fortified foods.',
  },
  {
    id: 'food-vitamin-k-warfarin',
    foodName: 'High Vitamin K Greens (Spinach/Palak, Methi, Broccoli, Kale)',
    foodCategory: 'Leafy Greens',
    icon: 'LeafyGreen',
    targetDrugKeywords: ['warfarin', 'coumadin', 'acenocoumarol', 'nicoumalone'],
    severity: 'critical',
    headline: 'Vitamin K Antagonism & INR Fluctuations',
    mechanism: 'Vitamin K promotes clotting factor synthesis, antagonizing the anticoagulant action of Warfarin.',
    clinicalImpact: 'Lowers INR below therapeutic range, increasing blood clot and stroke risk.',
    timingAdvice: 'Maintain consistent daily Vitamin K intake. Avoid sudden large portions of leafy green vegetables.',
  },
  {
    id: 'food-potassium-acei',
    foodName: 'High Potassium (Bananas, Tender Coconut Water, Salt Substitutes)',
    foodCategory: 'Potassium-Rich',
    icon: 'Banana',
    targetDrugKeywords: ['lisinopril', 'enalapril', 'ramipril', 'perindopril', 'losartan', 'telmisartan', 'valsartan', 'spironolactone'],
    severity: 'warning',
    headline: 'Potassium Accumulation & Hyperkalemia Risk',
    mechanism: 'ACE inhibitors and ARBs reduce aldosterone secretion, decreasing renal potassium excretion.',
    clinicalImpact: 'Excessive potassium intake can induce hyperkalemia, causing cardiac arrhythmias or cardiac arrest.',
    timingAdvice: 'Avoid consuming large quantities of tender coconut water or potassium salt substitutes.',
  },
  {
    id: 'food-tea-iron',
    foodName: 'High-Tannin Tea & Coffee',
    foodCategory: 'Beverages',
    icon: 'Coffee',
    targetDrugKeywords: ['ferrous', 'iron', 'theophylline', 'aminophylline'],
    severity: 'info',
    headline: 'Tannin Binding & Bioavailability Reduction',
    mechanism: 'Tannins in tea and coffee bind non-heme iron in the stomach to form insoluble precipitates.',
    clinicalImpact: 'Impairs oral iron absorption; increases caffeine-induced tachycardia with Bronchodilators.',
    timingAdvice: 'Drink tea or coffee at least 1 hour after taking oral iron supplements.',
  },
  {
    id: 'food-tyramine-maoi',
    foodName: 'Aged Cheese, Fermented Foods & Soy Sauce',
    foodCategory: 'Fermented',
    icon: 'Cheese',
    targetDrugKeywords: ['linezolid', 'selegiline', 'rasagiline', 'phenelzine', 'isocarboxazid'],
    severity: 'critical',
    headline: 'Tyramine Hypertensive Crisis Warning',
    mechanism: 'Inhibition of monoamine oxidase prevents breakdown of dietary tyramine in the gut.',
    clinicalImpact: 'Accumulated tyramine causes sudden norepinephrine release, leading to life-threatening hypertensive crisis.',
    timingAdvice: 'Strictly avoid aged cheese, yeast extracts, and unpasteurized tap beer.',
  },
];

/**
 * Evaluates a list of active medication names against dietary rules
 */
export function evaluateFoodInteractions(medications: string[] = []): DetectedFoodInteraction[] {
  if (!medications || medications.length === 0) return [];

  const detected: DetectedFoodInteraction[] = [];

  medications.forEach((medName) => {
    const cleanMed = medName.toLowerCase().trim();
    if (!cleanMed) return;

    FOOD_RULES.forEach((rule) => {
      const match = rule.targetDrugKeywords.some((kw) => cleanMed.includes(kw));
      if (match) {
        // Prevent duplicates for same med and rule
        const exists = detected.some((d) => d.ruleId === rule.id && d.medicationName.toLowerCase() === cleanMed);
        if (!exists) {
          detected.push({
            ruleId: rule.id,
            medicationName: medName,
            foodName: rule.foodName,
            foodCategory: rule.foodCategory,
            icon: rule.icon,
            severity: rule.severity,
            headline: rule.headline,
            mechanism: rule.mechanism,
            clinicalImpact: rule.clinicalImpact,
            timingAdvice: rule.timingAdvice,
          });
        }
      }
    });
  });

  return detected;
}
