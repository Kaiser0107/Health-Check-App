/**
 * Firebase initialization.
 * Config values are loaded from EXPO_PUBLIC_ environment variables.
 * Uses inMemoryPersistence so browser refresh / reload cleanly resets session to Drop Logo -> Login.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialization on hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: inMemoryPersistence,
    });
  } catch {
    return getAuth(app);
  }
})();

export const db = getFirestore(app);
export const isFirebaseConfigured = Boolean(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
