import { z } from 'zod';

export const MyInfoSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  age: z.number().int().min(1, 'Age must be greater than 0').max(150, 'Please enter a valid age'),
  sex: z.enum(['Male', 'Female', 'Other'], {
    message: 'Please select a gender',
  }),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  address: z.string().min(1, 'Address is required'),
});

export type MyInfo = z.infer<typeof MyInfoSchema>;

export const BloodSugarTypeEnum = z.enum(['Fasting', 'Random', 'Other']);
export type BloodSugarType = z.infer<typeof BloodSugarTypeEnum>;

export const BMICategoryEnum = z.enum(['Underweight', 'Normal', 'Overweight', 'Obese']);
export type BMICategory = z.infer<typeof BMICategoryEnum>;

export const HealthRecordSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string(), // ISO String representation of date
  heartRate: z.number().min(30, 'Heart rate must be at least 30 BPM').max(250, 'Heart rate must be under 250 BPM'),
  systolic: z.number().min(50, 'Systolic BP must be at least 50 mmHg').max(260, 'Systolic BP must be under 260 mmHg'),
  diastolic: z.number().min(30, 'Diastolic BP must be at least 30 mmHg').max(180, 'Diastolic BP must be under 180 mmHg'),
  temperature: z.number().min(30, 'Temperature must be at least 30°C').max(45, 'Temperature must be under 45°C'),
  oxygenLevel: z.number().min(50, 'SpO2 must be at least 50%').max(100, 'SpO2 cannot exceed 100%'),
  weight: z.number().min(10, 'Weight must be at least 10 kg').max(400, 'Weight must be under 400 kg'),
  height: z.number().min(50, 'Height must be at least 50 cm').max(260, 'Height must be under 260 cm'),
  bmi: z.number(),
  bmiCategory: BMICategoryEnum,
  bloodSugar: z.number().min(20, 'Blood sugar must be at least 20 mg/dL').max(600, 'Blood sugar must be under 600 mg/dL'),
  bloodSugarType: BloodSugarTypeEnum,
});

export type HealthRecord = z.infer<typeof HealthRecordSchema>;

export type VitalStatus = 'normal' | 'warning' | 'critical';
