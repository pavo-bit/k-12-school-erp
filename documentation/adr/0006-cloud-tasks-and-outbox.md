# ADR-0006: Cloud Tasks with a Transactional Outbox

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 1
- **Related:** [../04-system-architecture.md](../04-system-architecture.md), [../14-observability-and-operations.md](../14-observability-and-operations.md)

---

## Context

Many actions must happen reliably after a database transaction: sending notifications, generating PDFs, importing data, reconciling payments, and running reminders. Writing to a queue inside a transaction is not atomic with the database commit. A crash between commit and enqueue loses the job; enqueueing before commit can produce a job for a rolled-back change.

The team does not want to operate Redis or RabbitMQ.

## Decision

Use the **transactional outbox pattern** with **Cloud Tasks**:

1. A domain transaction writes its state change and an `outbox_events` row atomically.
2. Cloud Scheduler triggers a dispatcher every minute.
3. The dispatcher claims pending rows with `FOR UPDATE SKIP LOCKED`.
4. Each row becomes a Cloud Task with a deterministic task name for deduplication.
5. Workers handle tasks idempotently and record results.
6. Retries use exponential backoff; exhausted failures go to an exception queue.

Queues: notifications, imports, exports, pdf, reconciliation, maintenance.

## Consequences

**Easier**

- No lost jobs after a committed transaction.
- Managed retries, scheduling, and rate limits.
- No queue infrastructure to operate.
- Clear audit trail of pending and completed work.
- Backpressure via queue rate limits.

**Harder**

- Delivery is at-least-once; every handler must be idempotent.
- Adds eventual consistency and a dispatcher component.
- Outbox table needs monitoring, archiving, and cleanup.
- Task payload size limits require referencing database rows for large jobs.
- Duplicate tasks are normal and must be tolerated.

**New requirements**

- Unique constraints or idempotency keys for every handler side effect.
- Outbox status, attempt count, and last error.
- Dispatcher lease/advisory lock to prevent double dispatch.
- Queue depth, oldest age, and failure alerts.
- Dead-letter/exception queue with manual replay.
- Archiving of completed outbox rows.

## Alternatives Considered

| Alternative                   | Why not                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Enqueue directly after commit | Crash window loses jobs                                                                                      |
| Enqueue before commit         | Jobs may reference rolled-back data                                                                          |
| Cloud Pub/Sub                 | Good option, but Cloud Tasks offers per-task scheduling and HTTP delivery with simpler ops for this use case |
| BullMQ + Redis                | Adds Redis operations and persistence concerns                                                               |
| Database polling only         | Simpler, but lacks task-level retry, rate limits, and scheduling                                             |
| Cron scanning every table     | Fragile and hard to observe                                                                                  |

## References

- [04-system-architecture.md](../04-system-architecture.md)
- [14-observability-and-operations.md](../14-observability-and-operations.md)
