import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createInvoice, listInvoices } from "@school-erp/fees";
import { z } from "zod";

const CreateInvoiceSchema = z.object({
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  financialYear: z.string().min(1).max(20),
  invoiceNumber: z.string().min(1).max(50),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  status: z.enum(["draft", "issued", "partial", "paid", "overdue", "cancelled"]).optional(),
  invoiceLines: z
    .array(
      z.object({
        feeHeadId: z.string().uuid(),
        amountPaise: z.number().int().min(0),
        concessionPaise: z.number().int().min(0),
        netPaise: z.number().int().min(0),
      }),
    )
    .min(1),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const invoices = await listInvoices(ctx.schoolId, studentId, status);
    return NextResponse.json({ data: invoices, meta: { request_id: crypto.randomUUID() } });
  });
}

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = CreateInvoiceSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input.",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    const invoice = await createInvoice({
      schoolId: ctx.schoolId,
      studentId: parsed.data.studentId,
      academicYearId: parsed.data.academicYearId,
      financialYear: parsed.data.financialYear,
      invoiceNumber: parsed.data.invoiceNumber,
      issueDate: new Date(parsed.data.issueDate),
      dueDate: new Date(parsed.data.dueDate),
      status: parsed.data.status ?? "issued",
      invoiceLines: parsed.data.invoiceLines,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: invoice, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
