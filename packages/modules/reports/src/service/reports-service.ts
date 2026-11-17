import { randomUUID } from "node:crypto";

// Reports module: operational reports and scheduled delivery.
// Full implementation in Phase 3.

export async function listReports(_schoolId: string) {
  return [];
}

export async function createReport(_schoolId: string, _name: string, _actorId: string) {
  return { id: randomUUID(), name: _name };
}
