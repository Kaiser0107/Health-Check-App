import { z } from 'zod';

export const MyInfoSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  age: z.coerce
    .number({ message: 'Please enter a valid age' })
    .int('Age must be a whole number')
    .min(1, 'Age must be greater than 0')
    .max(150, 'Please enter a valid age'),
  sex: z.enum(['Male', 'Female'], {
    message: 'Please select Male or Female',
  }),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  address: z.string().min(1, 'Address is required'),
});

export type MyInfo = z.infer<typeof MyInfoSchema>;
export type MyInfoInput = z.input<typeof MyInfoSchema>;

export const BloodSugarTypeEnum = z.enum(['Fasting', 'Random', 'Other']);
export type BloodSugarType = z.infer<typeof BloodSugarTypeEnum>;

export const BMICategoryEnum = z.enum(['Underweight', 'Normal', 'Overweight', 'Obese']);
export type BMICategory = z.infer<typeof BMICategoryEnum>;

export const HealthRecordSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string(), // ISO String representation of date
  heartRate: z.coerce
    .number({ message: 'Heart rate must be a number' })
    .min(30, 'Heart rate must be at least 30 BPM')
    .max(250, 'Heart rate must be under 250 BPM'),
  systolic: z.coerce
    .number({ message: 'Systolic BP must be a number' })
    .min(50, 'Systolic BP must be at least 50 mmHg')
    .max(260, 'Systolic BP must be under 260 mmHg'),
  diastolic: z.coerce
    .number({ message: 'Diastolic BP must be a number' })
    .min(30, 'Diastolic BP must be at least 30 mmHg')
    .max(180, 'Diastolic BP must be under 180 mmHg'),
  temperature: z.coerce
    .number({ message: 'Temperature must be a number' })
    .min(30, 'Temperature must be at least 30°C')
    .max(45, 'Temperature must be under 45°C'),
  oxygenLevel: z.coerce
    .number({ message: 'Oxygen level must be a number' })
    .min(50, 'SpO2 must be at least 50%')
    .max(100, 'SpO2 cannot exceed 100%'),
  weight: z.coerce
    .number({ message: 'Weight must be a number' })
    .min(10, 'Weight must be at least 10 kg')
    .max(400, 'Weight must be under 400 kg'),
  height: z.coerce
    .number({ message: 'Height must be a number' })
    .min(50, 'Height must be at least 50 cm')
    .max(260, 'Height must be under 260 cm'),
  bmi: z.coerce.number(),
  bmiCategory: BMICategoryEnum,
  bloodSugar: z.coerce
    .number({ message: 'Blood sugar must be a number' })
    .min(20, 'Blood sugar must be at least 20 mg/dL')
    .max(600, 'Blood sugar must be under 600 mg/dL'),
  bloodSugarType: BloodSugarTypeEnum,
});

export type HealthRecord = z.infer<typeof HealthRecordSchema>;

const preprocessNumber = (val: unknown) =>
  val === '' || val === null || val === undefined ? undefined : Number(val);

export const LogHealthInputSchema = z
  .object({
    heartRate: z.preprocess(
      preprocessNumber,
      z
        .number({ message: 'Heart rate is required' })
        .min(30, 'Heart rate must be at least 30 BPM')
        .max(250, 'Heart rate must be under 250 BPM')
    ),
    systolic: z.preprocess(
      preprocessNumber,
      z
        .number({ message: 'Systolic BP is required' })
        .min(50, 'Systolic BP must be at least 50 mmHg')
        .max(260, 'Systolic BP must be under 260 mmHg')
    ),
    diastolic: z.preprocess(
      preprocessNumber,
      z
        .number({ message: 'Diastolic BP is required' })
        .min(30, 'Diastolic BP must be at least 30 mmHg')
        .max(180, 'Diastolic BP must be under 180 mmHg')
    ),
    temperature: z.preprocess(
      preprocessNumber,
      z
        .number({ message: 'Temperature is required' })
        .min(30, 'Temperature must be at least 30°C')
        .max(45, 'Temperature must be under 45°C')
    ),
    oxygenLevel: z.preprocess(
      preprocessNumber,
      z
        .number({ message: 'Oxygen level is required' })
        .min(50, 'SpO2 must be at least 50%')
        .max(100, 'SpO2 cannot exceed 100%')
    ),
    weight: z.preprocess(
      preprocessNumber,
      z
        .number({ message: 'Weight is required' })
        .min(10, 'Weight must be at least 10 kg')
        .max(400, 'Weight must be under 400 kg')
    ),
    height: z.preprocess(
      preprocessNumber,
      z
        .number({ message: 'Height is required' })
        .min(50, 'Height must be at least 50 cm')
        .max(260, 'Height must be under 260 cm')
    ),
    bloodSugar: z.preprocess(
      preprocessNumber,
      z
        .number({ message: 'Blood sugar is required' })
        .min(20, 'Blood sugar must be at least 20 mg/dL')
        .max(600, 'Blood sugar must be under 600 mg/dL')
    ),
    bloodSugarType: BloodSugarTypeEnum,
  })
  .refine(
    (data) => {
      if (!data.systolic || !data.diastolic) return true;
      return data.systolic > data.diastolic;
    },
    {
      message: 'Systolic must be higher than diastolic',
      path: ['systolic'],
    }
  );

export type LogHealthData = z.infer<typeof LogHealthInputSchema>;
export type LogHealthInput = z.input<typeof LogHealthInputSchema>;

export type VitalStatus = 'normal' | 'warning' | 'critical';

