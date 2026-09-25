import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';

// On Web: if user clicks browser reload/refresh, reset cached auth session
// and redirect cleanly to root splash screen before Expo Router mounts
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const isReload =
      (navEntries && navEntries.length > 0 && navEntries[0].type === 'reload') ||
      ((performance as any)?.navigation?.type === 1);

    if (isReload) {
      window.localStorage.removeItem('@health_check:auth_session');
      if (window.location.pathname !== '/' && window.location.pathname !== '') {
        window.location.replace('/');
      }
    }
  } catch {
    // Ignore in non-browser or sandboxed environments
  }
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AppProvider>
    </AuthProvider>
  );
}
