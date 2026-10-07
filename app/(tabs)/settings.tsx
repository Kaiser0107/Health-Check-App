import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { isFirebaseConfigured } from '../../lib/firebase';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isAdmin, signOut } = useAuth();
  const { clearAllData, isSaving } = useApp();

  const performSignOut = async () => {
    try {
      await signOut();
      router.replace('/splash');
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err?.message || 'Failed to sign out');
      } else {
        Alert.alert('Error', err?.message || 'Failed to sign out');
      }
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        performSignOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: performSignOut,
        },
      ]);
    }
  };

  const performClearCache = async () => {
    try {
      await clearAllData();
      if (Platform.OS === 'web') {
        window.alert('Local data cleared successfully.');
      } else {
        Alert.alert('Success', 'Local data cleared successfully.');
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err?.message || 'Failed to clear local data');
      } else {
        Alert.alert('Error', err?.message || 'Failed to clear local data');
      }
    }
  };

  const handleClearCache = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('This will reset your local data cache on this device. Cloud data is not affected.')) {
        performClearCache();
      }
    } else {
      Alert.alert(
        'Clear Local Data',
        'This will reset your local data cache on this device. Cloud data is not affected.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear Data',
            style: 'destructive',
            onPress: performClearCache,
          },
        ]
      );
    }
  };

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Account & application preferences</Text>
      </View>

      {/* Account Profile Card */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, isAdmin ? styles.adminAvatar : styles.patientAvatar]}>
            <Text style={[styles.avatarText, isAdmin ? styles.adminAvatarText : styles.patientAvatarText]}>
              {userInitial}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.username ? `@${user.username}` : 'User'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, isAdmin ? styles.adminBadge : styles.patientBadge]}>
                <Ionicons
                  name={isAdmin ? 'shield-checkmark' : 'person'}
                  size={12}
                  color={isAdmin ? '#1d4ed8' : '#15803d'}
                  style={styles.badgeIcon}
                />
                <Text style={[styles.roleBadgeText, isAdmin ? styles.adminBadgeText : styles.patientBadgeText]}>
                  {isAdmin ? 'ADMINISTRATOR' : 'PATIENT'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.permissionBox}>
          <Ionicons
            name={isAdmin ? 'key-outline' : 'information-circle-outline'}
            size={18}
            color="#64748b"
            style={styles.permissionIcon}
          />
          <Text style={styles.permissionText}>
            {isAdmin
              ? 'You have Administrator privileges: You can manage patient profiles, view health metrics for any patient, and delete records.'
              : 'You have Patient access: You can record your health vitals, manage your personal profile, and view your health history.'}
          </Text>
        </View>
      </View>

      {/* Environment / System Status Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>System Status</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Backend Sync</Text>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isFirebaseConfigured ? '#16a34a' : '#d97706' },
              ]}
            />
            <Text style={styles.statusValue}>
              {isFirebaseConfigured ? 'Firebase Cloud Active' : 'Offline / Local Demo'}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>App Version</Text>
          <Text style={styles.statusValueText}>v1.0.0 (SDK 54)</Text>
        </View>
      </View>

      {/* Data Management Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleClearCache}
          disabled={isSaving}
          accessibilityLabel="Clear local data cache"
        >
          <View style={styles.actionIconWrapper}>
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
          </View>
          <View style={styles.actionTextWrapper}>
            <Text style={styles.actionTitle}>Clear Local Data</Text>
            <Text style={styles.actionSubtitle}>Reset local AsyncStorage cache on this device</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        accessibilityLabel="Sign out of your account"
      >
        <Ionicons name="log-out-outline" size={20} color="#dc2626" style={styles.signOutIcon} />
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7ff' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2, fontWeight: '500' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2.5,
    borderBottomWidth: 4,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightColor: '#dbeafe',
    borderBottomColor: '#bfdbfe',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomWidth: 3.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  adminAvatar: {
    backgroundColor: '#eff6ff',
    borderRightColor: '#93c5fa',
    borderBottomColor: '#60a5fa',
  },
  patientAvatar: {
    backgroundColor: '#f0fdf4',
    borderRightColor: '#86efac',
    borderBottomColor: '#4ade80',
  },
  avatarText: { fontSize: 24, fontWeight: '900' },
  adminAvatarText: { color: '#2563eb' },
  patientAvatarText: { color: '#16a34a' },
  profileInfo: { flex: 1 },
  userEmail: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  badgeRow: { flexDirection: 'row', marginTop: 6 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 2.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
  },
  adminBadge: {
    backgroundColor: '#eff6ff',
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
  },
  patientBadge: {
    backgroundColor: '#f0fdf4',
    borderRightColor: '#bbf7d0',
    borderBottomColor: '#86efac',
  },
  badgeIcon: { marginRight: 5 },
  roleBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  adminBadgeText: { color: '#1d4ed8' },
  patientBadgeText: { color: '#15803d' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },
  permissionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopColor: '#cbd5e1',
    borderLeftColor: '#cbd5e1',
    borderBottomColor: '#ffffff',
    borderRightColor: '#ffffff',
  },
  permissionIcon: { marginRight: 8, marginTop: 1 },
  permissionText: { flex: 1, fontSize: 12, color: '#64748b', lineHeight: 18, fontWeight: '500' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statusLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  statusPill: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusValue: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  statusValueText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  actionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 2,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightColor: '#fecaca',
    borderBottomColor: '#fca5a5',
  },
  actionTextWrapper: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#dc2626' },
  actionSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 1, fontWeight: '500' },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 15,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 3.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightColor: '#fecaca',
    borderBottomColor: '#fca5a5',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  signOutIcon: { marginRight: 8 },
  signOutButtonText: { fontSize: 16, fontWeight: '800', color: '#dc2626' },
});
