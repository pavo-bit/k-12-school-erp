import { db, fee_heads, fee_structures, fee_structure_lines, fee_assignments, concessions, invoices, invoice_lines, payments, payment_allocations, receipts, credit_notes, refunds, gateway_orders, gateway_events } from "@school-erp/db";
import { eq, and, desc, sql, gte, lte, sum, isNull } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

// Fee Head operations
export interface CreateFeeHeadInput {
  schoolId: string;
  name: string;
  code: string;
  category: string;
  isTaxable: boolean;
  actorId: string;
}

export async function createFeeHead(input: CreateFeeHeadInput) {
  const id = randomUUID();
  await db.insert(fee_heads).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    code: input.code,
    category: input.category,
    isTaxable: input.isTaxable,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "fee_head.created",
    entityType: "fee_head",
    entityId: id,
    after: { name: input.name, code: input.code, category: input.category },
  });

  return { id, name: input.name, code: input.code, category: input.category };
}

export async function getFeeHead(id: string) {
  const rows = await db.select().from(fee_heads).where(eq(fee_heads.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listFeeHeads(schoolId: string) {
  return db.select().from(fee_heads).where(eq(fee_heads.schoolId, schoolId)).orderBy(desc(fee_heads.createdAt));
}

// Fee Structure operations
export interface CreateFeeStructureInput {
  schoolId: string;
  academicYearId: string;
  classId: string;
  name: string;
  status: string;
  feeStructureLines: Array<{ feeHeadId: string; amountPaise: number; frequency: string; dueRule: string }>;
  actorId: string;
}

export async function createFeeStructure(input: CreateFeeStructureInput) {
  const id = randomUUID();

  // Insert fee structure
  await db.insert(fee_structures).values({
    id,
    schoolId: input.schoolId,
    academicYearId: input.academicYearId,
    classId: input.classId,
    name: input.name,
    status: input.status,
  });

  // Insert fee structure lines
  for (const line of input.feeStructureLines) {
    await db.insert(fee_structure_lines).values({
      id: randomUUID(),
      schoolId: input.schoolId,
      feeStructureId: id,
      feeHeadId: line.feeHeadId,
      amountPaise: line.amountPaise,
      frequency: line.frequency,
      dueRule: line.dueRule,
    });
  }

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "fee_structure.created",
    entityType: "fee_structure",
    entityId: id,
    after: { name: input.name, classId: input.classId, linesCount: input.feeStructureLines.length },
  });

  return { id, name: input.name, classId: input.classId, status: input.status };
}

export async function getFeeStructure(id: string) {
  const structure = await db.select().from(fee_structures).where(eq(fee_structures.id, id)).limit(1);
  const structureData = structure[0];

  if (!structureData) return null;

  const lines = await db
    .select()
    .from(fee_structure_lines)
    .where(eq(fee_structure_lines.feeStructureId, id));

  return { ...structureData, feeStructureLines: lines };
}

export async function listFeeStructures(schoolId: string, academicYearId?: string) {
  const query = db.select().from(fee_structures).where(eq(fee_structures.schoolId, schoolId));
  if (academicYearId) {
    query.where(eq(fee_structures.academicYearId, academicYearId));
  }
  return query.orderBy(desc(fee_structures.createdAt));
}

// Fee Assignment operations
export interface CreateFeeAssignmentInput {
  schoolId: string;
  studentId: string;
  feeStructureId: string;
  academicYearId: string;
  effectiveFrom: Date;
  actorId: string;
}

export async function createFeeAssignment(input: CreateFeeAssignmentInput) {
  const id = randomUUID();
  await db.insert(fee_assignments).values({
    id,
    schoolId: input.schoolId,
    studentId: input.studentId,
    feeStructureId: input.feeStructureId,
    academicYearId: input.academicYearId,
    effectiveFrom: input.effectiveFrom,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "fee_assignment.created",
    entityType: "fee_assignment",
    entityId: id,
    after: { studentId: input.studentId, feeStructureId: input.feeStructureId },
  });

  return { id, studentId: input.studentId, feeStructureId: input.feeStructureId };
}

// Concession operations
export interface CreateConcessionInput {
  schoolId: string;
  studentId: string;
  feeHeadId: string;
  type: string;
  value: number;
  reason: string;
  approvedBy: string;
  validFrom: Date;
  validTo?: Date;
}

export async function createConcession(input: CreateConcessionInput) {
  const id = randomUUID();
  await db.insert(concessions).values({
    id,
    schoolId: input.schoolId,
    studentId: input.studentId,
    feeHeadId: input.feeHeadId,
    type: input.type,
    value: input.value,
    reason: input.reason,
    approvedBy: input.approvedBy,
    validFrom: input.validFrom,
    validTo: input.validTo ?? null,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.approvedBy,
    action: "concession.created",
    entityType: "concession",
    entityId: id,
    after: { studentId: input.studentId, feeHeadId: input.feeHeadId, value: input.value },
  });

  return { id, studentId: input.studentId, feeHeadId: input.feeHeadId, type: input.type, value: input.value };
}

// Invoice operations
export interface CreateInvoiceInput {
  schoolId: string;
  studentId: string;
  academicYearId: string;
  financialYear: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  invoiceLines: Array<{ feeHeadId: string; amountPaise: number; concessionPaise: number; netPaise: number }>;
  actorId: string;
}

export async function createInvoice(input: CreateInvoiceInput) {
  const id = randomUUID();
  const totalPaise = input.invoiceLines.reduce((sum, line) => sum + line.netPaise, 0);

  // Insert invoice
  await db.insert(invoices).values({
    id,
    schoolId: input.schoolId,
    studentId: input.studentId,
    academicYearId: input.academicYearId,
    financialYear: input.financialYear,
    invoiceNumber: input.invoiceNumber,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    totalPaise,
    paidPaise: 0,
    status: input.status,
  });

  // Insert invoice lines
  for (const line of input.invoiceLines) {
    await db.insert(invoice_lines).values({
      id: randomUUID(),
      schoolId: input.schoolId,
      invoiceId: id,
      feeHeadId: line.feeHeadId,
      amountPaise: line.amountPaise,
      concessionPaise: line.concessionPaise,
      netPaise: line.netPaise,
    });
  }

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "invoice.created",
    entityType: "invoice",
    entityId: id,
    after: { invoiceNumber: input.invoiceNumber, totalPaise, status: input.status },
  });

  return { id, invoiceNumber: input.invoiceNumber, totalPaise, status: input.status };
}

export async function getInvoice(id: string) {
  const invoice = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice[0]) return null;

  const lines = await db
    .select()
    .from(invoice_lines)
    .where(eq(invoice_lines.invoiceId, id));

  return { ...invoice[0], invoiceLines: lines };
}

export async function listInvoices(schoolId: string, studentId?: string, status?: string) {
  const query = db.select().from(invoices).where(eq(invoices.schoolId, schoolId));
  if (studentId) {
    query.where(eq(invoices.studentId, studentId));
  }
  if (status) {
    query.where(eq(invoices.status, status));
  }
  return query.orderBy(desc(invoices.createdAt));
}

export async function updateInvoiceStatus(id: string, status: string, actorId: string) {
  const existing = await getInvoice(id);
  if (!existing) {
    throw new Error("Invoice not found");
  }

  await db.update(invoices).set({ status, updatedAt: new Date() }).where(eq(invoices.id, id));

  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "invoice.updated",
    entityType: "invoice",
    entityId: id,
    after: { status },
  });

  return { id, status };
}

// Payment operations
export interface CreatePaymentInput {
  schoolId: string;
  studentId: string;
  amountPaise: number;
  mode: string;
  status: string;
  gateway?: string;
  gatewayPaymentId?: string;
  idempotencyKey?: string;
  receivedAt?: Date;
  actorId: string;
}

export async function createPayment(input: CreatePaymentInput) {
  const id = randomUUID();
  const receivedAt = input.receivedAt ?? new Date();

  await db.insert(payments).values({
    id,
    schoolId: input.schoolId,
    studentId: input.studentId,
    amountPaise: input.amountPaise,
    mode: input.mode,
    status: input.status,
    gateway: input.gateway ?? null,
    gatewayPaymentId: input.gatewayPaymentId ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
    receivedAt,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "payment.created",
    entityType: "payment",
    entityId: id,
    after: { studentId: input.studentId, amountPaise: input.amountPaise, status: input.status },
  });

  return { id, studentId: input.studentId, amountPaise: input.amountPaise, status: input.status };
}

export async function getPayment(id: string) {
  const rows = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listPayments(schoolId: string, studentId?: string) {
  const query = db.select().from(payments).where(eq(payments.schoolId, schoolId));
  if (studentId) {
    query.where(eq(payments.studentId, studentId));
  }
  return query.orderBy(desc(payments.receivedAt));
}

// Payment Allocation operations
export interface PaymentAllocationInput {
  paymentId: string;
  invoiceId: string;
  amountPaise: number;
}

export async function createPaymentAllocation(input: PaymentAllocationInput) {
  const id = randomUUID();
  await db.insert(payment_allocations).values({
    id,
    schoolId: null, // Will be set from payment
    paymentId: input.paymentId,
    invoiceId: input.invoiceId,
    amountPaise: input.amountPaise,
  });

  return { id, paymentId: input.paymentId, invoiceId: input.invoiceId };
}

// Receipt operations
export async function createReceipt(paymentId: string, schoolId: string) {
  const payment = await getPayment(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }

  // Generate receipt number
  const receiptNumber = await generateReceiptNumber(schoolId);

  // Create receipt record
  const id = randomUUID();
  await db.insert(receipts).values({
    id,
    schoolId,
    paymentId,
    receiptNumber,
    financialYear: getFinancialYear(new Date()),
    issuedAt: new Date(),
    objectPath: null, // Will be generated later
  });

  return { id, receiptNumber, paymentId };
}

async function generateReceiptNumber(schoolId: string): Promise<string> {
  // This would use a sequence or generate based on school/year
  return `REC-${schoolId.slice(0, 8)}-${Date.now().toString().slice(-6)}`;
}

function getFinancialYear(date: Date): string {
  const year = date.getFullYear();
  return `${year}-${(year + 1).toString().slice(-2)}`;
}

// Credit Note operations
export interface CreateCreditNoteInput {
  schoolId: string;
  studentId: string;
  amountPaise: number;
  reason: string;
  status: string;
  actorId: string;
}

export async function createCreditNote(input: CreateCreditNoteInput) {
  const id = randomUUID();

  await db.insert(credit_notes).values({
    id,
    schoolId: input.schoolId,
    studentId: input.studentId,
    amountPaise: input.amountPaise,
    reason: input.reason,
    status: input.status,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "credit_note.created",
    entityType: "credit_note",
    entityId: id,
    after: { studentId: input.studentId, amountPaise: input.amountPaise },
  });

  return { id, studentId: input.studentId, amountPaise: input.amountPaise };
}

// Refund operations
export interface CreateRefundInput {
  paymentId: string;
  amountPaise: number;
  status: string;
  approvedBy: string;
  gatewayRefundId?: string;
  actorId: string;
}

export async function createRefund(input: CreateRefundInput) {
  const id = randomUUID();
  await db.insert(refunds).values({
    id,
    schoolId: null, // Will be set from payment
    paymentId: input.paymentId,
    amountPaise: input.amountPaise,
    status: input.status,
    approvedBy: input.approvedBy,
    gatewayRefundId: input.gatewayRefundId ?? null,
  });

  await writeAudit({
    scope: "school",
    schoolId: null, // Will be set from payment
    actorId: input.actorId,
    action: "refund.created",
    entityType: "refund",
    entityId: id,
    after: { paymentId: input.paymentId, amountPaise: input.amountPaise },
  });

  return { id, paymentId: input.paymentId, amountPaise: input.amountPaise };
}
