/**
 * Calculates BMI from weight (kg) and height (cm).
 * Returns the BMI rounded to 1 decimal place, or null if inputs are invalid/missing.
 */
export function calculateBMI(height_cm?: number, weight_kg?: number): number | null {
  if (!height_cm || !weight_kg || height_cm <= 0 || weight_kg <= 0) {
    return null;
  }
  const height_m = height_cm / 100;
  const bmi = weight_kg / (height_m * height_m);
  return Math.round(bmi * 10) / 10;
}
