import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values'; // polyfill for crypto.getRandomValues

const UUID_KEY = '@health_check:uuid';

/**
 * Generate a simple UUID v4 without the crypto polyfill dependency.
 * This is sufficient for a personal app device identifier.
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a stable UUID for this device.
 * - On first launch: generates a new UUID and saves it to AsyncStorage.
 * - On subsequent launches: returns the same UUID.
 *
 * This UUID is used as the Firestore document key (users/{uuid}).
 * It is intentionally NOT cleared on "Clear all data" so the same
 * identifier is reused if the user wants to start fresh.
 */
export async function getOrCreateUUID(): Promise<string> {
  const existing = await AsyncStorage.getItem(UUID_KEY);
  if (existing) {
    return existing;
  }
  const fresh = generateUUID();
  await AsyncStorage.setItem(UUID_KEY, fresh);
  return fresh;
}

