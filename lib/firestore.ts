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
import { db, isFirebaseConfigured } from './firebase';
import { HealthRecord, MyInfo, PatientSummary } from '../schemas/health.schema';

// ─── Patient Profile ──────────────────────────────────────────────────────────

export async function syncSaveMyInfo(patientId: string, info: MyInfo): Promise<void> {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(db, 'patients', patientId), info, { merge: true });
}

export async function syncGetMyInfo(patientId: string): Promise<MyInfo | null> {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(db, 'patients', patientId));
  return snap.exists() ? (snap.data() as MyInfo) : null;
}

// ─── Health Records ───────────────────────────────────────────────────────────

export async function syncAddRecord(patientId: string, record: HealthRecord): Promise<void> {
  if (!isFirebaseConfigured) return;
  const ref = collection(db, 'patients', patientId, 'records');
  await addDoc(ref, { ...record, syncedAt: Timestamp.now() });
}

export async function syncGetRecords(patientId: string): Promise<HealthRecord[]> {
  if (!isFirebaseConfigured) return [];
  const ref = collection(db, 'patients', patientId, 'records');
  const q = query(ref, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HealthRecord));
}

// ─── Admin: Patient List ──────────────────────────────────────────────────────

/**
 * Fetch a lightweight summary list of all registered patients.
 * Only callable by admin (enforced by Firestore Security Rules).
 */
export async function adminGetAllPatients(): Promise<PatientSummary[]> {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(
    query(collection(db, 'users'), orderBy('createdAt', 'asc'))
  );
  return snap.docs
    .map((d) => d.data())
    .filter((u) => u.role === 'patient')
    .map((u) => ({
      uid: u.uid,
      email: u.email,
      fullName: u.fullName ?? u.email,
      patientId: u.patientId,
      createdAt: u.createdAt,
    })) as PatientSummary[];
}

// ─── Admin: Delete Patient ────────────────────────────────────────────────────

/**
 * Delete a patient's Firestore profile document.
 * Note: deleting sub-collection records requires a Cloud Function in production.
 * For now this deletes only the top-level patient document.
 */
export async function adminDeletePatient(patientId: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(db, 'patients', patientId));
}

// ─── Legacy compat no-ops (signature changed) ─────────────────────────────────

export async function syncDeleteAllData(patientId: string): Promise<void> {
  // Local data cleared via clearPatientData(patientId) in storage.ts
  // Firestore delete handled by adminDeletePatient for admin flows
}
