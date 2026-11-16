import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createRefund } from "@school-erp/fees";
import { z } from "zod";

const CreateRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  status: z.enum(["pending", "approved", "processed", "rejected"]).optional(),
  gatewayRefundId: z.string().optional(),
});

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
    const refund = await createRefund({
      paymentId: parsed.data.paymentId,
      amountPaise: parsed.data.amountPaise,
      status: parsed.data.status ?? "pending",
      approvedBy: ctx.userId,
      gatewayRefundId: parsed.data.gatewayRefundId,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: refund, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
