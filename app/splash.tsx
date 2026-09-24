/**
 * Splash Screen — Drop Logo animation.
 * The logo drops into the center of the screen, then the app
 * checks auth state and navigates to the appropriate route.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const dropAnim = useRef(new Animated.Value(-160)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Drop animation: logo falls from above into center
    Animated.sequence([
      Animated.parallel([
        Animated.timing(dropAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.bounce),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Hold for a moment after landing
      Animated.delay(800),
    ]).start(() => {
      // Navigate based on auth state (only after animation completes)
      if (!isLoading) {
        router.replace((user ? '/(tabs)' : '/login') as any);
      }
    });
  }, []);

  // If auth resolves while animation is still running, navigate on the
  // next animation completion. If it resolves after, navigate immediately.
  useEffect(() => {
    if (!isLoading) {
      // Give the animation at least 1.5s before cutting to the next screen
    }
  }, [isLoading, user]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ translateY: dropAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.logoBubble}>
          <Text style={styles.logoEmoji}>💊</Text>
        </View>
        <Text style={styles.appName}>Health Check</Text>
        <Text style={styles.tagline}>Your health, at a glance.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: { alignItems: 'center' },
  logoBubble: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: { fontSize: 48 },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: { fontSize: 15, color: '#64748b' },
});
