import { z } from "zod";

// Report schemas
export const CreateReportSchema = z.object({
  schoolId: z.string().uuid(),
  type: z.enum([
    "attendance",
    "fee_collection",
    "enrollment",
    "exam_results",
    "student_list",
    "custom",
  ]),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  filters: z.unknown(),
  schedule: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  actorId: z.string(),
});

export const UpdateReportSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  filters: z.unknown().optional(),
  schedule: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
});

export const ReportResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  type: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  filters: z.unknown(),
  schedule: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Report Export schemas
export const CreateReportExportSchema = z.object({
  schoolId: z.string().uuid(),
  reportId: z.string().uuid(),
  format: z.enum(["csv", "xlsx", "pdf"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  actorId: z.string(),
});

export const ReportExportResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  reportId: z.string().uuid(),
  format: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.string(),
  objectPath: z.string().nullable(),
  createdAt: z.date(),
});

// Scheduled Report schemas
export const CreateScheduledReportSchema = z.object({
  schoolId: z.string().uuid(),
  reportId: z.string().uuid(),
  recipients: z.array(z.string()).min(1),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  time: z.string().time().optional(),
  actorId: z.string(),
});

export const ScheduledReportResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  reportId: z.string().uuid(),
  recipients: z.array(z.string()),
  frequency: z.string(),
  dayOfWeek: z.number().nullable(),
  dayOfMonth: z.number().nullable(),
  time: z.string().nullable(),
  nextRunAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Report Job schemas
export const CreateReportJobSchema = z.object({
  schoolId: z.string().uuid(),
  reportId: z.string().uuid(),
  type: z.enum(["generate", "export"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  actorId: z.string(),
});

export const ReportJobResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  reportId: z.string().uuid(),
  type: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.string(),
  objectPath: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Dashboard Schema schemas
export const CreateDashboardSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(200),
  layout: z.unknown(),
  widgets: z.array(z.unknown()),
  actorId: z.string(),
});

export const UpdateDashboardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  layout: z.unknown().optional(),
  widgets: z.array(z.unknown()).optional(),
});

export const DashboardResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  layout: z.unknown(),
  widgets: z.array(z.unknown()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Dashboard Widget schemas
export const CreateDashboardWidgetSchema = z.object({
  dashboardId: z.string().uuid(),
  type: z.enum(["stat_card", "line_chart", "bar_chart", "pie_chart", "table", "kpi"]),
  title: z.string().min(1).max(200),
  dataSource: z.string(),
  config: z.unknown(),
  position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  actorId: z.string(),
});

export const DashboardWidgetResponseSchema = z.object({
  id: z.string().uuid(),
  dashboardId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  dataSource: z.string(),
  config: z.unknown(),
  position: z.unknown(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// KPI schemas
export interface KPI {
  id: string;
  schoolId: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  trend?: "up" | "down" | "stable";
  unit?: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Data Source schemas
export interface DataSource {
  id: string;
  schoolId: string;
  name: string;
  type: string;
  query: string;
  parameters: unknown;
  createdAt: Date;
  updatedAt: Date;
}

// Filter schemas
export const DateRangeFilterSchema = z.object({
  type: z.literal("date_range"),
  field: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const DropdownFilterSchema = z.object({
  type: z.literal("dropdown"),
  field: z.string(),
  options: z.array(z.string()),
  multiple: z.boolean().default(false),
});

export const TextFilterSchema = z.object({
  type: z.literal("text"),
  field: z.string(),
  operator: z.enum(["equals", "contains", "starts_with", "ends_with"]),
  value: z.string(),
});

export const CompositeFilterSchema = z.object({
  type: z.literal("composite"),
  logicalOperator: z.enum(["and", "or"]),
  filters: z.array(z.unknown()),
});
