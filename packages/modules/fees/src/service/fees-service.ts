import {
  db,
  feeHeads,
  feeStructures,
  feeStructureLines,
  feeAssignments,
  concessions,
  invoices,
  invoiceLines,
  payments,
  paymentAllocations,
  receipts,
  creditNotes,
  refunds,
  gatewayOrders,
  gatewayEvents,
  outboxEvents,
  nextDocumentNumber,
  getFinancialYear,
} from "@school-erp/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

/** Domain error carrying a stable machine code for API mapping. */
export class FeeError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "FeeError";
  }
}

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
  await db.insert(feeHeads).values({
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
  const rows = await db.select().from(feeHeads).where(eq(feeHeads.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listFeeHeads(schoolId: string) {
  return db
    .select()
    .from(feeHeads)
    .where(eq(feeHeads.schoolId, schoolId))
    .orderBy(desc(feeHeads.createdAt));
}

// Fee Structure operations
export interface CreateFeeStructureInput {
  schoolId: string;
  academicYearId: string;
  classId: string;
  name: string;
  status: string;
  feeStructureLines: Array<{
    feeHeadId: string;
    amountPaise: number;
    frequency: string;
    dueRule: string;
  }>;
  actorId: string;
}

export async function createFeeStructure(input: CreateFeeStructureInput) {
  const id = randomUUID();

  // Insert fee structure
  await db.insert(feeStructures).values({
    id,
    schoolId: input.schoolId,
    academicYearId: input.academicYearId,
    classId: input.classId,
    name: input.name,
    status: input.status,
  });

  // Insert fee structure lines
  for (const line of input.feeStructureLines) {
    await db.insert(feeStructureLines).values({
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
  const structure = await db.select().from(feeStructures).where(eq(feeStructures.id, id)).limit(1);
  const structureData = structure[0];

  if (!structureData) return null;

  const lines = await db
    .select()
    .from(feeStructureLines)
    .where(eq(feeStructureLines.feeStructureId, id));

  return { ...structureData, feeStructureLines: lines };
}

export async function listFeeStructures(schoolId: string, academicYearId?: string) {
  const conditions = [eq(feeStructures.schoolId, schoolId)];
  if (academicYearId) conditions.push(eq(feeStructures.academicYearId, academicYearId));
  return db
    .select()
    .from(feeStructures)
    .where(and(...conditions))
    .orderBy(desc(feeStructures.createdAt));
}

// Fee Assignment operations
export interface CreateFeeAssignmentInput {
  schoolId: string;
  studentId: string;
  feeStructureId: string;
  academicYearId: string;
  effectiveFrom: string;
  actorId: string;
}

export async function createFeeAssignment(input: CreateFeeAssignmentInput) {
  const id = randomUUID();
  await db.insert(feeAssignments).values({
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).insert(concessions).values([
    {
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
    },
  ]);

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.approvedBy,
    action: "concession.created",
    entityType: "concession",
    entityId: id,
    after: { studentId: input.studentId, feeHeadId: input.feeHeadId, value: input.value },
  });

  return {
    id,
    studentId: input.studentId,
    feeHeadId: input.feeHeadId,
    type: input.type,
    value: input.value,
  };
}

// Invoice operations
export interface CreateInvoiceInput {
  schoolId: string;
  studentId: string;
  academicYearId: string;
  financialYear?: string;
  /** Optional override; omitted → allocated atomically from document_sequences (INV-000001...). */
  invoiceNumber?: string;
  issueDate: Date;
  dueDate: Date;
  status?: string;
  invoiceLines: Array<{
    feeHeadId: string;
    amountPaise: number;
    concessionPaise: number;
    netPaise: number;
  }>;
  actorId: string;
}

export async function createInvoice(input: CreateInvoiceInput) {
  const id = randomUUID();
  const totalPaise = input.invoiceLines.reduce((sum, line) => sum + line.netPaise, 0);
  if (totalPaise <= 0) {
    throw new FeeError("INVALID_TOTAL", "Invoice total must be positive.");
  }
  const financialYear = input.financialYear ?? getFinancialYear(new Date());
  const invoiceNumber =
    input.invoiceNumber ?? (await nextDocumentNumber(input.schoolId, "invoice", financialYear));

  // Insert invoice
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).insert(invoices).values([
    {
      id,
      schoolId: input.schoolId,
      studentId: input.studentId,
      academicYearId: input.academicYearId,
      financialYear,
      invoiceNumber,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      totalPaise,
      paidPaise: 0,
      status: input.status ?? "issued",
      version: 1,
    },
  ]);

  // Insert invoice lines
  for (const line of input.invoiceLines) {
    await db.insert(invoiceLines).values({
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
    after: { invoiceNumber, totalPaise, status: input.status ?? "issued" },
  });

  return { id, invoiceNumber, totalPaise, status: input.status ?? "issued" };
}

export async function getInvoice(id: string) {
  const invoice = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice[0]) return null;

  const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, id));

  return { ...invoice[0], invoiceLines: lines };
}

export async function listInvoices(schoolId: string, studentId?: string, status?: string) {
  const conditions = [eq(invoices.schoolId, schoolId)];
  if (studentId) conditions.push(eq(invoices.studentId, studentId));
  if (status) conditions.push(eq(invoices.status, status));
  return db
    .select()
    .from(invoices)
    .where(and(...conditions))
    .orderBy(desc(invoices.createdAt));
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
  // Idempotent retry path: return the existing payment for a repeated key.
  if (input.idempotencyKey) {
    const existing = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.schoolId, input.schoolId),
          eq(payments.idempotencyKey, input.idempotencyKey),
        ),
      )
      .limit(1);
    if (existing[0]) {
      return {
        id: existing[0].id,
        studentId: existing[0].studentId,
        amountPaise: existing[0].amountPaise,
        status: existing[0].status,
        duplicate: true,
      };
    }
  }

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
  const conditions = [eq(payments.schoolId, schoolId)];
  if (studentId) conditions.push(eq(payments.studentId, studentId));
  return db
    .select()
    .from(payments)
    .where(and(...conditions))
    .orderBy(desc(payments.receivedAt));
}

// Payment Allocation operations
export interface PaymentAllocationInput {
  schoolId: string;
  paymentId: string;
  invoiceId: string;
  /** Omitted → allocate the smaller of (payment's unallocated balance, invoice outstanding). */
  amountPaise?: number;
  actorId?: string;
}

/**
 * Applies a payment to an invoice atomically:
 *   locks the payment row (FOR UPDATE), validates balances on both sides,
 *   inserts the allocation, and posts it to the invoice (paid_paise + status).
 * Runs inside the caller's tenant transaction, so the whole thing commits or rolls back together.
 */
export async function createPaymentAllocation(input: PaymentAllocationInput) {
  // Lock the payment row — concurrent allocations against the same payment serialize here.
  const paymentRows = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, input.paymentId), eq(payments.schoolId, input.schoolId)))
    .for("update")
    .limit(1);
  const payment = paymentRows[0];
  if (!payment) {
    throw new FeeError("REFERENCE_NOT_FOUND", "Payment not found in this school.");
  }

  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, input.invoiceId), eq(invoices.schoolId, input.schoolId)))
    .limit(1);
  const invoice = invoiceRows[0];
  if (!invoice) {
    throw new FeeError("REFERENCE_NOT_FOUND", "Invoice not found in this school.");
  }

  const allocatedRows = await db
    .select({ total: sql<string>`coalesce(sum(${paymentAllocations.amountPaise}), 0)::bigint` })
    .from(paymentAllocations)
    .where(eq(paymentAllocations.paymentId, payment.id));
  const alreadyAllocated = Number(allocatedRows[0]?.total ?? 0);
  const unallocated = Number(payment.amountPaise) - alreadyAllocated;
  const outstanding = Number(invoice.totalPaise) - Number(invoice.paidPaise);

  const requested = input.amountPaise ?? Math.min(unallocated, outstanding);
  if (requested <= 0) {
    throw new FeeError(
      "NOTHING_TO_ALLOCATE",
      "No allocatable balance remains on the payment or the invoice.",
    );
  }
  if (requested > unallocated) {
    throw new FeeError(
      "OVER_ALLOCATED_PAYMENT",
      `Amount exceeds the payment's unallocated balance (${unallocated} paise).`,
    );
  }
  if (requested > outstanding) {
    throw new FeeError(
      "OVER_ALLOCATED_INVOICE",
      `Amount exceeds the invoice's outstanding balance (${outstanding} paise).`,
    );
  }

  const id = randomUUID();
  await db.insert(paymentAllocations).values([
    {
      id,
      schoolId: input.schoolId,
      paymentId: input.paymentId,
      invoiceId: input.invoiceId,
      amountPaise: requested,
    },
  ]);

  const newPaidPaise = Number(invoice.paidPaise) + requested;
  const newStatus = newPaidPaise >= Number(invoice.totalPaise) ? "paid" : "partial";
  await db
    .update(invoices)
    .set({ paidPaise: newPaidPaise, status: newStatus, updatedAt: new Date() })
    .where(eq(invoices.id, invoice.id));

  if (input.actorId) {
    await writeAudit({
      scope: "school",
      schoolId: input.schoolId,
      actorId: input.actorId,
      action: "payment.allocated",
      entityType: "payment_allocation",
      entityId: id,
      after: {
        paymentId: input.paymentId,
        invoiceId: input.invoiceId,
        amountPaise: requested,
        invoiceStatus: newStatus,
      },
    });
  }

  return {
    id,
    paymentId: input.paymentId,
    invoiceId: input.invoiceId,
    amountPaise: requested,
    invoicePaidPaise: newPaidPaise,
    invoiceStatus: newStatus,
  };
}

// Receipt operations
export async function createReceipt(paymentId: string, schoolId: string) {
  const paymentRows = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.schoolId, schoolId)))
    .limit(1);
  const payment = paymentRows[0];
  if (!payment) {
    throw new FeeError("REFERENCE_NOT_FOUND", "Payment not found in this school.");
  }

  const existing = await db
    .select({ id: receipts.id })
    .from(receipts)
    .where(eq(receipts.paymentId, paymentId))
    .limit(1);
  if (existing[0]) {
    throw new FeeError("RECEIPT_EXISTS", "A receipt already exists for this payment.");
  }

  // Gapless, school-scoped receipt number from document_sequences.
  const financialYear = getFinancialYear(new Date());
  const receiptNumber = await nextDocumentNumber(schoolId, "receipt", financialYear);

  const id = randomUUID();
  await db.insert(receipts).values({
    id,
    schoolId,
    paymentId,
    receiptNumber,
    financialYear,
    issuedAt: new Date(),
    objectPath: null,
  });

  // Fan out a receipt notification: worker consumes outbox and delivers to guardians.
  // Same tenant transaction — event and receipt commit or roll back together.
  await db.insert(outboxEvents).values({
    id: randomUUID(),
    schoolId,
    eventType: "fee.receipt_issued",
    aggregateType: "receipt",
    aggregateId: id,
    dedupeKey: `fee.receipt_issued:${id}`,
    payload: {
      receiptId: id,
      receiptNumber,
      paymentId,
      studentId: payment.studentId,
      amountPaise: payment.amountPaise,
      financialYear,
    },
  });

  return { id, receiptNumber, paymentId };
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

  await db.insert(creditNotes).values({
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
  schoolId: string;
  paymentId: string;
  amountPaise: number;
  status: string;
  approvedBy: string;
  gatewayRefundId?: string;
  actorId: string;
}

export async function createRefund(input: CreateRefundInput) {
  const paymentRows = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, input.paymentId), eq(payments.schoolId, input.schoolId)))
    .limit(1);
  const payment = paymentRows[0];
  if (!payment) {
    throw new FeeError("REFERENCE_NOT_FOUND", "Payment not found in this school.");
  }

  if (input.amountPaise <= 0) {
    throw new FeeError("INVALID_AMOUNT", "Refund amount must be positive.");
  }

  const priorRows = await db
    .select({ total: sql<string>`coalesce(sum(${refunds.amountPaise}), 0)::bigint` })
    .from(refunds)
    .where(eq(refunds.paymentId, input.paymentId));
  const alreadyRefunded = Number(priorRows[0]?.total ?? 0);
  if (alreadyRefunded + input.amountPaise > Number(payment.amountPaise)) {
    throw new FeeError(
      "REFUND_EXCEEDS_PAYMENT",
      `Refund exceeds the remaining refundable amount (${Number(payment.amountPaise) - alreadyRefunded} paise).`,
    );
  }

  const id = randomUUID();
  await db.insert(refunds).values({
    id,
    schoolId: input.schoolId,
    paymentId: input.paymentId,
    amountPaise: input.amountPaise,
    status: input.status,
    approvedBy: input.approvedBy,
    gatewayRefundId: input.gatewayRefundId,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "refund.created",
    entityType: "refund",
    entityId: id,
    after: { paymentId: input.paymentId, amountPaise: input.amountPaise },
  });

  return { id, paymentId: input.paymentId, amountPaise: input.amountPaise };
}

// List operations
export async function listConcessions(schoolId: string, studentId?: string) {
  const conditions = [eq(concessions.schoolId, schoolId)];
  if (studentId) conditions.push(eq(concessions.studentId, studentId));
  return db
    .select()
    .from(concessions)
    .where(and(...conditions))
    .orderBy(desc(concessions.createdAt));
}

export async function listCreditNotes(schoolId: string, studentId?: string) {
  const conditions = [eq(creditNotes.schoolId, schoolId)];
  if (studentId) conditions.push(eq(creditNotes.studentId, studentId));
  return db
    .select()
    .from(creditNotes)
    .where(and(...conditions))
    .orderBy(desc(creditNotes.createdAt));
}

export async function listRefunds(schoolId: string, paymentId?: string) {
  const conditions = [eq(refunds.schoolId, schoolId)];
  if (paymentId) conditions.push(eq(refunds.paymentId, paymentId));
  return db
    .select()
    .from(refunds)
    .where(and(...conditions))
    .orderBy(desc(refunds.createdAt));
}
