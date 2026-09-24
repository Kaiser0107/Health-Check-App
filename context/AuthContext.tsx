/**
 * AuthContext — Firebase Auth state management.
 * Wraps onAuthStateChanged and exposes the current AppUser (with role),
 * plus signIn, register, and signOut functions.
 *
 * Must wrap AppProvider in _layout.tsx so AppContext can read the current user.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  signIn as authSignIn,
  register as authRegister,
  signOut as authSignOut,
  resolveAppUser,
  AppUser,
} from '../lib/auth';

interface AuthContextValue {
  user: AppUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen to Firebase auth state changes and resolve role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await resolveAppUser(firebaseUser.uid, firebaseUser.email ?? '');
          setUser(appUser);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthError(null);
      const appUser = await authSignIn(email, password);
      setUser(appUser);
    } catch (err: any) {
      setAuthError(mapFirebaseError(err.code));
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      setAuthError(null);
      const appUser = await authRegister(email, password);
      setUser(appUser);
    } catch (err: any) {
      setAuthError(mapFirebaseError(err.code));
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin: user?.role === 'admin',
      isLoading,
      authError,
      signIn,
      register,
      signOut,
      clearAuthError,
    }),
    [user, isLoading, authError, signIn, register, signOut, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Map Firebase Auth error codes to human-readable messages. */
function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'No internet connection. Please check your network.';
    default:
      return 'Authentication failed. Please try again.';
  }
}

