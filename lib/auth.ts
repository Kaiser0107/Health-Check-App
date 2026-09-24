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

/**
 * Sign in with email and password.
 * Returns the authenticated AppUser with role resolved from Firestore.
 */
export async function signIn(email: string, password: string): Promise<AppUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  // Read stored role; fall back to whitelist resolution if doc missing
  let role: UserRole;
  const userDoc = await fetchUserDoc(user.uid);
  if (userDoc) {
    role = userDoc.role;
  } else {
    // First sign-in after manual user creation — write the doc now
    role = resolveRole(user.email ?? '');
    await writeUserDoc(user.uid, user.email ?? '', role);
  }

  return { uid: user.uid, email: user.email ?? '', role };
}

/**
 * Register a new account.
 * Role is determined by the admin email whitelist.
 * User document is written to Firestore immediately.
 */
export async function register(email: string, password: string): Promise<AppUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const role = resolveRole(user.email ?? '');
  await writeUserDoc(user.uid, user.email ?? '', role);
  return { uid: user.uid, email: user.email ?? '', role };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Resolve role for an already-authenticated Firebase user.
 * Used by AuthContext on auth state restoration.
 */
export async function resolveAppUser(uid: string, email: string): Promise<AppUser> {
  const userDoc = await fetchUserDoc(uid);
  const role = userDoc?.role ?? resolveRole(email);
  return { uid, email, role };
}
