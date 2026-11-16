import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, reports, report_exports, scheduled_reports, dashboards, dashboard_widgets } from "@school-erp/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createReport, createReportExport, createScheduledReport, createDashboard, createDashboardWidget } from "@school-erp/reports";

describe("Reports Module Integration Tests", () => {
  let schoolId: string;
  let reportId: string;
  let dashboardId: string;

  beforeAll(async () => {
    schoolId = randomUUID();

    const report = await createReport({
      schoolId,
      type: "attendance",
      name: "Attendance Report",
      description: "Monthly attendance report",
      filters: { month: "11", year: "2026" },
      schedule: "none",
      actorId: randomUUID(),
    });

    reportId = report.id;

    const dashboard = await createDashboard({
      schoolId,
      name: "Main Dashboard",
      layout: { columns: 3 },
      widgets: [],
      actorId: randomUUID(),
    });

    dashboardId = dashboard.id;
  });

  afterAll(async () => {
    await db.delete(dashboard_widgets).where(eq(dashboard_widgets.dashboardId, dashboardId));
    await db.delete(dashboards).where(eq(dashboards.schoolId, schoolId));
    await db.delete(scheduled_reports).where(eq(scheduled_reports.schoolId, schoolId));
    await db.delete(report_exports).where(eq(report_exports.schoolId, schoolId));
    await db.delete(reports).where(eq(reports.schoolId, schoolId));
  });

  it("should create report successfully", async () => {
    const report = await createReport({
      schoolId,
      type: "fee_collection",
      name: "Fee Collection Report",
      description: "Monthly fee collection summary",
      filters: { month: "11", year: "2026" },
      schedule: "weekly",
      actorId: randomUUID(),
    });

    expect(report).toBeDefined();
    expect(report.name).toBe("Fee Collection Report");
    expect(report.type).toBe("fee_collection");
  });

  it("should create report export successfully", async () => {
    const reportExport = await createReportExport({
      schoolId,
      reportId,
      format: "csv",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2026-11-30"),
      actorId: randomUUID(),
    });

    expect(reportExport).toBeDefined();
    expect(reportExport.reportId).toBe(reportId);
    expect(reportExport.format).toBe("csv");
    expect(reportExport.status).toBe("pending");
  });

  it("should create scheduled report successfully", async () => {
    const scheduledReport = await createScheduledReport({
      schoolId,
      reportId,
      recipients: ["admin@school.com", "principal@school.com"],
      frequency: "weekly",
      dayOfWeek: 1,
      time: "09:00",
      actorId: randomUUID(),
    });

    expect(scheduledReport).toBeDefined();
    expect(scheduledReport.reportId).toBe(reportId);
    expect(scheduledReport.frequency).toBe("weekly");
  });

  it("should create dashboard successfully", async () => {
    const dashboard = await createDashboard({
      schoolId,
      name: "Analytics Dashboard",
      layout: { columns: 4 },
      widgets: [],
      actorId: randomUUID(),
    });

    expect(dashboard).toBeDefined();
    expect(dashboard.name).toBe("Analytics Dashboard");
  });

  it("should create dashboard widget successfully", async () => {
    const widget = await createDashboardWidget({
      dashboardId,
      type: "stat_card",
      title: "Total Students",
      dataSource: "enrollment",
      config: { color: "blue" },
      position: { x: 0, y: 0, w: 1, h: 1 },
      actorId: randomUUID(),
    });

    expect(widget).toBeDefined();
    expect(widget.dashboardId).toBe(dashboardId);
    expect(widget.type).toBe("stat_card");
    expect(widget.title).toBe("Total Students");
  });

  it("should handle different report types", async () => {
    const types = ["attendance", "fee_collection", "enrollment", "exam_results", "student_list", "custom"];

    for (const type of types) {
      const report = await createReport({
        schoolId,
        type,
        name: `Report ${type}`,
        description: `Description for ${type}`,
        filters: {},
        schedule: "none",
        actorId: randomUUID(),
      });

      expect(report).toBeDefined();
      expect(report.type).toBe(type);
    }
  });

  it("should handle different export formats", async () => {
    const formats = ["csv", "xlsx", "pdf"];

    for (const format of formats) {
      const reportExport = await createReportExport({
        schoolId,
        reportId,
        format,
        startDate: new Date("2026-11-01"),
        endDate: new Date("2026-11-30"),
        actorId: randomUUID(),
      });

      expect(reportExport).toBeDefined();
      expect(reportExport.format).toBe(format);
    }
  });

  it("should handle different scheduled report frequencies", async () => {
    const frequencies = ["daily", "weekly", "monthly"];

    for (const frequency of frequencies) {
      const scheduledReport = await createScheduledReport({
        schoolId,
        reportId,
        recipients: ["admin@school.com"],
        frequency,
        actorId: randomUUID(),
      });

      expect(scheduledReport).toBeDefined();
      expect(scheduledReport.frequency).toBe(frequency);
    }
  });

  it("should handle different widget types", async () => {
    const types = ["stat_card", "line_chart", "bar_chart", "pie_chart", "table", "kpi"];

    for (const type of types) {
      const widget = await createDashboardWidget({
        dashboardId,
        type,
        title: `Widget ${type}`,
        dataSource: "enrollment",
        config: {},
        position: { x: 0, y: 0, w: 1, h: 1 },
        actorId: randomUUID(),
      });

      expect(widget).toBeDefined();
      expect(widget.type).toBe(type);
    }
  });

  it("should handle different schedule types", async () => {
    const schedules = ["none", "daily", "weekly", "monthly"];

    for (const schedule of schedules) {
      const report = await createReport({
        schoolId,
        type: "attendance",
        name: `Report ${schedule}`,
        description: `Report with ${schedule} schedule`,
        filters: {},
        schedule,
        actorId: randomUUID(),
      });

      expect(report).toBeDefined();
      expect(report.schedule).toBe(schedule);
    }
  });

  it("should list reports by school", async () => {
    const reportsList = await db.select().from(reports).where(eq(reports.schoolId, schoolId));

    expect(reportsList.length).toBeGreaterThan(0);
    reportsList.forEach((r) => {
      expect(r.schoolId).toBe(schoolId);
    });
  });

  it("should list report exports by report", async () => {
    const exports = await db.select().from(report_exports).where(eq(report_exports.reportId, reportId));

    expect(exports.length).toBeGreaterThan(0);
    exports.forEach((e) => {
      expect(e.reportId).toBe(reportId);
    });
  });

  it("should list scheduled reports by report", async () => {
    const scheduled = await db.select().from(scheduled_reports).where(eq(scheduled_reports.reportId, reportId));

    expect(scheduled.length).toBeGreaterThan(0);
    scheduled.forEach((s) => {
      expect(s.reportId).toBe(reportId);
    });
  });

  it("should list dashboard widgets by dashboard", async () => {
    const widgets = await db.select().from(dashboard_widgets).where(eq(dashboard_widgets.dashboardId, dashboardId));

    expect(widgets.length).toBeGreaterThan(0);
    widgets.forEach((w) => {
      expect(w.dashboardId).toBe(dashboardId);
    });
  });

  it("should enforce required fields in report", async () => {
    try {
      await createReport({
        schoolId,
        // Missing type and name
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in report export", async () => {
    try {
      await createReportExport({
        schoolId,
        // Missing reportId, format, startDate, endDate
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in scheduled report", async () => {
    try {
      await createScheduledReport({
        schoolId,
        // Missing reportId, recipients, frequency
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in dashboard", async () => {
    try {
      await createDashboard({
        schoolId,
        // Missing name
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing name");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in dashboard widget", async () => {
    try {
      await createDashboardWidget({
        dashboardId,
        // Missing type, title, dataSource
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
