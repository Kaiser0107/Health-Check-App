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
import {
  PatientSummary,
  CreatePatientAccountSchema,
  CreatePatientAccountInput,
} from '../../schemas/health.schema';

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [patientIdInput, setPatientIdInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setUsername('');
    setPassword('');
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
      if (Platform.OS === 'web') {
        const goToDash = window.confirm(
          `Selected ${patient.fullName}.\n\nClick OK to open their Dashboard, or Cancel to stay on the roster.`
        );
        if (goToDash) {
          router.push('/(tabs)');
        }
      } else {
        Alert.alert(
          'Patient Selected',
          `Active patient set to ${patient.fullName}. You can now view their Dashboard or Log Health records.`,
          [
            { text: 'View Dashboard', onPress: () => router.push('/(tabs)') },
            { text: 'Stay Here', style: 'cancel' },
          ]
        );
      }
    },
    [selectPatient, router]
  );

  const handleDeletePatient = useCallback(
    (patient: PatientSummary) => {
      const doDelete = async () => {
        try {
          await deletePatient(patient.uid);
        } catch (err: any) {
          if (Platform.OS === 'web') {
            window.alert(err?.message || 'Failed to delete patient');
          } else {
            Alert.alert('Error', err?.message || 'Failed to delete patient');
          }
        }
      };

      const confirmMessage = `Are you sure you want to permanently delete @${patient.username} (${patient.fullName})? All credentials, demographics, and clinical vitals records will be removed.`;

      if (Platform.OS === 'web') {
        if (window.confirm(confirmMessage)) {
          doDelete();
        }
      } else {
        Alert.alert('Delete Patient Account', confirmMessage, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Permanently',
            style: 'destructive',
            onPress: doDelete,
          },
        ]);
      }
    },
    [deletePatient]
  );

  const handleCreatePatient = async () => {
    // 1. Validate fields with Zod schema
    const rawData = {
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      age: age.trim() ? parseInt(age.trim(), 10) : undefined,
      sex,
      dateOfBirth: dob.trim() || '2000-01-01',
      contactNumber: contactNumber.trim(),
      address: address.trim(),
      patientId: patientIdInput.trim() || undefined,
    };

    const parseResult = CreatePatientAccountSchema.safeParse(rawData);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      setFormError(firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation error.');
      return;
    }

    setFormError(null);
    try {
      const input: CreatePatientAccountInput = parseResult.data;
      const newUid = await createPatient(input);
      setModalVisible(false);
      resetForm();

      if (Platform.OS === 'web') {
        if (
          window.confirm(
            `Patient @${input.username} (${input.fullName}) successfully registered!\n\nClick OK to open their Dashboard, or Cancel to stay here.`
          )
        ) {
          await selectPatient(newUid);
          router.push('/(tabs)');
        }
      } else {
        Alert.alert(
          'Patient Registered',
          `Patient account @${input.username} (${input.fullName}) has been created with full clinical access.`,
          [
            {
              text: 'Open Dashboard',
              onPress: async () => {
                await selectPatient(newUid);
                router.push('/(tabs)');
              },
            },
            { text: 'Stay Here', style: 'cancel' },
          ]
        );
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create patient account.');
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
            <Text style={styles.patientUsername}>@{item.username}</Text>
            <View style={styles.patientMetaRow}>
              {item.age ? <Text style={styles.patientMetaText}>{item.age} yrs</Text> : null}
              {item.sex ? <Text style={styles.patientMetaText}> · {item.sex}</Text> : null}
              {item.contactNumber ? (
                <Text style={styles.patientMetaText}> · {item.contactNumber}</Text>
              ) : null}
            </View>
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
          <Text style={styles.title}>Patient Accounts</Text>
          <Text style={styles.subtitle}>
            {patients.length} registered patient {patients.length === 1 ? 'account' : 'accounts'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
          accessibilityLabel="Add new patient"
        >
          <Ionicons name="person-add" size={16} color="#ffffff" style={{ marginRight: 6 }} />
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
          <Text style={styles.emptyText}>No Patients Registered</Text>
          <Text style={styles.emptySubText}>
            As an Administrator, you have exclusive authority to provision Patient accounts. Tap below to create the first patient account.
          </Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
            accessibilityLabel="Add patient now"
          >
            <Ionicons name="person-add-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={styles.emptyAddButtonText}>Provision First Patient Account</Text>
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

      {/* ─── ADD PATIENT ACCOUNT MODAL ─────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Provision Patient Account</Text>
                <Text style={styles.modalSubtitle}>
                  Creates credentials & medical demographic profile
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} keyboardShouldPersistTaps="handled">
              {formError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>{formError}</Text>
                </View>
              )}

              {/* Section 1: Login Credentials */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>1. Login Credentials</Text>
                
                <Text style={styles.fieldLabel}>Username *</Text>
                <TextInput
                  style={styles.textInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="e.g. jdoe24 (min 3 chars, letters/numbers)"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.fieldLabel}>Password *</Text>
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="e.g. patientPass123 (min 6 chars)"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {/* Section 2: Demographic Profile */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>2. Demographic Profile</Text>

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

                <Text style={styles.fieldLabel}>Date of Birth * (YYYY-MM-DD)</Text>
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
              </View>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
                onPress={handleCreatePatient}
                disabled={isSaving}
                accessibilityLabel="Create patient account"
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Provision Patient Account</Text>
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
  title: { fontSize: 26, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 9,
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
    backgroundColor: '#eff6ff',
  },
  patientInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  selectedAvatar: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  selectedAvatarText: { color: '#ffffff' },
  patientDetails: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  patientName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  activeTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  activeTagText: { fontSize: 9, fontWeight: '800', color: '#1d4ed8' },
  patientUsername: { fontSize: 13, color: '#2563eb', marginTop: 1, fontWeight: '500' },
  patientMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  patientMetaText: { fontSize: 12, color: '#64748b' },
  patientId: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
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
    maxWidth: 320,
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
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  modalSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  modalForm: { paddingBottom: 30 },
  formSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
    fontSize: 14,
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
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  sexChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  sexChipTextActive: { color: '#2563eb' },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  saveButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
