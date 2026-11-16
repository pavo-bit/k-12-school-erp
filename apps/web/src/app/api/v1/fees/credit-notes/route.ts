import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createCreditNote } from "@school-erp/fees";
import { z } from "zod";

const CreateCreditNoteSchema = z.object({
  studentId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  reason: z.string().min(1).max(500),
  status: z.enum(["draft", "issued", "applied"]).optional(),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = CreateCreditNoteSchema.safeParse(body);
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
    const creditNote = await createCreditNote({
      schoolId: ctx.schoolId,
      studentId: parsed.data.studentId,
      amountPaise: parsed.data.amountPaise,
      reason: parsed.data.reason,
      status: parsed.data.status ?? "draft",
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: creditNote, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
