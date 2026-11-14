import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { recordPayment } from "@school-erp/fees";
import { z } from "zod";

const RecordPaymentSchema = z.object({
  studentId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  mode: z.enum(["cash", "cheque", "dd", "upi", "card", "netbanking", "bank_transfer"]),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = RecordPaymentSchema.safeParse(body);
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
    const result = await recordPayment({
      schoolId: ctx.schoolId,
      studentId: parsed.data.studentId,
      invoiceId: parsed.data.invoiceId,
      amountPaise: parsed.data.amountPaise,
      mode: parsed.data.mode,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: result, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
