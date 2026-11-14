import {
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  integer,
  boolean,
  bigint,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    userId: uuid("user_id"),
    employeeCode: text("employee_code").notNull(),
    designationId: uuid("designation_id"),
    departmentId: uuid("department_id"),
    joiningDate: date("joining_date").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueEmployeeCode: unique().on(t.schoolId, t.employeeCode),
  }),
);

export const staffDocuments = pgTable("staff_documents", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  staffId: uuid("staff_id").notNull(),
  type: text("type").notNull(),
  objectPath: text("object_path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leaveTypes = pgTable("leave_types", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  name: text("name").notNull(),
  quota: integer("quota").notNull().default(0),
  carryForward: boolean("carry_forward").notNull().default(false),
  paid: boolean("paid").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leavePolicies = pgTable("leave_policies", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  leaveTypeId: uuid("leave_type_id").notNull(),
  quota: integer("quota").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leaveBalances = pgTable("leave_balances", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  staffId: uuid("staff_id").notNull(),
  leaveTypeId: uuid("leave_type_id").notNull(),
  academicYearId: uuid("academic_year_id").notNull(),
  balance: integer("balance").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  staffId: uuid("staff_id").notNull(),
  leaveTypeId: uuid("leave_type_id").notNull(),
  fromDate: date("from_date").notNull(),
  toDate: date("to_date").notNull(),
  status: text("status").notNull().default("pending"),
  approvedBy: uuid("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salaryComponents = pgTable("salary_components", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  calculation: text("calculation").notNull(),
  statutory: boolean("statutory").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salaryStructures = pgTable("salary_structures", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  staffId: uuid("staff_id").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salaryStructureLines = pgTable("salary_structure_lines", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  structureId: uuid("structure_id").notNull(),
  componentId: uuid("component_id").notNull(),
  amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
  percentage: text("percentage"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payrollRuns = pgTable(
  "payroll_runs",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    month: date("month").notNull(),
    status: text("status").notNull().default("draft"),
    preparedBy: uuid("prepared_by"),
    approvedBy: uuid("approved_by"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSchoolMonth: unique().on(t.schoolId, t.month),
  }),
);

export const payrollItems = pgTable(
  "payroll_items",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    runId: uuid("run_id").notNull(),
    staffId: uuid("staff_id").notNull(),
    gross: bigint("gross", { mode: "number" }).notNull(),
    deductions: bigint("deductions", { mode: "number" }).notNull(),
    net: bigint("net", { mode: "number" }).notNull(),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueRunStaff: unique().on(t.runId, t.staffId),
  }),
);

export const payslips = pgTable("payslips", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  payrollItemId: uuid("payroll_item_id").notNull().unique(),
  objectPath: text("object_path"),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payrollAdjustments = pgTable("payroll_adjustments", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  staffId: uuid("staff_id").notNull(),
  runId: uuid("run_id"),
  amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const statutoryRates = pgTable("statutory_rates", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id"),
  type: text("type").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  config: text("config").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
