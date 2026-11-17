import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createReceipt, FeeError } from "@school-erp/fees";
import { z } from "zod";

const CreateReceiptSchema = z.object({
  paymentId: z.string().uuid(),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = CreateReceiptSchema.safeParse(body);
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
      const receipt = await createReceipt(parsed.data.paymentId, ctx.schoolId);
      return NextResponse.json(
        { data: receipt, meta: { request_id: crypto.randomUUID() } },
        { status: 201 },
      );
    } catch (err) {
      if (err instanceof FeeError) {
        const status =
          err.code === "REFERENCE_NOT_FOUND" ? 422 : err.code === "RECEIPT_EXISTS" ? 409 : 500;
        return NextResponse.json({ error: { code: err.code, message: err.message } }, { status });
      }
      throw err;
    }
  });
}
