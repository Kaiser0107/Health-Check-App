import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { RecordCard } from '../../components/history/RecordCard';
import { getOverallHealthStatus } from '../../constants/thresholds';

export default function HistoryScreen() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const {
    myInfo,
    records,
    latestRecord,
    currentPatientId,
    patients,
    removeRecord,
    refreshData,
    isLoading,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  // ─── ADMIN: NO PATIENT SELECTED ───────────────────────────────────────────
  if (isAdmin && !currentPatientId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Health History</Text>
          <Text style={styles.headerSubtitle}>Select a patient to view their clinical records</Text>
        </View>

        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="folder-open-outline" size={40} color="#2563eb" />
          </View>
          <Text style={styles.emptyCardTitle}>No Patient Selected</Text>
          <Text style={styles.emptyCardText}>
            Choose a patient from the clinical roster to view their historical health records and vital trends.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/patients' as any)}
            accessibilityLabel="View Patients Roster"
          >
            <Ionicons name="list-outline" size={18} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>View Patients Roster ({patients.length})</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Active patient display details
  const displayName = myInfo?.fullName || (isAdmin ? 'Selected Patient' : user?.username || 'Patient');
  const displayUsername = isAdmin
    ? (patients.find((p) => p.uid === currentPatientId)?.username || 'patient')
    : (user?.username || 'patient');
  const patientIdDisplay = myInfo?.patientId || (currentPatientId ? `PAT-${currentPatientId.slice(0, 8)}` : null);

  const overallStatus = getOverallHealthStatus(latestRecord);
  const statusColor =
    overallStatus === 'critical'
      ? { text: '#dc2626', bg: '#fef2f2', border: '#fca5a5' }
      : overallStatus === 'warning'
      ? { text: '#d97706', bg: '#fffbeb', border: '#fde68a' }
      : { text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };

  // Calculate quick summary metrics
  const totalRecords = records.length;
  const avgHeartRate =
    totalRecords > 0
      ? Math.round(records.reduce((acc, r) => acc + r.heartRate, 0) / totalRecords)
      : null;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Health History</Text>
          <Text style={styles.headerSubtitle}>
            {isAdmin ? `Patient Records: ${displayName}` : 'My Complete Health Record'}
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.switchPatientChip}
            onPress={() => router.push('/(tabs)/patients' as any)}
            accessibilityLabel="Switch active patient"
          >
            <Ionicons name="swap-horizontal" size={14} color="#2563eb" />
            <Text style={styles.switchPatientText}>Switch Patient</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={records}
        keyExtractor={(item, index) => item.id || `record-${index}-${item.timestamp}`}
        renderItem={({ item, index }) => (
          <RecordCard
            record={item}
            index={index}
            isAdmin={isAdmin}
            onDelete={removeRecord}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
        ListHeaderComponent={
          <>
            {/* Patient Header Card */}
            <View style={styles.patientProfileBar}>
              <View style={styles.avatarCircle}>
                {myInfo?.profilePicture ? (
                  <Image source={{ uri: myInfo.profilePicture }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.patientMetaCol}>
                <Text style={styles.patientNameText}>{displayName}</Text>
                <Text style={styles.patientUsernameText}>@{displayUsername}</Text>
                {patientIdDisplay ? (
                  <View style={styles.idChip}>
                    <Text style={styles.idChipText}>{patientIdDisplay}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countNumber}>{totalRecords}</Text>
                <Text style={styles.countLabel}>Records</Text>
              </View>
            </View>

            {/* Vitals Trend Summary Bar */}
            {totalRecords > 0 ? (
              <View style={styles.summaryBar}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryBoxLabel}>LATEST STATUS</Text>
                  <View style={[styles.statusMiniBadge, { backgroundColor: statusColor.bg, borderColor: statusColor.border }]}>
                    <Text style={[styles.statusMiniBadgeText, { color: statusColor.text }]}>
                      {overallStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryBoxLabel}>AVG HEART RATE</Text>
                  <Text style={styles.summaryBoxValue}>{avgHeartRate} <Text style={styles.summaryUnit}>BPM</Text></Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryBoxLabel}>TOTAL SESSIONS</Text>
                  <Text style={styles.summaryBoxValue}>{totalRecords}</Text>
                </View>
              </View>
            ) : null}

            {/* Section Heading Row */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>
                {totalRecords > 0 ? 'Chronological Logs (Newest First)' : 'Clinical Records'}
              </Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.logNewBtn}
                  onPress={() => router.push('/(tabs)/log-health' as any)}
                  accessibilityLabel="Log new vitals"
                >
                  <Ionicons name="add-circle-outline" size={16} color="#2563eb" />
                  <Text style={styles.logNewBtnText}>Log New Vitals</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading health records...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="pulse-outline" size={44} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Health Records Found</Text>
              <Text style={styles.emptySubtitle}>
                {isAdmin
                  ? 'No vital measurements recorded yet for this patient. Tap "Log New Vitals" above to add the initial entry.'
                  : 'Your clinical records and vital measurements will appear here once recorded by your doctor or nurse.'}
              </Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => router.push('/(tabs)/log-health' as any)}
                >
                  <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyActionButtonText}>Log First Vitals</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  switchPatientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  switchPatientText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Patient Profile Bar
  patientProfileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: {
    width: 46,
    height: 46,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
  },
  patientMetaCol: {
    flex: 1,
  },
  patientNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  patientUsernameText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  idChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  idChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  countNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },

  // Trend Summary Bar
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryBoxValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  statusMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusMiniBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },

  // Section Heading
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  logNewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },

  // Empty State
  emptyCard: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyCardText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 10,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
