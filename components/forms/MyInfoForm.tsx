import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { MyInfo, MyInfoInput, MyInfoSchema } from '@/schemas/health.schema';
import { InputField } from '@/components/ui/InputField';

interface MyInfoFormProps {
  initialData?: MyInfo | null;
  onSubmit: (data: MyInfo) => Promise<void>;
  isSaving?: boolean;
}

const GENDER_OPTIONS: Array<'Male' | 'Female'> = ['Male', 'Female'];

export const MyInfoForm: React.FC<MyInfoFormProps> = ({
  initialData,
  onSubmit,
  isSaving = false,
}) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [tempDate, setTempDate] = useState<Date>(new Date(2000, 0, 1));

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MyInfoInput, any, MyInfo>({
    resolver: zodResolver(MyInfoSchema),
    defaultValues: (initialData as MyInfoInput) || {
      fullName: '',
      age: '',
      sex: 'Male',
      dateOfBirth: '',
      contactNumber: '',
      address: '',
    },
  });

  const currentDateOfBirth = watch('dateOfBirth');

  // Populate form if initialData loads asynchronously from storage
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      if (initialData.dateOfBirth) {
        const parsed = new Date(initialData.dateOfBirth);
        if (!isNaN(parsed.getTime())) {
          setTempDate(parsed);
        }
      }
    }
  }, [initialData, reset]);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      setTempDate(selectedDate);
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const formatted = `${yyyy}-${mm}-${dd}`;
      setValue('dateOfBirth', formatted, { shouldValidate: true });

      // Automatically compute age from birth year to save user effort!
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - yyyy;
      if (calculatedAge > 0 && calculatedAge < 130) {
        setValue('age', String(calculatedAge), { shouldValidate: true });
      }
    }
  };

  const onFormSubmit = async (data: MyInfo) => {
    try {
      await onSubmit(data);
      Alert.alert('Success', 'Your profile information has been saved.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save profile.');
    }
  };

  return (
    <View style={styles.formContainer}>
      {/* Full Name */}
      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Full Name *"
            placeholder="e.g. John Doe"
            value={value || ''}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.fullName?.message}
            accessibilityLabel="Full Name input"
          />
        )}
      />

      {/* Date of Birth — Interactive Calendar Selector */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Date of Birth *</Text>
        <TouchableOpacity
          style={[styles.datePickerButton, errors.dateOfBirth ? styles.inputError : null]}
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Select date of birth"
        >
          <View style={styles.datePickerRow}>
            <Ionicons name="calendar-outline" size={20} color="#2563eb" style={{ marginRight: 10 }} />
            <Text
              style={[
                styles.datePickerText,
                !currentDateOfBirth ? styles.datePickerPlaceholder : null,
              ]}
            >
              {currentDateOfBirth ? currentDateOfBirth : 'Tap to select date from calendar'}
            </Text>
          </View>
        </TouchableOpacity>
        {errors.dateOfBirth?.message ? (
          <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>
        ) : null}

        {/* Date Picker Component */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={currentDateOfBirth ? new Date(currentDateOfBirth) : tempDate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={onDateChange}
          />
        )}

        {/* iOS Date Picker Modal */}
        {showDatePicker && Platform.OS === 'ios' && (
          <Modal transparent animationType="fade" visible={showDatePicker}>
            <View style={styles.iosModalOverlay}>
              <View style={styles.iosModalContent}>
                <View style={styles.iosModalHeader}>
                  <Text style={styles.iosModalTitle}>Select Date of Birth</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.iosModalDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={currentDateOfBirth ? new Date(currentDateOfBirth) : tempDate}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={onDateChange}
                />
              </View>
            </View>
          </Modal>
        )}
      </View>

      {/* Age */}
      <Controller
        control={control}
        name="age"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Age *"
            placeholder="e.g. 28 (auto-calculated from birth date)"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="number-pad"
            error={errors.age?.message}
            accessibilityLabel="Age input"
          />
        )}
      />

      {/* Sex / Gender Selector — Male / Female Only */}
      <View style={styles.genderContainer}>
        <Text style={styles.fieldLabel}>Sex / Gender *</Text>
        <Controller
          control={control}
          name="sex"
          render={({ field: { onChange, value } }) => (
            <View style={styles.genderOptions}>
              {GENDER_OPTIONS.map((option) => {
                const isSelected = value === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.genderButton, isSelected && styles.genderButtonSelected]}
                    onPress={() => onChange(option)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select gender ${option}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        isSelected && styles.genderButtonTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
        {errors.sex?.message && <Text style={styles.errorText}>{errors.sex.message}</Text>}
      </View>

      {/* Contact Number */}
      <Controller
        control={control}
        name="contactNumber"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Contact Number *"
            placeholder="e.g. +1 555 123 4567"
            value={value || ''}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="phone-pad"
            error={errors.contactNumber?.message}
            accessibilityLabel="Contact number input"
          />
        )}
      />

      {/* Address */}
      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Address *"
            placeholder="e.g. 123 Health Ave, City"
            value={value || ''}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline
            numberOfLines={3}
            error={errors.address?.message}
            accessibilityLabel="Address input"
          />
        )}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
        onPress={() => handleSubmit(onFormSubmit)()}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel="Save personal profile information"
      >
        {isSaving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonText}>Save Profile</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles: any = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    minHeight: 48,
    justifyContent: 'center',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: '#0f172a',
  },
  datePickerPlaceholder: {
    color: '#94a3b8',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  genderButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  genderButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    minHeight: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  iosModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  iosModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  iosModalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
});
