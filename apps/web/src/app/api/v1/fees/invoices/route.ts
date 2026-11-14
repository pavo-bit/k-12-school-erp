import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { generateInvoice, listInvoices } from "@school-erp/fees";
import { z } from "zod";

const GenerateInvoiceSchema = z.object({
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  feeStructureId: z.string().uuid(),
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
    const invoices = await listInvoices(ctx.schoolId, studentId);
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
    const parsed = GenerateInvoiceSchema.safeParse(body);
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
    const invoice = await generateInvoice({
      schoolId: ctx.schoolId,
      studentId: parsed.data.studentId,
      academicYearId: parsed.data.academicYearId,
      feeStructureId: parsed.data.feeStructureId,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: invoice, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
