/**
 * Login Screen — Username & Password Authentication.
 * Supports: Sign In, Create Account (toggle), Quick Demo autofill.
 * Errors shown inline — no Alert.alert (cross-platform safe).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { UsernameSchema } from '../schemas/health.schema';

type Mode = 'signin' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, register, authError, clearAuthError, isLoading } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const displayError = localError ?? authError;

  function validateForm(): string | null {
    const cleanUser = username.trim();
    if (!cleanUser) return 'Username is required.';
    const result = UsernameSchema.safeParse(cleanUser);
    if (!result.success) {
      return result.error.issues?.[0]?.message || 'Invalid username.';
    }
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (mode === 'register' && password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  }

  async function handleSubmit() {
    clearAuthError();
    const err = validateForm();
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    setSubmitting(true);

    try {
      let loggedUser;
      if (mode === 'signin') {
        loggedUser = await signIn(username.trim(), password);
      } else {
        loggedUser = await register(username.trim(), password);
      }

      if (loggedUser?.role === 'admin') {
        router.replace('/(tabs)/patients' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch {
      // Error is set in AuthContext
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setLocalError(null);
    clearAuthError();
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🩺</Text>
          </View>
          <Text style={styles.appTitle}>Health Check App</Text>
          <Text style={styles.tagline}>
            {mode === 'signin' ? 'Sign in with your username' : 'Create a new account'}
          </Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          {displayError ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          {/* Username Input */}
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (localError) setLocalError(null);
              if (authError) clearAuthError();
            }}
            placeholder="e.g. admin or patient1"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Username"
          />

          {/* Password Input */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (localError) setLocalError(null);
              if (authError) clearAuthError();
            }}
            placeholder="At least 6 characters"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            accessibilityLabel="Password"
          />

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (localError) setLocalError(null);
                }}
                placeholder="Re-enter your password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoCapitalize="none"
                accessibilityLabel="Confirm Password"
              />
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityLabel={mode === 'signin' ? 'Sign In' : 'Create Account'}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle mode */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <TouchableOpacity
            onPress={() => switchMode(mode === 'signin' ? 'register' : 'signin')}
            accessibilityLabel={mode === 'signin' ? 'Create Account' : 'Sign In'}
          >
            <Text style={styles.toggleLink}>
              {mode === 'signin' ? ' Create Account' : ' Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Demo Autofill Chips */}
        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>Demo Quick-Fill:</Text>
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={[styles.demoChip, styles.adminDemoChip]}
              onPress={() => {
                setUsername('admin');
                setPassword('admin123');
                if (mode === 'register') setConfirmPassword('admin123');
              }}
              accessibilityLabel="Autofill Admin account"
            >
              <Text style={styles.adminDemoChipText}>🛡️ Admin (admin)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoChip, styles.supervisorDemoChip]}
              onPress={() => {
                setUsername('supervisor');
                setPassword('supervisor123');
                if (mode === 'register') setConfirmPassword('supervisor123');
              }}
              accessibilityLabel="Autofill Supervisor account"
            >
              <Text style={styles.supervisorDemoChipText}>🛡️ Supervisor (supervisor)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoChip, styles.patientDemoChip]}
              onPress={() => {
                setUsername('patient1');
                setPassword('patient123');
                if (mode === 'register') setConfirmPassword('patient123');
              }}
              accessibilityLabel="Autofill Patient account"
            >
              <Text style={styles.patientDemoChipText}>👤 Patient (patient1)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  logoPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoText: { fontSize: 34 },
  appTitle: { fontSize: 26, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  tagline: { fontSize: 14, color: '#64748b' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#dc2626', fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleLabel: { fontSize: 14, color: '#64748b' },
  toggleLink: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
  demoSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoButtonsRow: { width: '100%', gap: 8 },
  demoChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  adminDemoChip: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  supervisorDemoChip: { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' },
  patientDemoChip: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  adminDemoChipText: { fontSize: 13, fontWeight: '600', color: '#1d4ed8' },
  supervisorDemoChipText: { fontSize: 13, fontWeight: '600', color: '#0369a1' },
  patientDemoChipText: { fontSize: 13, fontWeight: '600', color: '#15803d' },
});
