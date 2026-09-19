import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { useHealthData } from '../../hooks/useHealthData';
import { LogHealthForm } from '../../components/forms/LogHealthForm';
import { LogHealthData } from '../../schemas/health.schema';
import { calculateBMI, getBMICategory } from '../../lib/bmi';

export default function LogHealthScreen() {
  const { addNewRecord, latestRecord, isSaving } = useHealthData();

  const handleRecordSubmit = async (formData: LogHealthData) => {
    try {
      const w = Number(formData.weight);
      const h = Number(formData.height);
      const calculatedBMI = calculateBMI(w, h);
      const category = getBMICategory(calculatedBMI);
      const currentTimestamp = new Date().toISOString();

      await addNewRecord({
        heartRate: Number(formData.heartRate),
        systolic: Number(formData.systolic),
        diastolic: Number(formData.diastolic),
        temperature: Number(formData.temperature),
        oxygenLevel: Number(formData.oxygenLevel),
        weight: w,
        height: h,
        bmi: calculatedBMI,
        bmiCategory: category,
        bloodSugar: Number(formData.bloodSugar),
        bloodSugarType: formData.bloodSugarType,
        timestamp: currentTimestamp,
      });

      Alert.alert(
        'Health Record Saved',
        'Your health measurements have been recorded successfully.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert(
        'Save Error',
        err?.message || 'Failed to save your health record. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <LogHealthForm
            defaultHeight={latestRecord?.height}
            onSubmit={handleRecordSubmit}
            isSaving={isSaving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
