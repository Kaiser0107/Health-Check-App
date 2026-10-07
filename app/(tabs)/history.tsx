import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { RecordCard } from '../../components/history/RecordCard';
import { getOverallHealthStatus } from '../../constants/thresholds';
import { theme, clayStyles } from '../../constants/theme';

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [isLoading]);

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
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Health History</Text>
            <Text style={styles.headerSubtitle}>Select a patient to view their clinical records</Text>
          </View>

          <View style={styles.emptyClayCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="folder-open" size={38} color="#2563eb" />
            </View>
            <Text style={styles.emptyCardTitle}>No Patient Selected</Text>
            <Text style={styles.emptyCardText}>
              Choose a patient from the clinical roster to view their historical health records and vital trends.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)/patients' as any)}
              activeOpacity={0.8}
              accessibilityLabel="View Patients Roster"
            >
              <Ionicons name="list-outline" size={18} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>View Patients Roster ({patients.length})</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
      ? { text: '#dc2626', bg: '#fef2f2', borderDepth: '#fca5a5' }
      : overallStatus === 'warning'
      ? { text: '#d97706', bg: '#fffbeb', borderDepth: '#fde68a' }
      : { text: '#16a34a', bg: '#f0fdf4', borderDepth: '#bbf7d0' };

  // Calculate quick summary metrics
  const totalRecords = records.length;
  const avgHeartRate =
    totalRecords > 0
      ? Math.round(records.reduce((acc, r) => acc + r.heartRate, 0) / totalRecords)
      : null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
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
              activeOpacity={0.8}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        ListHeaderComponent={
          <>
            {/* Patient Header Clay Card */}
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

            {/* Vitals Trend Summary Clay Bar */}
            {totalRecords > 0 ? (
              <View style={styles.summaryBar}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryBoxLabel}>LATEST STATUS</Text>
                  <View
                    style={[
                      styles.statusMiniBadge,
                      {
                        backgroundColor: statusColor.bg,
                        borderBottomColor: statusColor.borderDepth,
                        borderRightColor: statusColor.borderDepth,
                      },
                    ]}
                  >
                    <Text style={[styles.statusMiniBadgeText, { color: statusColor.text }]}>
                      {overallStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryBoxLabel}>AVG HEART RATE</Text>
                  <Text style={styles.summaryBoxValue}>
                    {avgHeartRate} <Text style={styles.summaryUnit}>BPM</Text>
                  </Text>
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
                  activeOpacity={0.8}
                  accessibilityLabel="Log new vitals"
                >
                  <Ionicons name="add-circle" size={16} color="#2563eb" />
                  <Text style={styles.logNewBtnText}>Log New Vitals</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading health records...</Text>
            </View>
          ) : (
            <View style={styles.emptyClayCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="pulse" size={42} color="#94a3b8" />
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
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyActionButtonText}>Log First Vitals</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  switchPatientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 2,
    borderBottomWidth: 3,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  switchPatientText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Patient Profile Clay Bar
  patientProfileBar: {
    ...clayStyles.cardCompact,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 2.5,
    borderBottomWidth: 3.5,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563eb',
  },
  patientMetaCol: {
    flex: 1,
  },
  patientNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  patientUsernameText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
    fontWeight: '500',
  },
  idChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 1,
    borderBottomWidth: 1.5,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
    marginTop: 3,
  },
  idChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 2,
    borderBottomWidth: 3,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
  },
  countNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563eb',
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1,
  },

  // Trend Summary Clay Bar
  summaryBar: {
    ...clayStyles.cardCompact,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryBoxValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  summaryUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  statusMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 1.5,
    borderBottomWidth: 2,
  },
  statusMiniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 30,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 1.5,
    borderBottomWidth: 2.5,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
  },
  logNewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },

  // Empty State Clay Card
  emptyClayCard: {
    ...clayStyles.card,
    margin: 20,
    alignItems: 'center',
    padding: 26,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 3,
    borderBottomWidth: 4,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyCardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyCardText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    fontWeight: '500',
  },
  primaryButton: {
    ...clayStyles.buttonPrimary,
    flexDirection: 'row',
    width: '100%',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 10,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
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
    fontWeight: '500',
  },
  emptyActionButton: {
    ...clayStyles.buttonPrimary,
    flexDirection: 'row',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  emptyActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
