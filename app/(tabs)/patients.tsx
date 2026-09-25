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
  MyInfoSchema,
  MyInfo,
} from '../../schemas/health.schema';
import { getLocalMyInfo } from '../../lib/storage';
import { DatePickerField } from '../../components/ui/DatePickerField';
import { CountryPhoneInput } from '../../components/ui/CountryPhoneInput';

export default function PatientsScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const {
    patients,
    selectPatient,
    createPatient,
    updatePatient,
    deletePatient,
    refreshPatients,
    currentPatientId,
    isLoading,
    isSaving,
  } = useApp();

  // ─── Add Patient Modal State ──────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('2000-01-01');
  const [contactNumber, setContactNumber] = useState('+63');
  const [address, setAddress] = useState('');
  const [patientIdInput, setPatientIdInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Edit Patient Modal State ─────────────────────────────────────────────
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientSummary | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editSex, setEditSex] = useState<'Male' | 'Female'>('Male');
  const [editDob, setEditDob] = useState('2000-01-01');
  const [editContactNumber, setEditContactNumber] = useState('+63');
  const [editAddress, setEditAddress] = useState('');
  const [editPatientIdInput, setEditPatientIdInput] = useState('');
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const resetAddForm = () => {
    setUsername('');
    setPassword('');
    setFullName('');
    setAge('26');
    setSex('Male');
    setDob('2000-01-01');
    setContactNumber('+63');
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

  const handleOpenEditModal = async (patient: PatientSummary) => {
    setEditingPatient(patient);
    setEditFormError(null);

    // Load full profile details from storage
    const local = await getLocalMyInfo(patient.uid);
    setEditFullName(local?.fullName || patient.fullName || '');
    setEditAge(local?.age ? String(local.age) : patient.age ? String(patient.age) : '25');
    setEditSex(local?.sex || patient.sex || 'Male');
    setEditDob(local?.dateOfBirth || '2000-01-01');
    setEditContactNumber(local?.contactNumber || patient.contactNumber || '+63');
    setEditAddress(local?.address || '');
    setEditPatientIdInput(local?.patientId || patient.patientId || '');

    setEditModalVisible(true);
  };

  const handleCreatePatient = async () => {
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
      resetAddForm();

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

  const handleSaveEditPatient = async () => {
    if (!editingPatient) return;

    const rawData = {
      fullName: editFullName.trim(),
      age: editAge.trim() ? parseInt(editAge.trim(), 10) : undefined,
      sex: editSex,
      dateOfBirth: editDob.trim() || '2000-01-01',
      contactNumber: editContactNumber.trim(),
      address: editAddress.trim(),
      patientId: editPatientIdInput.trim() || undefined,
    };

    const parseResult = MyInfoSchema.safeParse(rawData);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      setEditFormError(firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation error.');
      return;
    }

    setEditFormError(null);
    try {
      const input: MyInfo = parseResult.data;
      await updatePatient(editingPatient.uid, input);
      setEditModalVisible(false);
      setEditingPatient(null);

      if (Platform.OS === 'web') {
        window.alert(`Patient profile for @${editingPatient.username} updated successfully!`);
      } else {
        Alert.alert('Profile Updated', `Patient profile for @${editingPatient.username} updated successfully!`);
      }
    } catch (err: any) {
      setEditFormError(err?.message || 'Failed to update patient profile.');
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

        {/* Card Action Buttons: Edit & Delete */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenEditModal(item)}
            accessibilityLabel={`Edit patient ${item.fullName}`}
          >
            <Ionicons name="create-outline" size={20} color="#2563eb" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeletePatient(item)}
            accessibilityLabel={`Delete patient ${item.fullName}`}
          >
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
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
            resetAddForm();
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
              resetAddForm();
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

      {/* ─── 1. ADD PATIENT ACCOUNT MODAL ────────────────────────────────────── */}
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
                  Creates login credentials & medical demographic profile
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

                {/* Date of Birth with Calendar Selector */}
                <DatePickerField
                  label="Date of Birth *"
                  value={dob}
                  onChange={(selectedDate, calculatedAge) => {
                    setDob(selectedDate);
                    if (calculatedAge !== undefined) {
                      setAge(String(calculatedAge));
                    }
                  }}
                  helperText="Interactive calendar selector auto-calculates patient age"
                />

                <View style={styles.twoCol}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.fieldLabel}>Age * (Auto-calculated)</Text>
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

                {/* Country Selector Phone Input (Defaults to PH +63) */}
                <CountryPhoneInput
                  label="Contact Number *"
                  value={contactNumber}
                  onChange={setContactNumber}
                  helperText="Select country code to automatically format mobile contact"
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

      {/* ─── 2. EDIT PATIENT INFORMATION MODAL ──────────────────────────────── */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Patient Information</Text>
                <Text style={styles.modalSubtitle}>
                  Updating demographics for @{editingPatient?.username || 'patient'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingPatient(null);
                }}
                accessibilityLabel="Close edit modal"
              >
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} keyboardShouldPersistTaps="handled">
              {editFormError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>{editFormError}</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="e.g. John Doe"
                placeholderTextColor="#94a3b8"
              />

              {/* Date of Birth with Calendar Selector */}
              <DatePickerField
                label="Date of Birth *"
                value={editDob}
                onChange={(selectedDate, calculatedAge) => {
                  setEditDob(selectedDate);
                  if (calculatedAge !== undefined) {
                    setEditAge(String(calculatedAge));
                  }
                }}
                helperText="Calendar selector auto-recalculates patient age"
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Age * (Auto-calculated)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editAge}
                    onChangeText={setEditAge}
                    keyboardType="number-pad"
                    placeholder="e.g. 45"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.fieldLabel}>Sex *</Text>
                  <View style={styles.sexRow}>
                    <TouchableOpacity
                      style={[styles.sexChip, editSex === 'Male' && styles.sexChipActive]}
                      onPress={() => setEditSex('Male')}
                    >
                      <Text
                        style={[
                          styles.sexChipText,
                          editSex === 'Male' && styles.sexChipTextActive,
                        ]}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sexChip, editSex === 'Female' && styles.sexChipActive]}
                      onPress={() => setEditSex('Female')}
                    >
                      <Text
                        style={[
                          styles.sexChipText,
                          editSex === 'Female' && styles.sexChipTextActive,
                        ]}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Country Selector Phone Input (Defaults to PH +63) */}
              <CountryPhoneInput
                label="Contact Number *"
                value={editContactNumber}
                onChange={setEditContactNumber}
                helperText="Country dial code formatted automatically"
              />

              <Text style={styles.fieldLabel}>Address *</Text>
              <TextInput
                style={styles.textInput}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="e.g. 123 Health St, Manila"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Hospital / Patient ID (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={editPatientIdInput}
                onChangeText={setEditPatientIdInput}
                placeholder="e.g. PAT-2026-001"
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
                onPress={handleSaveEditPatient}
                disabled={isSaving}
                accessibilityLabel="Save patient changes"
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  actionButton: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
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
