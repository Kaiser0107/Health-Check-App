/**
 * AppContext — Health data state management.
 * Now role-aware: reads the current user from AuthContext.
 * - Patient: loads their own data (uid as patientId).
 * - Admin: exposes all patients list; data ops target selectedPatientId.
 *
 * Storage keys are per-patientId (see lib/storage.ts).
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import { HealthRecord, MyInfo, PatientSummary } from '../schemas/health.schema';
import {
  getLocalMyInfo,
  saveLocalMyInfo,
  getLocalRecords,
  addLocalRecord,
  deleteLocalRecord,
  clearPatientData,
} from '../lib/storage';
import {
  syncSaveMyInfo,
  syncGetMyInfo,
  syncGetRecords,
  syncAddRecord,
  adminGetAllPatients,
  adminDeletePatient,
} from '../lib/firestore';
import { useAuth } from './AuthContext';

interface AppContextValue {
  // ─── Shared ──────────────────────────────────────────────────────────────
  /** Patient whose data is currently being viewed/edited. */
  currentPatientId: string | null;
  myInfo: MyInfo | null;
  records: HealthRecord[];
  latestRecord: HealthRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  updateMyInfo: (info: MyInfo) => Promise<void>;
  addNewRecord: (record: Omit<HealthRecord, 'id'>) => Promise<HealthRecord>;
  removeRecord: (id: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshData: () => Promise<void>;

  // ─── Admin-only ───────────────────────────────────────────────────────────
  /** All registered patients (admin only — empty for patient role). */
  patients: PatientSummary[];
  /** Select a patient to view/edit (admin only). */
  selectPatient: (uid: string) => Promise<void>;
  /** Delete a patient and their data (admin only). */
  deletePatient: (uid: string) => Promise<void>;
  /** Refresh the admin patients list. */
  refreshPatients: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();

  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [myInfo, setMyInfo] = useState<MyInfo | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Load data for a given patientId ───────────────────────────────────────
  const loadPatientData = useCallback(async (patientId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const [localInfo, localRecs] = await Promise.all([
        getLocalMyInfo(patientId),
        getLocalRecords(patientId),
      ]);

      setMyInfo(localInfo);
      setRecords(localRecs);

      // Background cloud sync (non-blocking)
      try {
        const [remoteInfo, remoteRecs] = await Promise.all([
          syncGetMyInfo(patientId),
          syncGetRecords(patientId),
        ]);
        if (remoteInfo && !localInfo) {
          setMyInfo(remoteInfo);
          await saveLocalMyInfo(patientId, remoteInfo);
        }
        if (remoteRecs.length > 0 && localRecs.length === 0) {
          setRecords(remoteRecs);
        }
      } catch (syncErr) {
        console.warn('[AppContext] Cloud sync skipped:', syncErr);
      }
    } catch (err: any) {
      console.error('[AppContext] Failed to load patient data:', err);
      setError(err?.message || 'Failed to load health data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Load admin patients list ──────────────────────────────────────────────
  const refreshPatients = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const list = await adminGetAllPatients();
      setPatients(list);
    } catch (err: any) {
      console.warn('[AppContext] Could not load patients list:', err);
    }
  }, [isAdmin]);

  // ─── Initial load when user auth changes ──────────────────────────────────
  useEffect(() => {
    if (!user) {
      // Signed out — reset all state
      setCurrentPatientId(null);
      setMyInfo(null);
      setRecords([]);
      setPatients([]);
      setIsLoading(false);
      return;
    }

    if (isAdmin) {
      // Admin: load patient list; no personal record
      setCurrentPatientId(null);
      setMyInfo(null);
      setRecords([]);
      refreshPatients().finally(() => setIsLoading(false));
    } else {
      // Patient: load their own data
      setCurrentPatientId(user.uid);
      loadPatientData(user.uid);
    }
  }, [user, isAdmin, loadPatientData, refreshPatients]);

  // ─── Admin: select a patient ───────────────────────────────────────────────
  const selectPatient = useCallback(
    async (uid: string) => {
      if (!isAdmin) return;
      setCurrentPatientId(uid);
      await loadPatientData(uid);
    },
    [isAdmin, loadPatientData]
  );

  // ─── Admin: delete a patient ───────────────────────────────────────────────
  const deletePatient = useCallback(
    async (uid: string) => {
      if (!isAdmin) return;
      try {
        setIsSaving(true);
        await Promise.all([clearPatientData(uid), adminDeletePatient(uid)]);
        setPatients((prev) => prev.filter((p) => p.uid !== uid));
        if (currentPatientId === uid) {
          setCurrentPatientId(null);
          setMyInfo(null);
          setRecords([]);
        }
      } catch (err: any) {
        console.error('[AppContext] Error deleting patient:', err);
        setError(err?.message || 'Failed to delete patient');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, currentPatientId]
  );

  // ─── Update patient profile ────────────────────────────────────────────────
  const updateMyInfo = useCallback(
    async (info: MyInfo) => {
      if (!currentPatientId) return;
      try {
        setIsSaving(true);
        setError(null);
        await saveLocalMyInfo(currentPatientId, info);
        setMyInfo(info);
        await syncSaveMyInfo(currentPatientId, info);
      } catch (err: any) {
        console.error('[AppContext] Error updating my info:', err);
        setError(err?.message || 'Failed to save profile');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [currentPatientId]
  );

  // ─── Add new vital record ─────────────────────────────────────────────────
  const addNewRecord = useCallback(
    async (recordData: Omit<HealthRecord, 'id'>): Promise<HealthRecord> => {
      if (!currentPatientId) throw new Error('No patient selected');
      try {
        setIsSaving(true);
        setError(null);
        const saved = await addLocalRecord(currentPatientId, recordData);
        setRecords((prev) => [saved, ...prev]);
        await syncAddRecord(currentPatientId, saved);
        return saved;
      } catch (err: any) {
        console.error('[AppContext] Error adding health record:', err);
        setError(err?.message || 'Failed to save health record');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [currentPatientId]
  );

  // ─── Remove a vital record ────────────────────────────────────────────────
  const removeRecord = useCallback(
    async (id: string) => {
      if (!currentPatientId) return;
      try {
        setIsSaving(true);
        await deleteLocalRecord(currentPatientId, id);
        setRecords((prev) => prev.filter((r) => r.id !== id));
      } catch (err: any) {
        console.error('[AppContext] Error removing record:', err);
        setError(err?.message || 'Failed to remove record');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [currentPatientId]
  );

  // ─── Clear all data for current patient ──────────────────────────────────
  const clearAllData = useCallback(async () => {
    if (!currentPatientId) return;
    try {
      setIsSaving(true);
      await clearPatientData(currentPatientId);
      setMyInfo(null);
      setRecords([]);
    } catch (err: any) {
      console.error('[AppContext] Error clearing data:', err);
      setError(err?.message || 'Failed to clear all data');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [currentPatientId]);

  const latestRecord = useMemo(
    () => (records.length > 0 ? records[0] : null),
    [records]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      currentPatientId,
      myInfo,
      records,
      latestRecord,
      isLoading,
      isSaving,
      error,
      updateMyInfo,
      addNewRecord,
      removeRecord,
      clearAllData,
      refreshData: () => (currentPatientId ? loadPatientData(currentPatientId) : Promise.resolve()),
      patients,
      selectPatient,
      deletePatient,
      refreshPatients,
    }),
    [
      currentPatientId, myInfo, records, latestRecord, isLoading, isSaving, error,
      updateMyInfo, addNewRecord, removeRecord, clearAllData, loadPatientData,
      patients, selectPatient, deletePatient, refreshPatients,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
