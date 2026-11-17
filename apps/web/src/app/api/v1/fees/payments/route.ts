import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createPayment, listPayments } from "@school-erp/fees";
import { z } from "zod";

const RecordPaymentSchema = z.object({
  studentId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  mode: z.enum(["cash", "cheque", "dd", "upi", "card", "netbanking", "bank_transfer"]),
  /** Client-supplied idempotency key (safe retry). Unique per school. */
  idempotencyKey: z.string().min(8).max(200).optional(),
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
    const payments = await listPayments(ctx.schoolId, studentId);
    return NextResponse.json({ data: payments, meta: { request_id: crypto.randomUUID() } });
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
    const paymentInput: Parameters<typeof createPayment>[0] = {
      schoolId: ctx.schoolId,
      studentId: parsed.data.studentId,
      amountPaise: parsed.data.amountPaise,
      mode: parsed.data.mode,
      status: "completed",
      actorId: ctx.userId,
    };
    if (parsed.data.idempotencyKey) paymentInput.idempotencyKey = parsed.data.idempotencyKey;
    const result = await createPayment(paymentInput);
    const duplicate = "duplicate" in result && result.duplicate === true;
    return NextResponse.json(
      { data: result, meta: { request_id: crypto.randomUUID() } },
      { status: duplicate ? 200 : 201 },
    );
  });
}
