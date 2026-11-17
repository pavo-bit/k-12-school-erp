import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createPaymentAllocation, FeeError } from "@school-erp/fees";
import { z } from "zod";

const AllocateSchema = z.object({
  paymentId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amountPaise: z.number().int().positive().optional(),
});

function mapFeeError(err: unknown) {
  if (err instanceof FeeError) {
    if (err.code.startsWith("OVER_") || err.code.startsWith("NOTHING_")) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: 409 },
      );
    }
    if (err.code === "REFERENCE_NOT_FOUND") {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: 422 },
      );
    }
    if (err.code === "INVALID_TOTAL" || err.code === "INVALID_AMOUNT") {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: 422 },
      );
    }
  }
  throw err;
}

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = AllocateSchema.safeParse(body);
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
      const input: Parameters<typeof createPaymentAllocation>[0] = {
        schoolId: ctx.schoolId,
        paymentId: parsed.data.paymentId,
        invoiceId: parsed.data.invoiceId,
        actorId: ctx.userId,
      };
      if (parsed.data.amountPaise !== undefined) input.amountPaise = parsed.data.amountPaise;
      const result = await createPaymentAllocation(input);
      return NextResponse.json(
        { data: result, meta: { request_id: crypto.randomUUID() } },
        { status: 201 },
      );
    } catch (err) {
      return mapFeeError(err);
    }
  });
}
