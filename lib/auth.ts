/**
 * Firebase Authentication helpers.
 * Handles sign-in, registration, sign-out, and role resolution.
 * Role is determined by whether the user's email is in the ADMIN_EMAILS whitelist.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { ADMIN_EMAILS } from '../constants/adminEmails';
import type { UserRole, FirestoreUser } from '../schemas/health.schema';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
}

/** Derive role from the admin email whitelist. */
function resolveRole(email: string): UserRole {
  return ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'patient';
}

/** Read the user document from Firestore. Returns null if not found. */
async function fetchUserDoc(uid: string): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as FirestoreUser;
}

/** Write the user document to Firestore (on first registration). */
async function writeUserDoc(uid: string, email: string, role: UserRole): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    role,
    createdAt: new Date().toISOString(),
  } satisfies FirestoreUser);
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isFirebaseConfigured } from './firebase';
import { saveLocalPatientToRoster } from './storage';

const LOCAL_SESSION_KEY = '@health_check:auth_session';

export async function getLocalAuthSession(): Promise<AppUser | null> {
  try {
    const json = await AsyncStorage.getItem(LOCAL_SESSION_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

/**
 * Sign in with email and password.
 * If Firebase is configured, calls Firebase Auth.
 * Otherwise, falls back to local session so the app works for offline demos.
 */
export async function signIn(email: string, password: string): Promise<AppUser> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isFirebaseConfigured) {
    const role = resolveRole(normalizedEmail);
    const uid = 'usr_' + normalizedEmail.replace(/[^a-z0-9]/g, '_');
    const appUser: AppUser = { uid, email: normalizedEmail, role };
    await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(appUser));
    return appUser;
  }

  const { user } = await signInWithEmailAndPassword(auth, normalizedEmail, password);

  let role: UserRole;
  const userDoc = await fetchUserDoc(user.uid);
  if (userDoc) {
    role = userDoc.role;
  } else {
    role = resolveRole(user.email ?? normalizedEmail);
    await writeUserDoc(user.uid, user.email ?? normalizedEmail, role);
  }

  const appUser: AppUser = { uid: user.uid, email: user.email ?? normalizedEmail, role };
  await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(appUser));
  return appUser;
}

/**
 * Register a new account.
 * Role is determined by the admin email whitelist.
 */
export async function register(email: string, password: string): Promise<AppUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const role = resolveRole(normalizedEmail);

  if (!isFirebaseConfigured) {
    const uid = 'usr_' + Date.now().toString(36);
    const appUser: AppUser = { uid, email: normalizedEmail, role };
    await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(appUser));

    if (role === 'patient') {
      await saveLocalPatientToRoster({
        uid,
        email: normalizedEmail,
        fullName: normalizedEmail.split('@')[0],
        createdAt: new Date().toISOString(),
      });
    }
    return appUser;
  }

  const { user } = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  await writeUserDoc(user.uid, user.email ?? normalizedEmail, role);

  const appUser: AppUser = { uid: user.uid, email: user.email ?? normalizedEmail, role };
  await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(appUser));
  return appUser;
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('[Auth] Firebase sign-out warning:', e);
    }
  }
  await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
}

/**
 * Resolve role for an already-authenticated Firebase user.
 * Used by AuthContext on auth state restoration.
 */
export async function resolveAppUser(uid: string, email: string): Promise<AppUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const userDoc = await fetchUserDoc(uid);
  const role = userDoc?.role ?? resolveRole(normalizedEmail);
  return { uid, email: normalizedEmail, role };
}


