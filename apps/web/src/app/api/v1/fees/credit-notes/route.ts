import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { listCreditNotes, createCreditNote } from "@school-erp/fees";
import { z } from "zod";

const CreateCreditNoteSchema = z.object({
  studentId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  reason: z.string().min(1).max(400),
  status: z.enum(["issued", "applied", "cancelled"]).default("issued"),
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
    const notes = await listCreditNotes(ctx.schoolId, studentId);
    return NextResponse.json({ data: notes, meta: { request_id: crypto.randomUUID() } });
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
    const note = await createCreditNote({
      schoolId: ctx.schoolId,
      ...parsed.data,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: note, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
