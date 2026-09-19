import { HealthRecord, MyInfo } from '../schemas/health.schema';

/**
 * Cloud sync stubs for local-first architecture.
 * The application stores all data locally in AsyncStorage.
 * Stubs ensure zero external Firebase runtime dependencies for full Snack Expo compatibility.
 */

export async function syncSaveMyInfo(_uuid: string, _info: MyInfo): Promise<void> {
  // Local-first no-op
}

export async function syncGetMyInfo(_uuid: string): Promise<MyInfo | null> {
  return null;
}

export async function syncAddRecord(_uuid: string, _record: HealthRecord): Promise<void> {
  // Local-first no-op
}

export async function syncGetRecords(_uuid: string): Promise<HealthRecord[]> {
  return [];
}

export async function syncDeleteAllData(_uuid: string): Promise<void> {
  // Local-first no-op
}
