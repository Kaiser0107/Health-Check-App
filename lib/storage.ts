/**
 * Per-patient AsyncStorage key factory.
 * All storage is now scoped to a patientId (Firebase UID for patient role,
 * or the selected patient's UID for admin role).
 * This prevents data leakage between patients on the same device.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthRecord, MyInfo } from '../schemas/health.schema';

function storageKeys(patientId: string) {
  return {
    MY_INFO: `@health_check:${patientId}:my_info`,
    RECORDS: `@health_check:${patientId}:records`,
  };
}

function generateRecordId(): string {
  return 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Retrieve personal profile for a specific patient from local storage.
 */
export async function getLocalMyInfo(patientId: string): Promise<MyInfo | null> {
  try {
    const json = await AsyncStorage.getItem(storageKeys(patientId).MY_INFO);
    return json ? JSON.parse(json) : null;
  } catch (err) {
    console.error('[Storage] Error reading my_info:', err);
    return null;
  }
}

/**
 * Save personal profile for a specific patient to local storage.
 */
export async function saveLocalMyInfo(patientId: string, info: MyInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKeys(patientId).MY_INFO, JSON.stringify(info));
  } catch (err) {
    console.error('[Storage] Error saving my_info:', err);
    throw err;
  }
}

/**
 * Retrieve all health records for a specific patient, sorted newest first.
 */
export async function getLocalRecords(patientId: string): Promise<HealthRecord[]> {
  try {
    const json = await AsyncStorage.getItem(storageKeys(patientId).RECORDS);
    if (!json) return [];
    const list: HealthRecord[] = JSON.parse(json);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error('[Storage] Error reading records:', err);
    return [];
  }
}

/**
 * Append a new health record for a specific patient to local storage.
 */
export async function addLocalRecord(
  patientId: string,
  recordData: Omit<HealthRecord, 'id'>
): Promise<HealthRecord> {
  try {
    const existing = await getLocalRecords(patientId);
    const newRecord: HealthRecord = { ...recordData, id: generateRecordId() };
    const updated = [newRecord, ...existing];
    await AsyncStorage.setItem(storageKeys(patientId).RECORDS, JSON.stringify(updated));
    return newRecord;
  } catch (err) {
    console.error('[Storage] Error adding record:', err);
    throw err;
  }
}

/**
 * Remove a specific record by ID for a given patient.
 */
export async function deleteLocalRecord(patientId: string, id: string): Promise<void> {
  try {
    const existing = await getLocalRecords(patientId);
    const updated = existing.filter((r) => r.id !== id);
    await AsyncStorage.setItem(storageKeys(patientId).RECORDS, JSON.stringify(updated));
  } catch (err) {
    console.error('[Storage] Error deleting record:', err);
    throw err;
  }
}

/**
 * Clear all personal data and records for a specific patient.
 */
export async function clearPatientData(patientId: string): Promise<void> {
  try {
    const keys = storageKeys(patientId);
    await Promise.all([
      AsyncStorage.removeItem(keys.MY_INFO),
      AsyncStorage.removeItem(keys.RECORDS),
    ]);
  } catch (err) {
    console.error('[Storage] Error clearing patient data:', err);
    throw err;
  }
}

// ─── Local Patients Roster (for Admin list & offline support) ──────────────────

const ROSTER_KEY = '@health_check:all_patients_roster';

export interface RosterPatient {
  uid: string;
  username: string;
  email?: string;
  fullName: string;
  age?: number;
  sex?: 'Male' | 'Female';
  contactNumber?: string;
  patientId?: string;
  profilePicture?: string;
  createdAt: string;
}

/**
 * Retrieve list of all registered patients saved locally.
 */
export async function getLocalRoster(): Promise<RosterPatient[]> {
  try {
    const json = await AsyncStorage.getItem(ROSTER_KEY);
    return json ? JSON.parse(json) : [];
  } catch (err) {
    console.error('[Storage] Error reading roster:', err);
    return [];
  }
}

/**
 * Add or update a patient in the local roster.
 */
export async function saveLocalPatientToRoster(patient: RosterPatient): Promise<void> {
  try {
    const current = await getLocalRoster();
    const idx = current.findIndex((p) => p.uid === patient.uid);
    let updated: RosterPatient[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...updated[idx], ...patient };
    } else {
      updated = [patient, ...current];
    }
    await AsyncStorage.setItem(ROSTER_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[Storage] Error saving to roster:', err);
  }
}

/**
 * Remove a patient from the local roster.
 */
export async function removeLocalPatientFromRoster(uid: string): Promise<void> {
  try {
    const current = await getLocalRoster();
    const updated = current.filter((p) => p.uid !== uid);
    await AsyncStorage.setItem(ROSTER_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[Storage] Error removing from roster:', err);
  }
}

