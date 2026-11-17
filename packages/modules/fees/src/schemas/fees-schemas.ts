import { z } from "zod";

// Fee Head schemas
export const CreateFeeHeadSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  category: z.enum(["tuition", "transport", "library", "lab", "sports", "development", "other"]),
  isTaxable: z.boolean().default(false),
  actorId: z.string(),
});

export const UpdateFeeHeadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(50).optional(),
  category: z
    .enum(["tuition", "transport", "library", "lab", "sports", "development", "other"])
    .optional(),
  isTaxable: z.boolean().optional(),
});

export const FeeHeadResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  category: z.string(),
  isTaxable: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Fee Structure schemas
export const CreateFeeStructureSchema = z.object({
  schoolId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  classId: z.string().uuid(),
  name: z.string().min(1).max(200),
  status: z.enum(["draft", "active", "closed"]).default("draft"),
  actorId: z.string(),
});

export const FeeStructureLineSchema = z.object({
  feeHeadId: z.string().uuid(),
  amountPaise: z.number().int().min(0),
  frequency: z.enum(["monthly", "quarterly", "half_yearly", "yearly"]),
  dueRule: z.enum(["immediate", "30_days", "15_days_before", "7_days_before"]),
});

export const CreateFeeStructureSchemaWithLines = CreateFeeStructureSchema.extend({
  feeStructureLines: FeeStructureLineSchema.array(),
});

export const UpdateFeeStructureSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(["draft", "active", "closed"]).optional(),
});

export const FeeStructureResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  classId: z.string().uuid(),
  name: z.string(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Fee Assignment schemas
export const CreateFeeAssignmentSchema = z.object({
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  feeStructureId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  effectiveFrom: z.string().datetime(),
  actorId: z.string(),
});

export const FeeAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  feeStructureId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  effectiveFrom: z.date(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Concession schemas
export const CreateConcessionSchema = z.object({
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  feeHeadId: z.string().uuid(),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().int().min(0),
  reason: z.string().min(1).max(500),
  approvedBy: z.string(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().optional(),
});

export const UpdateConcessionSchema = z.object({
  value: z.number().int().min(0).optional(),
  reason: z.string().min(1).max(500).optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  status: z.string().optional(),
});

export const ConcessionResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  feeHeadId: z.string().uuid(),
  type: z.string(),
  value: z.number(),
  reason: z.string(),
  status: z.string(),
  approvedBy: z.string(),
  validFrom: z.date(),
  validTo: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Invoice schemas
export const CreateInvoiceSchema = z.object({
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  financialYear: z.string().min(1).max(10),
  invoiceNumber: z.string().min(1).max(50),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  status: z.enum(["draft", "issued", "partial", "paid", "overdue", "cancelled"]).default("draft"),
  actorId: z.string(),
});

export const InvoiceLineSchema = z.object({
  feeHeadId: z.string().uuid(),
  amountPaise: z.number().int().min(0),
  concessionPaise: z.number().int().min(0),
  netPaise: z.number().int().min(0),
});

export const CreateInvoiceSchemaWithLines = CreateInvoiceSchema.extend({
  invoiceLines: InvoiceLineSchema.array(),
});

export const UpdateInvoiceSchema = z.object({
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(["draft", "issued", "partial", "paid", "overdue", "cancelled"]).optional(),
});

export const InvoiceResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  financialYear: z.string(),
  invoiceNumber: z.string(),
  issueDate: z.date(),
  dueDate: z.date(),
  totalPaise: z.number(),
  paidPaise: z.number(),
  status: z.string(),
  actorId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Payment schemas
export const CreatePaymentSchema = z.object({
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  amountPaise: z.number().int().min(0),
  mode: z.enum(["upi", "card", "cash", "cheque", "bank_transfer"]),
  status: z.enum(["pending", "captured", "failed", "refunded"]).default("pending"),
  gateway: z.string().optional(),
  gatewayPaymentId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  receivedAt: z.string().datetime().optional(),
  actorId: z.string(),
});

export const PaymentAllocationSchema = z.object({
  paymentId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amountPaise: z.number().int().min(0),
});

export const PaymentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  amountPaise: z.number(),
  mode: z.string(),
  status: z.string(),
  gateway: z.string().nullable(),
  gatewayPaymentId: z.string().nullable(),
  receivedAt: z.date().nullable(),
  createdAt: z.date(),
});

// Receipt schemas
export const ReceiptResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  paymentId: z.string().uuid(),
  receiptNumber: z.string(),
  financialYear: z.string(),
  issuedAt: z.date(),
  objectPath: z.string(),
  createdAt: z.date(),
});
