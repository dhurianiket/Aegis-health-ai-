import { describe, it, expect } from 'vitest';
import { evaluateFoodInteractions, FOOD_RULES } from '../foodInteractionService';

describe('Pillar 3: Food-Drug Contraindication Engine', () => {
  it('should detect Grapefruit + Statin contraindication', () => {
    const meds = ['Atorvastatin 20mg'];
    const detected = evaluateFoodInteractions(meds);

    expect(detected.length).toBeGreaterThan(0);

    const grapefruitMatch = detected.find((d) => d.ruleId === 'food-grapefruit-statin');
    expect(grapefruitMatch).toBeDefined();
    expect(grapefruitMatch!.severity).toBe('critical');
    expect(grapefruitMatch!.medicationName).toBe('Atorvastatin 20mg');
  });

  it('should detect Dairy + Antibiotic chelation risk', () => {
    const meds = ['Ciprofloxacin 500mg'];
    const detected = evaluateFoodInteractions(meds);

    const dairyMatch = detected.find((d) => d.ruleId === 'food-dairy-antibiotic');
    expect(dairyMatch).toBeDefined();
    expect(dairyMatch!.severity).toBe('warning');
    expect(dairyMatch!.timingAdvice).toContain('2 hours before');
  });

  it('should detect High Potassium + ACE Inhibitor risk', () => {
    const meds = ['Lisinopril 10mg'];
    const detected = evaluateFoodInteractions(meds);

    const potassiumMatch = detected.find((d) => d.ruleId === 'food-potassium-acei');
    expect(potassiumMatch).toBeDefined();
    expect(potassiumMatch!.foodName).toContain('Potassium');
  });

  it('should return empty list when no contraindications match', () => {
    const meds = ['Paracetamol 500mg', 'Metformin 500mg'];
    const detected = evaluateFoodInteractions(meds);
    expect(detected.length).toBe(0);
  });
});
