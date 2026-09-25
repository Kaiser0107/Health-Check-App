/**
 * Authentication helpers using Username & Password.
 * Converts usernames internally to a private virtual email for Firebase Auth (@healthcheck.local),
 * eliminating the need for users to provide or verify a real email address.
 *
 * Role is resolved from the hardcoded ADMIN_USERNAMES list in constants/adminUsers.ts.
 */
import { initializeApp, deleteApp } from 'firebase/app';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAuth,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, isFirebaseConfigured, firebaseConfig } from './firebase';
import { ADMIN_USERNAMES } from '../constants/adminUsers';
import {
  saveLocalPatientToRoster,
  removeLocalPatientFromRoster,
  saveLocalMyInfo,
  clearPatientData,
} from './storage';
import { syncCreatePatientDoc, adminDeletePatient } from './firestore';
import type {
  UserRole,
  FirestoreUser,
  CreatePatientAccountInput,
  MyInfo,
  PatientSummary,
} from '../schemas/health.schema';

export interface AppUser {
  uid: string;
  username: string;
  role: UserRole;
}

const LOCAL_SESSION_KEY = '@health_check:auth_session';

/** Convert a human username into an internal Firebase email string. */
export function usernameToInternalEmail(username: string): string {
  const sanitized = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
  return `${sanitized}@healthcheck.local`;
}

/** Extract username from an internal email. */
export function emailToUsername(email: string): string {
  return email.replace(/@healthcheck\.local$/i, '').split('@')[0];
}

/** Check if a username is configured as an Administrator. */
export function resolveRole(username: string): UserRole {
  return ADMIN_USERNAMES.includes(username.trim().toLowerCase()) ? 'admin' : 'patient';
}

/** Read user metadata from Firestore. */
async function fetchUserDoc(uid: string): Promise<FirestoreUser | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as FirestoreUser;
  } catch (err) {
    console.warn('[Auth] fetchUserDoc error:', err);
    return null;
  }
}

/** Write user metadata to Firestore. */
async function writeUserDoc(uid: string, username: string, role: UserRole): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), {
      uid,
      username,
      role,
      createdAt: new Date().toISOString(),
    } satisfies FirestoreUser);
  } catch (err) {
    console.warn('[Auth] writeUserDoc error:', err);
  }
}

/** Get persisted local auth session. */
export async function getLocalAuthSession(): Promise<AppUser | null> {
  try {
    const json = await AsyncStorage.getItem(LOCAL_SESSION_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

/**
 * Sign in using Username and Password.
 */
export async function signIn(username: string, password: string): Promise<AppUser> {
  const cleanUsername = username.trim().toLowerCase();
  const internalEmail = usernameToInternalEmail(cleanUsername);

  if (!isFirebaseConfigured) {
    const role = resolveRole(cleanUsername);
    const uid = 'usr_' + cleanUsername.replace(/[^a-z0-9]/g, '_');
    const appUser: AppUser = { uid, username: cleanUsername, role };
    await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(appUser));
    return appUser;
  }

  const { user } = await signInWithEmailAndPassword(auth, internalEmail, password);

  let role: UserRole;
  const userDoc = await fetchUserDoc(user.uid);
  if (userDoc) {
    role = userDoc.role;
  } else {
    role = resolveRole(cleanUsername);
    await writeUserDoc(user.uid, cleanUsername, role);
  }

  const appUser: AppUser = { uid: user.uid, username: cleanUsername, role };
  await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(appUser));
  return appUser;
}

/**
 * Register a new user using Username and Password.
 */
export async function register(username: string, password: string): Promise<AppUser> {
  const cleanUsername = username.trim().toLowerCase();
  const internalEmail = usernameToInternalEmail(cleanUsername);
  const role = resolveRole(cleanUsername);

  if (!isFirebaseConfigured) {
    const uid = 'usr_' + Date.now().toString(36);
    const appUser: AppUser = { uid, username: cleanUsername, role };
    await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(appUser));

    if (role === 'patient') {
      await saveLocalPatientToRoster({
        uid,
        username: cleanUsername,
        fullName: cleanUsername,
        createdAt: new Date().toISOString(),
      });
    }
    return appUser;
  }

  const { user } = await createUserWithEmailAndPassword(auth, internalEmail, password);
  await writeUserDoc(user.uid, cleanUsername, role);

  const appUser: AppUser = { uid: user.uid, username: cleanUsername, role };
  await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(appUser));
  return appUser;
}

/**
 * Sign out the currently active user.
 */
export async function signOut(): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('[Auth] Sign out error:', e);
    }
  }
  await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
}

/**
 * Resolve AppUser details from a Firebase UID.
 */
export async function resolveAppUser(uid: string, fallbackEmailOrUsername?: string): Promise<AppUser> {
  const userDoc = await fetchUserDoc(uid);
  if (userDoc?.username) {
    return {
      uid,
      username: userDoc.username,
      role: userDoc.role,
    };
  }

  const fallbackUser = fallbackEmailOrUsername
    ? emailToUsername(fallbackEmailOrUsername)
    : 'user';
  const role = userDoc?.role ?? resolveRole(fallbackUser);
  return { uid, username: fallbackUser, role };
}

/**
 * Admin creates a unified Patient & User account.
 * Provisions credentials in Firebase Auth without disturbing the active Admin session,
 * writes profile documents to Firestore, and adds to the local roster.
 */
export async function adminCreatePatientUser(
  input: CreatePatientAccountInput
): Promise<string> {
  const cleanUsername = input.username.trim().toLowerCase();
  const internalEmail = usernameToInternalEmail(cleanUsername);
  const now = new Date().toISOString();

  let uid: string;
  if (!isFirebaseConfigured) {
    uid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  } else {
    // Ephemeral secondary app ensures the currently logged-in Admin is NEVER signed out
    const secondaryAppName = `ProvisionApp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const { user } = await createUserWithEmailAndPassword(secondaryAuth, internalEmail, input.password);
      uid = user.uid;
      await firebaseSignOut(secondaryAuth);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error(`Username "${input.username}" is already taken. Please choose another.`);
      }
      throw err;
    } finally {
      await deleteApp(secondaryApp).catch(() => {});
    }

    // Write Firestore user document
    await writeUserDoc(uid, cleanUsername, 'patient');
  }

  // Demographic profile for this patient
  const patientProfile: MyInfo = {
    fullName: input.fullName.trim(),
    age: input.age,
    sex: input.sex,
    dateOfBirth: input.dateOfBirth,
    contactNumber: input.contactNumber.trim(),
    address: input.address.trim(),
    patientId: input.patientId?.trim() || `PAT-${cleanUsername.toUpperCase()}`,
  };

  // Save profile locally and sync to Firestore
  await saveLocalMyInfo(uid, patientProfile);
  if (isFirebaseConfigured) {
    await syncCreatePatientDoc(uid, cleanUsername, patientProfile);
  }

  // Add to local patients roster
  const summary: PatientSummary = {
    uid,
    username: cleanUsername,
    fullName: patientProfile.fullName,
    age: patientProfile.age,
    sex: patientProfile.sex,
    contactNumber: patientProfile.contactNumber,
    patientId: patientProfile.patientId,
    createdAt: now,
  };
  await saveLocalPatientToRoster(summary);

  return uid;
}

/**
 * Admin deletes a unified Patient & User account.
 */
export async function adminDeletePatientUser(uid: string): Promise<void> {
  // 1. Remove from local roster
  await removeLocalPatientFromRoster(uid);
  // 2. Clear local storage records and profile
  await clearPatientData(uid);
  // 3. Delete from Firestore
  if (isFirebaseConfigured) {
    await adminDeletePatient(uid);
  }
}

