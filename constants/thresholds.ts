import { BloodSugarType, HealthRecord, VitalStatus } from '../schemas/health.schema';

export interface VitalThresholdConfig {
  unit: string;
  name: string;
  normalRangeText: string;
}

export const VITAL_CONFIGS: Record<string, VitalThresholdConfig> = {
  heartRate: {
    unit: 'BPM',
    name: 'Heart Rate',
    normalRangeText: '60 - 100 BPM',
  },
  systolic: {
    unit: 'mmHg',
    name: 'Systolic BP',
    normalRangeText: '90 - 120 mmHg',
  },
  diastolic: {
    unit: 'mmHg',
    name: 'Diastolic BP',
    normalRangeText: '60 - 80 mmHg',
  },
  temperature: {
    unit: '°C',
    name: 'Temperature',
    normalRangeText: '36.1 - 37.2 °C',
  },
  oxygenLevel: {
    unit: '%',
    name: 'Oxygen Level (SpO₂)',
    normalRangeText: '95 - 100%',
  },
  bmi: {
    unit: 'kg/m²',
    name: 'BMI',
    normalRangeText: '18.5 - 24.9',
  },
  bloodSugar: {
    unit: 'mg/dL',
    name: 'Blood Sugar',
    normalRangeText: '70 - 99 mg/dL (Fasting)',
  },
};

/**
 * Evaluates the status of Heart Rate
 */
export function getHeartRateStatus(bpm: number): VitalStatus {
  if (bpm >= 60 && bpm <= 100) return 'normal';
  if ((bpm >= 50 && bpm < 60) || (bpm > 100 && bpm <= 120)) return 'warning';
  return 'critical';
}

/**
 * Evaluates the status of Systolic Blood Pressure
 */
export function getSystolicStatus(val: number): VitalStatus {
  if (val >= 90 && val <= 120) return 'normal';
  if (val > 120 && val <= 139) return 'warning';
  return 'critical';
}

/**
 * Evaluates the status of Diastolic Blood Pressure
 */
export function getDiastolicStatus(val: number): VitalStatus {
  if (val >= 60 && val <= 80) return 'normal';
  if (val > 80 && val <= 89) return 'warning';
  return 'critical';
}

/**
 * Combined blood pressure evaluation
 */
export function getBloodPressureStatus(systolic: number, diastolic: number): VitalStatus {
  const sysStatus = getSystolicStatus(systolic);
  const diaStatus = getDiastolicStatus(diastolic);

  if (sysStatus === 'critical' || diaStatus === 'critical') return 'critical';
  if (sysStatus === 'warning' || diaStatus === 'warning') return 'warning';
  return 'normal';
}

/**
 * Evaluates the status of Body Temperature (°C)
 */
export function getTemperatureStatus(temp: number): VitalStatus {
  if (temp >= 36.1 && temp <= 37.2) return 'normal';
  if (temp > 37.2 && temp <= 38.0) return 'warning';
  return 'critical';
}

/**
 * Evaluates the status of Oxygen Level (SpO2 %)
 */
export function getOxygenStatus(oxygen: number): VitalStatus {
  if (oxygen >= 95) return 'normal';
  if (oxygen >= 90) return 'warning';
  return 'critical';
}

/**
 * Evaluates the status of Blood Sugar (mg/dL)
 */
export function getBloodSugarStatus(mgDl: number, type: BloodSugarType = 'Fasting'): VitalStatus {
  if (type === 'Fasting') {
    if (mgDl >= 70 && mgDl <= 99) return 'normal';
    if (mgDl >= 100 && mgDl <= 125) return 'warning';
    return 'critical';
  }
  // Random / Other
  if (mgDl >= 70 && mgDl <= 139) return 'normal';
  if (mgDl >= 140 && mgDl <= 199) return 'warning';
  return 'critical';
}

/**
 * General helper to get vital status by key
 */
export function getVitalStatus(
  vital: 'heartRate' | 'systolic' | 'diastolic' | 'temperature' | 'oxygenLevel' | 'bmi' | 'bloodSugar',
  value: number,
  sugarType?: BloodSugarType
): VitalStatus {
  switch (vital) {
    case 'heartRate':
      return getHeartRateStatus(value);
    case 'systolic':
      return getSystolicStatus(value);
    case 'diastolic':
      return getDiastolicStatus(value);
    case 'temperature':
      return getTemperatureStatus(value);
    case 'oxygenLevel':
      return getOxygenStatus(value);
    case 'bloodSugar':
      return getBloodSugarStatus(value, sugarType);
    case 'bmi':
      if (value >= 18.5 && value <= 24.99) return 'normal';
      if ((value >= 17.0 && value < 18.5) || (value >= 25.0 && value <= 29.99)) return 'warning';
      return 'critical';
    default:
      return 'normal';
  }
}

/**
 * Computes overall aggregated health status from the latest record.
 * If any metric is critical -> critical.
 * If any metric is warning -> warning.
 * Otherwise -> normal.
 */
export function getOverallHealthStatus(record: HealthRecord | null): VitalStatus {
  if (!record) return 'normal';

  const statuses: VitalStatus[] = [
    getHeartRateStatus(record.heartRate),
    getBloodPressureStatus(record.systolic, record.diastolic),
    getTemperatureStatus(record.temperature),
    getOxygenStatus(record.oxygenLevel),
    getBloodSugarStatus(record.bloodSugar, record.bloodSugarType),
    getVitalStatus('bmi', record.bmi),
  ];

  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('warning')) return 'warning';
  return 'normal';
}
