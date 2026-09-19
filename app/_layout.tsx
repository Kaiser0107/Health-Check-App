import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/context/AppContext';
import { getOrCreateUUID } from '@/lib/uuid';

export default function RootLayout() {
  useEffect(() => {
    // Ensure UUID is generated and stored on first launch.
    // The UUID is the stable device identifier used as the Firestore key.
    getOrCreateUUID().then((id) => {
      if (__DEV__) {
        console.log('[UUID] Device identifier:', id);
      }
    });
  }, []);

  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AppProvider>
  );
}

