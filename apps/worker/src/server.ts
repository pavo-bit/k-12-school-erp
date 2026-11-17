import Fastify from "fastify";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  outboxEvents,
  notifications,
  notificationDeliveries,
  studentGuardians,
  guardians,
  schools,
} from "@school-erp/db";
import { eq, and, lte, asc, inArray } from "drizzle-orm";
import { sendConsolePush } from "@school-erp/communication";
import { randomUUID } from "node:crypto";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "DATABASE_URL is required for the worker (e.g. postgres://erp:erp@localhost:5435/erp)",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 2 });
const db = drizzle(pool);

const WORKER_ID = `worker-${randomUUID().slice(0, 8)}`;
const POLL_MS = Number(process.env.OUTBOX_POLL_MS ?? 2000);
const BATCH = 10;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 30_000;

const stats = {
  workerId: WORKER_ID,
  lastPollAt: null as Date | null,
  processed: 0,
  failed: 0,
};

const app = Fastify({ logger: true });

app.get("/healthz", async () => ({ status: "ok", service: "worker" }));
app.get("/readyz", async () => ({ status: "ready", service: "worker" }));
app.get("/outbox/stats", async () => ({
  ...stats,
  lastPollAt: stats.lastPollAt?.toISOString() ?? null,
}));

interface ReceiptIssuedPayload {
  receiptId: string;
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  amountPaise: number;
  financialYear: string;
}

async function dispatch(event: typeof outboxEvents.$inferSelect) {
  switch (event.eventType) {
    case "fee.receipt_issued": {
      const payload = event.payload as unknown as ReceiptIssuedPayload;
      const links = await db
        .select({ guardianId: studentGuardians.guardianId })
        .from(studentGuardians)
        .where(eq(studentGuardians.studentId, payload.studentId));
      const guardianIds = links.map((l) => l.guardianId);

      const school = await db
        .select({ id: schools.id, name: schools.name })
        .from(schools)
        .where(eq(schools.id, event.schoolId ?? ""))
        .limit(1);
      const schoolName = school[0]?.name ?? "School";

      if (guardianIds.length === 0) {
        app.log.info(
          { receiptNumber: payload.receiptNumber },
          "no guardians linked to student; marking event processed without delivery",
        );
        return;
      }

      const guardianRows = await db
        .select()
        .from(guardians)
        .where(inArray(guardians.id, guardianIds));
      for (const guardian of guardianRows) {
        const amount = (payload.amountPaise / 100).toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        });
        const body = `${schoolName}: fee receipt ${payload.receiptNumber} issued — ${amount}.`;
        const result = sendConsolePush(`guardian:${guardian.id}`, "Fee receipt issued", body);

        const notificationId = randomUUID();
        await db.insert(notifications).values([
          {
            id: notificationId,
            schoolId: event.schoolId ?? "",
            eventKey: "fee.receipt_issued",
            recipientId: guardian.id,
            channel: "push",
            status: "delivered",
          },
        ]);
        await db.insert(notificationDeliveries).values([
          {
            id: randomUUID(),
            notificationId,
            provider: "console",
            providerMessageId: result.providerMessageId,
            status: result.status,
            attempt: 1,
          },
        ]);
      }
      return;
    }
    default:
      throw new Error(`Unknown event type: ${event.eventType}`);
  }
}

let loopRunning = false;

async function tick() {
  if (loopRunning) return;
  loopRunning = true;
  try {
    const due = await db
      .select()
      .from(outboxEvents)
      .where(and(eq(outboxEvents.status, "pending"), lte(outboxEvents.availableAt, new Date())))
      .orderBy(asc(outboxEvents.availableAt))
      .limit(BATCH);

    for (const event of due) {
      // Claim the event: only one worker wins the status flip.
      const claimed = await db
        .update(outboxEvents)
        .set({ lockedAt: new Date(), lockedBy: WORKER_ID })
        .where(and(eq(outboxEvents.id, event.id), eq(outboxEvents.status, "pending")))
        .returning({ id: outboxEvents.id });
      if (claimed.length === 0) continue;

      try {
        await dispatch(event);
        await db
          .update(outboxEvents)
          .set({
            status: "processed",
            processedAt: new Date(),
            attempts: event.attempts + 1,
            lockedAt: null,
            lockedBy: null,
          })
          .where(eq(outboxEvents.id, event.id));
        stats.processed += 1;
      } catch (error) {
        const attempts = event.attempts + 1;
        const exhausted = attempts >= MAX_ATTEMPTS;
        await db
          .update(outboxEvents)
          .set({
            attempts,
            lastError: error instanceof Error ? error.message : String(error),
            lockedAt: null,
            lockedBy: null,
            status: exhausted ? "failed" : "pending",
            availableAt: exhausted ? event.availableAt : new Date(Date.now() + RETRY_DELAY_MS),
          })
          .where(eq(outboxEvents.id, event.id));
        stats.failed += 1;
        app.log.error({ error, eventId: event.id }, "outbox dispatch failed");
      }
    }
    stats.lastPollAt = new Date();
  } catch (error) {
    app.log.error({ error }, "outbox poll tick failed");
  } finally {
    loopRunning = false;
  }
}

setInterval(tick, POLL_MS).unref();

app
  .listen({ port, host })
  .then(() => {
    app.log.info(
      `worker listening on ${host}:${port} (outbox poller every ${POLL_MS}ms, id ${WORKER_ID})`,
    );
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
