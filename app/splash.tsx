/**
 * Splash Screen — Claymorphism Drop Logo animation.
 * The 3D pillowy logo drops into the center with a bounce,
 * then transitions automatically to the Login screen.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const [animationDone, setAnimationDone] = useState(false);

  const dropAnim = useRef(new Animated.Value(-180)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset initial animation values so it always replays on re-entry
    dropAnim.setValue(-180);
    fadeAnim.setValue(0);
    setAnimationDone(false);

    const useNative = Platform.OS !== 'web';

    // Drop animation: logo falls from above into center with a bounce
    Animated.sequence([
      Animated.parallel([
        Animated.timing(dropAnim, {
          toValue: 0,
          duration: 750,
          easing: Easing.out(Easing.bounce),
          useNativeDriver: useNative,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
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
        {/* Chunky Clay 3D Disc */}
        <View style={styles.clayDisc}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="Health Check App Logo"
          />
        </View>

        <Text style={styles.appName}>Health Check</Text>

        {/* Tactile Clay Tagline Pill */}
        <View style={styles.taglinePill}>
          <Text style={styles.tagline}>Your health, at a glance.</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  clayDisc: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 4,
    borderBottomWidth: 5,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  logoImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  taglinePill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 7,
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
});
