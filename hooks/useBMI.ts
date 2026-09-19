import { useMemo } from 'react';
import { calculateBMI, getBMICategory, getBMIStatus } from '../lib/bmi';
import { BMICategory, VitalStatus } from '../schemas/health.schema';

interface UseBMIOptions {
  weightKg?: number;
  heightCm?: number;
}

interface UseBMIResult {
  bmi: number;
  category: BMICategory;
  status: VitalStatus;
  isValid: boolean;
  formattedBMI: string;
}

/**
 * Reactive hook to calculate and evaluate BMI based on given weight (kg) and height (cm).
 */
export function useBMI({ weightKg, heightCm }: UseBMIOptions): UseBMIResult {
  const result = useMemo(() => {
    const w = Number(weightKg);
    const h = Number(heightCm);

    if (!w || !h || w <= 0 || h <= 0) {
      return {
        bmi: 0,
        category: 'Normal' as BMICategory,
        status: 'normal' as VitalStatus,
        isValid: false,
        formattedBMI: '--',
      };
    }

    const bmi = calculateBMI(w, h);
    const category = getBMICategory(bmi);
    const status = getBMIStatus(bmi);

    return {
      bmi,
      category,
      status,
      isValid: true,
      formattedBMI: bmi.toFixed(2),
    };
  }, [weightKg, heightCm]);

  return result;
}

