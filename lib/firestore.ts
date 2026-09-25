/**
 * Firestore helpers for cloud sync and admin patient management.
 * - Patient profiles and records stored in: patients/{patientId}/
 * - User role metadata stored in: users/{uid}/
 * Admin operations (list all patients, delete patient) are admin-only.
 */
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db, getDb, isFirebaseConfigured } from './firebase';
import { HealthRecord, MyInfo, PatientSummary } from '../schemas/health.schema';
import { getLocalRoster, removeLocalPatientFromRoster } from './storage';

/** Strip undefined values from objects before writing to Firestore to prevent invalid data errors. */
function cleanFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// ─── Patient Profile ──────────────────────────────────────────────────────────

export async function syncSaveMyInfo(patientId: string, info: MyInfo & { username?: string }): Promise<void> {
  if (!isFirebaseConfigured || !patientId) return;
  try {
    const firestore = getDb() || db;
    if (!firestore) return;
    const clean = cleanFirestoreData(info);
    await setDoc(doc(firestore, 'patients', patientId), clean, { merge: true });
  } catch (err) {
    console.warn('[Firestore] syncSaveMyInfo error:', err);
  }
}

export async function syncGetMyInfo(patientId: string): Promise<MyInfo | null> {
  if (!isFirebaseConfigured || !patientId) return null;
  try {
    const firestore = getDb() || db;
    if (!firestore) return null;
    const snap = await getDoc(doc(firestore, 'patients', patientId));
    return snap.exists() ? (snap.data() as MyInfo) : null;
  } catch (err) {
    console.warn('[Firestore] syncGetMyInfo error:', err);
    return null;
  }
}

// ─── Health Records ───────────────────────────────────────────────────────────

export async function syncAddRecord(patientId: string, record: HealthRecord): Promise<void> {
  if (!isFirebaseConfigured || !patientId) return;
  try {
    const firestore = getDb() || db;
    if (!firestore) return;
    const ref = collection(firestore, 'patients', patientId, 'records');
    const clean = cleanFirestoreData({ ...record, syncedAt: Timestamp.now() });
    await addDoc(ref, clean);
  } catch (err) {
    console.warn('[Firestore] syncAddRecord error:', err);
  }
}

export async function syncGetRecords(patientId: string): Promise<HealthRecord[]> {
  if (!isFirebaseConfigured || !patientId) return [];
  try {
    const firestore = getDb() || db;
    if (!firestore) return [];
    const ref = collection(firestore, 'patients', patientId, 'records');
    const q = query(ref, orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HealthRecord));
  } catch (err) {
    console.warn('[Firestore] syncGetRecords error:', err);
    return [];
  }
}

export async function syncCreatePatientDoc(uid: string, username: string, info: MyInfo): Promise<void> {
  if (!isFirebaseConfigured || !uid) return;
  try {
    const firestore = getDb() || db;
    if (!firestore) return;
    const clean = cleanFirestoreData({
      ...info,
      username,
      createdAt: new Date().toISOString(),
    });
    await setDoc(doc(firestore, 'patients', uid), clean);
  } catch (err) {
    console.warn('[Firestore] syncCreatePatientDoc error:', err);
  }
}

// ─── Admin: Patient List ──────────────────────────────────────────────────────

/**
 * Fetch a lightweight summary list of all registered patients.
 * If Firebase is configured, fetches from Firestore; otherwise reads from local roster.
 */
export async function adminGetAllPatients(): Promise<PatientSummary[]> {
  if (!isFirebaseConfigured) {
    return getLocalRoster();
  }
  try {
    const firestore = getDb() || db;
    if (!firestore) return getLocalRoster();

    const snap = await getDocs(collection(firestore, 'patients'));
    const remoteList = snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        username: data.username ?? d.id,
        fullName: data.fullName ?? 'Patient',
        age: data.age,
        sex: data.sex,
        contactNumber: data.contactNumber,
        patientId: data.patientId,
        profilePicture: data.profilePicture,
        createdAt: data.createdAt ?? new Date().toISOString(),
      };
    }) as PatientSummary[];

    // Also merge any locally created or updated patients
    const localList = await getLocalRoster();
    const localMap = new Map(localList.map((lp) => [lp.uid, lp]));
    const merged = remoteList.map((rem) => {
      const loc = localMap.get(rem.uid);
      if (!loc) return rem;
      return {
        ...rem,
        ...loc,
        uid: rem.uid,
        username: loc.username || rem.username,
        profilePicture: loc.profilePicture ?? rem.profilePicture,
      };
    });
    for (const lp of localList) {
      if (!merged.some((m) => m.uid === lp.uid)) {
        merged.push(lp);
      }
    }
    return merged;
  } catch (err) {
    console.warn('[Firestore] Fallback to local roster:', err);
    return getLocalRoster();
  }
}

// ─── Admin: Delete Patient ────────────────────────────────────────────────────

/**
 * Delete a patient's Firestore profile document and local roster entry.
 */
export async function adminDeletePatient(patientId: string): Promise<void> {
  await removeLocalPatientFromRoster(patientId);
  if (!isFirebaseConfigured || !patientId) return;
  try {
    const firestore = getDb() || db;
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'patients', patientId));
  } catch (err) {
    console.warn('[Firestore] Error deleting patient doc:', err);
  }
}

// ─── Legacy compat no-ops (signature changed) ─────────────────────────────────

export async function syncDeleteAllData(patientId: string): Promise<void> {
  // Local data cleared via clearPatientData(patientId) in storage.ts
  // Firestore delete handled by adminDeletePatient for admin flows
}

