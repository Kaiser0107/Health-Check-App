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
  Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '../../lib/zodResolver';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MyInfo, MyInfoInput, MyInfoSchema } from '../../schemas/health.schema';
import { InputField } from '../ui/InputField';

interface MyInfoFormProps {
  initialData?: MyInfo | null;
  onSubmit: (data: MyInfo) => Promise<void>;
  isSaving?: boolean;
}

const GENDER_OPTIONS: Array<'Male' | 'Female'> = ['Male', 'Female'];

/**
 * Cross-platform alert helper ensuring notifications display on Web as well as Native platforms.
 */
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}: ${message}`);
    } else {
      console.log(`[Alert] ${title}: ${message}`);
    }
  } else {
    Alert.alert(title, message);
  }
};

export const MyInfoForm: React.FC<MyInfoFormProps> = ({
  initialData,
  onSubmit,
  isSaving = false,
}) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [tempDate, setTempDate] = useState<Date>(new Date(2000, 0, 1));
  const [profileUri, setProfileUri] = useState<string | undefined>(undefined);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);

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
      patientId: '',
      profilePicture: '',
      fullName: '',
      age: '',
      sex: 'Male',
      dateOfBirth: '',
      contactNumber: '',
      address: '',
    },
  });

  const currentDateOfBirth = watch('dateOfBirth');

  // Populate form when initialData loads from storage
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      if (initialData.profilePicture) {
        setProfileUri(initialData.profilePicture);
      } else {
        setProfileUri(undefined);
      }
      if (initialData.dateOfBirth) {
        const parsed = new Date(initialData.dateOfBirth);
        if (!isNaN(parsed.getTime())) {
          setTempDate(parsed);
        }
      }
    }
  }, [initialData, reset]);

  // ── Image Picker ────────────────────────────────────────────────────────────

  const pickFromLibrary = async () => {
    setShowPhotoModal(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission needed', 'Please allow access to your photo library in device settings.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        const uri = asset.base64
          ? `data:${mimeType};base64,${asset.base64}`
          : asset.uri;
        setProfileUri(uri);
        setValue('profilePicture', uri, { shouldValidate: true, shouldDirty: true });
      }
    } catch (err: any) {
      console.error('[ImagePicker] Library error:', err);
      showAlert('Error', 'Unable to pick image. Please try again.');
    }
  };

  const pickFromCamera = async () => {
    setShowPhotoModal(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission needed', 'Please allow camera access in device settings.');
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        const uri = asset.base64
          ? `data:${mimeType};base64,${asset.base64}`
          : asset.uri;
        setProfileUri(uri);
        setValue('profilePicture', uri, { shouldValidate: true, shouldDirty: true });
      }
    } catch (err: any) {
      console.error('[ImagePicker] Camera error:', err);
      showAlert(
        'Camera Unavailable',
        'Camera could not be opened on this device or simulator. Please select a photo from your library instead.'
      );
    }
  };

  const removePhoto = () => {
    setShowPhotoModal(false);
    setProfileUri(undefined);
    setValue('profilePicture', '', { shouldValidate: true, shouldDirty: true });
  };

  const onAvatarPress = () => {
    setShowPhotoModal(true);
  };

  // ── Date Picker ─────────────────────────────────────────────────────────────

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      setTempDate(selectedDate);
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setValue('dateOfBirth', `${yyyy}-${mm}-${dd}`, { shouldValidate: true });

      const calculatedAge = new Date().getFullYear() - yyyy;
      if (calculatedAge > 0 && calculatedAge < 130) {
        setValue('age', String(calculatedAge), { shouldValidate: true });
      }
    }
  };

  const onFormSubmit = async (data: MyInfo) => {
    try {
      await onSubmit(data);
      showAlert('Success', 'Patient profile has been saved.');
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to save profile.');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.formContainer}>

      {/* ── Profile Picture Avatar ── */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={onAvatarPress}
          accessibilityRole="button"
          accessibilityLabel="Change profile picture"
        >
          {profileUri ? (
            <Image source={{ uri: profileUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={52} color="#94a3b8" />
            </View>
          )}
          {/* Camera badge overlay */}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>
          {profileUri ? 'Tap to change profile photo' : 'Tap to add a profile photo'}
        </Text>
      </View>

      {/* ── Patient ID ── */}
      <Controller
        control={control}
        name="patientId"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Patient ID"
            placeholder="e.g. PT-2024-001"
            value={value || ''}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.patientId?.message}
            accessibilityLabel="Patient ID input"
          />
        )}
      />

      {/* ── Full Name ── */}
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

      {/* ── Date of Birth ── */}
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

      {/* ── Age ── */}
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

      {/* ── Sex / Gender Selector ── */}
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

      {/* ── Contact Number ── */}
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

      {/* ── Address ── */}
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

      {/* ── Submit ── */}
      <TouchableOpacity
        style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
        onPress={() => handleSubmit(onFormSubmit)()}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel="Save patient profile information"
      >
        {isSaving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonText}>Save Profile</Text>
        )}
      </TouchableOpacity>

      {/* ── Photo Source Options Modal (Cross-Platform) ── */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowPhotoModal(false)}
        >
          <View style={styles.photoModalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.photoModalHeader}>
              <Text style={styles.photoModalTitle}>Patient Photo</Text>
              <TouchableOpacity
                onPress={() => setShowPhotoModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close photo options menu"
              >
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.photoModalOption}
              onPress={pickFromCamera}
              accessibilityRole="button"
              accessibilityLabel="Take photo with camera"
            >
              <View style={[styles.photoOptionIconWrap, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="camera-outline" size={22} color="#2563eb" />
              </View>
              <View style={styles.photoOptionTextWrap}>
                <Text style={styles.photoOptionTitle}>Take Photo</Text>
                <Text style={styles.photoOptionSubtitle}>Use camera to capture a new photo</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoModalOption}
              onPress={pickFromLibrary}
              accessibilityRole="button"
              accessibilityLabel="Choose photo from library"
            >
              <View style={[styles.photoOptionIconWrap, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="images-outline" size={22} color="#16a34a" />
              </View>
              <View style={styles.photoOptionTextWrap}>
                <Text style={styles.photoOptionTitle}>Choose from Library</Text>
                <Text style={styles.photoOptionSubtitle}>Select an image from device files</Text>
              </View>
            </TouchableOpacity>

            {Boolean(profileUri) && (
              <TouchableOpacity
                style={styles.photoModalOption}
                onPress={removePhoto}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <View style={[styles.photoOptionIconWrap, { backgroundColor: '#fef2f2' }]}>
                  <Ionicons name="trash-outline" size={22} color="#dc2626" />
                </View>
                <View style={styles.photoOptionTextWrap}>
                  <Text style={[styles.photoOptionTitle, { color: '#dc2626' }]}>Remove Photo</Text>
                  <Text style={styles.photoOptionSubtitle}>Delete current patient photo</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.photoModalCancel}
              onPress={() => setShowPhotoModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel photo selection"
            >
              <Text style={styles.photoModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles: any = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'visible',
    marginBottom: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e2e8f0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarHint: {
    fontSize: 12,
    color: '#64748b',
  },
  // Fields
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
  // Gender chips
  genderContainer: {
    marginBottom: 16,
  },
  genderOptions: {
    flexDirection: 'row',
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
    marginRight: 12,
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
  // Submit
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
  // iOS date modal
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
  // Photo modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  photoModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 8,
  },
  photoModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  photoModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f8fafc',
  },
  photoOptionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  photoOptionTextWrap: {
    flex: 1,
  },
  photoOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  photoOptionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  photoModalCancel: {
    marginTop: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
});
