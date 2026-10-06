import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthRecord, VitalStatus } from '../../schemas/health.schema';
import { getOverallHealthStatus, getVitalStatus, VITAL_CONFIGS } from '../../constants/thresholds';

interface RecordCardProps {
  record: HealthRecord;
  index: number;
  isAdmin: boolean;
  onDelete?: (id: string) => void;
}

export function RecordCard({ record, index, isAdmin, onDelete }: RecordCardProps) {
  const [expanded, setExpanded] = useState(index === 0); // default expand most recent record

  const overallStatus: VitalStatus = getOverallHealthStatus(record);

  const getStatusBadge = (status: VitalStatus) => {
    switch (status) {
      case 'critical':
        return { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', label: 'CRITICAL' };
      case 'warning':
        return { bg: '#fffbeb', border: '#fde68a', text: '#d97706', label: 'WARNING' };
      default:
        return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', label: 'NORMAL' };
    }
  };

  const badge = getStatusBadge(overallStatus);

  const dateObj = new Date(record.timestamp);
  const formattedDate = isNaN(dateObj.getTime())
    ? 'Recorded Entry'
    : dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  const formattedTime = isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });

  const handleDelete = () => {
    if (!record.id || !onDelete) return;
    Alert.alert(
      'Delete Health Record',
      `Are you sure you want to delete this clinical record from ${formattedDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(record.id!),
        },
      ]
    );
  };

  const hrStatus = getVitalStatus('heartRate', record.heartRate);
  const bpStatus = getVitalStatus('systolic', record.systolic);
  const tempStatus = getVitalStatus('temperature', record.temperature);
  const o2Status = getVitalStatus('oxygenLevel', record.oxygenLevel);
  const bmiStatus = getVitalStatus('bmi', record.bmi);
  const sugarStatus = getVitalStatus('bloodSugar', record.bloodSugar, record.bloodSugarType);

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        accessibilityLabel={`Record from ${formattedDate}, tap to expand or collapse`}
      >
        <View style={styles.headerLeft}>
          <View style={styles.calendarIconBubble}>
            <Ionicons name="calendar-outline" size={18} color="#2563eb" />
          </View>
          <View>
            <Text style={styles.dateText}>{formattedDate}</Text>
            {formattedTime ? <Text style={styles.timeText}>{formattedTime}</Text> : null}
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#64748b"
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>

      {/* Primary Highlights Row (always visible) */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>HEART RATE</Text>
          <Text style={[styles.summaryVal, hrStatus === 'critical' && styles.criticalText]}>
            {record.heartRate} <Text style={styles.summaryUnit}>BPM</Text>
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>BLOOD PRESSURE</Text>
          <Text style={[styles.summaryVal, bpStatus === 'critical' && styles.criticalText]}>
            {record.systolic}/{record.diastolic} <Text style={styles.summaryUnit}>mmHg</Text>
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>SpO₂</Text>
          <Text style={[styles.summaryVal, o2Status === 'critical' && styles.criticalText]}>
            {record.oxygenLevel}%
          </Text>
        </View>
      </View>

      {/* Expanded Details Section */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.separator} />

          <Text style={styles.detailsHeading}>Complete Vitals Breakdown</Text>

          <View style={styles.vitalsGrid}>
            {/* Temperature */}
            <View style={styles.vitalBox}>
              <View style={styles.vitalBoxHeader}>
                <Ionicons name="thermometer-outline" size={14} color="#64748b" />
                <Text style={styles.vitalBoxTitle}>Temperature</Text>
              </View>
              <Text style={styles.vitalBoxValue}>{record.temperature} °C</Text>
              <Text style={styles.vitalBoxNormal}>Normal: {VITAL_CONFIGS.temperature.normalRangeText}</Text>
            </View>

            {/* BMI & Category */}
            <View style={styles.vitalBox}>
              <View style={styles.vitalBoxHeader}>
                <Ionicons name="fitness-outline" size={14} color="#64748b" />
                <Text style={styles.vitalBoxTitle}>BMI ({record.bmiCategory})</Text>
              </View>
              <Text style={styles.vitalBoxValue}>{record.bmi}</Text>
              <Text style={styles.vitalBoxNormal}>{record.weight} kg · {record.height} cm</Text>
            </View>

            {/* Blood Sugar */}
            <View style={styles.vitalBox}>
              <View style={styles.vitalBoxHeader}>
                <Ionicons name="flask-outline" size={14} color="#64748b" />
                <Text style={styles.vitalBoxTitle}>Blood Sugar</Text>
              </View>
              <Text style={styles.vitalBoxValue}>{record.bloodSugar} mg/dL</Text>
              <Text style={styles.vitalBoxNormal}>Type: {record.bloodSugarType}</Text>
            </View>

            {/* Oxygen SpO2 */}
            <View style={styles.vitalBox}>
              <View style={styles.vitalBoxHeader}>
                <Ionicons name="water-outline" size={14} color="#64748b" />
                <Text style={styles.vitalBoxTitle}>Oxygen Level</Text>
              </View>
              <Text style={styles.vitalBoxValue}>{record.oxygenLevel}%</Text>
              <Text style={styles.vitalBoxNormal}>Normal: {VITAL_CONFIGS.oxygenLevel.normalRangeText}</Text>
            </View>
          </View>

          {/* Admin Actions */}
          {isAdmin && record.id && onDelete && (
            <View style={styles.adminActionRow}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                accessibilityLabel="Delete this health record"
              >
                <Ionicons name="trash-outline" size={14} color="#dc2626" />
                <Text style={styles.deleteButtonText}>Delete Record</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chevron: {
    marginLeft: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  summaryUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  criticalText: {
    color: '#dc2626',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  expandedSection: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 10,
  },
  detailsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vitalBox: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  vitalBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  vitalBoxTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  vitalBoxValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  vitalBoxNormal: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  adminActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
});
