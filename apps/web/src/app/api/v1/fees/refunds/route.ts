import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { listRefunds, createRefund, FeeError } from "@school-erp/fees";
import { z } from "zod";

const CreateRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  status: z.enum(["pending", "approved", "processed", "rejected"]).default("pending"),
  gatewayRefundId: z.string().max(120).optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const paymentId = url.searchParams.get("paymentId") ?? undefined;
    const refunds = await listRefunds(ctx.schoolId, paymentId);
    return NextResponse.json({ data: refunds, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateRefundSchema.safeParse(body);
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
    try {
      const refundInput: Parameters<typeof createRefund>[0] = {
        schoolId: ctx.schoolId,
        paymentId: parsed.data.paymentId,
        amountPaise: parsed.data.amountPaise,
        status: parsed.data.status,
        approvedBy: ctx.userId,
        actorId: ctx.userId,
      };
      if (parsed.data.gatewayRefundId) refundInput.gatewayRefundId = parsed.data.gatewayRefundId;
      const refund = await createRefund(refundInput);
      return NextResponse.json(
        { data: refund, meta: { request_id: crypto.randomUUID() } },
        { status: 201 },
      );
    } catch (err) {
      if (err instanceof FeeError) {
        const status =
          err.code === "REFERENCE_NOT_FOUND"
            ? 422
            : err.code === "REFUND_EXCEEDS_PAYMENT" || err.code === "INVALID_AMOUNT"
              ? 409
              : 500;
        return NextResponse.json({ error: { code: err.code, message: err.message } }, { status });
      }
      throw err;
    }
  });
}
