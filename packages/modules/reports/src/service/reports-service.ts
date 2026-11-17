import {
  db,
  dailyAttendanceSummaries,
  dailyFeeSummaries,
  enrollmentSnapshots,
  reportJobs,
  scheduledReports,
} from "@school-erp/db";
import { eq, and, gte, lte, count, sql, or } from "drizzle-orm";
import {
  attendanceRecords,
  attendanceSessions,
  payments,
  enrollments,
  invoices,
} from "@school-erp/db";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

/**
 * Reports module — operational summary computation and scheduled delivery.
 * All aggregates are rebuildable from operational data; never the sole source of truth.
 */

export async function computeAttendanceSummary(schoolId: string, sectionId: string, date: string) {
  const sessions = await db
    .select({ id: attendanceSessions.id })
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.schoolId, schoolId),
        eq(attendanceSessions.sectionId, sectionId),
        eq(attendanceSessions.date, date),
      ),
    );

  const sessionIds = sessions.map((s) => s.id);
  let present = 0;
  let total = 0;
  if (sessionIds.length > 0) {
    const rows = await db
      .select({ status: attendanceRecords.status, studentId: attendanceRecords.studentId })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.schoolId, schoolId),
          or(...sessionIds.map((id) => eq(attendanceRecords.sessionId, id))),
        ),
      );
    for (const r of rows) {
      total += 1;
      if (r.status === "present") present += 1;
    }
  }

  const existing = await db
    .select({ id: dailyAttendanceSummaries.id })
    .from(dailyAttendanceSummaries)
    .where(
      and(
        eq(dailyAttendanceSummaries.schoolId, schoolId),
        eq(dailyAttendanceSummaries.sectionId, sectionId),
        eq(dailyAttendanceSummaries.date, date),
      ),
    );

  const values = {
    presentCount: present,
    absentCount: Math.max(total - present, 0),
    totalCount: total,
  };
  if (existing[0]) {
    await db
      .update(dailyAttendanceSummaries)
      .set(values)
      .where(eq(dailyAttendanceSummaries.id, existing[0].id));
    return { ...values, sectionId, date, updated: true };
  }
  const id = randomUUID();
  await db.insert(dailyAttendanceSummaries).values([{ id, schoolId, sectionId, date, ...values }]);
  return { ...values, sectionId, date, updated: false };
}

export async function computeFeeSummary(schoolId: string, academicYearId: string, date: string) {
  const start = new Date(date + "T00:00:00+05:30");
  const end = new Date(date + "T23:59:59+05:30");

  const collected = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int` })
    .from(payments)
    .where(
      and(
        eq(payments.schoolId, schoolId),
        gte(payments.receivedAt, start),
        lte(payments.receivedAt, end),
      ),
    );

  const outstanding = await db
    .select({
      outstanding: sql<number>`coalesce(sum(${invoices.totalPaise} - ${invoices.paidPaise}), 0)::bigint`,
    })
    .from(invoices)
    .where(and(eq(invoices.schoolId, schoolId), eq(invoices.academicYearId, academicYearId)));

  const invoiceCount = await db
    .select({ count: count() })
    .from(enrollments)
    .where(eq(enrollments.schoolId, schoolId));

  const collectedPaise = collected[0]?.total ?? 0;
  const outstandingPaise = Number(outstanding[0]?.outstanding ?? 0);

  const existing = await db
    .select({ id: dailyFeeSummaries.id })
    .from(dailyFeeSummaries)
    .where(
      and(
        eq(dailyFeeSummaries.schoolId, schoolId),
        eq(dailyFeeSummaries.academicYearId, academicYearId),
        eq(dailyFeeSummaries.date, date),
      ),
    );

  const values = { collectedPaise, outstandingPaise, invoiceCount: invoiceCount[0]?.count ?? 0 };
  if (existing[0]) {
    await db.update(dailyFeeSummaries).set(values).where(eq(dailyFeeSummaries.id, existing[0].id));
    return { ...values, academicYearId, date, updated: true };
  }
  const id = randomUUID();
  await db.insert(dailyFeeSummaries).values([{ id, schoolId, academicYearId, date, ...values }]);
  return { ...values, academicYearId, date, updated: false };
}

export async function listAttendanceSummaries(schoolId: string, sectionId?: string) {
  const conditions = [eq(dailyAttendanceSummaries.schoolId, schoolId)];
  if (sectionId) conditions.push(eq(dailyAttendanceSummaries.sectionId, sectionId));
  return db
    .select()
    .from(dailyAttendanceSummaries)
    .where(and(...conditions))
    .orderBy(dailyAttendanceSummaries.date);
}

export async function listFeeSummaries(schoolId: string, academicYearId?: string) {
  const conditions = [eq(dailyFeeSummaries.schoolId, schoolId)];
  if (academicYearId) conditions.push(eq(dailyFeeSummaries.academicYearId, academicYearId));
  return db
    .select()
    .from(dailyFeeSummaries)
    .where(and(...conditions))
    .orderBy(dailyFeeSummaries.date);
}

export async function createScheduledReport(input: {
  schoolId: string;
  reportType: string;
  frequency: string;
  recipients: string;
  nextRunAt: string;
  actorId: string;
}) {
  const id = randomUUID();
  await db.insert(scheduledReports).values([
    {
      id,
      schoolId: input.schoolId,
      reportType: input.reportType,
      frequency: input.frequency,
      recipients: input.recipients,
      nextRunAt: new Date(input.nextRunAt),
      enabled: true,
    },
  ]);
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "report.scheduled",
    entityType: "scheduled_report",
    entityId: id,
  });
  return {
    id,
    reportType: input.reportType,
    frequency: input.frequency,
    nextRunAt: input.nextRunAt,
  };
}

export async function listScheduledReports(schoolId: string) {
  return db.select().from(scheduledReports).where(eq(scheduledReports.schoolId, schoolId));
}

export async function createReportRequest(input: {
  schoolId: string;
  reportType: string;
  requestedBy: string;
}) {
  const id = randomUUID();
  await db.insert(reportJobs).values([
    {
      id,
      schoolId: input.schoolId,
      reportType: input.reportType,
      status: "pending",
      requestedBy: input.requestedBy,
    },
  ]);
  return { id, reportType: input.reportType, status: "pending" };
}

export async function listReportJobs(schoolId: string) {
  return db
    .select()
    .from(reportJobs)
    .where(eq(reportJobs.schoolId, schoolId))
    .orderBy(sql`${reportJobs.createdAt} desc`);
}
