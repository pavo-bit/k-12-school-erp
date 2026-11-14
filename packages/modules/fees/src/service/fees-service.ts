import {
  db,
  feeHeads,
  feeStructures,
  feeStructureLines,
  invoices,
  invoiceLines,
  payments,
  paymentAllocations,
  receipts,
} from "@school-erp/db";
import { eq, and, sql } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

function financialYear(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-based
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

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
    after: { name: input.name, code: input.code },
  });
  return { id, name: input.name, code: input.code };
}

export async function listFeeHeads(schoolId: string) {
  return db.select().from(feeHeads).where(eq(feeHeads.schoolId, schoolId));
}

export interface CreateFeeStructureInput {
  schoolId: string;
  academicYearId: string;
  classId: string;
  name: string;
  lines: { feeHeadId: string; amountPaise: number; frequency: string }[];
  actorId: string;
}

export async function createFeeStructure(input: CreateFeeStructureInput) {
  const id = randomUUID();
  await db.insert(feeStructures).values({
    id,
    schoolId: input.schoolId,
    academicYearId: input.academicYearId,
    classId: input.classId,
    name: input.name,
    status: "active",
  });
  for (const line of input.lines) {
    await db.insert(feeStructureLines).values({
      id: randomUUID(),
      schoolId: input.schoolId,
      feeStructureId: id,
      feeHeadId: line.feeHeadId,
      amountPaise: line.amountPaise,
      frequency: line.frequency,
    });
  }
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "fee_structure.created",
    entityType: "fee_structure",
    entityId: id,
    after: { name: input.name, lines: input.lines.length },
  });
  return { id, name: input.name };
}

export async function listFeeStructures(schoolId: string) {
  return db.select().from(feeStructures).where(eq(feeStructures.schoolId, schoolId));
}

export interface GenerateInvoiceInput {
  schoolId: string;
  studentId: string;
  academicYearId: string;
  feeStructureId: string;
  actorId: string;
}

export async function generateInvoice(input: GenerateInvoiceInput) {
  const lines = await db
    .select()
    .from(feeStructureLines)
    .where(eq(feeStructureLines.feeStructureId, input.feeStructureId));
  let total = 0;
  const invoiceLinesData = lines.map((l) => {
    total += l.amountPaise;
    return {
      feeHeadId: l.feeHeadId,
      amountPaise: l.amountPaise,
      concessionPaise: 0,
      netPaise: l.amountPaise,
    };
  });

  const now = new Date();
  const fy = financialYear(now);
  const invoiceNumber = await allocateDocumentNumber(input.schoolId, "invoice", fy);
  const id = randomUUID();

  await db.insert(invoices).values({
    id,
    schoolId: input.schoolId,
    studentId: input.studentId,
    academicYearId: input.academicYearId,
    financialYear: fy,
    invoiceNumber,
    issueDate: now.toISOString().slice(0, 10),
    dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: "issued",
    totalPaise: total,
    paidPaise: 0,
    version: 1,
  });

  for (const line of invoiceLinesData) {
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
    action: "invoice.generated",
    entityType: "invoice",
    entityId: id,
    after: { invoiceNumber, totalPaise: total },
  });
  return { id, invoiceNumber, totalPaise: total, financialYear: fy };
}

export interface RecordPaymentInput {
  schoolId: string;
  studentId: string;
  invoiceId: string;
  amountPaise: number;
  mode: string;
  actorId: string;
}

export async function recordPayment(input: RecordPaymentInput) {
  const paymentId = randomUUID();
  await db.insert(payments).values({
    id: paymentId,
    schoolId: input.schoolId,
    studentId: input.studentId,
    amountPaise: input.amountPaise,
    mode: input.mode,
    status: "recorded",
    receivedAt: new Date(),
  });

  await db.insert(paymentAllocations).values({
    id: randomUUID(),
    schoolId: input.schoolId,
    paymentId,
    invoiceId: input.invoiceId,
    amountPaise: input.amountPaise,
  });

  // Update invoice paid amount
  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, input.invoiceId))
    .limit(1);
  const invoice = invoiceRows[0];
  if (invoice) {
    const newPaid = invoice.paidPaise + input.amountPaise;
    const newStatus = newPaid >= invoice.totalPaise ? "paid" : "partially_paid";
    await db
      .update(invoices)
      .set({
        paidPaise: newPaid,
        status: newStatus,
        updatedAt: new Date(),
        version: invoice.version + 1,
      })
      .where(eq(invoices.id, input.invoiceId));
  }

  // Generate receipt
  const fy = financialYear(new Date());
  const receiptNumber = await allocateDocumentNumber(input.schoolId, "receipt", fy);
  const receiptId = randomUUID();
  await db.insert(receipts).values({
    id: receiptId,
    schoolId: input.schoolId,
    paymentId,
    receiptNumber,
    financialYear: fy,
    issuedAt: new Date(),
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "payment.recorded",
    entityType: "payment",
    entityId: paymentId,
    after: { amountPaise: input.amountPaise, invoiceId: input.invoiceId, receiptNumber },
  });
  return { paymentId, receiptId, receiptNumber, amountPaise: input.amountPaise };
}

export async function listInvoices(schoolId: string, studentId?: string) {
  if (studentId) {
    return db
      .select()
      .from(invoices)
      .where(and(eq(invoices.schoolId, schoolId), eq(invoices.studentId, studentId)));
  }
  return db.select().from(invoices).where(eq(invoices.schoolId, schoolId));
}

async function allocateDocumentNumber(schoolId: string, type: string, fy: string): Promise<string> {
  // Atomic upsert/increment
  const result = await db.execute(sql`
    INSERT INTO document_sequences (id, school_id, document_type, financial_year, next_value, prefix, padding)
    VALUES (gen_random_uuid(), ${schoolId}, ${type}, ${fy}, 2, ${type === "invoice" ? "INV" : "RCP"}, '6')
    ON CONFLICT (school_id, document_type, financial_year)
    DO UPDATE SET next_value = document_sequences.next_value + 1
    RETURNING next_value - 1 AS used_value, prefix, padding
  `);
  const rows =
    (result as unknown as { rows?: Array<Record<string, unknown>> }).rows ??
    (result as unknown as Array<Record<string, unknown>>);
  const row = rows?.[0];
  if (!row) throw new Error("document sequence allocation failed");
  const used = row.used_value as number;
  const prefix = String(row.prefix);
  const padding = parseInt(String(row.padding), 10);
  return `${prefix}-${String(used).padStart(padding, "0")}`;
}
