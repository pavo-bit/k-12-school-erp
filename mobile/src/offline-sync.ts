import * as SecureStore from "expo-secure-store";
import { api } from "./api";

export interface OfflineAttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: "present" | "absent" | "late" | "half_day";
  markedAt: string;
  synced: boolean;
}

const STORAGE_KEY = "offline_attendance_records";

export async function saveOfflineRecord(record: Omit<OfflineAttendanceRecord, "id" | "synced">): Promise<void> {
  const records = await getOfflineRecords();
  const newRecord: OfflineAttendanceRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    synced: false,
  };
  records.push(newRecord);
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(records));
}

export async function getOfflineRecords(): Promise<OfflineAttendanceRecord[]> {
  const data = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as OfflineAttendanceRecord[];
  } catch {
    return [];
  }
}

export async function getUnsyncedRecords(): Promise<OfflineAttendanceRecord[]> {
  const records = await getOfflineRecords();
  return records.filter((r) => !r.synced);
}

export async function syncOfflineRecords(): Promise<{ synced: number; failed: number }> {
  const unsynced = await getUnsyncedRecords();
  if (unsynced.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  // Group by session
  const bySession = new Map<string, OfflineAttendanceRecord[]>();
  for (const record of unsynced) {
    if (!bySession.has(record.sessionId)) {
      bySession.set(record.sessionId, []);
    }
    bySession.get(record.sessionId)!.push(record);
  }

  for (const [sessionId, records] of bySession) {
    try {
      const result = await api.markRoster(
        sessionId,
        records.map((r) => ({ studentId: r.studentId, status: r.status })),
      );

      if (result.data) {
        // Mark as synced
        const allRecords = await getOfflineRecords();
        for (const record of records) {
          const idx = allRecords.findIndex((r) => r.id === record.id);
          const storedRecord = allRecords[idx];
          if (storedRecord) storedRecord.synced = true;
        }
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(allRecords));
        synced += records.length;
      } else {
        failed += records.length;
      }
    } catch {
      failed += records.length;
    }
  }

  // Clean up synced records older than 7 days
  const allRecords = await getOfflineRecords();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cleaned = allRecords.filter((r) => !r.synced || new Date(r.markedAt).getTime() > cutoff);
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(cleaned));

  return { synced, failed };
}

export async function getSyncStatus(): Promise<{ total: number; synced: number; pending: number }> {
  const records = await getOfflineRecords();
  const synced = records.filter((r) => r.synced).length;
  const pending = records.filter((r) => !r.synced).length;
  return { total: records.length, synced, pending };
}