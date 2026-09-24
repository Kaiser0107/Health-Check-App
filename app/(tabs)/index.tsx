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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {isAdmin ? `Monitoring: ${myInfo?.fullName || 'Selected Patient'}` : 'Health Overview'}
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.switchPatientChip}
            onPress={() => router.push('/(tabs)/patients' as any)}
            accessibilityLabel="Switch active patient"
          >
            <Ionicons name="swap-horizontal" size={14} color="#2563eb" />
            <Text style={styles.switchPatientText}>Switch</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Patient Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryAvatar}>
            <Text style={styles.summaryAvatarText}>
              {myInfo?.fullName ? myInfo.fullName.charAt(0).toUpperCase() : 'P'}
            </Text>
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.patientName}>
              {myInfo?.fullName || (isAdmin ? 'Patient Profile Incomplete' : 'Welcome!')}
            </Text>
            <Text style={styles.patientMeta}>
              {myInfo?.age ? `Age: ${myInfo.age}` : 'Age: --'} · {myInfo?.sex || 'Sex: --'}
              {myInfo?.patientId ? ` · ID: ${myInfo.patientId}` : ''}
            </Text>
          </View>
        </View>

        {!myInfo && !isAdmin && (
          <TouchableOpacity
            style={styles.completeProfilePrompt}
            onPress={() => router.push('/(tabs)/my-info')}
            accessibilityLabel="Complete profile"
          >
            <Ionicons name="create-outline" size={16} color="#2563eb" />
            <Text style={styles.completeProfileText}>Tap here to complete your profile in My Info</Text>
          </TouchableOpacity>
        )}
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
            ? `Based on ${new Date(latestRecord.timestamp).toLocaleDateString()} vitals recording.`
            : 'No vitals recorded yet. Log vitals to generate overall status.'}
        </Text>
      </View>

      {/* Vitals Section */}
      <View style={styles.vitalsHeaderRow}>
        <Text style={styles.sectionHeading}>Latest Vitals</Text>
        <TouchableOpacity
          style={styles.logVitalsButton}
          onPress={() => router.push('/(tabs)/log-health')}
          accessibilityLabel="Log new health data"
        >
          <Ionicons name="add-circle" size={16} color="#2563eb" style={{ marginRight: 4 }} />
          <Text style={styles.logVitalsButtonText}>Log Vitals</Text>
        </TouchableOpacity>
      </View>

      {!latestRecord ? (
        <View style={styles.emptyVitalsCard}>
          <Ionicons name="pulse-outline" size={36} color="#94a3b8" />
          <Text style={styles.emptyVitalsTitle}>No Health Readings Yet</Text>
          <Text style={styles.emptyVitalsText}>
            Tap "Log Vitals" above to record the 7 clinical vital measurements.
          </Text>
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
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  switchPatientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  switchPatientText: { fontSize: 12, fontWeight: '600', color: '#2563eb', marginLeft: 4 },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center' },
  summaryAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryAvatarText: { fontSize: 20, fontWeight: '700', color: '#2563eb' },
  summaryInfo: { flex: 1 },
  patientName: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  patientMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },
  completeProfilePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  completeProfileText: { fontSize: 13, color: '#2563eb', fontWeight: '500', marginLeft: 6 },
  overallStatusCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  overallStatusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  overallStatusTitle: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  overallStatusDesc: { fontSize: 12, color: '#64748b', marginLeft: 30 },
  vitalsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  logVitalsButton: { flexDirection: 'row', alignItems: 'center' },
  logVitalsButtonText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
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
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyVitalsTitle: { fontSize: 16, fontWeight: '600', color: '#334155', marginTop: 8 },
  emptyVitalsText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
});
