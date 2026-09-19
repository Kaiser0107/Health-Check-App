import { doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { HealthRecord, MyInfo } from '@/schemas/health.schema';

/**
 * Save user profile to Firestore under users/{uuid} (if configured)
 */
export async function syncSaveMyInfo(uuid: string, info: MyInfo): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const userRef = doc(db, 'users', uuid);
    await setDoc(userRef, info, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Sync saveMyInfo skipped/failed:', err);
  }
}

/**
 * Fetch user profile from Firestore under users/{uuid} (if configured)
 */
export async function syncGetMyInfo(uuid: string): Promise<MyInfo | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const userRef = doc(db, 'users', uuid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as MyInfo;
    }
  } catch (err) {
    console.warn('[Firestore] Sync getMyInfo skipped/failed:', err);
  }
  return null;
}

/**
 * Save a health record to Firestore under users/{uuid}/records (if configured)
 */
export async function syncAddRecord(uuid: string, record: HealthRecord): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const recordsCol = collection(db, 'users', uuid, 'records');
    await addDoc(recordsCol, record);
  } catch (err) {
    console.warn('[Firestore] Sync addRecord skipped/failed:', err);
  }
}

/**
 * Fetch all health records from Firestore (if configured)
 */
export async function syncGetRecords(uuid: string): Promise<HealthRecord[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const recordsCol = collection(db, 'users', uuid, 'records');
    const snapshot = await getDocs(recordsCol);
    const results: HealthRecord[] = [];
    snapshot.forEach((docSnap) => {
      results.push({ ...(docSnap.data() as HealthRecord), id: docSnap.id });
    });
    return results;
  } catch (err) {
    console.warn('[Firestore] Sync getRecords skipped/failed:', err);
    return [];
  }
}

/**
 * Delete all remote records and user profile for uuid (if configured)
 */
export async function syncDeleteAllData(uuid: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const recordsCol = collection(db, 'users', uuid, 'records');
    const snapshot = await getDocs(recordsCol);
    for (const d of snapshot.docs) {
      await deleteDoc(d.ref);
    }
    const userRef = doc(db, 'users', uuid);
    await deleteDoc(userRef);
  } catch (err) {
    console.warn('[Firestore] Sync deleteAllData skipped/failed:', err);
  }
}
