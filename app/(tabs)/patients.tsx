/**
 * Patients Screen — Admin only.
 * Lists all registered patients with options to view, add, and delete.
 * Patients role cannot access this screen (tab is hidden in navigation).
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PatientSummary } from '../../schemas/health.schema';

export default function PatientsScreen() {
  const { isAdmin } = useAuth();
  const { patients, selectPatient, deletePatient, refreshPatients, isLoading, isSaving } = useApp();

  const handleSelectPatient = useCallback(
    async (patient: PatientSummary) => {
      await selectPatient(patient.uid);
    },
    [selectPatient]
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
            onPress: () => deletePatient(patient.uid),
          },
        ]
      );
    },
    [deletePatient]
  );

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.restrictedText}>Access restricted to administrators.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: PatientSummary }) => (
    <View style={styles.patientCard}>
      <TouchableOpacity
        style={styles.patientInfo}
        onPress={() => handleSelectPatient(item)}
        accessibilityLabel={`View patient ${item.fullName}`}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.patientDetails}>
          <Text style={styles.patientName}>{item.fullName}</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <Text style={styles.subtitle}>{patients.length} registered</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : patients.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={48} color="#94a3b8" />
          <Text style={styles.emptyText}>No patients registered yet.</Text>
          <Text style={styles.emptySubText}>
            Patients appear here after they create an account and sign in.
          </Text>
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

      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator color="#ffffff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
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
  avatarText: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  patientDetails: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  patientEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  patientId: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  deleteButton: { padding: 8, marginLeft: 8 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  restrictedText: { fontSize: 16, color: '#dc2626' },
  savingOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2563eb',
    borderRadius: 24,
    padding: 12,
  },
});

