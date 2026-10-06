/**
 * Login Screen — Clinical & Patient Sign In.
 * 
 * Roles:
 * - Admin: Manages roster, creates/deletes patient accounts, logs vitals, views history.
 * - Patient: Views personal dashboard (demographics, health status, vitals) and settings.
 * 
 * Public registration is disabled: All patient accounts are provisioned exclusively
 * by an Administrator from the Patients roster.
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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { UsernameSchema } from '../schemas/health.schema';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, authError, clearAuthError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const displayError = localError ?? authError;

  function validateForm(): string | null {
    const cleanUser = username.trim();
    if (!cleanUser) return 'Username is required.';
    const result = UsernameSchema.safeParse(cleanUser);
    if (!result.success) {
      return result.error.issues?.[0]?.message || 'Invalid username format.';
    }
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
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
      const loggedUser = await signIn(username.trim(), password);

      if (loggedUser?.role === 'admin') {
        router.replace('/(tabs)/patients' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch {
      // Error message is stored in AuthContext and displayed via displayError
    } finally {
      setSubmitting(false);
    }
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
          <View style={styles.logoCircle}>
            <Image
              source={require('../assets/images/logo.png')}
              style={{ width: 68, height: 68, borderRadius: 34 }}
              resizeMode="contain"
              accessibilityLabel="Health Check Logo"
            />
          </View>
          <Text style={styles.appTitle}>Health Check App</Text>
          <Text style={styles.tagline}>
            Sign in with your clinical credentials or patient account
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
            accessibilityLabel="Username input"
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
            accessibilityLabel="Password input"
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityLabel="Sign In"
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Notice for new patients */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            🔒 Patient accounts are created directly by clinic administrators. Contact your clinician to receive your login credentials.
          </Text>
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
  header: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  logoIcon: { fontSize: 34 },
  appTitle: { fontSize: 26, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  tagline: { fontSize: 14, color: '#64748b', textAlign: 'center', maxWidth: 300, lineHeight: 20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
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
  noticeBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noticeText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
