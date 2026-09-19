import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '../../lib/zodResolver';
import {
  BloodSugarType,
  LogHealthData,
  LogHealthInput,
  LogHealthInputSchema,
} from '../../schemas/health.schema';
import { InputField } from '../ui/InputField';
import { useBMI } from '../../hooks/useBMI';

export interface LogHealthFormProps {
  defaultHeight?: number;
  onSubmit: (data: LogHealthData) => Promise<void>;
  isSaving?: boolean;
}

const BLOOD_SUGAR_TYPES: BloodSugarType[] = ['Fasting', 'Random', 'Other'];

export const LogHealthForm: React.FC<LogHealthFormProps> = ({
  defaultHeight,
  onSubmit,
  isSaving = false,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LogHealthInput, any, LogHealthData>({
    resolver: zodResolver(LogHealthInputSchema),
    defaultValues: {
      heartRate: '',
      systolic: '',
      diastolic: '',
      temperature: '',
      oxygenLevel: '',
      weight: '',
      height: defaultHeight ? String(defaultHeight) : '',
      bloodSugar: '',
      bloodSugarType: 'Fasting',
    },
  });

  // Populate default height if loaded asynchronously
  useEffect(() => {
    if (defaultHeight && !watch('height')) {
      setValue('height', String(defaultHeight));
    }
  }, [defaultHeight, setValue]);

  // Watch weight and height for real-time BMI computation
  const watchedWeight = watch('weight');
  const watchedHeight = watch('height');

  const { bmi, category, status, isValid, formattedBMI } = useBMI({
    weightKg: watchedWeight ? Number(watchedWeight) : undefined,
    heightCm: watchedHeight ? Number(watchedHeight) : undefined,
  });

  const getStatusBadgeStyle = () => {
    if (!isValid) {
      return { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' };
    }
    switch (status) {
      case 'normal':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'warning':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'critical':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' };
    }
  };

  const badgeStyle = getStatusBadgeStyle();

  const handleFormSubmit = async (data: LogHealthData) => {
    await onSubmit(data);
    reset({
      heartRate: '',
      systolic: '',
      diastolic: '',
      temperature: '',
      oxygenLevel: '',
      weight: '',
      height: defaultHeight ? String(defaultHeight) : '',
      bloodSugar: '',
      bloodSugarType: 'Fasting',
    });
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Record Vitals</Text>
      <Text style={styles.sectionSubtitle}>
        Enter your current health measurements below.
      </Text>

      {/* Heart Rate */}
      <Controller
        control={control}
        name="heartRate"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Heart Rate (BPM)"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. 72"
            keyboardType="numeric"
            helperText="Normal resting: 60 - 100 BPM"
            error={errors.heartRate?.message}
          />
        )}
      />

      {/* Blood Pressure (Dual Input Row) */}
      <Text style={styles.groupLabel}>Blood Pressure (mmHg)</Text>
      <View style={styles.row}>
        <View style={styles.flexHalf}>
          <Controller
            control={control}
            name="systolic"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Systolic"
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="120"
                keyboardType="numeric"
                error={errors.systolic?.message}
              />
            )}
          />
        </View>

        <View style={styles.rowSpacer} />

        <View style={styles.flexHalf}>
          <Controller
            control={control}
            name="diastolic"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Diastolic"
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="80"
                keyboardType="numeric"
                error={errors.diastolic?.message}
              />
            )}
          />
        </View>
      </View>

      {/* Temperature & Oxygen Level */}
      <View style={styles.row}>
        <View style={styles.flexHalf}>
          <Controller
            control={control}
            name="temperature"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Temperature (C)"
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="36.5"
                keyboardType="decimal-pad"
                error={errors.temperature?.message}
              />
            )}
          />
        </View>

        <View style={styles.rowSpacer} />

        <View style={styles.flexHalf}>
          <Controller
            control={control}
            name="oxygenLevel"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Oxygen (SpO2 %)"
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="98"
                keyboardType="numeric"
                error={errors.oxygenLevel?.message}
              />
            )}
          />
        </View>
      </View>

      {/* Weight & Height */}
      <View style={styles.row}>
        <View style={styles.flexHalf}>
          <Controller
            control={control}
            name="weight"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Weight (kg)"
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="70"
                keyboardType="decimal-pad"
                error={errors.weight?.message}
              />
            )}
          />
        </View>

        <View style={styles.rowSpacer} />

        <View style={styles.flexHalf}>
          <Controller
            control={control}
            name="height"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Height (cm)"
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="175"
                keyboardType="decimal-pad"
                error={errors.height?.message}
              />
            )}
          />
        </View>
      </View>

      {/* Live Interactive BMI Preview Card */}
      <View style={[styles.bmiCard, { borderColor: badgeStyle.border }]}>
        <View style={styles.bmiHeader}>
          <Ionicons
            name="speedometer-outline"
            size={20}
            color="#0284c7"
            style={styles.bmiIcon}
          />
          <Text style={styles.bmiTitle}>Live BMI Calculation</Text>
        </View>

        <View style={styles.bmiBody}>
          <View>
            <Text style={styles.bmiValue}>{formattedBMI}</Text>
            <Text style={styles.bmiUnit}>kg/m2</Text>
          </View>

          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
            ]}
          >
            <Text style={[styles.categoryText, { color: badgeStyle.text }]}>
              {isValid ? category : 'Enter Weight and Height'}
            </Text>
          </View>
        </View>
        <Text style={styles.bmiHint}>
          Auto-computed from weight and height using standard WHO categories.
        </Text>
      </View>

      {/* Blood Sugar */}
      <Controller
        control={control}
        name="bloodSugar"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Blood Sugar (mg/dL)"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="95"
            keyboardType="numeric"
            error={errors.bloodSugar?.message}
          />
        )}
      />

      {/* Blood Sugar Type Selector */}
      <View style={styles.sugarTypeContainer}>
        <Text style={styles.sugarTypeLabel}>Blood Sugar Type</Text>
        <Controller
          control={control}
          name="bloodSugarType"
          render={({ field: { onChange, value } }) => (
            <View style={styles.chipRow}>
              {BLOOD_SUGAR_TYPES.map((type) => {
                const isSelected = value === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.sugarChip,
                      isSelected ? styles.sugarChipSelected : null,
                    ]}
                    onPress={() => onChange(type)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Select blood sugar type ${type}`}
                  >
                    <Text
                      style={[
                        styles.sugarChipText,
                        isSelected ? styles.sugarChipTextSelected : null,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSaving ? styles.submitButtonDisabled : null]}
        onPress={handleSubmit(handleFormSubmit)}
        disabled={isSaving}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Save Health Record"
      >
        {isSaving ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <View style={styles.submitContent}>
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color="#ffffff"
              style={styles.submitIcon}
            />
            <Text style={styles.submitText}>Save Health Record</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default LogHealthForm;

const styles: any = StyleSheet.create({
  formContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  flexHalf: {
    flex: 1,
  },
  rowSpacer: {
    width: 12,
  },
  bmiCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    marginTop: 4,
  },
  bmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bmiIcon: {
    marginRight: 6,
  },
  bmiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  bmiBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bmiValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
  },
  bmiUnit: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bmiHint: {
    fontSize: 12,
    color: '#94a3b8',
  },
  sugarTypeContainer: {
    marginBottom: 24,
  },
  sugarTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  sugarChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  sugarChipSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  sugarChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  sugarChipTextSelected: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#0284c7',
    minHeight: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    elevation: 0,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitIcon: {
    marginRight: 8,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
