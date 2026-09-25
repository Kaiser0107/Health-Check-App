import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getOverallHealthStatus, getVitalStatus, VITAL_CONFIGS } from '../../constants/thresholds';
import { VitalStatus } from '../../schemas/health.schema';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { myInfo, latestRecord, currentPatientId, patients, isLoading } = useApp();

  const overallStatus: VitalStatus = getOverallHealthStatus(latestRecord);

  const getStatusColor = (status: VitalStatus) => {
    switch (status) {
      case 'critical':
        return { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' };
      case 'warning':
        return { bg: '#fffbeb', border: '#fde68a', text: '#d97706' };
      default:
        return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading health dashboard...</Text>
      </View>
    );
  }

  // ─── ADMIN: NO PATIENT SELECTED ───────────────────────────────────────────
  if (isAdmin && !currentPatientId) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>System Overview & Patient Roster</Text>
        </View>

        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="people-outline" size={40} color="#2563eb" />
          </View>
          <Text style={styles.emptyCardTitle}>No Patient Selected</Text>
          <Text style={styles.emptyCardText}>
            Select a patient from the roster to monitor their vital measurements and health status.
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

        {/* Quick Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{patients.length}</Text>
            <Text style={styles.statLabel}>Registered Patients</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#16a34a' }]}>Active</Text>
            <Text style={styles.statLabel}>System Status</Text>
          </View>
        </View>
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
            accessibilityLabel="Switch active patient"
          >
            <Ionicons name="swap-horizontal" size={14} color="#2563eb" />
            <Text style={styles.switchPatientText}>Switch Patient</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Comprehensive Patient Demographic Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
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

        {/* Demographic Details Grid */}
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

      {/* Overall Health Status Banner */}
      <View
        style={[
          styles.overallStatusCard,
          { backgroundColor: statusColors.bg, borderColor: statusColors.border },
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
          <Ionicons name="pulse-outline" size={40} color="#94a3b8" />
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
            icon="heart-outline"
          />

          {/* Blood Pressure */}
          <VitalCard
            title="Blood Pressure"
            value={`${latestRecord.systolic}/${latestRecord.diastolic}`}
            unit="mmHg"
            status={getVitalStatus('systolic', latestRecord.systolic)}
            rangeText="90-120 / 60-80"
            icon="speedometer-outline"
          />

          {/* Temperature */}
          <VitalCard
            title="Temperature"
            value={`${latestRecord.temperature}`}
            unit="°C"
            status={getVitalStatus('temperature', latestRecord.temperature)}
            rangeText={VITAL_CONFIGS.temperature.normalRangeText}
            icon="thermometer-outline"
          />

          {/* Oxygen Level */}
          <VitalCard
            title="Oxygen (SpO₂)"
            value={`${latestRecord.oxygenLevel}`}
            unit="%"
            status={getVitalStatus('oxygenLevel', latestRecord.oxygenLevel)}
            rangeText={VITAL_CONFIGS.oxygenLevel.normalRangeText}
            icon="water-outline"
          />

          {/* BMI */}
          <VitalCard
            title="BMI"
            value={`${latestRecord.bmi}`}
            unit={latestRecord.bmiCategory}
            status={getVitalStatus('bmi', latestRecord.bmi)}
            rangeText={VITAL_CONFIGS.bmi.normalRangeText}
            icon="fitness-outline"
          />

          {/* Blood Sugar */}
          <VitalCard
            title="Blood Sugar"
            value={`${latestRecord.bloodSugar}`}
            unit={`mg/dL (${latestRecord.bloodSugarType})`}
            status={getVitalStatus('bloodSugar', latestRecord.bloodSugar, latestRecord.bloodSugarType)}
            rangeText="70-99 mg/dL"
            icon="flask-outline"
          />
        </View>
      )}
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
        return { bg: '#fef2f2', text: '#dc2626' };
      case 'warning':
        return { bg: '#fffbeb', text: '#d97706' };
      default:
        return { bg: '#f0fdf4', text: '#16a34a' };
    }
  };
  const badge = getBadgeStyle(status);

  return (
    <View style={styles.vitalCard}>
      <View style={styles.vitalCardHeader}>
        <View style={styles.vitalCardTitleRow}>
          <Ionicons name={icon} size={16} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={styles.vitalCardTitle}>{title}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTextCol: { flex: 1 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#0f172a' },
  headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
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
  switchPatientText: { fontSize: 12, fontWeight: '600', color: '#2563eb', marginLeft: 4 },

  // Profile Card
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  profileAvatarText: { fontSize: 22, fontWeight: '700', color: '#2563eb' },
  profileHeaderInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  profileUsername: { fontSize: 13, color: '#64748b', marginTop: 1 },
  patientIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    gap: 4,
  },
  patientIdBadgeText: { fontSize: 11, fontWeight: '700', color: '#1d4ed8' },

  // Demographics Grid
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
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  demoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 2,
  },

  // Status Banner
  overallStatusCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  overallStatusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  overallStatusTitle: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  overallStatusDesc: { fontSize: 12, color: '#64748b', marginLeft: 30 },

  // Vitals
  vitalsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  sectionSubheading: { fontSize: 12, color: '#64748b', marginTop: 1 },
  logVitalsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  logVitalsButtonText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  vitalsGrid: { gap: 10 },
  vitalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  vitalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vitalCardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  vitalCardTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  vitalValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  vitalValue: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginRight: 6 },
  vitalUnit: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  vitalRange: { fontSize: 12, color: '#94a3b8' },

  // Empty state cards
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyCardTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptyCardText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  buttonIcon: { marginRight: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  emptyVitalsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyVitalsTitle: { fontSize: 16, fontWeight: '600', color: '#334155', marginTop: 10 },
  emptyVitalsText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyLogButton: {
    marginTop: 14,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  emptyLogButtonText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
});
