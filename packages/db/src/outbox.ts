export interface OutboxEventInput {
  schoolId: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  dedupeKey: string;
  payload: Record<string, unknown>;
}

// enqueue is implemented in Milestone 1 alongside the outbox table.
export async function enqueueOutboxEvent(_input: OutboxEventInput): Promise<void> {
  throw new Error("not_implemented");
}
