/**
 * Splash Screen — Drop Logo animation.
 * The logo drops into the center of the screen, then transitions
 * automatically to the Login screen.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();
  const [animationDone, setAnimationDone] = useState(false);

  const dropAnim = useRef(new Animated.Value(-160)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset initial animation values so it always replays on re-entry
    dropAnim.setValue(-160);
    fadeAnim.setValue(0);
    setAnimationDone(false);

    const useNative = Platform.OS !== 'web';

    // Drop animation: logo falls from above into center with a bounce
    Animated.sequence([
      Animated.parallel([
        Animated.timing(dropAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.bounce),
          useNativeDriver: useNative,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: useNative,
        }),
      ]),
      // Hold for a moment after landing
      Animated.delay(800),
    ]).start(() => {
      setAnimationDone(true);
    });
  }, []);

  useEffect(() => {
    if (animationDone) {
      router.replace('/login' as any);
    }
  }, [animationDone]);

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
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400',
  },
});
