import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, usePathname, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';

/**
 * Ensures web browser refresh / reload button always starts at the Drop Logo splash screen.
 * Guards navigation with useRootNavigationState to avoid navigating before RootLayout is mounted.
 */
function WebReloadGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const rootNav = useRootNavigationState();
  const { signOut } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    // Wait until Expo Router's root navigator has mounted
    if (!rootNav?.key) return;

    if (Platform.OS === 'web' && !initialized.current) {
      initialized.current = true;
      if (pathname !== '/splash') {
        signOut().catch(() => {});
        router.replace('/splash');
      }
    }
  }, [rootNav?.key, pathname, router, signOut]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <WebReloadGate>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </WebReloadGate>
      </AppProvider>
    </AuthProvider>
  );
}
