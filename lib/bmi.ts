import { BMICategory, VitalStatus } from '../schemas/health.schema';

/**
 * Calculate Body Mass Index (BMI).
 * Formula: weight (kg) / (height (m))^2
 * @param weightKg Weight in kilograms
 * @param heightCm Height in centimeters
 * @returns BMI rounded to 2 decimal places, or 0 if inputs are invalid
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return 0;
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 100) / 100;
}

/**
 * Determine the BMI category according to standard WHO guidelines.
 * @param bmi Calculated BMI number
 * @returns BMICategory ('Underweight' | 'Normal' | 'Overweight' | 'Obese')
 */
export function getBMICategory(bmi: number): BMICategory {
  if (bmi <= 0) return 'Normal';
  if (bmi < 18.5) return 'Underweight';
  if (bmi <= 24.99) return 'Normal';
  if (bmi <= 29.99) return 'Overweight';
  return 'Obese';
}

/**
 * Return health status for a given BMI.
 */
export function getBMIStatus(bmi: number): VitalStatus {
  if (bmi <= 0) return 'normal';
  if (bmi >= 18.5 && bmi <= 24.99) return 'normal';
  if ((bmi >= 17.0 && bmi < 18.5) || (bmi >= 25.0 && bmi <= 29.99)) return 'warning';
  return 'critical';
}
