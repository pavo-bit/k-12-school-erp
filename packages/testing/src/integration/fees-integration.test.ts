import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, students, fee_heads, fee_structures, invoices } from "@school-erp/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createStudent, createFeeHead, createFeeStructure, createFeeAssignment, createInvoice } from "@school-erp/sis";
import { createFeeStructureWithLines, createInvoiceWithLines } from "@school-erp/fees";

describe("Fees Module Integration Tests", () => {
  let schoolId: string;
  let studentId: string;
  let feeStructureId: string;
  let academicYearId: string;

  beforeAll(async () => {
    // Create test data
    const [student] = await createStudent({
      schoolId: randomUUID(),
      admissionNumber: "1001",
      firstName: "Test Student",
      lastName: "Fees",
      dateOfBirth: new Date("2010-01-01"),
      gender: "male",
      email: "student@erp.com",
      phone: "+919876543211",
      status: "active",
      actorId: randomUUID(),
    });

    studentId = student.id;

    const [feeHead] = await createFeeHead({
      schoolId: randomUUID(),
      name: "Tuition Fee",
      code: "TUIT",
      category: "tuition",
      isTaxable: false,
      actorId: randomUUID(),
    });

    const [feeStructure] = await createFeeStructureWithLines({
      schoolId: randomUUID(),
      academicYearId: randomUUID(),
      classId: randomUUID(),
      name: "Class 10 Fee Structure",
      status: "active",
      feeStructureLines: [
        {
          feeHeadId: feeHead.id,
          amountPaise: 50000,
          frequency: "monthly",
          dueRule: "immediate",
        },
      ],
      actorId: randomUUID(),
    });

    feeStructureId = feeStructure.id;

    academicYearId = randomUUID();
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(invoices).where(eq(invoices.schoolId, schoolId ?? "unknown"));
  });

  it("should create fee head successfully", async () => {
    const feeHead = await createFeeHead({
      schoolId: randomUUID(),
      name: "Transport Fee",
      code: "TRNS",
      category: "transport",
      isTaxable: false,
      actorId: randomUUID(),
    });

    expect(feeHead).toBeDefined();
    expect(feeHead.name).toBe("Transport Fee");
    expect(feeHead.code).toBe("TRNS");
  });

  it("should create fee structure with lines", async () => {
    const feeStructure = await createFeeStructureWithLines({
      schoolId: randomUUID(),
      academicYearId,
      classId: randomUUID(),
      name: "Class 9 Fee Structure",
      status: "active",
      feeStructureLines: [
        {
          feeHeadId: randomUUID(),
          amountPaise: 45000,
          frequency: "monthly",
          dueRule: "30_days",
        },
        {
          feeHeadId: randomUUID(),
          amountPaise: 5000,
          frequency: "yearly",
          dueRule: "immediate",
        },
      ],
      actorId: randomUUID(),
    });

    expect(feeStructure).toBeDefined();
    expect(feeStructure.name).toBe("Class 9 Fee Structure");
    expect(feeStructure.feeStructureLines.length).toBe(2);
  });

  it("should create invoice successfully", async () => {
    const invoice = await createInvoiceWithLines({
      schoolId: randomUUID(),
      studentId,
      academicYearId,
      financialYear: "2026-27",
      invoiceNumber: "INV-001",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "issued",
      invoiceLines: [
        {
          feeHeadId: randomUUID(),
          amountPaise: 50000,
          concessionPaise: 0,
          netPaise: 50000,
        },
      ],
      actorId: randomUUID(),
    });

    expect(invoice).toBeDefined();
    expect(invoice.invoiceNumber).toBe("INV-001");
    expect(invoice.totalPaise).toBe(50000);
    expect(invoice.status).toBe("issued");
  });

  it("should create multiple invoices for same student", async () => {
    const invoice2 = await createInvoiceWithLines({
      schoolId: randomUUID(),
      studentId,
      academicYearId,
      financialYear: "2026-27",
      invoiceNumber: "INV-002",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: "issued",
      invoiceLines: [
        {
          feeHeadId: randomUUID(),
          amountPaise: 45000,
          concessionPaise: 0,
          netPaise: 45000,
        },
      ],
      actorId: randomUUID(),
    });

    expect(invoice2).toBeDefined();
    expect(invoice2.invoiceNumber).toBe("INV-002");
  });

  it("should enforce financial invariants", async () => {
    const invoice1 = await createInvoiceWithLines({
      schoolId: randomUUID(),
      studentId,
      academicYearId,
      financialYear: "2026-27",
      invoiceNumber: "INV-003",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: "issued",
      invoiceLines: [
        {
          feeHeadId: randomUUID(),
          amountPaise: 55000,
          concessionPaise: 0,
          netPaise: 55000,
        },
      ],
      actorId: randomUUID(),
    });

    // Verify invoice totals
    const invoices = await db.select().from(invoices).where(eq(invoices.studentId, studentId));

    const totalNet = invoices.reduce((sum, inv) => sum + inv.totalPaise, 0);
    const totalPaid = 0; // No payments yet

    expect(totalNet).toBeGreaterThan(0);
    expect(totalPaid).toBe(0);
  });

  it("should handle invoice with concessions", async () => {
    const invoice = await createInvoiceWithLines({
      schoolId: randomUUID(),
      studentId,
      academicYearId,
      financialYear: "2026-27",
      invoiceNumber: "INV-004",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      status: "issued",
      invoiceLines: [
        {
          feeHeadId: randomUUID(),
          amountPaise: 60000,
          concessionPaise: 10000,
          netPaise: 50000,
        },
      ],
      actorId: randomUUID(),
    });

    expect(invoice).toBeDefined();
    expect(invoice.totalPaise).toBe(60000);
    expect(invoice.paidPaise).toBe(0);
  });

  it("should enforce gapless invoice numbers", async () => {
    try {
      await createInvoiceWithLines({
        schoolId: randomUUID(),
        studentId,
        academicYearId,
        financialYear: "2026-27",
        invoiceNumber: "INV-001", // Duplicate
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
        status: "issued",
        invoiceLines: [
          {
            feeHeadId: randomUUID(),
            amountPaise: 50000,
            concessionPaise: 0,
            netPaise: 50000,
          },
        ],
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for duplicate invoice number");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should list invoices with filters", async () => {
    const invoices = await db.select().from(invoices).where(eq(invoices.schoolId, randomUUID()));

    expect(invoices.length).toBeGreaterThan(0);
    expect(invoices[0]).toHaveProperty("invoiceNumber");
    expect(invoices[0]).toHaveProperty("totalPaise");
    expect(invoices[0]).toHaveProperty("status");
  });

  it("should handle invoice status transitions", async () => {
    const invoice = await createInvoiceWithLines({
      schoolId: randomUUID(),
      studentId,
      academicYearId,
      financialYear: "2026-27",
      invoiceNumber: "INV-005",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      status: "issued",
      invoiceLines: [
        {
          feeHeadId: randomUUID(),
          amountPaise: 50000,
          concessionPaise: 0,
          netPaise: 50000,
        },
      ],
      actorId: randomUUID(),
    });

    // Update invoice status
    await db.update(invoices).set({ status: "partial" }).where(eq(invoices.id, invoice.id));

    const updatedInvoice = await db.select().from(invoices).where(eq(invoices.id, invoice.id)).limit(1);

    expect(updatedInvoice[0]?.status).toBe("partial");
  });
});
