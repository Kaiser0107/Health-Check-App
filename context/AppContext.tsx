import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react';
import { HealthRecord, MyInfo } from '@/schemas/health.schema';
import { getOrCreateUUID } from '@/lib/uuid';
import {
  getLocalMyInfo,
  saveLocalMyInfo,
  getLocalRecords,
  addLocalRecord,
  deleteLocalRecord,
  clearAllLocalData,
} from '@/lib/storage';
import {
  syncSaveMyInfo,
  syncAddRecord,
  syncDeleteAllData,
  syncGetMyInfo,
  syncGetRecords,
} from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

interface AppContextValue {
  uuid: string | null;
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
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [uuid, setUuid] = useState<string | null>(null);
  const [myInfo, setMyInfo] = useState<MyInfo | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const deviceUuid = await getOrCreateUUID();
      setUuid(deviceUuid);

      // Load local data first for instant offline availability
      const [localInfo, localRecs] = await Promise.all([
        getLocalMyInfo(),
        getLocalRecords(),
      ]);

      setMyInfo(localInfo);
      setRecords(localRecs);

      // If Firebase is configured, attempt background sync
      if (isFirebaseConfigured) {
        try {
          const [remoteInfo, remoteRecs] = await Promise.all([
            syncGetMyInfo(deviceUuid),
            syncGetRecords(deviceUuid),
          ]);
          if (remoteInfo && !localInfo) {
            setMyInfo(remoteInfo);
            await saveLocalMyInfo(remoteInfo);
          }
          if (remoteRecs.length > 0 && localRecs.length === 0) {
            setRecords(remoteRecs);
          }
        } catch (syncErr) {
          console.warn('[AppContext] Background cloud sync skipped:', syncErr);
        }
      }
    } catch (err: any) {
      console.error('[AppContext] Failed to load initial data:', err);
      setError(err?.message || 'Failed to load health data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update profile
  const updateMyInfo = useCallback(async (info: MyInfo) => {
    try {
      setIsSaving(true);
      setError(null);
      await saveLocalMyInfo(info);
      setMyInfo(info);

      const deviceUuid = await getOrCreateUUID();
      // Optional cloud sync
      await syncSaveMyInfo(deviceUuid, info);
    } catch (err: any) {
      console.error('[AppContext] Error updating my info:', err);
      setError(err?.message || 'Failed to save profile');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Add new vital log
  const addNewRecord = useCallback(async (recordData: Omit<HealthRecord, 'id'>): Promise<HealthRecord> => {
    try {
      setIsSaving(true);
      setError(null);
      const saved = await addLocalRecord(recordData);
      setRecords((prev) => [saved, ...prev]);

      const deviceUuid = await getOrCreateUUID();
      // Optional cloud sync
      await syncAddRecord(deviceUuid, saved);

      return saved;
    } catch (err: any) {
      console.error('[AppContext] Error adding health record:', err);
      setError(err?.message || 'Failed to save health record');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Remove vital log
  const removeRecord = useCallback(async (id: string) => {
    try {
      setIsSaving(true);
      await deleteLocalRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error('[AppContext] Error removing record:', err);
      setError(err?.message || 'Failed to remove record');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Clear all data
  const clearAllData = useCallback(async () => {
    try {
      setIsSaving(true);
      await clearAllLocalData();
      setMyInfo(null);
      setRecords([]);

      const deviceUuid = await getOrCreateUUID();
      await syncDeleteAllData(deviceUuid);
    } catch (err: any) {
      console.error('[AppContext] Error clearing data:', err);
      setError(err?.message || 'Failed to clear all data');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const latestRecord = useMemo(() => {
    return records.length > 0 ? records[0] : null;
  }, [records]);

  const value: AppContextValue = useMemo(
    () => ({
      uuid,
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
      refreshData: loadData,
    }),
    [uuid, myInfo, records, latestRecord, isLoading, isSaving, error, updateMyInfo, addNewRecord, removeRecord, clearAllData, loadData]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
