import { db, reports, report_exports, scheduled_reports, report_jobs, dashboards, dashboard_widgets } from "@school-erp/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

// Report operations
export interface CreateReportInput {
  schoolId: string;
  type: string;
  name: string;
  description?: string;
  filters?: any;
  schedule?: string;
  actorId: string;
}

export async function createReport(input: CreateReportInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(reports).values({
    id,
    schoolId: input.schoolId,
    type: input.type,
    name: input.name,
    description: input.description ?? null,
    filters: input.filters ?? null,
    schedule: input.schedule ?? "none",
    createdAt: now,
    updatedAt: now,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "report.created",
    entityType: "report",
    entityId: id,
    after: { type: input.type, name: input.name },
  });

  return { id, type: input.type, name: input.name };
}

export async function getReport(id: string) {
  const rows = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listReports(schoolId: string, type?: string) {
  const query = db.select().from(reports).where(eq(reports.schoolId, schoolId));
  if (type) {
    query.where(eq(reports.type, type));
  }
  return query.orderBy(desc(reports.createdAt));
}

export async function updateReport(id: string, input: any, actorId: string) {
  const existing = await getReport(id);
  if (!existing) {
    throw new Error("Report not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.filters !== undefined) updates.filters = input.filters;
  if (input.schedule !== undefined) updates.schedule = input.schedule;

  await db.update(reports).set(updates).where(eq(reports.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "report.updated",
    entityType: "report",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Report Export operations
export interface CreateReportExportInput {
  schoolId: string;
  reportId: string;
  format: string;
  startDate: Date;
  endDate: Date;
  actorId: string;
}

export async function createReportExport(input: CreateReportExportInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(report_exports).values({
    id,
    schoolId: input.schoolId,
    reportId: input.reportId,
    format: input.format,
    startDate: input.startDate,
    endDate: input.endDate,
    status: "pending",
    objectPath: null,
    createdAt: now,
  });

  return { id, reportId: input.reportId, format: input.format, status: "pending" };
}

export async function getReportExport(id: string) {
  const rows = await db.select().from(report_exports).where(eq(report_exports.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listReportExports(schoolId: string, reportId?: string) {
  const query = db.select().from(report_exports).where(eq(report_exports.schoolId, schoolId));
  if (reportId) {
    query.where(eq(report_exports.reportId, reportId));
  }
  return query.orderBy(desc(report_exports.createdAt));
}

// Scheduled Report operations
export interface CreateScheduledReportInput {
  schoolId: string;
  reportId: string;
  recipients: string[];
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time?: string;
  actorId: string;
}

export async function createScheduledReport(input: CreateScheduledReportInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(scheduled_reports).values({
    id,
    schoolId: input.schoolId,
    reportId: input.reportId,
    recipients: input.recipients,
    frequency: input.frequency,
    dayOfWeek: input.dayOfWeek ?? null,
    dayOfMonth: input.dayOfMonth ?? null,
    time: input.time ?? null,
    nextRunAt: calculateNextRun(input.frequency, input.dayOfWeek, input.dayOfMonth, input.time),
    createdAt: now,
    updatedAt: now,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "scheduled_report.created",
    entityType: "scheduled_report",
    entityId: id,
    after: { reportId: input.reportId, frequency: input.frequency },
  });

  return { id, reportId: input.reportId, frequency: input.frequency };
}

function calculateNextRun(frequency: string, dayOfWeek?: number, dayOfMonth?: number, time?: string): Date | null {
  const now = new Date();
  const nextRun = new Date(now);

  switch (frequency) {
    case "daily":
      nextRun.setDate(nextRun.getDate() + 1);
      if (time) {
        const [hours, minutes] = time.split(":").map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
      }
      break;
    case "weekly":
      if (dayOfWeek !== undefined) {
        const currentDay = nextRun.getDay();
        const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
        nextRun.setDate(nextRun.getDate() + daysUntil);
        if (time) {
          const [hours, minutes] = time.split(":").map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        }
      }
      break;
    case "monthly":
      if (dayOfMonth !== undefined) {
        nextRun.setDate(dayOfMonth);
        if (nextRun < now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        if (time) {
          const [hours, minutes] = time.split(":").map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        }
      }
      break;
  }

  return nextRun;
}

export async function getScheduledReport(id: string) {
  const rows = await db.select().from(scheduled_reports).where(eq(scheduled_reports.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listScheduledReports(schoolId: string, reportId?: string) {
  const query = db.select().from(scheduled_reports).where(eq(scheduled_reports.schoolId, schoolId));
  if (reportId) {
    query.where(eq(scheduled_reports.reportId, reportId));
  }
  return query.orderBy(desc(scheduled_reports.createdAt));
}

// Report Job operations
export interface CreateReportJobInput {
  schoolId: string;
  reportId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  actorId: string;
}

export async function createReportJob(input: CreateReportJobInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(report_jobs).values({
    id,
    schoolId: input.schoolId,
    reportId: input.reportId,
    type: input.type,
    startDate: input.startDate,
    endDate: input.endDate,
    status: "pending",
    objectPath: null,
    createdAt: now,
  });

  return { id, reportId: input.reportId, type: input.type, status: "pending" };
}

export async function getReportJob(id: string) {
  const rows = await db.select().from(report_jobs).where(eq(report_jobs.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listReportJobs(schoolId: string, reportId?: string) {
  const query = db.select().from(report_jobs).where(eq(report_jobs.schoolId, schoolId));
  if (reportId) {
    query.where(eq(report_jobs.reportId, reportId));
  }
  return query.orderBy(desc(report_jobs.createdAt));
}

// Dashboard operations
export interface CreateDashboardInput {
  schoolId: string;
  name: string;
  layout?: any;
  widgets?: any[];
  actorId: string;
}

export async function createDashboard(input: CreateDashboardInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(dashboards).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    layout: input.layout ?? null,
    widgets: input.widgets ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "dashboard.created",
    entityType: "dashboard",
    entityId: id,
    after: { name: input.name },
  });

  return { id, name: input.name };
}

export async function getDashboard(id: string) {
  const rows = await db.select().from(dashboards).where(eq(dashboards.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listDashboards(schoolId: string) {
  return db.select().from(dashboards).where(eq(dashboards.schoolId, schoolId)).orderBy(desc(dashboards.createdAt));
}

export async function updateDashboard(id: string, input: any, actorId: string) {
  const existing = await getDashboard(id);
  if (!existing) {
    throw new Error("Dashboard not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.layout !== undefined) updates.layout = input.layout;
  if (input.widgets !== undefined) updates.widgets = input.widgets;

  await db.update(dashboards).set(updates).where(eq(dashboards.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "dashboard.updated",
    entityType: "dashboard",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Dashboard Widget operations
export interface CreateDashboardWidgetInput {
  dashboardId: string;
  type: string;
  title: string;
  dataSource: string;
  config?: any;
  position?: any;
  actorId: string;
}

export async function createDashboardWidget(input: CreateDashboardWidgetInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(dashboard_widgets).values({
    id,
    dashboardId: input.dashboardId,
    type: input.type,
    title: input.title,
    dataSource: input.dataSource,
    config: input.config ?? null,
    position: input.position ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return { id, dashboardId: input.dashboardId, type: input.type, title: input.title };
}

export async function getDashboardWidget(id: string) {
  const rows = await db.select().from(dashboard_widgets).where(eq(dashboard_widgets.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listDashboardWidgets(dashboardId: string) {
  return db.select().from(dashboard_widgets).where(eq(dashboard_widgets.dashboardId, dashboardId)).orderBy(dashboard_widgets.position);
}

// Statistics operations
export async function getAttendanceSummary(schoolId: string, sectionId?: string, date?: Date) {
  // This would be implemented with actual database queries
  return {
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    totalExcused: 0,
    totalStudents: 0,
    attendanceRate: 0,
  };
}

export async function getFeeCollectionSummary(schoolId: string, academicYearId?: string, date?: Date) {
  // This would be implemented with actual database queries
  return {
    totalDemand: 0,
    totalCollected: 0,
    pending: 0,
    collectionRate: 0,
  };
}

export async function getEnrollmentSummary(schoolId: string, academicYearId?: string) {
  // This would be implemented with actual database queries
  return {
    totalStudents: 0,
    newAdmissions: 0,
    withdrawals: 0,
    transfers: 0,
  };
}

export async function getExamResultsSummary(schoolId: string, examId?: string) {
  // This would be implemented with actual database queries
  return {
    totalExams: 0,
    averagePassRate: 0,
    topPerformer: null,
    totalStudents: 0,
  };
}

// Dashboard Widget Data operations
export async function getWidgetData(dashboardId: string, widgetId: string) {
  const widget = await getDashboardWidget(widgetId);
  if (!widget) {
    throw new Error("Widget not found");
  }

  // This would be implemented with actual data fetching based on dataSource
  return {
    data: [],
    meta: {
      total: 0,
      average: 0,
      max: 0,
      min: 0,
    },
  };
}
