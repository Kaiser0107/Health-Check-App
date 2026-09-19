import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthRecord, MyInfo } from '../schemas/health.schema';

const STORAGE_KEYS = {
  MY_INFO: '@health_check:my_info',
  RECORDS: '@health_check:records',
};

/**
 * Generate a unique ID for local health records.
 */
function generateRecordId(): string {
  return 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Retrieve personal profile from local storage.
 */
export async function getLocalMyInfo(): Promise<MyInfo | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.MY_INFO);
    return json ? JSON.parse(json) : null;
  } catch (err) {
    console.error('[Storage] Error reading my_info:', err);
    return null;
  }
}

/**
 * Save personal profile to local storage.
 */
export async function saveLocalMyInfo(info: MyInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.MY_INFO, JSON.stringify(info));
  } catch (err) {
    console.error('[Storage] Error saving my_info:', err);
    throw err;
  }
}

/**
 * Retrieve all health records from local storage, sorted newest first.
 */
export async function getLocalRecords(): Promise<HealthRecord[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!json) return [];
    const list: HealthRecord[] = JSON.parse(json);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error('[Storage] Error reading records:', err);
    return [];
  }
}

/**
 * Append a new health record to local storage.
 */
export async function addLocalRecord(recordData: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
  try {
    const existing = await getLocalRecords();
    const newRecord: HealthRecord = {
      ...recordData,
      id: generateRecordId(),
    };
    const updated = [newRecord, ...existing];
    await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
    return newRecord;
  } catch (err) {
    console.error('[Storage] Error adding record:', err);
    throw err;
  }
}

/**
 * Remove a specific record by ID.
 */
export async function deleteLocalRecord(id: string): Promise<void> {
  try {
    const existing = await getLocalRecords();
    const updated = existing.filter((r) => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
  } catch (err) {
    console.error('[Storage] Error deleting record:', err);
    throw err;
  }
}

/**
 * Clear all personal data and records from local storage.
 */
export async function clearAllLocalData(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.MY_INFO),
      AsyncStorage.removeItem(STORAGE_KEYS.RECORDS),
    ]);
  } catch (err) {
    console.error('[Storage] Error clearing data:', err);
    throw err;
  }
}
