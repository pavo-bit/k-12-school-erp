import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createFeeHead, listFeeHeads } from "@school-erp/fees";
import { z } from "zod";

const CreateFeeHeadSchema = z.object({
  name: z.string().min(1).max(80),
  code: z.string().min(1).max(20),
  category: z.string().default("tuition"),
  isTaxable: z.boolean().default(false),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const heads = await listFeeHeads(ctx.schoolId);
    return NextResponse.json({ data: heads, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateFeeHeadSchema.safeParse(body);
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
    const head = await createFeeHead({
      schoolId: ctx.schoolId,
      name: parsed.data.name,
      code: parsed.data.code,
      category: parsed.data.category,
      isTaxable: parsed.data.isTaxable,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: head, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
