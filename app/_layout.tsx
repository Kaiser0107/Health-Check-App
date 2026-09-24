import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';

/**
 * Ensures web browser refresh / reload button always starts at the Drop Logo splash screen.
 */
function WebReloadGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web' && !initialized.current) {
      initialized.current = true;
      // On browser reload/refresh: reset active session so demo starts cleanly at splash -> login
      signOut().catch(() => {});
      if (pathname !== '/splash') {
        router.replace('/splash');
      }
    }
  }, [pathname, router, signOut]);

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
