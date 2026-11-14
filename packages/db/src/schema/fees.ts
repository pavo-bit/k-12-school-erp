import {
  pgTable,
  text,
  timestamp,
  uuid,
  bigint,
  date,
  integer,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const feeHeads = pgTable(
  "fee_heads",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    category: text("category").notNull().default("tuition"),
    isTaxable: boolean("is_taxable").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSchoolCode: unique().on(t.schoolId, t.code),
  }),
);

export const feeStructures = pgTable("fee_structures", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  academicYearId: uuid("academic_year_id").notNull(),
  classId: uuid("class_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feeStructureLines = pgTable("fee_structure_lines", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  feeStructureId: uuid("fee_structure_id").notNull(),
  feeHeadId: uuid("fee_head_id").notNull(),
  amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
  frequency: text("frequency").notNull().default("annual"),
  dueRule: text("due_rule"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feeAssignments = pgTable("fee_assignments", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  studentId: uuid("student_id").notNull(),
  feeStructureId: uuid("fee_structure_id").notNull(),
  academicYearId: uuid("academic_year_id").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const concessions = pgTable("concessions", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  studentId: uuid("student_id").notNull(),
  feeHeadId: uuid("fee_head_id"),
  type: text("type").notNull(),
  value: bigint("value", { mode: "number" }).notNull(),
  reason: text("reason"),
  approvedBy: uuid("approved_by"),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    studentId: uuid("student_id").notNull(),
    academicYearId: uuid("academic_year_id").notNull(),
    financialYear: text("financial_year").notNull(),
    invoiceNumber: text("invoice_number").notNull(),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    status: text("status").notNull().default("issued"),
    totalPaise: bigint("total_paise", { mode: "number" }).notNull(),
    paidPaise: bigint("paid_paise", { mode: "number" }).notNull().default(0),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueInvoiceNumber: unique().on(t.schoolId, t.financialYear, t.invoiceNumber),
    uniqueSchoolId: unique().on(t.schoolId, t.id),
  }),
);

export const invoiceLines = pgTable("invoice_lines", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  invoiceId: uuid("invoice_id").notNull(),
  feeHeadId: uuid("fee_head_id").notNull(),
  amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
  concessionPaise: bigint("concession_paise", { mode: "number" }).notNull().default(0),
  netPaise: bigint("net_paise", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    studentId: uuid("student_id").notNull(),
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    mode: text("mode").notNull(),
    status: text("status").notNull().default("recorded"),
    gateway: text("gateway"),
    gatewayPaymentId: text("gateway_payment_id"),
    idempotencyKey: text("idempotency_key"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueGatewayPayment: unique().on(t.gateway, t.gatewayPaymentId),
  }),
);

export const paymentAllocations = pgTable("payment_allocations", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  paymentId: uuid("payment_id").notNull(),
  invoiceId: uuid("invoice_id").notNull(),
  amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    paymentId: uuid("payment_id").notNull(),
    receiptNumber: text("receipt_number").notNull(),
    financialYear: text("financial_year").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    objectPath: text("object_path"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueReceiptNumber: unique().on(t.schoolId, t.financialYear, t.receiptNumber),
    uniquePayment: unique().on(t.paymentId),
  }),
);

export const creditNotes = pgTable("credit_notes", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  studentId: uuid("student_id").notNull(),
  amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("issued"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  paymentId: uuid("payment_id").notNull(),
  amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
  status: text("status").notNull().default("requested"),
  approvedBy: uuid("approved_by"),
  gatewayRefundId: text("gateway_refund_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gatewayOrders = pgTable("gateway_orders", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  studentId: uuid("student_id").notNull(),
  amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
  gatewayOrderId: text("gateway_order_id").notNull(),
  status: text("status").notNull().default("created"),
  idempotencyKey: text("idempotency_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gatewayEvents = pgTable("gateway_events", {
  id: uuid("id").primaryKey(),
  gateway: text("gateway").notNull(),
  eventId: text("event_id").notNull(),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reconciliationRuns = pgTable("reconciliation_runs", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  runDate: date("run_date").notNull(),
  status: text("status").notNull().default("pending"),
  matchedCount: integer("matched_count").notNull().default(0),
  exceptionCount: integer("exception_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const reconciliationExceptions = pgTable("reconciliation_exceptions", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  runId: uuid("run_id").notNull(),
  paymentId: uuid("payment_id"),
  invoiceId: uuid("invoice_id"),
  reason: text("reason").notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
