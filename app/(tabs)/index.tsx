import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getOverallHealthStatus, getVitalStatus, VITAL_CONFIGS } from '../../constants/thresholds';
import { VitalStatus } from '../../schemas/health.schema';
import { theme, clayStyles } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { myInfo, latestRecord, currentPatientId, patients, isLoading } = useApp();

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

  const overallStatus: VitalStatus = getOverallHealthStatus(latestRecord);

  const getStatusColor = (status: VitalStatus) => {
    switch (status) {
      case 'critical':
        return {
          bg: '#fef2f2',
          borderTop: '#ffffff',
          borderDepth: '#fca5a5',
          text: '#dc2626',
        };
      case 'warning':
        return {
          bg: '#fffbeb',
          borderTop: '#ffffff',
          borderDepth: '#fde68a',
          text: '#d97706',
        };
      default:
        return {
          bg: '#f0fdf4',
          borderTop: '#ffffff',
          borderDepth: '#bbf7d0',
          text: '#16a34a',
        };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading health dashboard...</Text>
      </View>
    );
  }

  // ─── ADMIN: NO PATIENT SELECTED ───────────────────────────────────────────
  if (isAdmin && !currentPatientId) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Animated.View
          style={{
            width: '100%',
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>System Overview & Patient Roster</Text>
          </View>

          <View style={styles.emptyClayCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people" size={38} color="#2563eb" />
            </View>
            <Text style={styles.emptyCardTitle}>No Patient Selected</Text>
            <Text style={styles.emptyCardText}>
              Select a patient from the clinical roster to monitor their vital measurements and health status.
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

          {/* Quick Stats Grid with Clay Tiles */}
          <View style={styles.statsRow}>
            <View style={styles.statClayBox}>
              <Text style={styles.statNumber}>{patients.length}</Text>
              <Text style={styles.statLabel}>Registered Patients</Text>
            </View>
            <View style={styles.statClayBox}>
              <Text style={[styles.statNumber, { color: '#16a34a' }]}>Active</Text>
              <Text style={styles.statLabel}>System Status</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    );
  }

  // ─── ACTIVE DASHBOARD (Patient OR Admin with Selected Patient) ─────────────
  const statusColors = getStatusColor(overallStatus);

  // Active patient metadata
  const displayName = myInfo?.fullName || (isAdmin ? 'Selected Patient' : user?.username || 'Patient');
  const displayUsername = isAdmin
    ? (patients.find((p) => p.uid === currentPatientId)?.username || 'patient')
    : (user?.username || 'patient');
  const patientIdDisplay = myInfo?.patientId || (currentPatientId ? `PAT-${currentPatientId.slice(0, 8)}` : null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View
        style={{
          width: '100%',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>
            {isAdmin ? 'Patient Dashboard' : 'My Health Dashboard'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isAdmin ? `Monitoring: ${displayName}` : 'Unified Patient Profile & Vitals'}
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

      {/* Comprehensive Patient Demographic Profile Clay Card */}
      <View style={styles.profileClayCard}>
        <View style={styles.profileHeader}>
          {/* 3D Inflated Avatar Ring */}
          <View style={styles.profileAvatar}>
            {myInfo?.profilePicture ? (
              <Image source={{ uri: myInfo.profilePicture }} style={styles.profileAvatarImage} />
            ) : (
              <Text style={styles.profileAvatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.profileHeaderInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileUsername}>@{displayUsername}</Text>
            {patientIdDisplay ? (
              <View style={styles.patientIdBadge}>
                <Ionicons name="card-outline" size={12} color="#1d4ed8" />
                <Text style={styles.patientIdBadgeText}>{patientIdDisplay}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Demographic Details Grid with Sunken Soft Tiles */}
        <View style={styles.demographicsGrid}>
          <View style={styles.demographicItem}>
            <Text style={styles.demoLabel}>AGE / SEX</Text>
            <Text style={styles.demoValue}>
              {myInfo?.age ? `${myInfo.age} yrs` : '--'} · {myInfo?.sex || '--'}
            </Text>
          </View>

          <View style={styles.demographicItem}>
            <Text style={styles.demoLabel}>DATE OF BIRTH</Text>
            <Text style={styles.demoValue}>
              {myInfo?.dateOfBirth || '--'}
            </Text>
          </View>

          <View style={styles.demographicItem}>
            <Text style={styles.demoLabel}>CONTACT</Text>
            <Text style={styles.demoValue}>
              {myInfo?.contactNumber || '--'}
            </Text>
          </View>

          <View style={styles.demographicItem}>
            <Text style={styles.demoLabel}>ADDRESS</Text>
            <Text style={styles.demoValue} numberOfLines={2}>
              {myInfo?.address || '--'}
            </Text>
          </View>
        </View>
      </View>

      {/* Overall Health Status Clay Capsule */}
      <View
        style={[
          styles.overallStatusCard,
          {
            backgroundColor: statusColors.bg,
            borderTopColor: statusColors.borderTop,
            borderLeftColor: statusColors.borderTop,
            borderRightColor: statusColors.borderDepth,
            borderBottomColor: statusColors.borderDepth,
          },
        ]}
      >
        <View style={styles.overallStatusHeader}>
          <Ionicons
            name={
              overallStatus === 'critical'
                ? 'alert-circle'
                : overallStatus === 'warning'
                ? 'warning'
                : 'checkmark-circle'
            }
            size={22}
            color={statusColors.text}
          />
          <Text style={[styles.overallStatusTitle, { color: statusColors.text }]}>
            Overall Status: {overallStatus.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.overallStatusDesc}>
          {latestRecord
            ? `Based on clinical vitals recorded on ${new Date(latestRecord.timestamp).toLocaleDateString()}.`
            : 'No vitals recorded yet. Overall status will update once clinical readings are logged.'}
        </Text>
      </View>

      {/* Vitals Section Header */}
      <View style={styles.vitalsHeaderRow}>
        <View>
          <Text style={styles.sectionHeading}>Clinical Vitals</Text>
          <Text style={styles.sectionSubheading}>
            {isAdmin ? 'Latest recorded clinical measurements' : 'Monitored health parameters'}
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.logVitalsButton}
            onPress={() => router.push('/(tabs)/log-health' as any)}
            activeOpacity={0.8}
            accessibilityLabel="Log new health data"
          >
            <Ionicons name="add-circle" size={16} color="#2563eb" style={{ marginRight: 4 }} />
            <Text style={styles.logVitalsButtonText}>Log Vitals</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Vitals Cards */}
      {!latestRecord ? (
        <View style={styles.emptyVitalsCard}>
          <Ionicons name="pulse" size={44} color="#94a3b8" />
          <Text style={styles.emptyVitalsTitle}>No Vitals Recorded Yet</Text>
          <Text style={styles.emptyVitalsText}>
            {isAdmin
              ? 'Tap "Log Vitals" above to record the initial vital measurements for this patient.'
              : 'Your clinical administrator or doctor will record your clinical measurements here.'}
          </Text>
          {isAdmin && (
            <TouchableOpacity
              style={styles.emptyLogButton}
              onPress={() => router.push('/(tabs)/log-health' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyLogButtonText}>+ Log First Vitals</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.vitalsGrid}>
          {/* Heart Rate */}
          <VitalCard
            title="Heart Rate"
            value={`${latestRecord.heartRate}`}
            unit="BPM"
            status={getVitalStatus('heartRate', latestRecord.heartRate)}
            rangeText={VITAL_CONFIGS.heartRate.normalRangeText}
            icon="heart"
          />

          {/* Blood Pressure */}
          <VitalCard
            title="Blood Pressure"
            value={`${latestRecord.systolic}/${latestRecord.diastolic}`}
            unit="mmHg"
            status={getVitalStatus('systolic', latestRecord.systolic)}
            rangeText="90-120 / 60-80"
            icon="speedometer"
          />

          {/* Temperature */}
          <VitalCard
            title="Temperature"
            value={`${latestRecord.temperature}`}
            unit="°C"
            status={getVitalStatus('temperature', latestRecord.temperature)}
            rangeText={VITAL_CONFIGS.temperature.normalRangeText}
            icon="thermometer"
          />

          {/* Oxygen Level */}
          <VitalCard
            title="Oxygen (SpO₂)"
            value={`${latestRecord.oxygenLevel}`}
            unit="%"
            status={getVitalStatus('oxygenLevel', latestRecord.oxygenLevel)}
            rangeText={VITAL_CONFIGS.oxygenLevel.normalRangeText}
            icon="water"
          />

          {/* BMI */}
          <VitalCard
            title="BMI"
            value={`${latestRecord.bmi}`}
            unit={latestRecord.bmiCategory}
            status={getVitalStatus('bmi', latestRecord.bmi)}
            rangeText={VITAL_CONFIGS.bmi.normalRangeText}
            icon="fitness"
          />

          {/* Blood Sugar */}
          <VitalCard
            title="Blood Sugar"
            value={`${latestRecord.bloodSugar}`}
            unit={`mg/dL (${latestRecord.bloodSugarType})`}
            status={getVitalStatus('bloodSugar', latestRecord.bloodSugar, latestRecord.bloodSugarType)}
            rangeText="70-99 mg/dL"
            icon="flask"
          />

          {/* View Full History Shortcut Button */}
          <TouchableOpacity
            style={styles.viewHistoryButton}
            onPress={() => router.push('/(tabs)/history' as any)}
            activeOpacity={0.8}
            accessibilityLabel="View complete health record history"
          >
            <Ionicons name="time" size={18} color="#2563eb" style={{ marginRight: 8 }} />
            <Text style={styles.viewHistoryButtonText}>View Complete Health History</Text>
            <Ionicons name="chevron-forward" size={16} color="#2563eb" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}
      </Animated.View>
    </ScrollView>
  );
}

interface VitalCardProps {
  title: string;
  value: string;
  unit: string;
  status: VitalStatus;
  rangeText: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function VitalCard({ title, value, unit, status, rangeText, icon }: VitalCardProps) {
  const getBadgeStyle = (st: VitalStatus) => {
    switch (st) {
      case 'critical':
        return { bg: '#fef2f2', borderDepth: '#fca5a5', text: '#dc2626' };
      case 'warning':
        return { bg: '#fffbeb', borderDepth: '#fde68a', text: '#d97706' };
      default:
        return { bg: '#f0fdf4', borderDepth: '#bbf7d0', text: '#16a34a' };
    }
  };
  const badge = getBadgeStyle(status);

  return (
    <View style={styles.vitalCard}>
      <View style={styles.vitalCardHeader}>
        <View style={styles.vitalCardTitleRow}>
          <View style={styles.vitalIconBubble}>
            <Ionicons name={icon} size={15} color="#2563eb" />
          </View>
          <Text style={styles.vitalCardTitle}>{title}</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: badge.bg,
              borderBottomColor: badge.borderDepth,
              borderRightColor: badge.borderDepth,
            },
          ]}
        >
          <Text style={[styles.statusPillText, { color: badge.text }]}>
            {status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.vitalValueRow}>
        <Text style={styles.vitalValue}>{value}</Text>
        <Text style={styles.vitalUnit}>{unit}</Text>
      </View>
      <Text style={styles.vitalRange}>Normal: {rangeText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b', fontWeight: '500' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTextCol: { flex: 1 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
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
  switchPatientText: { fontSize: 12, fontWeight: '700', color: '#2563eb', marginLeft: 4 },

  // Profile Clay Card
  profileClayCard: {
    ...clayStyles.card,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 3,
    borderBottomWidth: 4,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  profileAvatarText: { fontSize: 24, fontWeight: '800', color: '#2563eb' },
  profileAvatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  profileHeaderInfo: { flex: 1 },
  profileName: { fontSize: 19, fontWeight: '800', color: '#0f172a' },
  profileUsername: { fontSize: 13, color: '#64748b', marginTop: 1, fontWeight: '500' },
  patientIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 1.5,
    borderBottomWidth: 2,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
    marginTop: 4,
    gap: 4,
  },
  patientIdBadgeText: { fontSize: 11, fontWeight: '700', color: '#1d4ed8' },

  // Demographics Grid with Clay Inset Cells
  demographicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    rowGap: 10,
  },
  demographicItem: {
    width: '50%',
    paddingRight: 8,
  },
  demoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  demoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },

  // Status Banner (Clay Capsule)
  overallStatusCard: {
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2.5,
    borderBottomWidth: 3.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overallStatusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  overallStatusTitle: { fontSize: 15, fontWeight: '800', marginLeft: 8 },
  overallStatusDesc: { fontSize: 12, color: '#64748b', marginLeft: 30, lineHeight: 18, fontWeight: '500' },

  // Vitals Header
  vitalsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionHeading: { fontSize: 19, fontWeight: '800', color: '#0f172a' },
  sectionSubheading: { fontSize: 12, color: '#64748b', marginTop: 1, fontWeight: '500' },
  logVitalsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 2,
    borderBottomWidth: 3,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  logVitalsButtonText: { fontSize: 13, fontWeight: '700', color: '#2563eb' },
  vitalsGrid: { gap: 12 },

  // 3D Clay Vital Card
  vitalCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.lg,
    padding: 16,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 2.5,
    borderBottomWidth: 4,
    borderRightColor: '#dbeafe',
    borderBottomColor: '#bfdbfe',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  vitalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vitalCardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  vitalIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 1.5,
    borderBottomWidth: 2,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
  },
  vitalCardTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 1.5,
    borderBottomWidth: 2,
  },
  statusPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  vitalValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  vitalValue: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginRight: 6 },
  vitalUnit: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  vitalRange: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

  // Empty State Clay Cards
  emptyClayCard: {
    ...clayStyles.card,
    alignItems: 'center',
    padding: 26,
    marginBottom: 20,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  emptyCardTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptyCardText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },
  primaryButton: {
    ...clayStyles.buttonPrimary,
    flexDirection: 'row',
    width: '100%',
  },
  buttonIcon: { marginRight: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statClayBox: {
    ...clayStyles.cardCompact,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statNumber: { fontSize: 30, fontWeight: '900', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '600' },
  emptyVitalsCard: {
    ...clayStyles.card,
    alignItems: 'center',
    padding: 30,
  },
  emptyVitalsTitle: { fontSize: 17, fontWeight: '700', color: '#334155', marginTop: 12 },
  emptyVitalsText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 280,
    fontWeight: '500',
  },
  emptyLogButton: {
    marginTop: 16,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 2,
    borderBottomWidth: 3,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
  },
  emptyLogButtonText: { fontSize: 13, fontWeight: '700', color: '#2563eb' },
  viewHistoryButton: {
    ...clayStyles.buttonSecondary,
    flexDirection: 'row',
    marginTop: 6,
    paddingVertical: 15,
  },
  viewHistoryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
  },
});
