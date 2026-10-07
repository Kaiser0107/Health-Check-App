/**
 * Login Screen — Clinical & Patient Sign In (Claymorphism UI).
 * 
 * Roles:
 * - Admin: Manages roster, creates/deletes patient accounts, logs vitals, views history.
 * - Patient: Views personal dashboard (demographics, health status, vitals) and history.
 * 
 * Public registration is disabled: All patient accounts are provisioned exclusively
 * by an Administrator from the Patients roster.
 */
import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UsernameSchema } from '../schemas/health.schema';
import { theme, clayStyles } from '../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, authError, clearAuthError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Transition entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

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
        {/* Header and Card with Entrance Transition */}
        <Animated.View
          style={{
            width: '100%',
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header with 3D Clay Disc */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
                accessibilityLabel="Health Check Logo"
              />
            </View>
            <Text style={styles.appTitle}>Health Check App</Text>
            <View style={styles.taglinePill}>
              <Text style={styles.tagline}>
                Sign in with your clinical credentials or patient account
              </Text>
            </View>
          </View>

          {/* Elevated Clay Form Card */}
          <View style={styles.card}>
          {displayError ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color={theme.colors.danger} style={{ marginRight: 6 }} />
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

          {/* Chunky Tactile Clay Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
            accessibilityLabel="Sign In"
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.submitButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Soft Pillowy Notice for new patients */}
        <View style={styles.noticeBox}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#2563eb" style={{ marginBottom: 4 }} />
          <Text style={styles.noticeText}>
            Patient accounts are created directly by clinic administrators. Contact your clinician to receive your credentials.
          </Text>
        </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 48,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 3.5,
    borderBottomWidth: 4.5,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },
  logoImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  taglinePill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 2,
    borderBottomWidth: 2.5,
    borderRightColor: '#dbeafe',
    borderBottomColor: '#bfdbfe',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tagline: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Clay Card
  card: {
    ...clayStyles.card,
    marginBottom: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 2,
    borderBottomWidth: 2.5,
    borderRightColor: '#fecaca',
    borderBottomColor: '#fca5a5',
    borderRadius: theme.radius.sm,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#dc2626', fontSize: 13, fontWeight: '600', flex: 1 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    ...clayStyles.input,
    marginBottom: 16,
  },
  submitButton: {
    ...clayStyles.buttonPrimary,
    marginTop: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: { opacity: 0.65 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  // Notice Box
  noticeBox: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.md,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 2,
    borderBottomWidth: 3,
    borderRightColor: '#dbeafe',
    borderBottomColor: '#bfdbfe',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  noticeText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});
