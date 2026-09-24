import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PatientSummary, MyInfo } from '../../schemas/health.schema';

export default function PatientsScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const {
    patients,
    selectPatient,
    createPatient,
    deletePatient,
    refreshPatients,
    currentPatientId,
    isLoading,
    isSaving,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [patientIdInput, setPatientIdInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFullName('');
    setAge('');
    setSex('Male');
    setDob('');
    setContactNumber('');
    setAddress('');
    setPatientIdInput('');
    setFormError(null);
  };

  const handleSelectPatient = useCallback(
    async (patient: PatientSummary) => {
      await selectPatient(patient.uid);
      Alert.alert(
        'Patient Selected',
        `Active patient set to ${patient.fullName}. You can now view their Dashboard or Log Health records.`,
        [
          { text: 'View Dashboard', onPress: () => router.push('/(tabs)') },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );
    },
    [selectPatient, router]
  );

  const handleDeletePatient = useCallback(
    (patient: PatientSummary) => {
      Alert.alert(
        'Delete Patient',
        `Are you sure you want to delete all data for ${patient.fullName}? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deletePatient(patient.uid);
              } catch (err: any) {
                Alert.alert('Error', err?.message || 'Failed to delete patient');
              }
            },
          },
        ]
      );
    },
    [deletePatient]
  );

  const handleCreatePatient = async () => {
    if (!fullName.trim()) {
      setFormError('Patient full name is required.');
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      setFormError('Please enter a valid age.');
      return;
    }
    if (!contactNumber.trim()) {
      setFormError('Contact number is required.');
      return;
    }
    if (!address.trim()) {
      setFormError('Address is required.');
      return;
    }

    setFormError(null);
    try {
      const newInfo: MyInfo = {
        fullName: fullName.trim(),
        age: parsedAge,
        sex,
        dateOfBirth: dob.trim() || '2000-01-01',
        contactNumber: contactNumber.trim(),
        address: address.trim(),
        patientId: patientIdInput.trim() || undefined,
      };

      const newId = await createPatient(newInfo);
      setModalVisible(false);
      resetForm();

      Alert.alert('Success', `Patient ${newInfo.fullName} has been registered!`, [
        {
          text: 'Select & View Dashboard',
          onPress: async () => {
            await selectPatient(newId);
            router.push('/(tabs)');
          },
        },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create patient.');
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={48} color="#dc2626" />
        <Text style={styles.restrictedText}>Access restricted to administrators.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: PatientSummary }) => {
    const isSelected = item.uid === currentPatientId;

    return (
      <View style={[styles.patientCard, isSelected && styles.selectedPatientCard]}>
        <TouchableOpacity
          style={styles.patientInfo}
          onPress={() => handleSelectPatient(item)}
          accessibilityLabel={`Select patient ${item.fullName}`}
        >
          <View style={[styles.avatar, isSelected && styles.selectedAvatar]}>
            <Text style={[styles.avatarText, isSelected && styles.selectedAvatarText]}>
              {item.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.patientDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.patientName}>{item.fullName}</Text>
              {isSelected && (
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>ACTIVE</Text>
                </View>
              )}
            </View>
            <Text style={styles.patientEmail}>{item.email}</Text>
            {item.patientId ? (
              <Text style={styles.patientId}>ID: {item.patientId}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePatient(item)}
          accessibilityLabel={`Delete patient ${item.fullName}`}
        >
          <Ionicons name="trash-outline" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Title and Add Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Patients</Text>
          <Text style={styles.subtitle}>{patients.length} registered in roster</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
          accessibilityLabel="Add new patient"
        >
          <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.addButtonText}>Add Patient</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading patient roster...</Text>
        </View>
      ) : patients.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={54} color="#94a3b8" />
          <Text style={styles.emptyText}>No patients in roster</Text>
          <Text style={styles.emptySubText}>
            Tap "Add Patient" above to register a patient, or wait for patients to create an account.
          </Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={() => setModalVisible(true)}
            accessibilityLabel="Add patient now"
          >
            <Ionicons name="person-add-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={styles.emptyAddButtonText}>Register First Patient</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshPatients}
              tintColor="#2563eb"
            />
          }
        />
      )}

      {/* ─── ADD PATIENT MODAL ─────────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add New Patient</Text>
                <Text style={styles.modalSubtitle}>Register a patient profile into the roster</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {formError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>{formError}</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. John Doe"
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Age *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    placeholder="e.g. 45"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.fieldLabel}>Sex *</Text>
                  <View style={styles.sexRow}>
                    <TouchableOpacity
                      style={[styles.sexChip, sex === 'Male' && styles.sexChipActive]}
                      onPress={() => setSex('Male')}
                    >
                      <Text style={[styles.sexChipText, sex === 'Male' && styles.sexChipTextActive]}>
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sexChip, sex === 'Female' && styles.sexChipActive]}
                      onPress={() => setSex('Female')}
                    >
                      <Text style={[styles.sexChipText, sex === 'Female' && styles.sexChipTextActive]}>
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={dob}
                onChangeText={setDob}
                placeholder="e.g. 1980-05-15"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Contact Number *</Text>
              <TextInput
                style={styles.textInput}
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
                placeholder="e.g. 09123456789"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Address *</Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="e.g. 123 Health St, Manila"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Hospital / Patient ID (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={patientIdInput}
                onChangeText={setPatientIdInput}
                placeholder="e.g. PAT-2026-001"
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
                onPress={handleCreatePatient}
                disabled={isSaving}
                accessibilityLabel="Save patient"
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Patient to Roster</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  list: { padding: 16 },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedPatientCard: {
    borderColor: '#2563eb',
    backgroundColor: '#f0f7ff',
  },
  patientInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedAvatar: { backgroundColor: '#2563eb' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  selectedAvatarText: { color: '#ffffff' },
  patientDetails: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  patientName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  activeTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  activeTagText: { fontSize: 9, fontWeight: '800', color: '#1d4ed8' },
  patientEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  patientId: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  deleteButton: { padding: 8, marginLeft: 8 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: { marginTop: 10, fontSize: 14, color: '#64748b' },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  emptyAddButtonText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  restrictedText: { fontSize: 16, color: '#dc2626', marginTop: 8 },
  // ─── Modal Styles ─────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  modalSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  modalForm: { paddingBottom: 24 },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorBoxText: { fontSize: 13, color: '#dc2626' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 12,
  },
  twoCol: { flexDirection: 'row', marginBottom: 4 },
  sexRow: { flexDirection: 'row', gap: 6, height: 42, alignItems: 'center' },
  sexChip: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sexChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  sexChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  sexChipTextActive: { color: '#2563eb' },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
